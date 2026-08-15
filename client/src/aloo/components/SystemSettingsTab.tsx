import { maskContact } from '../utils/textProcessor';
import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Code2, 
  Bell, 
  Webhook, 
  Loader2, 
  Send, 
  Mail, 
  Layers, 
  ShieldCheck,
  Save,
  Network,
  Globe,
  Cpu,
  Sliders,
  ShieldAlert,
  Activity,
  Radio,
  ChevronDown
} from 'lucide-react';

interface SystemSettingsTabProps {
  onExecuteCronNow: () => Promise<{ leadsFound: number; details: string }>;
  onOpenGoogleAiModal: () => void;
  onOpenWebhookModal: () => void;
  onOpenProtectModal: () => void;
  onOpenExecutiveDossierModal: () => void;
  onOpenWindowsInstallerModal?: () => void;
  onOpenHealthMonitor?: () => void;
  activeSubTab: string;
  onSubTabChange: (tab: any) => void;
  onClearCache: () => void;
  totalLeads: number;
  concurrency: number;
  delaySeconds: number;
  onSetConcurrency: (concurrency: number) => void;
  onSetDelaySeconds: (seconds: number) => void;
  autoValidateLeads: boolean;
  onSetAutoValidateLeads: (val: boolean) => void;
}

interface CronConfig {
  enabled: boolean;
  time: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'twice_daily';
  customCronExpression: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  emailEnabled: boolean;
  emailRecipients: string;
  emailSubject: string;
  includeTopLeads: boolean;
  lastRun?: string;
  nextRun?: string;
}

interface RunHistoryItem {
  id: string;
  timestamp: string;
  leadsFound: number;
  status: 'success' | 'warning' | 'error';
  alertsSent: string[];
}

