export interface SystemErrorLog {
  id: string;
  timestamp: string;
  type: 'runtime' | 'promise' | 'network' | 'react' | 'system';
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  source?: string;
}

type LogListener = (logs: SystemErrorLog[]) => void;

class ErrorLogger {
  private logs: SystemErrorLog[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 100;

  constructor() {
    this.initGlobalHandlers();
  }

  private initGlobalHandlers() {
    if (typeof window === 'undefined') return;

    // Capture unhandled JS errors
    window.addEventListener('error', (event) => {
      // Ignore benign Vite/HMR WebSocket connection warnings
      if (
        event.message?.includes('vite') ||
        event.message?.includes('WebSocket') ||
        event.message?.includes('closed without opened')
      ) {
        try {
          event.preventDefault();
          event.stopImmediatePropagation();
        } catch (e) {}
        return;
      }

      this.addLog({
        type: 'runtime',
        level: 'error',
        message: event.message || 'Erro de execução desconhecido',
        source: `${event.filename || 'script'}:${event.lineno || 0}:${event.colno || 0}`,
        stack: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let msg = 'Promessa rejeitada não tratada';
      let stack = '';

      if (typeof reason === 'string') {
        msg = reason;
      } else if (reason instanceof Error) {
        msg = reason.message;
        stack = reason.stack || '';
      } else if (reason && typeof reason === 'object') {
        msg = JSON.stringify(reason);
      }

      // Ignore benign Vite/HMR WebSocket connection warnings
      if (
        msg.includes('WebSocket') ||
        msg.includes('closed without opened') ||
        msg.includes('vite') ||
        stack.includes('@vite/client')
      ) {
        try {
          event.preventDefault();
          event.stopImmediatePropagation();
        } catch (e) {}
        return;
      }

      // Ignore standard dynamic import reloads
      if (msg.includes('Failed to fetch dynamically imported module')) {
        this.addLog({
          type: 'system',
          level: 'warning',
          message: 'Atualização de módulo em progresso (Auto-recuperação ativa)',
          stack
        });
        return;
      }

      this.addLog({
        type: 'promise',
        level: 'error',
        message: msg,
        stack
      });
    });

    // Intercept fetch safely to track failed API endpoints without breaking read-only window.fetch
    try {
      const originalFetch = window.fetch;
      if (typeof originalFetch === 'function') {
        const customFetch = async (...args: Parameters<typeof fetch>) => {
          try {
            const response = await originalFetch.apply(window, args);
            if (!response.ok && response.status >= 400 && response.status !== 404) {
              const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url;
              if (url?.includes('/api/')) {
                this.addLog({
                  type: 'network',
                  level: 'warning',
                  message: `Serviço backend respondeu com HTTP ${response.status}: ${url}`,
                  source: url
                });
              }
            }
            return response;
          } catch (err: any) {
            const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url;
            if (err?.name !== 'AbortError' && url?.includes('/api/')) {
              this.addLog({
                type: 'network',
                level: 'warning',
                message: `Falha de conexão no endpoint: ${url}`,
                source: url,
                stack: err?.stack
              });
            }
            throw err;
          }
        };

        try {
          window.fetch = customFetch;
        } catch {
          try {
            Object.defineProperty(window, 'fetch', {
              value: customFetch,
              writable: true,
              configurable: true
            });
          } catch (e) {
            console.warn('Network Monitor: window.fetch is read-only and non-configurable.', e);
          }
        }
      }
    } catch (err) {
      console.warn('Monitor de rede não pôde sobrescrever window.fetch:', err);
    }
  }

  public addLog(entry: Omit<SystemErrorLog, 'id' | 'timestamp'>) {
    const newLog: SystemErrorLog = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // Avoid duplicated consecutive logs
    const lastLog = this.logs[0];
    if (lastLog && lastLog.message === newLog.message && lastLog.type === newLog.type) {
      return;
    }

    this.logs = [newLog, ...this.logs.slice(0, this.maxLogs - 1)];
    this.notify();
  }

  public getLogs(): SystemErrorLog[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentLogs = this.getLogs();
    this.listeners.forEach(l => l(currentLogs));
  }
}

export const errorLogger = new ErrorLogger();
