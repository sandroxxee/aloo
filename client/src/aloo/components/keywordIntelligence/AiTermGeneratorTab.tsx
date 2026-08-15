import React, { useState } from 'react';
import { AiGeneratorMode } from '../../types/keywordIntelligence';
import { Sparkles, CheckCircle2, Plus, RefreshCw, HelpCircle, Flame, Shield, MapPin, Zap, Award, Target, HelpCircle as HelpIcon } from 'lucide-react';

interface AiTermGeneratorTabProps {
  onAddMultipleKeywords: (keywords: string[]) => void;
  existingKeywords: string[];
}

interface GeneratedAiItem {
  keyword: string;
  intent: string;
  item: string;
  score: number;
  explanation: string;
  mode: AiGeneratorMode;
}

const MODES_INFO: { mode: AiGeneratorMode; label: string; icon: string; desc: string }[] = [
  { mode: 'Conservador', label: 'Conservador', icon: '🛡️', desc: 'Busca termos ultra diretos de marcas e modelos de alta precisão.' },
  { mode: 'Comercial', label: 'Comercial', icon: '💼', desc: 'Foco em ofertas de vendedores rápidos, pronta entrega e facilidade de fechar.' },
  { mode: 'Long Tail', label: 'Long Tail', icon: '🎯', desc: 'Frases longas contendo DDD, WhatsApp e detalhes do veículo.' },
  { mode: 'Regional', label: 'Regional', icon: '🗺️', desc: 'Buscas segmentadas por polos logísticos, estradas e estados do Brasil.' },
  { mode: 'Similaridade', label: 'Similaridade', icon: '🔄', desc: 'Identifica modelos concorrentes e equivalentes (Ex: Volvo FH vs Scania R).' },
  { mode: 'Competidores', label: 'Competidores', icon: '🏬', desc: 'Pesquisa revendas, concessionárias e leilões concorrentes.' },
  { mode: 'Tendências', label: 'Tendências', icon: '📈', desc: 'Modelos e peças mais procurados na última semana.' },
  { mode: 'Livre', label: 'Livre Criativo', icon: '💡', desc: 'Exploração desprotegida da IA para capturar expressões raras.' },
  { mode: 'Nicho Profundo', label: 'Nicho Profundo', icon: '⛏️', desc: 'Foco em peças raras, desmanches e sucata comercial pesada.' }
];

export const AiTermGeneratorTab: React.FC<AiTermGeneratorTabProps> = ({
  onAddMultipleKeywords,
  existingKeywords
}) => {
  const [selectedMode, setSelectedMode] = useState<AiGeneratorMode>('Comercial');
  const [seedInput, setSeedInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedAiItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptSeed = seedInput.trim() || 'caminhões pesados e peças';
    setIsGenerating(true);
    setToastNotice(null);

    try {
      const res = await fetch('/api/ai/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seedPrompt: `[Modo: ${selectedMode}] ${promptSeed}`,
          count: 9,
          existingKeywords,
          trainingModeActive: true
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        const items: GeneratedAiItem[] = data.suggestions.map((s: any, idx: number) => {
          const kw = s.keyword || '';
          let score = 75;
          if (kw.toLowerCase().includes('whatsapp')) score += 15;
          if (kw.toLowerCase().includes('ddd')) score += 10;
          score = Math.min(99, score);

          const explanations: Record<AiGeneratorMode, string> = {
            'Conservador': 'Sintaxe direta sem ruído, garantindo resposta exata em classificados.',
            'Comercial': 'Palavra de alta intenção comercial pronta para captura imediata de WhatsApp.',
            'Long Tail': 'Busca ultra especificada que filtra curiosos e foca em proprietários diretos.',
            'Regional': 'Segmentação por polo rodoviário regional acelerando prospecção física.',
            'Similaridade': 'Expande o escopo capturando compradores de marcas equivalentes.',
            'Competidores': 'Captura anúncios de lojistas e revendas com alto volume de anúncios.',
            'Tendências': 'Termo com pico de demanda e buscas crescentes na plataforma.',
            'Livre': 'Combinação criativa inovadora gerada por aprendizado contínuo.',
            'Nicho Profundo': 'Foco em partes e peças escassas com alta margem de negociação.'
          };

          return {
            keyword: kw,
            intent: s.intent || 'Venda',
            item: s.item || promptSeed,
            score,
            explanation: explanations[selectedMode] || 'Sugerido por inteligência semântica comercial Gemini.',
            mode: selectedMode
          };
        });

        setGeneratedResults(items);
        setSelectedItems(new Set(items.map(i => i.keyword)));
      }
    } catch (err) {
      console.error('Erro na geração IA:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelectItem = (kw: string) => {
    const next = new Set(selectedItems);
    if (next.has(kw)) next.delete(kw);
    else next.add(kw);
    setSelectedItems(next);
  };

  const handleInjectSelected = () => {
    const toInject = Array.from(selectedItems);
    if (toInject.length === 0) return;
    onAddMultipleKeywords(toInject);
    setToastNotice(`🚀 ${toInject.length} novos termos inteligentes adicionados à fila de mineração!`);
    setTimeout(() => setToastNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-800 p-3 text-white shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Gerador Multimodo de Termos Gemini 3.6</h3>
            <p className="text-xs text-slate-500">
              Selecione o modo de raciocínio da IA para gerar palavras-chave de alta conversão.
            </p>
          </div>
        </div>

        {/* Modes Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2">
          {MODES_INFO.map(m => {
            const isSelected = selectedMode === m.mode;
            return (
              <button
                key={m.mode}
                onClick={() => setSelectedMode(m.mode)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xl mb-1">{m.icon}</div>
                <div>
                  <div className="text-xs font-bold leading-tight">{m.label}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            value={seedInput}
            onChange={e => setSeedInput(e.target.value)}
            placeholder={`Ex: Scania R450, Peças Volvo, Caçamba Basculante... (Modo: ${selectedMode})`}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Processando IA...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Gerar com IA ({selectedMode})
              </>
            )}
          </button>
        </form>

        {/* Selected Mode Hint */}
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-900">
          <HelpIcon className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Estratégia {selectedMode}:</strong> {MODES_INFO.find(m => m.mode === selectedMode)?.desc}
          </span>
        </div>
      </div>

      {/* Generated Results */}
      {generatedResults.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold text-emerald-600">Sugestões Geradas</span>
              <h4 className="text-md font-bold text-slate-800">
                {generatedResults.length} Termos Inteligentes ({selectedItems.size} selecionados)
              </h4>
            </div>
            <button
              onClick={handleInjectSelected}
              disabled={selectedItems.size === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Adicionar Selecionados à Fila ({selectedItems.size})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {generatedResults.map(item => {
              const isChecked = selectedItems.has(item.keyword);
              return (
                <div
                  key={item.keyword}
                  onClick={() => toggleSelectItem(item.keyword)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isChecked
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className=" text-xs text-slate-800 leading-snug">
                      {item.keyword}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded-sm text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 font-semibold rounded-md">
                      Intenção: {item.intent}
                    </span>
                    <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                      <Award className="w-3 h-3" /> Score {item.score}
                    </span>
                  </div>

                  <div className="p-2 bg-white/80 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-0.5">
                    <strong className="text-slate-800 block">Por que a IA sugeriu:</strong>
                    <p>{item.explanation}</p>
                  </div>
                </div>
              );
            })}
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
