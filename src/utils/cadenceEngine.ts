import { Lead } from '../types';

export interface CadenceStage {
  step: number;
  title: string;
  delayHours: number; // Intervalo recomendado após o passo anterior
  objective: string;
  sendAsAudioPTT?: boolean; // V3.1: Enviar via ElevenLabs PTT
  defaultPitchTemplate: (lead: Lead) => string;
}

/**
 * 🎯 FASE 3 — CADENCE PIPELINE ENGINE (CADÊNCIA DE MENSAGENS MULTI-ETAPAS / FUNIL DE 3 DIAS)
 */
export const CADENCE_FUNNEL_STAGES: CadenceStage[] = [
  {
    step: 1,
    title: 'Dia 1 — Primeiro Contato & Pitch de Oportunidade',
    delayHours: 0,
    objective: 'Apresentar a oportunidade de forma direta, humanizada e personalizada sem parecer automação.',
    defaultPitchTemplate: (lead: Lead) => {
      const name = lead.sellerFullName || lead.name || 'amigo';
      const item = lead.item || 'seu equipamento';
      const city = lead.city ? ` em ${lead.city}` : '';
      return `Olá, ${name}! Tudo bem? Vi seu anúncio sobre ${item}${city}. Sou comprador direto de frotas e peças pesadas. Ainda está disponível para negociação ou repasse rápido?`;
    }
  },
  {
    step: 2,
    title: 'Dia 2 — Reforço de Valor & Proposta Direta',
    delayHours: 24,
    objective: 'Reengajar a conversa trazendo proposta objetiva ou condição facilitada de pagamento à vista.',
    sendAsAudioPTT: true, // V3.1: Habilitado por padrão para Mensagem 2
    defaultPitchTemplate: (lead: Lead) => {
      const name = lead.sellerFullName || lead.name || 'amigo';
      const item = lead.item || 'o item';
      return `Fala ${name}, beleza? Só reforçando meu contato sobre ${item}. Temos orçamento liberado para fechamento essa semana à vista. Consegue me mandar mais detalhes ou fotos do estado atual?`;
    }
  },
  {
    step: 3,
    title: 'Dia 3 — Condição Especial de Fechamento / Ultimato de Repasse',
    delayHours: 48,
    objective: 'Gatilho de escassez e última chamada comercial antes de arquivar o contato.',
    defaultPitchTemplate: (lead: Lead) => {
      const name = lead.sellerFullName || lead.name || 'amigo';
      const item = lead.item || 'seu anúncio';
      return `${name}, boa tarde! Estou fechando a grade de compras de frotas da semana hoje à tarde. Se ainda tiver interesse em negociar ${item} com pagamento imediato, me avisa até as 17h. Um abraço!`;
    }
  }
];

/**
 * Retorna o pitch personalizado adequado para a etapa atual da cadência do lead
 */
export function getCadenceMessageForLead(lead: Lead, stepOverride?: number): string {
  const currentStep = stepOverride || lead.cadenceStep || 1;
  const stage = CADENCE_FUNNEL_STAGES.find(s => s.step === currentStep) || CADENCE_FUNNEL_STAGES[0];
  return stage.defaultPitchTemplate(lead);
}

/**
 * Avança o lead para a próxima etapa da cadência
 */
export function advanceLeadCadence(lead: Lead): Partial<Lead> {
  const currentStep = lead.cadenceStep || 1;
  const nextStep = currentStep + 1;
  const nowISO = new Date().toISOString();

  if (nextStep > 3) {
    return {
      cadenceStep: 3,
      lastCadenceSentAt: nowISO,
      cadenceStatus: 'completed'
    };
  }

  const nextStage = CADENCE_FUNNEL_STAGES.find(s => s.step === nextStep);
  const delayMs = (nextStage?.delayHours || 24) * 60 * 60 * 1000;
  const nextScheduledISO = new Date(Date.now() + delayMs).toISOString();

  return {
    cadenceStep: nextStep,
    lastCadenceSentAt: nowISO,
    nextCadenceScheduledAt: nextScheduledISO,
    cadenceStatus: 'active'
  };
}

/**
 * Verifica se um lead está elegível para envio de próxima etapa de cadência
 */
export function isLeadDueForCadence(lead: Lead): boolean {
  if (lead.cadenceStatus === 'completed' || lead.cadenceStatus === 'paused') return false;
  if ((lead as any).kanbanStage === 'Fechado/Ganho' || (lead as any).kanbanStage === 'Perdido') return false;

  if (!lead.lastCadenceSentAt) return true; // Nunca recebeu mensagem, elegível para Dia 1
  if (!lead.nextCadenceScheduledAt) return false;

  const scheduledTime = new Date(lead.nextCadenceScheduledAt).getTime();
  return Date.now() >= scheduledTime;
}
