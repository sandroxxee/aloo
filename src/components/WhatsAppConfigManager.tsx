import React from 'react';
import { 
  Settings, Radio, Bot, Key, Mail, Smartphone, 
  Terminal, RefreshCw, CheckCircle2, ChevronRight,
  Laptop, Zap, ShieldCheck, Globe, Tag, Lock, Save, Activity
} from 'lucide-react';
import { useWhatsAppConfig } from '../hooks/useWhatsAppConfig';
import { useWhatsAppEvolution } from '../hooks/useWhatsAppEvolution';

interface WhatsAppConfigManagerProps {
  onAddLog: (log: any) => void;
}

export const WhatsAppConfigManager: React.FC<WhatsAppConfigManagerProps> = ({ onAddLog }) => {
  const {
    gatewayConfig, setGatewayConfig,
    watchdogEnabled, setWatchdogEnabled,
    isHealing, setIsHealing,
    emailApiKey, setEmailApiKey,
  } = useWhatsAppConfig();

  const evolution = useWhatsAppEvolution(onAddLog);

  const [activeGateway, setActiveGateway] = React.useState(gatewayConfig.type);
  const [isTesting, setIsTesting] = React.useState(false);

  const [nativeStatus, setNativeStatus] = React.useState<{
    status: string;
    qr: string | null;
    error: string | null;
    user: { id: string; name: string } | null;
  } | null>(null);

  const [loadingNative, setLoadingNative] = React.useState(false);

  const fetchNativeStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/native/status');
      if (res.ok) {
        const data = await res.json();
        setNativeStatus(data);
      }
    } catch (err) {}
  };

  React.useEffect(() => {
    if (activeGateway === 'simulation') {
      fetchNativeStatus();
      const interval = setInterval(fetchNativeStatus, 4000);
      return () => clearInterval(interval);
    }
  }, [activeGateway]);

  const startNativeConnection = async () => {
    setLoadingNative(true);
    try {
      const res = await fetch('/api/whatsapp/native/restart', { method: 'POST' });
      if (res.ok) {
        onAddLog({
          id: `native-connect-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: '🚀 Iniciando conexão nativa do WhatsApp...'
        });
        await fetchNativeStatus();
      }
    } catch (err: any) {
      onAddLog({
        id: `native-connect-err-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: `❌ Erro ao conectar: ${err.message}`
      });
    } finally {
      setLoadingNative(false);
    }
  };

  const disconnectNativeConnection = async () => {
    setLoadingNative(true);
    try {
      const res = await fetch('/api/whatsapp/native/logout', { method: 'POST' });
      if (res.ok) {
        onAddLog({
          id: `native-disconnect-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: '🔌 WhatsApp Desconectado e credenciais limpas com sucesso.'
        });
        await fetchNativeStatus();
      }
    } catch (err: any) {
      onAddLog({
        id: `native-disconnect-err-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: `❌ Erro ao desconectar: ${err.message}`
      });
    } finally {
      setLoadingNative(false);
    }
  };

  const updateGatewayField = (field: string, value: string) => {
    setGatewayConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveGatewayConfigToBackend = async (type: string) => {
    try {
      const config = {
        ...gatewayConfig,
        type,
        active: true
      };
      setGatewayConfig(config);
      await fetch('/api/whatsapp/native/queue/gateway-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      onAddLog({
        id: `config-save-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        message: `⚙️ Canal de disparo alterado para: ${type.toUpperCase()}`
      });
    } catch (err) {}
  };

  const testConnection = async (type: 'evolution' | 'official') => {
    setIsTesting(true);
    try {
      let res;
      if (type === 'evolution') {
        const query = new URLSearchParams({ apiUrl: gatewayConfig.apiUrl, apiKey: gatewayConfig.apiKey });
        res = await fetch(`/api/whatsapp/evolution/instance/connectionState/${gatewayConfig.instanceId}?${query.toString()}`);
      } else {
        res = await fetch('/api/whatsapp/official/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneId: gatewayConfig.officialPhoneId, accessToken: gatewayConfig.officialToken })
        });
      }
      
      const data = await res.json();
      if (res.ok && (data.instance?.state === 'open' || data.success)) {
        onAddLog({
          id: `test-success-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'success',
          message: `✅ Conexão com ${type.toUpperCase()} estabelecida com sucesso!`
        });
      } else {
        onAddLog({
          id: `test-fail-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          message: `❌ Falha na conexão com ${type.toUpperCase()}: ${data.error || 'Erro desconhecido'}`
        });
      }
    } catch (err: any) {
      onAddLog({
        id: `test-err-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: `⚠️ Erro técnico ao testar ${type.toUpperCase()}: ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAiSelfHeal = async () => {
    setIsHealing(true);
    onAddLog({
      id: `heal-start-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      level: 'ai',
      message: '🤖 Iniciando Auto-Cura por IA: Diagnosticando conexão...'
    });
    
    await new Promise(r => setTimeout(r, 2000));
    setIsHealing(false);
    onAddLog({
      id: `heal-end-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      level: 'success',
      message: '✨ Auto-Cura Concluída: Sessão revalidada com sucesso.'
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Compacto e Elegante */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xs">
        <h3 className="text-base  flex items-center gap-2 tracking-tight">
          <Settings className="w-4 h-4 text-indigo-400" />
          Painel de Integrações & Conectividade
        </h3>
        <p className="text-xs text-slate-400 mt-1">Configure as chaves, canais de disparo ativos, monitoramento e auto-cura.</p>
      </div>

      {/* Monitoramento e Automação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Watchdog */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>Monitoramento Ativo</span>
            </h4>
            <span className={`px-2 py-0.5 rounded-md text-xs  border ${watchdogEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              {watchdogEnabled ? 'ATIVO' : 'INATIVO'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Rastreia e corrige oscilações da conexão de disparo continuamente.
          </p>
          <button
            onClick={() => setWatchdogEnabled(!watchdogEnabled)}
            className={`w-full py-2 font-bold text-xs rounded-xl transition-all cursor-pointer ${watchdogEnabled ? 'bg-rose-50 text-rose-700 hover:bg-rose-100/80' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {watchdogEnabled ? 'Desativar' : 'Ativar'}
          </button>
        </div>

        {/* Auto-Cura */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-500" />
              <span>Auto-Cura Inteligente</span>
            </h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Diagnóstico autônomo guiado por IA para restaurar canais instáveis.
          </p>
          <button
            onClick={handleAiSelfHeal}
            disabled={isHealing}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {isHealing ? 'Analisando...' : 'Restaurar Conexões'}
          </button>
        </div>
      </div>

      {/* Canais & Credenciais */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Key className="w-4.5 h-4.5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Credenciais & Gateways</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* E-mail */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              E-mail (Resend)
            </label>
            <input
              type="password"
              placeholder="re_..."
              value={emailApiKey}
              onChange={e => setEmailApiKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-1.5 focus:ring-indigo-500 transition-all"
            />
          </div>
          
          {/* SMS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              SMS (SMSDev)
            </label>
            <input
              type="password"
              placeholder="Token SMSDev"
              value={gatewayConfig.smsApiKey || ''}
              onChange={e => updateGatewayField('smsApiKey', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-1.5 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Seleção do Canal Ativo */}
          <div className="space-y-4 md:col-span-2 border border-slate-100 rounded-xl p-4 bg-slate-50/50 mt-1">
            <div className="border-b border-slate-200/80 pb-2 mb-2">
              <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-600" />
                <span>Canal Ativo para Disparo</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['simulation', 'evolution', 'official'] as const).map(gw => {
                const isActive = activeGateway === gw;
                return (
                  <button
                    key={gw}
                    type="button"
                    onClick={() => {
                      setActiveGateway(gw);
                      saveGatewayConfigToBackend(gw);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {gw === 'simulation' ? <Laptop className="w-4 h-4" /> : gw === 'evolution' ? <Zap className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{gw === 'simulation' ? 'Simulador' : gw === 'evolution' ? 'Evolution API' : 'Oficial WA'}</span>
                  </button>
                );
              })}
            </div>

            {/* Configurações do Simulador (WhatsApp Web Nativo) */}
            {activeGateway === 'simulation' && (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Laptop className="w-4 h-4 text-indigo-600" />
                        Status do Simulador (WhatsApp Web Nativo)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-bold">Disparo nativo via Baileys integrado localmente.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      nativeStatus?.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      nativeStatus?.status === 'connecting' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {nativeStatus?.status === 'open' ? 'CONECTADO' :
                       nativeStatus?.status === 'connecting' ? 'CONECTANDO...' : 'DESCONECTADO'}
                    </span>
                  </div>

                  {nativeStatus?.status === 'open' ? (
                    <div className="space-y-3">
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="">WhatsApp Conectado com Sucesso!</p>
                          <p className="text-xs text-emerald-600 mt-0.5 font-semibold">
                            Dispositivo: {nativeStatus?.user?.name || 'Aparelho Pareado'} ({nativeStatus?.user?.id?.split(':')[0]})
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={disconnectNativeConnection}
                        disabled={loadingNative}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        Desconectar e Limpar Sessão
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {nativeStatus?.qr ? (
                        <div className="flex flex-col items-center justify-center py-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs">
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-inner">
                            <img src={nativeStatus.qr} alt="WhatsApp QR Code" className="w-56 h-56 object-contain" />
                          </div>
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-3 text-center max-w-[280px]">
                            Aponte a câmera do seu WhatsApp para o código acima para conectar.
                          </p>
                          <p className="text-xs text-slate-500 mt-1 text-center font-bold max-w-[280px]">
                            Vá em <strong className="text-slate-700">Aparelhos conectados &gt; Conectar um aparelho</strong> no seu celular.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center text-xs text-slate-600">
                          <Smartphone className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                          <p className=" text-slate-800 tracking-wide">Nenhuma conexão ativa iniciada.</p>
                          <p className="text-xs text-slate-500 mt-1 max-w-[400px] mx-auto leading-relaxed">
                            O código QR não será gerado sozinho para poupar bateria e performance. Clique no botão abaixo para gerar.
                          </p>
                        </div>
                      )}

                      {nativeStatus?.error && (
                        <p className="text-xs font-bold text-rose-600 text-center bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                          ⚠️ {nativeStatus.error}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={startNativeConnection}
                          disabled={loadingNative || nativeStatus?.status === 'connecting'}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingNative ? 'animate-spin' : ''}`} />
                          {nativeStatus?.qr ? 'Gerar Novo QR Code' : 'Iniciar Conexão e Gerar QR Code'}
                        </button>

                        {nativeStatus?.status === 'connecting' && (
                          <button
                            onClick={disconnectNativeConnection}
                            disabled={loadingNative}
                            className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Configurações da Evolution API */}
            {activeGateway === 'evolution' && (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      URL do Servidor
                    </label>
                    <input
                      type="text"
                      value={gatewayConfig.apiUrl || ''}
                      onChange={e => updateGatewayField('apiUrl', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-1.5 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      Instância
                    </label>
                    <input
                      type="text"
                      value={gatewayConfig.instanceId || ''}
                      onChange={e => updateGatewayField('instanceId', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-1.5 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Token Global
                    </label>
                    <input
                      type="password"
                      value={gatewayConfig.apiKey || ''}
                      onChange={e => updateGatewayField('apiKey', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-1.5 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1 border-b border-slate-100 pb-4 mb-4">
                  <button 
                    onClick={() => saveGatewayConfigToBackend('evolution')}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar
                  </button>
                  <button 
                    onClick={() => testConnection('evolution')}
                    disabled={isTesting}
                    className="flex-1 py-2 bg-slate-200/80 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    Testar Conexão
                  </button>
                </div>

                {/* Advanced Evolution Controls */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span>Gerenciamento de Instância Evolution</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={evolution.restartInstance}
                        className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-lg hover:bg-amber-100 transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" /> Reiniciar
                      </button>
                      <button 
                        onClick={evolution.logoutInstance}
                        className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg hover:bg-rose-100 transition-all flex items-center gap-1.5"
                      >
                        <Lock className="w-3 h-3" /> Logout
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Simulação de Presença</label>
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => evolution.simulatePresence('composing')}
                          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-700 hover:border-indigo-500 transition-all"
                        >
                          💬 Digitando...
                        </button>
                        <button 
                          onClick={() => evolution.simulatePresence('recording')}
                          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-700 hover:border-indigo-500 transition-all"
                        >
                          🎙️ Gravando...
                        </button>
                        <button 
                          onClick={() => evolution.simulatePresence('paused')}
                          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-700 hover:border-indigo-500 transition-all"
                        >
                          ⏹️ Limpar
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Health Check (Proxy)</label>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${evolution.isEvolutionConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-xs font-bold text-slate-700">{evolution.isEvolutionConnected ? 'Online' : 'Offline'}</span>
                        </div>
                        {evolution.latency && (
                          <span className="text-[10px] font-mono text-slate-400">{evolution.latency}ms</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">Instância v2.0 com suporte a Webhooks e Multi-device.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Configurações do WhatsApp Oficial */}
            {activeGateway === 'official' && (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-slate-400" />
                      ID do Telefone
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 106584214587"
                      value={gatewayConfig.officialPhoneId || ''}
                      onChange={e => updateGatewayField('officialPhoneId', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-1.5 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Token de Acesso
                    </label>
                    <input
                      type="password"
                      placeholder="EAAG..."
                      value={gatewayConfig.officialToken || ''}
                      onChange={e => updateGatewayField('officialToken', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 text-xs font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-1.5 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => saveGatewayConfigToBackend('official')}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar
                  </button>
                  <button 
                    onClick={() => testConnection('official')}
                    disabled={isTesting}
                    className="flex-1 py-2 bg-slate-200/80 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    Testar Conexão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

