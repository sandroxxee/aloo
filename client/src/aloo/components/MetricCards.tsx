import React, { useMemo, memo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp,
  TrendingDown,
  Database,
  CheckCircle2,
  Globe2,
  Cpu,
  Info,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Lead } from '../types';

interface MetricCardsProps {
  totalLeads: number;
  sessionNewLeads: number;
  totalSearches: number;
  autoSourceCount: number;
  manualSourceCount: number;
  cacheHits: number;
  onClearCache: () => void;
  leads?: Lead[];
}

interface SourceDataItem {
  name: string;
  value: number;
  color: string;
  description: string;
  totalVal?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SourceDataItem;
    const total = data.totalVal && data.totalVal > 0 ? data.totalVal : 1;
    const percent = ((data.value / total) * 100).toFixed(1);

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs z-50">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-slate-900 dark:text-white">{data.name}</span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">{data.description}</p>
        <div className="flex items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span>Volume:</span>
          <strong className="text-slate-900 dark:text-white font-mono">{data.value.toLocaleString('pt-BR')}</strong>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400 mt-1">
          <span>Share:</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{percent}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const MetricCards: React.FC<MetricCardsProps> = memo(({
  totalLeads,
  totalSearches,
  cacheHits,
  onClearCache,
  leads = [],
}) => {
  const formattedTimeSaved = useMemo(() => {
    const totalSeconds = cacheHits * 15;
    if (totalSeconds === 0) return '0s';
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }, [cacheHits]);

  // Performance trends calculation (Last 24h)
  const statsTrends = useMemo(() => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const prev24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const leadsLast24h = leads.filter(l => l.createdAt && new Date(l.createdAt) > last24h).length;
    const leadsPrev24h = leads.filter(l => l.createdAt && new Date(l.createdAt) > prev24h && new Date(l.createdAt) <= last24h).length;

    const leadsTrend = leadsPrev24h > 0 ? ((leadsLast24h - leadsPrev24h) / leadsPrev24h) * 100 : (leadsLast24h > 0 ? 100 : 0);
    
    return {
      leadsTrend: Math.abs(leadsTrend).toFixed(1),
      isLeadsUp: leadsLast24h >= leadsPrev24h,
    };
  }, [leads]);

  const cardVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.04 } } }}
    >
      {/* 1. Base Leads */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm group hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center rounded-lg">
            <Database className="w-4 h-4" />
          </div>
          <div className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {statsTrends.isLeadsUp ? '+' : '-'}{statsTrends.leadsTrend}%
          </div>
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Base Total</p>
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {totalLeads.toLocaleString('pt-BR')}
        </h3>
      </motion.div>

      {/* 2. Scans */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm group hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center rounded-lg">
            <Globe2 className="w-4 h-4" />
          </div>
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Varreduras</p>
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {totalSearches.toLocaleString('pt-BR')}
        </h3>
      </motion.div>

      {/* 3. Efficiency */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm group hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase">Verificado</span>
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Eficiência</p>
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {totalLeads > 0 ? (totalLeads / 12).toFixed(1) : '0.0'}%
        </h3>
      </motion.div>

      {/* 4. Optimization */}
      <motion.div 
        variants={cardVariants}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm group hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center rounded-lg">
            <Cpu className="w-4 h-4" />
          </div>
          {cacheHits > 0 && (
            <button onClick={onClearCache} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Otimização</p>
        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {cacheHits} <span className="text-[10px] font-medium text-slate-400">Hits</span>
        </h3>
      </motion.div>
    </motion.div>
  );
});
MetricCards.displayName = 'MetricCards';
