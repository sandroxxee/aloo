import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';

import { Boom } from '@hapi/boom';
import { fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';

export let isConnectingFlag = false;
export let wss: WebSocketServer | null = null;
export function setWss(instance: WebSocketServer) { wss = instance; }
export let reconnectTimer: NodeJS.Timeout | null = null;
export let consecutiveFailures = 0;
export let isManualLogout = fs.existsSync(path.join(process.cwd(), 'whatsapp_logged_out.flag'));
export let serverBotEnabled = false;

// Priority Settings for incoming messages
export let prioritySettings = {
  newLeads: true,
  questions: true,
  appointments: true,
  objections: false,
  smartDelay: 5 // Default 5 seconds
};

export let serverBotLogs: any[] = [];
export let isWatchdogEnabled = true;
export let watchdogIntervalMs = 60000;
export let lastWatchdogCheck: string | null = null;

const logger = pino({ level: 'silent' }) as any;

let botResponseProvider: (phone: string, msg: string) => Promise<string> = async () => '';

export function registerBotResponseProvider(provider: typeof botResponseProvider) {
  botResponseProvider = provider;
}

export async function generateServerBotResponse(phone: string, msg: string) {
  return await botResponseProvider(phone, msg);
}

let watchdogTimer: NodeJS.Timeout | null = null;
export function startBackgroundWatchdog() {
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = setInterval(async () => {
    if (!isWatchdogEnabled) return;
    
    // Check if we even have a saved session. If not, do not try to auto-reconnect or watchdog check!
    const hasSession = fs.existsSync(path.join(process.cwd(), 'auth_info_baileys', 'creds.json'));
    if (!hasSession) {
      return;
    }

    lastWatchdogCheck = new Date().toLocaleTimeString('pt-BR');
    
    // Check if WhatsApp disconnected unexpectedly
    if (connectionStatus === 'close' || connectionStatus === 'refused') {
      if (!isManualLogout && !isConnectingFlag) {
        logWhatsapp('🧠 [Watchdog em 2º Plano] Conexão inativa detectada em segundo plano. Tentando reconectar automaticamente...');
        
        // Auto-heal on high failures
        if (consecutiveFailures >= 5) {
          logWhatsapp('🧠 [Watchdog em 2º Plano] Falhas consecutivas elevadas (>=5). Limpando credenciais de sessão corrompida.');
          const authPath = path.join(process.cwd(), 'auth_info_baileys');
          if (fs.existsSync(authPath)) {
            try { fs.rmSync(authPath, { recursive: true, force: true }); } catch (e) {}
          }
          consecutiveFailures = 0;
          return; // Stop here since session was cleared, wait for user to re-authenticate
        }
        
        connectToWhatsApp().catch(err => {
          logWhatsapp(`⚠️ [Watchdog] Erro ao reconectar em background: ${err.message || err}`);
        });
      }
    } else if (connectionStatus === 'open' && sock) {
      // Check if websocket is physically open
      if (!sock.ws || sock.ws.readyState !== 1) {
        logWhatsapp('🧠 [Watchdog em 2º Plano] Sessão marcada como OPEN, mas WebSocket está fechado ou corrompido. Reconectando...');
        if (sock.ws) {
          try { sock.ws.close(); } catch (e) {}
        }
        sock = null;
        connectionStatus = 'close';
        connectToWhatsApp().catch(() => {});
      }
    }
  }, watchdogIntervalMs);
}

import { getAiClient } from './aiService.js';


export let sock: any = null;
export let qrCodeData: string | null = null;
export let connectionStatus: 'connecting' | 'open' | 'close' | 'refused' = 'close';
export let connectionError: string | null = null;
export let whatsappLogs: string[] = [];

export function initWebSocket(server: any) {
  wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'log', message: 'Conectado ao servidor WebSocket.' }));
  });
}

export function broadcastLog(msg: string) {
  if (wss) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'log', message: msg }));
      }
    });
  }
}

export function broadcastEvent(event: { type: string; [key: string]: any }) {
  if (wss) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    });
  }
}

export function logWhatsapp(msg: string) {
  const formatted = `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`;
  console.log(formatted);
  whatsappLogs.push(formatted);
  if (whatsappLogs.length > 50) {
    whatsappLogs.shift();
  }
  broadcastLog(formatted);
}

import express from 'express';

// 🧠 Intelligent Humanized Anti-Ban Delay Function
function getSmartHumanDelay(messagesSentCount: number): number {
  // Base organic delay: 2.2 to 4.5 seconds
  const baseDelay = 2200 + Math.random() * 2300;
  
  // Progressive backoff: as more messages are sent in the session, increase cooldown slightly to prevent spam fingerprinting
  const progressiveFactor = Math.min(messagesSentCount * 180, 18000);
  
  // Periodic human micro-break: every 10 messages, simulate a longer breather (reading/typing break: 8 to 16 seconds)
  let breakBonus = 0;
  if (messagesSentCount > 0 && messagesSentCount % 10 === 0) {
    breakBonus = 8000 + Math.random() * 8000;
    logWhatsapp(`☕ [Anti-Ban Humanizado] Pausa estratégica realizada após ${messagesSentCount} envios consecutivos (${Math.round(breakBonus / 1000)}s)...`);
  }

  const totalDelay = baseDelay + progressiveFactor + breakBonus;
  return Math.round(totalDelay);
}

