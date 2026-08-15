import React, { useState, useMemo } from 'react';
import { IntelligentTerm, TermPriority, TermStatus } from '../../types/keywordIntelligence';
import { Search, Filter, Sparkles, Trash2, Play, Pause, ArrowUpDown, ChevronDown, CheckSquare, Square, Download, FileText, Zap, Award, Layers } from 'lucide-react';

interface TermDatabaseTableProps {
  terms: IntelligentTerm[];
  onUpdateTerm: (term: IntelligentTerm) => void;
  onDeleteTerm: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchStatusChange: (ids: string[], status: TermStatus) => void;
  onAddTermsToMiningQueue: (keywords: string[]) => void;
  onOpenSimulateModal?: (keywords: string[]) => void;
  onExecuteSearchKeyword?: (kw: string) => Promise<any>;
}

export const TermDatabaseTable: React.FC<TermDatabaseTableProps> = ({
  terms,
  onUpdateTerm,
  onDeleteTerm,
  onBatchDelete,
  onBatchStatusChange,
  onAddTermsToMiningQueue,
  onExecuteSearchKeyword,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'leadsFound' | 'conversionRate' | 'keyword'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTermDetail, setSelectedTermDetail] = useState<IntelligentTerm | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    terms.forEach(t => { if (t.category) set.add(t.category); });
    return Array.from(set);
  }, [terms]);

  // Filter & Sort terms
  const filteredTerms = useMemo(() => {
    return terms
      .filter(t => {
        const matchesSearch = t.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.stateUf.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
        const matchesStat = selectedStatus === 'ALL' || t.status === selectedStatus;
        const matchesPrio = selectedPriority === 'ALL' || t.priority === selectedPriority;
        return matchesSearch && matchesCat && matchesStat && matchesPrio;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];
        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [terms, searchTerm, selectedCategory, selectedStatus, selectedPriority, sortBy, sortDir]);

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTerms.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTerms.map(t => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExportSelectedCsv = () => {
    const listToExport = terms.filter(t => selectedIds.has(t.id));
    if (listToExport.length === 0) return;

    const headers = ['ID', 'Termo', 'Categoria', 'Score', 'Status', 'Prioridade', 'Estado', 'Leads', 'Telefones Válidos', 'WhatsApp', 'Conversão (%)'];
    const rows = listToExport.map(t => [
      t.id,
      `"${t.keyword.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.score,
      t.status,
      t.priority,
      t.stateUf,
      t.leadsFound,
      t.validPhonesCount,
      t.whatsAppsCount,
      t.conversionRate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `banco_inteligente_termos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar termo, categoria, tag ou estado..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Todas Categoria ({categories.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Ativo">🟢 Ativos</option>
              <option value="Pausado">⏸️ Pausados</option>
              <option value="Otimizado">⚡ Otimizados</option>
              <option value="Descoberto">✨ Descobertos</option>
            </select>

            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Todas Prioridades</option>
              <option value="Alta">🔥 Alta</option>
              <option value="Média">⚡ Média</option>
              <option value="Baixa">💤 Baixa</option>
            </select>
          </div>
        </div>

        {/* Batch Actions Bar if selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-xs animate-in fade-in">
            <span className="font-semibold text-blue-900 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              {selectedIds.size} termos selecionados
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const kws = terms.filter(t => selectedIds.has(t.id)).map(t => t.keyword);
                  onAddTermsToMiningQueue(kws);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> Enviar p/ Fila de Mineração
              </button>
              <button
                onClick={() => onBatchStatusChange(Array.from(selectedIds), 'Ativo')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                Ativar
              </button>
              <button
                onClick={() => onBatchStatusChange(Array.from(selectedIds), 'Pausado')}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                Pausar
              </button>
              <button
                onClick={handleExportSelectedCsv}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={() => {
                  onBatchDelete(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="cursor-pointer text-slate-400 hover:text-slate-700">
                    {selectedIds.size > 0 && selectedIds.size === filteredTerms.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">
                  <button
                    onClick={() => {
                      if (sortBy === 'keyword') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('keyword'); setSortDir('asc'); }
                    }}
                    className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    Termo de Mineração <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="p-3">Categoria</th>
                <th className="p-3 text-center">
                  <button
                    onClick={() => {
                      if (sortBy === 'score') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('score'); setSortDir('desc'); }
                    }}
                    className="flex items-center justify-center gap-1 hover:text-slate-900 cursor-pointer w-full"
                  >
                    Score IA <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="p-3 text-center">UF</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">
                  <button
                    onClick={() => {
                      if (sortBy === 'leadsFound') setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                      else { setSortBy('leadsFound'); setSortDir('desc'); }
                    }}
                    className="flex items-center justify-end gap-1 hover:text-slate-900 cursor-pointer w-full"
                  >
                    Leads <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="p-3 text-right">WhatsApps</th>
                <th className="p-3 text-right">Conv. %</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Nenhum termo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTerms.map(t => {
                  const isSelected = selectedIds.has(t.id);
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <button onClick={() => toggleSelectOne(t.id)} className="cursor-pointer text-slate-400 hover:text-slate-700">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        <div className="flex flex-col">
                          <span>{t.keyword}</span>
                          {t.tags && t.tags.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {t.tags.map(tag => (
                                <span key={tag} className="text-xs px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-sm font-normal">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-sm">
                          {t.category}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-lg text-sm ${
                          t.score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          t.score >= 50 ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          <Award className="w-3 h-3 mr-0.5" />
                          {t.score}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-600">
                        {t.stateUf || 'BR'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs  ${
                          t.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' :
                          t.status === 'Pausado' ? 'bg-slate-200 text-slate-600' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        {t.leadsFound}
                      </td>
                      <td className="p-3 text-right text-emerald-700 font-bold">
                        {t.whatsAppsCount}
                      </td>
                      <td className="p-3 text-right text-blue-700 font-bold">
                        {t.conversionRate}%
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onExecuteSearchKeyword && (
                            <button
                              onClick={() => onExecuteSearchKeyword(t.keyword)}
                              title="Pesquisar este termo agora (Solo Search)"
                              className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-md cursor-pointer"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTermDetail(t)}
                            title="Ver Histórico & Detalhes"
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateTerm({ ...t, status: t.status === 'Ativo' ? 'Pausado' : 'Ativo' })}
                            title={t.status === 'Ativo' ? 'Pausar' : 'Ativar'}
                            className="p-1 hover:bg-slate-200 text-slate-600 rounded-md cursor-pointer"
                          >
                            {t.status === 'Ativo' ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                          <button
                            onClick={() => onDeleteTerm(t.id)}
                            title="Excluir"
                            className="p-1 hover:bg-rose-100 text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Exibindo {filteredTerms.length} de {terms.length} termos catalogados</span>
          <div className="flex gap-4">
            <span>Total Leads: <strong className="text-slate-800">{terms.reduce((a, b) => a + (b.leadsFound || 0), 0)}</strong></span>
            <span>Total WhatsApps: <strong className="text-emerald-700">{terms.reduce((a, b) => a + (b.whatsAppsCount || 0), 0)}</strong></span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTermDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-w-xl w-full space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600">Histórico & Ficha do Termo</span>
                <h3 className="text-lg font-bold text-slate-800">{selectedTermDetail.keyword}</h3>
              </div>
              <button onClick={() => setSelectedTermDetail(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs">Score de Conversão</span>
                <p className="text-lg font-bold text-emerald-600">{selectedTermDetail.score} / 100</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs">Leads Capturados</span>
                <p className="text-lg font-bold text-slate-800">{selectedTermDetail.leadsFound}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs">WhatsApps Válidos</span>
                <p className="text-lg font-bold text-emerald-700">{selectedTermDetail.whatsAppsCount}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 text-xs">Execuções</span>
                <p className="text-lg font-bold text-slate-800">{selectedTermDetail.executionCount}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">Histórico de Execuções Recentes</h4>
              {selectedTermDetail.executionHistory && selectedTermDetail.executionHistory.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {selectedTermDetail.executionHistory.map(log => (
                    <div key={log.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex justify-between text-sm">
                      <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="font-bold text-emerald-700">+{log.leadsFound} leads ({log.whatsAppsFound} WA)</span>
                      <span className="text-slate-400">{log.durationSec}s</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">Nenhuma execução registrada no histórico ainda.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTermDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
