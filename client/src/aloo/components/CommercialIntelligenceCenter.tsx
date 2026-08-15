import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History,
  ShieldCheck,
  Brain,
  RefreshCw
} from 'lucide-react';
import { Lead } from '../types';
import { generateCommercialBriefing, CommercialInsight } from '../services/commercialDirectorAgent';
import { downloadSnapshot, createSystemSnapshot } from '../services/systemProtectionService';

interface CommercialIntelligenceCenterProps {
  leads: Lead[];
  onActionClick?: (leadId: string) => void;
}

export const CommercialIntelligenceCenter: React.FC<CommercialIntelligenceCenterProps> = ({ leads, onActionClick }) => {
  const [insights, setInsights] = useState<CommercialInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('last_system_backup'));

  const [lastFetch, setLastFetch] = useState<number>(0);
  const COOLDOWN_MS = 60000; // 1 minuto de intervalo mínimo

  const fetchInsights = async () => {
    const now = Date.now();
    if (now - lastFetch < COOLDOWN_MS && insights.length > 0) {
      return;
    }

    setLoading(true);
    try {
      const data = await generateCommercialBriefing(leads);
      if (data && data.length > 0) {
        setInsights(data);
        setLastFetch(now);
      }
    } catch (err) {
      console.warn('[Briefing] Erro ou limite atingido, pulando...');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = () => {
    const snapshot = createSystemSnapshot(leads, {
      extractionRules: JSON.parse(localStorage.getItem('truck_miner_rules') || '{}'),
      webhooks: JSON.parse(localStorage.getItem('truck_miner_webhooks') || '{}'),
      keywords: JSON.parse(localStorage.getItem('truck_miner_keywords') || '[]')
    });
    downloadSnapshot(snapshot);
    const date = new Date().toLocaleString();
    setLastBackup(date);
    localStorage.setItem('last_system_backup', date);
  };

  useEffect(() => {
    if (leads.length >= 5 && insights.length === 0) {
      const timer = setTimeout(() => {
        fetchInsights();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [leads.length, insights.length]);

  return (
    <div className="space-y-6">
      {/* ENTERPRISE PROTECTION STATUS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Integridade dos dados</span>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ÚLTIMA ATUALIZAÇÃO: {lastBackup || 'AGUARDANDO DADOS'}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleBackup}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-white shadow-sm transition-colors active:scale-[0.98] dark:bg-white dark:text-slate-900"
        >
          <History className="w-4 h-4" />
          Atualizar registro
        </button>
      </div>

      {/* CORE STRATEGIC INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/30" />
            ))
          ) : insights.length > 0 ? (
            insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: idx * 0.1,
                  duration: 0.2,
                }}
                className={`flex cursor-default flex-col justify-between rounded-2xl border p-6 shadow-sm ${
                  insight.priority === 'ALTA' 
                    ? 'bg-slate-900 text-white border-slate-800' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg tracking-[0.1em] uppercase ${
                      insight.priority === 'ALTA' ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {insight.priority} PRIORIDADE
                    </span>
                    <History className="w-3.5 h-3.5 opacity-30" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-black tracking-tight leading-tight uppercase line-clamp-1">{insight.title}</h4>
                    <p className={`text-[13px] leading-relaxed line-clamp-3 font-medium ${
                      insight.priority === 'ALTA' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {insight.description}
                    </p>
                  </div>
                </div>

                <div className={`mt-6 flex items-center justify-between border-t pt-6 ${
                  insight.priority === 'ALTA' ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'
                }`}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">IA estratégica</span>
                    <span className={`text-[10px] font-black ${insight.priority === 'ALTA' ? 'text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>DADOS ANALISADOS</span>
                  </div>
                  <button className={`px-4 py-2 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    insight.priority === 'ALTA' 
                      ? 'bg-white text-slate-900 hover:bg-slate-100' 
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                  }`}>
                    {insight.suggestedAction}
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 py-20 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-6">
                <Brain className="w-8 h-8" />
              </div>
              <p className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest mb-2">Análise comercial disponível</p>
              <p className="text-slate-500 text-xs font-medium max-w-xs text-center leading-relaxed">São necessários pelo menos 5 leads verificados para gerar insights comerciais confiáveis.</p>
              
              <button 
                onClick={fetchInsights}
                className="mt-8 flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar análise
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