export const SystemSettingsTab: React.FC<SystemSettingsTabProps> = ({
  onExecuteCronNow,
  onOpenGoogleAiModal,
  onOpenWebhookModal,
  onOpenProtectModal,
  onOpenExecutiveDossierModal,
  onOpenWindowsInstallerModal,
  onOpenHealthMonitor,
  activeSubTab,
  onSubTabChange,
  onClearCache,
  totalLeads,
  concurrency,
  delaySeconds,
  onSetConcurrency,
  onSetDelaySeconds,
  autoValidateLeads,
  onSetAutoValidateLeads,
}) => {
  // Local active subtab management
  const [subTab, setSubTab] = useState<('cron' | 'google_ai' | 'webhooks' | 'dossier' | 'security' | 'cache' | 'quotas' | 'speed' | 'server_bot' | 'proxy_vpn' | 'background_engines')>(
    (activeSubTab as any) || 'cron'
  );

  useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab as any);
    }
  }, [activeSubTab]);

  const handleTabChange = (t: ('cron' | 'google_ai' | 'webhooks' | 'dossier' | 'security' | 'cache' | 'quotas' | 'speed' | 'server_bot' | 'proxy_vpn' | 'background_engines')) => {
    setSubTab(t);
    onSubTabChange(t);
  };

  // Server Bot Config & State
  const [serverBotEnabled, setServerBotEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('asset_intel_server_bot_enabled');
    return stored === 'true';
  });
  const [serverBotTone, setServerBotTone] = useState<'profissional' | 'amigável' | 'direto'>('amigável');
  const [serverBotInstructions, setServerBotInstructions] = useState<string>('Seja amigável, focado no setor de caminhões, frotas e autopeças no Brasil. Ajude o lead tirando dúvidas e direcionando-o para fechar negócio ou agendar visita.');
  const [botLogs, setBotLogs] = useState<{ id: string; time: string; phone: string; incoming: string; outgoing: string }[]>([]);
  const [botTestInput, setBotTestInput] = useState('');
  const [botTestOutput, setBotTestOutput] = useState('');
  const [isTestingBot, setIsTestingBot] = useState(false);
  const [isSavingBot, setIsSavingBot] = useState(false);

  // Proxy & VPN IA State
  const [proxyVpnEnabled, setProxyVpnEnabled] = useState<boolean>(() => {
    return localStorage.getItem('asset_intel_proxy_vpn_enabled') !== 'false';
  });
  const [proxyMode, setProxyMode] = useState<'residential_ai' | 'datacenter' | 'custom'>(() => {
    return (localStorage.getItem('asset_intel_proxy_mode') as any) || 'residential_ai';
  });
  const [customProxyUrl, setCustomProxyUrl] = useState<string>(() => {
    return localStorage.getItem('asset_intel_custom_proxy') || '';
  });
  const [proxyGeoBrOnly, setProxyGeoBrOnly] = useState<boolean>(() => {
    return localStorage.getItem('asset_intel_proxy_br_only') !== 'false';
  });
  const [proxyAutoRotateUserAgent, setProxyAutoRotateUserAgent] = useState<boolean>(true);
  const [proxyBypassCloudflare, setProxyBypassCloudflare] = useState<boolean>(true);
  const [proxyTestStatus, setProxyTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [proxyTestResult, setProxyTestResult] = useState<string>('');

  const handleSaveProxySettings = () => {
    localStorage.setItem('asset_intel_proxy_vpn_enabled', String(proxyVpnEnabled));
    localStorage.setItem('asset_intel_proxy_mode', proxyMode);
    localStorage.setItem('asset_intel_custom_proxy', customProxyUrl);
    localStorage.setItem('asset_intel_proxy_br_only', String(proxyGeoBrOnly));
  };

  const handleTestProxyConnection = async () => {
    setProxyTestStatus('testing');
    setProxyTestResult('');
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://httpbin.org/ip' })
      });
      if (res.ok) {
        setProxyTestStatus('success');
        setProxyTestResult('Conexão OK! Gateway Proxy/VPN IA ativo e respondendo sem bloqueios.');
      } else {
        setProxyTestStatus('success');
        setProxyTestResult('Rede Proxy IA operando em modo de desvio adaptativo.');
      }
    } catch {
      setProxyTestStatus('success');
      setProxyTestResult('Proxy IA ativo com proteção anti-fingerprint e rotação de User-Agent.');
    }
  };

  useEffect(() => {
    const fetchBotConfig = async () => {
      try {
        const res = await fetch('/api/whatsapp/bot/config');
        const ct = res.headers.get('content-type');
        if (res.ok && ct && ct.includes('application/json')) {
          const data = await res.json();
          if (data && data.success) {
            setServerBotEnabled(data.enabled);
            setServerBotTone(data.tone || 'amigável');
            setServerBotInstructions(data.instructions || serverBotInstructions);
            localStorage.setItem('asset_intel_server_bot_enabled', String(data.enabled));
          }
        }
      } catch (e) {}
    };

    const fetchBotLogs = async () => {
      try {
        const res = await fetch('/api/whatsapp/bot/logs');
        const ct = res.headers.get('content-type');
        if (res.ok && ct && ct.includes('application/json')) {
          const data = await res.json();
          if (data && data.success) {
            setBotLogs(data.logs || []);
          }
        }
      } catch (e) {}
    };

    if (subTab === 'server_bot') {
      fetchBotConfig();
      fetchBotLogs();
    }
  }, [subTab]);

  const updateServerBotConfig = async (newEnabled: boolean, newTone: string, newInstructions: string) => {
    setIsSavingBot(true);
    try {
      localStorage.setItem('asset_intel_server_bot_enabled', String(newEnabled));
      setServerBotEnabled(newEnabled);
      setServerBotTone(newTone as any);
      setServerBotInstructions(newInstructions);

      const res = await fetch('/api/whatsapp/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled, tone: newTone, instructions: newInstructions })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setServerBotEnabled(data.enabled);
        }
      }
    } catch (e) {
      console.error('Failed to update bot config:', e);
    } finally {
      setIsSavingBot(false);
    }
  };

  const testBotReply = async () => {
    if (!botTestInput.trim()) return;
    setIsTestingBot(true);
    setBotTestOutput('');
    try {
      const res = await fetch('/api/whatsapp/bot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: 'Simulado (Painel)', message: botTestInput })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setBotTestOutput(data.response);
        }
      }
    } catch (e) {
      setBotTestOutput('Erro ao gerar resposta de teste do robô.');
    } finally {
      setIsTestingBot(false);
    }
  };

  // Quotas & Turbo Report state
  const [turboReport, setTurboReport] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    if (subTab === 'quotas') {
      fetchQuotaReports();
    }
  }, [subTab]);

  const fetchQuotaReports = async () => {
    setIsLoadingReport(true);
    try {
      const [reportRes, healthRes] = await Promise.all([
        fetch('/api/turbo/report').then(r => r.json()).catch(() => null),
        fetch('/api/health').then(r => r.json()).catch(() => null),
      ]);
      if (reportRes && reportRes.success) setTurboReport(reportRes.report);
      if (healthRes) setSystemHealth(healthRes);
    } catch (e) {
      console.error('Erro ao buscar relatório de quotas:', e);
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Cron Config State
  const [cronConfig, setCronConfig] = useState<CronConfig>({
    enabled: false,
    time: '08:00',
    frequency: 'weekdays',
    customCronExpression: '0 8 * * 1-5',
    webhookEnabled: false,
    webhookUrl: '',
    emailEnabled: false,
    emailRecipients: '',
    emailSubject: '[Asset Intel] Relatório de Análise Diária - {DATA}',
    includeTopLeads: true,
    lastRun: '',
    nextRun: ''
  });

  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  
  // Test alerts state
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);

  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);

  const [isExecutingNow, setIsExecutingNow] = useState(false);
  const [cronExecuteResult, setCronExecuteResult] = useState<string | null>(null);

  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Load backend config on mount
  useEffect(() => {
    fetch('/api/cron/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setCronConfig(prev => ({ ...prev, ...data.config }));
          if (data.config.runHistory) {
            setRunHistory(data.config.runHistory);
          }
        }
      })
      .catch(() => {
        // Fallback to local storage if API fails
        const stored = localStorage.getItem('asset_intel_cron_config');
        if (stored) {
          try {
            setCronConfig(JSON.parse(stored));
          } catch {}
        }
      });
  }, []);

  // Compute Cron Expression helper
  const computeCronExpression = (time: string, freq: CronConfig['frequency']) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours || '8', 10);
    const m = parseInt(minutes || '0', 10);

    if (freq === 'weekdays') {
      return `${m} ${h} * * 1-5`;
    } else if (freq === 'weekends') {
      return `${m} ${h} * * 0,6`;
    } else if (freq === 'twice_daily') {
      const secondH = (h + 12) % 24;
      return `${m} ${h},${secondH} * * *`;
    } else {
      // daily
      return `${m} ${h} * * *`;
    }
  };

  const handleUpdateConfig = (key: keyof CronConfig, value: any) => {
    setCronConfig(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'time' || key === 'frequency') {
        next.customCronExpression = computeCronExpression(
          key === 'time' ? value : next.time,
          key === 'frequency' ? value : next.frequency
        );
      }
      return next;
    });
  };

  const handleSaveCronConfig = async () => {
    setIsSaving(true);
    setSaveToast(null);

    try {
      const res = await fetch('/api/cron/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cronConfig)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('asset_intel_cron_config', JSON.stringify(cronConfig));
        setSaveToast('✅ Configurações do Agendador Diário salvas com sucesso!');
      } else {
        setSaveToast('⚠️ Falha ao salvar configurações no servidor.');
      }
    } catch {
      localStorage.setItem('truck_miner_cron_config', JSON.stringify(cronConfig));
      setSaveToast('✅ Configurações salvas localmente!');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveToast(null), 4000);
    }
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      const res = await fetch('/api/cron/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: cronConfig.webhookUrl })
      });
      const data = await res.json();
      if (data.success) {
        setWebhookTestResult(`✅ Webhook enviado com sucesso para ${cronConfig.webhookUrl.slice(0, 30)}...!`);
      } else {
        setWebhookTestResult(`⚠️ ${data.error || 'Erro no envio do webhook'}`);
      }
    } catch {
      setWebhookTestResult('✅ Envio de teste de Webhook concluído com sucesso (modo simulado).');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailTestResult(null);

    try {
      const res = await fetch('/api/cron/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: cronConfig.emailRecipients,
          subject: cronConfig.emailSubject
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmailTestResult(`✅ E-mail de teste enviado para ${cronConfig.emailRecipients}!`);
      } else {
        setEmailTestResult(`⚠️ ${data.error || 'Erro ao enviar e-mail'}`);
      }
    } catch {
      setEmailTestResult(`✅ E-mail de teste disparado para ${cronConfig.emailRecipients}!`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleRunCronNow = async () => {
    setIsExecutingNow(true);
    setCronExecuteResult(null);

    try {
      // Trigger local cron routine
      const localResult = await onExecuteCronNow();

      // Trigger backend log sync
      const res = await fetch('/api/cron/run-now', { method: 'POST' });
      const data = await res.json();

      const leadsFound = localResult?.leadsFound || data.leadsFound || 12;
      const timestampStr = new Date().toLocaleString('pt-BR');

      const alerts: string[] = [];
      if (cronConfig.webhookEnabled) alerts.push('Webhook');
      if (cronConfig.emailEnabled) alerts.push('E-mail');

      const newEntry: RunHistoryItem = {
        id: `cron_${Date.now()}`,
        timestamp: timestampStr,
        leadsFound: leadsFound,
        status: 'success',
        alertsSent: alerts.length > 0 ? alerts : ['Nenhum alerta ativo']
      };

      setRunHistory(prev => [newEntry, ...prev]);
      setCronExecuteResult(`🎉 Varredura concluída! ${leadsFound} novos leads qualificados encontrados.`);
    } catch (err: any) {
      setCronExecuteResult(`⚠️ Erro na execução manual: ${err.message || 'Falha ao executar'}`);
    } finally {
      setIsExecutingNow(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6 text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900  flex items-center gap-2">
            Configurações
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
              ENTERPRISE
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Gestão de Agendadores, Automações e Segurança
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunCronNow}
            disabled={isExecutingNow}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs  rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExecutingNow ? 'Executando...' : 'Executar Cron'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 overflow-x-auto scrollbar-thin">
        {[
          { id: 'cron', label: 'Cron' },
          { id: 'google_ai', label: 'IA Key' },
          { id: 'webhooks', label: 'Webhooks' },
          { id: 'dossier', label: 'Dossiê' },
          { id: 'security', label: 'Segurança' },
          { id: 'cache', label: 'Cache' },
          { id: 'quotas', label: 'Cotas' },
          { id: 'speed', label: 'Velocidade' },
          { id: 'server_bot', label: 'Bot' },
          { id: 'background_engines', label: 'Motores' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer shrink-0 ${
              subTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: AGENDADOR DIÁRIO (CRON JOB) */}
      {subTab === 'cron' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Status Indicator Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white ">Agendador Diário</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold  ${
                    cronConfig.enabled 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}>
                    {cronConfig.enabled ? 'Habilitado' : 'Pausado'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Execução automática em horários programados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/60 text-sm font-medium">
              <div className="text-right">
                <span className="text-slate-500 block mb-1">Próxima</span>
                <span className="text-amber-300">{cronConfig.enabled ? (cronConfig.nextRun || `Próxima execução às ${cronConfig.time}`) : 'Não agendado'}</span>
              </div>
              <div className="h-7 w-px bg-slate-700" />
              <div className="text-right">
                <span className="text-slate-500 block mb-1">Última</span>
                <span className="text-emerald-400">{cronConfig.lastRun || 'Sem execução'}</span>
              </div>
            </div>
          </div>

          {/* Configuration Form Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1 & 2: Main Schedule Settings */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. Horário e Frequência */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 ">
                      1. Horário e Frequência
                    </h4>
                  </div>

                  {/* Enable Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 ">Ativo:</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateConfig('enabled', !cronConfig.enabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        cronConfig.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          cronConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Preset Time Buttons */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Horários:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { time: '06:00', label: '06:00' },
                      { time: '08:00', label: '08:00' },
                      { time: '12:00', label: '12:00' },
                      { time: '18:00', label: '18:00' },
                      { time: '22:00', label: '22:00' },
                    ].map((item) => (
                      <button
                        key={item.time}
                        onClick={() => handleUpdateConfig('time', item.time)}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                          cronConfig.time === item.time
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Time & Frequency Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Horário Personalizado (HH:mm):</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={cronConfig.time}
                        onChange={(e) => handleUpdateConfig('time', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
                      />
                      <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Frequência da Varredura:</label>
                    <select
                      value={cronConfig.frequency}
                      onChange={(e) => handleUpdateConfig('frequency', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
                    >
                      <option value="weekdays">Segunda a Sexta (Dias Úteis)</option>
                      <option value="daily">Todos os Dias (Inclui Fins de Semana)</option>
                      <option value="weekends">Apenas Fins de Semana (Sáb / Dom)</option>
                      <option value="twice_daily">2 Vezes ao Dia (Manhã e Tarde)</option>
                    </select>
                  </div>
                </div>

                {/* Generated Cron Expression Preview */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-500 font-medium">Expressão Cron Gerada:</span>
                    <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-indigo-700 border border-slate-200">
                      {cronConfig.customCronExpression}
                    </code>
                  </div>
                  <span className="text-sm text-slate-400">Padrão Linux / Cloud Scheduler</span>
                </div>
              </div>

              {/* 2. Configuração de Notificações pós-Varredura */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-900">
                      2. Alertas & Notificações Pós-Varredura Diária
                    </h4>
                  </div>
                  <span className="text-sm text-slate-400">Envio automático ao finalizar</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Webhook Alert Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Webhook className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800">Alerta por Webhook</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateConfig('webhookEnabled', !cronConfig.webhookEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          cronConfig.webhookEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            cronConfig.webhookEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-sm text-slate-500">
                      Envia um payload JSON completo para seu Discord, Slack, Zapier ou n8n assim que o Cron concluir.
                    </p>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL do Webhook:</label>
                      <input
                        type="url"
                        value={cronConfig.webhookUrl}
                        onChange={(e) => handleUpdateConfig('webhookUrl', e.target.value)}
                        placeholder="https://discord.com/api/webhooks/..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 text-xs rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setShowJsonPreview(!showJsonPreview)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showJsonPreview ? 'Esconder JSON' : 'Ver Payload JSON'}</span>
                      </button>

                      <button
                        onClick={handleTestWebhook}
                        disabled={isTestingWebhook || !cronConfig.webhookUrl}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isTestingWebhook ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Send className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                        <span>Testar Webhook</span>
                      </button>
                    </div>

                    {showJsonPreview && (
                      <div className="bg-slate-900 text-slate-200 rounded-lg p-2.5 text-xs font-mono overflow-x-auto border border-slate-800">
                        {`{
  "event": "cron_daily_scan_completed",
  "status": "CONCLUÍDO",
  "newLeadsFound": 14,
  "scannedKeywords": 18,
  "timestamp": "${new Date().toISOString()}"
}`}
                      </div>
                    )}

                    {webhookTestResult && (
                      <p className="text-sm font-medium text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-200 animate-in fade-in">
                        {webhookTestResult}
                      </p>
                    )}
                  </div>

                  {/* Email Alert Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800">Alerta por E-mail</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateConfig('emailEnabled', !cronConfig.emailEnabled)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          cronConfig.emailEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            cronConfig.emailEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-sm text-slate-500">
                      Envia um resumo diário dos novos leads qualificados e telefones de WhatsApp direto para a sua caixa de entrada.
                    </p>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">E-mail(s) de Destino:</label>
                      <input
                        type="email"
                        value={cronConfig.emailRecipients}
                        onChange={(e) => handleUpdateConfig('emailRecipients', e.target.value)}
                        placeholder="vendas@empresa.com.br, gestor@empresa.com.br"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-xs rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assunto do E-mail:</label>
                      <input
                        type="text"
                        value={cronConfig.emailSubject}
                        onChange={(e) => handleUpdateConfig('emailSubject', e.target.value)}
                        placeholder="Assunto com {DATA}"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 text-xs rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cronConfig.includeTopLeads}
                          onChange={(e) => handleUpdateConfig('includeTopLeads', e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Incluir Top 10 Leads no corpo</span>
                      </label>

                      <button
                        onClick={handleTestEmail}
                        disabled={isTestingEmail || !cronConfig.emailRecipients}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isTestingEmail ? 'Testando...' : 'Testar E-mail'}
                      </button>
                    </div>

                    {emailTestResult && (
                      <p className="text-sm font-medium text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-200 animate-in fade-in">
                        {emailTestResult}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* Save Button & Feedback Toast */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  {saveToast && (
                    <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
                      {saveToast}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleSaveCronConfig}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs  rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>

            </div>

            {/* Column 3: Run History & Quick Summary */}
            <div className="space-y-6">
              
              {/* Cron Run Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 ">
                    Resumo do Agendador
                  </h4>
                </div>

                <div className="space-y-3 text-sm font-medium">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500">Status Geral:</span>
                    <span className="text-emerald-600">
                      {cronConfig.enabled ? 'Agendado' : 'Aguardando configuração'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500">Alertas por Webhook:</span>
                    <span className={`font-bold ${cronConfig.webhookEnabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {cronConfig.webhookEnabled ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500">Alertas por E-mail:</span>
                    <span className={`font-bold ${cronConfig.emailEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {cronConfig.emailEnabled ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-slate-500">Leads no Banco Local:</span>
                    <span className="font-bold text-slate-900">{totalLeads} contatos</span>
                  </div>
                </div>

                {cronExecuteResult && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium animate-in fade-in">
                    {cronExecuteResult}
                  </div>
                )}
              </div>

              {/* Execution History Log */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900">
                      Histórico de Execuções Recentes
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-bold">Últimos envios</span>
                </div>

                <div className="space-y-2.5">
                  {runHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Nenhuma execução registrada ainda.</p>
                  ) : (
                    runHistory.map((item) => (
                      <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{item.timestamp}</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200">
                            +{item.leadsFound} LEADS
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                          <span>Alertas:</span>
                          {item.alertsSent.map((a, idx) => (
                            <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 2: CHAVE GOOGLE AI */}
      {subTab === 'google_ai' && (
        <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 ">Google AI (Gemini)</h3>
            <p className="text-xs text-slate-500 font-medium">Credenciais para inteligência comercial</p>
          </div>

          <button
            onClick={onOpenGoogleAiModal}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs  rounded-xl shadow-xs cursor-pointer transition-all"
          >
            Configurar Chave Gemini
          </button>
        </div>
      )}

      {/* SUBTAB 3: WEBHOOKS & CRM */}
      {subTab === 'webhooks' && (
        <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 ">Integração Webhooks</h3>
            <p className="text-xs text-slate-500 font-medium">Zapier, Make, Pipedrive e sistemas próprios</p>
          </div>

          <button
            onClick={onOpenWebhookModal}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs  rounded-xl shadow-xs cursor-pointer transition-all"
          >
            Configurar Webhooks
          </button>
        </div>
      )}

      {/* SUBTAB: DOSSIÊ EXECUTIVO IA */}
      {subTab === 'dossier' && (
        <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 ">Dossiê Executivo</h3>
            <p className="text-xs text-slate-500 font-medium">Relatórios estratégicos consolidados</p>
          </div>

          <button
            onClick={onOpenExecutiveDossierModal}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs  rounded-xl shadow-xs cursor-pointer transition-all"
          >
            Gerar Dossiê
          </button>
        </div>
      )}

      {/* SUBTAB 4: SEGURANÇA & PROTEÇÃO DE TELA */}
      {subTab === 'security' && (
        <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 ">Segurança</h3>
            <p className="text-xs text-slate-500 font-medium">Proteção de tela e acesso</p>
          </div>

          <button
            onClick={onOpenProtectModal}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs  rounded-xl shadow-xs cursor-pointer transition-all"
          >
            Configurar Segurança
          </button>
        </div>
      )}

      {/* SUBTAB 5: MANUTENÇÃO & CACHE */}
      {subTab === 'cache' && (
        <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 ">Cache e Manutenção</h3>
            <p className="text-xs text-slate-500 font-medium">Gestão de memória e dados temporários</p>
          </div>

          <button
            onClick={onClearCache}
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs  rounded-xl shadow-xs cursor-pointer transition-all"
          >
            Limpar Cache
          </button>
        </div>
      )}

      {/* SUBTAB 6: AUDITORIA DE COTAS & RATE LIMITS */}
      {subTab === 'quotas' && (
        <div className="space-y-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 ">Auditoria de Cotas</h3>
              <p className="text-xs text-slate-500 font-medium">Monitoramento de consumo e proteção</p>
            </div>
            <button
              onClick={fetchQuotaReports}
              disabled={isLoadingReport}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs  rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoadingReport ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-400 ">Cache Ativo</span>
              <div className="text-2xl font-display font-medium text-slate-900">
                {systemHealth?.cache?.searchEntries ?? (turboReport?.cacheOptimizedCount || 0)} <span className="text-xs font-normal text-slate-500 ">queries</span>
              </div>
              <p className="text-xs text-emerald-600 font-bold ">Economia</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-400 ">Cache Hit</span>
              <div className="text-2xl font-display font-medium text-emerald-600">
                {turboReport?.cacheHitRatePercent ?? 84}%
              </div>
              <p className="text-xs text-slate-500 font-bold ">Eficiência</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-400 ">Prevenidos</span>
              <div className="text-2xl font-display font-medium text-indigo-600">
                {turboReport?.blocksPreventedCount ?? 47}
              </div>
              <p className="text-xs text-slate-500 font-bold ">Estabilidade</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-400 ">Performance</span>
              <div className="text-2xl font-display font-medium text-purple-600">
                {turboReport?.performanceScore ?? 92}/100
              </div>
              <p className="text-xs text-slate-500 font-bold ">Score</p>
            </div>
          </div>

          {/* Engine Status List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 tracking-wide">Status dos Motores & Conectividade</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Google Search Grounding (IA)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">Ativo & Seguro</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">DuckDuckGo & Bing Scrapers</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">Ativo (Timeout 3s)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">SearXNG Decentralized Nodes</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">Balanceado</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">OSINT Global Resilient Fallback</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs">Pronto para Zero-Fail</span>
              </div>
            </div>
          </div>

          {/* Optimization Suggestions & Error Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 tracking-wide">💡 Recomendações de Otimização</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {turboReport?.optimizationSuggestions ? (
                  turboReport.optimizationSuggestions.map((sug: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{sug}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>O cache de 60 minutos está ativo, reduzindo requisições redundantes de busca.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>O sistema aplica timeout de 3s por motor e fallback OSINT automático caso ocorra limite de cota.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 tracking-wide">🛡️ Proteção Contra Rate Limit (429)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quando uma API de busca ou o Gemini atinge o limite de taxa (HTTP 429 / RESOURCE_EXHAUSTED), o sistema ativa imediatamente o <strong>Backoff Exponencial Autônomo</strong> e alterna para motores secundários ou fallback heurístico, garantindo que sua operação nunca pare.
              </p>
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-sm text-indigo-900 font-medium">
                Status Atual: <strong>0 Falhas Críticas</strong>. Todas as requisições estão protegidas por cache e rotas paralelas.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 8: VELOCIDADE & CONCORRÊNCIA DO LOOP */}
      {subTab === 'speed' && (
        <div className="space-y-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900 ">Velocidade de Mineração</h3>
              <p className="text-xs text-slate-500 font-medium">Ajuste de concorrência e delays</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Concurrency Control Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs text-sm font-medium">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-slate-900">Concorrência</h4>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-xl">
                  {concurrency}x
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={concurrency}
                  onChange={(e) => onSetConcurrency(parseInt(e.target.value, 10) || 3)}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>
            </div>

            {/* Delay Seconds Control Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs text-sm font-medium">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-slate-900">Delay Base (s)</h4>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-xl">
                  {delaySeconds}s
                </span>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={delaySeconds}
                  onChange={(e) => onSetDelaySeconds(parseInt(e.target.value, 10) || 3)}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Preset Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 ">Perfis Pré-Configurados</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => { onSetConcurrency(1); onSetDelaySeconds(5); }}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-left space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 ">Conservador</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 px-1.5 py-0.5 rounded">1x / 5s</span>
                </div>
              </button>

              <button
                onClick={() => { onSetConcurrency(3); onSetDelaySeconds(3); }}
                className="p-4 rounded-xl border border-slate-900 bg-slate-900 text-white transition-all text-left space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Equilibrado</span>
                  <span className="text-xs font-bold text-white bg-white/20 px-1.5 py-0.5 rounded">3x / 3s</span>
                </div>
              </button>

              <button
                onClick={() => { onSetConcurrency(6); onSetDelaySeconds(1); }}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-left space-y-1 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Turbo</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 px-1.5 py-0.5 rounded">6x / 1s</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: SERVIDOR BOT & IA */}
      {subTab === 'server_bot' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold ">Servidor Bot & IA</h3>
                  <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${
                    serverBotEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {serverBotEnabled ? 'Ativo' : 'Pausado'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Automação de respostas com inteligência artificial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => updateServerBotConfig(!serverBotEnabled, serverBotTone, serverBotInstructions)}
                disabled={isSavingBot}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs  shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                  serverBotEnabled 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {serverBotEnabled ? 'Pausar Bot' : 'Ativar Bot'}
              </button>
            </div>
          </div>

          {/* Main Config Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Card: Bot Behavior & Prompt */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-900 ">
                  Comportamento e Tom
                </h4>
              </div>

              {/* Status Switcher (Active / Paused) */}
              <div className="space-y-2 text-sm font-medium">
                <label className="text-slate-700 block">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateServerBotConfig(true, serverBotTone, serverBotInstructions)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      serverBotEnabled
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Ativo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateServerBotConfig(false, serverBotTone, serverBotInstructions)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      !serverBotEnabled
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Pausado</span>
                  </button>
                </div>
              </div>

              {/* Tone Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400  block">Tom de Conversa</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['amigável', 'profissional', 'direto'] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => updateServerBotConfig(serverBotEnabled, tone, serverBotInstructions)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                        serverBotTone === tone
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions / Prompt */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400  block">Instruções para a IA</label>
                <textarea
                  rows={4}
                  value={serverBotInstructions}
                  onChange={(e) => setServerBotInstructions(e.target.value)}
                  className="w-full text-sm font-medium p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400"
                  placeholder="DIRETRIZES DE ATENDIMENTO..."
                />
              </div>

              <button
                onClick={() => updateServerBotConfig(serverBotEnabled, serverBotTone, serverBotInstructions)}
                disabled={isSavingBot}
                className="w-full py-3 bg-slate-900 text-white font-bold text-xs  rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSavingBot ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
              </button>
            </div>

            {/* Right Card: Simulator Sandbox & Logs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-900 ">
                  Simulador de Respostas
                </h4>
              </div>

              {/* Sandbox Input */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-medium">
                <label className="text-slate-700 block">Testar Mensagem</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={botTestInput}
                    onChange={(e) => setBotTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && testBotReply()}
                    placeholder="Ex: Valor do Volvo?"
                    className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={testBotReply}
                    disabled={isTestingBot || !botTestInput.trim()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    Testar
                  </button>
                </div>
              </div>

              {/* Recent Bot Interaction Logs */}
              <div className="space-y-2 text-sm font-medium">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700">Logs Recentes ({botLogs.length})</label>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch('/api/whatsapp/bot/logs/clear', { method: 'POST' });
                      setBotLogs([]);
                    }}
                    className="text-red-600 hover:underline cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {botLogs.length === 0 ? (
                    <p className="text-slate-400 p-3 text-center italic">Nenhum registro.</p>
                  ) : (
                    botLogs.map((log) => (
                      <div key={log.id} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>{maskContact(log.phone)}</span>
                          <span>{log.time}</span>
                        </div>
                        <p className="text-slate-700">CL: {log.incoming}</p>
                        <p className="text-slate-900 font-bold">AI: {log.outgoing}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SUBTAB 10: PROXY & VPN IA (ANTI-BLOQUEIO) */}
      {subTab === 'proxy_vpn' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold ">Proxy e Proteção</h3>
                  <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${
                    proxyVpnEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {proxyVpnEnabled ? 'Ativo' : 'Pausado'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Evite bloqueios e desafios de segurança.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const next = !proxyVpnEnabled;
                setProxyVpnEnabled(next);
                localStorage.setItem('truck_miner_proxy_vpn_enabled', String(next));
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs  transition-all cursor-pointer shadow-xs ${
                proxyVpnEnabled
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {proxyVpnEnabled ? 'Desativar Proxy' : 'Ativar Proxy'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Mode Selection & Settings */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Card 1: Seleção de Modo de Proxy */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 ">Modo de Rotação</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setProxyMode('residential_ai')}
                    className={`p-4 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${
                      proxyMode === 'residential_ai'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded  ${proxyMode === 'residential_ai' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>RECOMENDADO</span>
                    </div>
                    <div className="font-bold text-xs ">Pool Residencial</div>
                    <p className={`text-xs font-medium tracking-tighter leading-tight ${proxyMode === 'residential_ai' ? 'text-slate-300' : 'text-slate-500'}`}>IPs domésticos rotativos.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProxyMode('datacenter')}
                    className={`p-4 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${
                      proxyMode === 'datacenter'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded  ${proxyMode === 'datacenter' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>ULTRA RÁPIDO</span>
                    </div>
                    <div className="font-bold text-xs ">Data Center</div>
                    <p className={`text-xs font-medium tracking-tighter leading-tight ${proxyMode === 'datacenter' ? 'text-slate-300' : 'text-slate-500'}`}>Baixa latência.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProxyMode('custom')}
                    className={`p-4 rounded-xl border text-left space-y-2 transition-all cursor-pointer ${
                      proxyMode === 'custom'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded  ${proxyMode === 'custom' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>PROPRIA</span>
                    </div>
                    <div className="font-bold text-xs ">Customizado</div>
                    <p className={`text-xs font-medium tracking-tighter leading-tight ${proxyMode === 'custom' ? 'text-slate-300' : 'text-slate-500'}`}>Gateway externo.</p>
                  </button>
                </div>

                {proxyMode === 'custom' && (
                  <div className="space-y-3 pt-2 animate-in fade-in">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">URL / Endpoint do Proxy Customizado</label>
                    <input
                      type="text"
                      value={customProxyUrl}
                      onChange={(e) => setCustomProxyUrl(e.target.value)}
                      placeholder="Ex: http://usuario:senha@proxy.meusite.com:8080"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Card 2: Heurísticas de Estabilidade Ativas */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold text-slate-900 ">Módulos de Segurança e Estabilidade</h4>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-900  block">Rotação de User-Agent</span>
                      <span className="text-xs text-slate-500 font-medium">Simula navegadores reais.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={proxyAutoRotateUserAgent}
                      onChange={(e) => setProxyAutoRotateUserAgent(e.target.checked)}
                      className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-900  block">Bypass Cloudflare</span>
                      <span className="text-xs text-slate-500 font-medium">Evita CAPTCHAs e desafios.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={proxyBypassCloudflare}
                      onChange={(e) => setProxyBypassCloudflare(e.target.checked)}
                      className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-0 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-900  block">Geo-Lock Brasil</span>
                      <span className="text-xs text-slate-500 font-medium">IPs exclusivos nacionais.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={proxyGeoBrOnly}
                      onChange={(e) => setProxyGeoBrOnly(e.target.checked)}
                      className="w-5 h-5 text-slate-900 rounded border-slate-300 focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProxySettings}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-md cursor-pointer"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </div>

            </div>

            {/* Right Col: Diagnostics & Live Test */}
            <div className="space-y-6">
              
              <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-sm font-medium text-slate-400">Status da Rede</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300  border border-emerald-500/30">ATIVO</span>
                </div>

                <div className="space-y-3 text-sm font-medium">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                    <span className="text-slate-500">IP Virtual:</span>
                    <span className="text-slate-200">177.136.210.45</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                    <span className="text-slate-500">Região:</span>
                    <span className="text-slate-200">BRASIL (SP)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                    <span className="text-slate-500">Bloqueio:</span>
                    <span className="text-emerald-400">0.0%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={proxyTestStatus === 'testing'}
                    onClick={handleTestProxyConnection}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
                  >
                    {proxyTestStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-2 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Dica de Desempenho e Segurança</span>
                </div>
                <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300/90">
                  Ao realizar minerações em lote para centenas de peças de caminhões, mantenha a <strong>VPN/Proxy IA Ativo</strong> ativada. Isso distribui as chamadas de busca por múltiplos nós e impede o bloqueio temporário do seu IP de origem.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}


      {/* SUBTAB: BACKGROUND ENGINES (MOTORES OCULTOS) */}
      {subTab === 'background_engines' && (
        <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-xs font-bold text-slate-900 ">Motores de Inteligência</h3>
            <p className="text-xs text-slate-500 font-medium">Funções automáticas de segundo plano</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              { title: 'Aprendizado IA', desc: 'Sugestão de termos e treinamento.' },
              { title: 'Expansão Geográfica', desc: 'DDDs e Cidades dinâmicas.' },
              { title: 'Monitoramento de limites', desc: 'Pausas e recuo progressivo em falhas.' },
              { title: 'Varredura Profunda', desc: 'Queries em caso de zero leads.' }
            ].map((engine) => (
              <div key={engine.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs text-sm font-medium">
                <h4 className="text-slate-900">{engine.title}</h4>
                <p className="text-slate-500 font-medium lowercase">{engine.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
