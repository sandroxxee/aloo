import React, { useState } from 'react';
import { TermDiscoveryItem, NegativeTermItem } from '../../types/keywordIntelligence';
import { ShieldAlert, Sparkles, Check, X, Plus, Trash2, Filter, AlertTriangle } from 'lucide-react';

interface DiscoveryAndAntiNoiseTabProps {
  discoveries: TermDiscoveryItem[];
  negativeTerms: NegativeTermItem[];
  onApproveDiscovery: (id: string) => void;
  onRejectDiscovery: (id: string) => void;
  onAddNegativeTerm: (term: string, category: NegativeTermItem['category']) => void;
  onDeleteNegativeTerm: (id: string) => void;
}

export const DiscoveryAndAntiNoiseTab: React.FC<DiscoveryAndAntiNoiseTabProps> = ({
  discoveries,
  negativeTerms,
  onApproveDiscovery,
  onRejectDiscovery,
  onAddNegativeTerm,
  onDeleteNegativeTerm
}) => {
  const [newNegativeInput, setNewNegativeInput] = useState('');
  const [negativeCategory, setNegativeCategory] = useState<NegativeTermItem['category']>('Outros');
  const [activeSubTab, setActiveSubTab] = useState<'discoveries' | 'anti_noise'>('discoveries');

  const handleAddNegativeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNegativeInput.trim()) return;
    onAddNegativeTerm(newNegativeInput.trim().toLowerCase(), negativeCategory);
    setNewNegativeInput('');
  };

  const pendingDiscoveries = discoveries.filter(d => d.status === 'Pendente');

  return (
    <div className="space-y-6">
      {/* Sub Tabs Toggle */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('discoveries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'discoveries'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" /> IA Descobridora ({pendingDiscoveries.length} pendentes)
        </button>

        <button
          onClick={() => setActiveSubTab('anti_noise')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'anti_noise'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Banco de Termos Negativos ({negativeTerms.length})
        </button>
      </div>

      {/* DISCOVERIES TAB */}
      {activeSubTab === 'discoveries' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" /> Termos Emergentes Detectados Automaticamente
            </h3>
            <p className="text-xs text-slate-500">
              Durante as minerações contínuas, o motor de IA detectou novos termos, marcas e modelos em anúncios. Aprove ou rejeite antes de adicioná-los permanentemente ao banco.
            </p>
          </div>

          {pendingDiscoveries.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              Nenhum termo pendente no momento. O robô continua analisando anúncios em busca de novidades!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingDiscoveries.map(disc => (
                <div key={disc.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                        {disc.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(disc.discoveredAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <h4 className=" text-sm text-slate-800">{disc.term}</h4>
                    <p className="text-xs text-slate-500">{disc.sourceContext}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">
                      Volume Estimado: <strong className="text-slate-800">{disc.estimatedVolume}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRejectDiscovery(disc.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Rejeitar
                      </button>
                      <button
                        onClick={() => onApproveDiscovery(disc.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprovar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANTI NOISE TAB */}
      {activeSubTab === 'anti_noise' && (
        <div className="space-y-4">
          {/* Add Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" /> Adicionar Novo Termo Negativo (Filtro Anti-Ruído)
            </h3>
            <form onSubmit={handleAddNegativeSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newNegativeInput}
                onChange={e => setNewNegativeInput(e.target.value)}
                placeholder="Ex: pdf, concurso, curso gratis, vaga motorista..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <select
                value={negativeCategory}
                onChange={e => setNegativeCategory(e.target.value as any)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="Empregos">Empregos / Vagas</option>
                <option value="Manuais/PDF">Manuais / PDFs</option>
                <option value="Cursos/Aulas">Cursos / Aulas</option>
                <option value="Notícias/Fipe">Notícias / Fipe</option>
                <option value="Outros">Outros Ruídos</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Bloquear Termo
              </button>
            </form>
          </div>

          {/* Negative Terms Catalog */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm  text-slate-800">Termos Negativos Cadastrados ({negativeTerms.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {negativeTerms.map(item => (
                <div key={item.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-rose-900 block">-{item.term}</span>
                    <span className="text-xs text-rose-700 font-medium">
                      {item.category} • Bloqueados: {item.occurrencesBlocked}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteNegativeTerm(item.id)}
                    className="p-1 hover:bg-rose-100 text-rose-600 rounded-md cursor-pointer"
                    title="Remover filtro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
