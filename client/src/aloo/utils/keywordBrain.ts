import { KeywordSuggestion, KeywordMetric, KeywordFeedbackItem, TrainingStats } from '../types';

export const DEFAULT_KEYWORDS = [
  'caminhao scania r450 venda',
  'volvo fh 540 seminovo',
  'carreta bicacamba vendo',
  'pecas caminhao mercedes axor',
  'renovacao frota cavalos mecanicos',
  'desmanche pecas pesadas sp',
  'compro iveco stralis batido',
  'venda frotista daf xf'
];

const STORAGE_KEY_KW = 'truck_miner_keywords';
const STORAGE_KEY_SUG = 'truck_miner_suggestions';
const STORAGE_KEY_METRICS = 'truck_miner_kw_metrics';
const STORAGE_KEY_FEEDBACK = 'truck_miner_kw_feedback';
const STORAGE_KEY_TRAINING_ENABLED = 'truck_miner_training_enabled';
const STORAGE_KEY_SEARCHED_CYCLE = 'truck_miner_searched_cycle';

export function getSearchedCycleMemory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SEARCHED_CYCLE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function recordSearchedKeywordInCycle(keyword: string): void {
  try {
    const kw = keyword.trim();
    if (!kw) return;
    const current = getSearchedCycleMemory();
    if (!current.includes(kw)) {
      current.push(kw);
      localStorage.setItem(STORAGE_KEY_SEARCHED_CYCLE, JSON.stringify(current));
    }
  } catch (e) {}
}

export function isSearchedInCurrentCycle(keyword: string): boolean {
  const current = getSearchedCycleMemory();
  return current.includes(keyword.trim());
}

export function clearSearchedCycleMemory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SEARCHED_CYCLE);
  } catch (e) {}
}

export function getSequenceProgress(keywords: string[]): {
  totalCount: number;
  searchedCount: number;
  pendingCount: number;
  percent: number;
  searchedKeywords: string[];
  pendingKeywords: string[];
} {
  const searched = getSearchedCycleMemory();
  const searchedSet = new Set(searched.map(k => k.trim().toLowerCase()));
  
  const searchedList: string[] = [];
  const pendingList: string[] = [];

  keywords.forEach(kw => {
    const cleanKw = kw.trim();
    if (searchedSet.has(cleanKw.toLowerCase())) {
      searchedList.push(cleanKw);
    } else {
      pendingList.push(cleanKw);
    }
  });

  const totalCount = keywords.length;
  const searchedCount = searchedList.length;
  const pendingCount = pendingList.length;
  const percent = totalCount > 0 ? Math.round((searchedCount / totalCount) * 100) : 0;

  return {
    totalCount,
    searchedCount,
    pendingCount,
    percent,
    searchedKeywords: searchedList,
    pendingKeywords: pendingList,
  };
}

export function getStoredKeywords(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KW);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading keywords:', e);
  }
  return DEFAULT_KEYWORDS;
}

export function saveStoredKeywords(keywords: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_KW, JSON.stringify(keywords));
  } catch (e) {
    console.error('Error saving keywords:', e);
  }
}

/**
 * Registra e aprende novos termos descobertos automaticamente durante a mineração (Search Brain V2)
 */
export function autoLearnNewKeyword(newKeyword: string, source: string = 'SearchBrainV2'): boolean {
  try {
    const clean = newKeyword.trim();
    if (!clean || clean.length < 3) return false;
    const current = getStoredKeywords();
    const cleanLower = clean.toLowerCase();
    
    // Verificar se já existe
    const exists = current.some(k => k.trim().toLowerCase() === cleanLower);
    if (!exists) {
      const updated = [clean, ...current];
      saveStoredKeywords(updated);
      console.log(`🧠 [Search Brain V2] Novo termo aprendido e registrado: "${clean}" (Origem: ${source})`);
      return true;
    }
  } catch (e) {
    console.warn('autoLearnNewKeyword: Erro ao salvar novo termo:', e);
  }
  return false;
}

