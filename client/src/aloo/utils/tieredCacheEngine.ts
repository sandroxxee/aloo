import { ExtractedContact } from '../types';
import { sqliteGetSearchCache, sqliteSetSearchCache, sqliteClearSearchCache } from '../services/sqliteLeads';

const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos por padrão
const STORAGE_KEY_PREFIX = 'miner_tier1_cache_';
const RAM_CACHE_MAX_ENTRIES = 150;

export type CacheTierSource = 'RAM (0.0ms)' | 'LocalStorage (0.1ms)' | 'IndexedDB/SQLite (0.5ms)';

export interface TieredCacheHit {
  contacts: ExtractedContact[];
  sourceTier: CacheTierSource;
  durationMs: number;
  timestamp: number;
}

export interface TieredCacheMetrics {
  ramHits: number;
  localStorageHits: number;
  indexedDbHits: number;
  cacheMisses: number;
  totalRequests: number;
  hitRatePercentage: number;
  ramEntriesCount: number;
  lastHitSource?: CacheTierSource;
}

// ==========================================
// TIER-0: IN-MEMORY RAM CACHE LAYER (0.0ms)
// ==========================================
interface RamCacheEntry {
  timestamp: number;
  contacts: ExtractedContact[];
  hitsCount: number;
}

const ramCache = new Map<string, RamCacheEntry>();

// Metrics
let ramHits = 0;
let localStorageHits = 0;
let indexedDbHits = 0;
let cacheMisses = 0;
let lastHitSource: CacheTierSource | undefined = undefined;

/**
 * Normalizes query string for uniform cache lookup keys.
 */
export function normalizeQueryKey(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Recupera resultados de pesquisa em camadas (Tier-0 RAM -> Tier-1 LocalStorage -> Tier-2 IndexedDB/SQLite).
 * Evita chamadas de rede redundantes durante as varreduras do loop autônomo.
 */
export async function getTieredSearchCache(
  query: string,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): Promise<TieredCacheHit | null> {
  const normKey = normalizeQueryKey(query);
  if (!normKey) return null;

  const startTime = performance.now();
  const now = Date.now();

  // -------------------------------------------------------------
  // TIER-0: RAM IN-MEMORY CHECK (Velocidade Extrema ~0.0ms)
  // -------------------------------------------------------------
  if (ramCache.has(normKey)) {
    const entry = ramCache.get(normKey)!;
    if (now - entry.timestamp < ttlMs) {
      entry.hitsCount++;
      ramHits++;
      lastHitSource = 'RAM (0.0ms)';
      const durationMs = Number((performance.now() - startTime).toFixed(2));
      console.log(`⚡ [Tiered Cache - TIER 0 RAM] Query: "${query}" -> ${entry.contacts.length} leads resgatados instantaneamente (0.0ms).`);
      return {
        contacts: entry.contacts,
        sourceTier: 'RAM (0.0ms)',
        durationMs,
        timestamp: entry.timestamp
      };
    } else {
      ramCache.delete(normKey);
    }
  }

  // -------------------------------------------------------------
  // TIER-1: LOCALSTORAGE CHECK (Persistência síncrona ~0.1ms)
  // -------------------------------------------------------------
  try {
    const lsKey = `${STORAGE_KEY_PREFIX}${normKey}`;
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(lsKey) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.contacts) && now - parsed.timestamp < ttlMs) {
        localStorageHits++;
        lastHitSource = 'LocalStorage (0.1ms)';

        // Promover para o Tier-0 (RAM) para a próxima iteração
        ramCache.set(normKey, {
          timestamp: parsed.timestamp,
          contacts: parsed.contacts,
          hitsCount: 1
        });

        const durationMs = Number((performance.now() - startTime).toFixed(2));
        console.log(`⚡ [Tiered Cache - TIER 1 LocalStorage] Query: "${query}" -> ${parsed.contacts.length} leads promovidos para RAM (${durationMs}ms).`);
        return {
          contacts: parsed.contacts,
          sourceTier: 'LocalStorage (0.1ms)',
          durationMs,
          timestamp: parsed.timestamp
        };
      }
    }
  } catch (e) {
    // Ignore JSON error
  }

  // -------------------------------------------------------------
  // TIER-2: INDEXEDDB / SQLITE DB CHECK (Persistência de alta capacidade ~0.5ms)
  // -------------------------------------------------------------
  try {
    const sqliteEntry = await sqliteGetSearchCache(normKey);
    if (sqliteEntry && Array.isArray(sqliteEntry.data) && now - sqliteEntry.timestamp < ttlMs) {
      indexedDbHits++;
      lastHitSource = 'IndexedDB/SQLite (0.5ms)';

      // Promover para o Tier-0 (RAM) e Tier-1 (LocalStorage) para as próximas leituras
      ramCache.set(normKey, {
        timestamp: sqliteEntry.timestamp,
        contacts: sqliteEntry.data,
        hitsCount: 1
      });

      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(
            `${STORAGE_KEY_PREFIX}${normKey}`,
            JSON.stringify({ timestamp: sqliteEntry.timestamp, contacts: sqliteEntry.data })
          );
        }
      } catch (errLs) {}

      const durationMs = Number((performance.now() - startTime).toFixed(2));
      console.log(`💾 [Tiered Cache - TIER 2 SQLite/IndexedDB] Query: "${query}" -> ${sqliteEntry.data.length} leads recuperados do banco local (${durationMs}ms).`);
      return {
        contacts: sqliteEntry.data,
        sourceTier: 'IndexedDB/SQLite (0.5ms)',
        durationMs,
        timestamp: sqliteEntry.timestamp
      };
    }
  } catch (eSql) {
    console.warn('[Tiered Cache] Falha ao consultar banco local SQLite/IndexedDB:', eSql);
  }

  cacheMisses++;
  return null;
}

