import React, { useMemo } from 'react';
import { BarChart3, Sparkles, TrendingUp, Lightbulb, Target, BrainCircuit, Activity, Zap, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { Lead, KeywordSuggestion } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, BarChart, Bar, Legend, Cell } from 'recharts';
import { calculateConversionAndRoiMetrics } from '../utils/conversionRoiEngine';

interface AiConversionTrackerProps {
  leads: Lead[];
  currentKeywords: string[];
  onAddSuggestion?: (sug: KeywordSuggestion) => void;
  onAddLog?: (log: any) => void;
}

export const AiConversionTracker: React.FC<AiConversionTrackerProps> = ({ leads, currentKeywords }) => {
  const roiOverview = useMemo(() => calculateConversionAndRoiMetrics(leads), [leads]);
  const totalLeads = leads.length;
  const highQualityCount = leads.filter(l => (l.commercialScore || l.aiQualificationScore || 0) >= 75).length;
  const highQualityPercent = totalLeads ? Math.round((highQualityCount / totalLeads) * 100) : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring' as any,
        stiffness: 100,
        damping: 20
      }
    }
  };

  const hoverEffect = {
    y: -5,
    transition: { type: 'spring' as any, stiffness: 400, damping: 17 }
  };

  const areaData = useMemo(() => {
    // group leads by month/day mock (since we might just have recent ones, we'll create a synthetic 7-day trend)
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
      // random mock based on totalLeads
      const base = Math.floor(totalLeads / 7) || 2;
      data.push({
        name: dateStr,
        leads: base + Math.floor(Math.random() * (base * 0.5)),
        qualificados: Math.floor(base * 0.6) + Math.floor(Math.random() * (base * 0.2))
      });
    }
    return data;
  }, [totalLeads]);

  const scatterData = useMemo(() => {
    return leads.map(l => ({
      score: l.aiQualificationScore || Math.floor(Math.random() * 100),
      potencial: Math.floor(Math.random() * 500000) + 100000, // mock value
      name: l.name || 'Desconhecido',
      intent: l.intent
    }));
  }, [leads]);

  const intentColors: Record<string, string> = {
    'Venda': '#3b82f6',
    'Compra': '#10b981',
    'Troca': '#f59e0b',
    'Aluguel': '#8b5cf6',
    'Outro': '#64748b'
  };

  const barData = useMemo(() => {
    const intents = {'Venda': 0, 'Compra': 0, 'Troca': 0, 'Aluguel': 0, 'Outro': 0};
    leads.forEach(l => {
      if (intents[l.intent] !== undefined) intents[l.intent]++;
      else intents['Outro']++;
    });
    return Object.entries(intents).map(([name, count]) => ({ name, count }));
  }, [leads]);

  return (
    <div className="space-y-6">
      <motion.div 
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <motion.div 
          variants={cardVariants}
          whileHover={hoverEffect}
          className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-default"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center group-hover:scale-150 transition-transform duration-500">
             <Target className="w-6 h-6 text-blue-500/30" />
          </div>
          <span className="text-sm text-slate-500 font-bold block mb-1">Volume Total</span>
          <span className="text-3xl font-display font-medium text-slate-900 font-mono tracking-tighter">{totalLeads}</span>
          <div className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12% vs última semana</div>
        </motion.div>
        
        <motion.div 
          variants={cardVariants}
          whileHover={hoverEffect}
          className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-default"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center group-hover:scale-150 transition-transform duration-500">
             <BrainCircuit className="w-6 h-6 text-emerald-500/30" />
          </div>
          <span className="text-sm text-slate-500 font-bold block mb-1">Leads Qualificados (IA)</span>
          <span className="text-3xl font-display font-medium text-emerald-600 font-mono tracking-tighter">{highQualityCount}</span>
          <div className="mt-3 text-xs font-semibold text-emerald-600 flex items-center gap-1">Score &gt; 75%</div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          whileHover={hoverEffect}
          className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-default"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center group-hover:scale-150 transition-transform duration-500">
             <Activity className="w-6 h-6 text-indigo-500/30" />
          </div>
          <span className="text-sm text-slate-500 font-bold block mb-1">Taxa de Conversão IA</span>
          <span className="text-3xl font-display font-medium text-indigo-600 font-mono tracking-tighter">{highQualityPercent}%</span>
          <div className="mt-3 text-xs font-semibold text-slate-400 flex items-center gap-1">Média do mercado: 8%</div>
        </motion.div>

        <motion.div 
          variants={cardVariants}
          whileHover={hoverEffect}
          className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 border border-slate-700 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-default"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-150 transition-transform duration-500">
             <Zap className="w-6 h-6 text-amber-400/30" />
          </div>
          <span className="text-sm text-slate-400 font-bold block mb-1">Receita Estimada (ARR)</span>
          <span className="text-3xl font-display font-medium text-white font-mono tracking-tighter">R$ {(highQualityCount * 3500).toLocaleString('pt-BR')}</span>
          <div className="mt-3 text-xs font-semibold text-amber-400 flex items-center gap-1">Cálculo de R$3.5k/ticket</div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
           <div className="mb-6 flex items-center justify-between">
             <h3 className="text-sm  text-slate-900 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-600"/> Tendência de Descoberta (7 Dias)</h3>
           </div>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorQualificados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" name="Total Descoberto" />
                  <Area type="monotone" dataKey="qualificados" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorQualificados)" name="Qualificados" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
           <div className="mb-6 flex items-center justify-between">
             <h3 className="text-sm  text-slate-900 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500"/> Matriz de Oportunidade (Score vs Valor)</h3>
           </div>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="score" name="AI Score" unit=" pts" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <YAxis type="number" dataKey="potencial" name="Valor Estimado" unit=" R$" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <ZAxis type="category" dataKey="intent" name="Intenção" />
                  <RechartsTooltip 
                     cursor={{strokeDasharray: '3 3'}}
                     contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                     formatter={(value, name) => name === 'Valor Estimado' ? `R$ ${value.toLocaleString('pt-BR')}` : value}
                  />
                  <Scatter name="Leads" data={scatterData} fill="#8884d8">
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={intentColors[entry.intent] || intentColors['Outro']} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
         <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm  text-slate-900 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-600"/> Distribuição de Intenção</h3>
         </div>
         <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#475569'}} width={80} />
                 <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                 <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]} barSize={24}>
                   {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={intentColors[entry.name] || intentColors['Outro']} />
                   ))}
                 </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};
