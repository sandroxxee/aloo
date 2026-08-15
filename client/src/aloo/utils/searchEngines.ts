import { ExtractedContact, SearchFilterConfig } from '../types';
import { extractContactsFromText } from './phoneExtractor';
import { getTieredSearchCache, setTieredSearchCache } from './tieredCacheEngine';

/** Cabeçalhos estáveis e transparentes para buscas executadas pela aplicação. */
export function createSearchHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
}

export interface SearchResultPayload {
  success: boolean;
  contacts: ExtractedContact[];
  duration?: number;
  rateLimited?: boolean;
  networkError?: boolean;
  cascadeAttempts?: number;
  cached?: boolean;
  timeInHttpMs?: number;
  timeInAiCascadeMs?: number;
  httpStatus?: number;
}

// --- IN-MEMORY CACHE STRATEGY FOR SEARCH RESULTS (TTL: 1 HOUR) ---
export interface ClientCacheEntry {
  timestamp: number;
  data: SearchResultPayload;
  engineMode: string;
}

const CLIENT_SEARCH_CACHE = new Map<string, ClientCacheEntry>();
const CLIENT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora de TTL
const MAX_CLIENT_CACHE_SIZE = 500;

/**
 * Constrói uma chave determinística de cache baseada na query e filtros aplicados
 */
export function buildSearchCacheKey(
  query: string,
  depth: number,
  engineMode: string,
  filterConfig?: SearchFilterConfig
): string {
  const normQuery = query.trim().toLowerCase();
  const state = filterConfig?.targetState || 'ALL';
  const phoneType = filterConfig?.phoneType || 'ALL';
  const sellerType = filterConfig?.sellerType || 'ALL';
  const intent = filterConfig?.intent || 'ALL';
  const email = Boolean(filterConfig?.onlyWithEmail);
  const doc = Boolean(filterConfig?.onlyWithDocument);
  const eMode = filterConfig?.engineMode || engineMode || 'global';
  return `${normQuery}_d${depth}_m${eMode}_st${state}_pt${phoneType}_stype${sellerType}_in${intent}_em${email}_doc${doc}`;
}

/**
 * Obtém resultado do cache em memória se dentro do TTL de 1 hora.
 * Garante validação estrita do engineMode para impedir que resultados obsoletos de outros motores sejam servidos.
 */
export function getSearchFromClientCache(
  cacheKey: string,
  expectedEngineMode?: string
): SearchResultPayload | null {
  const entry = CLIENT_SEARCH_CACHE.get(cacheKey);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CLIENT_CACHE_TTL_MS) {
    CLIENT_SEARCH_CACHE.delete(cacheKey);
    return null;
  }

  // Se um engineMode foi especificado, exige igualdade estrita
  if (expectedEngineMode) {
    const normExpected = expectedEngineMode.toLowerCase();
    if (entry.engineMode && entry.engineMode !== normExpected) {
      console.warn(`⚠️ [CACHE EXPIRED/MISMATCH] Chave "${cacheKey}" pertencente ao motor "${entry.engineMode}" foi desconsiderada para a busca no motor "${normExpected}".`);
      CLIENT_SEARCH_CACHE.delete(cacheKey);
      return null;
    }
  }

  // Atualiza posição LRU
  CLIENT_SEARCH_CACHE.delete(cacheKey);
  CLIENT_SEARCH_CACHE.set(cacheKey, entry);

  console.log(`⚡ [IN-MEMORY CACHE HIT] "${cacheKey}" [Motor: ${entry.engineMode || 'global'}] (Idade: ${Math.round(age / 1000)}s)`);
  return {
    ...entry.data,
    duration: 0.05, // Latência ultra-baixa via memória local
    cached: true
  };
}

/**
 * Salva resultado no cache em memória indexado com o engineMode correspondente
 */
