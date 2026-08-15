import { 
  IntelligentTerm, 
  NicheCatalogItem, 
  NegativeTermItem, 
  SynonymGroup, 
  TermDiscoveryItem, 
  SimulationResult,
  AiGeneratorMode
} from '../types/keywordIntelligence';
import { BRAZIL_STATES } from './states';

const STORAGE_KEY_INTELLIGENT_TERMS = 'intel_terms_db_v2';
const STORAGE_KEY_NEGATIVE_TERMS = 'intel_negative_terms_v2';
const STORAGE_KEY_DISCOVERIES = 'intel_discoveries_v2';

/**
 * 1. Score Intelligent Calculation Algorithm (0 to 100)
 */
export function calculateTermScore(term: Partial<IntelligentTerm>): number {
  const leads = term.leadsFound || 0;
  const validPhones = term.validPhonesCount || 0;
  const whatsApps = term.whatsAppsCount || 0;
  const execs = term.executionCount || 0;
  const conversionRate = term.conversionRate || 0;

  if (execs === 0) {
    // Base initial score based on term quality/specificity
    const kw = (term.keyword || '').toLowerCase();
    let base = 65;
    if (kw.includes('whatsapp') || kw.includes('ddd')) base += 15;
    if (kw.includes('vendo') || kw.includes('compro') || kw.includes('oferta')) base += 10;
    if (kw.length > 25) base += 5; // Long tail bonus
    return Math.min(100, base);
  }

  // Calculate yield ratio
  const phoneYield = leads > 0 ? (validPhones / leads) * 50 : 0;
  const waYield = validPhones > 0 ? (whatsApps / validPhones) * 30 : 0;
  const conversionFactor = Math.min(20, conversionRate * 0.4);

  let totalScore = Math.round(phoneYield + waYield + conversionFactor);

  // Penalize high execution with 0 leads
  if (execs > 5 && leads === 0) {
    totalScore = Math.max(5, totalScore - 40);
  }

  return Math.min(100, Math.max(0, totalScore));
}

/**
 * 2. National Niches Catalog (Banco Nacional de Nichos)
 */
