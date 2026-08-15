import React, { useState, useEffect } from 'react';
import {
  Bug,
  X,
  Clock,
  Zap,
  AlertTriangle,
  Server,
  Bot,
  Filter,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronRight,
  Gauge,
  Layers,
  Database,
  Activity
} from 'lucide-react';
import { SearchDebugStep, SearchExecutionSummary, SearchDebugStage } from '../types';
import {
  getLatestSearchDebugTrace,
  subscribeToSearchDebugTrace,
  clearSearchDebugTrace
} from '../utils/smartSearchOrchestrator';

interface SearchDebugConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDebugConsoleModal: React.FC<SearchDebugConsoleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [trace, setTrace] = useState<SearchDebugStep[]>([]);
  const [summary, setSummary] = useState<SearchExecutionSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'bottlenecks' | 'http' | 'ai' | 'delays' | 'cache' | 'errors'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Load initial state
    const current = getLatestSearchDebugTrace();
    setTrace(current.trace);
    setSummary(current.summary);

    // Subscribe to live search updates
    const unsubscribe = subscribeToSearchDebugTrace((newTrace, newSummary) => {
      setTrace(newTrace);
      setSummary(newSummary);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    const payload = {
      summary,
      trace,
      generatedAt: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    clearSearchDebugTrace();
    setTrace([]);
    setSummary(null);
  };

  // Filter logs by tab & search term
  const filteredTrace = trace.filter((step) => {
    if (activeTab === 'bottlenecks' && !step.isBottleneck && step.stage !== 'BOTTLENECK') return false;
    if (activeTab === 'http' && step.stage !== 'HTTP_REQUEST') return false;
    if (activeTab === 'ai' && step.stage !== 'CASCADE_AI') return false;
    if (activeTab === 'delays' && step.stage !== 'DELAY_COOLING') return false;
    if (activeTab === 'cache' && step.stage !== 'CACHE_CHECK') return false;
    if (activeTab === 'errors' && step.stage !== 'ERROR') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchMsg = step.message.toLowerCase().includes(term);
      const matchQuery = step.query?.toLowerCase().includes(term);
      const matchStage = step.stage.toLowerCase().includes(term);
      return matchMsg || matchQuery || matchStage;
    }

    return true;
  });

  // Calculate Breakdown percentages for Visual Bar
  const breakdown = summary?.breakdownMs || {
    networkHttpMs: 0,
    cascadeAiMs: 0,
    delaysMs: 0,
    dedupProcessingMs: 0,
    cacheMs: 0,
  };

  const totalCalcMs =
    (breakdown.networkHttpMs || 0) +
    (breakdown.cascadeAiMs || 0) +
    (breakdown.delaysMs || 0) +
    (breakdown.dedupProcessingMs || 0) +
    (breakdown.cacheMs || 0) || 1;

  const pctHttp = Math.round(((breakdown.networkHttpMs || 0) / totalCalcMs) * 100);
  const pctAi = Math.round(((breakdown.cascadeAiMs || 0) / totalCalcMs) * 100);
  const pctDelays = Math.round(((breakdown.delaysMs || 0) / totalCalcMs) * 100);
  const pctDedup = Math.round(((breakdown.dedupProcessingMs || 0) / totalCalcMs) * 100);
  const pctCache = Math.round(((breakdown.cacheMs || 0) / totalCalcMs) * 100);

  const getStageBadge = (stage: SearchDebugStage) => {
    switch (stage) {
      case 'INIT':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'CACHE_CHECK':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'HTTP_REQUEST':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'CASCADE_AI':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'CLEANSE_DEDUP':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'DELAY_COOLING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'COMPLETE':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ERROR':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'BOTTLENECK':
        return 'bg-red-600/30 text-red-200 border-red-500/50 font-bold animate-pulse';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Console de Depuração e Diagnóstico de Busca
                </h2>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
                  Motor de Pesquisa IA V2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rastreamento cirúrgico de etapas, medição de latência e diagnóstico de gargalos de performance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              title="Copiar Relatório Completo em JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>

            <button
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Limpar Histórico de Depuração"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Summary Metric Cards */}
          {summary ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {/* Card 1: Tempo Total */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Tempo Total</span>
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black font-mono ${
                      summary.totalDurationSeconds > 10
                        ? 'text-rose-400'
                        : summary.totalDurationSeconds > 5
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {summary.totalDurationSeconds}s
                  </span>
                  <span className="text-xs text-slate-500 font-mono">({summary.totalDurationMs}ms)</span>
                </div>
              </div>

              {/* Card 2: Pesquisas Executadas */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Pesquisas Lançadas</span>
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-white">
                    {summary.queriesExecutedCount}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">/ {summary.queriesGeneratedCount} geradas</span>
                </div>
              </div>

              {/* Card 3: Cache Hits vs Network */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Cache vs Rede HTTP</span>
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {summary.cacheHitsCount}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Hits / {summary.httpRequestsCount} HTTP</span>
                </div>
              </div>

              {/* Card 4: Cascata IA & Rate Limits */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Cascata IA & Rate Limit</span>
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-purple-300">
                    {summary.cascadeAiCallsCount}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    IA / {summary.rateLimit429Count > 0 ? `${summary.rateLimit429Count} 429` : '0 Bloqueios'}
                  </span>
                </div>
              </div>

              {/* Card 5: Leads Obtidos */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Leads Encontrados</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono text-cyan-300">
                    {summary.uniqueLeadsRetained}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">({summary.totalRawContactsFound} brutos)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl text-center text-slate-400 text-sm italic">
              Nenhuma busca ativa ou resumo disponível no momento. Execute uma pesquisa para visualizar a telemetria completa.
            </div>
          )}

          {/* Bottlenecks Diagnostics Section */}
          {summary && summary.bottlenecks && summary.bottlenecks.length > 0 && (
            <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                <span>Diagnóstico de Gargalos de Performance Detectados</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-xs text-rose-200/90 leading-relaxed font-sans">
                {summary.bottlenecks.map((bottleneck, idx) => (
                  <li key={idx} className="font-medium">
                    {bottleneck}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Time Breakdown Bar */}
          {summary && (
            <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-sky-400" />
                  <span>Distribuição do Tempo de Execução (Breakdown)</span>
                </div>
                <span className="font-mono text-slate-400">{summary.totalDurationMs}ms Total</span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
                {pctHttp > 0 && (
                  <div
                    style={{ width: `${pctHttp}%` }}
                    className="bg-cyan-500 h-full transition-all"
                    title={`Rede HTTP: ${breakdown.networkHttpMs}ms (${pctHttp}%)`}
                  />
                )}
                {pctAi > 0 && (
                  <div
                    style={{ width: `${pctAi}%` }}
                    className="bg-purple-500 h-full transition-all"
                    title={`Cascata IA: ${breakdown.cascadeAiMs}ms (${pctAi}%)`}
                  />
                )}
                {pctDelays > 0 && (
                  <div
                    style={{ width: `${pctDelays}%` }}
                    className="bg-amber-500 h-full transition-all"
                    title={`Delays & Resfriamento: ${breakdown.delaysMs}ms (${pctDelays}%)`}
                  />
                )}
                {pctDedup > 0 && (
                  <div
                    style={{ width: `${pctDedup}%` }}
                    className="bg-indigo-500 h-full transition-all"
                    title={`Processamento/Dedup: ${breakdown.dedupProcessingMs}ms (${pctDedup}%)`}
                  />
                )}
                {pctCache > 0 && (
                  <div
                    style={{ width: `${pctCache}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Verificação de Cache: ${breakdown.cacheMs}ms (${pctCache}%)`}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between text-xs gap-3 pt-1 text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                  <span>Rede HTTP: <strong className="text-slate-200">{breakdown.networkHttpMs}ms</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span>Cascata IA: <strong className="text-slate-200">{breakdown.cascadeAiMs}ms</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>Delays/Pausas: <strong className="text-slate-200">{breakdown.delaysMs}ms</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span>Processamento: <strong className="text-slate-200">{breakdown.dedupProcessingMs}ms</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Cache Check: <strong className="text-slate-200">{breakdown.cacheMs}ms</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Filter & Controls Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 border border-slate-800 rounded-xl">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Todos ({trace.length})
              </button>
              <button
                onClick={() => setActiveTab('bottlenecks')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === 'bottlenecks'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Gargalos ({trace.filter((t) => t.isBottleneck || t.stage === 'BOTTLENECK').length})</span>
              </button>
              <button
                onClick={() => setActiveTab('http')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'http'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Rede HTTP ({trace.filter((t) => t.stage === 'HTTP_REQUEST').length})
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'ai'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Cascata IA ({trace.filter((t) => t.stage === 'CASCADE_AI').length})
              </button>
              <button
                onClick={() => setActiveTab('delays')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'delays'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Delays ({trace.filter((t) => t.stage === 'DELAY_COOLING').length})
              </button>
              <button
                onClick={() => setActiveTab('cache')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'cache'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                Cache ({trace.filter((t) => t.stage === 'CACHE_CHECK').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative shrink-0 w-full sm:w-56">
              <input
                type="text"
                placeholder="Filtrar mensagem ou query..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 pl-8 focus:outline-none focus:border-sky-500/50"
              />
              <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            </div>
          </div>

          {/* Interactive Steps List */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {filteredTrace.length === 0 ? (
              <div className="py-8 text-center text-slate-500 italic">
                Nenhum log encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredTrace.map((step) => {
                const isExpanded = expandedStepId === step.id;
                const hasDetails = step.details && Object.keys(step.details).length > 0;

                return (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-lg border transition-all ${
                      step.isBottleneck || step.stage === 'BOTTLENECK'
                        ? 'bg-rose-950/20 border-rose-800/40'
                        : step.stage === 'ERROR'
                        ? 'bg-rose-950/20 border-rose-800/30'
                        : step.stage === 'CASCADE_AI'
                        ? 'bg-purple-950/20 border-purple-800/30'
                        : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Expand Toggle */}
                        {hasDetails ? (
                          <button
                            onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                            className="p-0.5 text-slate-500 hover:text-white rounded mt-0.5 shrink-0 cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <div className="w-4 h-4 shrink-0" />
                        )}

                        {/* Stage Badge */}
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border shrink-0 ${getStageBadge(
                            step.stage
                          )}`}
                        >
                          {step.stage}
                        </span>

                        {/* Message */}
                        <p className="text-slate-200 flex-1 break-words leading-relaxed">
                          {step.message}
                        </p>
                      </div>

                      {/* Timestamps & Durations */}
                      <div className="flex items-center gap-2 shrink-0 text-right">
                        {step.durationMs !== undefined && (
                          <span className="text-sky-400 font-bold bg-sky-950/40 border border-sky-800/40 px-1.5 py-0.5 rounded text-[10px]">
                            +{step.durationMs}ms
                          </span>
                        )}
                        <span className="text-slate-500 text-[10px] font-sans">{step.timestamp}</span>
                        <span className="text-slate-600 text-[10px] font-sans">+{step.elapsedMs}ms</span>
                      </div>
                    </div>

                    {/* Expandable JSON Details */}
                    {isExpanded && hasDetails && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 pl-6">
                        <pre className="text-[11px] text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 overflow-x-auto text-emerald-400 font-mono">
                          {JSON.stringify(step.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistema de Telemetria e Diagnóstico Ativo em Tempo Real</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
