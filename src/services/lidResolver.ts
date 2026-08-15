import { normalizarBR } from './normalizer';

export interface LidResolutionResult {
  exists: boolean;
  jid: string;
  lid: string;
  number?: string;
}

const LID_CACHE_KEY = 'truck_miner_lid_cache_v36';

function getCache(): Record<string, { result: LidResolutionResult; timestamp: number }> {
  try {
    return JSON.parse(localStorage.getItem(LID_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setCache(phone: string, result: LidResolutionResult) {
  try {
    const cache = getCache();
    cache[phone] = { result, timestamp: Date.now() };
    localStorage.setItem(LID_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

/**
 * Resolve LID / JID de um número via Evolution API (/chat/whatsappNumbers/zap) com cache de 24h
 */
export async function resolveLidNumber(rawPhone: string): Promise<LidResolutionResult> {
  const normalized = normalizarBR(rawPhone);
  if (!normalized) return { exists: false, jid: '', lid: '' };

  // Verificar cache (24 horas = 86400000 ms)
  const cache = getCache();
  const cached = cache[normalized];
  if (cached && (Date.now() - cached.timestamp < 86400000)) {
    return cached.result;
  }

  const evoUrl = localStorage.getItem('truck_miner_evo_url') || 'https://api.evolution-api.com';
  const evoKey = localStorage.getItem('truck_miner_evo_key') || '';
  const instanceName = localStorage.getItem('truck_miner_evo_instance') || 'zap';

  try {
    const response = await fetch(`/api/whatsapp/evolution/chat/whatsappNumbers/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiUrl: evoUrl,
        apiKey: evoKey,
        numbers: [normalized]
      })
    });

    if (response.ok) {
      const data = await response.json();
      // Evolution API costuma retornar array com { exists: true, jid: "...", number: "..." }
      const item = Array.isArray(data) ? data[0] : (data.response?.[0] || data);
      
      const result: LidResolutionResult = {
        exists: !!item?.exists || !!item?.jid,
        jid: item?.jid || `${normalized}@s.whatsapp.net`,
        lid: item?.lid || item?.jid || `${normalized}@s.whatsapp.net`,
        number: item?.number || normalized
      };

      setCache(normalized, result);
      return result;
    }
  } catch (err) {
    console.warn('[LidResolver] Erro ao consultar Evolution API, usando fallback:', err);
  }

  // Fallback seguro se offline
  const fallbackResult: LidResolutionResult = {
    exists: true,
    jid: `${normalized}@s.whatsapp.net`,
    lid: `${normalized}@s.whatsapp.net`,
    number: normalized
  };
  setCache(normalized, fallbackResult);
  return fallbackResult;
}

/**
 * Resolve múltiplos números em lote via Evolution API (/chat/whatsappNumbers/zap)
 * Melhora a performance drasticamente ao validar 20+ números por vez
 */
export async function resolveLidBatch(rawPhones: string[]): Promise<Record<string, LidResolutionResult>> {
  const results: Record<string, LidResolutionResult> = {};
  const cache = getCache();
  const toFetch: string[] = [];

  // 1. Filtrar o que já está no cache ou é inválido
  rawPhones.forEach(raw => {
    const norm = normalizarBR(raw);
    if (!norm) return;
    
    const cached = cache[norm];
    if (cached && (Date.now() - cached.timestamp < 86400000)) {
      results[raw] = cached.result;
    } else {
      toFetch.push(norm);
    }
  });

  if (toFetch.length === 0) return results;

  // 2. Chamar API para os números restantes em lotes via proxy
  const evoUrl = localStorage.getItem('truck_miner_evo_url') || 'https://api.evolution-api.com';
  const evoKey = localStorage.getItem('truck_miner_evo_key') || '';
  const instanceName = localStorage.getItem('truck_miner_evo_instance') || 'zap';

  try {
    const response = await fetch(`/api/whatsapp/evolution/chat/whatsappNumbers/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        apiUrl: evoUrl,
        apiKey: evoKey,
        numbers: toFetch 
      })
    });

    if (response.ok) {
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.response || []);

      items.forEach((item: any) => {
        const norm = item.number || item.jid?.split('@')[0];
        if (!norm) return;

        const res: LidResolutionResult = {
          exists: !!item.exists || !!item.jid,
          jid: item.jid || `${norm}@s.whatsapp.net`,
          lid: item.lid || item.jid || `${norm}@s.whatsapp.net`,
          number: norm
        };
        
        setCache(norm, res);
        // Mapear de volta para o rawPhone original se possível, ou pelo número normalizado
        results[norm] = res;
      });
    }
  } catch (err) {
    console.warn('[LidResolver] Falha no lote, os números serão validados no envio individual.', err);
  }

  return results;
}

export const resolveLid = resolveLidNumber;