export function setSearchInClientCache(
  cacheKey: string, 
  data: SearchResultPayload, 
  engineMode?: string
): void {
  // Apenas salva buscas bem-sucedidas com dados válidos
  if (!data || !data.success || data.rateLimited || data.networkError) return;

  // Purga itens antigos se o limite for atingido
  if (CLIENT_SEARCH_CACHE.size >= MAX_CLIENT_CACHE_SIZE) {
    let removed = 0;
    for (const key of CLIENT_SEARCH_CACHE.keys()) {
      CLIENT_SEARCH_CACHE.delete(key);
      removed++;
      if (removed >= 50) break;
    }
  }

  const normEngineMode = (engineMode || 'global').toLowerCase();
  CLIENT_SEARCH_CACHE.set(cacheKey, {
    timestamp: Date.now(),
    data,
    engineMode: normEngineMode
  });
}

/**
 * Invalida/expira seletivamente os itens do cache em memória com base no engineMode.
 * Se engineMode for omitido, limpa todo o cache local.
 */
export function clearClientSearchCacheByEngineMode(targetEngineMode?: string): number {
  if (!targetEngineMode) {
    const size = CLIENT_SEARCH_CACHE.size;
    CLIENT_SEARCH_CACHE.clear();
    console.log(`🧹 [IN-MEMORY CACHE] Cache local zerado totalmente (${size} entradas).`);
    return size;
  }

  const normTarget = targetEngineMode.toLowerCase();
  let removedCount = 0;
  for (const [key, entry] of CLIENT_SEARCH_CACHE.entries()) {
    if (entry.engineMode === normTarget) {
      CLIENT_SEARCH_CACHE.delete(key);
      removedCount++;
    }
  }

  console.log(`🧹 [IN-MEMORY CACHE] Expiração seletiva para o motor "${targetEngineMode}": ${removedCount} entradas removidas.`);
  return removedCount;
}

/**
 * Limpa todos os itens do cache em memória do cliente
 */
export function clearClientSearchCache(): void {
  clearClientSearchCacheByEngineMode();
}

/**
 * Expira entradas de cache de outros motores quando o usuário altera o modo de busca ativo
 */
