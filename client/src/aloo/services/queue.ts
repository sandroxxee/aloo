import { getAiClient } from './aiService.js';
import { connectionStatus } from './whatsapp.js';
import fs from 'fs';
import path from 'path';
import { WebSocket } from 'ws';
import { sock, wss, logWhatsapp, queueMessage } from './whatsapp.js';
import { resolveLid } from './lidResolver.js';
import { normalizeBRUniversal } from './normalizeBRUniversal.js';
import { shouldOfferTool } from './toolBuyerDetector.js';
import { Boom } from '@hapi/boom';
import { downloadMediaMessage } from '@whiskeysockets/baileys'; 

export let bulkQueue: any[] = [];
export let bulkQueueStatus: 'idle' | 'running' | 'paused' | 'cooldown' = 'idle';
export let bulkQueueIndex = 0;
export let bulkQueueSentCount = 0;
export let bulkQueueCooldownEnd: number | null = null;
export let bulkQueueTemplate = '';
export let bulkQueueMediaUrl: string | null = null;
export let bulkQueueMessageType: 'text' | 'image' | 'video' | 'audio' = 'text';
export let bulkQueueButtons: { id: string, text: string }[] | null = null;
export let bulkQueueIsPTT: boolean = false;
export let bulkQueueGatewayConfig: any = null;
export const updateBulkQueueGatewayConfig = (config: any) => { bulkQueueGatewayConfig = config; };
export let bulkQueueReports: any[] = [];
export let isProcessingItem: boolean = false;
export let bulkQueueCurrentTimer: NodeJS.Timeout | null = null;
export let bulkQueueNextRunTime: number | null = null;
export let bulkQueueMinDelay = 90; // V3.1: 90s
export let bulkQueueMaxDelay = 240; // V3.1: 240s
export let bulkQueueCooldownFreq = 20; // V3.1: 20 envios por hora
export let bulkQueueCooldownDuration = 3600; // V3.1: 1 hora de cooldown

const QUEUE_FILE_PATH = path.join(process.cwd(), 'data', 'queue_state.json');

export function saveQueueState() {
  try {
    const state = {
      bulkQueue,
      bulkQueueStatus: bulkQueueStatus === 'running' || bulkQueueStatus === 'cooldown' ? 'paused' : bulkQueueStatus,
      bulkQueueIndex,
      bulkQueueSentCount,
      bulkQueueTemplate,
      bulkQueueMediaUrl,
      bulkQueueMessageType,
      bulkQueueButtons,
      bulkQueueIsPTT,
      bulkQueueReports,
      bulkQueueGatewayConfig // PERSIST GATEWAY CONFIG
    };
    if (!fs.existsSync(path.dirname(QUEUE_FILE_PATH))) {
      fs.mkdirSync(path.dirname(QUEUE_FILE_PATH), { recursive: true });
    }
    fs.writeFileSync(QUEUE_FILE_PATH, JSON.stringify(state, null, 2));
    broadcastQueueStatus();
  } catch (err) {
    console.warn('Erro ao salvar estado da fila:', err);
  }
}

export function loadQueueState() {
  try {
    if (fs.existsSync(QUEUE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(QUEUE_FILE_PATH, 'utf-8'));
      bulkQueue = data.bulkQueue || [];
      bulkQueueStatus = data.bulkQueueStatus || 'idle';
      bulkQueueIndex = data.bulkQueueIndex || 0;
      bulkQueueSentCount = data.bulkQueueSentCount || 0;
      bulkQueueTemplate = data.bulkQueueTemplate || '';
      bulkQueueMediaUrl = data.bulkQueueMediaUrl || null;
      bulkQueueMessageType = data.bulkQueueMessageType || 'text';
      bulkQueueButtons = data.bulkQueueButtons || null;
      bulkQueueIsPTT = data.bulkQueueIsPTT || false;
      bulkQueueReports = data.bulkQueueReports || [];
      bulkQueueGatewayConfig = data.bulkQueueGatewayConfig || null; // LOAD GATEWAY CONFIG
    }
  } catch (err) {
    console.warn('Erro ao carregar fila:', err);
  }
}

