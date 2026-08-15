import { Lead } from '../types';
import { resolveLidBatch } from './lidResolver';

/**
 * Dispara automaticamente mensagens no servidor para leads validados com WhatsApp se a conexão estiver ativa.
 */
export async function triggerAutoSendForValidLeads(validLeads: Lead[]): Promise<void> {
  if (!validLeads || validLeads.length === 0) return;

  const pendingLeads = validLeads.filter(l => l.whatsappStatus === 'has-whatsapp' && l.outreachStatus === 'pendente');
  if (pendingLeads.length === 0) return;

  try {
    // Verificar status da conexão WhatsApp
    const statusRes = await fetch('/api/whatsapp/native/status');
    if (!statusRes.ok) return;
    const statusData = await statusRes.json();

    if (statusData.status === 'open') {
      const template = localStorage.getItem('truck_miner_broadcast_text') || 'Olá {nome}, vi seu anúncio sobre {item} e gostaria de saber se ainda está disponível.';
      const msgType = localStorage.getItem('truck_miner_msg_type') || 'text';
      const mediaUrl = localStorage.getItem('truck_miner_media_url') || '';
      const usePTT = localStorage.getItem('truck_miner_use_ptt') === 'true';

      await fetch('/api/whatsapp/native/queue/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: pendingLeads,
          template,
          messageType: msgType,
          mediaUrl,
          isPTT: usePTT
        })
      });
      console.log(`🚀 [AutoSender] Disparo em massa iniciado automaticamente no servidor para ${pendingLeads.length} leads com WhatsApp ativo!`);
    }
  } catch (err) {
    console.warn('[AutoSender] Falha ao verificar conexão ou disparar mensagens automáticas:', err);
  }
}

/**
 * Motor de Validação Automática (V3.6 Enterprise)
 * Processa leads em "unchecked" em lotes de 20 para máxima performance.
 * Valida se já tem WhatsApp e, se conectado, inicia o envio de mensagem automaticamente.
 */
export async function processAutoValidation(
  leads: Lead[],
  updateLeads: (updatedLeads: Lead[]) => void,
  onLog?: (msg: string) => void
) {
  const log = (msg: string) => onLog?.(`[AutoValidator] ${msg}`);

  // 1. Filtrar leads que precisam de validação
  const pendingLeads = leads.filter(l => !l.whatsappStatus || l.whatsappStatus === 'unchecked');
  
  if (pendingLeads.length === 0) {
    // Se todos já estão validados, tentar disparar mensagens para quem está pendente de envio
    const confirmedWaLeads = leads.filter(l => l.whatsappStatus === 'has-whatsapp' && l.outreachStatus === 'pendente');
    if (confirmedWaLeads.length > 0) {
      triggerAutoSendForValidLeads(confirmedWaLeads);
    }
    return;
  }

  log(`Encontrados ${pendingLeads.length} novos leads pendentes de validação WhatsApp.`);

  // 2. Processar em lotes de 20 para altíssima velocidade
  const batchSize = 20;
  const leadsToProcess = pendingLeads.slice(0, batchSize);
  const phonesToProcess = leadsToProcess.map(l => l.rawPhone);

  log(`Validando lote de ${leadsToProcess.length} números em tempo real...`);

  try {
    const results = await resolveLidBatch(phonesToProcess);
    
    // 3. Mapear resultados de volta para os leads
    const newlyConfirmedLeads: Lead[] = [];
    const updatedLeads = leads.map(lead => {
      const norm = lead.rawPhone.replace(/\D/g, '');
      const res = results[norm] || results[lead.rawPhone];

      if (res) {
        const hasWa = Boolean(res.exists);
        const updated = {
          ...lead,
          whatsappStatus: (hasWa ? 'has-whatsapp' : 'no-whatsapp') as any,
          waMeUrl: hasWa ? `https://wa.me/${res.number || norm}` : lead.waMeUrl
        };
        if (hasWa && lead.outreachStatus === 'pendente') {
          newlyConfirmedLeads.push(updated);
        }
        return updated;
      }
      return lead;
    });

    updateLeads(updatedLeads);
    log(`Lote de ${leadsToProcess.length} validado com sucesso.`);

    // 4. Se encontrou números com WhatsApp e a conexão estiver aberta, envia mensagem automaticamente!
    if (newlyConfirmedLeads.length > 0) {
      log(`⚡ Encontrados ${newlyConfirmedLeads.length} novos números com WhatsApp ativo. Verificando auto-envio...`);
      triggerAutoSendForValidLeads(newlyConfirmedLeads);
    }

  } catch (err) {
    log(`Erro ao processar lote de validação: ${err}`);
  }
}

/**
 * Hook ou Helper para iniciar monitoramento automático contínuo
 */
export function startAutoValidationMonitor(
  getLeads: () => Lead[],
  setLeads: (leads: Lead[]) => void,
  intervalMs = 10000 // A cada 10 segundos verifica e processa instantaneamente
) {
  let isRunning = false;

  const tick = async () => {
    if (isRunning) return;
    isRunning = true;
    
    await processAutoValidation(getLeads(), setLeads);
    
    isRunning = false;
  };

  const timer = setInterval(tick, intervalMs);
  tick(); // Executa a primeira vez imediatamente

  return () => clearInterval(timer);
}

