import { ExtractedContact, SearchFilterConfig, SearchDebugStep, SearchExecutionSummary, SearchDebugStage, SearchDebugBreakdown } from '../types';
import { executeMultiEngineSearch, SearchResultPayload } from './searchEngines';
import { sanitizeInput } from './textProcessor';
import { cleanseAndFilterGarbage, calculateCommercialScore } from './leadMergerEngine';
import { autoLearnNewKeyword } from './keywordBrain';
import { getTieredSearchCache, setTieredSearchCache } from './tieredCacheEngine';

// --- DEBUG CONSOLE MEMORY STORE & EVENT DISPATCHER ---
let latestSearchDebugTrace: SearchDebugStep[] = [];
let latestSearchExecutionSummary: SearchExecutionSummary | null = null;

// New: Support for concurrent search isolation
const activeSearchTraces = new Map<string, SearchDebugStep[]>();
const activeExecutionSummaries = new Map<string, SearchExecutionSummary | null>();

type SearchDebugListener = (trace: SearchDebugStep[], summary: SearchExecutionSummary | null) => void;
const searchDebugListeners = new Set<SearchDebugListener>();

export function getLatestSearchDebugTrace(): { trace: SearchDebugStep[]; summary: SearchExecutionSummary | null } {
  return { trace: latestSearchDebugTrace, summary: latestSearchExecutionSummary };
}

export function subscribeToSearchDebugTrace(listener: SearchDebugListener): () => void {
  searchDebugListeners.add(listener);
  // Emit current state immediately
  listener(latestSearchDebugTrace, latestSearchExecutionSummary);
  return () => {
    searchDebugListeners.delete(listener);
  };
}

export function clearSearchDebugTrace(): void {
  latestSearchDebugTrace = [];
  latestSearchExecutionSummary = null;
  activeSearchTraces.clear();
  activeExecutionSummaries.clear();
  clearOrchestratedSearchMemoCache();
  searchDebugListeners.forEach(fn => fn([], null));
}

function notifyDebugListeners(queryKey?: string): void {
  if (queryKey) {
    const trace = activeSearchTraces.get(queryKey) || [];
    const summary = activeExecutionSummaries.get(queryKey) || null;
    
    // Update global "latest" for backwards compatibility with UI
    latestSearchDebugTrace = [...trace];
    latestSearchExecutionSummary = summary;
  }
  searchDebugListeners.forEach(fn => fn([...latestSearchDebugTrace], latestSearchExecutionSummary));
}

// --- SYSTEM DE MEMOIZAÇÃO BASEADA EM TEMPO (CACHE DE 5 MINUTOS / 300.000 MS) ---
interface OrchestratedSearchMemoEntry {
  timestamp: number;
  data: SearchResultPayload & {
    orchestratedQueriesCount?: number;
    totalRawFound?: number;
    debugTrace?: SearchDebugStep[];
    executionSummary?: SearchExecutionSummary;
  };
}

const ORCHESTRATED_MEMO_TTL_MS = 5 * 60 * 1000; // 5 minutos (300.000 ms)
const orchestratedSearchMemoCache = new Map<string, OrchestratedSearchMemoEntry>();

export function clearOrchestratedSearchMemoCache(): void {
  orchestratedSearchMemoCache.clear();
}

export function invalidateOrchestratedSearchMemo(seedTerm: string): void {
  const normSeed = seedTerm.toLowerCase().trim();
  for (const key of orchestratedSearchMemoCache.keys()) {
    if (key.startsWith(normSeed)) {
      orchestratedSearchMemoCache.delete(key);
    }
  }
}

function getOrchestratedSearchMemoKey(
  seedTerm: string,
  searchDepth: number,
  engineMode: string,
  filterConfig?: SearchFilterConfig
): string {
  const normSeed = seedTerm.toLowerCase().trim();
  const filterKey = filterConfig ? JSON.stringify(filterConfig) : 'nofilter';
  return `${normSeed}_depth${searchDepth}_mode${engineMode}_${filterKey}`;
}

/**
 * Categorias de Intenção Comercial do Search Brain V2
 */
export type IntentCategory = 
  | 'market_offer' 
  | 'demand_pulse' 
  | 'fast_track_analysis' 
  | 'yield_sync' 
  | 'high_priority_sync'
  | 'asset_update_flux' 
  | 'proprietario' 
  | 'empresa' 
  | 'condicao' 
  | 'temporal'
  | 'plataforma';

export interface StrategicQuery {
  query: string;
  intentCategory: IntentCategory;
  platform: string;
  priorityScore: number;
}

export interface IntentStats {
  searchesCount: number;
  leadsFound: number;
  whatsAppsFound: number;
  score: number; // 0 to 100
}

export interface PlatformStats {
  searchesCount: number;
  leadsFound: number;
  whatsAppsFound: number;
  score: number; // 0 to 100
}

export interface OrchestratorStatsMemory {
  intents: Record<IntentCategory, IntentStats>;
  platforms: Record<string, PlatformStats>;
  totalOrchestratedRuns: number;
  lastUpdated: number;
}

const STORAGE_KEY_ORCHESTRATOR_STATS = 'smart_orchestrator_stats_v2';
const STORAGE_KEY_ORCHESTRATOR_CACHE = 'smart_orchestrator_cache_v2';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

/**
 * 1. Motor de Expansão de Modelos, Marca e Sinônimos do Search Brain V2
 */