/**
 * Salva resultados de pesquisa simultaneamente nas 3 camadas de cache.
 */
export function setTieredSearchCache(query: string, contacts: ExtractedContact[]): void {
  const normKey = normalizeQueryKey(query);
  if (!normKey || !contacts || contacts.length === 0) return;

  const timestamp = Date.now();

  // 1. Salvar no Tier-0 (RAM In-Memory)
  ramCache.set(normKey, {
    timestamp,
    contacts,
    hitsCount: 0
  });

  // Manter limite LRU em memória RAM
  if (ramCache.size > RAM_CACHE_MAX_ENTRIES) {
    const firstKey = ramCache.keys().next().value;
    if (firstKey) ramCache.delete(firstKey);
  }

  // 2. Salvar no Tier-1 (LocalStorage em background)
  setTimeout(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const payload = JSON.stringify({ timestamp, contacts });
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${normKey}`, payload);
      }
    } catch (e) {
      // Caso cota do LocalStorage exceda, limpa chaves antigas
      evictOldLocalStorageCache();
    }
  }, 0);

  // 3. Salvar no Tier-2 (IndexedDB / SQLite assíncrono)
  setTimeout(() => {
    sqliteSetSearchCache(normKey, contacts).catch(() => {});
  }, 0);
}

/**
 * Libera espaço no LocalStorage removendo entradas expiradas ou antigas.
 */
function evictOldLocalStorageCache(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    // Remove as 50% mais antigas
    keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  } catch (err) {}
}

/**
 * Limpa completamente as 3 camadas de cache.
 */
export async function clearTieredSearchCache(): Promise<void> {
  ramCache.clear();
  ramHits = 0;
  localStorageHits = 0;
  indexedDbHits = 0;
  cacheMisses = 0;
  lastHitSource = undefined;

  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch (e) {}

  await sqliteClearSearchCache().catch(() => {});
  console.log('🧹 [Tiered Cache Engine] Cache em 3 camadas (RAM, LocalStorage e IndexedDB/SQLite) totalmente zerado.');
}

/**
 * Retorna diagnósticos em tempo real do sistema de cache em camadas.
 */
export function getTieredCacheMetrics(): TieredCacheMetrics {
  const totalHits = ramHits + localStorageHits + indexedDbHits;
  const totalRequests = totalHits + cacheMisses;
  const hitRatePercentage = totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) : 100;

  return {
    ramHits,
    localStorageHits,
    indexedDbHits,
    cacheMisses,
    totalRequests,
    hitRatePercentage,
    ramEntriesCount: ramCache.size,
    lastHitSource
  };
}
