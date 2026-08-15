import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, Trash2, RotateCcw, Bot, Loader2, Globe, Layers, 
  Download, Upload, Filter, Search, 
  ChevronDown, ChevronUp, Eye, Check, BookmarkPlus, FolderPlus, Play, 
  MapPin, Sparkles
} from 'lucide-react';

import { KeywordSuggestion, KeywordMetric, SearchFilterConfig } from '../types';
import { 
  IntelligentTerm, TermStatus, NegativeTermItem, TermDiscoveryItem 
} from '../types/keywordIntelligence';

import { 
  getStoredIntelligentTerms, saveStoredIntelligentTerms,
  getStoredNegativeTerms, saveStoredNegativeTerms,
  getStoredDiscoveries, saveStoredDiscoveries,
  calculateTermScore
} from '../utils/keywordIntelligenceEngine';

import { prioritizeKeywordsByPerformance, analyzeAndOptimizeQueue } from '../utils/keywordBrain';
import { LocalAiService } from '../services/LocalAiService';
import { useToast } from './Toast';

import { TermDatabaseTable } from './keywordIntelligence/TermDatabaseTable';
import { AiTermGeneratorTab } from './keywordIntelligence/AiTermGeneratorTab';
import { NicheCatalogTab } from './keywordIntelligence/NicheCatalogTab';
import { CombinatorialExpanderTab } from './keywordIntelligence/CombinatorialExpanderTab';
import { DiscoveryAndAntiNoiseTab } from './keywordIntelligence/DiscoveryAndAntiNoiseTab';
import { CrossScannerTab } from './keywordIntelligence/CrossScannerTab';
import { TrendsAndAnalyticsTab } from './keywordIntelligence/TrendsAndAnalyticsTab';

interface KeywordManagerProps {
  keywords: string[];
  suggestions: KeywordSuggestion[];
  onAddKeyword: (newKeyword: string) => void;
  onAddMultipleKeywords: (newKeywords: string[]) => void;
  onRemoveKeyword: (index: number) => void;
  onResetKeywords: () => void;
  onDeduplicateKeywords: () => void;
  onClearKeywords: () => void;
  onAddSuggestion: (suggestionId: string) => void;
  onAddAllSuggestions: () => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onGenerateAiKeywords: (seed: string) => Promise<void>;
  onExecuteSearchKeyword?: (kw: string) => Promise<any>;
  onExecuteAlternativeSearchKeyword?: (kw: string) => Promise<any>;
  onExecuteSearchAllKeywords?: () => Promise<void>;
  onPruneNonConverting?: () => void;
  isSearchingNow?: boolean;
  searchEngineMode?: string;
  onSearchEngineModeChange?: (mode: string) => void;
  filterConfig?: SearchFilterConfig;
  onFilterConfigChange?: (newConfig: SearchFilterConfig) => void;
}

