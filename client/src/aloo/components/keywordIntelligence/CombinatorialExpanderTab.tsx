import React, { useState } from 'react';
import { generateCombinatorialMatrix } from '../../utils/keywordIntelligenceEngine';
import { BRAZIL_STATES } from '../../utils/states';
import { Layers, Sparkles, Plus, RefreshCw, Sliders, CheckSquare, Square, FileText } from 'lucide-react';

interface CombinatorialExpanderTabProps {
  onAddMultipleKeywords: (keywords: string[]) => void;
}

export const CombinatorialExpanderTab: React.FC<CombinatorialExpanderTabProps> = ({ onAddMultipleKeywords }) => {
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['Scania', 'Volvo', 'Mercedes-Benz']);
  const [selectedModels, setSelectedModels] = useState<string[]>(['R450', 'FH 540', 'Axor 2544', 'Stralis 440']);
  const [selectedIntents, setSelectedIntents] = useState<string[]>(['vendo', 'compro', 'oferta']);
  const [selectedStates, setSelectedStates] = useState<string[]>(['SP', 'PR', 'MG', 'SC']);

  const [includeWhatsapp, setIncludeWhatsapp] = useState(true);
  const [includeDdd, setIncludeDdd] = useState(true);
  const [includeCondition, setIncludeCondition] = useState(false);

  const [generatedMatrix, setGeneratedMatrix] = useState<string[]>([]);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const handleGenerateMatrix = () => {
    const matrix = generateCombinatorialMatrix({
      brands: selectedBrands,
      models: selectedModels,
      intents: selectedIntents,
      states: selectedStates,
      includeWhatsapp,
      includeDdd,
      includeCondition
    });
    setGeneratedMatrix(matrix);
  };

  const handleInjectMatrix = () => {
    if (generatedMatrix.length === 0) return;
    onAddMultipleKeywords(generatedMatrix);
    setToastNotice(`🚀 ${generatedMatrix.length} combinações inteligentes injetadas na fila de mineração!`);
    setTimeout(() => setToastNotice(null), 4000);
  };

  const toggleBrand = (b: string) => {
    if (selectedBrands.includes(b)) setSelectedBrands(selectedBrands.filter(x => x !== b));
    else setSelectedBrands([...selectedBrands, b]);
  };

  const toggleState = (uf: string) => {
    if (selectedStates.includes(uf)) setSelectedStates(selectedStates.filter(x => x !== uf));
    else setSelectedStates([...selectedStates, uf]);
  };

  const ALL_BRANDS = ['Scania', 'Volvo', 'Mercedes-Benz', 'Iveco', 'DAF', 'Volkswagen', 'Caterpillar', 'John Deere'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-800 p-3 text-white shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Motor de Expansão Combinatória Automática</h3>
            <p className="text-xs text-slate-500">
              Combine marcas, modelos, intenções, rodovias e estados para gerar milhares de buscas comerciais com 1 clique.
            </p>
          </div>
        </div>

        {/* Combinatorial Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Brands */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">1. Marcas ({selectedBrands.length})</label>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {ALL_BRANDS.map(b => {
                const isSel = selectedBrands.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBrand(b)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isSel ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Models */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">2. Modelos / Peças</label>
            <textarea
              value={selectedModels.join('\n')}
              onChange={e => setSelectedModels(e.target.value.split('\n').filter(Boolean))}
              rows={4}
              placeholder="Digite 1 modelo por linha..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* States */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">3. Estados Target ({selectedStates.length})</label>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
              {BRAZIL_STATES.slice(0, 16).map(s => {
                const isSel = selectedStates.includes(s.uf);
                return (
                  <button
                    key={s.uf}
                    type="button"
                    onClick={() => toggleState(s.uf)}
                    className={`px-2 py-0.5 rounded-md text-sm font-bold cursor-pointer transition-colors ${
                      isSel ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s.uf}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">4. Otimizações de Busca</label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeWhatsapp}
                  onChange={e => setIncludeWhatsapp(e.target.checked)}
                  className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                />
                Incluir palavra "whatsapp"
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeDdd}
                  onChange={e => setIncludeDdd(e.target.checked)}
                  className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                />
                Incluir DDD regional
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeCondition}
                  onChange={e => setIncludeCondition(e.target.checked)}
                  className="rounded-sm text-indigo-600 focus:ring-indigo-500"
                />
                Incluir condição (frotista, revisado)
              </label>
            </div>
          </div>
        </div>

        {/* Generate Trigger */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleGenerateMatrix}
            className="flex cursor-pointer items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Sparkles className="w-4 h-4" /> Gerar Matriz Combinatória
          </button>
        </div>
      </div>

      {/* Generated Results Preview */}
      {generatedMatrix.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold text-indigo-600">Matriz Gerada</span>
              <h4 className="text-md font-bold text-slate-800">
                {generatedMatrix.length} Permutações Comerciais Prontas
              </h4>
            </div>
            <button
              onClick={handleInjectMatrix}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Injetar Todas na Mineração ({generatedMatrix.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
            {generatedMatrix.map((kw, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>{kw}</span>
                <span className="text-xs text-slate-400 font-normal">#{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {toastNotice && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg animate-in fade-in flex items-center justify-between">
          <span>{toastNotice}</span>
          <button onClick={() => setToastNotice(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
};
