import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Clock, Send, RefreshCw, 
  Settings, Smartphone, Activity, Sliders,
  Bot, Zap, X, Volume2, Users, Search, ShieldCheck, Loader2, FileText
} from 'lucide-react';
import { Lead } from '../types';

// Direct modular imports to prevent dynamic import failures
import { WhatsAppGroupManager } from './WhatsAppGroupManager';
import { WhatsAppAutoReplyManager } from './WhatsAppAutoReplyManager';
import { WhatsAppCadenceManager } from './WhatsAppCadenceManager';
import { WhatsAppValidatorManager } from './WhatsAppValidatorManager';
import { WhatsAppAntiBlockManager } from './WhatsAppAntiBlockManager';
import { WhatsAppConfigManager } from './WhatsAppConfigManager';
import { WhatsAppCampaignRadar } from './WhatsAppCampaignRadar';
import { WhatsAppLivePreview } from './WhatsAppLivePreview';
import { WhatsAppQueueMonitor } from './WhatsAppQueueMonitor';
import { WhatsAppBroadcastComposer } from './WhatsAppBroadcastComposer';
import { WhatsAppFastTest } from './WhatsAppFastTest';
import { TemplateManager } from './TemplateManager';
import { SelectedLeadsTrackingModal } from './SelectedLeadsTrackingModal';

// Hooks
import { useWhatsAppGroups } from '../hooks/useWhatsAppGroups';
import { useWhatsAppBot } from '../hooks/useWhatsAppBot';
import { useWhatsAppAntiBlock } from '../hooks/useWhatsAppAntiBlock';
import { useWhatsAppConfig } from '../hooks/useWhatsAppConfig';
import { useWhatsAppSender } from '../hooks/useWhatsAppSender';
import { useWhatsAppEvolution } from '../hooks/useWhatsAppEvolution';
import { useTemplateManager } from '../hooks/useTemplateManager';

interface BackgroundAutoSenderProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, statusOrPartial: any) => void;
  onAddLog: (log: any) => void;
}

