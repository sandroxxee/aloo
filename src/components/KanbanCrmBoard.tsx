import { maskContact } from '../utils/textProcessor';
import React, { useState, useMemo } from 'react';
import { Lead } from '../types';
import {
  Kanban,
  MessageCircle,
  DollarSign,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  XCircle,
  MoveRight,
  Filter,
  Sparkles,
  Phone,
  MapPin,
  Building2,
  Search,
  Zap,
  Tag,
  Clock,
  Trash2,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { updateWarmedLeadsCache } from '../utils/cacheWarmupEngine';

interface KanbanCrmBoardProps {
  leads: Lead[];
  onUpdateLeadStage: (leadId: string, newStage: 'novo' | 'contatado' | 'negociacao' | 'ganho' | 'perdido') => void;
  onOpenWhatsapp: (lead: Lead) => void;
  onGenerateAiPitch?: (lead: Lead) => void;
  onArchiveLead?: (leadId: string) => void;
}

type StageKey = 'novo' | 'contatado' | 'negociacao' | 'ganho' | 'perdido';

interface ColumnConfig {
  id: StageKey;
  title: string;
  badgeBg: string;
  headerBorder: string;
  icon: React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'novo',
    title: 'NEW ASSETS',
    badgeBg: 'bg-blue-600 text-white shadow-lg shadow-blue-500/20',
    headerBorder: 'border-blue-600',
    icon: <Zap className="w-3.5 h-3.5" />
  },
  {
    id: 'contatado',
    title: 'ENGAGEMENT',
    badgeBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
    headerBorder: 'border-emerald-600',
    icon: <MessageCircle className="w-3.5 h-3.5" />
  },
  {
    id: 'negociacao',
    title: 'NEGOTIATION',
    badgeBg: 'bg-amber-600 text-white shadow-lg shadow-amber-500/20',
    headerBorder: 'border-amber-600',
    icon: <TrendingUp className="w-3.5 h-3.5" />
  },
  {
    id: 'ganho',
    title: 'CONVERTED',
    badgeBg: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg',
    headerBorder: 'border-slate-900 dark:border-white',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />
  },
  {
    id: 'perdido',
    title: 'ARCHIVE',
    badgeBg: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    headerBorder: 'border-slate-300 dark:border-slate-700',
    icon: <XCircle className="w-3.5 h-3.5" />
  }
];

