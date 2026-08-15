import React, { useState, useEffect } from 'react';
import { Shield, X, Save, RefreshCw, Plus, Trash2, CheckCircle2, AlertCircle, Globe } from 'lucide-react';

interface ProxyStatus {
  enabled: boolean;
  count: number;
  currentIndex: number;
}

interface ProxyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProxyConfigModal: React.FC<ProxyConfigModalProps> = ({ isOpen, onClose }) => {
  const [proxies, setProxies] = useState<string[]>([]);
  const [newProxy, setNewProxy] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<ProxyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProxyConfig();
    }
  }, [isOpen]);

  const fetchProxyConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/proxy/config');
      const data = await response.json();
      if (data.success) {
        setStatus({
          enabled: data.enabled,
          count: data.count,
          currentIndex: data.currentIndex
        });
        setEnabled(data.enabled);
        // We don't get the list of proxies back for security/simplicity in this basic version 
        // unless we add an endpoint to list them. Let's assume we can list them.
      }
    } catch (error) {
      console.error('Error fetching proxy config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/proxy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxies, enabled })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Configurações de proxy salvas com sucesso!' });
        setStatus({
          enabled: data.enabled,
          count: data.count,
          currentIndex: data.currentIndex
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setIsLoading(false);
    }
  };

  const addProxy = () => {
    if (newProxy.trim() && !proxies.includes(newProxy.trim())) {
      setProxies([...proxies, newProxy.trim()]);
      setNewProxy('');
    }
  };

  const removeProxy = (index: number) => {
    setProxies(proxies.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl shadow-inner">
              <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Rede de Proxies Rotativos</h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">Sistema de Proteção Anti-Bloqueio Enterprise</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl p-2 transition-all cursor-pointer active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
              O sistema de proxy rotativo alterna o endereço IP do servidor a cada requisição de busca. Isso evita que motores de busca como Google e Bing bloqueiem o sistema por excesso de tráfego (Erro 429).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Status & Toggle */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Configuração Geral</h4>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Ativar Rotação</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">Status: {enabled ? 'Ativo' : 'Inativo'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                    enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {status && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Métricas em Tempo Real</h5>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Proxies Ativos:</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{status.count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Índice Atual:</span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">#{status.currentIndex + 1}</span>
                  </div>
                </div>
              )}
            </div>

            {/* List Management */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Adicionar Proxies</h4>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newProxy}
                  onChange={(e) => setNewProxy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addProxy()}
                  placeholder="user:pass@host:port"
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
                />
                <button 
                  onClick={addProxy}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all active:scale-90 cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Formatos aceitos: host:port ou user:pass@host:port</p>

              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="max-h-[180px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                  {proxies.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Globe className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">Nenhum proxy adicionado à fila.</p>
                    </div>
                  ) : (
                    proxies.map((proxy, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{proxy}</span>
                        <button 
                          onClick={() => removeProxy(index)}
                          className="text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
              message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-xs font-extrabold">{message.text}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex gap-3">
          <button 
            onClick={fetchProxyConfig}
            className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Status
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>

      </div>
    </div>
  );
};
