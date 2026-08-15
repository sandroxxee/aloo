import { Lead } from '../types';

export interface ObjectionScenario {
  id: string;
  title: string;
  description: string;
  category: 'preco' | 'pagamento' | 'concorrencia' | 'repasse' | 'geral';
  defaultScript: (lead: Lead) => string;
}

export const COMMON_OBJECTION_SCENARIOS: ObjectionScenario[] = [
  {
    id: 'preco_alto',
    title: '💰 "Preço tá muito alto / Não baixo um centavo"',
    description: 'Vendedor irredutível quanto ao preço de tabela ou pedido inicial.',
    category: 'preco',
    defaultScript: (lead: Lead) => {
      const name = lead.sellerFullName || lead.name || 'amigo';
      const item = lead.item || 'o equipamento';
      const price = lead.price ? `no valor de ${lead.price}` : '';
      return `Entendo perfeitamente, ${name}. O mercado de ${item} está bem aquecido, mas considerando que nosso pagamento é 100% à vista e sem burocracia de financiamento, conseguimos fechar hoje se ajustarmos uma margem de repasse justa para ambos. Qual a sua melhor proposta para liquidação imediata?`;
    }
  },
  {
    id: 'outro_interessado',
    title: '⚡ "Já tem outro comprador vindo ver hoje"',
    description: 'Pressão de concorrência ou gatilho de urgência por parte do vendedor.',
    category: 'concorrencia',
    defaultScript: (lead: Lead) => {
      const name = lead.sellerFullName || lead.name || 'amigo';
      const item = lead.item || 'o veículo';
      return `Ótimo saber, ${name}! Se o outro interessado não concretizar com PIX na hora, saiba que nós cobrimos a proposta à vista com transferência no mesmo dia para desmobilizar ${item}. Me avise se o negócio não fechar que já rodamos o contrato!`;
    }
  },
  {
    id: 'nao_aceita_repasse',
    title: '🚛 "Não vendo para revenda / Só particular"',
    description: 'Resistência em negociar com frotistas, intermediadores ou repassadores.',
    category: 'repasse',
    defaultScript: (lead: Lead) => {
      const name = lead.sellerFullName || lead.name || 'amigo';
      return `Compreendo, ${name}. Na verdade nós não somos intermediadores informais — somos compradores diretos com frota própria e frota parceira. A vantagem para você é garantia total de pagamento, transferência legal imediata do documento e sem dor de cabeça pós-venda. Vamos conversar?`;
    }
  },
  {
    id: 'pagamento_prazo',
    title: '📑 "Só vendo com 50% de entrada e parcelado"',
    description: 'Negociação de condições de parcelamento ou prazo.',
    category: 'pagamento',
    defaultScript: (lead: Lead) => {
      const name = lead.sellerFullName || lead.name || 'amigo';
      const item = lead.item || 'o bem';
      return `${name}, para pagamento parcelado precisamos ajustar as garantias cartorárias. No entanto, se você preferir receber 100% à vista no PIX esta semana para girar seu caixa sobre ${item}, posso liberar o pagamento total imediato com um pequeno desconto comercial. O que prefere?`;
    }
  },
  {
    id: 'contraproposta_aberta',
    title: '🎯 "Faz sua proposta de fechamento"',
    description: 'Vendedor pediu uma oferta objetiva de compra.',
    category: 'geral',
    defaultScript: (lead: Lead) => {
      const name = lead.sellerFullName || lead.name || 'amigo';
      const item = lead.item || 'o item';
      return `${name}, analisando o histórico do mercado e o estado de ${item}, nossa oferta firme para fechamento e pagamento hoje no PIX com retira por nossa conta é immediate. Conseguimos avançar nessa condição?`;
    }
  }
];

/**
 * Analisa a probabilidade de fechamento e define a estratégia tática
 */
export async function analyzeClosingPotential(lead: Lead): Promise<{
  probability: number;
  strategy: string;
  reasoning: string;
}> {
  const prompt = `Analise este lead comercial de caminhões/máquinas e determine:
1. Probabilidade de fechar negócio hoje (0 a 100).
2. Estratégia recomendada (Agressiva, Diplomática, Recuo Estratégico ou Urgência).
3. Breve justificativa técnica.

Lead: ${JSON.stringify({
    item: lead.item,
    price: lead.price,
    badges: lead.opportunityBadges,
    status: lead.outreachStatus,
    score: lead.commercialScore
  })}

Responda apenas em JSON: { "probability": 0, "strategy": "...", "reasoning": "..." }`;

  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: 'gemini-1.5-flash' })
    });
    
    if (response.ok) {
      const data = await response.json();
      return JSON.parse(data.text);
    }
  } catch (e) {
    console.error('Erro na análise de potencial:', e);
  }

  return {
    probability: lead.commercialScore || 50,
    strategy: 'Diplomática',
    reasoning: 'Baseado no score comercial padrão do sistema.'
  };
}

/**
 * Gera uma resposta tática customizada usando Gemini 1.5 Flash para uma objeção de venda
 */
export async function generateAiNegotiationScript(
  lead: Lead,
  objectionTitle: string,
  userNotes?: string
): Promise<string> {
  const name = lead.sellerFullName || lead.name || 'vendedor';
  const item = lead.item || 'equipamento/veículo';
  const price = lead.price || 'preço a combinar';
  const city = lead.city ? `em ${lead.city}` : '';
  const badges = lead.opportunityBadges?.join(', ') || 'Nenhum rótulo';

  const prompt = `Aja como um especialista sênior em negociação comercial de compra e venda de frotas, caminhões, máquinas e veículos pesados no Brasil.
Elabore uma resposta tática para ser enviada no WhatsApp contra a seguinte objeção do vendedor:

OBJEÇÃO DO VENDEDOR: "${objectionTitle}"
DADOS DO ANÚNCIO:
- Vendedor: ${name}
- Item: ${item} (${price}) ${city}
- Rótulos de Oportunidade: ${badges}
- Notas adicionais: ${userNotes || 'Nenhuma'}

REGRAS DA MENSAGEM:
1. Mantenha tom extremamente profissional, respeitoso, persuasivo e focado em pagamento à vista no PIX.
2. Use linguagem comercial brasileira de alto impacto sem parecer mensagem robótica de IA.
3. Termine com uma pergunta fechada de chamada para ação imediata.
4. Tamanho máximo: 3 a 4 frases curtas.`;

  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model: 'gemini-1.5-flash' })
    });

    if (response.ok) {
      const data = await response.json();
      return data.text || data.result || COMMON_OBJECTION_SCENARIOS[0].defaultScript(lead);
    }
  } catch (e) {
    console.warn('aiNegotiationCopilot: Erro ao chamar IA Gemini, usando script de contingência:', e);
  }

  // Fallback
  const scenario = COMMON_OBJECTION_SCENARIOS.find(s => s.title.includes(objectionTitle)) || COMMON_OBJECTION_SCENARIOS[0];
  return scenario.defaultScript(lead);
}
