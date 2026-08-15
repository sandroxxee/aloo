import initSqlJs, { Database } from 'sql.js';
import localforage from 'localforage';
import { Lead } from '../types';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let db: Database | null = null;
let SQL: any = null;
let isFallbackMode = false;
let fallbackLeadsMemory: Lead[] = [];

const DB_FILENAME = 'asset_intelligence.sqlite';
const FALLBACK_STORAGE_KEY = 'asset_intel_fallback_store';
const WASM_URL = wasmUrl;

// Diagnostic logs helper
function logDiag(message: string, isError = false, extra?: any) {
  const prefix = `[🤖 SQLite Diagnostics]`;
  if (isError) {
    console.error(`${prefix} ❌ ${message}`, extra || '');
  } else {
    console.log(`${prefix} ℹ️ ${message}`, extra || '');
  }
}

/**
 * Initializes the SQLite database safely with a resilient in-memory fallback.
 */
export async function initLeadsDatabase(): Promise<void> {
  if (db || isFallbackMode) {
    return;
  }

  try {
    logDiag('Starting secure initialization...');
    
    // Check if initSqlJs is imported correctly
    if (!initSqlJs) {
      throw new Error('initSqlJs is undefined or could not be loaded.');
    }
    
    const initFn = typeof initSqlJs === 'function' ? initSqlJs : (initSqlJs as any).default;
    if (typeof initFn !== 'function') {
      throw new Error('initSqlJs is not a function and has no default export.');
    }

    logDiag('Loading bundled WASM...');
    SQL = await initFn({
      locateFile: () => WASM_URL
    });

    logDiag('WASM loaded successfully, checking saved database in IndexedDB...');
    const savedBinary = await localforage.getItem<ArrayBuffer>(DB_FILENAME).catch(err => {
      logDiag('Failed to fetch from localforage, ignoring...', false, err);
      return null;
    });

    if (savedBinary) {
      logDiag('Restoring existing database from IndexedDB storage...');
      db = new SQL.Database(new Uint8Array(savedBinary));
    } else {
      logDiag('Creating new local database instance...');
      db = new SQL.Database();
      createTable();
    }
    
    logDiag('Database successfully initialized and ready.');
  } catch (error: any) {
    logDiag('SQLite failed to initialize. Activating resilient in-memory fallback mode...', true, error);
    isFallbackMode = true;
    
    // Load existing fallback leads from localforage or localStorage so data is not lost!
    try {
      const savedFallback = await localforage.getItem<Lead[]>(FALLBACK_STORAGE_KEY).catch(() => null)
        || JSON.parse(localStorage.getItem(FALLBACK_STORAGE_KEY) || '[]');
      if (Array.isArray(savedFallback)) {
        fallbackLeadsMemory = savedFallback;
        logDiag(`Fallback memory loaded with ${fallbackLeadsMemory.length} leads.`);
      }
    } catch (fallbackLoadError) {
      logDiag('Failed to load fallback memory from storage:', true, fallbackLoadError);
      fallbackLeadsMemory = [];
    }
  }
}

/**
 * Creates the leads table if it doesn't exist.
 */
function createTable() {
  if (!db) return;
  
  // We store the full lead object as a JSON string in a TEXT column for flexibility,
  // while indexing critical fields for fast search and sorting.
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      whatsappStatus TEXT,
      source TEXT,
      createdAt TEXT,
      data TEXT
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_leads_createdAt ON leads(createdAt)`);

  // Tier 2 Search Cache Table in SQLite/IndexedDB
  db.run(`
    CREATE TABLE IF NOT EXISTS search_cache (
      queryKey TEXT PRIMARY KEY,
      timestamp INTEGER,
      data TEXT
    )
  `);
}

/**
 * Saves the current database state to IndexedDB.
 */
async function persistToIndexedDB(): Promise<void> {
  if (!db) return;
  const binary = db.export();
  await localforage.setItem(DB_FILENAME, binary);
}

/**
 * Bulk saves leads to the database or fallback storage.
 */
export async function sqliteSaveLeads(leads: Lead[]): Promise<void> {
  try {
    if (!db && !isFallbackMode) {
      await initLeadsDatabase();
    }
    
    if (isFallbackMode || !db) {
      fallbackLeadsMemory = leads;
      // Persist fallback to localforage and localStorage for durability
      await localforage.setItem(FALLBACK_STORAGE_KEY, leads).catch(() => {});
      try {
        localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(leads));
      } catch (e) {}
      logDiag(`[Fallback Storage] Saved ${leads.length} leads in-memory & browser storage.`);
      return;
    }

    // Clear existing to perform a "sync" save like the original localStorage logic
    db.run("DELETE FROM leads");

    const stmt = db.prepare(`
      INSERT INTO leads (id, name, phone, whatsappStatus, source, createdAt, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const lead of leads) {
      stmt.run([
        lead.id,
        lead.name || '',
        lead.phone || '',
        lead.whatsappStatus || 'unchecked',
        lead.source || 'Automático',
        lead.createdAt || new Date().toISOString(),
        JSON.stringify(lead)
      ]);
    }

    stmt.free();
    await persistToIndexedDB();
    logDiag(`[SQLite] Persisted ${leads.length} leads to local relational storage.`);
  } catch (error) {
    logDiag('SQLite Save Error, migrating to fallback mode:', true, error);
    isFallbackMode = true;
    fallbackLeadsMemory = leads;
    await localforage.setItem(FALLBACK_STORAGE_KEY, leads).catch(() => {});
  }
}

