import { Lead, LeadIntent, LeadQualification } from '../types';
import { evaluateOpportunitySignals } from './opportunityEngine';

/**
 * V3.1 - Motor de Qualificação Ponderado
 * Calcula a probabilidade real de conversão com base em sinais técnicos e geográficos.
 */
export function analyzeLead(lead: Partial<Lead>): { score: number; summary: string } {
  let score = 50; // Score base neutro
  const ctx = (lead.snippetContext || '').toLowerCase();
  
  // 1. Sinais Positivos de Conversão (V3.1 Weights)
  if (lead.intent === 'Venda') score += 10;
  
  // Queda de Preço >= 10% (Radar V3.1)
  if (lead.hasPriceDrop) score += 50; 
  
  // CNPJ Ativo (+30)
  const isCnpj = lead.document && lead.document.replace(/\D/g, '').length === 14;
  if (isCnpj) score += 30;

  // 2. Sinais Negativos / Redutores (V3.1 Weights)
  
  // Sem Nome (-50)
  const hasNoName = !lead.name || lead.name.toLowerCase().includes('sem nome') || lead.name.toLowerCase().includes('desconhecido');
  if (hasNoName) score -= 50;

  // Sem Foto de Perfil (-30)
  if (lead.hasProfilePic === false) score -= 30;

  // Distância > 600km de Xanxerê (-40)
  // Nota: Xanxerê/SC é o centro operacional de referência do usuário
  if (lead.distanceFromXanxereKm && lead.distanceFromXanxereKm > 600) score -= 40;

  // 3. Radares de Oportunidade Legados
  const opp = evaluateOpportunitySignals({
    item: lead.item || '',
    snippetContext: lead.snippetContext,
    query: lead.query,
    qualification: lead.qualification,
    intent: lead.intent
  });

  score += opp.opportunityScoreBoost;
  
  // Limites de segurança
  score = Math.min(100, Math.max(10, score));

  const badgeText = opp.opportunityBadges.length > 0 ? ` [Radares: ${opp.opportunityBadges.join(', ')}]` : '';
  const summary = `Lead qualificado via V3.1 (Weighted Engine). Perfil: ${lead.intent || 'Geral'}.${badgeText} Score final: ${score}%.`;

  return { score, summary };
}

