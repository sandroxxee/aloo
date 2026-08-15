import { resolveLid } from './lidResolver';
import { getAiClient } from './aiService';
import { Lead } from '../types';

/**
 * Lead Enrichment Service V3.2
 * Executa 2 níveis de pesquisa para leads com poucas informações
 */
export async function enrichAndQualifyLead(lead: Lead): Promise<Lead> {
  let enrichedLead = { ...lead };
  const isIncomplete = !lead.name || lead.name.toLowerCase().includes('sem nome') || !lead.item;

  if (!isIncomplete) return lead;

  console.log(`[Enrichment] Iniciando pesquisa profunda para lead: ${lead.phone}`);

  // ETAPA 1: Validação de Perfil & Foto (WhatsApp Intelligence)
  try {
    const info = await resolveLid(lead.phone);
    if (info.exists) {
      // Usando opportunityBadges para marcar validação V3.2
      enrichedLead.opportunityBadges = [...(enrichedLead.opportunityBadges || []), 'VALIDADO_WHATSAPP'];
      if (info.lid) {
        enrichedLead.opportunityBadges.push('LID_VERIFICADO');
      }
    }
  } catch (e) {
    console.warn('[Enrichment] Falha na Etapa 1:', e);
  }

  // ETAPA 2: Pesquisa Semântica via IA (Qualificação de Nicho)
  const aiClient = getAiClient();
  if (aiClient) {
    try {
      const prompt = `Analise este lead de venda de ativos e responda com CERTEZA ABSOLUTA.
Se não tiver certeza sobre o nome, deixe o campo "name" como null. NÃO CHUTE.
Item: ${enrichedLead.item || 'N/A'}
Snippet Context: ${enrichedLead.snippetContext || 'N/A'}

Tarefa:
1. Identifique o NOME REAL do vendedor ou empresa (Apenas se citado no texto).
2. Identifique o NICHO (Transporte, Construção, Agro, Particular, Lojista).
3. Atribua um SCORE de 0 a 100 baseado no potencial comercial (urgência, clareza).

Responda apenas em JSON: { "name": "...", "niche": "...", "score": 0 }`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.1 }
      });

      const text = response.text || '';
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const result = JSON.parse(text.substring(jsonStart, jsonEnd + 1) || '{}');
        
        const genericNames = ['vendedor', 'anunciante', 'particular', 'proprietario', 'proprietário', 'contato', 'desconhecido', 'perfil', 'usuario', 'usuário', 'null'];
        
        if (result.name && isIncomplete) {
          const lowerName = result.name.toLowerCase().trim();
          if (!genericNames.includes(lowerName)) {
            enrichedLead.name = result.name;
            enrichedLead.sellerFullName = result.name;
          }
        }
        if (result.niche) enrichedLead.segment = result.niche;
        if (result.score) {
          enrichedLead.aiQualificationScore = result.score;
          enrichedLead.commercialScore = result.score;
        }
      }

    } catch (e) {
      console.warn('[Enrichment] Falha na Etapa 2:', e);
    }
  }

  return enrichedLead;
}