export function getPendingSuggestions(): KeywordSuggestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any, idx: number) => {
            if (typeof item === 'string') {
              return {
                id: `sug_${Date.now()}_${idx}`,
                keyword: item,
                sourceItem: 'Sugestão Salva',
                intent: 'Venda',
                createdAt: new Date().toISOString()
              };
            }
            const kwStr = typeof item?.keyword === 'string'
              ? item.keyword
              : (typeof item?.keyword === 'object' && item.keyword !== null 
                  ? (item.keyword.keyword || item.keyword.name || JSON.stringify(item.keyword)) 
                  : String(item?.keyword || item?.name || item || ''));
            return {
              id: item?.id || `sug_${Date.now()}_${idx}`,
              keyword: kwStr,
              sourceItem: item?.sourceItem || 'Sugestão',
              intent: item?.intent || 'Venda',
              createdAt: item?.createdAt || new Date().toISOString()
            };
          })
          .filter(s => Boolean(s.keyword && typeof s.keyword === 'string' && s.keyword.trim().length > 0));
      }
    }
  } catch (e) {}
  return [];
}

export function savePendingSuggestions(suggestions: KeywordSuggestion[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUG, JSON.stringify(suggestions));
  } catch (e) {}
}

export function getKeywordMetrics(): Record<string, KeywordMetric> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_METRICS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function recordKeywordSearch(keyword: string, leadsCount: number, rawCount: number): void {
  try {
    recordSearchedKeywordInCycle(keyword);

    const metrics = getKeywordMetrics();
    const existing = metrics[keyword] || {
      keyword,
      totalSearches: 0,
      leadsFound: 0,
      validPhonesCount: 0,
      conversionRate: 0,
      status: 'active',
      consecutiveFailures: 0
    };

    existing.totalSearches += 1;
    existing.leadsFound += leadsCount;
    existing.validPhonesCount += rawCount;
    existing.lastSearchedAt = new Date().toISOString();

    if (leadsCount === 0) {
      existing.consecutiveFailures = (existing.consecutiveFailures || 0) + 1;
    } else {
      existing.consecutiveFailures = 0;
    }

    existing.conversionRate = Number(((existing.leadsFound / existing.totalSearches) * 100).toFixed(1));
    metrics[keyword] = existing;

    localStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(metrics));
  } catch (e) {}
}

