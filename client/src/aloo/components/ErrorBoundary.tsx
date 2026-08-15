import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '../utils/errorLogger';
import { clearClientSearchCache } from '../utils/searchEngines';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isChunkLoadError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isChunkLoadError: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunkLoadError = 
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      (error?.name === 'TypeError' && error?.message?.includes('dynamically imported'));

    return { 
      hasError: true, 
      error,
      isChunkLoadError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside React tree:', error, errorInfo);
    this.setState({ errorInfo });

    errorLogger.addLog({
      type: 'react',
      level: 'error',
      message: error?.message || 'Erro capturado no React Component Tree',
      stack: error?.stack || errorInfo?.componentStack || '',
      source: 'React ErrorBoundary'
    });

    // Auto recover from dynamic import failures once to minimize friction
    if (this.state.isChunkLoadError) {
      const hasAutoReloaded = sessionStorage.getItem('auto_reloaded_dynamic_import');
      if (!hasAutoReloaded) {
        sessionStorage.setItem('auto_reloaded_dynamic_import', 'true');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear client storage:', e);
      window.location.reload();
    }
  };

  private handleRecoverConnection = () => {
    try {
      // Clear in-memory search results cache
      clearClientSearchCache();

      // Clear specific lazy-loading retry counts and common caching stores
      sessionStorage.clear();
      
      // Keep non-critical persistent settings but remove any corrupt chunk states
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('lazy-retry-') || key.includes('import') || key.includes('chunk') || key.includes('search_cache')) {
          localStorage.removeItem(key);
        }
      });

      // Clear Service Worker Cache if supported to refresh bundles
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      console.log('🤖 [ErrorBoundary] Cache cleared. Performing fresh application reload.');
      window.location.reload();
    } catch (e) {
      console.error('Failed to fully clear caches during connection recovery:', e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.state.isChunkLoadError) {
        return (
          <div id="error-boundary-screen-chunk" className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
            <div id="error-boundary-card-chunk" className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xl">
                  ⚡
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-100">Atualização de Módulo Pendente</h1>
                  <p className="text-slate-400 text-sm mt-0.5">O servidor enviou novos arquivos e o seu navegador precisa re-sincronizar.</p>
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 mb-6 text-xs text-slate-300 border border-slate-900 leading-relaxed">
                <p className="mb-2 font-semibold text-amber-400">Status Técnico: Conexão Interrompida ou Chunk Pendente</p>
                <p className="text-slate-400">
                  Isto geralmente ocorre quando o aplicativo é atualizado em tempo de execução ou quando há instabilidade temporária de rede.
                </p>
                <div className="mt-2 font-mono text-xs text-slate-500 break-all border-t border-slate-900 pt-2">
                  {this.state.error?.message}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                <button
                  id="btn-recover-connection"
                  onClick={this.handleRecoverConnection}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  🔄 Recuperar Conexão
                </button>
                
                <button
                  id="btn-error-reset-fallback"
                  onClick={this.handleReset}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white font-medium rounded-xl transition-all cursor-pointer text-sm"
                >
                  Forçar Limpeza Total
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div id="error-boundary-screen" className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div id="error-boundary-card" className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Algo deu errado na renderização</h1>
                <p className="text-slate-400 text-sm mt-0.5">Um erro inesperado impediu o aplicativo de iniciar.</p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 mb-6 font-mono text-xs text-red-400 overflow-auto max-h-60 border border-slate-900 leading-relaxed whitespace-pre-wrap">
              <strong>{this.state.error?.name}: {this.state.error?.message}</strong>
              {this.state.error?.stack && (
                <div className="mt-2 text-slate-500 border-t border-slate-900 pt-2">
                  {this.state.error.stack}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <button
                id="btn-error-reload"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-md"
              >
                Tentar Novamente
              </button>
              
              <button
                id="btn-error-reset"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white font-medium rounded-xl transition-all cursor-pointer text-sm"
              >
                Limpar Cache e Redefinir App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