export function expandSeedModelSynonyms(seedTerm: string): string[] {
  const clean = seedTerm.trim();
  const lower = clean.toLowerCase();
  const variations = new Set<string>();

  variations.add(clean);

  // Volvo FH Series
  if (lower.includes('volvo') || lower.includes('fh')) {
    variations.add('FH 540');
    variations.add('FH540');
    variations.add('Volvo FH');
    variations.add('Volvo FH4');
    variations.add('Volvo FH5');
    variations.add('540 IShift');
    variations.add('540 Globetrotter');
    variations.add('540 6x4');
    variations.add('FH usado');
    variations.add('FH seminovo');
    variations.add('FH particular');
    variations.add('FH direto proprietario');
    variations.add('FH empresa');
    variations.add('FH transportadora');
    variations.add('FH renovacao de frota');
    variations.add('Volvo FM');
    variations.add('Volvo VM');
    variations.add('VM 270');
    variations.add('VM 330');
  }

  // Scania Series
  if (lower.includes('scania') || lower.includes('r450') || lower.includes('r380') || lower.includes('r440') || lower.includes('r500') || lower.includes('r540')) {
    variations.add('Scania R450');
    variations.add('R450 Highline');
    variations.add('Scania R440');
    variations.add('R440 Streamline');
    variations.add('Scania R500');
    variations.add('Scania R540');
    variations.add('Scania S500');
    variations.add('Scania V8');
    variations.add('Scania 6x2');
    variations.add('Scania 6x4');
    variations.add('Scania G420');
    variations.add('Scania P310');
    variations.add('Scania 113');
    variations.add('Scania 124');
  }

  // Mercedes-Benz Axor / Actros
  if (lower.includes('mercedes') || lower.includes('axor') || lower.includes('actros') || lower.includes('mb') || lower.includes('atego') || lower.includes('accelo')) {
    variations.add('Axor 2544');
    variations.add('Axor 2041');
    variations.add('Actros 2651');
    variations.add('Actros 2546');
    variations.add('MB Axor');
    variations.add('Mercedes Actros');
    variations.add('Mercedes Atego 2426');
    variations.add('Mercedes Accelo 1016');
    variations.add('MB 1620');
    variations.add('MB 1113');
  }

  // Iveco & DAF
  if (lower.includes('iveco') || lower.includes('stralis') || lower.includes('hi-way') || lower.includes('tector') || lower.includes('daf') || lower.includes('xf')) {
    variations.add('Iveco Stralis');
    variations.add('Iveco Hi-Way');
    variations.add('Iveco Tector');
    variations.add('DAF XF 530');
    variations.add('DAF XF 480');
    variations.add('DAF CF');
  }

  // VW / Volkswagen
  if (lower.includes('vw') || lower.includes('volkswagen') || lower.includes('constellation') || lower.includes('delivery') || lower.includes('meteor')) {
    variations.add('VW Constellation 24280');
    variations.add('VW Constellation 19320');
    variations.add('VW Delivery 11180');
    variations.add('VW Meteor 29520');
    variations.add('Volkswagen Constellation');
  }

  // Carretas e Implementos
  if (lower.includes('carreta') || lower.includes('bicacamba') || lower.includes('basculante') || lower.includes('graneleiro')) {
    variations.add('Carreta Bicaçamba');
    variations.add('Carreta Basculante');
    variations.add('Vanderléia');
    variations.add('Bitrem Graneleiro');
    variations.add('Randon Bicaçamba');
    variations.add('Noma Basculante');
  }

  // Se não encaixar em nenhum modelo fixo, criar variações genéricas inteligentes
  const words = clean.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 1) {
    variations.add(words.join(' '));
    variations.add(`${words[0]} seminovo`);
    variations.add(`${words[0]} particular`);
  }

  return Array.from(variations);
}

/**
 * Padrões de Intenção Comercial Avançada & Radares de Repasse e Frota
 */
