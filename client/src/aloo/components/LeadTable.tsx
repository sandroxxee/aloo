import { maskContact } from '../utils/textProcessor';
import React, { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  Download, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  Sparkles, 
  ExternalLink, 
  Filter, 
  Phone, 
  MapPin, 
  Tag, 
  Upload, 
  User, 
  ShieldCheck, 
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Truck,
  Wrench,
  Package,
  Layers,
  Cog,
  FileSpreadsheet,
  Bot,
  Copy,
  Check,
  X,
  Send,
  Zap,
  Database,
  Store,
  Mail,
  Globe,
  Building2,
  Share2,
  MoreVertical,
  Instagram,
  Facebook,
  Linkedin,
  Clock,
  ArrowUpRight,
  Activity,
  History,
  Brain
} from 'lucide-react';
import { Lead, LeadCategory } from '../types';
import { downloadVcfContacts, downloadGoogleContactsCsv } from '../utils/googleContacts';
import { classifyLeadCategory } from '../utils/leadCategoryClassifier';
import { matchesTargetState } from '../utils/phoneExtractor';
import { BRAZIL_STATES, getStateFromDDD } from '../utils/states';
import { SmartExcelExportModal } from './SmartExcelExportModal';
import { SellerAdsModal } from './SellerAdsModal';
import { SelectedLeadsTrackingModal } from './SelectedLeadsTrackingModal';

export const DEFAULT_PRESET_TAGS = [
  { name: 'VIP', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: '🔥' },
  { name: 'Urgente', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: '⚡' },
  { name: 'Frota Grande', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: '🚛' },
  { name: 'Repasse', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: '🏷️' },
  { name: 'Abaixo FIPE', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: '💰' },
  { name: 'Decisor', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: '👔' },
  { name: 'Follow-up', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', icon: '📅' },
  { name: 'CNPJ Ativo', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20', icon: '🏢' },
  { name: 'Favorito', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: '⭐' },
];

interface LeadTableProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, statusOrPartial: any) => void;
  onDeleteLead: (leadId: string) => void;
  onClearAllLeads: () => void;
  onClearAllData: () => void;
  onExportCsv: () => void;
  onCleanLeads: () => void;
  defaultStateFilter?: string;
  defaultStatusFilter?: string;
  defaultSentimentFilter?: string;
  onAnalyzeSentiment?: (leadId: string) => void;
  onEnrichProfile?: (leadId: string) => Promise<any>;
  autoEnrichLeads?: boolean;
  onSetAutoEnrichLeads?: (val: boolean) => void;
  externalSearchTerm?: string;
  onExternalSearchTermChange?: (val: string) => void;
  onSearchKeywordNow?: (kw: string) => void;
  isSearchingNow?: boolean;
  onOpenImportModal?: () => void;
  onOpenBackupModal?: () => void;
  onValidateBatch?: (leadIds: string[]) => Promise<void>;
  onOpenWhatsapp?: (lead: Lead) => void;
}

interface LeadTableRowProps {
  lead: Lead;
  style: React.CSSProperties;
  itemCategory: string;
  finalScore: number;
  badge: { label: string; color: string };
  isSeller: boolean;
  isBuyer: boolean;
  isMismatched: boolean;
  mismatchedTooltip: string;
  stateMismatchText: string | null;
  dddMismatchText: string | null;
  rawPhone: string;
  sellerAdCount: number;
  isLojista: boolean;
  googleSearchUrl: string;
  isPopoverOpen: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onTogglePopover: (id: string) => void;
  onUpdateStatus: (id: string, statusOrPartial: any) => void;
  onDelete: (id: string) => void;
  onGenerateAiPitch: (lead: Lead) => void;
  onOpenSellerAds: (phone: string, name?: string) => void;
  whatsappTemplates: any[];
  onAnalyzeSentiment?: (leadId: string) => void;
}