let totalMessagesSent = 0;
let lastQueueProcessTime: string | null = null;
let lastActivityTimestamp = Date.now();
let idleTimeoutMinutes = 120; // configurable idle timeout in minutes (0 = disabled)
const messageDispatchQueue: Array<{
  phone: string;
  message: string;
  mediaUrl?: string;
  audioBuffer?: Buffer;
  buttons?: Array<{ id: string; text: string }>;
  simulateTyping?: boolean;
  typingDelay?: number;
  priority?: 'high' | 'normal';
  gatewayConfig?: any;
  resolve: (val: any) => void;
  reject: (err: any) => void;
}> = [];

let isQueueProcessing = false;

// 💤 Idle Cleanup Cron (runs every 3 minutes): Checks for sockets unused for > idleTimeoutMinutes and performs graceful shutdown
setInterval(() => {
  if (idleTimeoutMinutes <= 0) return;
  if (sock && connectionStatus === 'open' && messageDispatchQueue.length === 0) {
    const idleTimeMs = Date.now() - lastActivityTimestamp;
    const timeoutMs = idleTimeoutMinutes * 60 * 1000;
    if (idleTimeMs > timeoutMs) {
      logWhatsapp(`💤 [Idle Cleanup Cron] Socket do WhatsApp ocioso por mais de ${idleTimeoutMinutes} minutos. Executando graceful shutdown para liberar memória RAM...`);
      try {
        if (sock && sock.ws) {
          sock.ws.close();
        }
      } catch (e) {}
      sock = null;
      (globalThis as any).whatsappSock = null;
      connectionStatus = 'close';
      logWhatsapp('✅ [Idle Cleanup Cron] Graceful shutdown concluído. Instância desconectada e RAM liberada.');
    }
  }
}, 3 * 60 * 1000);

// Map to cache resolved LIDs in-memory to prevent redundant network calls
export const lidCache = new Map<string, string>();

/**
 * Resolve phone number to its proper JID/LID using whatsappNumbers first, then falling back to standard methods.
 * "verifique whatsappNumbers primeiro, salve lid, envie no lid"
 */
export async function resolveLid(phone: string): Promise<string> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return `${phone}@s.whatsapp.net`;

  if (lidCache.has(cleanPhone)) {
    return lidCache.get(cleanPhone)!;
  }

  const defaultJid = `${cleanPhone}@s.whatsapp.net`;

  if (sock && connectionStatus === 'open') {
    try {
      // 1. Try whatsappNumbers check if available on Baileys socket
      if (typeof sock.whatsappNumbers === 'function') {
        const res = await sock.whatsappNumbers([cleanPhone]);
        if (res && res.length > 0 && res[0].jid) {
          const resolvedJid = res[0].jid;
          logWhatsapp(`[LID Resolver] Resolvido via whatsappNumbers: ${cleanPhone} -> ${resolvedJid}`);
          lidCache.set(cleanPhone, resolvedJid);
          return resolvedJid;
        }
      }

      // 2. Fallback to onWhatsApp
      const res = await sock.onWhatsApp(cleanPhone);
      if (res && res.length > 0 && res[0].exists && res[0].jid) {
        const resolvedJid = res[0].jid;
        logWhatsapp(`[LID Resolver] Resolvido via onWhatsApp: ${cleanPhone} -> ${resolvedJid}`);
        lidCache.set(cleanPhone, resolvedJid);
        return resolvedJid;
      }

      // 3. Try with/without 9-digit backup
      if (cleanPhone.length === 13 && cleanPhone.charAt(4) === '9') {
        const backupPhone = cleanPhone.slice(0, 4) + cleanPhone.slice(5);
        if (typeof sock.whatsappNumbers === 'function') {
          const resBackup = await sock.whatsappNumbers([backupPhone]);
          if (resBackup && resBackup.length > 0 && resBackup[0].jid) {
            const resolvedJid = resBackup[0].jid;
            logWhatsapp(`[LID Resolver] Resolvido backup via whatsappNumbers: ${backupPhone} -> ${resolvedJid}`);
            lidCache.set(cleanPhone, resolvedJid);
            return resolvedJid;
          }
        }
        const resBackup = await sock.onWhatsApp(backupPhone);
        if (resBackup && resBackup.length > 0 && resBackup[0].exists && resBackup[0].jid) {
          const resolvedJid = resBackup[0].jid;
          logWhatsapp(`[LID Resolver] Resolvido backup via onWhatsApp: ${backupPhone} -> ${resolvedJid}`);
          lidCache.set(cleanPhone, resolvedJid);
          return resolvedJid;
        }
      }
    } catch (e: any) {
      logWhatsapp(`⚠️ [LID Resolver] Erro ao resolver LID para ${cleanPhone}: ${e?.message || e}`);
    }
  }

  return defaultJid;
}