export const KeywordManager: React.FC<KeywordManagerProps> = ({
  keywords,
  suggestions,
  onAddKeyword,
  onAddMultipleKeywords,
  onRemoveKeyword,
  onResetKeywords,
  onDeduplicateKeywords,
  onClearKeywords,
  onAddSuggestion,
  onAddAllSuggestions,
  onDismissSuggestion,
  onGenerateAiKeywords,
  onExecuteSearchKeyword,
  onExecuteAlternativeSearchKeyword,
  onExecuteSearchAllKeywords,
  onPruneNonConverting,
  isSearchingNow = false,
  searchEngineMode = 'global',
  onSearchEngineModeChange,
  filterConfig,
  onFilterConfigChange,
}) => {
  // Navigation sub tab
  const [activeTab, setActiveTab] = useState<
    'banco' | 'ai_generator' | 'niches' | 'expansao' | 'discovery' | 'cruzamento' | 'analytics'
  >('banco');

  // Intelligent Terms Database State
  const [intelligentTerms, setIntelligentTerms] = useState<IntelligentTerm[]>(() => {
    return getStoredIntelligentTerms(keywords || []);
  });

  // Negative terms state
  const [negativeTerms, setNegativeTerms] = useState<NegativeTermItem[]>(() => getStoredNegativeTerms());

  // Discovery state
  const [discoveries, setDiscoveries] = useState<TermDiscoveryItem[]>(() => getStoredDiscoveries());

  // Input state for single quick add
  const { success, error: toastError, info } = useToast();
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showByokModal, setShowByokModal] = useState(false);
  const [byokKey, setByokKey] = useState('');
  
  const [pruneNotice, setPruneNotice] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  const handleSmartSearch = async () => {
    if (!newKeywordInput.trim()) {
      toastError("Digite uma frase antes de usar a mágica!");
      return;
    }
    setIsAiLoading(true);
    info("Analisando com Inteligência Artificial Local...");
    
    try {
      const storedKey = localStorage.getItem('truck_miner_gemini_key');
      const optimized = await LocalAiService.optimizeSearchQuery(newKeywordInput, storedKey);
      
      setNewKeywordInput(optimized);
      success("Busca otimizada com sucesso!");
    } catch (e: any) {
      if (e.message && (e.message.includes("Gemini") || e.message.includes("Nenhum método"))) {
        setShowByokModal(true);
      } else {
        toastError(`Erro na IA Local: ${e.message}`);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveByokKey = () => {
    if (byokKey.trim().length > 10) {
      localStorage.setItem('truck_miner_gemini_key', byokKey.trim());
      setShowByokModal(false);
      success("Chave Gemini salva! Tente a mágica novamente.");
    } else {
      toastError("Chave inválida. Verifique o formato.");
    }
  };

  // Sync keywords array changes with intelligent database
  useEffect(() => {
    const updated = getStoredIntelligentTerms(keywords);
    setIntelligentTerms(updated);
    saveStoredIntelligentTerms(updated);
  }, [keywords]);

  // Handler for adding single keyword
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordInput.trim()) return;
    onAddKeyword(newKeywordInput.trim());
    setNewKeywordInput('');
  };

  // Handler for term update in table
  const handleUpdateTerm = (updated: IntelligentTerm) => {
    const list = intelligentTerms.map(t => t.id === updated.id ? updated : t);
    setIntelligentTerms(list);
    saveStoredIntelligentTerms(list);
  };

  // Handler for single term deletion
  const handleDeleteTerm = (id: string) => {
    const target = intelligentTerms.find(t => t.id === id);
    if (target) {
      const idx = keywords.indexOf(target.keyword);
      if (idx !== -1) onRemoveKeyword(idx);
    }
    const list = intelligentTerms.filter(t => t.id !== id);
    setIntelligentTerms(list);
    saveStoredIntelligentTerms(list);
  };

  // Handler for batch deletion
  const handleBatchDelete = (ids: string[]) => {
    const targetKeywords = new Set(intelligentTerms.filter(t => ids.includes(t.id)).map(t => t.keyword));
    const remainingKws = keywords.filter(k => !targetKeywords.has(k));
    onClearKeywords();
    if (remainingKws.length > 0) onAddMultipleKeywords(remainingKws);

    const remainingTerms = intelligentTerms.filter(t => !ids.includes(t.id));
    setIntelligentTerms(remainingTerms);
    saveStoredIntelligentTerms(remainingTerms);
  };

  // Handler for batch status change
  const handleBatchStatusChange = (ids: string[], newStatus: TermStatus) => {
    const list = intelligentTerms.map(t => ids.includes(t.id) ? { ...t, status: newStatus } : t);
    setIntelligentTerms(list);
    saveStoredIntelligentTerms(list);
  };

  // Handler for approving discovered terms
  const handleApproveDiscovery = (id: string) => {
    const item = discoveries.find(d => d.id === id);
    if (item) {
      onAddKeyword(item.term);
      const updatedDisc = discoveries.map(d => d.id === id ? { ...d, status: 'Aprovado' as const } : d);
      setDiscoveries(updatedDisc);
      saveStoredDiscoveries(updatedDisc);
    }
  };

  // Handler for rejecting discovered terms
  const handleRejectDiscovery = (id: string) => {
    const updatedDisc = discoveries.map(d => d.id === id ? { ...d, status: 'Rejeitado' as const } : d);
    setDiscoveries(updatedDisc);
    saveStoredDiscoveries(updatedDisc);
  };

  // Handler for adding negative term
  const handleAddNegativeTerm = (termStr: string, category: NegativeTermItem['category']) => {
    const newItem: NegativeTermItem = {
      id: `neg_${Date.now()}`,
      term: termStr.toLowerCase(),
      category,
      source: 'Manual',
      createdAt: new Date().toISOString(),
      occurrencesBlocked: 0,
      status: 'Ativo'
    };
    const updated = [newItem, ...negativeTerms];
    setNegativeTerms(updated);
    saveStoredNegativeTerms(updated);
  };

  // Handler for deleting negative term
  const handleDeleteNegativeTerm = (id: string) => {
    const updated = negativeTerms.filter(n => n.id !== id);
    setNegativeTerms(updated);
    saveStoredNegativeTerms(updated);
  };

  // Optimization & Pruning Handlers
  const handlePruneNonConverting = () => {
    const { optimizedKeywords, removedLowConversion, removedFailed } = analyzeAndOptimizeQueue(keywords, 10);
    const totalRemoved = removedLowConversion.length + removedFailed.length;

    if (totalRemoved === 0) {
      const prioritized = prioritizeKeywordsByPerformance(keywords);
      onClearKeywords();
      onAddMultipleKeywords(prioritized);
      setPruneNotice('✨ Fila reordenada por rendimento de leads! Nenhuma palavra com histórico de baixa conversão encontrada.');
    } else {
      onClearKeywords();
      onAddMultipleKeywords(optimizedKeywords);
      setPruneNotice(`🧹 Otimização de Fila: ${totalRemoved} palavras de baixa performance removidas e fila priorizada!`);
    }
    setTimeout(() => setPruneNotice(null), 5000);
  };

  const handlePrioritize = () => {
    const prioritized = prioritizeKeywordsByPerformance(keywords);
    onClearKeywords();
    onAddMultipleKeywords(prioritized);
    setPruneNotice('🔥 Fila reordenada com sucesso: termos com maior volume de leads minerados colocados no topo!');
    setTimeout(() => setPruneNotice(null), 4000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      onAddMultipleKeywords(lines);
      setImportText('');
      setShowImportModal(false);
      setPruneNotice(`📥 ${lines.length} palavras-chave importadas com sucesso!`);
      setTimeout(() => setPruneNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* MASTER HEADER: CENTRAL DE INTELIGÊNCIA DE TERMOS */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-400 tracking-[0.2em]">
              Central de Inteligência de Termos
            </span>
            <h2 className="text-2xl font-display font-medium ">Inteligência de Pesquisa</h2>
            <p className="text-sm text-slate-300 max-w-3xl font-medium leading-relaxed">
              Gerenciamento dinâmico, expansão combinatória, filtragem anti-ruído e otimização por IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => keywords.forEach(kw => onExecuteSearchKeyword?.(kw))}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Search className="w-3.5 h-3.5" /> Pesquisar Todos (Fila)
            </button>
            <button
              onClick={handlePrioritize}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 font-bold text-xs  rounded-xl transition-all cursor-pointer"
            >
              Priorizar por Leads
            </button>
            <button
              onClick={handlePruneNonConverting}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 font-bold text-xs  rounded-xl transition-all cursor-pointer"
            >
              Otimizar Fila
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 font-bold text-xs  rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Importar
            </button>
          </div>
        </div>

        {/* QUICK STATS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-xs font-bold">Fila Ativa de Mineração</span>
            <p className="text-xl font-display font-medium text-white">{keywords.length} termos</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-xs font-bold">Banco Catalogado</span>
            <p className="text-xl font-display font-medium text-emerald-400">{intelligentTerms.length} palavras</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-xs font-bold">Filtro Anti-Ruído</span>
            <p className="text-xl font-display font-medium text-rose-400">{negativeTerms.length} termos negativos</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-xs font-bold">Termos Emergentes</span>
            <p className="text-xl font-display font-medium text-blue-400">{discoveries.filter(d => d.status === 'Pendente').length} descobertos</p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          {[
            { id: 'banco', label: 'Banco de Termos', count: intelligentTerms.length },
            { id: 'ai_generator', label: 'IA Geradora' },
            { id: 'niches', label: 'Nichos' },
            { id: 'expansao', label: 'Expansão' },
            { id: 'discovery', label: 'Anti-Ruído', count: discoveries.filter(d => d.status === 'Pendente').length },
            { id: 'cruzamento', label: 'Motor Cruzado' },
            { id: 'analytics', label: 'Retorno e Desempenho' },
          ].map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-sm text-xs font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* QUICK ADD KEYWORD INPUT BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleAddSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newKeywordInput}
              onChange={e => setNewKeywordInput(e.target.value)}
              placeholder="Ex: caminhao bom pra carregar soja barato..."
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              disabled={isAiLoading}
            />
            <button
              type="button"
              onClick={handleSmartSearch}
              disabled={isAiLoading}
              title="Sugestão de Busca Inteligente"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="submit"
            disabled={isAiLoading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            Adicionar
          </button>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onDeduplicateKeywords}
            title="Remover duplicados da fila"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Deduplicar
          </button>
          <button
            onClick={onClearKeywords}
            title="Limpar todos os termos da fila"
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Limpar Fila
          </button>
        </div>
      </div>

      {/* NOTIFICATION NOTICE */}
      {pruneNotice && (
        <div className="p-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg animate-in fade-in flex items-center justify-between">
          <span>{pruneNotice}</span>
          <button onClick={() => setPruneNotice(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* TAB CONTENTS */}
      {activeTab === 'banco' && (
        <TermDatabaseTable
          terms={intelligentTerms}
          onUpdateTerm={handleUpdateTerm}
          onDeleteTerm={handleDeleteTerm}
          onBatchDelete={handleBatchDelete}
          onBatchStatusChange={handleBatchStatusChange}
          onAddTermsToMiningQueue={onAddMultipleKeywords}
          onExecuteSearchKeyword={onExecuteSearchKeyword}
        />
      )}

      {activeTab === 'ai_generator' && (
        <AiTermGeneratorTab
          onAddMultipleKeywords={onAddMultipleKeywords}
          existingKeywords={keywords}
        />
      )}

      {activeTab === 'niches' && (
        <NicheCatalogTab
          onAddMultipleKeywords={onAddMultipleKeywords}
        />
      )}

      {activeTab === 'expansao' && (
        <CombinatorialExpanderTab
          onAddMultipleKeywords={onAddMultipleKeywords}
        />
      )}

      {activeTab === 'discovery' && (
        <DiscoveryAndAntiNoiseTab
          discoveries={discoveries}
          negativeTerms={negativeTerms}
          onApproveDiscovery={handleApproveDiscovery}
          onRejectDiscovery={handleRejectDiscovery}
          onAddNegativeTerm={handleAddNegativeTerm}
          onDeleteNegativeTerm={handleDeleteNegativeTerm}
        />
      )}

      {activeTab === 'cruzamento' && (
        <CrossScannerTab
          onAddMultipleKeywords={onAddMultipleKeywords}
        />
      )}

      {activeTab === 'analytics' && (
        <TrendsAndAnalyticsTab
          terms={intelligentTerms}
        />
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Importar Lista de Palavras-Chave</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
            </div>
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                rows={8}
                placeholder="Cole aqui suas palavras-chave (1 por linha)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Importar Palavras
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BYOK Modal (Gemini Fallback) */}
      {showByokModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Bot className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Ativar Busca Mágica</h3>
                <p className="text-xs text-slate-600">Seu navegador não possui IA embutida. Use sua chave do Google Gemini.</p>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Chave de API do Gemini (Grátis)</label>
                <input
                  type="password"
                  value={byokKey}
                  onChange={e => setByokKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-500">
                  Sua chave fica salva apenas no seu navegador (localStorage) e nunca é enviada aos nossos servidores. Crie uma de graça no <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowByokModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveByokKey}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Salvar Chave e Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