/**
 * Loads all leads from the database or fallback storage.
 */
export async function sqliteLoadLeads(): Promise<Lead[]> {
  try {
    if (!db && !isFallbackMode) {
      await initLeadsDatabase();
    }

    if (isFallbackMode || !db) {
      if (fallbackLeadsMemory.length === 0) {
        const savedFallback = await localforage.getItem<Lead[]>(FALLBACK_STORAGE_KEY).catch(() => null)
          || JSON.parse(localStorage.getItem(FALLBACK_STORAGE_KEY) || '[]');
        if (Array.isArray(savedFallback)) {
          fallbackLeadsMemory = savedFallback;
        }
      }
      logDiag(`[Fallback Storage] Loaded ${fallbackLeadsMemory.length} leads from backup storage.`);
      return fallbackLeadsMemory;
    }

    const res = db.exec("SELECT data FROM leads ORDER BY createdAt DESC");
    if (res.length === 0) return [];

    return res[0].values.map((row: any) => JSON.parse(row[0]) as Lead);
  } catch (error) {
    logDiag('SQLite Load Error, trying fallback loading:', true, error);
    isFallbackMode = true;
    return fallbackLeadsMemory;
  }
}

/**
 * Optimized search within the local database or fallback storage.
 */
export async function sqliteSearchLeads(query: string): Promise<Lead[]> {
  try {
    if (!db && !isFallbackMode) {
      await initLeadsDatabase();
    }

    if (isFallbackMode || !db) {
      const lowerQuery = query.toLowerCase();
      const results = fallbackLeadsMemory.filter(lead => 
        (lead.name || '').toLowerCase().includes(lowerQuery) ||
        (lead.phone || '').toLowerCase().includes(lowerQuery) ||
        (lead.source || '').toLowerCase().includes(lowerQuery)
      );
      logDiag(`[Fallback Storage] Found ${results.length} matches for "${query}".`);
      return results;
    }

    const sqlQuery = `
      SELECT data FROM leads 
      WHERE name LIKE ? OR phone LIKE ? OR source LIKE ?
      ORDER BY createdAt DESC
    `;
    const res = db.exec(sqlQuery, [`%${query}%`, `%${query}%`, `%${query}%`]);
    if (res.length === 0) return [];

    return res[0].values.map((row: any) => JSON.parse(row[0]) as Lead);
  } catch (error) {
    logDiag('SQLite Search Error, using fallback filter:', true, error);
    isFallbackMode = true;
    const lowerQuery = query.toLowerCase();
    return fallbackLeadsMemory.filter(lead => 
      (lead.name || '').toLowerCase().includes(lowerQuery) ||
      (lead.phone || '').toLowerCase().includes(lowerQuery) ||
      (lead.source || '').toLowerCase().includes(lowerQuery)
    );
  }
}

/**
 * Recovers Tier-2 cached search results from SQLite or IndexedDB storage.
 */
export async function sqliteGetSearchCache(queryKey: string): Promise<{ timestamp: number; data: any } | null> {
  const normKey = queryKey.trim().toLowerCase();
  try {
    if (!db && !isFallbackMode) {
      await initLeadsDatabase();
    }

    if (db && !isFallbackMode) {
      const res = db.exec("SELECT timestamp, data FROM search_cache WHERE queryKey = ?", [normKey]);
      if (res.length > 0 && res[0].values.length > 0) {
        const [timestamp, dataStr] = res[0].values[0];
        return {
          timestamp: Number(timestamp),
          data: JSON.parse(String(dataStr))
        };
      }
    }

    // Fallback: Check localforage (IndexedDB)
    const idbCached = await localforage.getItem<{ timestamp: number; data: any }>(`sqlite_search_cache_${normKey}`).catch(() => null);
    if (idbCached) return idbCached;
  } catch (err) {
    console.warn('[SQLite Cache] Error fetching search cache:', err);
  }
  return null;
}

/**
 * Stores Tier-2 search results into SQLite and IndexedDB.
 */
export async function sqliteSetSearchCache(queryKey: string, data: any): Promise<void> {
  const normKey = queryKey.trim().toLowerCase();
  const timestamp = Date.now();
  try {
    if (!db && !isFallbackMode) {
      await initLeadsDatabase();
    }

    // Always store in IndexedDB (localforage) for maximum resilience
    await localforage.setItem(`sqlite_search_cache_${normKey}`, { timestamp, data }).catch(() => {});

    if (db && !isFallbackMode) {
      db.run("INSERT OR REPLACE INTO search_cache (queryKey, timestamp, data) VALUES (?, ?, ?)", [
        normKey,
        timestamp,
        JSON.stringify(data)
      ]);
      await persistToIndexedDB();
    }
  } catch (err) {
    console.warn('[SQLite Cache] Error persisting search cache:', err);
  }
}

/**
 * Clears all Tier-2 search cache entries from SQLite and IndexedDB.
 */
export async function sqliteClearSearchCache(): Promise<void> {
  try {
    if (db && !isFallbackMode) {
      db.run("DELETE FROM search_cache");
      await persistToIndexedDB();
    }
    const keys = await localforage.keys().catch(() => []);
    for (const key of keys) {
      if (key.startsWith('sqlite_search_cache_')) {
        await localforage.removeItem(key).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[SQLite Cache] Error clearing search cache:', err);
  }
}
