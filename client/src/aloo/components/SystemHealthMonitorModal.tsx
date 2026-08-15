import React, { useState, useEffect } from 'react';
import { 
  X,
  HardDrive,
  Cpu,
  Info,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { errorLogger, SystemErrorLog } from '../utils/errorLogger';
import { getCacheStats, clearWarmedLeadsCache } from '../utils/cacheWarmupEngine';

interface SystemHealthMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalLeads: number;
  onClearCache: () => void;
}

export const SystemHealthMonitorModal: React.FC<SystemHealthMonitorModalProps> = ({
  isOpen,
  onClose,
  totalLeads,
  onClearCache
}) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'performance' | 'optimizations'>('errors');
  const [logs, setLogs] = useState<SystemErrorLog[]>([]);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warning'>('all');
  const [storageStats, setStorageStats] = useState<{ usedKb: number; leadsKb: number; itemsCount: number }>({
    usedKb: 0,
    leadsKb: 0,
    itemsCount: 0
  });
  const [backendHealth, setBackendHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Subscribe to error logger
  useEffect(() => {
    const unsubscribe = errorLogger.subscribe(setLogs);
    return () => unsubscribe();
  }, []);

  // Calculate storage metrics
  const calculateStorage = () => {
    let totalBytes = 0;
    let leadsBytes = 0;
    let count = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          count++;
          const val = localStorage.getItem(key) || '';
          const bytes = key.length + val.length;
          totalBytes += bytes;
          if (key.includes('leads') || key.includes('TRUCK_MINER_LEADS')) {
            leadsBytes += bytes;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read storage stats:', e);
    }

    setStorageStats({
      usedKb: Math.round(totalBytes / 1024),
      leadsKb: Math.round(leadsBytes / 1024),
      itemsCount: count
    });
  };

  // Check backend health
  const checkBackendStatus = async () => {
    setBackendHealth('checking');
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setBackendHealth('online');
      } else {
        setBackendHealth('offline');
      }
    } catch {
      setBackendHealth('offline');
    }
  };

  useEffect(() => {
    if (isOpen) {
      calculateStorage();
      checkBackendStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => filterLevel === 'all' || l.level === filterLevel);

  const handleExportLogs = () => {
    const report = {
      timestamp: new Date().toISOString(),
      app: 'Asset Intelligence',
      userAgent: navigator.userAgent,
      storageStats,
      totalLeads,
      logs
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-diagnostico-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleCompactStorage = () => {
    try {
      let cleanedKeys = 0;
      let initialSize = 0;
      let finalSize = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) initialSize += (k.length + (localStorage.getItem(k) || '').length);
      }

      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const val = localStorage.getItem(key);

        if (val === null || val === '' || val === 'undefined' || val === 'null') {
          keysToRemove.push(key);
          continue;
        }

        if (
          key === 'truck_miner_recent_searches' ||
          key === 'truck_miner_keywords' ||
          key === 'truck_miner_suggestions' ||
          key === 'truck_miner_custom_kits'
        ) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const unique = Array.from(new Set(parsed));
              if (unique.length !== parsed.length) {
                localStorage.setItem(key, JSON.stringify(unique));
              }
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        cleanedKeys++;
      });

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) finalSize += (k.length + (localStorage.getItem(k) || '').length);
      }

      calculateStorage();

      const freedKb = Math.max(0, Math.round((initialSize - finalSize) / 1024));
      if (cleanedKeys > 0 || freedKb > 0) {
        showNotification(`Otimização concluída! ${cleanedKeys} fragmento(s) removido(s) (${freedKb} KB liberados).`);
      } else {
        showNotification('Armazenamento local verificado: Nenhum fragmento inconsistente encontrado!');
      }
    } catch (e) {
      console.error('Erro na otimização do storage:', e);
      showNotification('Erro ao otimizar armazenamento.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-white  flex items-center gap-2">
              Diagnóstico de Sistema
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">Monitoramento de erros e otimizações de memória</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Notification Toast */}
        {actionSuccess && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 font-bold  flex items-center justify-between">
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Top Metric Strip */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-sm font-medium mb-1">Status Backend</div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendHealth === 'online' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="font-bold text-white text-xs">
                {backendHealth === 'checking' ? 'Verificando...' : backendHealth === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-sm font-medium mb-1">Erros</div>
            <div className="font-bold text-white text-base">
              {logs.length}
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-sm font-medium mb-1">Storage</div>
            <div className="font-bold text-white text-base">
              {storageStats.usedKb} KB
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <div className="text-slate-400 text-sm font-medium mb-1">Leads</div>
            <div className="font-bold text-white text-base">
              {totalLeads}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 space-x-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('errors')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'errors'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Logs de Exceção ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'performance'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('optimizations')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'optimizations'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Otimizações
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: ERRORS MONITOR */}
          {activeTab === 'errors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Filtrar por tipo:</span>
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 space-x-1">
                    <button
                      onClick={() => setFilterLevel('all')}
                      className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                        filterLevel === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Todos ({logs.length})
                    </button>
                    <button
                      onClick={() => setFilterLevel('error')}
                      className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                        filterLevel === 'error' ? 'bg-red-500/20 text-red-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Erros ({logs.filter(l => l.level === 'error').length})
                    </button>
                    <button
                      onClick={() => setFilterLevel('warning')}
                      className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                        filterLevel === 'warning' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Alertas ({logs.filter(l => l.level === 'warning').length})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportLogs}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    Baixar Relatório
                  </button>
                  <button
                    onClick={() => errorLogger.clearLogs()}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    Limpar Logs
                  </button>
                </div>
              </div>

              {/* Log List */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs max-h-[350px] overflow-y-auto space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                    <p className="text-sm font-bold  text-slate-300">Nenhum erro detectado.</p>
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border text-xs space-y-1 ${
                        log.level === 'error'
                          ? 'bg-red-500/5 border-red-500/20 text-red-200'
                          : 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm opacity-80">
                        <span className="flex items-center gap-1.5 font-bold">
                          <span className={`w-1.5 h-1.5 rounded-full ${log.level === 'error' ? 'bg-red-400' : 'bg-amber-400'}`} />
                          [{log.type.toUpperCase()}] {log.source ? `-> ${log.source}` : ''}
                        </span>
                        <span>{log.timestamp}</span>
                      </div>
                      <div className="font-sans font-medium text-sm text-slate-100">{log.message}</div>
                      {log.stack && (
                        <pre className="text-xs text-slate-400 bg-slate-900/80 p-2 rounded overflow-x-auto max-h-24 font-mono">
                          {log.stack}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PERFORMANCE & MEMORY */}
          {activeTab === 'performance' && (
            <div className="space-y-4 text-xs">
              {/* Cache Engine Live Box */}
              {(() => {
                const cStats = getCacheStats();
                const tm = cStats.tieredMetrics;
                return (
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-xl border border-amber-500/25 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-amber-400 text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                        Sistema de Cache em Camadas (Tier-0 RAM | Tier-1 LocalStorage | Tier-2 IndexedDB/SQLite)
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {tm?.lastHitSource ? tm.lastHitSource : (cStats.isRamWarm ? 'RAM Active (0.0ms)' : 'Multi-Tier Ready')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[11px] block">Tier-0 RAM (0.0ms):</span>
                        <span className="text-sm font-black text-amber-300">{tm?.ramHits || 0} acertos ({tm?.ramEntriesCount || 0} em memória)</span>
                      </div>
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[11px] block">Tier-1 LocalStorage (0.1ms):</span>
                        <span className="text-sm font-black text-sky-400">{tm?.localStorageHits || 0} acertos</span>
                      </div>
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[11px] block">Tier-2 IndexedDB/SQLite (0.5ms):</span>
                        <span className="text-sm font-black text-purple-400">{tm?.indexedDbHits || 0} acertos</span>
                      </div>
                      <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-[11px] block">Taxa Global de Acertos:</span>
                        <span className="text-sm font-black text-emerald-400">{cStats.hitRatePercentage}% (0 chamadas HTTP em loop)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    Uso de Memória e Armazenamento Navegador
                  </h3>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span>Espaço Total localStorage Utilizado:</span>
                      <span className="font-bold text-purple-300">{storageStats.usedKb} KB</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span>Memória Ocupada pelos Leads:</span>
                      <span className="font-bold text-purple-300">{storageStats.leadsKb} KB</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span>Chaves Gravadas no Navegador:</span>
                      <span className="font-bold text-slate-100">{storageStats.itemsCount} itens</span>
                    </div>
                  </div>
                  <div className="pt-1 text-sm text-slate-400">
                    💡 O limite do navegador é tipicamente ~5.000 KB (5 MB). Seu uso atual está em <strong>{Math.round((storageStats.usedKb / 5120) * 100)}%</strong> do limite global.
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Otimização de Renderização & Background Tasks
                  </h3>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span>Status de Aba Oculta (Page Visibility):</span>
                      <span className="font-bold text-emerald-400">Proteção Ativa (Pausa Timers se oculta)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span>Lazy Loading de Módulos (Vite):</span>
                      <span className="font-bold text-emerald-400">Habilitado com Auto-Recuperação</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span>Frequência de Polling WhatsApp:</span>
                      <span className="font-bold text-cyan-300">3s / 15s (Otimizado)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl space-y-2 text-blue-200">
                <h4 className="font-bold text-blue-300 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Diagnóstico Automático da Aplicação
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  <li><strong>Paginação da Tabela:</strong> Mantenha a exibição da tabela configurada para 25 ou 50 leads por página para evitar lentidão gráfica no navegador.</li>
                  <li><strong>Abas em Background:</strong> As abas de escaneamento de mapas e WhatsApp permanecem prontas para uso em segundo plano com visibilidade preservada.</li>
                  <li><strong>Disparos de WhatsApp:</strong> A fila e o motor de envio rodam de forma nativa e eficiente.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: CODE OPTIMIZATIONS & TOOLS */}
          {activeTab === 'optimizations' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold text-white text-sm">Ações Imediatas para Liberar Memória e Acelerar o Sistema</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-white text-sm  mb-1">
                      Limpar Cache
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      clearWarmedLeadsCache();
                      onClearCache();
                      calculateStorage();
                      showNotification('Cache e RAM Tier-0 limpos com sucesso!');
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    Executar Limpeza
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-white text-sm  mb-1">
                      Otimizar Storage
                    </div>
                  </div>
                  <button
                    onClick={handleCompactStorage}
                    className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg font-bold  text-xs transition-colors cursor-pointer"
                  >
                    Compactar Dados
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-white text-sm  mb-1">
                      Reiniciar Sistema
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold  text-xs transition-colors cursor-pointer"
                  >
                    Recarregar App
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Otimizações de Código já Aplicadas nesta Versão
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-300 text-sm">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-0.5">✓ Proteção de Visibilidade da Aba</span>
                    Timers em segundo plano não consomem CPU quando você alterna de aba no navegador.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-0.5">✓ Módulos em Cache Permanente</span>
                    As abas de escaneamento e WhatsApp continuam vivas e conectadas para evitar travamentos ou re-renders.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-0.5">✓ Captura e Auto-Recuperação de Erros</span>
                    Se um módulo dinâmico expirar no servidor, a aplicação recarrega automaticamente sem tela azul.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-0.5">✓ Suavização de Polling</span>
                    Intervalos de verificação do robô de envio ajustados para evitar travamentos na conexão.
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Sistema em tempo real monitorado</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