const INTENT_PATTERNS: Array<{
  category: IntentCategory;
  prefix?: string;
  suffix?: string;
  defaultPlatform?: string;
  baseWeight: number;
}> = [
  // Radar de Repasse e Urgência Extrema (Peso Máximo 98-100)
  { category: 'high_priority_sync', prefix: 'repasso', baseWeight: 100 },
  { category: 'high_priority_sync', prefix: 'repasse', baseWeight: 99 },
  { category: 'high_priority_sync', suffix: 'motivo mudanca', baseWeight: 97 },
  { category: 'high_priority_sync', suffix: 'encerrando atividades', baseWeight: 98 },
  { category: 'high_priority_sync', suffix: 'fechando empresa', baseWeight: 98 },
  { category: 'high_priority_sync', suffix: 'liquidacao', baseWeight: 96 },
  { category: 'high_priority_sync', suffix: 'desapego', baseWeight: 94 },

  // Radar de Renovação de Frota (Peso Alto 95-98)
  { category: 'asset_update_flux', suffix: 'renovacao de frota', baseWeight: 98 },
  { category: 'asset_update_flux', suffix: 'venda de frota', baseWeight: 97 },
  { category: 'asset_update_flux', suffix: 'troca de frota', baseWeight: 96 },
  { category: 'asset_update_flux', suffix: 'venda de ativos', baseWeight: 95 },
  { category: 'asset_update_flux', suffix: 'chegaram novos caminhoes', baseWeight: 95 },

  // Venda e Oferta Direta
  { category: 'market_offer', prefix: 'vendo', baseWeight: 90 },
  { category: 'market_offer', prefix: 'venda rapida', baseWeight: 88 },

  // Compra e Procura Ativa
  { category: 'demand_pulse', prefix: 'procuro', baseWeight: 95 },
  { category: 'demand_pulse', prefix: 'compro', baseWeight: 94 },

  // Urgência e Oportunidade Abaixo da FIPE
  { category: 'fast_track_analysis', suffix: 'urgente', baseWeight: 96 },
  { category: 'fast_track_analysis', suffix: 'oportunidade', baseWeight: 92 },
  { category: 'yield_sync', suffix: 'abaixo da FIPE', baseWeight: 98 },
  { category: 'yield_sync', suffix: 'abaixo da tabela', baseWeight: 97 },
  { category: 'yield_sync', suffix: 'aceito proposta', baseWeight: 91 },

  // Perfil Proprietário & Frota
  { category: 'empresa', suffix: 'transportadora', baseWeight: 89 },
  { category: 'proprietario', suffix: 'particular', baseWeight: 93 },
  { category: 'proprietario', suffix: 'direto proprietario', baseWeight: 92 },

  // Temporal (Publicado Recentemente)
  { category: 'temporal', suffix: 'publicado hoje', baseWeight: 96 },
  { category: 'temporal', suffix: 'anuncio recente', baseWeight: 95 },

  // Plataformas Específicas
  { category: 'plataforma', suffix: 'OLX', defaultPlatform: 'olx', baseWeight: 86 },
  { category: 'plataforma', suffix: 'Mercado Livre', defaultPlatform: 'mercadolivre', baseWeight: 85 },
  { category: 'plataforma', suffix: 'Facebook', defaultPlatform: 'facebook', baseWeight: 81 },
  { category: 'plataforma', suffix: 'Google Maps', defaultPlatform: 'google_maps', baseWeight: 89 },
];

/**
 * Carrega memória de estatísticas do Search Brain
 */
export function getOrchestratorStats(): OrchestratorStatsMemory {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ORCHESTRATOR_STATS) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.intents && parsed.platforms) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('SearchBrainV2: Falha ao ler estatísticas de armazenamento.', e);
  }

  // Fallback Inicial Padrão
  const defaultIntents: Record<IntentCategory, IntentStats> = {
    high_priority_sync: { searchesCount: 1, leadsFound: 9, whatsAppsFound: 8, score: 99 },
    asset_update_flux: { searchesCount: 1, leadsFound: 8, whatsAppsFound: 7, score: 96 },
    market_offer: { searchesCount: 1, leadsFound: 5, whatsAppsFound: 4, score: 85 },
    demand_pulse: { searchesCount: 1, leadsFound: 6, whatsAppsFound: 5, score: 90 },
    fast_track_analysis: { searchesCount: 1, leadsFound: 7, whatsAppsFound: 6, score: 95 },
    yield_sync: { searchesCount: 1, leadsFound: 8, whatsAppsFound: 7, score: 98 },
    proprietario: { searchesCount: 1, leadsFound: 5, whatsAppsFound: 4, score: 88 },
    empresa: { searchesCount: 1, leadsFound: 4, whatsAppsFound: 3, score: 82 },
    condicao: { searchesCount: 1, leadsFound: 4, whatsAppsFound: 3, score: 80 },
    temporal: { searchesCount: 1, leadsFound: 7, whatsAppsFound: 6, score: 94 },
    plataforma: { searchesCount: 1, leadsFound: 5, whatsAppsFound: 4, score: 85 },
  };

  const defaultPlatforms: Record<string, PlatformStats> = {
    global: { searchesCount: 1, leadsFound: 10, whatsAppsFound: 8, score: 90 },
    google_maps: { searchesCount: 1, leadsFound: 8, whatsAppsFound: 7, score: 88 },
    olx: { searchesCount: 1, leadsFound: 7, whatsAppsFound: 6, score: 85 },
    mercadolivre: { searchesCount: 1, leadsFound: 6, whatsAppsFound: 5, score: 82 },
    facebook: { searchesCount: 1, leadsFound: 5, whatsAppsFound: 4, score: 78 },
    bing: { searchesCount: 1, leadsFound: 5, whatsAppsFound: 4, score: 78 },
    duckduckgo: { searchesCount: 1, leadsFound: 5, whatsAppsFound: 4, score: 76 },
  };

  return {
    intents: defaultIntents,
    platforms: defaultPlatforms,
    totalOrchestratedRuns: 0,
    lastUpdated: Date.now()
  };
}

/**
 * Salva a memória de estatísticas do Search Brain
 */
export function saveOrchestratorStats(stats: OrchestratorStatsMemory): void {
  try {
    if (typeof localStorage !== 'undefined') {
      stats.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY_ORCHESTRATOR_STATS, JSON.stringify(stats));
    }
  } catch (e) {
    console.warn('SearchBrainV2: Falha ao salvar estatísticas.', e);
  }
}

/**
 * Atualiza aprendizado estatístico pós-execução
 */