export function generateProgressiveSuggestions(snippets: string[], currentKeywords: string[]): KeywordSuggestion[] {
  const suggestions: KeywordSuggestion[] = [];
  const currentSet = new Set(currentKeywords.map(k => k.toLowerCase()));
  
  // V3.6: Extração de Termos Dinâmicos dos Snippets para Sugestões Reais
  const potentialTerms = new Set<string>();
  
  const JARGON_REGEXES = [
    /\b(FH\s?EVO)\b/i,
    /\b(540\s?Turbo)\b/i,
    /\b(Bitruck)\b/i,
    /\b(Cavalinho)\b/i,
    /\b(LS\s?6x2)\b/i,
    /\b(Truck\s?pesado)\b/i,
    /\b(Globetrotter)\b/i,
    /\b(IShift)\b/i,
    /\b(Tra[çc]ado)\b/i,
    /\b(Vanderl[ée]ia)\b/i,
    /\b(Graneleiro)\b/i,
    /\b(Bica[çc]amba)\b/i,
    /\b(Basculante)\b/i,
    /\b(Bob-Sponja)\b/i, // Gíria de caminhoneiro
  ];

  for (const snippet of snippets) {
    if (!snippet) continue;
    for (const reg of JARGON_REGEXES) {
      const match = snippet.match(reg);
      if (match && match[1]) {
        const found = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
        if (!currentSet.has(found.toLowerCase())) {
          potentialTerms.add(found);
        }
      }
    }
  }

  // Se não encontrou nada nos snippets, usa os padrões mas com variação
  if (potentialTerms.size === 0) {
    const fallback = ['Volvo FH 500', 'Scania G420', 'Carreta Graneleira', 'Caçamba Basculante'];
    fallback.forEach(t => potentialTerms.add(t));
  }

  Array.from(potentialTerms).slice(0, 5).forEach(term => {
    if (!currentSet.has(term.toLowerCase())) {
      suggestions.push({
        id: `sug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        keyword: term,
        sourceItem: 'Extração Inteligente (Snippet)',
        intent: 'Venda',
        createdAt: new Date().toISOString()
      });
    }
  });

  return suggestions;
}

export async function fetchAiKeywords(topic: string, currentKeywords: string[]): Promise<KeywordSuggestion[]> {
  try {
    const res = await fetch('/api/ai/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, currentKeywords }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.suggestions)) {
        return data.suggestions.map((item: any) => {
          const kwStr = typeof item === 'string'
            ? item
            : (typeof item?.keyword === 'string' ? item.keyword : String(item?.keyword || item?.name || item || ''));
          return {
            id: `ai_kw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            keyword: kwStr,
            sourceItem: 'Gemini AI Brain',
            intent: 'Venda',
            createdAt: new Date().toISOString()
          };
        }).filter((s: { keyword?: unknown }) => Boolean(s.keyword && typeof s.keyword === 'string' && s.keyword.trim().length > 0));
      }
    }
  } catch (e) {}
  return [];
}

export function prioritizeKeywordsByPerformance(keywords: string[]): string[] {
  try {
    const metrics = getKeywordMetrics();
    return [...keywords].sort((a, b) => {
      const mA = metrics[a];
      const mB = metrics[b];

      const leadsA = mA?.leadsFound || 0;
      const leadsB = mB?.leadsFound || 0;
      if (leadsB !== leadsA) return leadsB - leadsA;

      const phonesA = mA?.validPhonesCount || 0;
      const phonesB = mB?.validPhonesCount || 0;
      if (phonesB !== phonesA) return phonesB - phonesA;

      const rateA = mA?.conversionRate || 0;
      const rateB = mB?.conversionRate || 0;
      if (rateB !== rateA) return rateB - rateA;

      const failA = mA?.consecutiveFailures || 0;
      const failB = mB?.consecutiveFailures || 0;
      if (failA !== failB) return failA - failB;

      const searchesA = mA?.totalSearches || 0;
      const searchesB = mB?.totalSearches || 0;
      return searchesA - searchesB;
    });
  } catch (e) {
    return keywords;
  }
}

export function analyzeAndOptimizeQueue(keywords: string[], threshold: number = 10): {
  optimizedKeywords: string[];
  removedLowConversion: string[];
  removedFailed: string[];
} {
  try {
    const metrics = getKeywordMetrics();
    const removedFailed: string[] = [];
    const removedLowConversion: string[] = [];
    const optimizedKeywords = keywords.filter(kw => {
      const m = metrics[kw];
      if (!m) return true;
      if (m.consecutiveFailures && m.consecutiveFailures >= threshold) {
        removedFailed.push(kw);
        return false;
      }
      return true;
    });

    return { optimizedKeywords, removedLowConversion, removedFailed };
  } catch (e) {
    return { optimizedKeywords: keywords, removedLowConversion: [], removedFailed: [] };
  }
}

export function pruneNonConvertingKeywords(keywords: string[]): string[] {
  return keywords;
}

export function pruneConsecutiveFailedKeywords(keywords: string[]): string[] {
  return keywords;
}