export const BackgroundAutoSender: React.FC<BackgroundAutoSenderProps> = ({
  leads,
  onUpdateLeadStatus,
  onAddLog
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sender' | 'config' | 'groups' | 'auto_reply' | 'validator' | 'antiblock' | 'templates'>('sender');
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  
  // Custom hook for telemetry logging internal to this component
  const addInternalLog = (log: any) => {
    const newLog = typeof log === 'string' 
      ? { id: `log-${Date.now()}-${Math.random()}`, timestamp: new Date().toLocaleTimeString(), level: 'info', message: log }
      : { id: `log-${Date.now()}-${Math.random()}`, timestamp: new Date().toLocaleTimeString(), ...log };
    
    setTelemetryLogs(prev => [newLog, ...prev].slice(0, 50));
    onAddLog(newLog);
  };

  // Connect Hooks
  const evolution = useWhatsAppEvolution(addInternalLog);
  const sender = useWhatsAppSender();
  const antiblock = useWhatsAppAntiBlock();
  const config = useWhatsAppConfig();
  const groups = useWhatsAppGroups();
  const { templates } = useTemplateManager();
  
  // Refs for background processor access
  const isRunningRef = useRef(sender.isRunning);
  useEffect(() => { isRunningRef.current = sender.isRunning; }, [sender.isRunning]);

  // Derived Metrics
  const validLeads = leads.filter(l => l.whatsappStatus === 'has-whatsapp');
  const pendingLeads = validLeads.filter(l => l.outreachStatus === 'pendente');
  const sentCount = validLeads.filter(l => l.outreachStatus === 'enviado').length;
  const repliedCount = validLeads.filter(l => l.repliedCount && l.repliedCount > 0).length;
  const totalValid = validLeads.length;
  const progressPercent = totalValid > 0 ? Math.round(((totalValid - pendingLeads.length) / totalValid) * 100) : 0;

  // Handlers for sending
  const handleAddAllToQueue = () => {
    addInternalLog({ level: 'info', message: `✅ ${pendingLeads.length} leads adicionados à fila de disparo.` });
  };

  const handleStart = async () => {
    if (pendingLeads.length === 0) {
      alert('Nenhum lead pendente na fila.');
      return;
    }
    
    try {
      addInternalLog({ level: 'info', message: '🚀 Sincronizando fila com o servidor...' });
      
      const response = await fetch('/api/whatsapp/native/queue/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: pendingLeads,
          template: sender.broadcastMessageText,
          messageType: sender.messageType,
          mediaUrl: sender.mediaUrl,
          gatewayConfig: config.gatewayConfig,
          isPTT: sender.usePTTStep2
        })
      });
      
      if (response.ok) {
        sender.setIsRunning(true);
        addInternalLog({ level: 'success', message: '🚀 Disparador em massa iniciado no servidor!' });
      } else {
        const err = await response.json();
        addInternalLog({ level: 'error', message: `❌ Falha ao iniciar: ${err.error || 'Erro no servidor'}` });
      }
    } catch (err: any) {
      addInternalLog({ level: 'error', message: `❌ Erro de conexão: ${err.message}` });
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch('/api/whatsapp/native/queue/pause', {
        method: 'POST'
      });
      if (response.ok) {
        sender.setIsRunning(false);
        addInternalLog({ level: 'warning', message: '⏸️ Disparador pausado no servidor.' });
      }
    } catch (err: any) {
      addInternalLog({ level: 'error', message: `❌ Erro ao pausar: ${err.message}` });
      // Force UI state for safety
      sender.setIsRunning(false);
    }
  };

  const [fastTestPhone, setFastTestPhone] = useState('');
  const [fastTestMessage, setFastTestMessage] = useState('Olá! Teste de Sincronização.');

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 md:p-6 shadow-xs space-y-6 text-slate-800">
      
      {/* 1. TOP HEADER - ALWAYS VISIBLE CONNECTION CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Central de Disparo em Massa
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">Enterprise V3.6</span>
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                {config.gatewayConfig.type === 'simulation' ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-bold text-slate-500">
                      Modo: <span className="text-blue-600">Simulador (OFFLINE)</span>
                    </span>
                  </>
                ) : config.gatewayConfig.type === 'evolution' ? (
                  <>
                    <div className={`w-2 h-2 rounded-full ${evolution.isEvolutionConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-sm font-bold text-slate-500">
                      Status Evolution: <span className={evolution.isEvolutionConnected ? 'text-emerald-600' : 'text-rose-600'}>
                        {evolution.isEvolutionConnected ? 'CONECTADO' : 'DESCONECTADO'}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <div className={`w-2 h-2 rounded-full ${config.gatewayConfig.officialToken ? 'bg-indigo-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-sm font-bold text-slate-500">
                      Status Oficial: <span className={config.gatewayConfig.officialToken ? 'text-indigo-600' : 'text-rose-600'}>
                        {config.gatewayConfig.officialToken ? 'CONFIGURADO' : 'FALTA TOKEN'}
                      </span>
                    </span>
                  </>
                )}
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                <span className="opacity-60">Próximo Envio:</span>
                <span className="text-indigo-600">Agora</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!sender.isRunning ? (
            <button
              onClick={handleStart}
              className="flex-1 lg:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              INICIAR DISPAROS
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex-1 lg:flex-none px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Pause className="w-4 h-4 fill-current" />
              PARAR DISPAROS
            </button>
          )}

          <button
            onClick={() => {
              if (config.gatewayConfig.type === 'evolution') {
                evolution.ensureEvolutionInstanceAndConnect();
              } else {
                setActiveSubTab('config');
              }
            }}
            className="flex-1 lg:flex-none px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            {config.gatewayConfig.type === 'evolution' ? 'CONECTAR EVO' : 'CONFIGURAR API'}
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-xs overflow-x-auto scrollbar-hide">
        {[
          { id: 'sender', label: '🚀 Disparador', icon: Send },
          { id: 'groups', label: '👥 Grupos', icon: Users },
          { id: 'auto_reply', label: '🤖 Auto-Bot IA', icon: Bot },
          { id: 'templates', label: '📋 Modelos', icon: FileText },
          { id: 'validator', label: '🔍 Triagem', icon: Search },
          { id: 'antiblock', label: '🛡️ Blindagem', icon: Sliders },
          { id: 'config', label: '⚙️ Configurações', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeSubTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. DYNAMIC CONTENT AREA */}
      <div className="min-h-[500px]">
        <React.Suspense fallback={
          <div className="flex flex-col items-center justify-center py-24 bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <div className="text-center">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Carregando painel...</p>
              <p className="text-xs text-slate-400 mt-1">Otimizando desempenho de memória e CPU</p>
            </div>
          </div>
        }>
          {activeSubTab === 'sender' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <WhatsAppCampaignRadar
                sentCount={sentCount}
                repliedCount={repliedCount}
                progressPercent={progressPercent}
                isRunning={sender.isRunning}
                onOpenTrackingModal={() => setIsTrackingModalOpen(true)}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                  <WhatsAppBroadcastComposer
                    broadcastMessageText={sender.broadcastMessageText}
                    setBroadcastMessageText={sender.setBroadcastMessageText}
                    messageType={sender.messageType}
                    setMessageType={sender.setMessageType}
                    mediaUrl={sender.mediaUrl}
                    setMediaUrl={sender.setMediaUrl}
                    usePTTStep2={sender.usePTTStep2}
                    setUsePTTStep2={sender.setUsePTTStep2}
                    includeButtons={sender.includeButtons}
                    setIncludeButtons={sender.setIncludeButtons}
                    onGenerateAiPitch={() => {}}
                    isAiNicheGenerating={false}
                    activeGateway={config.gatewayConfig.type}
                    pendingCount={pendingLeads.length}
                    onAddAllToQueue={handleAddAllToQueue}
                    templates={templates}
                  />
                  <WhatsAppFastTest
                    fastTestPhone={fastTestPhone}
                    setFastTestPhone={setFastTestPhone}
                    fastTestMessage={fastTestMessage}
                    setFastTestMessage={setFastTestMessage}
                    fastTestLogs=""
                    isFastSending={false}
                    onFastSend={() => {}}
                  />
                </div>
                <div className="lg:col-span-5 space-y-6">
                  <WhatsAppLivePreview
                    broadcastMessageText={sender.broadcastMessageText}
                    messageType={sender.messageType}
                    mediaUrl={sender.mediaUrl}
                    activeGateway={config.gatewayConfig.type}
                  />
                  <WhatsAppQueueMonitor
                    queueItems={[]}
                    pendingLeads={pendingLeads}
                    telemetryLogs={telemetryLogs}
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'groups' && (
            <WhatsAppGroupManager 
              whatsappGroups={groups.whatsappGroups} 
              onDeleteGroup={groups.handleDeleteGroup} 
              onAddGroup={groups.handleAddGroup} 
              onSetGroupBroadcastTemplate={(grp) => {
                sender.setBroadcastMessageText(`Olá pessoal do grupo *${grp.name}*! Temos novidades...`);
                setActiveSubTab('sender');
              }} 
            />
          )}
          {activeSubTab === 'auto_reply' && <WhatsAppAutoReplyManager onAddLog={addInternalLog} />}
          {activeSubTab === 'templates' && <TemplateManager />}
          {activeSubTab === 'validator' && (
            <WhatsAppValidatorManager 
              leads={leads} 
              onUpdateLeadStatus={onUpdateLeadStatus} 
              onAddLog={addInternalLog} 
            />
          )}
          {activeSubTab === 'antiblock' && <WhatsAppAntiBlockManager />}
          {activeSubTab === 'config' && (
            <div className="space-y-6">
               <WhatsAppConfigManager onAddLog={addInternalLog} />
               <WhatsAppCadenceManager onAddLog={addInternalLog} />
            </div>
          )}
        </React.Suspense>
      </div>

      {/* EVOLUTION QR CODE MODAL */}
      {evolution.showEvolutionQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className=" text-slate-800 text-sm">Conectar WhatsApp Web</h3>
              </div>
              <button onClick={() => evolution.setShowEvolutionQrModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
              {evolution.evolutionQrLoading ? (
                <div className="flex flex-col items-center gap-4 text-emerald-600">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-xs font-bold animate-pulse">Gerando QR Code Oficial...</p>
                </div>
              ) : evolution.evolutionQrError ? (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <X className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium px-4">{evolution.evolutionQrError}</p>
                  <button onClick={evolution.ensureEvolutionInstanceAndConnect} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">
                    Tentar Novamente
                  </button>
                </div>
              ) : evolution.evolutionQrBase64 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <img src={evolution.evolutionQrBase64} alt="QR Code WhatsApp" className="w-56 h-56 object-contain" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium text-center max-w-[280px]">
                    Abra o WhatsApp no seu celular, vá em <strong>Aparelhos Conectados</strong> e escaneie este código.
                  </p>
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Aguardando leitura...</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      {/* Modal de Acompanhamento Real de Envios */}
      <SelectedLeadsTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        selectedLeadIds={validLeads.map(l => l.id)}
        allLeads={leads}
        onUpdateLeadStatus={onUpdateLeadStatus}
        onOpenWhatsapp={(lead) => window.open(`https://wa.me/${lead.rawPhone || lead.phone.replace(/\D/g, '')}`, '_blank')}
      />
    </div>
  );
};