export function broadcastQueueStatus() {
  if (wss) {
    const payload = JSON.stringify({
      type: 'queue_status',
      data: {
        status: bulkQueueStatus,
        total: bulkQueue.length,
        currentIndex: bulkQueueIndex,
        sentCount: bulkQueueSentCount,
        cooldownEnd: bulkQueueCooldownEnd,
        nextRunTime: bulkQueueNextRunTime,
        reports: bulkQueueReports
      }
    });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

import express from 'express';
import { generateAudioPTT } from './elevenlabs.js';

// V3.1 Rate Limiting (Hourly)
let messagesSentInLastHour = 0;
let lastRateLimitReset = Date.now();

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastRateLimitReset >= 3600000) {
    messagesSentInLastHour = 0;
    lastRateLimitReset = now;
  }
  return messagesSentInLastHour < 20;
}

// V3.1 Time Window Check (08:00 - 18:00)
function isWithinTimeWindow(phone: string): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 8 && hour < 18;
}

export function stopCampaignForLead(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const initialLength = bulkQueue.length;
  
  // Remove future occurrences of this phone from the queue
  bulkQueue = bulkQueue.filter((lead, index) => {
    const leadPhone = lead.phone.replace(/\D/g, '');
    // Only remove if it's AFTER the current index (future messages)
    // or if the campaign hasn't started yet.
    if (leadPhone === cleanPhone && index >= bulkQueueIndex) {
      return false;
    }
    return true;
  });

  if (bulkQueue.length < initialLength) {
    logWhatsapp(`🛑 [Webhook Stop] Campanha interrompida para o lead ${phone} devido à resposta recebida.`);
    saveQueueState();
    broadcastQueueStatus();
  }
}

import { enrichAndQualifyLead } from './leadEnrichmentService.js';

// V3.2: Periodic Validation Timer (10 minutes)
let periodicValidationTimer: NodeJS.Timeout | null = null;

export function startPeriodicValidation() {
  if (periodicValidationTimer) return;
  
  logWhatsapp('🔄 [Periodic Validator] Iniciado. Frequência: 10 minutos.');
  
  periodicValidationTimer = setInterval(async () => {
    if (bulkQueue.length === 0 || bulkQueueIndex >= bulkQueue.length) return;
    
    logWhatsapp('🔍 [Periodic Validator] Executando varredura de integridade na fila...');
    
    // Valida os próximos 5 leads da fila que ainda não foram processados
    const nextLeads = bulkQueue.slice(bulkQueueIndex, bulkQueueIndex + 5);
    
    for (const lead of nextLeads) {
      try {
        const cleanPhone = normalizeBRUniversal(lead.phone);
        const info = await resolveLid(cleanPhone);
        
        if (!info.exists) {
          logWhatsapp(`❌ [Validator] Lead ${lead.name} (${cleanPhone}) não existe no WhatsApp. Removendo da fila.`);
          // Marcar para remoção ou pular
          lead.status = 'Invalid';
        } else {
          // Aproveita para enriquecer se estiver incompleto
          const enriched = await enrichAndQualifyLead(lead as any);
          Object.assign(lead, enriched);
        }
      } catch (e) {}
    }
    
    saveQueueState();
    broadcastQueueStatus();
  }, 10 * 60 * 1000); // 10 minutos
}

export function stopPeriodicValidation() {
  if (periodicValidationTimer) {
    clearInterval(periodicValidationTimer);
    periodicValidationTimer = null;
  }
}

