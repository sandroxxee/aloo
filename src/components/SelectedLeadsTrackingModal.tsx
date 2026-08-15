import React, { useState, useMemo } from 'react';
import { 
  CheckCheck, Send, Clock, MessageSquare, AlertTriangle, 
  Search, Download, ExternalLink, RefreshCw, Zap, 
  CheckCircle2, XCircle, User, Phone, ShieldCheck, 
  Filter, X, Bot, Sparkles, PhoneCall, ArrowUpRight
} from 'lucide-react';
import { Lead } from '../types';

interface SelectedLeadsTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeadIds: string[];
  allLeads: Lead[];
  onUpdateLeadStatus: (leadId: string, statusOrPartial: any) => void;
  onOpenWhatsapp: (lead: Lead) => void;
  onAddLog?: (log: any) => void;
}

export const SelectedLeadsTrackingModal: React.FC<SelectedLeadsTrackingModalProps> = ({
  isOpen,
  onClose,
  selectedLeadIds,
  allLeads,
  onUpdateLeadStatus,
  onOpenWhatsapp,
  onAddLog
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'replied' | 'sent' | 'pending' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get full lead objects for selected IDs
  const selectedLeads = useMemo(() => {
    const idSet = new Set(selectedLeadIds);
    return allLeads.filter(l => idSet.has(l.id));
  }, [selectedLeadIds, allLeads]);

  // Derived metrics for the selected batch
  const metrics = useMemo(() => {
    const total = selectedLeads.length;
    let pending = 0;
    let sent = 0;
    let replied = 0;
    let failed = 0;

    selectedLeads.forEach(l => {
      if (l.outreachStatus === 'respondido' || (l.repliedCount && l.repliedCount > 0)) {
        replied++;
        sent++;
      } else if (l.outreachStatus === 'enviado') {
        sent++;
      } else if (l.outreachStatus === 'ignorado' || l.whatsappStatus === 'no-whatsapp') {
        failed++;
      } else {
        pending++;
      }
    });

    const responseRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;
    const deliveryRate = total > 0 ? Math.round((sent / total) * 100) : 0;

    return { total, pending, sent, replied, failed, responseRate, deliveryRate };
  }, [selectedLeads]);

  // Filtered leads based on tab and search
  const filteredLeads = useMemo(() => {
    return selectedLeads.filter(l => {
      // Tab filter
      if (filterStatus === 'replied') {
        if (!(l.outreachStatus === 'respondido' || (l.repliedCount && l.repliedCount > 0))) return false;
      } else if (filterStatus === 'sent') {
        if (l.outreachStatus !== 'enviado') return false;
      } else if (filterStatus === 'pending') {
        if (l.outreachStatus === 'enviado' || l.outreachStatus === 'respondido' || (l.repliedCount && l.repliedCount > 0)) return false;
      } else if (filterStatus === 'failed') {
        if (l.outreachStatus !== 'ignorado' && l.whatsappStatus !== 'no-whatsapp') return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = l.name?.toLowerCase().includes(query) || l.companyName?.toLowerCase().includes(query);
        const phoneMatch = l.phone.includes(query) || l.rawPhone.includes(query);
        const itemMatch = l.item?.toLowerCase().includes(query);
        return nameMatch || phoneMatch || itemMatch;
      }

      return true;
    });
  }, [selectedLeads, filterStatus, searchTerm]);

  // Handle Export Batch Report to CSV
  const handleExportBatchCsv = () => {
    if (selectedLeads.length === 0) return;

    const headers = ['ID', 'Nome/Empresa', 'Telefone', 'Item', 'Cidade', 'Estado', 'Status Envio', 'Respondido', 'E-mail', 'Primeiro Visto em'];
    const rows = selectedLeads.map(l => [
      l.id,
      `"${(l.name || l.companyName || 'Sem Nome').replace(/"/g, '""')}"`,
      l.phone,
      `"${(l.item || '').replace(/"/g, '""')}"`,
      `"${(l.city || l.location || '').replace(/"/g, '""')}"`,
      l.stateUf || '',
      l.outreachStatus || 'pendente',
      l.repliedCount && l.repliedCount > 0 ? 'SIM' : 'NÃO',
      l.email || '',
      l.createdAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_envio_selecionados_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onAddLog) {
      onAddLog({
        level: 'success',
        message: `📥 Relatório de entregabilidade dos ${selectedLeads.length} leads selecionados exportado com sucesso!`
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/30">
              <CheckCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Acompanhamento Real dos Selecionados
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-full border border-emerald-500/20">
                  {metrics.total} LEADS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Rastreamento em tempo real de confirmação de recebimento (double check ✔✔) e respostas ativas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBatchCsv}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Baixar relatório em formato CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Exportar Relatório</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS CARDS GRID */}
        <div className="p-5 bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">Total Lote</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{metrics.total}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-amber-500/20 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase text-amber-500 block tracking-wider">Na Fila ⏳</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{metrics.pending}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-blue-500/20 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase text-blue-500 block tracking-wider">Entregues ✅</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{metrics.sent}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-emerald-500/30 shadow-2xs ring-1 ring-emerald-500/20">
            <span className="text-[10px] font-extrabold uppercase text-emerald-500 block tracking-wider">Respondidos 💬</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
              {metrics.replied}
              {metrics.replied > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-rose-500/20 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase text-rose-500 block tracking-wider">Falhas ⚠️</span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{metrics.failed}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-indigo-500/20 shadow-2xs">
            <span className="text-[10px] font-extrabold uppercase text-indigo-500 block tracking-wider">Taxa Resposta</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">{metrics.responseRate}%</span>
          </div>

        </div>

        {/* TABS & SEARCH FILTER BAR */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {[
              { id: 'all', label: `Todos (${metrics.total})` },
              { id: 'replied', label: `💬 Respondidos (${metrics.replied})` },
              { id: 'sent', label: `✅ Entregues (${metrics.sent})` },
              { id: 'pending', label: `⏳ Na Fila (${metrics.pending})` },
              { id: 'failed', label: `⚠️ Falhas (${metrics.failed})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box inside batch */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar no lote..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* LEADS TRACKING TABLE / LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Nenhum lead encontrado com esse filtro no lote selecionado.
              </p>
            </div>
          ) : (
            filteredLeads.map((lead, idx) => {
              const isReplied = lead.outreachStatus === 'respondido' || (lead.repliedCount && lead.repliedCount > 0);
              const isSent = lead.outreachStatus === 'enviado';
              const isFailed = lead.outreachStatus === 'ignorado' || lead.whatsappStatus === 'no-whatsapp';

              return (
                <div
                  key={lead.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isReplied
                      ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10'
                      : isSent
                      ? 'bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10'
                      : isFailed
                      ? 'bg-rose-500/5 border-rose-500/20 dark:bg-rose-500/10'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Lead Main Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-500 shrink-0">
                      #{idx + 1}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {lead.name || lead.companyName || 'Anunciante'}
                        </span>
                        {lead.stateUf && (
                          <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-mono font-bold">
                            {lead.stateUf}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </span>
                        <span className="truncate">• {lead.item || 'Veículo'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator & Timestamp */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right space-y-0.5">
                      {isReplied ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white font-extrabold text-xs rounded-lg shadow-sm animate-pulse">
                          <MessageSquare className="w-3.5 h-3.5 fill-current" />
                          <span>RESPONDIDO! 💬</span>
                        </div>
                      ) : isSent ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-bold text-xs rounded-lg">
                          <CheckCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Entregue (✔✔)</span>
                        </div>
                      ) : isFailed ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-bold text-xs rounded-lg">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Falhou / Sem Whats</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Na Fila (Aguardando)</span>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 font-mono">
                        {lead.lastCadenceSentAt 
                          ? `Envio: ${new Date(lead.lastCadenceSentAt).toLocaleTimeString('pt-BR')}`
                          : 'Aguardando Disparo'}
                      </div>
                    </div>

                    {/* Quick WhatsApp Chat Action */}
                    <button
                      type="button"
                      onClick={() => onOpenWhatsapp(lead)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Abrir conversa direta no WhatsApp"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Conversar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Sincronização em tempo real ativa • Atualizações via WebSocket</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            Fechar Acompanhamento
          </button>
        </div>

      </div>
    </div>
  );
};
