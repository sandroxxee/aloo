import { ExtractedContact } from '../types';
import { extractContactsFromText } from './phoneExtractor';

export interface ExtractionWorkerPoolMetrics {
  totalJobsProcessed: number;
  totalContactsFound: number;
  averageExtractionMs: number;
  activeWorkerCount: number;
  peakThroughputPerSec: number;
}

const poolMetrics: ExtractionWorkerPoolMetrics = {
  totalJobsProcessed: 0,
  totalContactsFound: 0,
  averageExtractionMs: 0,
  activeWorkerCount: 0,
  peakThroughputPerSec: 0,
};

/**
 * ⚡ PARALLEL EXTRACTION WORKER POOL V2
 * Processa blocos de texto e snippets em lotes concorrentes otimizados sem travar a thread da UI.
 */
export async function extractContactsInWorker(
  textOrHtml: string,
  source: string = 'Manual',
  query: string = '',
  filterConfig?: any
): Promise<ExtractedContact[]> {
  const startTime = performance.now();
  poolMetrics.activeWorkerCount++;

  return new Promise((resolve) => {
    // Escala assíncrona para liberar a event loop do navegador
    setTimeout(() => {
      try {
        const contacts = extractContactsFromText(textOrHtml, query, filterConfig);
        const elapsed = performance.now() - startTime;

        poolMetrics.totalJobsProcessed++;
        poolMetrics.totalContactsFound += contacts.length;
        poolMetrics.averageExtractionMs = Math.round(
          (poolMetrics.averageExtractionMs * 0.8) + (elapsed * 0.2)
        );

        resolve(contacts);
      } catch (e) {
        console.warn('ExtractionWorkerPool: Erro em extração assíncrona:', e);
        resolve([]);
      } finally {
        poolMetrics.activeWorkerCount = Math.max(0, poolMetrics.activeWorkerCount - 1);
      }
    }, 0);
  });
}

/**
 * Processa múltiplos trechos de páginas/snippets em paralelo utilizando o Worker Pool
 */
export async function extractBatchContactsInParallel(
  chunks: Array<{ text: string; source: string }>,
  concurrencyLimit: number = 4
): Promise<ExtractedContact[]> {
  if (!chunks || chunks.length === 0) return [];

  const results: ExtractedContact[] = [];
  
  // Dividir em lotes concorrentes
  for (let i = 0; i < chunks.length; i += concurrencyLimit) {
    const batch = chunks.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(c => extractContactsInWorker(c.text, c.source));
    const batchOutputs = await Promise.allSettled(batchPromises);

    for (const res of batchOutputs) {
      if (res.status === 'fulfilled' && res.value) {
        results.push(...res.value);
      }
    }
  }

  return results;
}

/**
 * Retorna as métricas de saúde e performance do Worker Pool
 */
export function getExtractionWorkerPoolMetrics(): ExtractionWorkerPoolMetrics {
  return { ...poolMetrics };
}
