import React, { useState } from 'react';
import { LeadIntent, SellerType, LeadCategory } from '../../types';
import { BRAZIL_STATES } from '../../utils/states';
import { Target, Sparkles, Plus, CheckCircle2 } from 'lucide-react';

interface CrossScannerTabProps {
  onAddMultipleKeywords: (keywords: string[]) => void;
}

export const CrossScannerTab: React.FC<CrossScannerTabProps> = ({ onAddMultipleKeywords }) => {
  const [selectedIntents, setSelectedIntents] = useState<LeadIntent[]>(['Venda', 'Compra']);
  const [selectedCategory, setSelectedCategory] = useState<LeadCategory>('Caminhões');
  const [selectedSellerTypes, setSelectedSellerTypes] = useState<SellerType[]>(['Particular', 'Lojista / Concessionária']);
  const [selectedStates, setSelectedStates] = useState<string[]>(['SP', 'PR', 'MG']);
  const [whatsappOnly, setWhatsappOnly] = useState(true);

  const [generatedResults, setGeneratedResults] = useState<string[]>([]);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const INTENTS_LIST: LeadIntent[] = ['Venda', 'Compra', 'Troca', 'Aluguel'];
  const SELLER_TYPES_LIST: SellerType[] = ['Particular', 'Lojista / Concessionária', 'Transportadora / Frotista', 'Desmanche / Auto Peças'];
  const CATEGORIES_LIST: LeadCategory[] = ['Caminhões', 'Peças', 'Implementos', 'Manutenção', 'Pneus', 'Motores', 'Serviços', 'Logística'];

  const toggleIntent = (i: LeadIntent) => {
    if (selectedIntents.includes(i)) setSelectedIntents(selectedIntents.filter(x => x !== i));
    else setSelectedIntents([...selectedIntents, i]);
  };

  const toggleSellerType = (st: SellerType) => {
    if (selectedSellerTypes.includes(st)) setSelectedSellerTypes(selectedSellerTypes.filter(x => x !== st));
    else setSelectedSellerTypes([...selectedSellerTypes, st]);
  };

  const toggleState = (uf: string) => {
    if (selectedStates.includes(uf)) setSelectedStates(selectedStates.filter(x => x !== uf));
    else setSelectedStates([...selectedStates, uf]);
  };

  const handleRunCross = () => {
    const list: string[] = [];
    const intentMap: Record<LeadIntent, string> = {
      'Venda': 'vendo',
      'Compra': 'compro',
      'Troca': 'troco',
      'Aluguel': 'aluguel',
      'Outro': 'oferta'
    };

    const catBaseMap: Record<LeadCategory, string[]> = {
      'Caminhões': ['scania r450', 'volvo fh 540', 'mercedes actros', 'iveco stralis', 'vw meteor'],
      'Peças': ['cambio zf 16s', 'motor cummins', 'diferencial meritor', 'turbina holset'],
      'Implementos': ['carreta bau randon', 'bicacamba facchini', 'carreta sider', 'caçamba basculante'],
      'Manutenção': ['oficina diesel pesados', 'revisao bombas injetoras'],
      'Pneus': ['pneus 295 80 r22.5 caminhao', 'pneus Michelin recapados'],
      'Motores': ['motor scania 113 completo', 'bloco motor volvo d13'],
      'Serviços': ['socorro rodoviario pesados 24h', 'frete prancha pesado'],
      'Logística': ['renovacao frota transportadora']
    };

    const bases = catBaseMap[selectedCategory] || ['caminhao pesado'];

    selectedIntents.forEach(intent => {
      const intentWord = intentMap[intent] || 'vendo';
      selectedSellerTypes.forEach(st => {
        let stKeyword = '';
        if (st === 'Particular') stKeyword = 'particular';
        else if (st === 'Lojista / Concessionária') stKeyword = 'revenda concessionaria';
        else if (st === 'Transportadora / Frotista') stKeyword = 'frotista transportadora';
        else if (st === 'Desmanche / Auto Peças') stKeyword = 'desmanche sucata';

        selectedStates.forEach(uf => {
          bases.forEach(base => {
            let kw = `${intentWord} ${base} ${stKeyword} ${uf}`.toLowerCase();
            if (whatsappOnly) kw += ' whatsapp';
            list.push(kw.trim().replace(/\s+/g, ' '));
          });
        });
      });
    });

    const uniqueList = Array.from(new Set(list));
    setGeneratedResults(uniqueList);
  };

  const handleInjectCrossResults = () => {
    if (generatedResults.length === 0) return;
    onAddMultipleKeywords(generatedResults);
    setToastNotice(`🚀 ${generatedResults.length} pesquisas cruzadas injetadas na fila de mineração!`);
    setTimeout(() => setToastNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-800 p-3 text-white shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Motor de Cruzamento Simultâneo B2B</h3>
            <p className="text-xs text-slate-500">
              Cruze intenções de compra/venda com perfil do vendedor, categoria comercial e estados estratégicos.
            </p>
          </div>
        </div>

        {/* Matrix Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 text-xs">
          {/* Intent */}
          <div className="space-y-2">
            <label className="font-medium text-slate-700 dark:text-slate-300 block">1. Intenções ({selectedIntents.length})</label>
            <div className="flex flex-wrap gap-1">
              {INTENTS_LIST.map(i => {
                const isSel = selectedIntents.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleIntent(i)}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                      isSel ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="font-medium text-slate-700 dark:text-slate-300 block">2. Categoria</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
            >
              {CATEGORIES_LIST.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Seller Type */}
          <div className="space-y-2">
            <label className="font-medium text-slate-700 dark:text-slate-300 block">3. Perfil Vendedor ({selectedSellerTypes.length})</label>
            <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
              {SELLER_TYPES_LIST.map(st => {
                const isSel = selectedSellerTypes.includes(st);
                return (
                  <button
                    key={st}
                    onClick={() => toggleSellerType(st)}
                    className={`px-2.5 py-1 text-left rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                      isSel ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* States & WhatsApp */}
          <div className="space-y-3">
            <label className="font-medium text-slate-700 dark:text-slate-300 block">4. Estados & Filtros</label>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {BRAZIL_STATES.slice(0, 10).map(s => {
                const isSel = selectedStates.includes(s.uf);
                return (
                  <button
                    key={s.uf}
                    onClick={() => toggleState(s.uf)}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold cursor-pointer ${
                      isSel ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {s.uf}
                  </button>
                );
              })}
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={whatsappOnly}
                onChange={e => setWhatsappOnly(e.target.checked)}
                className="rounded-sm text-emerald-600 focus:ring-emerald-500"
              />
              Priorizar números de WhatsApp
            </label>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleRunCross}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Executar Cruzamento de Variáveis
          </button>
        </div>
      </div>

      {/* Results */}
      {generatedResults.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold text-emerald-600">Resultado do Cruzamento</span>
              <h4 className="text-md font-bold text-slate-800">
                {generatedResults.length} Combinações Cruzadas Encontradas
              </h4>
            </div>
            <button
              onClick={handleInjectCrossResults}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Adicionar Tudo à Fila ({generatedResults.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {generatedResults.map((kw, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>{kw}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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