export const NATIONAL_NICHES_CATALOG: NicheCatalogItem[] = [
  {
    id: 'niche_caminhoes_pesados',
    title: 'Caminhões Pesados & Cavalos Mecânicos',
    category: 'Veículos Pesados',
    subcategory: 'Cavalos Mecânicos 6x2 / 6x4',
    icon: '🚛',
    description: 'Scania, Volvo FH, Mercedes Actros/Axor, DAF XF e Iveco Stralis seminovos e usados.',
    mainKeywords: [
      'vendo scania r450 6x2',
      'volvo fh 540 seminovo ddd 11',
      'mercedes actros 2651 a venda',
      'daf xf 530 6x4 frotista',
      'iveco hi-way 440 oferta',
      'vw meteor 29.520 vendo whatsapp'
    ],
    secondaryKeywords: [
      'renovacao frota cavalos mecanicos',
      'cavalo mecanico teto alto engatado',
      'scania r440 ano 2019 particular'
    ],
    synonyms: ['cavalo mecanico', 'trator rodoviario', 'caminhao pesado', 'bicuda'],
    negativeKeywords: ['brinquedo', 'miniatura', 'rc', 'jogo', 'euro truck'],
    priorityCities: ['São Paulo', 'Curitiba', 'Campinas', 'Rondonópolis', 'Itajaí', 'Uberlândia'],
    priorityStates: ['SP', 'PR', 'SC', 'MG', 'MT', 'GO']
  },
  {
    id: 'niche_pecas_transmissao',
    title: 'Peças & Transmissões Pesadas',
    category: 'Peças & Componentes',
    subcategory: 'Câmbios, Motores e Diferenciais',
    icon: '⚙️',
    description: 'Caixas de câmbio ZF 16S, Eaton, motores MWM/Cummins e diferenciais Meritor/Rockwell.',
    mainKeywords: [
      'oferta cambio zf 16s whatsapp',
      'motor cummins isr 6 cilindros vendo',
      'diferencial meritor reduzido scania',
      'caixa eaton 13 marchas volvo',
      'modulo cambio i-shift volvo fh',
      'desmanche pecas pesadas sp'
    ],
    secondaryKeywords: [
      'bomba injetora bosch scania 113',
      'turbina holset caminhao mercedes',
      'embreagem zf reconstruida pronta entrega'
    ],
    synonyms: ['transmissão', 'caixa de marcha', 'bloco motor', 'diferencial'],
    negativeKeywords: ['pdf', 'manual de reparo', 'curso mecanico', 'esquema eletrico'],
    priorityCities: ['Guarulhos', 'Cascavel', 'Joinville', 'Ribeirão Preto', 'Caxias do Sul'],
    priorityStates: ['SP', 'PR', 'RS', 'SC', 'MG']
  },
  {
    id: 'niche_implementos_rodoviarios',
    title: 'Implementos Rodoviários & Carretas',
    category: 'Implementos',
    subcategory: 'Caçambas, Baús e Graneleiros',
    icon: '📦',
    description: 'Randon, Facchini, Noma, Librelato - Bicaçambas, Siders, Pranchas e Baús refrigerados.',
    mainKeywords: [
      'venda carreta baú randon',
      'bicacamba facchini 25m3 oferta',
      'carreta sider librelato 3 eixos',
      'prancha 4 eixos pesada vendo',
      'carreta graneleira noma ano 2021',
      'bau refrigerado frigorifico thermoking'
    ],
    secondaryKeywords: [
      'rodotrem caçamba basculante',
      'carreta tanque inox transporte leite',
      'porta container 40 pés semireboque'
    ],
    synonyms: ['semireboque', 'implemento', 'carreta', 'reboque'],
    negativeKeywords: ['vaga motorista', 'aluguel por hora', 'frete grátis'],
    priorityCities: ['Chapeco', 'Maringá', 'Cuiabá', 'Bauru', 'Passo Fundo'],
    priorityStates: ['PR', 'SC', 'RS', 'MT', 'SP']
  },
  {
    id: 'niche_maquinas_linha_amarela',
    title: 'Máquinas Agrícolas & Linha Amarela',
    category: 'Máquinas',
    subcategory: 'Escavadeiras, Tratores e Pás Carregadeiras',
    icon: '🚜',
    description: 'Caterpillar, JCB, New Holland, John Deere, Case - Equipamentos para mineração e agro.',
    mainKeywords: [
      'escavadeira caterpillar 320 a venda',
      'pa carregadeira jcb 422zx vendo',
      'trator john deere 6110j seminovo',
      'retroescavadeira case 580n whatsapp',
      'colheitadeira new holland cr 7.90',
      'motoniveladora cat 120k pronta entrega'
    ],
    secondaryKeywords: [
      'mini escavadeira bobcat e20',
      'trator de esteira cat d6n',
      'pulverizador jacto uniport 3030'
    ],
    synonyms: ['equipamento amarelo', 'trator', 'pá carregadeira', 'retro'],
    negativeKeywords: ['jogo de fazenda', 'simulator', 'brinquedo de plástico'],
    priorityCities: ['Sorriso', 'Rio Verde', 'Barreiras', 'Dourados', 'Uberaba'],
    priorityStates: ['MT', 'GO', 'BA', 'MS', 'MG', 'PR']
  },
  {
    id: 'niche_frotas_leiloes',
    title: 'Renovação de Frota & Leilões',
    category: 'Oportunidades Especiais',
    subcategory: 'Desmobilização de Empresas & Salvados',
    icon: '🏷️',
    description: 'Caminhões e frota com preço abaixo da tabela para repasse e revenda rápida.',
    mainKeywords: [
      'desmobilizacao frota caminhões frotista',
      'repasse caminhao abaixo da tabela fipe',
      'caminhao recuperado de leilao financiado',
      'venda em lote caminhões scania volvo',
      'frota transportadora renovacao urgente'
    ],
    secondaryKeywords: [
      'caminhao sinustrado com doc ok',
      'lote de peças desmanche credenciado'
    ],
    synonyms: ['repasse', 'barganha', 'desmobilização', 'leilão'],
    negativeKeywords: ['como participar de leilao', 'advogado leilao', 'processo'],
    priorityCities: ['São Paulo', 'Belo Horizonte', 'Porto Alegre', 'Goiânia', 'Salvador'],
    priorityStates: ['SP', 'MG', 'RS', 'GO', 'BA']
  },
  {
    id: 'niche_guinchos_socorro',
    title: 'Guinchos & Serviços Rodoviários Heavy Duty',
    category: 'Serviços',
    subcategory: 'Guinchos Plataforma & Lança Pesada',
    icon: '🛞',
    description: 'Guinchos plataforma 8m, lança pesada para caminhões e socorro rodoviário 24h.',
    mainKeywords: [
      'vendo guincho plataforma 8m mercedes',
      'guincho lanca pesada scania a venda',
      'vw delivery guincho plataforma ddd 11',
      'guincho plataforma auto socorro 24h'
    ],
    secondaryKeywords: [
      'plataforma hidraulica para guincho',
      'redutor hidraulico para guincho pesados'
    ],
    synonyms: ['auto socorro', 'plataforma hidráulica', 'lança pesada'],
    negativeKeywords: ['numero de emergência', 'telefone 0800 seguro'],
    priorityCities: ['Campinas', 'Guarulhos', 'Curitiba', 'Santos', 'Vitória'],
    priorityStates: ['SP', 'PR', 'RJ', 'ES']
  }
];