export function recordOrchestrationExecution(
  intentCategory: IntentCategory,
  platform: string,
  leadsCount: number,
  whatsAppsCount: number,
  durationSeconds: number
): void {
  const stats = getOrchestratorStats();

  const currentIntent = stats.intents[intentCategory] || { searchesCount: 0, leadsFound: 0, whatsAppsFound: 0, score: 70 };
  currentIntent.searchesCount += 1;
  currentIntent.leadsFound += leadsCount;
  currentIntent.whatsAppsFound += whatsAppsCount;

  const roundScore = leadsCount > 0 ? Math.min(100, Math.round((whatsAppsCount / (leadsCount || 1)) * 60 + Math.min(40, leadsCount * 10))) : 10;
  currentIntent.score = Math.round(currentIntent.score * 0.75 + roundScore * 0.25);
  stats.intents[intentCategory] = currentIntent;

  const currentPlatform = stats.platforms[platform] || { searchesCount: 0, leadsFound: 0, whatsAppsFound: 0, score: 70 };
  currentPlatform.searchesCount += 1;
  currentPlatform.leadsFound += leadsCount;
  currentPlatform.whatsAppsFound += whatsAppsCount;
  currentPlatform.score = Math.round(currentPlatform.score * 0.75 + roundScore * 0.25);
  stats.platforms[platform] = currentPlatform;

  stats.totalOrchestratedRuns += 1;
  saveOrchestratorStats(stats);
}

interface CacheEntry {
  timestamp: number;
  contacts: ExtractedContact[];
}

function getOrchestrationCache(queryKey: string): ExtractedContact[] | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`${STORAGE_KEY_ORCHESTRATOR_CACHE}_${queryKey.toLowerCase().trim()}`) : null;
    if (raw) {
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.timestamp < CACHE_TTL_MS && entry.contacts && entry.contacts.length > 0) {
        return entry.contacts;
      }
    }
  } catch (e) {}
  return null;
}

function setOrchestrationCache(queryKey: string, contacts: ExtractedContact[]): void {
  try {
    if (typeof localStorage !== 'undefined' && contacts && contacts.length > 0) {
      const entry: CacheEntry = {
        timestamp: Date.now(),
        contacts
      };
      localStorage.setItem(`${STORAGE_KEY_ORCHESTRATOR_CACHE}_${queryKey.toLowerCase().trim()}`, JSON.stringify(entry));
    }
  } catch (e) {}
}

/**
 * Motor de Descoberta Automática de Novos Termos & Gírias em Snippets
 */
export function discoverAndLearnNewTermsFromSnippets(contacts: ExtractedContact[]): void {
  const JARGON_REGEXES = [
    /\b(FH\s?EVO)\b/i,
    /\b(540\s?Turbo)\b/i,
    /\b(Volv[ãa]o)\b/i,
    /\b(Bitruck)\b/i,
    /\b(Cavalinho)\b/i,
    /\b(LS\s?6x2)\b/i,
    /\b(Truck\s?pesado)\b/i,
    /\b(Globetrotter)\b/i,
    /\b(IShift)\b/i,
    /\b(Tra[çc]ado)\b/i,
    /\b(Vanderl[ée]ia)\b/i,
  ];

  for (const c of contacts) {
    const text = `${c.snippetContext || ''} ${c.item || ''}`;
    for (const reg of JARGON_REGEXES) {
      const match = text.match(reg);
      if (match && match[1]) {
        autoLearnNewKeyword(match[1], 'SnippetDiscoveryEngine');
      }
    }
  }
}

/**
 * Gera dezenas de variações estratégicas comerciais para uma palavra semente (Search Brain V2)
 */
