import { Lead, LeadCategory } from '../types';

export type { LeadCategory };

/**
 * Classifies a lead into one of four core AI business categories:
 * - 'Peças': Motor, câmbio, peças pesadas, turbina, pneu, desmanche, etc.
 * - 'Implementos': Carreta, caçamba, baú, sider, prancha, bitrem, etc.
 * - 'Manutenção': Oficina, retífica, guincho, mecânica, elétrica, etc.
 * - 'Caminhões': Cavalo mecânico, truck, toco, marcas/modelos de caminhão (Volvo, Scania, MB, VW, etc.)
 */
export function classifyLeadCategory(lead: Partial<Lead>): LeadCategory {
  if (lead.category && ['Caminhões', 'Peças', 'Implementos', 'Manutenção', 'Pneus', 'Motores', 'Serviços', 'Logística'].includes(lead.category)) {
    return lead.category as LeadCategory;
  }

  const textToScan = [
    lead.item || '',
    lead.query || '',
    lead.snippetContext || '',
    lead.companyName || '',
    lead.sellerType || '',
    lead.aiSummary || '',
    lead.name || ''
  ].join(' ').toLowerCase();

  // 1. Check Pneus (Tires)
  const pneusKeywords = ['pneu', 'pneus', 'borracharia', 'recapagem', 'banda de rodagem', 'michelin', 'bridgestone', 'firestone', 'goodyear'];
  if (pneusKeywords.some(kw => textToScan.includes(kw))) {
    return 'Pneus';
  }

  // 2. Check Motores (Engines)
  const motoresKeywords = ['motor', 'motores', 'bloco do motor', 'cabeçote', 'cabecote', 'virabrequim', 'comando', 'injetora', 'turbina', 'biturbo', 'cummins', 'scania dc', 'volvo d13', 'om 457'];
  if (motoresKeywords.some(kw => textToScan.includes(kw))) {
    return 'Motores';
  }

  // 3. Check Serviços (Services)
  const servicosKeywords = ['serviço', 'servico', 'agenciamento', 'consórcio', 'consorcio', 'financiamento', 'seguro', 'rastreamento', 'telemetria', 'despachante', 'vistoria'];
  if (servicosKeywords.some(kw => textToScan.includes(kw))) {
    return 'Serviços';
  }

  // 4. Check Logística (Freight & Logistics)
  const logisticaKeywords = ['frete', 'fretes', 'carga', 'cargas', 'transporte', 'transportadora', 'rota', 'logística', 'logistica', 'fretamento', 'embarque'];
  if (logisticaKeywords.some(kw => textToScan.includes(kw))) {
    return 'Logística';
  }

  // 5. Check Peças (Parts & Components)
  const pecasKeywords = [
    'peça', 'peca', 'peças', 'pecas', 'câmbio', 'cambio', 'caixa de marcha',
    'diferencial', 'freio', 'embreagem', 'injetor', 'bico', 'bomba', 'radiador',
    'filtro', 'correia', 'amortecedor', 'suspensão', 'suspensao',
    'desmanche', 'sucata', 'auto peças', 'autopeças', 'acessório', 'acessorio',
    'eixo', 'mola', 'cardam', 'cardan', 'farol', 'parachoque', 'para-choque'
  ];
  if (pecasKeywords.some(kw => textToScan.includes(kw))) {
    return 'Peças';
  }

  // 6. Check Implementos (Trailers & Implements)
  const implementosKeywords = [
    'carreta', 'caçamba', 'cacamba', 'baú', 'bau', 'sider', 'graneleiro', 'prancha',
    'bitrem', 'rodotrem', 'tritrem', 'dolley', 'reboque', 'semirreboque', 'semireboque',
    'basculante', 'frigorífico', 'frigorifico', 'furgão', 'furgao', 'vanderléia', 'vanderleia',
    'porta-container', 'porta container', 'tanque inox', 'silo', 'implemento', 'implementos',
    'randon', 'facchini', 'guerra', 'noma', 'rossetti', 'librelato', 'pastre'
  ];
  if (implementosKeywords.some(kw => textToScan.includes(kw))) {
    return 'Implementos';
  }

  // 7. Check Manutenção (Maintenance, Repairs)
  const manutencaoKeywords = [
    'oficina', 'mecânica', 'mecanica', 'retífica', 'retifica', 'alinhamento',
    'balanceamento', 'guincho', 'socorro', 'elétrica', 'eletrica', 'pintura',
    'funilaria', 'lanternagem', 'tornearia', 'manutenção', 'manutencao', 'revisão',
    'revisao', 'inspeção', 'inspecao', 'troca de óleo', 'troca de oleo', 'lavagem', 'reparo',
    'socorro 24h', 'assistência', 'assistencia'
  ];
  if (manutencaoKeywords.some(kw => textToScan.includes(kw))) {
    return 'Manutenção';
  }

  // 8. Default: Caminhões (Trucks & Vehicles)
  return 'Caminhões';
}