/**
 * 3. Default Negative Terms Catalog (Banco Inteligente de Termos Negativos)
 */
export const DEFAULT_NEGATIVE_TERMS: NegativeTermItem[] = [
  { id: 'neg_1', term: 'pdf', category: 'Manuais/PDF', source: 'Auto-Aprendido', createdAt: new Date().toISOString(), occurrencesBlocked: 142, status: 'Ativo' },
  { id: 'neg_2', term: 'vaga de emprego', category: 'Empregos', source: 'Auto-Aprendido', createdAt: new Date().toISOString(), occurrencesBlocked: 310, status: 'Ativo' },
  { id: 'neg_3', term: 'trabalhe conosco', category: 'Empregos', source: 'Auto-Aprendido', createdAt: new Date().toISOString(), occurrencesBlocked: 198, status: 'Ativo' },
  { id: 'neg_4', term: 'curriculum', category: 'Empregos', source: 'Auto-Aprendido', createdAt: new Date().toISOString(), occurrencesBlocked: 85, status: 'Ativo' },
  { id: 'neg_5', term: 'manual de instrucao', category: 'Manuais/PDF', source: 'Manual', createdAt: new Date().toISOString(), occurrencesBlocked: 64, status: 'Ativo' },
  { id: 'neg_6', term: 'jogo euro truck', category: 'Outros', source: 'Auto-Aprendido', createdAt: new Date().toISOString(), occurrencesBlocked: 420, status: 'Ativo' },
  { id: 'neg_7', term: 'tabela fipe apenas consulta', category: 'Notícias/Fipe', source: 'Manual', createdAt: new Date().toISOString(), occurrencesBlocked: 112, status: 'Ativo' },
  { id: 'neg_8', term: 'desenho para colorir', category: 'Outros', source: 'Auto-Aprendido', createdAt: new Date().toISOString(), occurrencesBlocked: 77, status: 'Ativo' },
  { id: 'neg_9', term: 'miniatura 1/43', category: 'Outros', source: 'Auto-Aprendido', createdAt: new Date().toISOString(), occurrencesBlocked: 215, status: 'Ativo' },
  { id: 'neg_10', term: 'curso online gratis', category: 'Cursos/Aulas', source: 'Manual', createdAt: new Date().toISOString(), occurrencesBlocked: 94, status: 'Ativo' }
];

/**
 * 4. Default Synonyms Catalog (Banco de Sinônimos)
 */
export const DEFAULT_SYNONYMS: SynonymGroup[] = [
  { id: 'syn_1', canonicalTerm: 'Scania R450', synonyms: ['R450', 'Scania 450', 'R-450', 'Scania Streamline 450'], category: 'Caminhões' },
  { id: 'syn_2', canonicalTerm: 'Volvo FH 540', synonyms: ['FH540', 'FH 540 Globetrotter', 'Volvo 540 6x4', 'FH-540'], category: 'Caminhões' },
  { id: 'syn_3', canonicalTerm: 'Bicaçamba', synonyms: ['Bi-caçamba', 'Carreta Caçamba Dupla', 'Basculante Duplo', 'Rossetti 25m3'], category: 'Implementos' },
  { id: 'syn_4', canonicalTerm: 'Câmbio ZF 16S', synonyms: ['Transmissão ZF 16S', 'Caixa ZF 16 marchas', 'Câmbio ZF Ecosplit'], category: 'Peças' },
  { id: 'syn_5', canonicalTerm: 'Mercedes Actros 2651', synonyms: ['Actros 2651', 'MB 2651', 'Actros 510', 'Actros Bicuda'], category: 'Caminhões' },
  { id: 'syn_6', canonicalTerm: 'Desmobilização de Frota', synonyms: ['Renovação de Frota', 'Venda de Frota Usada', 'Desfazendo de Frota'], category: 'Estratégia' }
];