export function generateStrategicIntentQueries(seedTerm: string, activeEngineMode: string = 'global'): StrategicQuery[] {
  const cleanSeed = sanitizeInput(seedTerm, 120).trim();
  if (!cleanSeed) return [];

  const stats = getOrchestratorStats();
  const queries: StrategicQuery[] = [];
  const querySet = new Set<string>();

  // 1. Expansão de Modelos e Marca
  const modelVariations = expandSeedModelSynonyms(cleanSeed);

  for (const varTerm of modelVariations) {
    const lowerVar = varTerm.toLowerCase().trim();
    if (!querySet.has(lowerVar)) {
      querySet.add(lowerVar);
      queries.push({
        query: varTerm,
        intentCategory: 'market_offer',
        platform: activeEngineMode,
        priorityScore: 100
      });
    }

    // 2. Aplicar padrões de intenção comercial para cada variação de modelo
    INTENT_PATTERNS.forEach(pattern => {
      let expandedStr = varTerm;
      if (pattern.prefix) {
        expandedStr = `${pattern.prefix} ${varTerm}`;
      } else if (pattern.suffix) {
        expandedStr = `${varTerm} ${pattern.suffix}`;
      }

      const norm = expandedStr.toLowerCase().trim();
      if (!querySet.has(norm)) {
        querySet.add(norm);

        const intentScore = stats.intents[pattern.category]?.score ?? pattern.baseWeight;
        const targetPlatform = pattern.defaultPlatform || activeEngineMode;
        const platformScore = stats.platforms[targetPlatform]?.score ?? 80;

        const priorityScore = Math.round((intentScore * 0.5) + (platformScore * 0.3) + (pattern.baseWeight * 0.2));

        queries.push({
          query: expandedStr,
          intentCategory: pattern.category,
          platform: targetPlatform,
          priorityScore
        });
      }
    });
  }

  return queries.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Motor Principal: Search Brain V2 (Cérebro de Busca Comercial Autônomo)
 * Com Telemetria Avançada, Console de Depuração e Diagnóstico de Gargalos de Performance.
 */
export async function executeSmartOrchestratedSearch(
  seedTerm: string,
  searchDepth: number = 1,
  engineMode: string = 'global',
  filterConfig?: SearchFilterConfig,
  onProgress?: (progress: number) => void
): Promise<SearchResultPayload & {
  orchestratedQueriesCount?: number;
  totalRawFound?: number;
  debugTrace?: SearchDebugStep[];
  executionSummary?: SearchExecutionSummary;
}> {
  const startTime = Date.now();
  const startTimeIso = new Date().toISOString();
  const cleanSeed = sanitizeInput(seedTerm, 150).trim();
  const queryKey = `${cleanSeed}_${engineMode}`;

  // Initialize isolated trace for this specific search run
  activeSearchTraces.set(queryKey, []);
  activeExecutionSummaries.set(queryKey, null);

  let stepIdCounter = 0;
  function logStep(
    stage: SearchDebugStage,
    message: string,
    details?: Record<string, any>,
    durationMs?: number,
    isBottleneck?: boolean,
    query?: string,
    batchIndex?: number
  ): SearchDebugStep {
    stepIdCounter++;
    const step: SearchDebugStep = {
      id: `step_${stepIdCounter}_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      elapsedMs: Date.now() - startTime,
      stage,
      message,
      details,
      durationMs,
      isBottleneck,
      query,
      batchIndex
    };
    
    const trace = activeSearchTraces.get(queryKey) || [];
    trace.push(step);
    activeSearchTraces.set(queryKey, trace);
    
    notifyDebugListeners(queryKey);

    // DevTools Console Formatting with CSS Badge Styles
    const stageColors: Record<SearchDebugStage, string> = {
      INIT: 'background: #3b82f6; color: #ffffff',
      CACHE_CHECK: 'background: #10b981; color: #ffffff',
      HTTP_REQUEST: 'background: #06b6d4; color: #ffffff',
      CASCADE_AI: 'background: #8b5cf6; color: #ffffff',
      CLEANSE_DEDUP: 'background: #6366f1; color: #ffffff',
      DELAY_COOLING: 'background: #f59e0b; color: #000000',
      COMPLETE: 'background: #22c55e; color: #ffffff',
      ERROR: 'background: #ef4444; color: #ffffff',
      BOTTLENECK: 'background: #dc2626; color: #ffffff; font-weight: bold'
    };

    const style = stageColors[stage] || 'background: #64748b; color: #ffffff';
    console.log(
      `%c[SEARCH BRAIN %c${stage}%c +${step.elapsedMs}ms]`,
      'color: #0ea5e9; font-weight: bold;',
      `${style}; padding: 2px 6px; border-radius: 3px; font-weight: bold;`,
      'color: #94a3b8;',
      message,
      details ? details : ''
    );

    return step;
  }

  logStep('INIT', `🚀 [Search Brain V2] Iniciando orquestração estratégica para "${cleanSeed}"`, {
    seedTerm: cleanSeed,
    searchDepth,
    engineMode,
    filterConfig
  });

  if (!cleanSeed) {
    logStep('ERROR', '❌ Termo de busca vazio ou sanitizado totalmente.', { rawSeed: seedTerm });
    return { success: false, contacts: [], duration: 0 };
  }

  // --- MEMOIZAÇÃO DE 5 MINUTOS (PULAS BUSCAS REPETIDAS NO INTERVALO DE 300.000 MS) ---
  const memoKey = getOrchestratedSearchMemoKey(cleanSeed, searchDepth, engineMode, filterConfig);
  const existingMemo = orchestratedSearchMemoCache.get(memoKey);
  const now = Date.now();

  if (existingMemo && (now - existingMemo.timestamp < ORCHESTRATED_MEMO_TTL_MS)) {
    const ageSeconds = Math.round((now - existingMemo.timestamp) / 1000);
    const ttlRemainingSeconds = Math.round((ORCHESTRATED_MEMO_TTL_MS - (now - existingMemo.timestamp)) / 1000);

    logStep(
      'CACHE_CHECK',
      `⚡ [MEMOIZAÇÃO 5 MINUTOS] Resultados recuperados do cache instantâneo para "${cleanSeed}" (${ageSeconds}s atrás, válido por mais ${ttlRemainingSeconds}s). Execução de rede pulada.`,
      {
        seedTerm: cleanSeed,
        cacheAgeMs: now - existingMemo.timestamp,
        contactsCount: existingMemo.data.contacts?.length || 0,
        ttlRemainingSeconds
      },
      now - existingMemo.timestamp,
      false
    );

    const cachedSummary: SearchExecutionSummary = existingMemo.data.executionSummary
      ? {
          ...existingMemo.data.executionSummary,
          endTimeIso: new Date().toISOString(),
          bottlenecks: [
            ...(existingMemo.data.executionSummary.bottlenecks || []),
            `⚡ [MEMO CACHE HIT] Busca idêntica executada em menos de 5 min. Economizou 100% de chamadas HTTP (Cache válido por mais ${ttlRemainingSeconds}s).`
          ]
        }
      : {
          seedTerm: cleanSeed,
          startTimeIso,
          endTimeIso: new Date().toISOString(),
          totalDurationSeconds: 0,
          totalDurationMs: 0,
          queriesGeneratedCount: existingMemo.data.orchestratedQueriesCount || 0,
          queriesExecutedCount: 0,
          totalRawContactsFound: existingMemo.data.totalRawFound || 0,
          uniqueLeadsRetained: existingMemo.data.contacts?.length || 0,
          cacheHitsCount: 1,
          httpRequestsCount: 0,
          rateLimit429Count: 0,
          cascadeAiCallsCount: 0,
          breakdownMs: { cacheMs: 0, networkHttpMs: 0, cascadeAiMs: 0, delaysMs: 0, dedupProcessingMs: 0 },
          bottlenecks: [`⚡ Busca retornada do cache de memoização de 5 minutos`],
          status: 'success'
        };

    activeExecutionSummaries.set(queryKey, cachedSummary);
    notifyDebugListeners(queryKey);

    logStep(
      'COMPLETE',
      `🏁 [CONCLUÍDO VIA MEMO CACHE] Orquestração para "${cleanSeed}" recuperada em 0s (${existingMemo.data.contacts?.length || 0} leads).`,
      { summary: cachedSummary },
      0
    );

    return {
      ...existingMemo.data,
      duration: 0,
      debugTrace: [...(activeSearchTraces.get(queryKey) || [])],
      executionSummary: cachedSummary
    };
  }

  // Time Breakdown trackers
  let cacheMs = 0;
  let networkHttpMs = 0;
  let cascadeAiMs = 0;
  let delaysMs = 0;
  let dedupProcessingMs = 0;
  let cacheHitsCount = 0;
  let httpRequestsCount = 0;
  let rateLimit429Count = 0;
  let cascadeAiCallsCount = 0;
  let totalRawContactsFound = 0;

  // 1. Gerar expansões e pesquisas estratégicas por prioridade
  const expansionStart = Date.now();
  let strategicQueries: StrategicQuery[];

  if (filterConfig?.deterministicMode) {
    // BUSCA DETERMINÍSTICA: Pula expansão estratégica, foca 100% no termo exato
    strategicQueries = [{
      query: cleanSeed,
      intentCategory: 'market_offer',
      priorityScore: 100,
      platform: 'global'
    }];
    
    logStep(
      'INIT',
      `🎯 [MODO DETERMINÍSTICO] Expansão IA desativada. Focando exclusivamente no termo exato: "${cleanSeed}"`,
      { seedTerm: cleanSeed }
    );
  } else {
    strategicQueries = generateStrategicIntentQueries(cleanSeed, engineMode);
  }
  
  // Dynamic top queries and batch size based on Turbo Mode
  const boostLevel = typeof window !== 'undefined' ? localStorage.getItem('search_boost_level') || 'normal' : 'normal';
  let topLimit = 10;
  let BATCH_SIZE = 3;
  
  if (boostLevel === 'hyper') {
    topLimit = 35;
    BATCH_SIZE = 12;
  } else if (boostLevel === 'turbo') {
    topLimit = 20;
    BATCH_SIZE = 8;
  }

  const topQueriesToRun = strategicQueries.slice(0, topLimit);
  const expansionMs = Date.now() - expansionStart;

  logStep(
    'INIT',
    `💡 Expansão de intenções gerou ${strategicQueries.length} variações em ${expansionMs}ms. Selecionadas Top ${topQueriesToRun.length} por prioridade.`,
    {
      topQueries: topQueriesToRun.map((q, idx) => `${idx + 1}. [${q.intentCategory.toUpperCase()}] "${q.query}" (Score ${q.priorityScore})`)
    }
  );

  const aggregatedContacts: ExtractedContact[] = [];
  const seenPhones = new Set<string>();
  const seenUrls = new Set<string>();
  let totalCascadeAttempts = 0;

    // 2. Lotes paralelos otimizados
    let isSystemCoolingDown = false;
    const totalBatches = Math.ceil(topQueriesToRun.length / BATCH_SIZE);

  for (let i = 0; i < topQueriesToRun.length; i += BATCH_SIZE) {
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
    const batch = topQueriesToRun.slice(i, i + BATCH_SIZE);

    if (onProgress) {
      onProgress(i / topQueriesToRun.length);
    }

    if (isSystemCoolingDown) {
      const coolStart = Date.now();
      logStep(
        'DELAY_COOLING',
        `⚠️ [SISTEMA EM RESFRIAMENTO] Rate limit 429 detectado em lote anterior. Aguardando pausa de segurança de 5.0s...`,
        { batchIndex },
        5000,
        true
      );
      await new Promise(resolve => setTimeout(resolve, 5000));
      const coolDur = Date.now() - coolStart;
      delaysMs += coolDur;
      isSystemCoolingDown = false;
    }

    logStep(
      'INIT',
      `📦 Executando Lote ${batchIndex}/${totalBatches} (${batch.length} pesquisas em paralelo)`,
      { batchIndex, batchQueries: batch.map(b => b.query) },
      undefined,
      false,
      undefined,
      batchIndex
    );

    const batchResults = await Promise.allSettled(
      batch.map(async (strat, idxInBatch) => {
        // Stagger execution to avoid burst of concurrent AI calls
        if (idxInBatch > 0) {
          const stagger = idxInBatch * (isSystemCoolingDown ? 2000 : 500);
          await new Promise(resolve => setTimeout(resolve, stagger));
        }

        const qStart = Date.now();
        const cached = await getTieredSearchCache(strat.query);
        const cacheDur = Date.now() - qStart;
        cacheMs += cacheDur;

        if (cached && cached.contacts.length > 0) {
          cacheHitsCount++;
          logStep(
            'CACHE_CHECK',
            `⚡ [CACHE HIT] "${strat.query}" -> ${cached.contacts.length} contatos recuperados em ${cacheDur}ms`,
            { query: strat.query, contactsCount: cached.contacts.length, durationMs: cacheDur },
            cacheDur,
            false,
            strat.query,
            batchIndex
          );

          return {
            queryItem: strat,
            contacts: cached.contacts,
            duration: cached.durationMs / 1000 || 0.01,
            fromCache: true,
            timeInHttpMs: 0,
            timeInAiCascadeMs: 0
          };
        }

        logStep(
          'CACHE_CHECK',
          `🔍 [CACHE MISS] "${strat.query}" em ${cacheDur}ms. Disparando requisição de rede HTTP...`,
          { query: strat.query },
          cacheDur,
          false,
          strat.query,
          batchIndex
        );

        const httpExecStart = Date.now();
        const result = await executeMultiEngineSearch(
          strat.query,
          searchDepth,
          strat.platform !== 'global' ? strat.platform : engineMode,
          filterConfig,
          true
        );
        const totalQueryExecMs = Date.now() - httpExecStart;

        httpRequestsCount++;
        const httpDur = result.timeInHttpMs || totalQueryExecMs;
        networkHttpMs += httpDur;

        if (result.timeInAiCascadeMs && result.timeInAiCascadeMs > 0) {
          cascadeAiMs += result.timeInAiCascadeMs;
          cascadeAiCallsCount++;
        }

        if (result.rateLimited) {
          rateLimit429Count++;
          isSystemCoolingDown = true;
          logStep(
            'ERROR',
            `⚠️ [RATE LIMIT 429] "${strat.query}" sofreu limitação de taxa em ${httpDur}ms. Rotação de proxy acionada.`,
            { query: strat.query, httpStatus: 429 },
            httpDur,
            true,
            strat.query,
            batchIndex
          );
        } else if (result.networkError) {
          logStep(
            'ERROR',
            `❌ [ERRO DE REDE HTTP] "${strat.query}" falhou ao se conectar ao servidor de busca em ${httpDur}ms.`,
            { query: strat.query },
            httpDur,
            true,
            strat.query,
            batchIndex
          );
        } else if (result.cascadeAttempts && result.cascadeAttempts > 0) {
          logStep(
            'CASCADE_AI',
            `🤖 [REFORMULAÇÃO IA] "${strat.query}" teve 0 resultados diretos. IA reformulou em ${result.cascadeAttempts} buscas paralelas em ${result.timeInAiCascadeMs || totalQueryExecMs}ms`,
            {
              query: strat.query,
              cascadeAttempts: result.cascadeAttempts,
              timeInAiCascadeMs: result.timeInAiCascadeMs,
              contactsFound: result.contacts?.length || 0
            },
            result.timeInAiCascadeMs || totalQueryExecMs,
            true,
            strat.query,
            batchIndex
          );
        } else {
          logStep(
            'HTTP_REQUEST',
            `🌐 [REDE HTTP CONCLUÍDA] "${strat.query}" -> HTTP 200 em ${httpDur}ms. Encontrados ${result.contacts?.length || 0} contatos brutos.`,
            { query: strat.query, contactsCount: result.contacts?.length || 0, durationMs: httpDur },
            httpDur,
            false,
            strat.query,
            batchIndex
          );
        }

        if (result.success && result.contacts && result.contacts.length > 0) {
          setTieredSearchCache(strat.query, result.contacts);
        }

        return {
          queryItem: strat,
          contacts: result.contacts || [],
          duration: result.duration || 0,
          fromCache: false,
          timeInHttpMs: httpDur,
          timeInAiCascadeMs: result.timeInAiCascadeMs || 0
        };
      })
    );

    const dedupStart = Date.now();
    let batchRawFound = 0;

    for (const res of batchResults) {
      if (res.status === 'fulfilled' && res.value.contacts.length > 0) {
        const { queryItem, contacts, duration } = res.value;
        batchRawFound += contacts.length;
        totalRawContactsFound += contacts.length;

        const cleanContacts = cleanseAndFilterGarbage(contacts);
        let validWaInQuery = 0;

        // Tentar descobrir e aprender novos termos dos snippets (Pular se determinístico)
        if (!filterConfig?.deterministicMode) {
          discoverAndLearnNewTermsFromSnippets(cleanContacts);
        }

        for (const contact of cleanContacts) {
          const raw = (contact.rawPhone || contact.formattedPhone || '').replace(/\D/g, '');
          const urlKey = (contact.webPageUrl || '').toLowerCase().trim();

          if (raw) {
            // No modo determinístico, validamos se o termo está presente no snippet ou título
            if (filterConfig?.deterministicMode) {
              const lowerSeed = cleanSeed.toLowerCase();
              const hasInItem = (contact.item || '').toLowerCase().includes(lowerSeed);
              const hasInSnippet = (contact.snippetContext || '').toLowerCase().includes(lowerSeed);
              const hasInLocation = (contact.location || '').toLowerCase().includes(lowerSeed);
              
              if (!hasInItem && !hasInSnippet && !hasInLocation) {
                continue; // Pula se não for relevante ao termo exato
              }
            }

            if (contact.formattedPhone?.includes('WhatsApp') || contact.snippetContext?.toLowerCase().includes('whatsapp')) {
              validWaInQuery++;
            }

            // Deduplicação Inteligente Multi-Critério (Telefone & URL)
            if (!seenPhones.has(raw) && (!urlKey || !seenUrls.has(urlKey))) {
              seenPhones.add(raw);
              if (urlKey) seenUrls.add(urlKey);

              // Enriquecer contexto com rótulo de radar comercial
              const radarLabel = queryItem.intentCategory === 'high_priority_sync'
                ? '🔥 RADAR REPASSE'
                : queryItem.intentCategory === 'asset_update_flux'
                ? '🚛 RADAR RENOVAÇÃO FROTA'
                : queryItem.intentCategory.toUpperCase();

              contact.snippetContext = `[${radarLabel} - "${queryItem.query}"] ${contact.snippetContext || ''}`;
              aggregatedContacts.push(contact);
            }
          }
        }

        recordOrchestrationExecution(
          queryItem.intentCategory,
          queryItem.platform,
          contacts.length,
          validWaInQuery,
          duration
        );
      }
    }

    const batchDedupMs = Date.now() - dedupStart;
    dedupProcessingMs += batchDedupMs;

    logStep(
      'CLEANSE_DEDUP',
      `🧹 Lote ${batchIndex}/${totalBatches} processado e filtrado em ${batchDedupMs}ms (${batchRawFound} brutos -> Total acumulado: ${aggregatedContacts.length} leads únicos)`,
      {
        batchIndex,
        batchRawFound,
        accumulatedUnique: aggregatedContacts.length
      },
      batchDedupMs,
      false,
      undefined,
      batchIndex
    );

    totalCascadeAttempts += batch.length;

    if (i + BATCH_SIZE < topQueriesToRun.length) {
      // Delay dinâmico otimizado entre lotes
      const adaptiveDelay = isSystemCoolingDown ? 3000 : 800;
      logStep(
        'DELAY_COOLING',
        `⏳ Pausa adaptativa de ${adaptiveDelay}ms antes do próximo lote para evitar bloqueio anti-bot...`,
        { adaptiveDelayMs: adaptiveDelay },
        adaptiveDelay
      );
      const delayStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, adaptiveDelay));
      delaysMs += Date.now() - delayStart;
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const totalDurationSeconds = Number((totalDurationMs / 1000).toFixed(1));
  const endTimeIso = new Date().toISOString();

  // --- ANÁLISE DE GARGALOS E DIAGNÓSTICO AUTOMÁTICO ---
  const bottlenecks: string[] = [];

  if (delaysMs > 3000) {
    bottlenecks.push(`⏳ Delays e resfriamentos de sistema somaram +${(delaysMs / 1000).toFixed(1)}s de espera passiva.`);
  }

  if (cascadeAiCallsCount > 0) {
    bottlenecks.push(`🤖 Reformulação de IA em Cascata foi ativada ${cascadeAiCallsCount}x por zero resultados iniciais, adicionando +${(cascadeAiMs / 1000).toFixed(1)}s.`);
  }

  if (rateLimit429Count > 0) {
    bottlenecks.push(`⚠️ Rate Limit (HTTP 429) detectado em ${rateLimit429Count} requisições. O sistema precisou alternar proxies residenciais.`);
  }

  if (networkHttpMs > 12000) {
    bottlenecks.push(`🌐 Latência da API de busca (/api/search) consumiu ${(networkHttpMs / 1000).toFixed(1)}s no total de rede.`);
  }

  if (aggregatedContacts.length === 0) {
    bottlenecks.push(`⚠️ Varredura encerrada sem contatos. Os snippets minerados não continham telefones válidos ou foram purgados pelos filtros.`);
  }

  if (bottlenecks.length > 0) {
    bottlenecks.forEach(b => logStep('BOTTLENECK', `⚠️ DIAGNÓSTICO DE GARGALO: ${b}`, {}, undefined, true));
  }

  const breakdownMs: SearchDebugBreakdown = {
    cacheMs,
    networkHttpMs,
    cascadeAiMs,
    delaysMs,
    dedupProcessingMs
  };

  const executionSummary: SearchExecutionSummary = {
    seedTerm: cleanSeed,
    startTimeIso,
    endTimeIso,
    totalDurationSeconds,
    totalDurationMs,
    queriesGeneratedCount: strategicQueries.length,
    queriesExecutedCount: topQueriesToRun.length,
    totalRawContactsFound,
    uniqueLeadsRetained: aggregatedContacts.length,
    cacheHitsCount,
    httpRequestsCount,
    rateLimit429Count,
    cascadeAiCallsCount,
    breakdownMs,
    bottlenecks,
    status: aggregatedContacts.length > 0 ? 'success' : (totalRawContactsFound > 0 ? 'partial' : 'failed')
  };

  activeExecutionSummaries.set(queryKey, executionSummary);

  logStep(
    'COMPLETE',
    `🏁 [CONCLUÍDO] Orquestração para "${cleanSeed}" finalizada em ${totalDurationSeconds}s. Executadas ${topQueriesToRun.length} pesquisas -> ${aggregatedContacts.length} leads únicos.`,
    {
      summary: executionSummary
    },
    totalDurationMs
  );

  notifyDebugListeners(queryKey);

  const finalResult = {
    success: true,
    contacts: aggregatedContacts,
    duration: totalDurationSeconds,
    cascadeAttempts: totalCascadeAttempts,
    orchestratedQueriesCount: topQueriesToRun.length,
    totalRawFound: aggregatedContacts.length,
    debugTrace: [...(activeSearchTraces.get(queryKey) || [])],
    executionSummary
  };

  // Salvar no Cache de Memoização de 5 Minutos (300.000 ms)
  orchestratedSearchMemoCache.set(memoKey, {
    timestamp: Date.now(),
    data: finalResult
  });

  return finalResult;
}