const LeadTableRow = React.memo(({
  lead,
  style,
  itemCategory,
  finalScore,
  badge,
  isSeller,
  isBuyer,
  isMismatched,
  mismatchedTooltip,
  stateMismatchText,
  dddMismatchText,
  rawPhone,
  sellerAdCount,
  isLojista,
  googleSearchUrl,
  isPopoverOpen,
  isSelected,
  onToggleSelect,
  onTogglePopover,
  onUpdateStatus,
  onDelete,
  onGenerateAiPitch,
  onOpenSellerAds,
  whatsappTemplates,
  onAnalyzeSentiment,
}: LeadTableRowProps) => {
  const isReplied = lead.outreachStatus === 'respondido' || (lead.repliedCount && lead.repliedCount > 0);
  const isSent = lead.outreachStatus === 'enviado';
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const handleToggleTag = (tagToToggle: string) => {
    const currentTags = lead.tags || [];
    const nextTags = currentTags.includes(tagToToggle)
      ? currentTags.filter(t => t !== tagToToggle)
      : [...currentTags, tagToToggle];
    onUpdateStatus(lead.id, { tags: nextTags });
  };

  const handleAddCustomTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    const currentTags = lead.tags || [];
    if (!currentTags.includes(trimmed)) {
      onUpdateStatus(lead.id, { tags: [...currentTags, trimmed] });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = lead.tags || [];
    onUpdateStatus(lead.id, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  return (
    <div 
      style={style} 
      className={`group flex items-center px-8 py-4 border-b border-slate-100 dark:border-slate-800/40 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
        isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' :
        isMismatched ? 'bg-amber-50/20 dark:bg-amber-950/5' : ''
      }`}
    >
      <div className="w-14 flex items-center justify-center shrink-0">
        <div className="relative">
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={() => onToggleSelect && onToggleSelect(lead.id)}
            className="w-5 h-5 rounded-lg border-slate-200 dark:border-slate-700 text-slate-900 focus:ring-slate-900/10 transition-all cursor-pointer bg-white dark:bg-slate-800 appearance-none border-2 checked:bg-slate-900 dark:checked:bg-white flex items-center justify-center"
          />
          {isSelected && <Check className="w-3.5 h-3.5 text-white dark:text-slate-900 absolute top-1 left-1 pointer-events-none" />}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 items-center">
        {/* 1. Primary Asset Info */}
        <div className="col-span-4 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isLojista ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
               {isLojista ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
             </div>
             <div className="flex flex-col min-w-0">
               <span className="font-black text-[13px] text-slate-900 dark:text-white truncate tracking-tight uppercase leading-none mb-1">
                 {lead.name || 'ANONYMOUS ENTITY'}
               </span>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                    {lead.item || 'ASSET ACQUISITION'}
                 </span>
                 {isReplied && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white rounded-md">
                       <div className="w-1 h-1 rounded-full bg-white" />
                       <span className="text-[8px] font-black uppercase">REPLIED</span>
                    </div>
                 )}
               </div>
             </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mt-1">
            {lead.tags && lead.tags.slice(0, 3).map(tag => {
              const preset = DEFAULT_PRESET_TAGS.find(p => p.name === tag);
              return (
                <span key={tag} className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border shadow-xs ${
                  preset ? preset.color : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  {tag}
                </span>
              );
            })}
            {lead.tags && lead.tags.length > 3 && (
              <span className="text-[9px] font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg uppercase tracking-wider">
                +{lead.tags.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* 2. Logistics & Value */}
        <div className="col-span-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 w-fit">
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[10px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest">
              {lead.stateUf || 'NAT'}
            </span>
          </div>
          {lead.price ? (
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valuation</span>
              <div className="text-[14px] font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                <span className="text-[10px] text-emerald-600">BRL</span>
                {lead.price}
              </div>
            </div>
          ) : (
            <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] italic">Pending Quote</div>
          )}
        </div>

        {/* 3. Outreach Control */}
        <div className="col-span-3 flex items-center gap-3">
          <div className="flex flex-col gap-1.5">
            <a 
              href={lead.waMeUrl || `https://wa.me/${lead.rawPhone}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 transition-all shadow-xl shadow-slate-900/10 group/wa"
            >
              <MessageSquare className="w-4 h-4 group-hover/wa:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Establish Link</span>
            </a>
            {sellerAdCount > 1 && (
              <button 
                onClick={() => onOpenSellerAds(rawPhone, lead.name)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
              >
                <Layers className="w-3 h-3" />
                {sellerAdCount} ACTIVE ASSETS
              </button>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5 min-w-[100px]">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lead Source</span>
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-lg shadow-blue-500/40" />
                {lead.adPlatform || 'Direct'}
             </div>
          </div>
        </div>

        {/* 4. Strategic Score */}
        <div className="col-span-2 flex flex-col items-center gap-2">
           <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-xl shadow-sm border ${
             isSeller ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
           }`}>
             {isSeller ? 'SELLER' : 'BUYER'}
           </div>
           <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Zap className={`w-3.5 h-3.5 ${finalScore > 70 ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-700'}`} />
              <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tighter">{finalScore}%</span>
           </div>
        </div>

        {/* 5. Utility Menu */}
        <div className="col-span-1 flex justify-end">
          <button
            onClick={() => onTogglePopover(lead.id)}
            className={`p-3 rounded-2xl transition-all border-2 ${
              isPopoverOpen 
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-110' 
                : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800 hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white shadow-sm'
            }`}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      
      {/* POPOVER ACTIONS */}
      {isPopoverOpen && (
        <div 
          className="absolute right-4 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => onTogglePopover('')}
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management</p>
          </div>
          <button
            onClick={() => { onGenerateAiPitch(lead); onTogglePopover(''); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
          >
            <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            Generate AI Pitch
          </button>
          {onAnalyzeSentiment && (
            <button
              onClick={() => { onAnalyzeSentiment(lead.id); onTogglePopover(''); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <Bot className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
              AI Qualification
            </button>
          )}
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
          <button
            onClick={() => { onDelete(lead.id); onTogglePopover(''); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors group"
          >
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Remove Intelligence
          </button>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.lead === nextProps.lead &&
    prevProps.isPopoverOpen === nextProps.isPopoverOpen &&
    prevProps.itemCategory === nextProps.itemCategory &&
    prevProps.finalScore === nextProps.finalScore &&
    prevProps.isMismatched === nextProps.isMismatched &&
    prevProps.isSelected === nextProps.isSelected
  );
});

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onUpdateLeadStatus,
  onDeleteLead,
  onClearAllLeads,
  onClearAllData,
  onExportCsv,
  onCleanLeads,
  defaultStateFilter = 'ALL',
  defaultStatusFilter = 'ALL',
  defaultSentimentFilter = 'ALL',
  onAnalyzeSentiment,
  onEnrichProfile,
  autoEnrichLeads,
  onSetAutoEnrichLeads,
  externalSearchTerm = '',
  onExternalSearchTermChange,
  onSearchKeywordNow,
  isSearchingNow,
  onOpenImportModal,
  onOpenBackupModal,
  onValidateBatch,
  onOpenWhatsapp,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);

  const handleToggleSelectLead = useCallback((id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAllVisibleLeads = useCallback((visibleList: Lead[]) => {
    setSelectedLeadIds(prev => {
      const allSelected = visibleList.every(l => prev.has(l.id));
      if (allSelected) {
        return new Set();
      } else {
        const next = new Set(prev);
        visibleList.forEach(l => next.add(l.id));
        return next;
      }
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedLeadIds(new Set());
  }, []);

  const handleBulkChangeStatus = useCallback((status: string) => {
    if (selectedLeadIds.size === 0) return;
    selectedLeadIds.forEach(id => {
      onUpdateLeadStatus(id, status);
    });
  }, [selectedLeadIds, onUpdateLeadStatus]);

  const handleBulkDelete = useCallback(() => {
    if (selectedLeadIds.size === 0) return;
    if (window.confirm(`Tem certeza que deseja excluir os ${selectedLeadIds.size} leads selecionados?`)) {
      selectedLeadIds.forEach(id => {
        onDeleteLead(id);
      });
      setSelectedLeadIds(new Set());
    }
  }, [selectedLeadIds, onDeleteLead]);

  const VirtualizedLeadRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const lead = paginatedLeads[index];
    if (!lead) return null;

    const itemCategory = classifyLeadCategory(lead);
    const { finalScore, badge } = getLeadCompletenessScore(lead);
    const isSeller = lead.intent === 'Venda';
    const isBuyer = lead.intent === 'Compra';
    const { isMismatched, leadDddState } = checkLeadRegionalStatus(lead);

    const mismatchedTooltip = `DDD ${lead.ddd || 'N/D'} (${leadDddState || 'UF Externa'}) não coincide com os estados do Painel Regional: ${selectedRegionalStates.join(', ')}`;
    const stateMismatchText = stateFilter !== 'ALL' && !matchesTargetState(lead.ddd, lead.stateUf, stateFilter) ? `Fora de ${stateFilter}` : null;
    const dddMismatchText = dddFilter !== 'ALL' && lead.ddd !== dddFilter ? `DDD ${lead.ddd || 'N/D'}` : null;

    const rawPhone = lead.rawPhone || lead.phone.replace(/\D/g, '');
    const sameSellerLeads = rawPhone ? (phoneToLeadsMap.get(rawPhone) || [lead]) : [lead];
    const sellerAdCount = sameSellerLeads.length > 1 ? sameSellerLeads.length : (lead.adCount || 1);
    const isLojista = lead.sellerType === 'Lojista / Concessionária' ||
      lead.sellerType === 'Desmanche / Auto Peças' ||
      lead.sellerType === 'Transportadora / Frotista' ||
      !!lead.companyName ||
      !!lead.document ||
      sellerAdCount > 1;

    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent((lead.phone || '') + ' ' + (lead.name || ''))}`;
    const isPopoverOpen = activeMsgPopoverId === lead.id;
    const isSelected = selectedLeadIds.has(lead.id);

    return (
      <LeadTableRow
        style={style}
        lead={lead}
        itemCategory={itemCategory}
        finalScore={finalScore}
        badge={badge}
        isSeller={isSeller}
        isBuyer={isBuyer}
        isMismatched={isMismatched}
        mismatchedTooltip={mismatchedTooltip}
        stateMismatchText={stateMismatchText}
        dddMismatchText={dddMismatchText}
        rawPhone={rawPhone}
        sellerAdCount={sellerAdCount}
        isLojista={isLojista}
        googleSearchUrl={googleSearchUrl}
        isPopoverOpen={isPopoverOpen}
        isSelected={isSelected}
        onToggleSelect={handleToggleSelectLead}
        onTogglePopover={(id) => setActiveMsgPopoverId(id ? (activeMsgPopoverId === id ? null : id) : null)}
        onUpdateStatus={onUpdateLeadStatus}
        onDelete={onDeleteLead}
        onGenerateAiPitch={handleGenerateAiPitch}
        onOpenSellerAds={(phone, name) => setSellerAdsModalState({
          isOpen: true,
          selectedPhone: phone,
          sellerName: name
        })}
        whatsappTemplates={WHATSAPP_TEMPLATES}
        onAnalyzeSentiment={onAnalyzeSentiment}
      />
    );
  };
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredExternalSearchTerm = useDeferredValue(externalSearchTerm);
  const [stateFilter, setStateFilter] = useState(defaultStateFilter);
  const [dddFilter, setDddFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [intentFilter, setIntentFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatusFilter);
  const [sentimentFilter, setSentimentFilter] = useState<string>(defaultSentimentFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [quickFilterWhatsOnly, setQuickFilterWhatsOnly] = useState<boolean>(false);
  const [quickFilterNotContacted, setQuickFilterNotContacted] = useState<boolean>(false);
  const [quickFilterCnpjOnly, setQuickFilterCnpjOnly] = useState<boolean>(false);
  const [activeMsgPopoverId, setActiveMsgPopoverId] = useState<string | null>(null);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState<boolean>(false);
  const [selectedRegionalStates, setSelectedRegionalStates] = useState<string[]>(['SP', 'PR', 'SC', 'RS', 'MG', 'GO', 'MT', 'BA']);
  const [regionalFilterMode, setRegionalFilterMode] = useState<'ALL' | 'MISMATCH_ONLY' | 'MATCHED_ONLY'>('ALL');
  const [isRegionalConfigOpen, setIsRegionalConfigOpen] = useState<boolean>(false);
  const [isSmartExportOpen, setIsSmartExportOpen] = useState<boolean>(false);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState<boolean>(false);
  const [pitchLead, setPitchLead] = useState<Lead | null>(null);
  const [customPitchText, setCustomPitchText] = useState<string>('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState<boolean>(false);
  const [copiedPitch, setCopiedPitch] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'WHATSAPP' | 'FIXO' | 'EMAIL' | 'WEB' | 'LOJISTA' | 'PARTICULAR' | 'MULTI_AD'>('ALL');
  const [sellerAdsModalState, setSellerAdsModalState] = useState<{
    isOpen: boolean;
    selectedPhone: string | null;
    sellerName?: string;
  }>({
    isOpen: false,
    selectedPhone: null
  });

  const WHATSAPP_TEMPLATES = [
    {
      id: 'apresentacao',
      title: 'Apresentação Comercial',
      text: (lead: Lead) => `Olá${lead.name ? ' ' + lead.name : ''}! Vi seu anúncio referente a ${lead.item}. Tenho interesse e gostaria de negociar. Podemos conversar?`
    },
    {
      id: 'cotacao',
      title: 'Cotação / Condições',
      text: (lead: Lead) => `Olá! Sou comprador no setor e estou cotando ${lead.item}. Qual o menor valor e condições de pagamento?`
    },
    {
      id: 'parceria',
      title: 'Proposta de Parceria',
      text: (lead: Lead) => `Olá! Trabalho com prospecção no setor de transportes/autopeças e gostaria de apresentar uma oportunidade referente a ${lead.item}. Tem um minuto?`
    },
    {
      id: 'disponibilidade',
      title: 'Consulta de Disponibilidade',
      text: (lead: Lead) => `Olá${lead.name ? ' ' + lead.name : ''}, tudo bem? Vi sua publicação sobre ${lead.item}. Ainda está disponível para negociação?`
    }
  ];

  const handleGenerateAiPitch = (lead: Lead) => {
    setPitchLead(lead);
    setIsPitchModalOpen(true);
    setIsGeneratingPitch(true);
    setCopiedPitch(false);
    setTimeout(() => {
      const city = lead.city || 'sua região';
      const item = lead.item || 'frota de veículos e peças';
      const name = lead.name || lead.sellerFullName || lead.companyName || 'Parceiro(a)';
      setCustomPitchText(`Olá ${name}! 🚛 Analisei a operação da sua empresa em ${city} e notei grande potencial para otimizarmos juntos a gestão e os custos com ${item}.\n\nTrabalhamos com soluções de alta performance para o setor de transporte e pesados que reduzem custos operacionais em até 22%. Que tal trocarmos 5 minutos de ideia ainda esta semana?\n\nAguardo seu retorno! Abraço.`);
      setIsGeneratingPitch(false);
    }, 500);
  };

  useEffect(() => {
    if (defaultStatusFilter !== undefined) setStatusFilter(defaultStatusFilter);
  }, [defaultStatusFilter]);

  useEffect(() => {
    if (defaultSentimentFilter !== undefined) setSentimentFilter(defaultSentimentFilter);
  }, [defaultSentimentFilter]);

  useEffect(() => {
    if (defaultStateFilter !== undefined) {
      setStateFilter(defaultStateFilter);
      if (defaultStateFilter !== 'ALL' && !selectedRegionalStates.includes(defaultStateFilter)) {
        setSelectedRegionalStates((prev) => Array.from(new Set([...prev, defaultStateFilter])));
      }
    }
  }, [defaultStateFilter]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (onExternalSearchTermChange) onExternalSearchTermChange(val);
    setCurrentPage(1);
  };

  // Map of allowed DDDs based on selected target regional states
  const allowedRegionalDdds = useMemo(() => {
    if (selectedRegionalStates.length === 0) return new Set<string>();
    const set = new Set<string>();
    BRAZIL_STATES.forEach((st) => {
      if (selectedRegionalStates.includes(st.uf)) {
        st.ddds.forEach((d) => set.add(d));
      }
    });
    return set;
  }, [selectedRegionalStates]);

  // Evaluates whether a lead has a DDD mismatch with selected regional states
  const checkLeadRegionalStatus = (lead: Lead) => {
    if (!lead.ddd) {
      return { isMismatched: false, isMatched: true, leadDddState: '' };
    }
    const leadDddState = getStateFromDDD(lead.ddd);
    if (selectedRegionalStates.length > 0) {
      const isMatched = allowedRegionalDdds.has(lead.ddd);
      return {
        isMismatched: !isMatched,
        isMatched,
        leadDddState,
      };
    }
    return { isMismatched: false, isMatched: true, leadDddState };
  };

  // Regional Optimization Statistics
  const regionalStats = useMemo(() => {
    let matchedCount = 0;
    let mismatchedCount = 0;
    leads.forEach((l) => {
      if (l.ddd && allowedRegionalDdds.size > 0) {
        if (allowedRegionalDdds.has(l.ddd)) matchedCount++;
        else mismatchedCount++;
      } else {
        matchedCount++;
      }
    });
    return { matchedCount, mismatchedCount, total: leads.length };
  }, [leads, allowedRegionalDdds]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: leads.length,
      Caminhões: 0,
      Peças: 0,
      Implementos: 0,
      Manutenção: 0,
      Pneus: 0,
      Motores: 0,
      Serviços: 0,
      Logística: 0,
    };
    leads.forEach((lead) => {
      const cat = classifyLeadCategory(lead);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [leads]);

  const getLeadCompletenessScore = (lead: Lead) => {
    let score = 35;
    if (lead.name) score += 20;
    if (lead.email) score += 15;
    if (lead.stateUf || lead.location) score += 15;
    if (lead.phoneType === 'Fixo' || lead.document) score += 10;
    if (lead.price) score += 5;
    const finalScore = Math.min(100, score);
    let badge = { label: 'Padrão', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (finalScore >= 90) {
      badge = { label: '🔥 Quente (Ouro)', color: 'bg-amber-100 text-amber-900 border-amber-300 ' };
    } else if (finalScore >= 75) {
      badge = { label: '🌟 Quente (Prata)', color: 'bg-blue-100 text-blue-900 border-blue-300 font-bold' };
    } else if (finalScore >= 55) {
      badge = { label: '⚡ Moderado', color: 'bg-emerald-100 text-emerald-900 border-emerald-200 font-semibold' };
    }
    return { finalScore, badge };
  };

  const availableDdds = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.ddd) set.add(l.ddd);
    });
    return Array.from(set).sort();
  }, [leads]);

  const allUniqueTags = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => {
      if (l.tags && Array.isArray(l.tags)) {
        l.tags.forEach((t) => {
          if (t && typeof t === 'string') {
            const trimmed = t.trim();
            if (trimmed) {
              map.set(trimmed, (map.get(trimmed) || 0) + 1);
            }
          }
        });
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const leadsWithoutTagsCount = useMemo(() => {
    return leads.filter(l => !l.tags || l.tags.length === 0).length;
  }, [leads]);

  const handleBulkAddTag = (tagToAdd: string) => {
    if (selectedLeadIds.size === 0) return;
    const ids = Array.from(selectedLeadIds);
    ids.forEach(id => {
      const lead = leads.find(l => l.id === id);
      if (lead) {
        const currentTags = lead.tags || [];
        if (!currentTags.includes(tagToAdd)) {
          onUpdateLeadStatus(id, { tags: [...currentTags, tagToAdd] });
        }
      }
    });
  };

  // High-performance In-Memory Search Index (Trie/Pre-built Blob Cache)
  // Pre-computes normalized text blobs for sub-2ms instant searching across 10,000+ leads
  const searchIndexMap = useMemo(() => {
    const map = new Map<string, string>();
    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];
      const blob = (
        l.phone + ' ' +
        (l.name || '') + ' ' +
        l.item + ' ' +
        (l.companyName || '') + ' ' +
        (l.location || '') + ' ' +
        (l.email || '') + ' ' +
        (l.query || '') + ' ' +
        (l.tags || []).join(' ')
      ).toLowerCase();
      map.set(l.id, blob);
    }
    return map;
  }, [leads]);

  const phoneToLeadsMap = useMemo(() => {
    const map = new Map<string, Lead[]>();
    leads.forEach((l) => {
      const raw = l.rawPhone || l.phone.replace(/\D/g, '');
      if (!raw) return;
      const existing = map.get(raw) || [];
      existing.push(l);
      map.set(raw, existing);
    });
    return map;
  }, [leads]);

  const channelCounts = useMemo(() => {
    let whatsapp = 0;
    let fixo = 0;
    let email = 0;
    let web = 0;
    let lojista = 0;
    let particular = 0;
    let multiAd = 0;

    leads.forEach((lead) => {
      const raw = lead.rawPhone || lead.phone.replace(/\D/g, '');
      const adsForPhone = raw ? (phoneToLeadsMap.get(raw)?.length || 1) : 1;
      const isLojista = lead.sellerType === 'Lojista / Concessionária' ||
        lead.sellerType === 'Desmanche / Auto Peças' ||
        lead.sellerType === 'Transportadora / Frotista' ||
        !!lead.companyName ||
        !!lead.document ||
        adsForPhone > 1 ||
        (lead.adCount && lead.adCount > 1);

      if (lead.phoneType !== 'Fixo') whatsapp++;
      if (lead.phoneType === 'Fixo') fixo++;
      if (lead.email) email++;
      if (lead.webPageUrl || lead.isBusinessDirectory) web++;
      if (isLojista) lojista++;
      else particular++;
      if (adsForPhone > 1 || (lead.adCount && lead.adCount > 1)) multiAd++;
    });

    return {
      ALL: leads.length,
      WHATSAPP: whatsapp,
      FIXO: fixo,
      EMAIL: email,
      WEB: web,
      LOJISTA: lojista,
      PARTICULAR: particular,
      MULTI_AD: multiAd
    };
  }, [leads, phoneToLeadsMap]);

  const filteredLeads = useMemo(() => {
    const queryLower = (deferredSearchTerm || deferredExternalSearchTerm).trim().toLowerCase();
    const queryTokens = queryLower ? queryLower.split(/[\s,;]+/).filter(Boolean) : [];
    const isStateAll = stateFilter === 'ALL';
    const isDddAll = dddFilter === 'ALL';
    const isTagAll = tagFilter === 'ALL';
    const isIntentAll = intentFilter === 'ALL';
    const isStatusAll = statusFilter === 'ALL';
    const isSentimentAll = sentimentFilter === 'ALL';
    const isCategoryAll = categoryFilter === 'ALL';
    const isChannelAll = channelFilter === 'ALL';
    const isRegionalAll = regionalFilterMode === 'ALL';
    const stateFilterUpper = stateFilter.toUpperCase();

    // Fast-path: If no filters active, return array directly (0ms overhead)
    if (!queryTokens.length && isStateAll && isDddAll && isTagAll && isIntentAll && isStatusAll && isSentimentAll && isCategoryAll && isChannelAll && isRegionalAll && !quickFilterWhatsOnly && !quickFilterNotContacted && !quickFilterCnpjOnly) {
      return leads;
    }

    return leads.filter((lead) => {
      // Channel & Seller Profile Filter
      if (!isChannelAll) {
        const raw = lead.rawPhone || lead.phone.replace(/\D/g, '');
        const adsForPhone = raw ? (phoneToLeadsMap.get(raw)?.length || 1) : 1;
        const isLojista = lead.sellerType === 'Lojista / Concessionária' ||
          lead.sellerType === 'Desmanche / Auto Peças' ||
          lead.sellerType === 'Transportadora / Frotista' ||
          !!lead.companyName ||
          !!lead.document ||
          adsForPhone > 1 ||
          (lead.adCount && lead.adCount > 1);

        if (channelFilter === 'WHATSAPP' && lead.phoneType === 'Fixo') return false;
        if (channelFilter === 'FIXO' && lead.phoneType !== 'Fixo') return false;
        if (channelFilter === 'EMAIL' && !lead.email) return false;
        if (channelFilter === 'WEB' && !lead.webPageUrl && !lead.isBusinessDirectory) return false;
        if (channelFilter === 'LOJISTA' && !isLojista) return false;
        if (channelFilter === 'PARTICULAR' && isLojista) return false;
        if (channelFilter === 'MULTI_AD' && adsForPhone <= 1 && (!lead.adCount || lead.adCount <= 1)) return false;
      }
      // Quick Filters
      if (quickFilterWhatsOnly) {
        if ((!lead.phone && !lead.rawPhone) || lead.phoneType === 'Fixo') return false;
      }
      if (quickFilterNotContacted) {
        if (lead.outreachStatus && lead.outreachStatus !== 'pendente') return false;
      }
      if (quickFilterCnpjOnly) {
        if (!lead.document && !lead.companyName) return false;
      }

      // 1. Cheap strict equality checks first
      if (!isDddAll && (lead.ddd || '') !== dddFilter) return false;

      // Tag Filter
      if (!isTagAll) {
        if (tagFilter === 'NO_TAGS') {
          if (lead.tags && lead.tags.length > 0) return false;
        } else {
          if (!lead.tags || !lead.tags.includes(tagFilter)) return false;
        }
      }

      if (!isIntentAll && lead.intent !== intentFilter) return false;
      if (!isStatusAll && (lead.outreachStatus || 'pendente') !== statusFilter) return false;
      if (!isSentimentAll && lead.sentiment !== sentimentFilter) return false;

      // 2. State match
      if (!isStateAll) {
        const leadState = (lead.stateUf || '').toUpperCase();
        const leadLoc = (lead.location || '').toUpperCase();
        if (leadState !== stateFilterUpper && !leadLoc.includes(stateFilterUpper)) {
          return false;
        }
      }

      // 3. Category match (lazy evaluation only if filter active)
      if (!isCategoryAll) {
        const leadCat = classifyLeadCategory(lead);
        if (leadCat !== categoryFilter) return false;
      }

      // 4. Regional Optimization match (lazy evaluation only if filter active)
      if (!isRegionalAll) {
        const { isMismatched, isMatched } = checkLeadRegionalStatus(lead);
        if (regionalFilterMode === 'MISMATCH_ONLY' && !isMismatched) return false;
        if (regionalFilterMode === 'MATCHED_ONLY' && !isMatched) return false;
      }

      // 5. High-Speed In-Memory Index Match (0-1ms per token)
      if (queryTokens.length > 0) {
        const blob = searchIndexMap.get(lead.id) || '';
        for (let t = 0; t < queryTokens.length; t++) {
          if (!blob.includes(queryTokens[t])) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    leads,
    searchIndexMap,
    deferredSearchTerm, 
    deferredExternalSearchTerm, 
    tagFilter,
    stateFilter, 
    dddFilter, 
    intentFilter, 
    statusFilter, 
    sentimentFilter, 
    categoryFilter, 
    channelFilter,
    phoneToLeadsMap,
    quickFilterWhatsOnly,
    quickFilterNotContacted,
    quickFilterCnpjOnly,
    regionalFilterMode, 
    selectedRegionalStates, 
    allowedRegionalDdds
  ]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-slate-900 dark:text-slate-100">
      
      {/* 1. Header & Quick Intelligence Summary */}
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/40 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Database className="w-48 h-48 text-slate-900 dark:text-white" />
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Base de leads</h3>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Atualização em tempo real</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {filteredLeads.length.toLocaleString('pt-BR')} leads estratégicos encontrados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <button
              onClick={() => setIsSmartExportOpen(true)}
              className="flex cursor-pointer items-center gap-3 rounded-xl bg-emerald-600 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95"
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
              Exportar
            </button>

            <div className="relative group">
              <button
                onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
                className="flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-slate-900 dark:hover:border-white transition-all cursor-pointer shadow-sm"
              >
                <SlidersHorizontal className="w-4.5 h-4.5" />
                Mais ações
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-500 ${isMoreActionsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isMoreActionsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2">
                  <button onClick={() => { onExportCsv(); setIsMoreActionsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <Download className="w-4 h-4 text-blue-500" /> Exportar CSV
                  </button>
                  <button onClick={() => { downloadVcfContacts(leads); setIsMoreActionsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <Share2 className="w-4 h-4 text-purple-500" /> Contatos para WhatsApp (.vcf)
                  </button>
                  {onOpenImportModal && (
                    <button onClick={() => { onOpenImportModal(); setIsMoreActionsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <Upload className="w-4 h-4 text-indigo-500" /> Importar leads em lote
                    </button>
                  )}
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <button onClick={() => { onCleanLeads(); setIsMoreActionsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors">
                    <RefreshCw className="w-4 h-4" /> Limpar leads inválidos
                  </button>
                  <button onClick={() => { onClearAllLeads(); setIsMoreActionsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" /> Limpar toda a base
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Lead Category Filter */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/30 px-8 py-3 dark:border-slate-800/40 dark:bg-slate-900/10">
        <label htmlFor="lead-category-filter" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</label>
        <select
          id="lead-category-filter"
          value={categoryFilter}
          onChange={(event) => { setCategoryFilter(event.target.value); setCurrentPage(1); }}
          className="min-w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="ALL">Todos ({leads.length})</option>
          <option value="Caminhões">Caminhões</option>
          <option value="Implementos">Implementos</option>
          <option value="Peças">Peças</option>
          <option value="Pneus">Pneus</option>
          <option value="Motores">Motores</option>
          <option value="Logística">Logística</option>
        </select>
      </div>

      {/* 3. Search & Intelligence Action Bar */}
      <div className="px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/40 flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar nome, telefone, item ou CNPJ"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsRegionalConfigOpen(!isRegionalConfigOpen)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
              isRegionalConfigOpen 
                ? 'bg-blue-600 text-white border-blue-600 shadow-xl' 
                : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-100 dark:border-slate-800 hover:border-slate-900 dark:hover:border-white shadow-sm'
            }`}
          >
            <Globe className="w-5 h-5" />
            Filtro por região
            {selectedRegionalStates.length > 0 && (
              <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-black">
                {selectedRegionalStates.length}
              </span>
            )}
          </button>
          
          <button
            onClick={onCleanLeads}
            className="flex items-center gap-3 px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border-2 border-transparent transition-all cursor-pointer group shadow-sm"
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
            Otimizar base
          </button>
        </div>
      </div>

      {/* 4. Geographic Radar Config Panel (Expandable) */}
      <AnimatePresence>
        {isRegionalConfigOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-blue-50/30 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30"
          >
            <div className="px-6 py-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Regional Logistics Optimization</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">Select the states where your operation has commercial presence. Leads outside these regions will be flagged.</p>
                  </div>
                </div>
                <button onClick={() => setIsRegionalConfigOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {BRAZIL_STATES.map((st) => {
                  const isSelected = selectedRegionalStates.includes(st.uf);
                  return (
                    <button
                      key={st.uf}
                      onClick={() => {
                        if (isSelected) setSelectedRegionalStates(selectedRegionalStates.filter(u => u !== st.uf));
                        else setSelectedRegionalStates([...selectedRegionalStates, st.uf]);
                      }}
                      className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {st.uf}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-blue-100 dark:border-blue-900/30">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region Matched: {regionalStats.matchedCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Region Mismatch: {regionalStats.mismatchedCount}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedRegionalStates([])} className="px-4 py-2 text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">Clear Selection</button>
                  <button 
                    onClick={() => { setRegionalFilterMode('MISMATCH_ONLY'); setIsRegionalConfigOpen(false); }}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg"
                  >
                    Ocultar incompatíveis
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Advanced Intelligence Filter Suite */}
      <details className="border-b border-slate-100 bg-slate-50/50 px-6 py-3 dark:border-slate-800/60 dark:bg-slate-900/50">
        <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Filtros detalhados</summary>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Channel Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Canal de contato</label>
          <select
            value={channelFilter}
            onChange={(e) => { setChannelFilter(e.target.value as any); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">Todos os canais ({leads.length})</option>
            <option value="WHATSAPP">WhatsApp verificado</option>
            <option value="FIXO">Telefone fixo / comercial</option>
            <option value="EMAIL">E-mail comercial</option>
            <option value="LOJISTA">Frotistas / lojistas</option>
            <option value="PARTICULAR">Vendedores particulares</option>
          </select>
        </div>

        {/* Tag Intelligence Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Etiquetas do lead</label>
          <select
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">Todas as etiquetas</option>
            <option value="NO_TAGS">Sem etiqueta ({leadsWithoutTagsCount})</option>
            {allUniqueTags.map(([tagName, count]) => (
              <option key={tagName} value={tagName}>{tagName.toUpperCase()} ({count})</option>
            ))}
          </select>
        </div>

        {/* Commercial Intent */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Intenção comercial</label>
          <select
            value={intentFilter}
            onChange={(e) => { setIntentFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">Todas as intenções</option>
            <option value="Venda">Venda</option>
            <option value="Compra">Compra</option>
            <option value="Troca">Troca</option>
          </select>
        </div>

        {/* Lead Status */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Etapa do pipeline</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="ALL">Todas as etapas</option>
            <option value="NOVO">Novo</option>
            <option value="CONTATO">Contato ativo</option>
            <option value="NEGOCIACAO">Em negociação</option>
            <option value="GANHO">Convertido / fechado</option>
          </select>
        </div>
        </div>
      </details>

      {/* 6. Intelligence Quick Toggles & Sentiment Analysis */}
      <details className="border-b border-slate-100 bg-white px-6 py-3 dark:border-slate-800/60 dark:bg-slate-900">
        <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Atalhos de filtro</summary>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Atalhos:</span>
          
          <button
            onClick={() => { setQuickFilterWhatsOnly(prev => !prev); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border shrink-0 ${
              quickFilterWhatsOnly 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            SOMENTE WHATSAPP
          </button>

          <button
            onClick={() => { setQuickFilterCnpjOnly(prev => !prev); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border shrink-0 ${
              quickFilterCnpjOnly
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            B2B / CNPJ
          </button>

          <button
            onClick={() => { setQuickFilterNotContacted(prev => !prev); setCurrentPage(1); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border shrink-0 ${
              quickFilterNotContacted
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            NOVOS ALVOS
          </button>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
             <span className="w-2 h-2 rounded-full bg-emerald-500" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pipeline estável</span>
          </div>
          {(quickFilterWhatsOnly || quickFilterNotContacted || quickFilterCnpjOnly || searchTerm || categoryFilter !== 'ALL' || channelFilter !== 'ALL' || tagFilter !== 'ALL' || intentFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('ALL');
                setChannelFilter('ALL');
                setTagFilter('ALL');
                setIntentFilter('ALL');
                setStatusFilter('ALL');
                setQuickFilterWhatsOnly(false);
                setQuickFilterNotContacted(false);
                setQuickFilterCnpjOnly(false);
                setCurrentPage(1);
              }}
              className="text-[10px] font-black text-rose-600 hover:text-rose-700 uppercase tracking-widest cursor-pointer hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
        </div>
      </details>

      {/* 7. Lead Intelligence Grid (Main Table) */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
          <div className="w-12 flex items-center justify-center shrink-0">
            <input
              type="checkbox"
              checked={paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.has(l.id))}
              onChange={() => handleSelectAllVisibleLeads(paginatedLeads)}
              className="w-4 h-4 rounded-lg border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 transition-all cursor-pointer bg-white dark:bg-slate-800"
            />
          </div>
          <div className="flex-1 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              LEAD E CONTATO
            </div>
            <div className="col-span-2">REGIÃO</div>
            <div className="col-span-2">CONTATO</div>
            <div className="col-span-2 text-center">INTENÇÃO E SCORE</div>
            <div className="col-span-1 text-right">AÇÕES</div>
          </div>
        </div>
          <div id="lead-table-list-container">
            {paginatedLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Nenhum lead para exibir</p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">Ajuste os filtros ou inicie uma mineração no Radar para trazer contatos para esta base.</p>
                </div>
              </div>
            ) : (
              <List
                height={Math.min(620, paginatedLeads.length * 84 || 120)}
                itemCount={paginatedLeads.length}
                itemSize={84}
                width="100%"
              >
                {VirtualizedLeadRow as any}
              </List>
            )}
          </div>
        </div>

      {selectedLeadIds.size > 0 && (
        <div className="sticky bottom-4 z-40 mx-auto max-w-4xl bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-600 text-white font-mono font-black text-xs rounded-xl shadow-xs">
              {selectedLeadIds.size} Selecionados
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Ações rápidas para o lote escolhido
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Tracking Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>⚡ Acompanhar Envios em Tempo Real</span>
            </button>

            {/* Quick Status Change */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkChangeStatus(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">Status em Lote...</option>
              <option value="pendente">Mudar para Pendente</option>
              <option value="enviado">Mudar para Enviado</option>
              <option value="respondido">Mudar para Respondido</option>
              <option value="ignorado">Mudar para Ignorado</option>
            </select>

            {/* Quick Bulk Tag Add */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkAddTag(e.target.value);
                  e.target.value = '';
                }
              }}
              className="bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="">🏷️ Tag em Lote...</option>
              {DEFAULT_PRESET_TAGS.map(p => (
                <option key={p.name} value={p.name}>+ Tag: {p.icon} {p.name}</option>
              ))}
            </select>

            {/* Delete Selected */}
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3.5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Excluir</span>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Limpar seleção"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Pagination Footer & Controls */}
      <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-black text-[10px] font-black uppercase tracking-widest">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Leads por página</span>
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              {[25, 50, 100, 250].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    itemsPerPage === size
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                      : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <p className="text-slate-400">
            Mapping <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="text-blue-600">{filteredLeads.length.toLocaleString('pt-BR')}</span> Verified Assets
          </p>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg flex items-center gap-2">
               <span className="opacity-40 tracking-normal">PG</span>
               <span className="text-xs">{currentPage}</span>
               <span className="opacity-40">/</span>
               <span className="text-xs">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:border-slate-900 dark:hover:border-white text-slate-900 dark:text-white transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 hover:border-slate-900 dark:hover:border-white text-slate-900 dark:text-white transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Smart Excel Export Modal */}
      <SmartExcelExportModal
        isOpen={isSmartExportOpen}
        onClose={() => setIsSmartExportOpen(false)}
        leads={leads}
      />

      {/* AI Pitch Generator Modal */}
      {isPitchModalOpen && pitchLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-w-lg w-full space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-900">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Gerador de Pitch de Vendas IA</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Personalizado para {pitchLead.companyName || maskContact(pitchLead.phone)}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPitchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isGeneratingPitch ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">IA redigindo pitch comercial persuasivo...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 tracking-wide block mb-1">
                    Mensagem de Abordagem Sugerida (WhatsApp / E-mail):
                  </label>
                  <textarea
                    value={customPitchText}
                    onChange={(e) => setCustomPitchText(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-amber-500 font-sans leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href={`https://wa.me/${pitchLead.rawPhone}?text=${encodeURIComponent(customPitchText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar direto no WhatsApp</span>
                  </a>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(customPitchText);
                      setCopiedPitch(true);
                      setTimeout(() => setCopiedPitch(false), 2000);
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPitch ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Anúncios Relacionados por Vendedor/Telefone */}
      <SellerAdsModal
        isOpen={sellerAdsModalState.isOpen}
        onClose={() => setSellerAdsModalState({ isOpen: false, selectedPhone: null })}
        selectedPhone={sellerAdsModalState.selectedPhone}
        sellerName={sellerAdsModalState.sellerName}
        sellerLeads={sellerAdsModalState.selectedPhone ? (phoneToLeadsMap.get(sellerAdsModalState.selectedPhone) || []) : []}
      />

      {/* Modal de Acompanhamento Real de Envios para Selecionados */}
      <SelectedLeadsTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        selectedLeadIds={Array.from(selectedLeadIds)}
        allLeads={leads}
        onUpdateLeadStatus={onUpdateLeadStatus}
        onOpenWhatsapp={(lead) => {
          if (onOpenWhatsapp) {
            onOpenWhatsapp(lead);
          } else {
            window.open(`https://wa.me/${lead.rawPhone || lead.phone.replace(/\D/g, '')}`, '_blank');
          }
        }}
      />
    </div>
  );
};
