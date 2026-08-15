import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Copy, 
  AlertCircle, 
  Clock, 
  Terminal, 
  Key, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Save, 
  CheckCircle2, 
  Database,
  Activity,
  Settings
} from 'lucide-react';
import { useWhatsAppConfig } from '../hooks/useWhatsAppConfig';

interface WebhookConfig {
  enabled: boolean;
  url: string;
  secretToken: string;
  filterRule: 'ALL' | 'HIGH_INTENT_ONLY' | 'HOT_QUALIFIED_ONLY';
  platformName: string;
}

interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  leadItem: string;
  url: string;
  status: number;
  success: boolean;
  durationMs: number;
  responseSnippet?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PLATFORMS = [
  { name: 'n8n Workflow', defaultUrl: '', placeholder: 'https://n8n.suaempresa.com/webhook/truck-lead' },
  { name: 'RD Station CRM', defaultUrl: '', placeholder: 'https://api.rd.services/platform/conversions' },
  { name: 'HubSpot CRM', defaultUrl: '', placeholder: 'https://api.hubapi.com/crm/v3/objects/contacts' },
  { name: 'Make / Zapier', defaultUrl: '', placeholder: 'https://hook.eu1.make.com/xxxxxxxxx' },
  { name: 'Typebot / WhatsApp', defaultUrl: '', placeholder: 'https://typebot.io/api/v1/typebots/xxx/webhook' },
  { name: 'Webhook Genérico', defaultUrl: '', placeholder: 'https://seu-servidor.com/api/leads' },
];

