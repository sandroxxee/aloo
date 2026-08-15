import React, { useState } from 'react';
import { NicheCatalogItem } from '../../types/keywordIntelligence';
import { NATIONAL_NICHES_CATALOG } from '../../utils/keywordIntelligenceEngine';
import { Layers, Plus, MapPin, Tag, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface NicheCatalogTabProps {
  onAddMultipleKeywords: (keywords: string[]) => void;
}

export const NicheCatalogTab: React.FC<NicheCatalogTabProps> = ({ onAddMultipleKeywords }) => {
  const [selectedNiche, setSelectedNiche] = useState<NicheCatalogItem | null>(NATIONAL_NICHES_CATALOG[0]);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const handleInjectNiche = (niche: NicheCatalogItem) => {
    const allKw = [...niche.mainKeywords, ...niche.secondaryKeywords];
    onAddMultipleKeywords(allKw);
    setToastNotice(`🚀 Nicho "${niche.title}" ativado: ${allKw.length} termos de alta conversão injetados!`);
    setTimeout(() => setToastNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-3xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Banco Nacional de Nichos B2B
          </span>
          <h3 className="text-xl font-display font-medium">Catálogo de Estrutura Mercadológica Comercial</h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            Centenas de nichos pré-configurados com palavras principais, secundárias, termos negativos e cidades estratégicas de alta demanda.
          </p>
        </div>

        <button
          onClick={() => {
            const all = NATIONAL_NICHES_CATALOG.flatMap(n => [...n.mainKeywords, ...n.secondaryKeywords]);
            onAddMultipleKeywords(all);
            setToastNotice(`🔥 TODOS os ${NATIONAL_NICHES_CATALOG.length} nichos nacionais injetados (${all.length} termos)!`);
            setTimeout(() => setToastNotice(null), 4000);
          }}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs rounded-2xl shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Ativar Todos os Nichos ({NATIONAL_NICHES_CATALOG.length})
        </button>
      </div>

      {/* Main Grid & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Niches List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 px-1">Selecione o Nicho</h4>
          {NATIONAL_NICHES_CATALOG.map(niche => {
            const isSelected = selectedNiche?.id === niche.id;
            return (
              <div
                key={niche.id}
                onClick={() => setSelectedNiche(niche)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{niche.icon}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {niche.category}
                  </span>
                </div>
                <div>
                  <h5 className=" text-sm leading-snug">{niche.title}</h5>
                  <p className={`text-xs mt-0.5 line-clamp-2 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {niche.description}
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-between text-sm font-semibold">
                  <span>{niche.mainKeywords.length + niche.secondaryKeywords.length} palavras-chave</span>
                  <span className="flex items-center gap-0.5">
                    Ver detalhes <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Niche Detail View */}
        {selectedNiche && (
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Niche Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl p-2 bg-slate-50 rounded-2xl border border-slate-100">{selectedNiche.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-blue-600">{selectedNiche.category} • {selectedNiche.subcategory}</span>
                    <h3 className="text-xl font-display font-medium text-slate-800">{selectedNiche.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => handleInjectNiche(selectedNiche)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Injetar Palavras do Nicho
                </button>
              </div>

              {/* Main Keywords */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Palavras Principais ({selectedNiche.mainKeywords.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedNiche.mainKeywords.map(kw => (
                    <div key={kw} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between">
                      <span>{kw}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary Keywords */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Palavras Secundárias & Variações ({selectedNiche.secondaryKeywords.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNiche.secondaryKeywords.map(kw => (
                    <span key={kw} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Target Regions & Cities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-1.5">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-600" /> Cidades Prioritárias
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNiche.priorityCities.map(city => (
                      <span key={city} className="px-2 py-0.5 bg-white text-blue-800 rounded-md text-xs font-bold border border-blue-100">
                        {city}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-1.5">
                  <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600" /> Termos Negativos Filtrados
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedNiche.negativeKeywords.map(neg => (
                      <span key={neg} className="px-2 py-0.5 bg-white text-rose-700 rounded-md text-xs font-bold border border-rose-100">
                        -{neg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Inject Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Estados Prioritários: <strong>{selectedNiche.priorityStates.join(', ')}</strong>
              </span>
              <button
                onClick={() => handleInjectNiche(selectedNiche)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ativar {selectedNiche.title}
              </button>
            </div>
          </div>
        )}
      </div>

      {toastNotice && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg animate-in fade-in flex items-center justify-between">
          <span>{toastNotice}</span>
          <button onClick={() => setToastNotice(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
};
