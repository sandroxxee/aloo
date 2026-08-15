import { Lead } from '../types';

export interface CommercialInsight {
  title: string;
  description: string;
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  suggestedAction: string;
}

/**
 * Agente Diretor Comercial (AI Agent V3.5)
 * Analisa a base de leads e gera insights táticos de fechamento
 * Alterado para chamar a API no servidor para segurança e estabilidade.
 */
export async function generateCommercialBriefing(leads: Lead[]): Promise<CommercialInsight[]> {
  if (leads.length === 0) return [];

  try {
    const response = await fetch('/api/ai/commercial-briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na API: ${response.status}`);
    }

    const data = await response.json();
    return data.insights || [];
  } catch (e) {
    console.error('[Commercial Agent Proxy] Erro:', e);
  }

  return [];
}