// Training / Feedback utils
export function getTrainingFeedback(): KeywordFeedbackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEEDBACK);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function recordKeywordFeedback(keyword: string, feedback: 'like' | 'dislike', intent?: any, item?: string): void {
  try {
    const list = getTrainingFeedback();
    const newItem: KeywordFeedbackItem = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      keyword,
      feedback,
      timestamp: new Date().toISOString(),
      intent,
      item
    };
    list.unshift(newItem);
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(list.slice(0, 200)));
  } catch (e) {}
}

export function removeTrainingFeedback(id: string): void {
  try {
    const list = getTrainingFeedback().filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify(list));
  } catch (e) {}
}

export function clearTrainingFeedback(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_FEEDBACK);
  } catch (e) {}
}

export function getTrainingStats(): TrainingStats {
  const list = getTrainingFeedback();
  const likesCount = list.filter(f => f.feedback === 'like').length;
  const dislikesCount = list.filter(f => f.feedback === 'dislike').length;
  const total = list.length;
  const accuracyEstimate = total > 0 ? Math.round((likesCount / total) * 100) : 85;

  return {
    totalFeedback: total,
    likesCount,
    dislikesCount,
    accuracyEstimate
  };
}

export function getTrainingModeEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_TRAINING_ENABLED) === 'true';
  } catch (e) {
    return false;
  }
}

export function setTrainingModeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_TRAINING_ENABLED, String(enabled));
  } catch (e) {}
}

export interface CrossScanResult {
  optimizedKeywords: string[];
  removedKeywords: { keyword: string; reason: string }[];
  matrixCrossCount: number;
  summary: string;
}

/**
 * Realiza varredura cruzada 'caminhão' vs 'peças' via Gemini AI,
 * removendo automaticamente duplicadas e sinônimos desnecessários.
 */
export async function runCrossScanKeywords(
  currentKeywords: string[],
  truckModels?: string[],
  partsCategories?: string[],
  targetUF?: string
): Promise<CrossScanResult> {
  try {
    const res = await fetch('/api/ai/cross-scan-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: currentKeywords,
        truckModels,
        partsCategories,
        targetUF
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          optimizedKeywords: data.optimizedKeywords || [],
          removedKeywords: data.removedKeywords || [],
          matrixCrossCount: data.matrixCrossCount || 0,
          summary: data.summary || 'Varredura cruzada executada com sucesso!'
        };
      }
    }
  } catch (e) {
    console.error('Erro na varredura cruzada:', e);
  }
  
  // Contingência de deduplicação local
  const cleanList = Array.from(new Set(currentKeywords.map(k => k.trim()))).filter(Boolean);
  return {
    optimizedKeywords: cleanList,
    removedKeywords: [],
    matrixCrossCount: 0,
    summary: 'Deduplicação local de contingência concluída.'
  };
}

/**
 * 🧠 Intelligence: Snippet Learning V2
 * Learns new brands, models, and items from the snippets of found leads.
 */
export function discoverAndLearnNewTermsFromSnippets(leads: any[]): string[] {
  if (!leads || leads.length === 0) return [];
  
  const discoveredTerms = new Set<string>();
  const STOP_WORDS = new Set(['vendo', 'venda', 'vende', 'compro', 'compra', 'troco', 'troca', 'urgente', 'novo', 'seminovo', 'usado']);

  leads.forEach(lead => {
    const text = (lead.snippetContext || lead.item || '').toLowerCase();
    
    // Pattern: [Brand] [Model] [Version]
    // Example: "Volvo FH 540 Globetrotter"
    const modelPatterns = [
      /\b(volvo|scania|mercedes|iveco|daf|vw|man|ford|viale|marcopolo)\s+([a-z0-9-]+)\b/gi,
      /\b(caçamba|graneleiro|bitrem|rodotrem|bau|frigirifico|prancha|tanque)\s+([a-z0-9-]+)\b/gi
    ];

    modelPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const term = match[0].trim();
        if (term.length > 5 && !STOP_WORDS.has(term)) {
          discoveredTerms.add(term);
        }
      }
    });
  });

  return Array.from(discoveredTerms);
}

