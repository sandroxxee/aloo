import { Lead } from '../types';

export interface OpportunityAnalysisResult {
  isUrgent: boolean;
  isBelowMarket: boolean;
  belowMarketDiscount?: string;
  hasPriceDrop: boolean;
  isFleetRenovation: boolean;
  companyStatusSignal: 'expansao' | 'encerramento' | 'estavel';
  weakSignals: string[];
  opportunityBadges: string[];
  opportunityScoreBoost: number;
}

/**
 * ⚡ FASE 2 — OPPORTUNITY ENGINE (MOTOR DE OPORTUNIDADES COMERCIAIS)
 * Analisa e transforma anúncios em oportunidades de fechamento imediato.
 */

/**
 * 1. Radar de Urgência Extrema
 */
export function detectUrgencyRadar(text: string): { isUrgent: boolean; urgencyScore: number } {
  const lower = text.toLowerCase();
  const URGENCY_TRIGGERS = [
    'urgente', 'urgencia', 'motivo viagem', 'motivo mudanca', 'preciso vender hoje',
    'preciso vender urgente', 'liquidacao', 'liquidando', 'desapego', 'falta espaco',
    'aceito proposta imediata', 'venda rapida', 'torro', 'oportunidade unica',
    'pra fechar hoje', 'venda particular', 'aceito oferta', 'negocio fechado', 'oportunidade'
  ];

  let matches = 0;
  for (const trigger of URGENCY_TRIGGERS) {
    if (lower.includes(trigger)) matches++;
  }

  const isUrgent = matches > 0;
  const urgencyScore = Math.min(100, matches * 35);
  return { isUrgent, urgencyScore };
}

/**
 * 1.1 Radar de Sinais Fracos em Tempo Real
 * Rastreia menções sutis de urgência nos snippets (ex: mudança de estado, encerramento de filial, desocupar pátio)
 */
export function detectWeakSignalsRadar(text: string): { hasWeakSignals: boolean; weakSignals: string[]; scoreBoost: number } {
  const lower = text.toLowerCase();
  const detected: string[] = [];

  const WEAK_SIGNAL_PATTERNS = [
    { pattern: /mudan[çc]a de estado|mudar de estado|transfer[êe]ncia de estado/i, label: '⚡ Mudança de Estado' },
    { pattern: /encerramento de filial|fechando filial|desativa[çc][ãa]o de p[áa]tio|desocupar galp[ãa]o/i, label: '⚡ Encerramento de Filial / Galpão' },
    { pattern: /desocupar p[áa]tio|desocupar p[áa]tio at[ée]|prazo limite|desocupa[çc][ãa]o/i, label: '⚡ Prazo de Desocupação' },
    { pattern: /invent[áa]rio judicial|divis[ãa]o de sociedade|dissolu[çc][ãa]o|acordo trabalhista/i, label: '⚡ Inventário / Acordo de Sociedade' },
    { pattern: /liquida[çc][ãa]o de ativo|passando o ponto|devendo aluguel|fal[êe]ncia/i, label: '⚡ Liquidação de Ativo' },
    { pattern: /acerto de contas|pagar d[íi]vida|quitar/i, label: '⚡ Quitação de Dívida / Acerto' },
  ];

  for (const item of WEAK_SIGNAL_PATTERNS) {
    if (item.pattern.test(lower)) {
      detected.push(item.label);
    }
  }

  return {
    hasWeakSignals: detected.length > 0,
    weakSignals: detected,
    scoreBoost: detected.length * 15
  };
}

/**
 * 2. Radar Abaixo da FIPE / Oportunidade de Preço
 */
export function detectBelowMarketRadar(text: string, price?: string): { isBelowMarket: boolean; discountLabel?: string } {
  const lower = text.toLowerCase();
  const BELOW_MARKET_PATTERNS = [
    'abaixo da fipe', 'abaixo da tabela', 'repasse', 'repasso', 'preço de oportunidade',
    'preco de oportunidade', 'abaixo do mercado', 'preço de custo', 'torrando',
    'oportunidade de negocio', 'preço justo', 'oferta imperdivel', 'queima de estoque'
  ];

  const hasPattern = BELOW_MARKET_PATTERNS.some(p => lower.includes(p));

  // Tentar extrair percentual ou valor se mencionado no texto
  const percentMatch = lower.match(/(\d{1,2})%\s*abaixo/i) || lower.match(/abaixo\s*(\d{1,2})%/i);
  let discountLabel: string | undefined;

  if (percentMatch) {
    discountLabel = `${percentMatch[1]}% abaixo da FIPE`;
  } else if (lower.includes('abaixo da fipe')) {
    discountLabel = 'Abaixo da Tabela FIPE';
  } else if (lower.includes('repasse')) {
    discountLabel = 'Preço de Repasse';
  }

  return { isBelowMarket: hasPattern, discountLabel };
}

/**
 * 3. Radar de Renovação de Frota
 */
export function detectFleetRenovationRadar(text: string, sellerType?: string): boolean {
  const lower = text.toLowerCase();
  const FLEET_TRIGGERS = [
    'renovacao de frota', 'renovação de frota', 'venda de frota', 'substituindo veiculos',
    'substituindo caminhões', 'troca de frota', 'chegaram novos caminhoes',
    'desmobilizacao', 'desmobilização', 'desfazendo da frota', 'frota propria'
  ];

  const hasTrigger = FLEET_TRIGGERS.some(t => lower.includes(t));
  const isCorporateSeller = sellerType === 'Transportadora / Frotista';

  return hasTrigger || (isCorporateSeller && (lower.includes('venda') || lower.includes('substituição')));
}

