import { maskContact } from '../utils/textProcessor';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Play,
  Pause,
  Square,
  Filter,
  Users,
  Settings,
  Eye,
  Copy,
  RotateCcw,
  FileText,
  Download,
  ShieldCheck,
  AlertCircle,
  Zap,
  Check,
  Search,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Lead } from '../types';

interface EmailDispatcherProps {
  leads: Lead[];
  onUpdateLeadStatus?: (leadId: string, status: Lead['outreachStatus']) => void;
  onAddLog?: (log: any) => void;
}

interface DispatchLog {
  id: string;
  timestamp: string;
  recipientEmail: string;
  leadName: string;
  subject: string;
  status: 'SUCCESS' | 'ERROR' | 'SENDING';
  details?: string;
}

// B2B Email Templates
const EMAIL_TEMPLATES = [
  {
    id: 'prospeccao_b2b_direta',
    name: '🎯 Prospecção B2B Direta (Alta Conversão)',
    subject: '{Olá|Oi|Prezado(a)} {nome} - Oportunidade comercial para {empresa}',
    body: `{Olá|Oi|Prezado(a)} {nome}, tudo bem?

Encontrei o e-mail da {empresa} em {cidade} durante nossas varreduras de mercado e vi que vocês atuam no segmento de {item}.

Temos soluções voltadas para expansão de vendas e prospecção direta que geram resultados imediatos para empresas na região de {cidade}/{uf}.

{Gostaria de agendar 5 minutos para uma breve apresentação?|Você teria disponibilidade para conversarmos nesta semana?|Podemos bater um papo rápido pelo WhatsApp?}

Se preferir, meu contato direto de WhatsApp é o mesmo deste remetente.

Atenciosamente,
{empresa_remetente}`
  },
  {
    id: 'apresentacao_comercial',
    name: '💼 Apresentação Institucional & Catalógo',
    subject: 'Apresentação Institucional para {empresa} ({cidade})',
    body: `{Prezado(a)|Olá} time da {empresa},

Espero que estejam tendo uma excelente semana!

Somos especializados no fornecimento e intermediação de {item} para lojistas e empresas no estado de {uf}.

Gostaríamos de apresentar nosso portfólio completo com condições exclusivas de faturamento e pronta entrega para a cidade de {cidade}.

{Posso enviar nosso catálogo em PDF por aqui?|Qual o melhor horário para ligar para vocês?|Vocês têm interesse em receber nossa tabela com preços de atacado?}

Aguardamos seu retorno.

Atenciosamente,
Equipe Comercial`
  },
  {
    id: 'followup_reuniao',
    name: '⏰ Follow-up Rápido (Reativação de Contato)',
    subject: 'Parceria Comercial com {empresa} em {cidade}',
    body: `{Olá|Oi} {nome},

Estou fazendo um acompanhamento dos contatos comerciais em {cidade} e gostaria de saber se vocês da {empresa} ainda têm demanda para {item}.

Conseguimos condições especiais de pagamento e frete bonificado para novos parceiros na região.

{Teria 3 minutos hoje para alinhar detalhes?|Qual e-mail posso enviar nossa proposta formal?}

Um abraço,
Atendimento Comercial`
  }
];

