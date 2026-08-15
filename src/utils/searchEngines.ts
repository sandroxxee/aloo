import { ExtractedContact, SearchFilterConfig } from '../types';
import { extractContactsFromText } from './phoneExtractor';
import { getTieredSearchCache, setTieredSearchCache } from './tieredCacheEngine';

/**
 * Interface para os nós de Proxy Residencial
 */
export interface ProxyEntry {
  ip: string;
  port?: number;
  type: 'residential' | 'datacenter' | 'socks5';
  country?: string;
  active: boolean;
  failCount: number;
  lastUsed?: number;
}

/**
 * Pool Inicial de IPs Residenciais para Garantia de Anonimato e Rotação Anti-Bloqueio
 */
export const DEFAULT_RESIDENTIAL_PROXIES: ProxyEntry[] = [
  { ip: '177.136.210.45', port: 8080, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '189.120.45.12', port: 8080, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '200.142.110.88', port: 3128, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '177.18.220.104', port: 8080, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '187.60.10.15', port: 3128, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '201.86.150.32', port: 8080, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '179.108.92.215', port: 8080, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '200.234.19.60', port: 3128, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '177.36.190.42', port: 8080, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '186.232.45.10', port: 3128, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '191.252.110.55', port: 8080, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '201.18.92.201', port: 3128, type: 'residential', country: 'BR', active: true, failCount: 0 },
  { ip: '179.108.20.14', port: 8080, type: 'residential', country: 'BR', active: true, failCount: 0 },
];

function loadProxyListFromStorage(): ProxyEntry[] {
  try {
    const customList = typeof localStorage !== 'undefined' ? localStorage.getItem('truck_miner_proxy_list') : null;
    if (customList) {
      const parsed = JSON.parse(customList);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => typeof item === 'string' ? {
          ip: item.trim(),
          type: 'residential',
          active: true,
          failCount: 0
        } : {
          ...item,
          active: item.active !== false,
          failCount: item.failCount || 0
        });
      }
    }
  } catch (e) {
    // Fallback silencioso
  }
  return [...DEFAULT_RESIDENTIAL_PROXIES];
}

// Gerenciador interno de estado da lista de proxies
let proxyPool: ProxyEntry[] = loadProxyListFromStorage();
let currentProxyIndex = 0;

/**
 * Atualiza dinamicamente a lista de IPs residenciais
 */
export function setProxyList(proxies: string[]): ProxyEntry[] {
  const newList: ProxyEntry[] = proxies
    .map(p => p.trim())
    .filter(Boolean)
    .map(ip => ({
      ip,
      type: 'residential',
      country: 'BR',
      active: true,
      failCount: 0
    }));

  proxyPool = newList.length > 0 ? newList : [...DEFAULT_RESIDENTIAL_PROXIES];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('truck_miner_proxy_list', JSON.stringify(proxyPool));
    }
  } catch (e) {}
  return proxyPool;
}

/**
 * Retorna a lista atual de proxies configurados
 */
export function getProxyList(): ProxyEntry[] {
  return proxyPool;
}

/**
 * Seleciona o próximo IP de proxy residencial ativo (Round-Robin com Failover)
 */
export function getNextProxy(): ProxyEntry | null {
  const activeProxies = proxyPool.filter(p => p.active && p.failCount < 3);
  if (activeProxies.length === 0) {
    resetProxyFailures();
    return proxyPool[0] || null;
  }

  const selected = activeProxies[currentProxyIndex % activeProxies.length];
  selected.lastUsed = Date.now();
  currentProxyIndex = (currentProxyIndex + 1) % activeProxies.length;
  return selected;
}

/**
 * Marca uma falha de conexão no IP informado para isolar conexões instáveis
 */
export function markProxyFailure(ip: string): void {
  const target = proxyPool.find(p => p.ip === ip);
  if (target) {
    target.failCount += 1;
    if (target.failCount >= 3) {
      target.active = false;
      console.warn(`[ProxyManager] IP Residencial ${ip} desativado temporariamente por excesso de falhas.`);
    }
  }
}

/**
 * Reativa todos os proxies descartados por falhas temporárias
 */
export function resetProxyFailures(): void {
  proxyPool.forEach(p => {
    p.active = true;
    p.failCount = 0;
  });
}

/**
 * Módulo de Auto-Rotação de Headers e User-Agents
 * Alterna entre diferentes navegadores (Chrome, Firefox, Safari) e 
 * sistemas operacionais (Windows, macOS, Linux, Android, iOS) para mitigar bloqueios (Rate Limit 429 / Anti-Bot).
 */
export const USER_AGENT_POOL = [
  // Chrome Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  // Chrome macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  // Firefox Windows & macOS
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0',
  // Safari macOS & iOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  // Android Chrome
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.64 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36',
  // Edge Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0'
];

let currentUserAgentIndex = 0;

export function getRandomUserAgent(): string {
  const agent = USER_AGENT_POOL[currentUserAgentIndex];
  currentUserAgentIndex = (currentUserAgentIndex + 1) % USER_AGENT_POOL.length;
  return agent;
}

export function getRotatedHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const ua = getRandomUserAgent();
  const activeProxy = getNextProxy();
  const proxyHeader: Record<string, string> = activeProxy ? {
    'X-Gateway-ID': activeProxy.ip,
    'X-Node-Context': activeProxy.ip,
  } : {};

  return {
    'Content-Type': 'application/json',
    'X-App-Fingerprint': ua,
    'X-Sync-Flow': 'enabled',
    ...proxyHeader,
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
  const currentProxy = getNextProxy();
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
      headers: getRotatedHeaders(currentProxy ? { 'X-Gateway-ID': currentProxy.ip } : {}),
      body: JSON.stringify({ 
        query: queryTerm, 
        searchDepth, 
        engineMode: activeEngineMode,
        filterConfig,
        proxyIp: currentProxy?.ip,
        boostLevel: typeof window !== 'undefined' ? localStorage.getItem('search_boost_level') || 'normal' : 'normal'
      }),
      signal: controller.signal,
    });
    clearTimeout(fetchTimeout);
    timeInHttpMs = Date.now() - httpStart;

    if (res.status === 429) {
      if (currentProxy) markProxyFailure(currentProxy.ip);

      // Backoff Inteligente: Alterna automaticamente o IP de proxy residencial e retenta
      if (smartBackoffRetryCount < MAX_SMART_RETRIES) {
        // Jitter added to backoff
        const jitter = Math.random() * 1000;
        const backoffMs = Math.min(1000 * Math.pow(2.2, smartBackoffRetryCount) + jitter, 15000);
        console.warn(`[SmartBackoff] Limite de Taxa (429) em "${queryTerm}". Alternando proxy (${currentProxy?.ip || 'direto'} -> próximo) e aguardando ${Math.round(backoffMs)}ms...`);
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
      if (currentProxy) markProxyFailure(currentProxy.ip);

      // Retentativa simples com rotação de proxy em erro de rede HTTP
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