export async function processMessageQueue() {
  if (isQueueProcessing || messageDispatchQueue.length === 0) return;
  isQueueProcessing = true;
  lastQueueProcessTime = new Date().toLocaleTimeString('pt-BR');
  lastActivityTimestamp = Date.now();

  while (messageDispatchQueue.length > 0) {
    // ⚡ Prioritization: Always pick 'high' priority first
    messageDispatchQueue.sort((a, b) => {
      const pA = a.priority === 'high' ? 0 : 1;
      const pB = b.priority === 'high' ? 0 : 1;
      return pA - pB;
    });

    const nextItem = messageDispatchQueue[0];
    // ⚡ Lazy-Load Connection: Only initialize Baileys if we are actually using it
    const isUsingNative = !nextItem.gatewayConfig || nextItem.gatewayConfig.type === 'native' || (nextItem.gatewayConfig.type === 'simulation' && !nextItem.gatewayConfig.active);
    
    if (isUsingNative && (!sock || connectionStatus !== 'open')) {
      const hasSession = fs.existsSync(path.join(process.cwd(), 'auth_info_baileys', 'creds.json'));
      if (!hasSession) {
        logWhatsapp('❌ [Lazy-Load Pool] Envio nativo falhou: nenhuma sessão WhatsApp ativa salva.');
        const failedItem = messageDispatchQueue.shift();
        if (failedItem) {
          failedItem.reject(new Error('Nenhuma sessão ativa do WhatsApp. Por favor, conecte o WhatsApp Web primeiro.'));
        }
        continue;
      }

      logWhatsapp('⚡ [Lazy-Load Pool] Conexão Baileys inativa no momento do envio. Iniciando conexão sob demanda...');
      if (!isConnectingFlag && connectionStatus !== 'connecting') {
        connectToWhatsApp().catch(e => console.error('Erro no lazy connectToWhatsApp:', e));
      }

      // Wait up to 30 seconds for connection to open
      let waited = 0;
      while ((!sock || connectionStatus !== 'open') && waited < 30000) {
        await new Promise(r => setTimeout(r, 1000));
        waited += 1000;
      }

      if (!sock || connectionStatus !== 'open') {
        logWhatsapp('❌ [Lazy-Load Pool] Timeout aguardando conexão abrir para o envio.');
        const failedItem = messageDispatchQueue.shift();
        if (failedItem) {
          failedItem.reject(new Error('Timeout: Conexão WhatsApp não estabelecida a tempo para o envio.'));
        }
        continue;
      }
    }

    const item = messageDispatchQueue.shift();
    if (!item) break;

    try {
      const { phone, message, mediaUrl, audioBuffer, buttons, simulateTyping, typingDelay, priority, resolve, reject, gatewayConfig } = item;
      
      // --- ROUTING: EXTERNAL GATEWAY OR NATIVE ---
      if (gatewayConfig && gatewayConfig.active && gatewayConfig.type !== 'simulation' && gatewayConfig.type !== 'native') {
        logWhatsapp(`☁️ [Gateway Router] Roteando para gateway externo: ${gatewayConfig.type}`);
        
        try {
          const fetch = (await import('node-fetch')).default as any;
          const { type, apiUrl, apiKey, instanceId, phoneId, accessToken, officialPhoneId, officialToken } = gatewayConfig;
          
          let targetUrl = apiUrl || '';
          let headers: any = { 'Content-Type': 'application/json' };
          let body: any = {};
          
          const cleanedPhone = phone.replace(/\D/g, '');
          const targetJid = await resolveLid(cleanedPhone);

          if (type === 'evolution') {
            let endpoint = mediaUrl ? 'sendMedia' : 'sendText';
            body = { number: targetJid };
            if (mediaUrl) {
              body.mediatype = 'image';
              body.media = mediaUrl;
              body.caption = message;
            } else {
              body.text = message;
            }
            targetUrl = `${apiUrl.replace(/\/$/, '')}/message/${endpoint}/${instanceId || 'zap'}`;
            headers['apikey'] = apiKey;
          } else if (type === 'official') {
            targetUrl = `https://graph.facebook.com/v20.0/${officialPhoneId || phoneId}/messages`;
            headers['Authorization'] = `Bearer ${officialToken || accessToken}`;
            body = {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: cleanedPhone,
              type: mediaUrl ? 'image' : 'text',
              [mediaUrl ? 'image' : 'text']: mediaUrl ? { link: mediaUrl, caption: message } : { body: message }
            };
          }

          const apiRes = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
          });

          if (apiRes.ok) {
            const resData = await apiRes.json();
            resolve({ success: true, messageId: resData.messageId || resData.key?.id || `cloud_${Date.now()}` });
          } else {
            const errText = await apiRes.text();
            throw new Error(`Gateway Error ${apiRes.status}: ${errText}`);
          }
        } catch (err: any) {
          reject(err);
        }
        continue;
      }

      // --- NATIVE LOGIC (BAILEYS) ---
      const jid = await resolveLid(phone);

      if (priority === 'high') {
        logWhatsapp(`⚡ [Preempção] Resposta prioritária enviada para ${phone}. Furando fila de campanha.`);
      }

      if (simulateTyping) {
        try {
          await sock.sendPresenceUpdate(audioBuffer ? 'recording' : 'composing', jid);
        } catch (e) {}
        
        // Faster typing simulation for priority responses to feel more real-time
        const defaultDelay = priority === 'high' ? 2500 : 4000;
        const sleepTime = typingDelay ? Number(typingDelay) : Math.max(defaultDelay, Math.min(1000 + (message?.length || 0) * 15, 6000));
        
        await new Promise(r => setTimeout(r, sleepTime));
        try {
          await sock.sendPresenceUpdate('paused', jid);
        } catch (e) {}
      }

      let sentMsg;
      if (audioBuffer) {
        sentMsg = await sock.sendMessage(jid, {
          audio: audioBuffer,
          mimetype: 'audio/mp4',
          ptt: true
        });
      } else if (mediaUrl) {
        sentMsg = await sock.sendMessage(jid, {
          image: { url: mediaUrl },
          caption: message
        });
      } else if (buttons && buttons.length > 0) {
        sentMsg = await sock.sendMessage(jid, {
          text: message,
          footer: 'Asset Intel Enterprise',
          buttons: buttons.map(b => ({
            buttonId: b.id,
            buttonText: { displayText: b.text },
            type: 1
          })),
          headerType: 1
        });
      } else {
        sentMsg = await sock.sendMessage(jid, { text: message });
      }

      totalMessagesSent++;
      resolve({ success: true, messageId: sentMsg?.key?.id || 'sent' });

      // 🧠 Faster delay for high priority items to ensure real-time feel
      const baseDelay = priority === 'high' ? 1000 + Math.random() * 1000 : getSmartHumanDelay(totalMessagesSent);
      await new Promise(r => setTimeout(r, baseDelay));
    } catch (err: any) {
      if (item) {
        item.reject(err);
      }
    }
  }

  isQueueProcessing = false;
}

