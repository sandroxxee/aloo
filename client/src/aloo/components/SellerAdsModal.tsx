import { maskContact } from '../utils/textProcessor';
import React from 'react';
import { 
  X, 
  Store, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Layers, 
  ExternalLink, 
  MessageSquare, 
  Search, 
  Globe, 
  Share2,
  Building2,
  Tag
} from 'lucide-react';
import { Lead } from '../types';

interface SellerAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhone: string | null;
  sellerName?: string;
  sellerLeads: Lead[];
}

export const SellerAdsModal: React.FC<SellerAdsModalProps> = ({
  isOpen,
  onClose,
  selectedPhone,
  sellerName,
  sellerLeads
}) => {
  if (!isOpen || !selectedPhone || sellerLeads.length === 0) return null;

  const firstLead = sellerLeads[0];
  const isLojista = sellerLeads.length > 1 || 
    firstLead.sellerType === 'Lojista / Concessionária' || 
    firstLead.sellerType === 'Desmanche / Auto Peças' || 
    firstLead.sellerType === 'Transportadora / Frotista' ||
    !!firstLead.companyName || 
    !!firstLead.document;

  const displayName = sellerName || firstLead.name || firstLead.companyName || firstLead.sellerFullName || 'Anunciante Sem Nome';
  const phoneFormatted = firstLead.phone || selectedPhone;
  const rawPhone = firstLead.rawPhone || selectedPhone.replace(/\D/g, '');

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(phoneFormatted + ' ' + (displayName !== 'Anunciante Sem Nome' ? displayName : ''))}`;
  const instagramSearchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(phoneFormatted.replace(/\D/g, ''))}`;
  const facebookSearchUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(phoneFormatted)}`;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold border shrink-0 ${
              isLojista 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
            }`}>
              {isLojista ? <Store className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight">{displayName}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                  isLojista 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {isLojista ? '🏪 Lojista / Revenda' : '👤 Vendedor Particular'}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 flex items-center gap-2 mt-0.5">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span className="font-mono font-bold">{phoneFormatted}</span>
                <span>•</span>
                <span>{sellerLeads.length} anúncio(s) cadastrado(s)</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Social & Intelligence Quick Links Bar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
            🔎 Rastrear Anunciante:
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`https://wa.me/${rawPhone}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Direct</span>
            </a>

            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 font-bold rounded-lg border border-slate-300 dark:border-slate-600 text-xs flex items-center gap-1 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <span>Google</span>
            </a>

            <a
              href={facebookSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </a>

            <a
              href={instagramSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </a>
          </div>
        </div>

        {/* Content: List of all ads by this same phone number / seller */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-slate-800 dark:text-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Todos os Anúncios Localizados ({sellerLeads.length})</span>
            </h3>
            {isLojista && (
              <span className="text-sm text-amber-600 dark:text-amber-400 font-bold">
                💡 Este número possui múltiplos veículos/peças anunciados (Perfil Lojista)
              </span>
            )}
          </div>

          <div className="space-y-3">
            {sellerLeads.map((lead, idx) => (
              <div 
                key={lead.id || idx}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300  text-xs rounded-md">
                        #{idx + 1} • {lead.intent || 'Venda'}
                      </span>
                      {lead.category && (
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-md">
                          {lead.category}
                        </span>
                      )}
                      {lead.adDate && (
                        <span className="text-xs text-slate-400 font-medium">
                          {lead.adDate}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm  text-slate-900 dark:text-white mt-1">
                      {lead.item}
                    </h4>
                  </div>

                  {lead.price && (
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {lead.price}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location & Details */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.location || lead.city || lead.stateUf || 'Brasil'}</span>
                  </span>

                  {lead.email && (
                    <span className="flex items-center gap-1 font-mono text-sm text-blue-600 dark:text-blue-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{maskContact(lead.email)}</span>
                    </span>
                  )}

                  {lead.companyName && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{lead.companyName}</span>
                    </span>
                  )}
                </div>

                {lead.snippetContext && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic line-clamp-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    "{lead.snippetContext}"
                  </p>
                )}

                {lead.webPageUrl && (
                  <div className="pt-1">
                    <a
                      href={lead.webPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Anúncio Original / Página do Item</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            📊 Análise automática de anúncios por número de telefone.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
