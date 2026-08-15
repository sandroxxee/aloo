import { maskContact } from '../utils/textProcessor';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageSquareCode,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  Pause,
  Square,
  Users,
  Settings,
  Eye,
  FileText,
  ShieldCheck,
  Zap,
  Search,
  Smartphone,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { Lead } from '../types';

interface SmsDispatcherProps {
  leads: Lead[];
  onUpdateLeadStatus?: (leadId: string, status: Lead['outreachStatus']) => void;
  onAddLog?: (log: any) => void;
}

interface SmsDispatchLog {
  id: string;
  timestamp: string;
  recipientPhone: string;
  leadName: string;
  messageText: string;
  status: 'SUCCESS' | 'ERROR' | 'SENDING';
  details?: string;
}

// B2B SMS Templates (Max 160 chars recommended for single SMS segment)
const SMS_TEMPLATES = [
  {
    id: 'sms_prospeccao_curta',
    name: '🎯 Prospecção Direta (1 Segmento)',
    text: `{Olá|Oi} {nome}! Vimos que a {empresa} atua com {item} em {cidade}. Temos ofertas exclusivas de repasse e frotas. Fale conosco no Whats: {telefone}`
  },
  {
    id: 'sms_urgencia_repasse',
    name: '⚡ Oportunidade de Repasse & Tabela FIPE',
    text: `{Olá|Oi} {nome}, oportunidade em {cidade}/{uf}: lotes de {item} com valor abaixo da tabela FIPE para frotistas. Responda este SMS ou ligue para detalhes.`
  },
  {
    id: 'sms_followup_simples',
    name: '⏰ Reativação Rápida de Lead',
    text: `Oi {nome}! Ainda procurando {item} em {cidade}? Temos novas unidades com frete bonificado para {uf}. Gostaria de receber a tabela atualizada?`
  }
];

