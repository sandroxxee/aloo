import React from 'react';
import { Lead } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { Filter, TrendingUp, Users, Send, MessageSquare, Flame, Sparkles } from 'lucide-react';

interface SalesFunnelChartProps {
  leads: Lead[];
  onSelectStageFilter?: (statusFilter: string, sentimentFilter: string) => void;
}

export const SalesFunnelChart: React.FC<SalesFunnelChartProps> = ({ leads, onSelectStageFilter }) => {
  const totalCaptured = leads.length;
  const sentCount = leads.filter(l => l.outreachStatus === 'enviado' || l.outreachStatus === 'respondido').length;
  const repliedCount = leads.filter(l => l.outreachStatus === 'respondido' || l.sentiment).length;
  const interestedCount = leads.filter(l => l.sentiment === 'interesse').length;

  const funnelData = [
    {
      name: 'Leads Capturados',
      count: totalCaptured,
      percentage: 100,
      color: '#1f6feb',
      icon: Users,
      description: 'Total de anúncios e contatos minerados na web',
    },
    {
      name: 'Mensagens Enviadas',
      count: sentCount,
      percentage: totalCaptured > 0 ? Math.round((sentCount / totalCaptured) * 100) : 0,
      color: '#238636',
      icon: Send,
      description: 'Abordagens disparadas via WhatsApp Web View',
    },
    {
      name: 'Respostas Recebidas',
      count: repliedCount,
      percentage: totalCaptured > 0 ? Math.round((repliedCount / totalCaptured) * 100) : 0,
      color: '#e3b341',
      icon: MessageSquare,
      description: 'Leads que responderam ou conversaram',
    },
    {
      name: 'Alta Qualificação / Interesse',
      count: interestedCount,
      percentage: totalCaptured > 0 ? Math.round((interestedCount / totalCaptured) * 100) : 0,
      color: '#bc8cff',
      icon: Flame,
      description: 'Leads com intenção de compra/venda confirmada',
    },
  ];

  const handleStageClick = (idx: number) => {
    if (!onSelectStageFilter) return;
    if (idx === 0) onSelectStageFilter('ALL', 'ALL');
    else if (idx === 1) onSelectStageFilter('enviado', 'ALL');
    else if (idx === 2) onSelectStageFilter('respondido', 'ALL');
    else if (idx === 3) onSelectStageFilter('ALL', 'interesse');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-white space-y-1.5 text-xs max-w-xs pointer-events-none transition-all duration-150">
          <div className=" flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5" style={{ color: data.color }}>
            <span className="truncate">{data.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300 font-bold">{data.percentage}%</span>
          </div>
          <div className="text-base font-bold font-mono text-white flex items-baseline gap-1.5 pt-0.5">
            {data.count} <span className="text-xs text-slate-400 font-normal">leads</span>
          </div>
          <p className="text-sm text-slate-300 leading-snug">{data.description}</p>
          <div className="text-xs text-emerald-400 font-bold pt-1 flex items-center gap-1 border-t border-slate-800/80">
            <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Clique no estágio para filtrar na tabela</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Funil de Conversão & Taxas de Resposta</h3>
            <p className="text-sm text-slate-500">Clique em qualquer etapa para filtrar instantaneamente a base de leads</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-mono font-bold text-emerald-700">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Taxa Global: {totalCaptured > 0 ? Math.round((interestedCount / totalCaptured) * 100) : 0}%</span>
        </div>
      </div>

      {/* Funnel Stage Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {funnelData.map((stage, idx) => {
          const IconComponent = stage.icon;
          return (
            <div 
              key={idx} 
              onClick={() => handleStageClick(idx)}
              className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 hover:shadow-md transition-all group"
            >
              {/* Top color accent bar */}
              <div 
                className="absolute top-0 left-0 h-1 w-full" 
                style={{ backgroundColor: stage.color }}
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">{stage.name}</span>
                <span className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs" style={{ color: stage.color }}>
                  <IconComponent className="w-4 h-4" />
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-xl font-display font-medium text-slate-900 font-mono">{stage.count}</span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${stage.color}15`, color: stage.color }}>
                  {stage.percentage}%
                </span>
              </div>

              {/* Horizontal progress bar inside the card */}
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ backgroundColor: stage.color, width: `${stage.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div className="text-xs text-slate-500 truncate max-w-[130px]">{stage.description}</div>
                <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Filtrar ➔
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Bar Chart Funnel View */}
      <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 pt-6 h-64">
        <div className="text-sm font-bold text-slate-500 mb-2 tracking-wide">Volume de Leads por Etapa do Funil (Clique para Filtrar)</div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#334155', fontSize: 11, fontWeight: 'bold' }} width={140} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              radius={[0, 6, 6, 0]}
              onClick={(data, index) => {
                if (typeof index === 'number') handleStageClick(index);
              }}
              cursor="pointer"
            >
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

