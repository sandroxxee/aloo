/**
 * Background Runner & WakeLock Utility
 * Mantém o navegador e processador ativos mesmo com a tela desligada ou aba em segundo plano.
 * Utiliza Web Worker para evitar estrangulamento (throttling) de timers pelo navegador.
 */

let wakeLockSentinel: any = null;
let workerInstance: Worker | null = null;

// Solicitar Wake Lock para impedir que a tela/CPU durma
export async function requestScreenWakeLock(): Promise<boolean> {
  try {
    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      console.log('🔒 [WakeLock] Trava de tela/processamento ativada com sucesso.');
      return true;
    }
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.message?.includes('permissions policy')) {
      console.debug('ℹ️ [WakeLock] Trava de tela não permitida no ambiente atual (iframe/policy).');
    } else {
      console.warn('⚠️ [WakeLock] Não foi possível ativar trava de tela:', err);
    }
  }
  return false;
}

// Liberar Wake Lock quando o loop for pausado
export async function releaseScreenWakeLock(): Promise<void> {
  try {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
      console.log('🔓 [WakeLock] Trava de tela/processamento liberada.');
    }
  } catch (err) {}
}

// Re-solicitar Wake Lock quando a página retornar ao foco (se o loop estiver ativo)
export function initWakeLockAutoReacquire(isLoopRunning: () => boolean): () => void {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && isLoopRunning() && !wakeLockSentinel) {
      requestScreenWakeLock();
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

// Web Worker para Timers em 2º Plano sem Estrangulamento (Background Precision Timer)
export function scheduleBackgroundTick(delayMs: number, onTick: () => void): () => void {
  // Limpar worker anterior se existir
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }

  const workerCode = `
    let timerId = null;
    self.onmessage = function(e) {
      if (e.data.action === 'start') {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
          self.postMessage('tick');
        }, e.data.delayMs);
      } else if (e.data.action === 'stop') {
        if (timerId) clearTimeout(timerId);
        timerId = null;
      }
    };
  `;

  try {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    workerInstance = new Worker(url);

    workerInstance.onmessage = (e) => {
      if (e.data === 'tick') {
        onTick();
      }
    };

    workerInstance.postMessage({ action: 'start', delayMs });

    return () => {
      if (workerInstance) {
        workerInstance.postMessage({ action: 'stop' });
        workerInstance.terminate();
        workerInstance = null;
      }
      URL.revokeObjectURL(url);
    };
  } catch (err) {
    // Fallback para setTimeout se Web Workers não forem suportados
    const fallbackTimer = setTimeout(onTick, delayMs);
    return () => clearTimeout(fallbackTimer);
  }
}