export const SmsDispatcher: React.FC<SmsDispatcherProps> = ({
  leads,
  onUpdateLeadStatus,
  onAddLog
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'composer' | 'leads_selection' | 'settings' | 'logs'>('composer');

  // Gateway Settings
  const [smsGatewayProvider, setSmsGatewayProvider] = useState<'webhook' | 'smsdev' | 'twilio' | 'native_web'>('webhook');
  const [senderName, setSenderName] = useState(() => localStorage.getItem('sms_sender_name') || 'Business Sync');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('sms_webhook_url') || '');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sms_api_key') || '');
  const [sendDelaySeconds, setSendDelaySeconds] = useState<number>(() => Number(localStorage.getItem('sms_send_delay')) || 8);

  // Test SMS State
  const [testPhoneNumber, setTestPhoneNumber] = useState(() => localStorage.getItem('sms_test_phone_number') || '');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Template State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('sms_prospeccao_curta');
  const [messageText, setMessageText] = useState(SMS_TEMPLATES[0].text);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedBatchSms, setCopiedBatchSms] = useState(false);

  // Lead Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [onlyValidPhoneFilter, setOnlyValidPhoneFilter] = useState(true);

  // Execution & Progress State
  const [isDispatching, setIsDispatching] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dispatchLogs, setDispatchLogs] = useState<SmsDispatchLog[]>([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, errors: 0 });

  const isStopRequestedRef = useRef(false);
  const isPausedRef = useRef(false);

  // Filtered Leads with valid mobile phone
  const leadsWithPhone = useMemo(() => {
    return leads.filter(l => {
      const raw = (l.phone || l.rawPhone || '').replace(/\D/g, '');
      const hasPhone = raw.length >= 10;
      if (onlyValidPhoneFilter && !hasPhone) return false;
      
      if (cityFilter !== 'ALL' && (l.city || l.location) !== cityFilter) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const nameMatch = l.name?.toLowerCase().includes(q) || l.companyName?.toLowerCase().includes(q);
        const phoneMatch = raw.includes(q);
        const cityMatch = l.city?.toLowerCase().includes(q);
        const itemMatch = l.item?.toLowerCase().includes(q);
        return Boolean(nameMatch || phoneMatch || cityMatch || itemMatch);
      }
      return true;
    });
  }, [leads, onlyValidPhoneFilter, cityFilter, searchTerm]);

  // Unique cities dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      if (l.city) set.add(l.city);
      else if (l.location) set.add(l.location);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Auto Select Leads on Mount
  useEffect(() => {
    const initialIds = new Set<string>();
    leads.forEach(l => {
      const raw = (l.phone || l.rawPhone || '').replace(/\D/g, '');
      if (raw.length >= 10) {
        initialIds.add(l.id);
      }
    });
    setSelectedLeadIds(initialIds);
  }, [leads]);

  // Save Settings
  useEffect(() => {
    localStorage.setItem('sms_sender_name', senderName);
    localStorage.setItem('sms_webhook_url', webhookUrl);
    localStorage.setItem('sms_api_key', apiKey);
    localStorage.setItem('sms_send_delay', String(sendDelaySeconds));
    localStorage.setItem('sms_test_phone_number', testPhoneNumber);
  }, [senderName, webhookUrl, apiKey, sendDelaySeconds, testPhoneNumber]);

  // Single Test SMS Execution
  const handleSendSingleTestSms = async () => {
    const rawTarget = testPhoneNumber || sampleLead.phone || sampleLead.rawPhone || '';
    const cleanPhone = rawTarget.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setTestFeedback({
        type: 'error',
        message: 'Por favor, insira um número de celular de teste válido com DDD (Ex: 31997621100)!'
      });
      return;
    }

    setIsSendingTest(true);
    setTestFeedback(null);

    const renderedText = renderLeadSms(messageText, sampleLead);
    const logId = `sms_test_${Date.now()}`;

    try {
      const response = await fetch('/api/sms/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          message: renderedText,
          leadName: 'SMS de Teste Direto',
          provider: smsGatewayProvider,
          providerConfig: {
            senderName,
            webhookUrl,
            apiKey
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTestFeedback({
          type: 'success',
          message: `✅ SMS de Teste enviado com sucesso para ${cleanPhone}! (${data.message || 'Gateway confirmado'})`
        });

        setDispatchLogs(prev => [
          {
            id: logId,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            recipientPhone: cleanPhone,
            leadName: 'SMS de Teste Direto',
            messageText: renderedText,
            status: 'SUCCESS',
            details: data.message || 'SMS de Teste entregue ao Gateway'
          },
          ...prev
        ]);
        safeLog(`✅ SMS de Teste disparado para ${cleanPhone}`, 'success');
      } else {
        throw new Error(data.error || 'Erro ao enviar SMS de teste pelo Gateway.');
      }
    } catch (err: any) {
      setTestFeedback({
        type: 'error',
        message: `❌ Falha no envio do SMS de Teste: ${err.message}`
      });

      setDispatchLogs(prev => [
        {
          id: logId,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          recipientPhone: cleanPhone,
          leadName: 'SMS de Teste Direto',
          messageText: renderedText,
          status: 'ERROR',
          details: err.message
        },
        ...prev
      ]);
      safeLog(`❌ Erro no SMS de teste para ${cleanPhone}: ${err.message}`, 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Spintax Helper
  const parseSpintax = (text: string): string => {
    return text.replace(/\{([^{}]+)\}/g, (_, choices) => {
      const options = choices.split('|');
      return options[Math.floor(Math.random() * options.length)].trim();
    });
  };

  // Render Lead SMS
  const renderLeadSms = (rawTemplate: string, lead: Lead): string => {
    let result = parseSpintax(rawTemplate);
    result = result.replace(/\{nome\}/gi, lead.name || lead.companyName || 'Cliente');
    result = result.replace(/\{empresa\}/gi, lead.companyName || lead.name || 'Sua Empresa');
    result = result.replace(/\{cidade\}/gi, lead.city || lead.location || 'sua região');
    result = result.replace(/\{uf\}/gi, lead.stateUf || 'BR');
    result = result.replace(/\{item\}/gi, lead.item || 'caminhões e frotas');
    result = result.replace(/\{telefone\}/gi, lead.phone || lead.rawPhone || '');
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
    const validLead = leads.find(l => (l.phone || l.rawPhone || '').replace(/\D/g, '').length >= 10);
    if (validLead) return validLead;
    return {
      id: 'preview_sample_sms',
      name: 'Marcos Vinícius',
      companyName: 'TransGerais Logística',
      phone: '(31) 99762-1100',
      rawPhone: '31997621100',
      ddd: '31',
      intent: 'Venda',
      query: 'Caminhões',
      source: 'Automático',
      city: 'Belo Horizonte',
      stateUf: 'MG',
      item: 'Caminhões e Carretas',
      createdAt: new Date().toISOString()
    };
  }, [leads]);

  const previewSms = useMemo(() => renderLeadSms(messageText, sampleLead), [messageText, sampleLead]);

  // Toggle Selection
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
    leadsWithPhone.forEach(l => next.add(l.id));
    setSelectedLeadIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedLeadIds(new Set());
  };

  const handleSelectTemplate = (templateId: string) => {
    const tpl = SMS_TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setSelectedTemplateId(templateId);
      setMessageText(tpl.text);
    }
  };

  // Generate AI SMS Copy using Gemini 3.6 Flash
  const handleGenerateAiSms = async () => {
    setIsGeneratingAi(true);
    try {
      const response = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: sampleLead.item || 'Caminhões e Peças',
          targetAudience: 'Frotistas e Compradores Comerciais',
          tone: 'Direto, Persuasivo e Curto (Max 160 caracteres)'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.script) {
          // Truncate to SMS safe length if necessary
          const cleanText = data.script.replace(/\n/g, ' ').slice(0, 160);
          setMessageText(cleanText);
          safeLog('🤖 SMS comercial gerado com IA Gemini 3.6 Flash!', 'success');
        }
      } else {
        setMessageText(`{Olá|Oi} {nome}! Ofertas de {item} em {cidade}/{uf} com faturamento rápido para {empresa}. Fale conosco agora: {telefone}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Dispatch Loop Execution
  const startDispatchProcess = async () => {
    const targetLeads = leads.filter(l => selectedLeadIds.has(l.id) && (l.phone || l.rawPhone || '').replace(/\D/g, '').length >= 10);

    if (targetLeads.length === 0) {
      alert('Selecione ao menos 1 lead com telefone celular válido!');
      return;
    }

    setIsDispatching(true);
    setIsPaused(false);
    isStopRequestedRef.current = false;
    isPausedRef.current = false;
    setActiveSubTab('logs');

    setStats({ total: targetLeads.length, sent: 0, errors: 0 });
    safeLog(`📱 Iniciando disparo de ${targetLeads.length} mensagens SMS via ${smsGatewayProvider.toUpperCase()}...`, 'info');

    let sentCount = 0;
    let errorCount = 0;

    for (let i = 0; i < targetLeads.length; i++) {
      if (isStopRequestedRef.current) {
        safeLog('⏹️ Disparo de SMS interrompido pelo usuário.', 'warning');
        break;
      }

      while (isPausedRef.current) {
        await new Promise(res => setTimeout(res, 500));
        if (isStopRequestedRef.current) break;
      }

      if (isStopRequestedRef.current) break;

      setCurrentIndex(i + 1);
      const lead = targetLeads[i];
      const renderedSms = renderLeadSms(messageText, lead);
      const rawPhone = (lead.phone || lead.rawPhone || '').replace(/\D/g, '');

      const logId = `sms_log_${Date.now()}_${i}`;

      setDispatchLogs(prev => [
        {
          id: logId,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          recipientPhone: rawPhone,
          leadName: lead.name || lead.companyName || 'Lead',
          messageText: renderedSms,
          status: 'SENDING'
        },
        ...prev
      ]);

      try {
        const response = await fetch('/api/sms/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: rawPhone,
            message: renderedSms,
            leadName: lead.name,
            provider: smsGatewayProvider,
            providerConfig: {
              senderName,
              webhookUrl,
              apiKey
            }
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          sentCount++;
          setStats(prev => ({ ...prev, sent: sentCount }));

          setDispatchLogs(prev => prev.map(item => item.id === logId ? {
            ...item,
            status: 'SUCCESS',
            details: data.message || 'SMS entregue ao gateway com sucesso'
          } : item));

          onUpdateLeadStatus?.(lead.id, 'enviado');
        } else {
          throw new Error(data.error || 'Erro no Gateway de SMS');
        }
      } catch (err: any) {
        errorCount++;
        setStats(prev => ({ ...prev, errors: errorCount }));

        setDispatchLogs(prev => prev.map(item => item.id === logId ? {
          ...item,
          status: 'ERROR',
          details: err.message || 'Falha no servidor de SMS'
        } : item));
      }

      if (i < targetLeads.length - 1 && !isStopRequestedRef.current) {
        await new Promise(res => setTimeout(res, sendDelaySeconds * 1000));
      }
    }

    setIsDispatching(false);
    setIsPaused(false);
    safeLog(`✅ Disparo de SMS concluído! ${sentCount} enviados, ${errorCount} erros.`, 'success');
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

  // Copy Direct SMS Batch Links
  const handleCopyNativeSmsBatch = () => {
    const targetLeads = leads.filter(l => selectedLeadIds.has(l.id) && (l.phone || l.rawPhone || '').replace(/\D/g, '').length >= 10);
    if (targetLeads.length === 0) {
      alert('Nenhum lead selecionado.');
      return;
    }

    const smsLinks = targetLeads.slice(0, 50).map(l => {
      const raw = (l.phone || l.rawPhone || '').replace(/\D/g, '');
      const text = encodeURIComponent(renderLeadSms(messageText, l));
      return `sms:+55${raw}?body=${text}`;
    }).join('\n');

    navigator.clipboard.writeText(smsLinks);
    setCopiedBatchSms(true);
    setTimeout(() => setCopiedBatchSms(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-5 border border-sky-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sky-600/30 border border-sky-400/30 flex items-center justify-center shrink-0 text-sky-300 shadow-inner">
              <MessageSquareCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Disparo Massivo de SMS B2B</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gateway & Otimização
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Envie campanhas rápidas de SMS via Webhook Gateway gratuito, APIs parceiras ou links diretos de celular.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {!isDispatching ? (
              <button
                onClick={startDispatchProcess}
                disabled={selectedLeadIds.size === 0}
                className="w-full md:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Disparar para {selectedLeadIds.size} SMS</span>
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

        {/* Progress Tracker */}
        {isDispatching && (
          <div className="mt-4 pt-4 border-t border-sky-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-sky-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Disparando {currentIndex} de {stats.total} SMS...
              </span>
              <span className="text-sky-300 font-mono">
                {Math.round((currentIndex / stats.total) * 100)}% Concluído
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-sky-500/20">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${(currentIndex / stats.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 dark:bg-sky-950/50 rounded-lg text-sky-600 dark:text-sky-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Com Celular Válido</p>
            <p className="text-sm  text-slate-900 dark:text-white">{leadsWithPhone.length} Leads</p>
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
            <p className="text-xs font-bold text-slate-400">Provedor Ativo</p>
            <p className="text-sm  text-blue-600 dark:text-blue-400">{smsGatewayProvider}</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 max-w-fit">
        <button
          onClick={() => setActiveSubTab('composer')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'composer'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1. Editor de SMS IA</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leads_selection')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'leads_selection'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>2. Seleção ({selectedLeadIds.size})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>3. Gateway & Webhook</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>4. Histórico ({dispatchLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: COMPOSER */}
      {activeSubTab === 'composer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Modelos Curtos & Copy Gemini IA
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiSms}
                  disabled={isGeneratingAi}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingAi ? 'Gerando...' : 'Gerar com Gemini 3.6'}</span>
                </button>
              </div>

              {/* Template Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SMS_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTemplateId === tpl.id
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500/60 text-sky-900 dark:text-sky-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-xs truncate">{tpl.name}</p>
                  </button>
                ))}
              </div>

              {/* Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                    Texto do SMS (Ideal: até 160 caracteres)
                  </label>
                  <span className={`text-xs font-mono font-bold ${
                    messageText.length > 160 ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {messageText.length} caracteres ({Math.ceil(messageText.length / 160)} segmento)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Escreva a mensagem aqui..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-sky-600 font-mono leading-relaxed"
                />
              </div>

              {/* Variable Chips */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400">Variáveis Dinâmicas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {['{nome}', '{empresa}', '{cidade}', '{uf}', '{item}', '{telefone}', '{Olá|Oi}'].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessageText(prev => prev + ' ' + chip)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 text-slate-700 dark:text-slate-300 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Pré-Visualização do SMS
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Lead: {sampleLead.name}</span>
              </div>

              {/* Phone Mockup Screen */}
              <div className="bg-slate-950 rounded-3xl p-4 border-4 border-slate-800 shadow-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-b border-slate-800/80 pb-2">
                  <span>SMS • {maskContact(sampleLead.phone)}</span>
                  <span className="text-emerald-400 font-mono">ONLINE</span>
                </div>

                <div className="bg-sky-600 text-white rounded-2xl rounded-tl-none p-3 text-xs leading-relaxed font-sans shadow-md">
                  <p>{previewSms}</p>
                  <p className="text-xs text-sky-200 text-right mt-1">Agora • SMS</p>
                </div>
              </div>

              {/* Single Test SMS Card */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className=" text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Enviar SMS de Teste Rápido
                  </p>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                    TESTE IMEDIATO
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                    Definir Número de Destino para Teste:
                  </label>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={testPhoneNumber}
                      onChange={e => setTestPhoneNumber(e.target.value)}
                      placeholder="Ex: 31997621100 ou (11) 98765-4321"
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendSingleTestSms}
                  disabled={isSendingTest}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSendingTest ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSendingTest ? 'Disparando Teste...' : 'Enviar SMS de Teste Agora'}</span>
                </button>

                {testFeedback && (
                  <div className={`p-2 rounded-lg text-xs font-semibold leading-snug animate-in fade-in ${
                    testFeedback.type === 'success'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {testFeedback.message}
                  </div>
                )}
              </div>

              <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 rounded-xl text-xs text-sky-900 dark:text-sky-300 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Envio Nativo Direct-SMS (Sem Custos)
                </p>
                <p className="text-sm opacity-80">
                  Deseja disparar diretamente do seu celular sem usar gateway pago? Gere links `sms:` nativos para execução imediata no Android/iOS.
                </p>
                <button
                  type="button"
                  onClick={handleCopyNativeSmsBatch}
                  className="w-full py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedBatchSms ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBatchSms ? 'Links SMS Copiados!' : 'Copiar Lote de Links SMS Direct'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SELECTION */}
      {activeSubTab === 'leads_selection' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Fila de Leads para SMS ({leadsWithPhone.length} com Celular)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Selecionar Todos ({leadsWithPhone.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, empresa, telefone ou cidade..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
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

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-xs">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.size > 0 && selectedLeadIds.size === leadsWithPhone.length}
                      onChange={e => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Empresa / Lead</th>
                  <th className="p-3">Celular de Destino</th>
                  <th className="p-3">Localização</th>
                  <th className="p-3">Item / Nicho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leadsWithPhone.map(lead => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  const rawPhone = (lead.phone || lead.rawPhone || '').replace(/\D/g, '');
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleToggleSelectLead(lead.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectLead(lead.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {lead.companyName || lead.name || 'Lead sem nome'}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                          {lead.phone || rawPhone}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {lead.city ? `${lead.city} - ${lead.stateUf}` : lead.location || 'Brasil'}
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        {lead.item || 'Comércio'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Configurações do Gateway de SMS & Webhook
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                Modo do Gateway de SMS
              </label>
              <select
                value={smsGatewayProvider}
                onChange={e => setSmsGatewayProvider(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="webhook">🌐 Webhook HTTP / Android Gateway Bridge (Grátis)</option>
                <option value="smsdev">📲 SMSDev API (Brasil)</option>
                <option value="twilio">📞 Twilio SMS Service API</option>
                <option value="native_web">📱 Direct Web Link (`sms:`) (Sem Servidor)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                Nome do Remetente
              </label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="Ex: Business Sync"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                URL do Webhook / Endpoint do Gateway
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="Ex: https://seu-servidor-sms.com/api/send ou https://textbee.dev/api/v1/gateway"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                Token / Chave de API do Provedor
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Cole seu token de autenticação do gateway de SMS..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300">
                Intervalo entre Disparos (Segundos)
              </label>
              <input
                type="number"
                min={2}
                max={120}
                value={sendDelaySeconds}
                onChange={e => setSendDelaySeconds(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Histórico de Disparos de SMS ({dispatchLogs.length})
            </h3>
            <span className="text-xs font-bold text-emerald-600">
              {stats.sent} Enviados / {stats.errors} Erros
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold text-xs">
                <tr>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Lead / Celular</th>
                  <th className="p-3">Mensagem</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-sm">
                {dispatchLogs.map(log => (
                  <tr key={log.id}>
                    <td className="p-3 text-slate-400">{log.timestamp}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                      {log.leadName} ({log.recipientPhone})
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 truncate max-w-[300px]">
                      {log.messageText}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs  ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'ERROR'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {dispatchLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-sans text-xs">
                      Nenhum disparo realizado nesta sessão.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
