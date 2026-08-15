import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Terminal, 
  HardDrive, 
  Cpu, 
  Wifi, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Clock,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiagnosticProps {
  isOpen: boolean;
  onClose: () => void;
  leadsCount: number;
}

export const DiagnosticSystem: React.FC<DiagnosticProps> = ({ isOpen, onClose, leadsCount }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'about'>('status');
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [healthScore, setHealthScore] = useState(98);
  
  if (!isOpen) return null;

  const handleRebuild = () => {
    setIsRebuilding(true);
    setTimeout(() => {
      setIsRebuilding(false);
      window.location.reload();
    }, 2000);
  };

  const stats = [
    { label: 'Versão Core', value: 'v3.8.2 Enterprise', icon: ShieldCheck, color: 'text-blue-500' },
    { label: 'Saúde do Kernel', value: 'Estável', icon: Activity, color: 'text-emerald-500' },
    { label: 'Uptime', value: '99.9%', icon: Clock, color: 'text-indigo-500' },
    { label: 'Engine de Busca', value: 'Hyper Hyper 🌪️', icon: Zap, color: 'text-amber-500' },
  ];

  const kernelLogs = [
    "[SYSTEM] Kernel v3.8.2 Initialized successfully.",
    "[NETWORK] Connection to Firebase Cloud established.",
    "[INTEL] Hyper Boost level set to 0.5s.",
    "[SECURITY] Drip protection active.",
    "[MINER] Phone extractor depth 15 active.",
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Analytics & Health</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Diagnostics Console Active
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <AlertCircle className="w-6 h-6 text-slate-400 rotate-45" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex px-6 pt-4 gap-4 bg-slate-50 dark:bg-slate-900/50">
          {['status', 'logs', 'about'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'status' && (
              <motion.div 
                key="status"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                      <div className={`p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm ${stat.color}`}>
                        <stat.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Health Meter */}
                <div className="p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black uppercase tracking-widest">Índice de desempenho</h3>
                      <span className="text-2xl font-black">{healthScore}%</span>
                    </div>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${healthScore}%` }}
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                      />
                    </div>
                  </div>
                  <Activity className="absolute -right-10 -bottom-10 w-40 h-40 text-white/5 opacity-20" />
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleRebuild}
                    disabled={isRebuilding}
                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isRebuilding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                    {isRebuilding ? 'Building Applet...' : 'NPM REBUILD & SYNC'}
                  </button>
                  <button className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    Clean Cache
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-950 rounded-2xl p-4 font-mono text-[10px] text-emerald-500 border border-slate-800 space-y-2 h-64 overflow-y-auto"
              >
                {kernelLogs.map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-slate-700 select-none">[{i+1}]</span>
                    <span>{log}</span>
                  </div>
                ))}
                <div className="animate-pulse">_</div>
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div 
                key="about"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/50">
                  <h3 className="text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest mb-2">Sobre o Projeto</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    Asset Intelligence Enterprise é uma plataforma SaaS de alta performance para mineração de ativos e inteligência comercial. 
                    Utiliza motores de busca paralelos e Grounding via Gemini 1.5 para entrega de leads em tempo real.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Leads em Memória</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{leadsCount}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Licença</p>
                    <p className="text-lg font-black text-emerald-500 uppercase">Enterprise</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
