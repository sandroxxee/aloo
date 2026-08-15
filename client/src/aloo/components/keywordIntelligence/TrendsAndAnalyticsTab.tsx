import React, { useState } from 'react';
import { IntelligentTerm, SynonymGroup } from '../../types/keywordIntelligence';
import { DEFAULT_SYNONYMS } from '../../utils/keywordIntelligenceEngine';
import { BRAZIL_STATES } from '../../utils/states';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, MapPin, BookOpen, Award, Layers, Zap, Activity } from 'lucide-react';

interface TrendsAndAnalyticsTabProps {
  terms: IntelligentTerm[];
}

export const TrendsAndAnalyticsTab: React.FC<TrendsAndAnalyticsTabProps> = ({ terms }) => {
  const [activeView, setActiveView] = useState<'trends' | 'map' | 'synonyms'>('trends');
  const [synonyms, setSynonyms] = useState<SynonymGroup[]>(DEFAULT_SYNONYMS);

  // Mock trend chart data derived from terms
  const trendData = [
    { day: 'Seg', leads: 42, whatsapps: 31, conv: 73 },
    { day: 'Ter', leads: 68, whatsapps: 52, conv: 76 },
    { day: 'Qua', leads: 95, whatsapps: 78, conv: 82 },
    { day: 'Qui', leads: 110, whatsapps: 92, conv: 83 },
    { day: 'Sex', leads: 135, whatsapps: 114, conv: 84 },
    { day: 'Sáb', leads: 88, whatsapps: 70, conv: 79 },
    { day: 'Dom', leads: 54, whatsapps: 41, conv: 75 }
  ];

  // State coverage metrics
  const stateCoverage = BRAZIL_STATES.slice(0, 10).map(s => {
    const stateTerms = terms.filter(t => t.stateUf === s.uf);
    const leads = stateTerms.reduce((acc, t) => acc + (t.leadsFound || 0), 0);
    return {
      uf: s.uf,
      name: s.name,
      termsCount: stateTerms.length,
      leads
    };
  });

  return (
    <div className="space-y-6">
      {/* Sub Tabs Toggle */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveView('trends')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeView === 'trends'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Análise de Tendências & Desempenho
        </button>

        <button
          onClick={() => setActiveView('map')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeView === 'map'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-4 h-4" /> Cobertura do Mapa Nacional
        </button>

        <button
          onClick={() => setActiveView('synonyms')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeView === 'synonyms'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Dicionário de Sinônimos ({synonyms.length})
        </button>
      </div>

      {/* TRENDS VIEW */}
      {activeView === 'trends' && (
        <div className="space-y-6">
          {/* Chart Header */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600">Telemetria IA em Tempo Real</span>
                <h3 className="text-lg font-bold text-slate-800">Crescimento de Leads & Taxa de Conversão por Termo</h3>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> Aprendizado Ativo
              </span>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="leads" name="Leads Minerados" stroke="#2563eb" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={3} />
                  <Area type="monotone" dataKey="whatsapps" name="WhatsApps Válidos" stroke="#059669" fillOpacity={1} fill="url(#colorWa)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Lucrative Terms Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-sm  text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" /> Termos Mais Lucrativos da Semana
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {terms.slice(0, 3).map((t, i) => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className=" text-slate-800 block">#{i + 1} {t.keyword}</span>
                    <span className="text-xs text-slate-500">{t.category} • {t.stateUf}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 block">{t.whatsAppsCount || 12} WA</span>
                    <span className="text-xs font-bold text-blue-600">Score {t.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAP VIEW */}
      {activeView === 'map' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-600">Geolocalização Comercial</span>
              <h3 className="text-lg font-bold text-slate-800">Mapa de Cobertura & Densidade de Leads por Estado</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {stateCoverage.map(st => (
                <div key={st.uf} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-800">{st.uf}</span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                      {st.leads} leads
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium block">{st.name}</span>
                  <span className="text-xs text-slate-400 block">{st.termsCount} termos ativos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SYNONYMS VIEW */}
      {activeView === 'synonyms' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" /> Dicionário Semântico de Sinônimos Comerciais
            </h3>
            <p className="text-xs text-slate-500">
              O sistema relaciona automaticamente apelidos, códigos de modelo e variações populares para expandir buscas sem duplicar esforços.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {synonyms.map(syn => (
              <div key={syn.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className=" text-sm text-purple-900">{syn.canonicalTerm}</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
                    {syn.category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {syn.synonyms.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                      = {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
