import { getAiClient } from './aiService';

export type ObjectionType = 'INTERESSADO' | 'ACHOU_CARO' | 'JA_VENDEU' | 'TROCA' | 'REJEICAO' | 'NEUTRO';

/**
 * Objection Tagger V3.2
 * Classifica a resposta do lead via Gemini AI para triagem automática no CRM
 */
export async function tagLeadObjection(text: string): Promise<{ type: ObjectionType; summary: string }> {
  const aiClient = getAiClient();
  if (!aiClient) return { type: 'NEUTRO', summary: '' };

  try {
    const prompt = `Analise a resposta de um vendedor de caminhão/peças e classifique a intenção:
Mensagem: "${text}"

Categorias:
- INTERESSADO: Quer negociar, perguntou algo, passou telefone.
- ACHOU_CARO: Reclamou do preço ou disse que está fora da tabela.
- JA_VENDEU: Já concluiu a venda do item.
- TROCA: Perguntou se aceita troca ou veículo na volta.
- REJEICAO: Pediu para não incomodar, foi grosso ou disse "não".
- NEUTRO: Respostas curtas sem intenção clara (ex: "ok", "bom dia").

Responda apenas em JSON: { "type": "CATEGORIA", "summary": "Resumo em 3 palavras" }`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.1 }
    });

    const resultText = response.text || '';
    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const result = JSON.parse(resultText.substring(jsonStart, jsonEnd + 1));
      return {
        type: (result.type as ObjectionType) || 'NEUTRO',
        summary: result.summary || ''
      };
    }
  } catch (e) {
    console.error('[Objection Tagger] Erro:', e);
  }

  return { type: 'NEUTRO', summary: '' };
}