async function processNextBulkQueueItem() {
  // ... (rest of the function)
  if (isProcessingItem) return;
  isProcessingItem = true;
  try {
  saveQueueState();
  if (bulkQueueStatus !== 'running') return;
  
  if (bulkQueueIndex >= bulkQueue.length) {
    logWhatsapp('🎉 [Fila em Massa] Todos os envios da fila foram finalizados no servidor com sucesso!');
    bulkQueueStatus = 'idle';
    bulkQueueNextRunTime = null;
    return;
  }

  // V3.1 Rate Limit Check
  if (!checkRateLimit()) {
    logWhatsapp('🛑 [Rate Limit] Limite de 20 envios/hora atingido. Pausando por 60 min.');
    bulkQueueStatus = 'cooldown';
    bulkQueueCooldownEnd = Date.now() + 3600000;
    saveQueueState();
    return;
  }

  const currentLead = bulkQueue[bulkQueueIndex];

  // V3.1 Time Window Check
  if (!isWithinTimeWindow(currentLead.phone)) {
    logWhatsapp(`🕒 [Time Window] Fora do horário comercial (08h-18h) para o lead ${currentLead.name}. Aguardando...`);
    bulkQueueNextRunTime = Date.now() + 600000; // Tenta novamente em 10 minutos
    saveQueueState();
    return;
  }

  const cleanPhone = normalizeBRUniversal(currentLead.phone);

  logWhatsapp(`📤 [Fila em Massa V3.1] Processando lead ${bulkQueueIndex + 1}/${bulkQueue.length}: ${currentLead.name || 'Sem Nome'} (${cleanPhone})`);

  // Step 1: Pre-validation using LID Resolver
  let targetInfo: { jid: string; lid?: string; exists: boolean } = { jid: `${cleanPhone}@s.whatsapp.net`, lid: undefined, exists: true };
  if (sock && connectionStatus === 'open') {
    try {
      targetInfo = await resolveLid(cleanPhone);
      logWhatsapp(`✅ [LID Resolver] Resolvido: ${targetInfo.lid || targetInfo.jid}`);
    } catch (err: any) {
      logWhatsapp(`⚠️ [LID Resolver] Falha para ${cleanPhone}: ${err.message}. Usando JID padrão.`);
    }
  }

  const targetRecipient = targetInfo.lid || targetInfo.jid;

  // Step 2: AI Text Variation (Gemini Semantic Spintax)
  let finalMsg = bulkQueueTemplate;
  const aiClient = getAiClient();
  if (aiClient) {
    try {
      logWhatsapp(`🧠 [Semantic Spintax] Gerando variação humanizada para ${currentLead.name}...`);
      const aiPrompt = `Você é um copywriter de vendas experiente no mercado de caminhões no Brasil.
Reescreva a mensagem abaixo de forma natural, amigável e ligeiramente diferente para evitar bloqueios por spam.
Mantenha as variáveis {nome}, {item}, {cidade}, {preco} intactas.

MENSAGEM: "${bulkQueueTemplate}"

RESPONDA APENAS A MENSAGEM REESCRITA.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: aiPrompt,
        config: { temperature: 0.8, maxOutputTokens: 600 }
      });
      const generated = response.text?.trim();
      if (generated && generated.length > 10) {
        finalMsg = generated;
      }
    } catch (e) {}
  }

  // Format dynamic variables
  const realName = currentLead.name && !['anunciante', 'vendedor', 'comprador', 'desconhecido'].includes(currentLead.name.toLowerCase()) ? currentLead.name.trim() : null;
  if (realName) {
    finalMsg = finalMsg.replace(/\{nome\}/gi, realName);
  } else {
    finalMsg = finalMsg.replace(/\s*\{nome\},?/gi, '').replace(/\s{2,}/g, ' ').trim();
  }
  finalMsg = finalMsg
    .replace(/\{item\}/gi, currentLead.item || 'veículo')
    .replace(/\{marca\}/gi, currentLead.item || 'veículo')
    .replace(/\{preco\}/gi, currentLead.price || 'preço a combinar')
    .replace(/\{cidade\}/gi, currentLead.location || 'Brasil');

  
  // Step 4: Queue Message (Unified Priority Queue)
  let sendSuccess = false;
  
  try {
    const queuePayload: any = {
      phone: cleanPhone,
      message: finalMsg,
      priority: 'normal',
      simulateTyping: true,
      typingDelay: 4000 // Jitter para campanhas frias
    };

    if (bulkQueueMessageType === 'image') {
      queuePayload.mediaUrl = bulkQueueMediaUrl;
    } else if (bulkQueueMessageType === 'video') {
      queuePayload.mediaUrl = bulkQueueMediaUrl;
    } else if (bulkQueueMessageType === 'audio' || bulkQueueIsPTT) {
      if (bulkQueueIsPTT) {
        logWhatsapp(`🎙️ [ElevenLabs] Gerando áudio PTT humanizado para ${currentLead.name}...`);
        try {
          const buffer = await generateAudioPTT(finalMsg);
          queuePayload.audioBuffer = buffer;
        } catch (err: any) {
          logWhatsapp(`❌ [ElevenLabs] Erro ao gerar áudio: ${err.message}. Usando texto como fallback.`);
        }
      } else {
        queuePayload.mediaUrl = bulkQueueMediaUrl;
      }
    }

    if (bulkQueueButtons && bulkQueueButtons.length > 0) {
      queuePayload.buttons = bulkQueueButtons;
    }

    // Pass gateway config if active
    if (bulkQueueGatewayConfig && bulkQueueGatewayConfig.active) {
      queuePayload.gatewayConfig = bulkQueueGatewayConfig;
    }

    // Envia para a fila prioritária do WhatsApp Native (agora com suporte a roteamento de gateway)
    const result = await queueMessage(queuePayload);
    sendSuccess = result.success;
    
    if (sendSuccess) {
      messagesSentInLastHour++;
    }
  } catch (err: any) {
    logWhatsapp(`❌ [Fila em Massa] Erro ao enfileirar para ${cleanPhone}: ${err.message || err}`);
  }

  // Update reports
  bulkQueueReports.push({
    name: currentLead.name || 'Sem Nome',
    phone: cleanPhone,
    status: sendSuccess ? 'Sent' : 'Failed',
    timestamp: new Date().toLocaleTimeString('pt-BR')
  });

  bulkQueueIndex++;
  bulkQueueSentCount++;

  // Step 5: Jitter random delay (90-240s)
  const jitterSeconds = Math.floor(Math.random() * (240 - 90 + 1)) + 90;
  bulkQueueNextRunTime = Date.now() + (jitterSeconds * 1000);
  logWhatsapp(`⏳ [Fila em Massa] Aguardando jitter de segurança de ${jitterSeconds}s (90s - 240s)...`);
  saveQueueState();
  } catch (err) {
    logWhatsapp('❌ [Fila em Massa] Erro fatal no processamento: ' + err);
  } finally {
    isProcessingItem = false;
  }
}

export const queueRouter = express.Router();


queueRouter.post('/start', (req, res) => {
  const { leads, template, messageType, mediaUrl, minDelay, maxDelay, cooldownFreq, cooldownDuration, gatewayConfig, buttons, isPTT } = req.body;
  if (!leads || !Array.isArray(leads)) {
    return res.status(400).json({ success: false, error: 'A lista de leads é obrigatória.' });
  }

  if (minDelay !== undefined) bulkQueueMinDelay = Number(minDelay) || 12;
  if (maxDelay !== undefined) bulkQueueMaxDelay = Number(maxDelay) || 35;
  if (cooldownFreq !== undefined) bulkQueueCooldownFreq = Number(cooldownFreq) || 10;
  if (cooldownDuration !== undefined) bulkQueueCooldownDuration = Number(cooldownDuration) || 300;

  // Reset Queue state
  bulkQueue = leads;
  bulkQueueStatus = 'running';
  bulkQueueIndex = 0;
  bulkQueueSentCount = 0;
  bulkQueueCooldownEnd = null;
  bulkQueueTemplate = template || '';
  bulkQueueMediaUrl = mediaUrl || null;
  bulkQueueMessageType = messageType || 'text';
  bulkQueueButtons = buttons || null;
  bulkQueueIsPTT = isPTT || false;
  bulkQueueGatewayConfig = gatewayConfig || null;
  bulkQueueReports = [];

  if (bulkQueueCurrentTimer) {
    clearTimeout(bulkQueueCurrentTimer);
    bulkQueueCurrentTimer = null;
  }

  logWhatsapp(`🚀 [Fila em Massa] Iniciado envio em massa para ${leads.length} leads (Velocidade: ${bulkQueueMinDelay}s-${bulkQueueMaxDelay}s, Cooldown a cada ${bulkQueueCooldownFreq} msgs).`);
  processNextBulkQueueItem();

  res.json({ success: true, count: leads.length, status: bulkQueueStatus });
});

queueRouter.post('/pause', (req, res) => {
  if (bulkQueueStatus === 'running' || bulkQueueStatus === 'cooldown') {
    bulkQueueStatus = 'paused';
    if (bulkQueueCurrentTimer) {
      clearTimeout(bulkQueueCurrentTimer);
      bulkQueueCurrentTimer = null;
    }
    bulkQueueNextRunTime = null;
    logWhatsapp('⏸️ [Fila em Massa] Envio em massa pausado pelo painel.');
    saveQueueState();
  }
  res.json({ success: true, status: bulkQueueStatus });
});

queueRouter.post('/resume', (req, res) => {
  if (bulkQueueStatus === 'paused') {
    bulkQueueStatus = 'running';
    logWhatsapp('▶️ [Fila em Massa] Envio em massa retomado a partir da última posição.');
    processNextBulkQueueItem();
  }
  res.json({ success: true, status: bulkQueueStatus });
});

queueRouter.post('/cancel', (req, res) => {
  bulkQueueStatus = 'idle';
  if (bulkQueueCurrentTimer) {
    clearTimeout(bulkQueueCurrentTimer);
    bulkQueueCurrentTimer = null;
  }
  bulkQueue = [];
  bulkQueueIndex = 0;
  bulkQueueSentCount = 0;
  bulkQueueCooldownEnd = null;
  bulkQueueNextRunTime = null;
  logWhatsapp('⏹️ [Fila em Massa] Envio em massa CANCELADO e fila limpa.');
  saveQueueState();
  res.json({ success: true, status: bulkQueueStatus });
});

queueRouter.post('/gateway-config', (req, res) => {
  const config = req.body;
  bulkQueueGatewayConfig = config || null;
  saveQueueState();
  res.json({ success: true });
});

queueRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    status: bulkQueueStatus,
    total: bulkQueue.length,
    currentIndex: bulkQueueIndex,
    sentCount: bulkQueueSentCount,
    cooldownEnd: bulkQueueCooldownEnd,
    nextRunTime: bulkQueueNextRunTime,
    reports: bulkQueueReports
  });
});

queueRouter.get('/export', (req, res) => {
  // Create CSV with dynamic reports
  let csvContent = '\uFEFF'; // BOM for Portuguese Excel encoding
  csvContent += 'Lead;Telefone;Status;Data/Hora\n';
  
  bulkQueueReports.forEach(item => {
    csvContent += `"${(item.name || '').replace(/"/g, '""')}";"${(item.phone || '').replace(/"/g, '""')}";"${(item.status || '').replace(/"/g, '""')}";"${(item.timestamp || '').replace(/"/g, '""')}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=relatorio_envios_massa.csv');
  res.status(200).send(csvContent);
});



// ==================== MASTER TICK LOOP ====================
setInterval(() => {
  if (bulkQueueStatus === 'idle' || bulkQueueStatus === 'paused') return;
  
  const now = Date.now();
  
  if (bulkQueueStatus === 'cooldown' && bulkQueueCooldownEnd && now >= bulkQueueCooldownEnd) {
    bulkQueueStatus = 'running';
    bulkQueueCooldownEnd = null;
    bulkQueueNextRunTime = null;
    logWhatsapp('✅ [Fila em Massa] Cooldown finalizado. Retomando envios...');
    saveQueueState();
    processNextBulkQueueItem();
    return;
  }
  
  if (bulkQueueStatus === 'running') {
    if (bulkQueueNextRunTime && now < bulkQueueNextRunTime) {
      return; // Still waiting
    }
    
    // Time to run next item
    bulkQueueNextRunTime = null; // Prevent re-triggering while processing
    processNextBulkQueueItem();
  }
}, 3000); // Check every 3 seconds