export const WebhookConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  // Configurações Globais do Gateway de Disparo (Evolution API / Official)
  const { gatewayConfig, setGatewayConfig } = useWhatsAppConfig();

  // Configurações de Webhook (Envio Externo de Leads)
  const [config, setConfig] = useState<WebhookConfig>({
    enabled: true,
    url: '',
    secretToken: '',
    filterRule: 'HIGH_INTENT_ONLY',
    platformName: 'n8n Workflow',
  });

  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Abas e Seleções
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'LOGS' | 'PAYLOAD'>('SETTINGS');
  const [masterTab, setMasterTab] = useState<'WEBHOOK' | 'EVOLUTION'>('WEBHOOK');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Estados de Teste de Conexão da Evolution API (Ping)
  const [pingStatus, setPingStatus] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
    latency?: number;
    state?: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      fetchLogs();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/webhook/config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Erro ao carregar configuracoes de webhook:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhook/logs');
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Erro ao buscar logs de webhook:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/webhook/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        localStorage.setItem('truck_miner_webhook_config', JSON.stringify(config));
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao salvar webhook:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!config.url) {
      setTestResult({ success: false, message: 'Insira uma URL de Webhook válida antes de testar.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const testLead = {
      id: `lead_test_${Date.now()}`,
      item: 'Volvo FH 540 6x2 Globetrotter 2022',
      price: '480000',
      location: 'Curitiba (PR)',
      stateUf: 'PR',
      sellerType: 'Particular',
      intent: 'COMPRA',
      qualification: 'HOT',
      whatsappNumber: '5541999887766',
      whatsappStatus: 'VALIDO',
      rawText: 'Compro Volvo FH 540 ano 2021/2022 pagamento à vista e retirada imediata.',
      sourcePlatform: 'OLX / WhatsApp Group',
      url: 'https://olx.com.br/autos-e-pecas/caminhoes/volvo-fh540-test',
      minedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/webhook/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: testLead,
          eventType: 'lead.classified.test',
          overrideConfig: config,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Webhook disparado com sucesso! Código HTTP ${data.status || 200}. Verifique seu CRM.`,
        });
        fetchLogs();
      } else {
        setTestResult({
          success: false,
          message: `Falha no envio: ${data.error || data.reason || 'Erro desconhecido'}`,
        });
        fetchLogs();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Erro na comunicação com o servidor: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  // Funções de Gerenciamento da Evolution API Gateway
  const updateGatewayField = (field: string, value: string) => {
    setGatewayConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handlePingEvolution = async () => {
    const { apiUrl, apiKey, instanceId } = gatewayConfig;
    if (!apiUrl || !apiKey || !instanceId) {
      setPingStatus({
        status: 'error',
        message: 'Preencha a URL, a Chave de API e o ID da Instância antes de pingar.',
      });
      return;
    }

    setPingStatus({ status: 'testing', message: 'Enviando pacote ICMP/HTTP ping para o gateway...' });
    const startTime = Date.now();

    try {
      const query = new URLSearchParams({ apiUrl, apiKey });
      const res = await fetch(`/api/whatsapp/evolution/instance/connectionState/${instanceId}?${query.toString()}`);
      const latency = Date.now() - startTime;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setPingStatus({
          status: 'error',
          message: `Falha de conexão (HTTP ${res.status}): ${errorData.error || 'Gateway inalcançável'}`,
          latency,
        });
        return;
      }

      const data = await res.json();
      const state = data.instance?.state;

      if (state === 'open') {
        setPingStatus({
          status: 'success',
          message: `Sucesso! Gateway conectado e ativo. Prontidão total de disparos comerciais.`,
          latency,
          state,
        });
      } else {
        setPingStatus({
          status: 'error',
          message: `Alcançável, mas a instância está em estado '${state || 'desconhecido'}'. Leia o QR Code no painel settings.`,
          latency,
          state,
        });
      }
    } catch (err: any) {
      setPingStatus({
        status: 'error',
        message: `Falha de rede: ${err.message}. Verifique a URL do endpoint.`,
      });
    }
  };

  const handleSaveEvolution = async () => {
    setLoading(true);
    setSavedSuccess(false);
    try {
      const updatedConfig = {
        ...gatewayConfig,
        type: 'evolution',
        active: true,
      };
      setGatewayConfig(updatedConfig);

      // Sincroniza com o backend do disparador nativo em segundo plano
      const res = await fetch('/api/whatsapp/native/queue/gateway-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Falha ao sincronizar as configurações com a fila nativa.');
      }
    } catch (err: any) {
      alert(`Erro técnico ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const samplePayloadJson = `{
  "event": "lead.classified",
  "timestamp": "2026-07-30T14:55:00.000Z",
  "source": "Heavy Vehicles Asset Hub",
  "lead": {
    "id": "lead_982310_01",
    "item": "Scania R450 6x2 Streamline 2020",
    "price": "390000",
    "location": "Campinas (SP)",
    "stateUf": "SP",
    "sellerType": "Lojista",
    "intent": "COMPRA",
    "qualification": "HOT",
    "whatsappNumber": "5519987654321",
    "whatsappStatus": "VALIDO",
    "rawText": "Procuro Scania R450 em SP com menos de 500mil km. Tenho sinal pronto.",
    "sourcePlatform": "Mercado Livre",
    "url": "https://veiculos.mercadolivre.com.br/scania-r450",
    "minedAt": "2026-07-30T14:50:00.000Z"
  }
}`;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(samplePayloadJson);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900  flex items-center gap-2">
              Integração de Saída & Disparos
              <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-300 ">
                AUTOMATION
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Configure canais de webhook ou o gateway Evolution API</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center transition-colors cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Master Selector - Webhook vs Evolution API */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMasterTab('WEBHOOK');
              setSavedSuccess(false);
            }}
            className={`py-3 text-xs font-bold  rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              masterTab === 'WEBHOOK'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Webhook (CRM / n8n)
          </button>
          <button
            type="button"
            onClick={() => {
              setMasterTab('EVOLUTION');
              setSavedSuccess(false);
            }}
            className={`py-3 text-xs font-bold  rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              masterTab === 'EVOLUTION'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            Gateway Evolution API
          </button>
        </div>

        {/* SECTION 1: WEBHOOK SYSTEM */}
        {masterTab === 'WEBHOOK' && (
          <div className="space-y-4">
            {/* Tab Navigation for Webhook */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('SETTINGS')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'SETTINGS' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Configuração
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('LOGS')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'LOGS' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Histórico ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PAYLOAD')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'PAYLOAD' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                JSON
              </button>
            </div>

            {/* TAB 1: WEBHOOK SETTINGS */}
            {activeTab === 'SETTINGS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <span>Status do Envio Externo</span>
                      {config.enabled ? (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          ATIVO
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                          PAUSADO
                        </span>
                      )}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Plataforma Destino
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_PLATFORMS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setConfig({ ...config, platformName: preset.name })}
                        className={`p-2.5 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${
                          config.platformName === preset.name
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    URL de Destino (Endpoint)
                  </label>
                  <input
                    type="url"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://n8n.suaempresa.com/webhook/truck-lead"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Token (Opcional)
                  </label>
                  <input
                    type="password"
                    value={config.secretToken}
                    onChange={(e) => setConfig({ ...config, secretToken: e.target.value })}
                    placeholder="Ex: secret_token_xyz"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Regra de Envio</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, filterRule: 'HIGH_INTENT_ONLY' })}
                      className={`p-3 rounded-2xl border text-left text-sm font-medium transition-all cursor-pointer ${
                        config.filterRule === 'HIGH_INTENT_ONLY'
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🎯 COMPRA
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, filterRule: 'HOT_QUALIFIED_ONLY' })}
                      className={`p-3 rounded-2xl border text-left text-sm font-medium transition-all cursor-pointer ${
                        config.filterRule === 'HOT_QUALIFIED_ONLY'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🔥 HOT LEADS
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, filterRule: 'ALL' })}
                      className={`p-3 rounded-2xl border text-left text-sm font-medium transition-all cursor-pointer ${
                        config.filterRule === 'ALL'
                          ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ⚡ TODOS
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
                    testResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}>
                    {testResult.success ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span className="font-semibold">{testResult.message}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: WEBHOOK LOGS */}
            {activeTab === 'LOGS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Histórico de Disparos</span>
                  <button
                    type="button"
                    onClick={fetchLogs}
                    className="text-sm font-medium text-indigo-600 hover:underline cursor-pointer"
                  >
                    Atualizar Logs
                  </button>
                </div>

                {logs.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-slate-500 text-xs">
                    <Clock className="w-6 h-6 mx-auto text-slate-400" />
                    <p className="font-semibold">Nenhum evento de webhook registrado ainda.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3 text-xs bg-white hover:bg-slate-50 transition-colors space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              log.success ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}>
                              HTTP {log.status || 'ERR'}
                            </span>
                            <strong className="text-slate-900 truncate max-w-[200px] sm:max-w-xs">{log.leadItem}</strong>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString('pt-BR')} • {log.durationMs}ms
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-500 font-mono truncate">
                          <span className="truncate">{log.url}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PAYLOAD PREVIEW */}
            {activeTab === 'PAYLOAD' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Mapeamento do Objeto de Saída</span>
                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayload ? 'Copiado!' : 'Copiar Exemplo'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl border border-slate-800 max-h-64 overflow-y-auto whitespace-pre leading-relaxed shadow-inner">
                  {samplePayloadJson}
                </div>
              </div>
            )}

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Configurações do Webhook salvas no servidor!</span>
              </div>
            )}

            {/* Footer Control Bar for Webhook */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testing || !config.url}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl cursor-pointer transition-all disabled:opacity-50"
              >
                {testing ? 'Testando...' : 'Testar Webhook'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl cursor-pointer shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: EVOLUTION API GATEWAY CONFIG */}
        {masterTab === 'EVOLUTION' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl h-fit">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-950">Gateway Oficial de Envio Massivo</h4>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  A Evolution API permite que você integre uma instância em nuvem do WhatsApp para realizar milhares de disparos humanizados em lote sem o risco de gargalos no navegador.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* API URL endpoint */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  Evolution API Endpoint (URL)
                </label>
                <input
                  type="url"
                  value={gatewayConfig.apiUrl || ''}
                  onChange={(e) => updateGatewayField('apiUrl', e.target.value)}
                  placeholder="Ex: https://api.suaevolution.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>

              {/* Instance name / ID */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5 text-emerald-600" />
                  ID da Instância (Instance Name)
                </label>
                <input
                  type="text"
                  value={gatewayConfig.instanceId || ''}
                  onChange={(e) => updateGatewayField('instanceId', e.target.value)}
                  placeholder="Ex: zap_asset_intel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>

              {/* API token / global key */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  Token de API (Global API Key)
                </label>
                <input
                  type="password"
                  value={gatewayConfig.apiKey || ''}
                  onChange={(e) => updateGatewayField('apiKey', e.target.value)}
                  placeholder="Chave Global de Autenticação da API"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Ping validation feedback container */}
            {pingStatus.status !== 'idle' && (
              <div className={`p-4 rounded-2xl border text-xs flex flex-col gap-2 transition-all animate-fadeIn ${
                pingStatus.status === 'testing'
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : pingStatus.status === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center gap-2.5">
                  {pingStatus.status === 'testing' ? (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  ) : pingStatus.status === 'success' ? (
                    <Wifi className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-bold text-sm">
                    {pingStatus.status === 'testing' ? 'PROCESSANDO PING...' : pingStatus.status === 'success' ? 'ONLINE' : 'FALHA DE COMUNICAÇÃO'}
                  </span>
                  {pingStatus.latency !== undefined && (
                    <span className="text-xs px-1.5 py-0.5 bg-slate-200/50 rounded-md font-mono shrink-0 ml-auto text-slate-600">
                      Latência: {pingStatus.latency}ms
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed font-semibold">{pingStatus.message}</p>
                {pingStatus.state && (
                  <div className="text-xs bg-slate-100 px-2 py-1 rounded-lg font-mono text-slate-600 h-fit w-fit ">
                    Estado da Instância: {pingStatus.state}
                  </div>
                )}
              </div>
            )}

            {savedSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Gateway Evolution API salvo e ativado como canal padrão!</span>
              </div>
            )}

            {/* Footer Control Bar for Evolution */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={handlePingEvolution}
                disabled={pingStatus.status === 'testing'}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-xl cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pingStatus.status === 'testing' ? 'animate-spin' : ''}`} />
                Testar Conexão (Ping)
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvolution}
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar & Ativar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
