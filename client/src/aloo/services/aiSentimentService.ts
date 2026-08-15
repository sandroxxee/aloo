import { getAiClient } from './aiService.js';

export interface SentimentResult {
  category: 'INTERESSADO' | 'PEDIU_PRECO' | 'QUER_TROCA' | 'OBJECAO' | 'NAO_QUER';
  label: string;
  confidence: number;
  summary: string;
  suggestedReply: string;
}

export async function analyzeLeadResponseSentiment(
  leadText: string, 
  leadName?: string, 
  item?: string
): Promise<SentimentResult> {
  const defaultResult: SentimentResult = {
    category: 'INTERESSADO',
    label: '🟢 Interessado',
    confidence: 90,
    summary: 'Lead respondeu à abordagem no WhatsApp',
    suggestedReply: 'Perfeito! Podemos conversar rapidamente sobre os detalhes do negócio?'
  };

  try {
    const aiClient = getAiClient();
    if (!aiClient) return defaultResult;

    const prompt = `Analise a resposta recebida de um lead no WhatsApp para o mercado de veículos pesados/peças:
Lead: ${leadName || 'Contato'}
Item: ${item || 'Veículo/Peça'}
Resposta do Lead: "${leadText}"

Categorize com precisão em uma das seguintes categorias:
- "INTERESSADO" (Quer fechar, ver o veículo ou tem interesse direto)
- "PEDIU_PRECO" (Quer saber menor valor, desconto ou forma de pagamento)
- "QUER_TROCA" (Perguntou se aceita troca, repasse ou veículo menor)
- "OBJECAO" (Tem dúvida técnica, documentação, mecânica ou preço achou alto)
- "NAO_QUER" (Ja vendeu, não tem interesse ou pediu para tirar da lista)

Responda ESTRITAMENTE em formato JSON puro sem marcadores markdown:
{
  "category": "INTERESSADO|PEDIU_PRECO|QUER_TROCA|OBJECAO|NAO_QUER",
  "label": "🟢 Interessado | 💰 Pediu Desconto | 🔄 Quer Troca | ❓ Objeção | 🔴 Não Quer",
  "confidence": 95,
  "summary": "Resumo de 1 frase do sentimento",
  "suggestedReply": "Sugestão de resposta curta no WhatsApp para avançar a venda"
}`;

    const interaction = await aiClient.interactions.create({
      model: 'gemini-1.5-flash',
      input: prompt
    });

    const resultText = interaction.output_text || '';
    const jsonStart = resultText.indexOf('{');
    const jsonEnd = resultText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const result = JSON.parse(resultText.substring(jsonStart, jsonEnd + 1));
      return {
        category: result.category || 'INTERESSADO',
        label: result.label || '🟢 Interessado',
        confidence: result.confidence || 95,
        summary: result.summary || '',
        suggestedReply: result.suggestedReply || ''
      };
    }
  } catch (e) {
    console.error('[Sentiment Service] Erro:', e);
  }

  return defaultResult;
}