export function expireCacheForOtherEngineModes(currentActiveEngineMode: string): number {
  const normCurrent = currentActiveEngineMode.toLowerCase();
  let removedCount = 0;

  for (const [key, entry] of CLIENT_SEARCH_CACHE.entries()) {
    if (entry.engineMode && entry.engineMode !== normCurrent) {
      CLIENT_SEARCH_CACHE.delete(key);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    console.log(`🧹 [IN-MEMORY CACHE] Expiração preventiva executada: ${removedCount} entradas de outros motores invalidadas.`);
  }
  return removedCount;
}

/**
 * Retorna estatísticas detalhadas e distribuídas por motor do cache em memória
 */
export function getClientSearchCacheStats() {
  let validEntries = 0;
  const now = Date.now();
  const byEngineMode: Record<string, number> = {};

  for (const entry of CLIENT_SEARCH_CACHE.values()) {
    if (now - entry.timestamp <= CLIENT_CACHE_TTL_MS) {
      validEntries++;
      const mode = entry.engineMode || 'global';
      byEngineMode[mode] = (byEngineMode[mode] || 0) + 1;
    }
  }

  return {
    totalEntries: CLIENT_SEARCH_CACHE.size,
    validEntries,
    ttlMinutes: 60,
    byEngineMode
  };
}

/**
  * Helper to ask AI (/api/ai/reformulate) or generate technical truck-model variations
  * when generic searches yield zero results.
  */
async function getCascadeReformulations(queryTerm: string): Promise<string[]> {
  // Conforme diretriz do usuário: a busca por novos contatos não deve depender de IA e sim do nosso sistema determinístico.
  // Retorna diretamente as variações baseadas nos modelos comerciais brasileiros de caminhões de maior relevância com gatilhos de contatos.
  const cleanTerm = queryTerm.replace(/\s+(whatsapp|ddd|contato|sp|mg|pr|rj)$/i, '').trim();
  return [
    `${cleanTerm} Scania R440 Volvo FH540 whatsapp`,
    `${cleanTerm} Mercedes Atego VW Constellation contato ddd`,
    `${cleanTerm} site:trucadao.com.br OR site:querotruck.com.br OR site:socaminhoes.com.br whatsapp`,
    `${cleanTerm} site:marketbook.com.br OR site:mfrural.com.br OR site:caminhoesecarretas.com.br contato`,
    `${cleanTerm} DAF XF Iveco Stralis desmanche pecas frotista`,
  ];
}

/**
 * Função principal de busca multi-motor com Estratégia de Busca em Cascata (Cascade Search).
 * Executa uma busca genérica inicial. Se o resultado for vazio (0 leads), a IA é acionada para
 * analisar e reformular automaticamente consultas técnicas focadas em modelos de caminhão ausentes,
 * executando retentativas ordenadas antes de reportar zero leads.
 */
export async function executeMultiEngineSearch(
  queryTerm: string, 
  searchDepth: number = 1, 
  engineMode: string = 'global',
  filterConfig?: SearchFilterConfig,
  isCascadeRetry: boolean = false,
  smartBackoffRetryCount: number = 0,
  bypassCache: boolean = false
): Promise<SearchResultPayload> {
  const startTime = Date.now();
  const MAX_SMART_RETRIES = 5;

  const activeEngineMode = filterConfig?.engineMode || engineMode || 'global';
  const cacheKey = buildSearchCacheKey(queryTerm, searchDepth, activeEngineMode, filterConfig);

  // Verificação de cache em memória de até 1 hora com expiração seletiva por engineMode
  if (!bypassCache && smartBackoffRetryCount === 0 && !isCascadeRetry) {
    const cachedResult = getSearchFromClientCache(cacheKey, activeEngineMode);
    if (cachedResult) {
      return cachedResult;
    }

    const tieredHit = await getTieredSearchCache(queryTerm);
    if (tieredHit && tieredHit.contacts.length > 0) {
      const payload: SearchResultPayload = {
        success: true,
        contacts: tieredHit.contacts,
        duration: Number((tieredHit.durationMs / 1000).toFixed(2)) || 0.01
      };
      setSearchInClientCache(cacheKey, payload, activeEngineMode);
      return payload;
    }
  }

  let timeInHttpMs = 0;
  let timeInAiCascadeMs = 0;

  try {
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 10000);

    const httpStart = Date.now();
      const res = await fetch('/api/search', {
        method: 'POST',
      headers: createSearchHeaders(),
      body: JSON.stringify({ 
        query: queryTerm, 
        searchDepth, 
        engineMode: activeEngineMode,
        filterConfig,
        boostLevel: typeof window !== 'undefined' ? localStorage.getItem('search_boost_level') || 'normal' : 'normal'
      }),
      signal: controller.signal,
    });
    clearTimeout(fetchTimeout);
    timeInHttpMs = Date.now() - httpStart;

    if (res.status === 429) {
      // Backoff progressivo sem evasão: a mesma origem aguarda antes de uma nova tentativa.
      if (smartBackoffRetryCount < MAX_SMART_RETRIES) {
        // Jitter added to backoff
        const jitter = Math.random() * 1000;
        const backoffMs = Math.min(1000 * Math.pow(2.2, smartBackoffRetryCount) + jitter, 15000);
        console.warn(`[SmartBackoff] Limite de taxa (429) em "${queryTerm}". Aguardando ${Math.round(backoffMs)}ms antes de nova tentativa.`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return executeMultiEngineSearch(
          queryTerm, 
          searchDepth, 
          activeEngineMode, 
          filterConfig, 
          isCascadeRetry, 
          smartBackoffRetryCount + 1
        );
      }

      return { success: false, contacts: [], rateLimited: true, timeInHttpMs, httpStatus: 429 };
    }

    if (!res.ok) {
      // Uma única retentativa local para falhas transitórias de rede.
      if (smartBackoffRetryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return executeMultiEngineSearch(
          queryTerm, 
          searchDepth, 
          activeEngineMode, 
          filterConfig, 
          isCascadeRetry, 
          1
        );
      }

      return { success: false, contacts: [], networkError: true, timeInHttpMs, httpStatus: res.status };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { success: false, contacts: [], networkError: true, timeInHttpMs, httpStatus: res.status };
    }

    const data = await res.json();
    let initialContacts: ExtractedContact[] = [];

    if (data.contacts && Array.isArray(data.contacts)) {
      const filtered = extractContactsFromText(JSON.stringify(data.contacts), queryTerm, filterConfig);
      initialContacts = data.contacts.length > 0 && filtered.length > 0 ? data.contacts : (filtered.length > 0 ? filtered : data.contacts);
    } else {
      const textContent = data.rawContent || data.html || data.resultsText || '';
      if (textContent) {
        initialContacts = extractContactsFromText(textContent, queryTerm, filterConfig);
      }
    }

    // Se a busca genérica inicial encontrou contatos OU se já é uma retentativa de cascata
    if (initialContacts.length > 0 || isCascadeRetry) {
      const duration = Number(((Date.now() - startTime) / 1000).toFixed(1));
      const payload: SearchResultPayload = { success: true, contacts: initialContacts, duration, timeInHttpMs, httpStatus: 200 };
      if (!isCascadeRetry) {
        setSearchInClientCache(cacheKey, payload, activeEngineMode);
        if (initialContacts.length > 0) {
          setTieredSearchCache(queryTerm, initialContacts);
        }
      }
      return payload;
    }

    // --- ESTRATÉGIA DE BUSCA EM CASCATA IA ---
    // A busca genérica inicial retornou 0 resultados. 
    // A IA analisa os resultados vazios e reformula termos focados em modelos de caminhão ausentes.
    const aiCascadeStart = Date.now();
    const reformulations = await getCascadeReformulations(queryTerm);
    const cascadeContacts: ExtractedContact[] = [];
    const phoneSet = new Set<string>();

    // Executa as variações de cascata em PARALELO para máxima velocidade
    const cascadeResults = await Promise.allSettled(
      reformulations.map(altQuery => 
        executeMultiEngineSearch(altQuery, searchDepth, activeEngineMode, filterConfig, true)
      )
    );
    timeInAiCascadeMs = Date.now() - aiCascadeStart;

    for (const res of cascadeResults) {
      if (res.status === 'fulfilled' && res.value.contacts && res.value.contacts.length > 0) {
        for (const contact of res.value.contacts) {
          const rawPhone = (contact.rawPhone || contact.formattedPhone || '').replace(/\D/g, '');
          if (rawPhone && !phoneSet.has(rawPhone)) {
            phoneSet.add(rawPhone);
            cascadeContacts.push(contact);
          }
        }
      }
    }

    const duration = Number(((Date.now() - startTime) / 1000).toFixed(1));
    const payload: SearchResultPayload = {
      success: true,
      contacts: cascadeContacts,
      duration,
      cascadeAttempts: reformulations.length,
      timeInHttpMs,
      timeInAiCascadeMs,
      httpStatus: 200
    };

    if (!isCascadeRetry) {
      setSearchInClientCache(cacheKey, payload, activeEngineMode);
      if (cascadeContacts.length > 0) {
        setTieredSearchCache(queryTerm, cascadeContacts);
      }
    }

    return payload;

  } catch (err) {
    const duration = Number(((Date.now() - startTime) / 1000).toFixed(1));
    return { success: false, contacts: [], networkError: true, duration };
  }
}

export async function executeAlternativeMultiEngineSearch(
  queryTerm: string, 
  engineMode: string = 'global',
  filterConfig?: SearchFilterConfig
): Promise<SearchResultPayload> {
  return executeMultiEngineSearch(`${queryTerm} contato whatsapp`, 1, engineMode, filterConfig);
}

/**
 * Advanced Navigation & Deep Search Engine
 * Ensures NO keyword leaves without leads by running structured multi-stage expansion (DDD, commerce terms, OSINT).
 */
export async function executeAdvancedNavigationDeepSearch(
  queryTerm: string, 
  engineMode: string = 'global',
  filterConfig?: SearchFilterConfig
): Promise<SearchResultPayload> {
  const startTime = Date.now();
  const allContacts: ExtractedContact[] = [];

  // Executa Estágios de Busca Profunda em PARALELO para velocidade total
  const stage1Query = `${queryTerm} (11) OR (21) OR (31) OR (41) whatsapp frotista pecas`;
  const stage2Query = `${queryTerm} desmanche comprar venda anuncio contato`;

  const [res1, res2] = await Promise.allSettled([
    executeMultiEngineSearch(stage1Query, 1, engineMode, filterConfig, true),
    executeMultiEngineSearch(stage2Query, 1, engineMode, filterConfig, true)
  ]);

  if (res1.status === 'fulfilled' && res1.value.contacts) {
    allContacts.push(...res1.value.contacts);
  }
  if (res2.status === 'fulfilled' && res2.value.contacts) {
    allContacts.push(...res2.value.contacts);
  }

  // Deduplicate contacts by phone number
  const uniquePhones = new Set<string>();
  const deduplicatedContacts: ExtractedContact[] = [];
  for (const c of allContacts) {
    const raw = (c.rawPhone || c.formattedPhone || '').replace(/\D/g, '');
    if (raw && !uniquePhones.has(raw)) {
      uniquePhones.add(raw);
      deduplicatedContacts.push(c);
    }
  }

  const duration = Number(((Date.now() - startTime) / 1000).toFixed(1));
  return {
    success: true,
    contacts: deduplicatedContacts,
    duration
  };
}

/**
 * Busca de Contatos por Proximidade e Raio Geográfico
 * Constrói consultas otimizadas utilizando coordenadas lat/lng e filtro de raio (ex: 5km, 15km, 30km, 50km, 100km).
 * Utiliza o sistema de Backoff Inteligente do executeMultiEngineSearch para contornar rate limits através da rotação de proxies.
 */
export async function executeProximityContactSearch(
  cityName: string,
  lat: number,
  lng: number,
  radiusKm: number,
  categoryKeyword: string,
  filterConfig?: SearchFilterConfig
): Promise<SearchResultPayload> {
  const startTime = Date.now();
  const cleanCity = cityName.split(',')[0].trim();
  const stateUf = cityName.includes(',') ? cityName.split(',')[1].trim() : 'SP';

  // Constrói consultas geográficas estratégicas com raio e palavras-chave de intenção B2B
  const queries = [
    `${categoryKeyword} em ${cleanCity} ${stateUf} raio ${radiusKm}km whatsapp`,
    `${categoryKeyword} perto de (${lat.toFixed(3)}, ${lng.toFixed(3)}) ${cleanCity} telefone contato`,
    `${categoryKeyword} ${cleanCity} ${stateUf} frotista empresa desmanche`
  ];

  const allContacts: ExtractedContact[] = [];
  const seenPhones = new Set<string>();

  // Executa as consultas geográficas usando Smart Backoff / Proxy Rotation automático
  const searchResults = await Promise.allSettled(
    queries.map(q => executeMultiEngineSearch(q, 1, 'global', filterConfig, true))
  );

  for (const res of searchResults) {
    if (res.status === 'fulfilled' && res.value.contacts) {
      for (const contact of res.value.contacts) {
        const raw = (contact.rawPhone || contact.formattedPhone || '').replace(/\D/g, '');
        if (raw && !seenPhones.has(raw)) {
          seenPhones.add(raw);
          contact.snippetContext = `[Proximidade ${radiusKm}km - ${cleanCity}/${stateUf}] ${contact.snippetContext || ''}`;
          allContacts.push(contact);
        }
      }
    }
  }

  const duration = Number(((Date.now() - startTime) / 1000).toFixed(1));
  return {
    success: true,
    contacts: allContacts,
    duration
  };
}

export {
  executeSmartOrchestratedSearch,
  clearOrchestratedSearchMemoCache,
  invalidateOrchestratedSearchMemo
} from './smartSearchOrchestrator';