/**
 * 4. Radar Empresarial (Empresas Crescendo em Expansão vs Encerrando Atividades)
 */
export function detectCompanyStatusSignal(text: string): 'expansao' | 'encerramento' | 'estavel' {
  const lower = text.toLowerCase();
  
  const CLOSING_TRIGGERS = [
    'encerrando atividades', 'fechando empresa', 'mudanca de ramo', 'falencia',
    'encerramento de operacao', 'desfazendo da empresa', 'liquidação total'
  ];

  const EXPANSION_TRIGGERS = [
    'expansao da frota', 'comprando lotes', 'novas rotas', 'ampliacao da frota',
    'contratando motoristas', 'aumento de frota', 'frota nova'
  ];

  if (CLOSING_TRIGGERS.some(t => lower.includes(t))) return 'encerramento';
  if (EXPANSION_TRIGGERS.some(t => lower.includes(t))) return 'expansao';

  return 'estavel';
}

/**
 * 5. Avaliador Integrado do Opportunity Engine (FASE 2)
 */
export function evaluateOpportunitySignals(lead: Partial<Lead>): OpportunityAnalysisResult {
  const fullContext = [
    lead.snippetContext || '',
    lead.item || '',
    lead.query || '',
    lead.companyName || '',
    lead.sellerFullName || '',
    lead.qualification || ''
  ].join(' ');

  const urgencyRes = detectUrgencyRadar(fullContext);
  const weakSignalsRes = detectWeakSignalsRadar(fullContext);
  const belowMarketRes = detectBelowMarketRadar(fullContext, lead.price);
  const isFleet = detectFleetRenovationRadar(fullContext, lead.sellerType);
  const companySignal = detectCompanyStatusSignal(fullContext);

  // Verificar se há registro de queda de preço no histórico do lead
  let hasPriceDrop = false;
  if (lead.historyChanges && lead.historyChanges.length > 0) {
    hasPriceDrop = lead.historyChanges.some(c => c.field === 'price' && c.importance === 'high');
  }

  const badges: string[] = [];
  let scoreBoost = 0;

  if (urgencyRes.isUrgent) {
    badges.push('⚡ Prioridade Operacional');
    scoreBoost += 15;
  }

  if (weakSignalsRes.hasWeakSignals) {
    badges.push(...weakSignalsRes.weakSignals);
    scoreBoost += weakSignalsRes.scoreBoost;
  }

  if (belowMarketRes.isBelowMarket) {
    badges.push(belowMarketRes.discountLabel || '📊 Otimização de Custo');
    scoreBoost += 20;
  }

  if (hasPriceDrop) {
    badges.push('📉 Reajuste Estratégico');
    scoreBoost += 15;
  }

  if (isFleet) {
    badges.push('📦 Atualização de Ativos');
    scoreBoost += 15;
  }

  if (companySignal === 'encerramento') {
    badges.push('⚠️ Transição Estrutural');
    scoreBoost += 15;
  } else if (companySignal === 'expansao') {
    badges.push('🚀 Expansão de Mercado');
    scoreBoost += 10;
  }

  if (lead.intent === 'Compra') {
    badges.push('🛒 Demanda Ativa');
    scoreBoost += 10;
  }

  return {
    isUrgent: urgencyRes.isUrgent || weakSignalsRes.hasWeakSignals,
    isBelowMarket: belowMarketRes.isBelowMarket,
    belowMarketDiscount: belowMarketRes.discountLabel,
    hasPriceDrop,
    isFleetRenovation: isFleet,
    companyStatusSignal: companySignal,
    weakSignals: weakSignalsRes.weakSignals,
    opportunityBadges: badges,
    opportunityScoreBoost: scoreBoost
  };
}

/**
 * Enriquece um Lead com os sinais calculados pelo Opportunity Engine sem alterar a UX.
 */
export function enrichLeadWithOpportunitySignals(lead: Lead): Lead {
  const opp = evaluateOpportunitySignals(lead);

  if (opp.opportunityBadges.length > 0) {
    console.log(`[Opportunity Engine] Lead "${lead.item}" qualificado com: ${opp.opportunityBadges.join(', ')}`);
  }

  // Atualizar score comercial levando em consideração o impulso da oportunidade
  const baseScore = lead.commercialScore || 50;
  const updatedScore = Math.min(100, Math.max(baseScore, baseScore + opp.opportunityScoreBoost));

  return {
    ...lead,
    isUrgent: opp.isUrgent || lead.isUrgent,
    isBelowMarket: opp.isBelowMarket || lead.isBelowMarket,
    belowMarketDiscount: opp.belowMarketDiscount || lead.belowMarketDiscount,
    hasPriceDrop: opp.hasPriceDrop || lead.hasPriceDrop,
    isFleetRenovation: opp.isFleetRenovation || lead.isFleetRenovation,
    companyStatusSignal: opp.companyStatusSignal || lead.companyStatusSignal,
    weakSignals: Array.from(new Set([...(lead.weakSignals || []), ...opp.weakSignals])),
    opportunityBadges: Array.from(new Set([...(lead.opportunityBadges || []), ...opp.opportunityBadges])),
    commercialScore: updatedScore
  };
}