/**
 * 5. Combinatorial Expansion Generator
 */
export function generateCombinatorialMatrix(params: {
  brands: string[];
  models: string[];
  intents: string[];
  states: string[];
  includeWhatsapp: boolean;
  includeDdd: boolean;
  includeCondition: boolean;
}): string[] {
  const { brands, models, intents, states, includeWhatsapp, includeDdd, includeCondition } = params;
  
  const results: string[] = [];
  const baseIntents = intents.length > 0 ? intents : ['vendo', 'compro', 'oferta'];
  const baseBrands = brands.length > 0 ? brands : ['Scania', 'Volvo', 'Mercedes'];
  const baseModels = models.length > 0 ? models : ['R450', 'FH 540', 'Axor 2544'];
  const baseStates = states.length > 0 ? states : ['SP', 'PR', 'MG'];

  const conditions = ['seminovo', 'revisado', 'com garantia', 'frotista'];

  baseIntents.forEach(intent => {
    baseBrands.forEach(brand => {
      baseModels.forEach(model => {
        baseStates.forEach(uf => {
          let term = `${intent} ${brand} ${model} ${uf}`.toLowerCase();
          
          if (includeCondition) {
            const cond = conditions[Math.floor(Math.random() * conditions.length)];
            term += ` ${cond}`;
          }
          if (includeDdd) {
            const stateObj = BRAZIL_STATES.find(s => s.uf === uf);
            const ddd = stateObj?.ddds ? stateObj.ddds[0] : '11';
            term += ` ddd ${ddd}`;
          }
          if (includeWhatsapp) {
            term += ` whatsapp`;
          }

          results.push(term);
        });
      });
    });
  });

  return Array.from(new Set(results));
}

/**
 * 6. Mining Simulator Calculation Engine
 */
export function simulateMiningCampaign(keywords: string[], engineMode: string): SimulationResult {
  const total = keywords.length;
  if (total === 0) {
    return {
      totalTerms: 0,
      estimatedLeads: 0,
      estimatedPhones: 0,
      estimatedWhatsApps: 0,
      estimatedTimeMin: 0,
      estimatedCostBrl: 0,
      qualityIndex: 0,
      recommendations: ['Adicione palavras-chave para iniciar a simulação.']
    };
  }

  let avgLeadsPerKw = 4.2;
  let phoneRatio = 0.85;
  let waRatio = 0.72;
  let timePerKwSec = 6;
  let costPerKw = 0.05;

  if (engineMode === 'olx') {
    avgLeadsPerKw = 6.5;
    phoneRatio = 0.92;
    waRatio = 0.88;
  } else if (engineMode === 'social') {
    avgLeadsPerKw = 5.0;
    phoneRatio = 0.78;
    waRatio = 0.80;
  }

  const estimatedLeads = Math.round(total * avgLeadsPerKw);
  const estimatedPhones = Math.round(estimatedLeads * phoneRatio);
  const estimatedWhatsApps = Math.round(estimatedPhones * waRatio);
  const estimatedTimeMin = Math.round((total * timePerKwSec) / 60) || 1;
  const estimatedCostBrl = Number((total * costPerKw).toFixed(2));

  // Calculate Quality Index
  let qualityIndex = 75;
  const kwSample = keywords.slice(0, 10).join(' ').toLowerCase();
  if (kwSample.includes('whatsapp')) qualityIndex += 10;
  if (kwSample.includes('ddd')) qualityIndex += 8;
  if (kwSample.includes('vendo') || kwSample.includes('compro')) qualityIndex += 7;
  qualityIndex = Math.min(100, qualityIndex);

  const recommendations: string[] = [];
  if (!kwSample.includes('whatsapp')) {
    recommendations.push('Dica: Adicionar a palavra "whatsapp" nos termos aumenta em até 30% a captura de números diretos.');
  }
  if (!kwSample.includes('ddd') && !kwSample.match(/\b(sp|pr|mg|rs|sc|go|mt)\b/)) {
    recommendations.push('Dica: Incluir a sigla do estado ou DDD (ex: "SP", "DDD 11") regionaliza e eleva a conversão.');
  }
  if (total > 50) {
    recommendations.push('Excelente escala: Fila com mais de 50 termos para varredura robusta em segundo plano.');
  }

  return {
    totalTerms: total,
    estimatedLeads,
    estimatedPhones,
    estimatedWhatsApps,
    estimatedTimeMin,
    estimatedCostBrl,
    qualityIndex,
    recommendations
  };
}