export const EmailDispatcher: React.FC<EmailDispatcherProps> = ({
  leads,
  onUpdateLeadStatus,
  onAddLog
}) => {
  // Tabs: 'composer' | 'leads_selection' | 'settings' | 'logs'
  const [activeSubTab, setActiveSubTab] = useState<'composer' | 'leads_selection' | 'settings' | 'logs'>('composer');

  // Provider Settings
  const [senderName, setSenderName] = useState(() => localStorage.getItem('email_sender_name') || 'Comercial Asset Sync');
  const [senderEmail, setSenderEmail] = useState(() => localStorage.getItem('email_sender_email') || 'comercial@suaempresa.com.br');
  const [replyToEmail, setReplyToEmail] = useState(() => localStorage.getItem('email_reply_to') || '');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('email_webhook_url') || '');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('email_api_key') || '');
  const [sendDelaySeconds, setSendDelaySeconds] = useState<number>(() => Number(localStorage.getItem('email_send_delay')) || 10);
  const [dailyCap, setDailyCap] = useState<number>(() => Number(localStorage.getItem('email_daily_cap')) || 100);

  // Template State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('prospeccao_b2b_direta');
  const [subjectText, setSubjectText] = useState(EMAIL_TEMPLATES[0].subject);
  const [bodyText, setBodyText] = useState(EMAIL_TEMPLATES[0].body);
  const [emailMode, setEmailMode] = useState<'plain' | 'html'>('plain');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Lead Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [onlyValidEmailFilter, setOnlyValidEmailFilter] = useState(true);

  // Execution & Progress State
  const [isDispatching, setIsDispatching] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, errors: 0 });

  const isStopRequestedRef = useRef(false);
  const isPausedRef = useRef(false);

  // Filtered Leads
  const leadsWithEmail = useMemo(() => {
    return leads.filter(l => {
      const hasMail = Boolean(l.email && l.email.includes('@'));
      if (onlyValidEmailFilter && !hasMail) return false;
      
      if (cityFilter !== 'ALL' && (l.city || l.location) !== cityFilter) return false;

      if (searchTerm) {
        const tokens = searchTerm.toLowerCase().split(/[\s,;]+/).filter(Boolean);
        if (tokens.length === 0) return true;
        
        // Lead must match ALL tokens to be included
        return tokens.every(q => {
          const nameMatch = l.name?.toLowerCase().includes(q) || l.companyName?.toLowerCase().includes(q);
          const emailMatch = l.email?.toLowerCase().includes(q);
          const cityMatch = l.city?.toLowerCase().includes(q);
          const itemMatch = l.item?.toLowerCase().includes(q);
          return Boolean(nameMatch || emailMatch || cityMatch || itemMatch);
        });
      }
      return true;
    });
  }, [leads, onlyValidEmailFilter, cityFilter, searchTerm]);

  // Unique cities dropdown options
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.city) set.add(l.city);
      else if (l.location) set.add(l.location);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Auto Select Leads with Email on mount or when filtered
  useEffect(() => {
    const initialIds = new Set<string>();
    leads.forEach(l => {
      if (l.email && l.email.includes('@')) {
        initialIds.add(l.id);
      }
    });
    setSelectedLeadIds(initialIds);
  }, [leads]);

  // Save Settings
  useEffect(() => {
    localStorage.setItem('email_sender_name', senderName);
    localStorage.setItem('email_sender_email', senderEmail);
    localStorage.setItem('email_reply_to', replyToEmail);
    localStorage.setItem('email_webhook_url', webhookUrl);
    localStorage.setItem('email_api_key', apiKey);
    localStorage.setItem('email_send_delay', String(sendDelaySeconds));
    localStorage.setItem('email_daily_cap', String(dailyCap));
  }, [senderName, senderEmail, replyToEmail, webhookUrl, apiKey, sendDelaySeconds, dailyCap]);

  // Helper to parse Spintax {A|B|C}
  const parseSpintax = (text: string): string => {
    return text.replace(/\{([^{}]+)\}/g, (_, choices) => {
      const options = choices.split('|');
      return options[Math.floor(Math.random() * options.length)].trim();
    });
  };

  // Helper to replace placeholders
  const renderLeadEmail = (rawTemplate: string, lead: Lead): string => {
    let result = parseSpintax(rawTemplate);
    result = result.replace(/\{nome\}/gi, lead.name || lead.companyName || 'Cliente');
    result = result.replace(/\{empresa\}/gi, lead.companyName || lead.name || 'Sua Empresa');
    result = result.replace(/\{cidade\}/gi, lead.city || lead.location || 'sua região');
    result = result.replace(/\{uf\}/gi, lead.stateUf || '');
    result = result.replace(/\{item\}/gi, lead.item || 'produtos e serviços');
    result = result.replace(/\{telefone\}/gi, lead.phone || lead.rawPhone || '');
    result = result.replace(/\{empresa_remetente\}/gi, senderName || 'Nossa Empresa');
    return result;
  };

  const safeLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    if (!onAddLog) return;
    try {
      onAddLog({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        message,
        type
      });
    } catch (e) {
      (onAddLog as any)(message);
    }
  };

  // Sample lead for live preview
  const sampleLead = useMemo<Lead>(() => {
    const validLead = leads.find(l => l.email && l.email.includes('@'));
    if (validLead) return validLead;
    return {
      id: 'preview_sample',
      name: 'Carlos Oliveira',
      companyName: 'Transportes & Logística Silva',
      email: 'carlos.comercial@transportessilva.com.br',
      city: 'Campinas',
      stateUf: 'SP',
      item: 'Caminhões e Frotas',
      phone: '(19) 99823-4411',
      rawPhone: '19998234411',
      ddd: '19',
      phoneType: 'Celular',
      intent: 'Venda',
      sellerType: 'Lojista / Concessionária',
      query: 'Caminhões',
      source: 'Automático',
      createdAt: new Date().toISOString()
    };
  }, [leads]);

  const previewSubject = useMemo(() => renderLeadEmail(subjectText, sampleLead), [subjectText, sampleLead]);
  const previewBody = useMemo(() => renderLeadEmail(bodyText, sampleLead), [bodyText, sampleLead]);

  // Toggle selection
  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const next = new Set<string>();
    leadsWithEmail.forEach(l => next.add(l.id));
    setSelectedLeadIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedLeadIds(new Set());
  };

  // Template change handler
  const handleSelectTemplate = (templateId: string) => {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setSelectedTemplateId(templateId);
      setSubjectText(tpl.subject);
      setBodyText(tpl.body);
    }
  };

  // Generate AI Email Copy using Gemini
  const handleGenerateAiCopy = async () => {
    setIsGeneratingAi(true);
    try {
      const response = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: sampleLead.item || 'Vendas B2B e Prospecção',
          targetAudience: 'Empresários, Gerentes de Compras e Frotistas',
          tone: 'Profissional, Direto e Amigável'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.script) {
          setSubjectText(`{Olá|Oi} {nome} - Oportunidade para {empresa} em {cidade}`);
          setBodyText(data.script);
          safeLog('🤖 Copy de e-mail gerada com IA Gemini!', 'success');
        }
      } else {
        // Fallback copy generator
        setSubjectText(`{Olá|Prezado(a)} {nome} - Parceria comercial para {empresa}`);
        setBodyText(`{Olá|Oi} {nome}, tudo bem?

Acompanho o mercado de {cidade} e vi o excelente trabalho da {empresa} com {item}.

Temos condições especiais com pronta entrega e suporte dedicado para empresas da sua região.

{Teria 5 minutos para conversarmos esta semana?|Podemos agendar uma breve apresentação?}

Atenciosamente,
${senderName}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Dispatch Loop Execution
  const startDispatchProcess = async () => {
    const targetLeads = leads.filter(l => selectedLeadIds.has(l.id) && l.email && l.email.includes('@'));

    if (targetLeads.length === 0) {
      alert('Selecione ao menos 1 lead com e-mail válido para disparar!');
      return;
    }

    setIsDispatching(true);
    setIsPaused(false);
    isStopRequestedRef.current = false;
    isPausedRef.current = false;
    setActiveSubTab('logs');

    setStats({ total: targetLeads.length, sent: 0, errors: 0 });
    safeLog(`🚀 Iniciando disparo de ${targetLeads.length} e-mails com intervalo de ${sendDelaySeconds}s...`, 'info');

    let sentCount = 0;
    let errorCount = 0;

    for (let i = 0; i < targetLeads.length; i++) {
      if (isStopRequestedRef.current) {
        safeLog('⏹️ Disparo de e-mails interrompido pelo usuário.', 'warning');
        break;
      }

      while (isPausedRef.current) {
        await new Promise(res => setTimeout(res, 500));
        if (isStopRequestedRef.current) break;
      }

      if (isStopRequestedRef.current) break;

      setCurrentIndex(i + 1);
      const lead = targetLeads[i];
      const renderedSubj = renderLeadEmail(subjectText, lead);
      const renderedBody = renderLeadEmail(bodyText, lead);

      const logId = `log_${Date.now()}_${i}`;

      // Add sending log
      setDispatchLogs(prev => [
        {
          id: logId,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          recipientEmail: lead.email!,
          leadName: lead.name || lead.companyName || 'Lead',
          subject: renderedSubj,
          status: 'SENDING'
        },
        ...prev
      ]);

      try {
        const response = await fetch('/api/email/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: lead.email,
            subject: renderedSubj,
            textBody: renderedBody,
            htmlBody: emailMode === 'html' ? `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">${renderedBody.replace(/\n/g, '<br/>')}</div>` : undefined,
            leadName: lead.name,
            companyName: lead.companyName,
            providerConfig: {
              senderName,
              senderEmail,
              replyTo: replyToEmail,
              webhookUrl: webhookUrl || undefined,
              apiKey: apiKey || undefined
            }
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          sentCount++;
          setStats(prev => ({ ...prev, sent: sentCount }));

          // Update log
          setDispatchLogs(prev => prev.map(item => item.id === logId ? {
            ...item,
            status: 'SUCCESS',
            details: data.message || 'E-mail entregue com sucesso'
          } : item));

          // Update lead status in app
          onUpdateLeadStatus?.(lead.id, 'enviado');
        } else {
          throw new Error(data.error || 'Erro no servidor de envio');
        }
      } catch (err: any) {
        errorCount++;
        setStats(prev => ({ ...prev, errors: errorCount }));

        setDispatchLogs(prev => prev.map(item => item.id === logId ? {
          ...item,
          status: 'ERROR',
          details: err.message || 'Falha na conexão'
        } : item));
      }

      // Delay between emails for humanized anti-spam pacing
      if (i < targetLeads.length - 1 && !isStopRequestedRef.current) {
        await new Promise(res => setTimeout(res, sendDelaySeconds * 1000));
      }
    }

    setIsDispatching(false);
    setIsPaused(false);
    safeLog(`✅ Disparo de e-mails concluído! ${sentCount} enviados, ${errorCount} erros.`, 'success');
  };

  const handlePauseResume = () => {
    isPausedRef.current = !isPausedRef.current;
    setIsPaused(isPausedRef.current);
  };

  const handleStopDispatch = () => {
    isStopRequestedRef.current = true;
    setIsDispatching(false);
    setIsPaused(false);
  };

  // Export Dispatch Report CSV
  const handleExportCsvReport = () => {
    if (dispatchLogs.length === 0) {
      alert('Nenhum histórico de disparo para exportar.');
      return;
    }

    let csv = 'Data/Hora,Destinatario,Nome Lead,Assunto,Status,Detalhes\n';
    dispatchLogs.forEach(l => {
      csv += `"${l.timestamp}","${l.recipientEmail}","${l.leadName.replace(/"/g, '""')}","${l.subject.replace(/"/g, '""')}","${l.status}","${(l.details || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_disparo_email_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300 shadow-inner">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Disparo Massivo de E-mail B2B</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Variação Inteligente
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Envie campanhas de prospecção fria personalizadas com variações de texto por IA e entrega pausada humanizada.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {!isDispatching ? (
              <button
                onClick={startDispatchProcess}
                disabled={selectedLeadIds.size === 0}
                className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Disparar para {selectedLeadIds.size} Leads</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePauseResume}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Continuar' : 'Pausar'}</span>
                </button>
                <button
                  onClick={handleStopDispatch}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Parar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dispatch Progress Tracker */}
        {isDispatching && (
          <div className="mt-4 pt-4 border-t border-indigo-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-indigo-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Enviando {currentIndex} de {stats.total} e-mails...
              </span>
              <span className="text-indigo-300 font-mono">
                {Math.round((currentIndex / stats.total) * 100)}% Concluído
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-indigo-500/20">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${(currentIndex / stats.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Com E-mail Válido</p>
            <p className="text-sm  text-slate-900 dark:text-white">{leadsWithEmail.length} Leads</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Selecionados</p>
            <p className="text-sm  text-emerald-600 dark:text-emerald-400">{selectedLeadIds.size} Alvos</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Intervalo Padrão</p>
            <p className="text-sm  text-slate-900 dark:text-white">{sendDelaySeconds}s entre envios</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Reputação de Envio</p>
            <p className="text-sm  text-blue-600 dark:text-blue-400">Alta (Spintax OK)</p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 max-w-fit">
        <button
          onClick={() => setActiveSubTab('composer')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'composer'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1. Editor de Mensagem IA</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leads_selection')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'leads_selection'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>2. Seleção de Leads ({selectedLeadIds.size})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>3. Servidor & Remetente</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>4. Histórico ({dispatchLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: COMPOSER & PREVIEW */}
      {activeSubTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Template Selector & Text Editor */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Modelos Prontos & Copy IA
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiCopy}
                  disabled={isGeneratingAi}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingAi ? 'Gerando...' : 'Gerar com Gemini IA'}</span>
                </button>
              </div>

              {/* Template Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {EMAIL_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTemplateId === tpl.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/60 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-xs truncate">{tpl.name}</p>
                  </button>
                ))}
              </div>

              {/* Subject Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                  Assunto do E-mail (Suporta Spintax)
                </label>
                <input
                  type="text"
                  value={subjectText}
                  onChange={e => setSubjectText(e.target.value)}
                  placeholder="Ex: {Olá|Oi} {nome} - Proposta para {empresa}"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Body Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                    Corpo do E-mail (Texto e Variáveis)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEmailMode('plain')}
                      className={`text-xs font-bold px-2 py-0.5 rounded ${emailMode === 'plain' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Texto Puro
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailMode('html')}
                      className={`text-xs font-bold px-2 py-0.5 rounded ${emailMode === 'html' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      HTML Card
                    </button>
                  </div>
                </div>
                <textarea
                  rows={10}
                  value={bodyText}
                  onChange={e => setBodyText(e.target.value)}
                  placeholder="Escreva sua mensagem aqui..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono leading-relaxed"
                />
              </div>

              {/* Variables Chips */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400">Variáveis Dinâmicas Disponíveis:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['{nome}', '{empresa}', '{cidade}', '{uf}', '{item}', '{telefone}', '{empresa_remetente}', '{Olá|Oi|Prezado(a)}'].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBodyText(prev => prev + ' ' + chip)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-700 dark:text-slate-300 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Rendered Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Pré-Visualização em Tempo Real
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Exemplo: {sampleLead.name}</span>
              </div>

              {/* Rendered Email Card */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                {/* Header Mail Banner */}
                <div className="bg-slate-200 dark:bg-slate-800 p-3 border-b border-slate-300 dark:border-slate-700 space-y-1 text-xs">
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">De:</strong> {senderName} &lt;{senderEmail}&gt;
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">Para:</strong> {maskContact(sampleLead.email)}
                  </p>
                  <p className="text-slate-900 dark:text-white font-bold truncate">
                    <strong>Assunto:</strong> {previewSubject}
                  </p>
                </div>

                {/* Rendered Body Content */}
                <div className="p-4 space-y-3 min-h-[220px]">
                  {emailMode === 'html' ? (
                    <div className="bg-white text-slate-900 p-4 rounded-xl border border-slate-200 shadow-xs text-xs leading-relaxed space-y-3 font-sans">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          MP
                        </div>
                        <span className="font-bold text-slate-800">{senderName}</span>
                      </div>
                      <div className="whitespace-pre-wrap">{previewBody}</div>
                      <div className="pt-3 border-t border-slate-100 text-xs text-slate-400">
                        Mensagem enviada via Business Intelligence.
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                      {previewBody}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Validação de Spintax & Inovação
                </p>
                <p className="text-sm opacity-80">
                  Cada e-mail disparado selecionará combinações alternativas de saudações e frases dinâmicas, garantindo entregabilidade máxima na caixa de entrada.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEADS SELECTION */}
      {activeSubTab === 'leads_selection' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Fila de Leads para Disparo ({leadsWithEmail.length} Filtrados)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Selecionar Todos ({leadsWithEmail.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Limpar Seleção
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, empresa, e-mail ou cidade..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">Todas as Cidades ({uniqueCities.length})</option>
              {uniqueCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-xs">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.size > 0 && selectedLeadIds.size === leadsWithEmail.length}
                      onChange={e => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Empresa / Lead</th>
                  <th className="p-3">E-mail de Destino</th>
                  <th className="p-3">Localização</th>
                  <th className="p-3">Item / Nicho</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leadsWithEmail.map(lead => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleToggleSelectLead(lead.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectLead(lead.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {lead.companyName || lead.name || 'Lead sem nome'}
                        </p>
                        <p className="text-xs text-slate-400">{lead.name}</p>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {maskContact(lead.email)}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {lead.city ? `${lead.city} - ${lead.stateUf}` : lead.location || 'Brasil'}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        {lead.item || 'Comércio'}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {lead.outreachStatus || 'pendente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {leadsWithEmail.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      Nenhum lead com e-mail cadastrado atende aos filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS & SENDER CONFIG */}
      {activeSubTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Configurações de Remetente & Pacing
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                Nome do Remetente (De:)
              </label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="Ex: Comercial Asset Sync"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                E-mail do Remetente
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
                placeholder="Ex: comercial@suaempresa.com.br"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                Intervalo entre Envios (Segundos)
              </label>
              <input
                type="number"
                min={2}
                max={300}
                value={sendDelaySeconds}
                onChange={e => setSendDelaySeconds(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
              <p className="text-xs text-slate-400">Recomendado: 10s a 30s para proteger a reputação do seu domínio.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                URL de Webhook Externo (Opcional - Custom HTTP API)
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="Ex: https://api.seudominio.com/webhook"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                Chave de API (Resend, Brevo ou SendGrid)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Ex: re_6dTAQ..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
              <p className="text-xs text-slate-400">Insira sua chave de API. Se usar a Resend (re_...), o sistema identificará automaticamente.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXECUTION LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Histórico e Logs de Disparo em Tempo Real
              </h3>
            </div>

            <button
              onClick={handleExportCsvReport}
              disabled={dispatchLogs.length === 0}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-50 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Relatório (CSV)</span>
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {dispatchLogs.map(log => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  {log.status === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {log.status === 'ERROR' && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  {log.status === 'SENDING' && <Clock className="w-4 h-4 text-amber-500 animate-spin shrink-0" />}

                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {log.leadName} &lt;<span className="text-indigo-600 dark:text-indigo-400">{log.recipientEmail}</span>&gt;
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      {log.subject} {log.details ? `— ${log.details}` : ''}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-slate-400 shrink-0">{log.timestamp}</span>
              </div>
            ))}

            {dispatchLogs.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum disparo realizado nesta sessão. Clique no botão de disparar para iniciar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