export const KanbanCrmBoard: React.FC<KanbanCrmBoardProps> = ({
  leads,
  onUpdateLeadStage,
  onOpenWhatsapp,
  onGenerateAiPitch,
  onArchiveLead
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [geoFilter, setGeoFilter] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<string>('ALL'); // ALL, 7d, 30d

  // Drag & Drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [isOverArchiveZone, setIsOverArchiveZone] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<StageKey | null>(null);

  // Helper to map default stage if not present
  const getLeadStage = (lead: Lead): StageKey => {
    if (lead.kanbanStage) return lead.kanbanStage;
    if (lead.outreachStatus === 'enviado') return 'contatado';
    if (lead.outreachStatus === 'respondido') return 'negociacao';
    if (lead.outreachStatus === 'ignorado') return 'perdido';
    return 'novo';
  };

  // Helper to calculate time spent in current stage
  const getTimeInStageInfo = (lead: Lead) => {
    const dateStr = (lead as any).stageUpdatedAt || lead.createdAt || (lead as any).updatedAt;
    if (!dateStr) {
      return {
        text: 'Recente',
        hours: 0,
        days: 0,
        badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
      };
    }
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      return {
        text: '< 1h na etapa',
        hours,
        days,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      };
    } else if (hours < 24) {
      return {
        text: `${hours}h na etapa`,
        hours,
        days,
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      };
    } else if (days <= 2) {
      return {
        text: `${days}d na etapa`,
        hours,
        days,
        badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      };
    } else if (days <= 5) {
      return {
        text: `${days}d na etapa ⚠️`,
        hours,
        days,
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-bold'
      };
    } else {
      return {
        text: `${days}d parado! 🚨`,
        hours,
        days,
        badgeClass: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-700 font-extrabold animate-pulse'
      };
    }
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setIsOverArchiveZone(false);
    setDragOverColumn(null);
  };

  const handleColumnDrop = (e: React.DragEvent, targetStage: StageKey) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      onUpdateLeadStage(leadId, targetStage);
      setDraggedLeadId(null);
    }
  };

  const handleArchiveAndPurge = (leadId: string) => {
    if (onArchiveLead) {
      onArchiveLead(leadId);
    } else {
      onUpdateLeadStage(leadId, 'perdido');
    }
    setDraggedLeadId(null);
  };

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchSearch =
        !searchTerm ||
        (lead.name && lead.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.item && lead.item.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.phone && lead.phone.includes(searchTerm)) ||
        (lead.companyName && lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory =
        selectedCategory === 'ALL' || lead.category === selectedCategory;

      const matchGeo = 
        geoFilter === 'ALL' || 
        (lead.stateUf && lead.stateUf.toUpperCase() === geoFilter.toUpperCase()) ||
        (lead.location && lead.location.toUpperCase().includes(geoFilter.toUpperCase()));

      let matchTime = true;
      if (timeFilter !== 'ALL') {
        const now = new Date();
        const leadDate = lead.createdAt ? new Date(lead.createdAt) : new Date();
        const diffDays = (now.getTime() - leadDate.getTime()) / (1000 * 3600 * 24);
        if (timeFilter === '7d') matchTime = diffDays <= 7;
        if (timeFilter === '30d') matchTime = diffDays <= 30;
      }

      return matchSearch && matchCategory && matchGeo && matchTime;
    });
  }, [leads, searchTerm, selectedCategory, geoFilter, timeFilter]);

  // Group leads by stage
  const stageGroups = useMemo(() => {
    const groups: Record<StageKey, Lead[]> = {
      novo: [],
      contatado: [],
      negociacao: [],
      ganho: [],
      perdido: []
    };

    filteredLeads.forEach((lead) => {
      const stage = getLeadStage(lead);
      groups[stage].push(lead);
    });

    return groups;
  }, [filteredLeads]);

  // Calculate column totals in R$
  const getColumnTotalValue = (columnLeads: Lead[]) => {
    let total = 0;
    columnLeads.forEach((l) => {
      if (l.price) {
        const cleaned = l.price.replace(/[^\d]/g, '');
        const val = parseInt(cleaned, 10);
        if (!isNaN(val) && val > 0 && val < 50000000) {
          total += val;
        }
      }
    });
    return total > 0 ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null;
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Bar / Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Pipeline Kanban de Vendas CRM
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-semibold">
                {filteredLeads.length} leads
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Organize, acompanhe e evolua suas negociações em tempo real.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, veículo ou fone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Todas Categorias</option>
            <option value="Caminhões">Caminhões</option>
            <option value="Peças">Peças</option>
            <option value="Implementos">Implementos</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Pneus">Pneus</option>
            <option value="Logística">Logística</option>
          </select>

          {/* Geo Filter (States) */}
          <select
            value={geoFilter}
            onChange={(e) => setGeoFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Todo o Brasil (Geo)</option>
            <option value="SP">São Paulo (SP)</option>
            <option value="MG">Minas Gerais (MG)</option>
            <option value="PR">Paraná (PR)</option>
            <option value="SC">Santa Catarina (SC)</option>
            <option value="RS">Rio Grande do Sul (RS)</option>
            <option value="RJ">Rio de Janeiro (RJ)</option>
            <option value="GO">Goiás (GO)</option>
            <option value="MT">Mato Grosso (MT)</option>
            <option value="MS">Mato Grosso do Sul (MS)</option>
            <option value="BA">Bahia (BA)</option>
          </select>

          {/* Time Filter (Intent Recency) */}
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {(['ALL', '7d', '30d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  timeFilter === t 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t === 'ALL' ? 'Tudo' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ARCHIVE & MEMORY CLEANUP DROP ZONE */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setIsOverArchiveZone(true);
        }}
        onDragLeave={() => setIsOverArchiveZone(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOverArchiveZone(false);
          const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
          if (leadId) {
            handleArchiveAndPurge(leadId);
          }
        }}
        className={`p-3.5 rounded-xl border-2 border-dashed transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isOverArchiveZone
            ? 'bg-red-500/15 border-red-500 text-red-600 dark:text-red-300 scale-[1.01] shadow-lg shadow-red-500/20'
            : draggedLeadId
            ? 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400 animate-pulse'
            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors ${isOverArchiveZone ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <span>Área de Descarte & Limpeza de Memória</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-black uppercase">
                Arraste aqui
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {draggedLeadId
                ? '🎯 Solte o card aqui para arquivar o lead e purgar a memória do sistema instantaneamente!'
                : 'Arraste qualquer card para esta zona para arquivá-lo e remover seus dados da memória local/cache.'}
            </p>
          </div>
        </div>

        {isOverArchiveZone && (
          <span className="text-xs font-black uppercase text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-3 py-1.5 rounded-lg animate-bounce border border-red-300 dark:border-red-800 whitespace-nowrap">
            Solte para Arquivar & Purgar!
          </span>
        )}
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colLeads = stageGroups[col.id];
          const totalVal = getColumnTotalValue(colLeads);
          const isTargetColumn = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverColumn(col.id);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleColumnDrop(e, col.id)}
              className={`flex flex-col glass-panel shadow-sm rounded-xl overflow-hidden min-w-[280px] max-h-[750px] transition-all border-2 ${
                isTargetColumn
                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-500/30'
                  : 'border-transparent'
              }`}
            >
              {/* Column Header */}
              <div className={`p-3 bg-white dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-1`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {col.title}
                    </span>
                  </div>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                    {colLeads.length}
                  </span>
                </div>
                {totalVal && (
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <DollarSign className="w-3 h-3 text-emerald-500" />
                    <span>Total: <strong className="text-emerald-600 dark:text-emerald-400">{totalVal}</strong></span>
                  </div>
                )}
              </div>

              {/* Column Body - Cards List */}
              <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[200px]">
                {colLeads.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Solte cards aqui ({col.title})
                    </p>
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const timeInfo = getTimeInStageInfo(lead);
                    return (
                      <div
                        key={lead.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all space-y-2 group cursor-grab active:cursor-grabbing ${
                          draggedLeadId === lead.id ? 'opacity-40 scale-95 border-indigo-400' : ''
                        }`}
                      >
                        {/* Top Info */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate" title={lead.item}>
                              {lead.item || 'Item não especificado'}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {lead.name || maskContact(lead.phone)}
                            </p>
                          </div>
                          {lead.price && (
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                {lead.price}
                              </span>
                              {lead.commercialScore !== undefined && (
                                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1 rounded border border-indigo-200 dark:border-indigo-800">
                                  <Zap className="w-2.5 h-2.5 fill-current" />
                                  {lead.commercialScore}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tempo na Etapa Indicator Badge */}
                        <div className="flex items-center justify-between gap-1 py-0.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${timeInfo.badgeClass}`} title="Tempo decorrido nesta etapa do CRM">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{timeInfo.text}</span>
                          </span>

                          {lead.sellerType && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 truncate max-w-[110px]">
                              {lead.sellerType}
                            </span>
                          )}
                        </div>

                        {/* Details Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {lead.location && (
                            <span className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                              <MapPin className="w-2.5 h-2.5" />
                              {lead.location}
                            </span>
                          )}
                          {(lead as any).objectionType && (
                            <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold text-xs border ${
                              (lead as any).objectionType === 'INTERESSADO' ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300' :
                              (lead as any).objectionType === 'ACHOU_CARO' ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300' :
                              (lead as any).objectionType === 'JA_VENDEU' ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400' :
                              'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300'
                            }`}>
                              {(lead as any).objectionType}
                            </span>
                          )}
                          {lead.category && (
                            <span className="flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                              <Tag className="w-2.5 h-2.5" />
                              {lead.category}
                            </span>
                          )}
                          {lead.opportunityBadges && lead.opportunityBadges.map((badgeText, bIdx) => (
                            <span key={bIdx} className="bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 px-1.5 py-0.5 rounded text-xs border border-amber-300 dark:border-amber-700">
                              {badgeText}
                            </span>
                          ))}
                        </div>

                        {/* Action Bar */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenWhatsapp(lead)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded transition-colors"
                              title="Abrir conversa no WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>

                            {onGenerateAiPitch && !(
                              lead.intent === 'Venda' && 
                              (lead.category === 'Caminhões' || (lead.item && lead.item.toLowerCase().includes('caminhão'))) && 
                              (lead.sellerType === 'Particular' || !lead.sellerType)
                            ) && (
                              <button
                                onClick={() => onGenerateAiPitch(lead)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors"
                                title="Gerar Pitch de Vendas IA"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleArchiveAndPurge(lead.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors opacity-70 group-hover:opacity-100"
                              title="Arquivar & Limpar da Memória RAM"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Stage Selector Dropdown */}
                          <select
                            value={getLeadStage(lead)}
                            onChange={(e) =>
                              onUpdateLeadStage(lead.id, e.target.value as StageKey)
                            }
                            className="text-xs bg-slate-100 dark:bg-slate-700 border-none rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                          >
                            <option value="novo">Novo Lead</option>
                            <option value="contatado">Em Contato</option>
                            <option value="negociacao">Em Negociação</option>
                            <option value="ganho">Fechado / Ganho</option>
                            <option value="perdido">Perdido</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
