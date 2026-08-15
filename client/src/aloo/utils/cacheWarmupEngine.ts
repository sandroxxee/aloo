import { Lead } from '../types';
import { getTieredCacheMetrics, clearTieredSearchCache } from './tieredCacheEngine';

const STORAGE_KEY_WARMED_CACHE = 'truck_miner_warmed_leads_cache_v2';
const LEGACY_STORAGE_KEY_WARMED_CACHE = 'truck_miner_warmed_leads_cache_v1';
const STORAGE_KEY_SEARCH_CACHE = 'truck_miner_search_query_cache_v1';
const WARM_CACHE_LIMIT = 60; // Expanded to 60 leads for broader instant viewport
const SEARCH_CACHE_MAX_ENTRIES = 30; // Max search queries cached

// Tier-0 In-Memory RAM Cache Layer
let inMemoryWarmedCache: Lead[] | null = null;
let inMemorySearchCache: Map<string, { timestamp: number; leads: Lead[] }> = new Map();

// Metrics tracking
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Normalizes query string for uniform cache lookup keys.
 */
function normalizeQueryKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Carrega instantaneamente os leads essenciais do cache aquecido.
 * Utiliza camada em memória (RAM Tier-0) se disponível para resposta em 0.0ms.
 */
export function loadWarmedLeadsCache(): Lead[] {
  // 1. RAM Cache Hit (Instantaneous)
  if (inMemoryWarmedCache && inMemoryWarmedCache.length > 0) {
    cacheHits++;
    return inMemoryWarmedCache;
  }

  // 2. LocalStorage Read (Tier-1 Cache)
  try {
    let raw = localStorage.getItem(STORAGE_KEY_WARMED_CACHE);
    if (!raw) {
      // Check legacy key fallback
      raw = localStorage.getItem(LEGACY_STORAGE_KEY_WARMED_CACHE);
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cacheHits++;
        inMemoryWarmedCache = parsed;
        console.log(`⚡ [Cache Warmup Tier-1] ${parsed.length} leads aquecidos carregados do localStorage.`);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Cache Warmup] Falha ao ler cache do localStorage:', err);
  }

  cacheMisses++;
  return [];
}

/**
 * Atualiza o cache aquecido em memória e em localStorage.
 * Filtra e compacta os metadados essenciais dos primeiros leads.
 */
export function updateWarmedLeadsCache(fullLeads: Lead[]): void {
  try {
    if (!fullLeads || fullLeads.length === 0) return;

    // Compacta metadados essenciais para economizar espaço mantendo renderização perfeita
    const topLeads = fullLeads.slice(0, WARM_CACHE_LIMIT).map(lead => ({
      id: lead.id,
      name: lead.name || '',
      phone: lead.phone || '',
      rawPhone: lead.rawPhone || '',
      item: lead.item || '',
      price: lead.price || '',
      whatsappStatus: lead.whatsappStatus || 'unchecked',
      outreachStatus: lead.outreachStatus || 'pendente',
      qualification: lead.qualification || 'Interessado',
      intent: lead.intent || 'Direto',
      commercialScore: lead.commercialScore || 50,
      stateUf: lead.stateUf || 'SP',
      source: lead.source || 'Automático',
      createdAt: lead.createdAt || new Date().toISOString(),
      opportunityBadges: lead.opportunityBadges || [],
      weakSignals: lead.weakSignals || [],
      visualAnalysis: lead.visualAnalysis,
      isMultiStateSeller: lead.isMultiStateSeller,
      crossRegionalStates: lead.crossRegionalStates || []
    }));

    // Update RAM Layer immediately
    inMemoryWarmedCache = topLeads as Lead[];

    // Async storage write
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY_WARMED_CACHE, JSON.stringify(topLeads));
      } catch (storageErr) {
        console.warn('[Cache Warmup] Erro ao gravar no localStorage (Storage Cheio?):', storageErr);
      }
    }, 0);
  } catch (err) {
    console.warn('[Cache Warmup] Não foi possível atualizar o cache aquecido:', err);
  }
}

/**
 * Busca resultados em cache para um termo/query específico.
 */
export function getCachedSearchResults(query: string): Lead[] | null {
  const key = normalizeQueryKey(query);
  if (!key) return null;

  // 1. Check RAM Cache
  if (inMemorySearchCache.has(key)) {
    const cached = inMemorySearchCache.get(key)!;
    // 30-min TTL
    if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
      cacheHits++;
      return cached.leads;
    }
    inMemorySearchCache.delete(key);
  }

  // 2. Check localStorage Search Cache
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_SEARCH_CACHE}_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.leads) && Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        cacheHits++;
        inMemorySearchCache.set(key, parsed);
        return parsed.leads;
      }
    }
  } catch (e) {
    // Ignore invalid JSON
  }

  cacheMisses++;
  return null;
}

/**
 * Guarda resultados de busca de um termo específico no cache.
 */
export function setCachedSearchResults(query: string, results: Lead[]): void {
  const key = normalizeQueryKey(query);
  if (!key || !results || results.length === 0) return;

  const entry = {
    timestamp: Date.now(),
    leads: results.slice(0, 50) // Cache top 50 matches per query
  };

  inMemorySearchCache.set(key, entry);

  // Evict oldest if exceeding limit
  if (inMemorySearchCache.size > SEARCH_CACHE_MAX_ENTRIES) {
    const firstKey = inMemorySearchCache.keys().next().value;
    if (firstKey) inMemorySearchCache.delete(firstKey);
  }

  setTimeout(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_SEARCH_CACHE}_${key}`, JSON.stringify(entry));
    } catch (e) {
      // Storage quota exceeded fallback
    }
  }, 0);
}

/**
 * Retorna diagnósticos completos e métricas de desempenho do cache.
 */
export function getCacheStats() {
  let storageSizeBytes = 0;

  try {
    const warmedRaw = localStorage.getItem(STORAGE_KEY_WARMED_CACHE) || '';
    storageSizeBytes += warmedRaw.length * 2; // ~2 bytes per char UTF-16
  } catch (e) {}

  const tieredMetrics = getTieredCacheMetrics();

  const hitRate = cacheHits + cacheMisses > 0 
    ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) 
    : tieredMetrics.hitRatePercentage;

  return {
    warmedCount: inMemoryWarmedCache ? inMemoryWarmedCache.length : 0,
    isRamWarm: inMemoryWarmedCache !== null,
    warmedStorageSizeKb: Math.round(storageSizeBytes / 1024),
    searchQueryCacheCount: inMemorySearchCache.size + tieredMetrics.ramEntriesCount,
    cacheHits: cacheHits + tieredMetrics.ramHits + tieredMetrics.localStorageHits + tieredMetrics.indexedDbHits,
    cacheMisses: cacheMisses + tieredMetrics.cacheMisses,
    hitRatePercentage: hitRate,
    tieredMetrics
  };
}

/**
 * Limpa completamente o cache de aquecimento e o cache de termos.
 */
export function clearWarmedLeadsCache(): void {
  inMemoryWarmedCache = null;
  inMemorySearchCache.clear();

  try {
    localStorage.removeItem(STORAGE_KEY_WARMED_CACHE);
    localStorage.removeItem(LEGACY_STORAGE_KEY_WARMED_CACHE);

    // Remove search query cache keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_KEY_SEARCH_CACHE)) {
        localStorage.removeItem(k);
      }
    }
    clearTieredSearchCache();
    console.log('🧹 [Cache Engine] Todo o cache aquecido e de buscas em 3 camadas foi limpo com sucesso.');
  } catch (err) {
    console.warn('[Cache Engine] Erro ao limpar cache do localStorage:', err);
  }
}