/**
 * 7. Storage Persistence Helpers
 */
export function getStoredIntelligentTerms(activeKeywords: string[]): IntelligentTerm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INTELLIGENT_TERMS);
    let terms: IntelligentTerm[] = [];
    if (raw) {
      terms = JSON.parse(raw);
    }

    // Sync activeKeywords into terms list if any new kw was added
    const existingMap = new Map<string, IntelligentTerm>();
    terms.forEach(t => existingMap.set(t.keyword.toLowerCase().trim(), t));

    const updatedList: IntelligentTerm[] = [...terms];

    activeKeywords.forEach((kw, idx) => {
      const cleanKw = kw.trim();
      if (!cleanKw) return;
      const key = cleanKw.toLowerCase();

      if (!existingMap.has(key)) {
        // Derive category & state from kw
        let state = 'BR';
        const words = cleanKw.toUpperCase().split(' ');
        const matchedState = BRAZIL_STATES.find(s => words.includes(s.uf));
        if (matchedState) state = matchedState.uf;

        let category = 'Geral Pesados';
        if (cleanKw.toLowerCase().includes('peça') || cleanKw.toLowerCase().includes('cambio') || cleanKw.toLowerCase().includes('motor')) {
          category = 'Peças';
        } else if (cleanKw.toLowerCase().includes('carreta') || cleanKw.toLowerCase().includes('baú') || cleanKw.toLowerCase().includes('caçamba')) {
          category = 'Implementos';
        } else if (cleanKw.toLowerCase().includes('scania') || cleanKw.toLowerCase().includes('volvo') || cleanKw.toLowerCase().includes('mercedes')) {
          category = 'Caminhões';
        }

        const newTerm: IntelligentTerm = {
          id: `term_${Date.now()}_${idx}`,
          keyword: cleanKw,
          category,
          subcategory: 'Mineração Contínua',
          tags: ['ativa', state],
          niche: 'Pesados & Rodoviário',
          region: 'Nacional',
          stateUf: state,
          city: 'Geral',
          priority: 'Média',
          score: 75,
          status: 'Ativo',
          createdAt: new Date().toISOString(),
          lastExecution: null,
          lastConversion: null,
          executionCount: 0,
          leadsFound: 0,
          validPhonesCount: 0,
          whatsAppsCount: 0,
          companiesCount: 0,
          individualsCount: 0,
          conversionRate: 0,
          estimatedROI: 0,
          costPerLead: 0,
          avgExecutionTimeSec: 5,
          executionHistory: []
        };
        newTerm.score = calculateTermScore(newTerm);
        updatedList.push(newTerm);
        existingMap.set(key, newTerm);
      }
    });

    return updatedList;
  } catch (e) {
    console.error('Erro ao ler termos inteligentes:', e);
    return [];
  }
}

export function saveStoredIntelligentTerms(terms: IntelligentTerm[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INTELLIGENT_TERMS, JSON.stringify(terms));
  } catch (e) {
    console.error('Erro ao salvar termos inteligentes:', e);
  }
}

export function getStoredNegativeTerms(): NegativeTermItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NEGATIVE_TERMS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_NEGATIVE_TERMS;
}

export function saveStoredNegativeTerms(items: NegativeTermItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NEGATIVE_TERMS, JSON.stringify(items));
  } catch (e) {}
}

export function getStoredDiscoveries(): TermDiscoveryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISCOVERIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: 'disc_1',
      term: 'scania r450 2022 suspensao a ar ddd 41',
      category: 'Caminhões Pesados',
      sourceContext: 'Encontrado durante varredura de anúncios no Paraná com menção a Suspensão a Ar',
      discoveredAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      estimatedVolume: 'Alto',
      status: 'Pendente'
    },
    {
      id: 'disc_2',
      term: 'carreta vanderleia bau 3 eixos distancia',
      category: 'Implementos',
      sourceContext: 'Nova variação semântica detectada com alta busca no polo de transporte de cargas de SC',
      discoveredAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      estimatedVolume: 'Médio',
      status: 'Pendente'
    }
  ];
}

export function saveStoredDiscoveries(items: TermDiscoveryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DISCOVERIES, JSON.stringify(items));
  } catch (e) {}
}