export function queueMessage(payload: {
  phone: string;
  message: string;
  mediaUrl?: string;
  audioBuffer?: Buffer;
  buttons?: Array<{ id: string; text: string }>;
  simulateTyping?: boolean;
  typingDelay?: number;
  priority?: 'high' | 'normal';
  gatewayConfig?: any;
}): Promise<any> {
  lastActivityTimestamp = Date.now();
  return new Promise((resolve, reject) => {
    // Add to queue and ensure sorting on next process
    messageDispatchQueue.push({ ...payload, resolve, reject });
    processMessageQueue().catch(e => console.error('Erro na fila do pool:', e));
  });
}

/**
 * V3.1: Busca a foto de perfil do contato para qualificação visual
 */
export async function fetchProfilePicture(phone: string): Promise<{ hasPhoto: boolean; url?: string }> {
  const jid = await resolveLid(phone);
  if (!sock || connectionStatus !== 'open') return { hasPhoto: false };

  try {
    const url = await sock.profilePictureUrl(jid, 'image');
    return { hasPhoto: !!url, url };
  } catch (e) {
    return { hasPhoto: false };
  }
}

export async function connectToWhatsApp(forceUserTrigger = false) {
  const hasSession = fs.existsSync(path.join(process.cwd(), 'auth_info_baileys', 'creds.json'));
  if (!hasSession && !forceUserTrigger) {
    logWhatsapp('ℹ️ Nenhuma sessão ativa salva encontrada. Aguardando comando manual do usuário para iniciar conexão e gerar o QR Code.');
    connectionStatus = 'close';
    isConnectingFlag = false;
    return;
  }

  if (isConnectingFlag) {
    logWhatsapp('ℹ️ Uma conexão ao WhatsApp já está sendo iniciada em segundo plano. Aguardando...');
    return;
  }
  isConnectingFlag = true;

  try {
    // Clear any existing reconnect timer to prevent multiple threads running reconnects
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if ((globalThis as any).whatsappReconnectTimer) {
      clearTimeout((globalThis as any).whatsappReconnectTimer);
      (globalThis as any).whatsappReconnectTimer = null;
    }

    // 🧹 Prevent parallel overlapping sockets across restarts / reloads!
    const previousSock = sock || (globalThis as any).whatsappSock;
    if (previousSock) {
      logWhatsapp('ℹ️ Desconectando instância anterior do WhatsApp para evitar conexões duplicadas...');
      try {
        // Note: Baileys ev does not have removeAllListeners. We use our foolproof "sock !== currentSock" guard on events,
        // and we just trigger a clean websocket close on the previous connection.
        if (previousSock.ws) {
          previousSock.ws.close();
        }
      } catch (e: any) {
        logWhatsapp(`Aviso ao fechar socket anterior: ${e?.message || e}`);
      }
      sock = null;
      (globalThis as any).whatsappSock = null;
    }

    connectionStatus = 'connecting';
    logWhatsapp('Iniciando motor do WhatsApp Native...');
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Robust version handling: if API fails, use a modern, stable default WhatsApp Web version
    let version: [number, number, number] = [2, 3000, 1017];
    try {
      const latest = await fetchLatestBaileysVersion();
      if (latest && latest.version) {
        version = latest.version;
        logWhatsapp(`Versão do Baileys detectada: v${version.join('.')}`);
      }
    } catch (e: any) {
      logWhatsapp(`Falha ao buscar versão do Baileys do WhatsApp Web, usando o padrão estável v${version.join('.')}: ${e?.message || e}`);
    }
    
    const socketConfig: any = {
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger), // Cache keys to prevent session corruption and Stream Errored drops
      },
      browser: ['Mac OS', 'Chrome', '124.0.0.0'], // Standard browser agent to prevent security flags or instant drops
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,          // Wait up to 60s for initial handshake in container
      keepAliveIntervalMs: 15000,       // Keep-alive every 15s to keep WebSocket from being closed by Nginx/Cloud Run
      defaultQueryTimeoutMs: 60000,     // Sturdier query timeout
      retryRequestDelayMs: 2000,        // Resilient retry spacing
    };

    const currentSock = makeWASocket(socketConfig);
    sock = currentSock;
    (globalThis as any).whatsappSock = currentSock;

    currentSock.ev.on('connection.update', async (update: any) => {
    if (sock !== currentSock) {
      logWhatsapp('⚠️ Ignorando connection.update de instância antiga.');
      return;
    }
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      logWhatsapp('Novo QR Code gerado pelo WhatsApp Web!');
      qrCodeData = await QRCode.toDataURL(qr);
      connectionStatus = 'connecting';
      connectionError = null;
    }

    if (connection === 'close') {
      const errObj = lastDisconnect?.error;
      const errMessage = errObj?.message || String(errObj || '');
      const statusCode = (errObj as Boom)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isQrTimeout = errMessage.includes('QR refs attempts ended') || errMessage.includes('timed out');
      
      consecutiveFailures++;
      logWhatsapp(`Conexão encerrada: ${errMessage} (Status: ${statusCode}, Falhas consecutivas: ${consecutiveFailures})`);
      
      connectionStatus = 'close';
      qrCodeData = null;
      
      const isBadSession = statusCode === DisconnectReason.badSession || 
                           errMessage.toLowerCase().includes('bad session');

      // Only delete credentials under absolute unrecoverable conditions:
      // 1. Explicit logout from phone (statusCode 401)
      // 2. Explicit bad session (statusCode 411)
      // 3. 5+ consecutive failures to connect (looping without ever opening)
      const shouldResetAuth = isLoggedOut || isBadSession || consecutiveFailures >= 5;

      if (shouldResetAuth) {
        logWhatsapp(`⚠️ [Auto-Cura] Iniciando limpeza de credenciais devido a ${isLoggedOut ? 'desconexão do celular' : isBadSession ? 'sessão corrompida' : 'falhas consecutivas persistentes'}.`);
        
        // 🧹 First close the socket to prevent background task interference or post-close writes
        try {
          if (sock) {
            if (sock.ws) {
              sock.ws.close();
            }
          }
        } catch (closeErr: any) {
          logWhatsapp(`Aviso ao desligar socket na Auto-Cura: ${closeErr?.message || closeErr}`);
        }
        sock = null;
        (globalThis as any).whatsappSock = null;

        const authPath = path.join(process.cwd(), 'auth_info_baileys');
        if (fs.existsSync(authPath)) {
          try {
            fs.rmSync(authPath, { recursive: true, force: true });
            logWhatsapp('Credenciais limpas com sucesso do servidor para um novo pareamento limpo.');
          } catch (rmErr: any) {
            logWhatsapp(`Falha ao limpar credenciais: ${rmErr.message}`);
          }
        }
        consecutiveFailures = 0;
        if (isLoggedOut) {
          connectionError = 'Dispositivo desconectado do WhatsApp. Por favor, leia o novo QR Code.';
        } else {
          connectionError = 'Sessão reiniciada devido a problemas de sincronização. Por favor, leia o novo QR Code.';
        }
      } else {
        if (isQrTimeout) {
          connectionError = 'Sessão do QR Code expirou (sem leitura a tempo). Clique em "Gerar outro QR Code" para tentar novamente.';
        } else {
          connectionError = `Conexão interrompida temporariamente (${errMessage}). Tentando reconectar automaticamente...`;
        }
      }

      const hasSession = fs.existsSync(path.join(process.cwd(), 'auth_info_baileys', 'creds.json'));
      const shouldReconnect = !isManualLogout && !isLoggedOut && !shouldResetAuth && hasSession;
      if (shouldReconnect) {
        const reconnectDelay = consecutiveFailures > 1 ? 10000 : 3000;
        logWhatsapp(`Agendando reconexão automática em ${reconnectDelay / 1000} segundos...`);
        reconnectTimer = setTimeout(() => {
          if (!isManualLogout) {
            connectToWhatsApp().catch(err => logWhatsapp(`Erro ao reconectar: ${err?.message || err}`));
          }
        }, reconnectDelay);
        (globalThis as any).whatsappReconnectTimer = reconnectTimer;
      }
    } else if (connection === 'open') {
      logWhatsapp('Conexão estabelecida com sucesso! Seu WhatsApp está ONLINE e pareado.');
      connectionStatus = 'open';
      consecutiveFailures = 0;
      qrCodeData = null;
      connectionError = null;
      isManualLogout = false;
      lastActivityTimestamp = Date.now();
      const flagFile = path.join(process.cwd(), 'whatsapp_logged_out.flag');
      if (fs.existsSync(flagFile)) {
        try { fs.unlinkSync(flagFile); } catch (e) {}
      }
    }
  });

  currentSock.ev.on('creds.update', () => {
    if (sock !== currentSock) return;
    saveCreds();
  });

  // Monitor incoming messages and handle real AI replies
  currentSock.ev.on('messages.upsert', async (upsert: any) => {
    if (sock !== currentSock) return;
    if (upsert.type !== 'notify') return;

    for (const msg of upsert.messages) {
      if (msg.key.fromMe) continue; // Ignore messages sent by me
      
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.endsWith('@g.us')) continue; // Ignore group messages
      
      const phone = remoteJid.split('@')[0];
      const incomingText = msg.message?.conversation || 
                           msg.message?.extendedTextMessage?.text || 
                           msg.message?.imageMessage?.caption || '';
                           
      if (!incomingText || incomingText.trim().length === 0) continue;
      
      console.log(`[WhatsApp Bot] Mensagem recebida de ${phone}: "${incomingText}"`);

      // V3.1: Interromper campanha se o lead responder (replyWebhookStop)
      const { stopCampaignForLead } = await import('./queue.js');
      stopCampaignForLead(phone);

      // V3.7: Monitoramento Automático de Sentimento e Intenção
      try {
        const { analyzeLeadResponseSentiment } = await import('./aiSentimentService.js');
        const sentiment = await analyzeLeadResponseSentiment(incomingText);
        
        console.log(`[Sentiment Bot] Lead ${phone} categorizado como: ${sentiment.category}`);
        
        broadcastEvent({
          type: 'lead_response',
          phone,
          text: incomingText,
          sentiment: {
            category: sentiment.category,
            label: sentiment.label,
            summary: sentiment.summary,
            suggestedReply: sentiment.suggestedReply
          }
        });
      } catch (e) {
        console.error('[Sentiment Bot] Erro:', e);
      }
      
      if (serverBotEnabled) {
        try {
          // Generate answer using Gemini
          const replyText = await generateServerBotResponse(phone, incomingText);
          if (replyText) {
            // Smart Humanization Delay
            if (prioritySettings.smartDelay > 0) {
              console.log(`[WhatsApp Bot] Aguardando ${prioritySettings.smartDelay}s de delay humano para ${phone}...`);
              await new Promise(resolve => setTimeout(resolve, prioritySettings.smartDelay * 1000));
            }

            // Determine priority based on settings and content
            let priority: 'high' | 'normal' = 'normal';
            
            const isQuestion = incomingText.includes('?') || 
                               incomingText.toLowerCase().includes('como') || 
                               incomingText.toLowerCase().includes('qual') || 
                               incomingText.toLowerCase().includes('onde');
            
            const isAppointment = incomingText.toLowerCase().includes('agendar') || 
                                  incomingText.toLowerCase().includes('visita') || 
                                  incomingText.toLowerCase().includes('horário') || 
                                  incomingText.toLowerCase().includes('amanhã');

            if (prioritySettings.questions && isQuestion) priority = 'high';
            if (prioritySettings.appointments && isAppointment) priority = 'high';
            if (prioritySettings.newLeads) {
              // If it's a new lead (no previous logs in this session)
              const hasPrevious = serverBotLogs.some(l => l.phone === phone);
              if (!hasPrevious) priority = 'high';
            }

            // Queue response
            await queueMessage({
              phone,
              message: replyText,
              priority,
              simulateTyping: true
            });
            
            console.log(`[WhatsApp Bot] Resposta enfileirada (${priority}) para ${phone}: "${replyText}"`);
            
            // Log interaction
            serverBotLogs.push({
              id: `bot_log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              time: new Date().toLocaleTimeString('pt-BR'),
              phone: phone,
              incoming: incomingText,
              outgoing: replyText
            });
            
            if (serverBotLogs.length > 200) {
              serverBotLogs.shift();
            }
          }
        } catch (e) {
          console.error('[WhatsApp Bot] Erro ao responder automaticamente:', e);
        }
      }
    }
  });
  } catch (err: any) {
    logWhatsapp(`Erro crítico ao inicializar o WhatsApp: ${err.message || err}`);
    connectionStatus = 'close';
    connectionError = `Falha na conexão: ${err.message || err}`;
  } finally {
    isConnectingFlag = false;
  }
}

export const whatsappRouter = express.Router();

whatsappRouter.get('/status', (req, res) => {
  res.json({ 
    success: true, 
    status: connectionStatus, 
    qr: qrCodeData,
    error: connectionError,
    logs: whatsappLogs,
    consecutiveFailures,
    user: sock && sock.user ? {
      id: sock.user.id,
      name: sock.user.name || sock.user.verifiedName || 'WhatsApp Connected'
    } : null,
    pool: {
      activeConnections: sock && connectionStatus === 'open' ? 1 : 0,
      queueLength: messageDispatchQueue.length,
      totalMessagesSent,
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      lastQueueProcessTime,
      idleTimeoutMinutes,
      lastActivityTime: new Date(lastActivityTimestamp).toLocaleTimeString('pt-BR')
    }
  });
});

whatsappRouter.get('/pool/config', (req, res) => {
  res.json({
    success: true,
    idleTimeoutMinutes,
    activeConnections: sock && connectionStatus === 'open' ? 1 : 0,
    queueLength: messageDispatchQueue.length,
    totalMessagesSent,
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    lastQueueProcessTime,
    lastActivityTime: new Date(lastActivityTimestamp).toLocaleTimeString('pt-BR')
  });
});

whatsappRouter.post('/pool/config', (req, res) => {
  const { idleTimeoutMinutes: newTimeout } = req.body;
  if (typeof newTimeout === 'number' && newTimeout >= 0) {
    idleTimeoutMinutes = newTimeout;
    logWhatsapp(`⚙️ [Pool Config] Tempo de ociosidade para Graceful Shutdown alterado para ${idleTimeoutMinutes === 0 ? 'Desativado' : `${idleTimeoutMinutes} minutos`}.`);
  }
  res.json({
    success: true,
    idleTimeoutMinutes
  });
});

whatsappRouter.post('/logout', async (req, res) => {
  try {
    isManualLogout = true;
    try {
      fs.writeFileSync(path.join(process.cwd(), 'whatsapp_logged_out.flag'), 'true');
    } catch (e) {}

    // Clear any pending automatic reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (sock) {
      try {
        await sock.logout();
      } catch (e) {
        // Ignore logout errors if session already terminated
      }
      try {
        if (sock.ws) sock.ws.close();
      } catch (e) {}
      sock = null;
    }
    
    const authPath = path.join(process.cwd(), 'auth_info_baileys');
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }
    
    connectionStatus = 'close';
    qrCodeData = null;
    consecutiveFailures = 0;
    connectionError = 'Sessão totalmente encerrada pelo usuário.';
    logWhatsapp('Sessão limpa e desconectada com sucesso pelo usuário.');
    res.json({ success: true, message: 'Sessão do WhatsApp totalmente limpa e desconectada!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

whatsappRouter.post('/restart', async (req, res) => {
  try {
    isManualLogout = false;
    const logoutFlagPath = path.join(process.cwd(), 'whatsapp_logged_out.flag');
    if (fs.existsSync(logoutFlagPath)) {
      try { fs.unlinkSync(logoutFlagPath); } catch (e) {}
    }

    // Clear any pending automatic reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (sock) {
      logWhatsapp('Parando conexão anterior antes de reiniciar...');
      try {
        if (sock.ws) sock.ws.close();
      } catch (e) {}
      sock = null;
    }

    // Se NÃO houver arquivo de credenciais válido e não estiver conectado, limpa a pasta para evitar resíduos inconsistentes
    if (connectionStatus !== 'open') {
      const authPath = path.join(process.cwd(), 'auth_info_baileys');
      const credsPath = path.join(authPath, 'creds.json');
      if (fs.existsSync(authPath) && !fs.existsSync(credsPath)) {
        logWhatsapp('Limpando pasta de autenticação incompleta/corrompida antes de nova tentativa...');
        try {
          fs.rmSync(authPath, { recursive: true, force: true });
        } catch (e: any) {
          console.warn('[WhatsApp Native] Erro ao limpar auth_info_baileys:', e.message);
        }
      } else {
        logWhatsapp('Preservando credenciais existentes para tentativa de reconexão automática...');
      }
    }

    connectionStatus = 'connecting';
    qrCodeData = null;
    connectionError = null;
    consecutiveFailures = 0;
    
    // Trigger fresh connect in background
    connectToWhatsApp(true).catch(err => {
      logWhatsapp(`Erro ao conectar no restart: ${err?.message || err}`);
    });

    res.json({ success: true, message: 'Instância reiniciada com sucesso de forma limpa!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

whatsappRouter.get('/watchdog/status', (req, res) => {
  res.json({
    success: true,
    enabled: isWatchdogEnabled,
    intervalMs: watchdogIntervalMs,
    lastCheck: lastWatchdogCheck || 'Nenhum check executado ainda',
    isManualLogout,
    consecutiveFailures
  });
});

whatsappRouter.post('/whatsappNumbers/zap', async (req, res) => {
  const { numbers } = req.body;
  if (!sock || connectionStatus !== 'open') {
    return res.status(400).json({ success: false, error: 'WhatsApp não está conectado.' });
  }
  try {
    const results = [];
    for (const num of numbers) {
      const info = await resolveLid(num);
      // Baileys onWhatsApp returns { jid, exists }
      // We want to return { jid, lid, exists }
      results.push({
        jid: info,
        lid: info.includes(':') ? info : undefined, // Lid often has ':' in Baileys
        exists: true
      });
    }
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

whatsappRouter.post('/watchdog/config', (req, res) => {
  const { enabled, intervalMs } = req.body;
  if (typeof enabled === 'boolean') {
    isWatchdogEnabled = enabled;
  }
  if (typeof intervalMs === 'number' && intervalMs >= 10000) {
    watchdogIntervalMs = intervalMs;
    startBackgroundWatchdog();
  }
  logWhatsapp(`🧠 [Watchdog] Configurações atualizadas: ativo=${isWatchdogEnabled}, intervalo=${watchdogIntervalMs}ms`);
  res.json({
    success: true,
    enabled: isWatchdogEnabled,
    intervalMs: watchdogIntervalMs
  });
});

whatsappRouter.post('/ai-heal', async (req, res) => {
  try {
    logWhatsapp('🧠 [AI Auto-Heal] Iniciando análise por Inteligência Artificial...');
    const recentLogs = whatsappLogs.slice(-15).join('\n');
    
    const prompt = `Você é um Engenheiro de Diagnóstico de Sistemas especializado no protocolo WhatsApp e na biblioteca Baileys.
Analise as informações do sistema de conexão do WhatsApp e gere um relatório técnico de diagnóstico detalhado, em português (Brasil), no formato Markdown.

SITUAÇÃO ATUAL DO SISTEMA:
- Status de Conexão: ${connectionStatus}
- Mensagem de Erro: ${connectionError || 'Sem erro registrado no momento.'}
- Falhas Consecutivas de Conexão: ${consecutiveFailures}
- Desconexão Manual pelo Usuário: ${isManualLogout ? 'Sim' : 'Não'}

ÚLTIMOS LOGS DO DISPOSITIVO (BAILEYS):
"""
${recentLogs || 'Nenhum log disponível.'}
"""

Seu relatório deve incluir:
1. **Análise do Problema**: Diagnóstico do que está acontecendo (por exemplo: "Sessão desautorizada/expirada", "Aparelho sem internet", "Erro de stream ou rede temporário", ou "Tudo operando normalmente").
2. **Ações Recomendadas**: O que o usuário deve fazer para corrigir (ex: ler o QR Code, conferir a internet do telefone, manter a aba ativa, etc.).
3. **Ações do Sistema**: Uma descrição breve sobre as ações automáticas que o sistema executará agora para restaurar a saúde da conexão.

Seja extremamente objetivo, profissional e prático. Não use jargões desnecessários de marketing. Responda apenas com o texto em Markdown estruturado.`;

    let diagnosticsReport = '';
    try {
      const aiClient = getAiClient();
      if (aiClient) {
        const modelRes = await aiClient.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: {
            temperature: 0.3,
            maxOutputTokens: 800,
          }
        });
        diagnosticsReport = modelRes.text?.trim() || 'Erro ao gerar relatório com IA.';
      } else {
        diagnosticsReport = `### Relatório de Diagnóstico do Sistema (Modo Offline)
- **Status**: ${connectionStatus}
- **Erro**: ${connectionError || 'Sem erros'}
- **Falhas Consecutivas**: ${consecutiveFailures}

**Ação de Auto-Cura Recomendada**: Realizar a limpeza total das credenciais e reiniciar o motor para gerar um novo QR Code de autenticação limpa.`;
      }
    } catch (e: any) {
      logWhatsapp(`⚠️ [AI Auto-Heal] Exceção ao consultar IA (usando fallback estático): ${e?.message || e}`);
      diagnosticsReport = `### Relatório de Diagnóstico do Sistema (Modo Resiliente - Fallback Estático)
- **Status**: ${connectionStatus}
- **Erro**: ${connectionError || 'Sem erros'}
- **Falhas Consecutivas**: ${consecutiveFailures}

**Ação de Auto-Cura Recomendada**: O sistema executou a limpeza automatizada e reinicialização para garantir estabilidade da conexão.`;
    }

    // ALWAYS perform a deep self-healing action:
    logWhatsapp('🧠 [AI Auto-Heal] Executando plano de auto-cura profunda do sistema...');
    
    // 1. Reset manual logout flags if they are on, so it tries to reconnect
    isManualLogout = false;
    const flagFile = path.join(process.cwd(), 'whatsapp_logged_out.flag');
    if (fs.existsSync(flagFile)) {
      try { fs.unlinkSync(flagFile); } catch (e) {}
    }
    
    // 2. Shut down previous socket cleanly
    if (sock) {
      try {
        if (sock.ws) sock.ws.close();
      } catch (e) {}
      sock = null;
    }
    
    // 3. Delete session files if connection is close/refused, so they can scan a fresh QR code
    if (connectionStatus !== 'open') {
      const authPath = path.join(process.cwd(), 'auth_info_baileys');
      if (fs.existsSync(authPath)) {
        try { fs.rmSync(authPath, { recursive: true, force: true }); } catch (e) {}
      }
    }
    
    // 4. Force state reset
    connectionStatus = 'connecting';
    qrCodeData = null;
    connectionError = null;
    consecutiveFailures = 0;
    isConnectingFlag = false; // ensure lock is cleared
    
    // 5. Trigger fresh connect
    connectToWhatsApp(true).catch(err => {
      logWhatsapp(`⚠️ [AI Auto-Heal] Erro ao reconectar pós auto-cura: ${err.message || err}`);
    });
    
    logWhatsapp('🧠 [AI Auto-Heal] Plano de auto-cura executado! Sistema de conexão reiniciado com sucesso em modo limpo.');
    
    res.json({
      success: true,
      diagnostics: diagnosticsReport,
      actionTaken: 'Terminado processos antigos, deletado arquivos temporários de autenticação pendentes e reiniciado o motor de conexão para gerar um novo QR Code fresco.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

whatsappRouter.post('/send', async (req, res) => {
  const { phone, message, mediaUrl, buttons, simulateTyping, typingDelay, priority } = req.body;
  if (!sock || connectionStatus !== 'open') {
    return res.status(400).json({ success: false, error: 'WhatsApp não está conectado.' });
  }

  try {
    const result = await queueMessage({
      phone,
      message,
      mediaUrl,
      buttons,
      simulateTyping: simulateTyping !== undefined ? simulateTyping : true,
      typingDelay: typingDelay ? Number(typingDelay) : undefined,
      priority: priority || 'high' // Default to high for manual UI sends
    });
    res.json(result);
  } catch (err: any) {
    console.error('[WhatsApp Native Pool] Erro ao enfileirar/enviar mensagem:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

whatsappRouter.get('/priority-settings', (req, res) => {
  res.json(prioritySettings);
});

whatsappRouter.post('/priority-settings', (req, res) => {
  const { newLeads, questions, appointments, objections, smartDelay } = req.body;
  if (newLeads !== undefined) prioritySettings.newLeads = !!newLeads;
  if (questions !== undefined) prioritySettings.questions = !!questions;
  if (appointments !== undefined) prioritySettings.appointments = !!appointments;
  if (objections !== undefined) prioritySettings.objections = !!objections;
  if (smartDelay !== undefined) prioritySettings.smartDelay = Number(smartDelay);
  
  logWhatsapp('⚙️ [Priority Engine] Configurações de prioridade e delay atualizadas via API.');
  res.json({ success: true, settings: prioritySettings });
});

// startBackgroundWatchdog desativado na inicialização para evitar conexão e geração de QR code sem comando do usuário


