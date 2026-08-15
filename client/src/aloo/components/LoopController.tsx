import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCw, 
  SkipForward, 
  Zap, 
  ShieldCheck, 
  Terminal, 
  Volume2, 
  VolumeX, 
  Bell, 
  BellRing, 
  Radio, 
  Sparkles, 
  Compass, 
  Cpu, 
  Layers, 
  RefreshCw,
  Phone,
  MessageSquare,
  Filter,
  CheckCircle2,
  Globe,
  Target,
  Activity,
  Gauge,
  Send,
  Building2,
  FileCheck,
  Radar as RadarIcon,
  Crosshair,
  Sliders,
  Mail
} from 'lucide-react';
import { LoopState, SearchFilterConfig } from '../types';

interface LoopControllerProps {
  loopState: LoopState;
  keywordsCount: number;
  concurrency?: number;
  targetState?: string;
  onSetTargetState?: (uf: string) => void;
  searchFilterConfig?: SearchFilterConfig;
  onUpdateSearchFilterConfig?: (updated: Partial<SearchFilterConfig>) => void;
  autoAddAiSuggestions?: boolean;
  onToggleAutoAddAiSuggestions?: () => void;
  autoGeographicExpansionEnabled?: boolean;
  onToggleAutoGeographicExpansion?: () => void;
  autoEngineRotationEnabled?: boolean;
  onToggleAutoEngineRotation?: () => void;
  deepSearchFallbackEnabled?: boolean;
  onToggleDeepSearchFallback?: () => void;
  onStartLoop?: () => void;
  onPauseLoop?: () => void;
  onResumeLoop?: () => void;
  onStopLoop?: () => void;
  onResetLoop?: () => void;
  onSetDelaySeconds?: (seconds: number) => void;
  onSetConcurrency?: (concurrency: number) => void;
  onProcessManualHtmlForLoop?: (html: string) => void;
  onSkipCurrentKeywordInLoop?: () => void;
  onToggleAutoRecovery?: () => void;
  onToggleAiSearch?: () => void;
  onToggleShowConsole?: () => void;
  showConsole?: boolean;
  failedKeywords?: string[];
  onRetryFailedKeyword?: (kw: string) => void;
  aiReformulations?: Record<string, string[]>;
  onApplyAiReformulation?: (originalKw: string, reformulatedKw: string) => void;
  soundAlertEnabled?: boolean;
  onToggleSoundAlert?: () => void;
  browserNotificationPermission?: NotificationPermission;
  onRequestBrowserNotificationPermission?: () => void;
  onSendTestBrowserNotification?: () => void;
  onOpenWhatsappTab?: () => void;
}

export const LoopController: React.FC<LoopControllerProps> = ({
  loopState,
  keywordsCount,
  concurrency = loopState.concurrency || 3,
  targetState = 'ALL',
  onSetTargetState,
  searchFilterConfig,
  onUpdateSearchFilterConfig,
  autoAddAiSuggestions = true,
  onToggleAutoAddAiSuggestions,
  onToggleAutoRecovery,
  onToggleAiSearch,
  autoGeographicExpansionEnabled = false,
  onToggleAutoGeographicExpansion,
  autoEngineRotationEnabled = false,
  onToggleAutoEngineRotation,
  deepSearchFallbackEnabled = false,
  onToggleDeepSearchFallback,
  onStartLoop,
  onPauseLoop,
  onResumeLoop,
  onStopLoop,
  onResetLoop,
  onSetDelaySeconds,
  onSetConcurrency,
  onSkipCurrentKeywordInLoop,
  onToggleShowConsole,
  showConsole,
  soundAlertEnabled = true,
  onToggleSoundAlert,
  browserNotificationPermission = 'default',
  onRequestBrowserNotificationPermission,
  onSendTestBrowserNotification,
  onOpenWhatsappTab,
}) => {
  const isRunning = loopState.status === 'running';
  const isPaused = loopState.status === 'paused_user' || loopState.status === 'paused_manual';

  // Radar ping simulation dots for visual feedback during scan
  const [radarPings, setRadarPings] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  useEffect(() => {
    if (!isRunning) {
      setRadarPings([]);
      return;
    }

    const interval = setInterval(() => {
      // Generate simulated radar blips for visual feedback
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 65; // radius percentage
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      
      setRadarPings(prev => [
        ...prev.slice(-5),
        { id: Date.now(), x, y, size: Math.random() * 4 + 4 }
      ]);
    }, 1800);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Current filter settings
  const currentPhoneType = searchFilterConfig?.phoneType || 'ALL';
  const currentTargetState = searchFilterConfig?.targetState || targetState || 'ALL';
  const currentOnlyDocument = !!searchFilterConfig?.onlyWithDocument;
  const currentSellerType = searchFilterConfig?.sellerType || 'ALL';

  return (
    <div className={`backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border rounded-2xl p-4 md:p-5 space-y-4 transition-all duration-500 shadow-lg relative overflow-hidden ${
      isRunning
        ? 'border-emerald-500/60 ring-2 ring-emerald-500/10 dark:border-emerald-500/50 shadow-emerald-500/5'
        : 'border-slate-200/80 dark:border-slate-800/80'
    }`}>
      {/* Background Accent Blur */}
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
        isRunning ? 'bg-emerald-500/5 opacity-100' : 'bg-indigo-500/5 opacity-50'
      }`} />

      {/* TOP SECTION: TITLE, LIVE DOPPLER RADAR SCOPE & ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          {/* VISUAL DOPPLER RADAR WIDGET */}
          <div className="relative w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-sm group">
            <div className="absolute inset-1 rounded-full border border-emerald-500/10 pointer-events-none" />
            <div className="absolute w-full h-[1px] bg-emerald-500/10 pointer-events-none" />
            <div className="absolute h-full w-[1px] bg-emerald-500/10 pointer-events-none" />

            {isRunning && (
              <div 
                className="absolute w-full h-full rounded-full origin-center animate-[spin_4s_linear_infinite] pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(16, 185, 129, 0.3) 360deg)'
                }}
              />
            )}

            <Crosshair className={`w-4 h-4 z-10 transition-colors ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Radar Comercial
                <span className="px-1 py-0.5 text-[9px] font-black bg-blue-600 text-white rounded uppercase">
                  v3.5
                </span>
              </h2>

              {isRunning && (
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap font-semibold uppercase tracking-tight">
              <span>Fila: <strong className="text-slate-900 dark:text-white">{keywordsCount}</strong></span>
              <span>•</span>
              <span>DDD: <strong className="text-indigo-600 dark:text-indigo-400">{currentTargetState}</strong></span>
            </p>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isRunning && !isPaused ? (
              <button
                onClick={onStartLoop}
                disabled={keywordsCount === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Iniciar Mineração
              </button>
          ) : isRunning ? (
              <button
                onClick={onPauseLoop}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Pausar
              </button>
          ) : (
              <button
                onClick={onResumeLoop}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Retomar
              </button>
          )}

          {(isRunning || isPaused) && (
            <button
              onClick={onStopLoop}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-[10px] uppercase tracking-widest rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer transition-all active:scale-95"
            >
              Parar
            </button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 ml-1">
            {onSkipCurrentKeywordInLoop && (
              <button
                onClick={onSkipCurrentKeywordInLoop}
                disabled={!isRunning && !isPaused}
                className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-30 cursor-pointer"
                title="Pular termo"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            )}

            {onResetLoop && (
              <button
                onClick={onResetLoop}
                className="p-1.5 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                title="Reiniciar fila"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {onToggleSoundAlert && (
              <button
                onClick={onToggleSoundAlert}
                className={`p-1.5 transition-colors cursor-pointer ${soundAlertEnabled ? 'text-emerald-500' : 'text-slate-400'}`}
                title="Som"
              >
                {soundAlertEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            )}

            {onToggleShowConsole && (
              <button
                onClick={onToggleShowConsole}
                className={`p-1.5 transition-colors cursor-pointer ${showConsole ? 'text-blue-500' : 'text-slate-400'}`}
                title="Logs"
              >
                <Terminal className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE KEYWORDS DISPLAY */}
      {isRunning && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 animate-in slide-in-from-top-1 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <RadarIcon className="w-3 h-3 text-emerald-500 animate-pulse" />
              Sinais Ativos ({loopState.activeBatch?.length || 1})
            </span>
            <span className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-tighter">
              Buscando em tempo real...
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {loopState.activeBatch && loopState.activeBatch.length > 0 ? (
              loopState.activeBatch.map((kw, idx) => (
                <div key={idx} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 animate-in zoom-in-95 duration-300">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">{kw}</span>
                </div>
              ))
            ) : (
              <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">{loopState.currentKeyword}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MID SECTION: ACTIVE TERM & VELOCIDADE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-[10px]">
        {/* Active Term */}
        <div className="flex items-center gap-2 min-w-0">
          <Zap className={`w-3.5 h-3.5 shrink-0 ${isRunning ? 'text-emerald-500 animate-bounce' : 'text-amber-500'}`} />
          <span className="text-slate-500 dark:text-slate-400 shrink-0 font-bold uppercase tracking-tight">Status de Varredura:</span>
          <span className={`font-black px-2 py-0.5 rounded border truncate transition-all uppercase tracking-tighter ${
            isRunning 
              ? 'bg-slate-950 text-emerald-400 border-emerald-500/50' 
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
          }`}>
            {isRunning ? 'Mineração Ativa' : 'Mineração Pausada'}
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2 shrink-0 font-bold uppercase tracking-tight text-slate-500">
          <span>Velocidade:</span>
          <select
            name="speed-selector"
            value={loopState.delaySeconds}
            onChange={(e) => {
              const delaySec = Number(e.target.value);
              let targetConc = 2;
              let boost = 'normal';
              
              if (delaySec === 0.5) {
                targetConc = 5;
                boost = 'hyper';
              } else if (delaySec === 1) {
                targetConc = 4;
                boost = 'turbo';
              } else if (delaySec === 2) {
                targetConc = 3;
                boost = 'fast';
              } else if (delaySec === 5) {
                targetConc = 2;
                boost = 'normal';
              } else if (delaySec === 10) {
                targetConc = 1;
                boost = 'safe';
              } else if (delaySec === 20) {
                targetConc = 1;
                boost = 'discrete';
              }

              if (typeof window !== 'undefined') {
                localStorage.setItem('search_boost_level', boost);
                localStorage.setItem('truck_miner_delay_seconds', delaySec.toString());
                localStorage.setItem('truck_miner_concurrency', targetConc.toString());
              }

              if (onSetDelaySeconds) onSetDelaySeconds(delaySec);
              if (onSetConcurrency) onSetConcurrency(targetConc);
              
              // Sync with server config
              fetch('/api/turbo/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchBoostLevel: boost, maxConcurrency: targetConc, delayBetweenSearches: delaySec * 1000 })
              }).catch(() => {});
            }}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 font-black text-slate-900 dark:text-slate-100 cursor-pointer hover:border-indigo-500 transition-colors text-[9px]"
          >
            <option value={0.5}>🌪️ Hyper Turbo (0.5s) - 30+ Fontes</option>
            <option value={1}>⚡ Turbo (1s) - 20 Fontes</option>
            <option value={2}>🚀 Rápido (2s) - 15 Fontes</option>
            <option value={5}>🎯 Padrão (5s) - 10 Fontes</option>
            <option value={10}>🛡️ Seguro (10s) - 5 Fontes</option>
            <option value={20}>🕵️ Discreto (20s) - 3 Fontes</option>
          </select>

          <button
            onClick={() => {
              const select = document.querySelector('select[name="speed-selector"]') as HTMLSelectElement;
              const delaySec = Number(select?.value || 5);
              let boost = 'normal';
              if (delaySec === 0.5) boost = 'hyper';
              else if (delaySec === 1) boost = 'turbo';
              else if (delaySec === 2) boost = 'fast';
              else if (delaySec === 5) boost = 'normal';
              else if (delaySec === 10) boost = 'safe';
              else if (delaySec === 20) boost = 'discrete';

              const targetConc = delaySec <= 0.5 ? 5 : delaySec <= 1 ? 4 : delaySec <= 2 ? 3 : 2;

              if (typeof window !== 'undefined') {
                localStorage.setItem('search_boost_level', boost);
                localStorage.setItem('truck_miner_delay_seconds', delaySec.toString());
                localStorage.setItem('truck_miner_concurrency', targetConc.toString());
              }
              
              // Visual feedback
              const btn = document.getElementById('save-speed-btn');
              if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✨ CONFIGURAÇÃO SALVA';
                btn.style.backgroundColor = '#10b981'; // emerald-500
                btn.style.color = 'white';
                
                setTimeout(() => {
                  btn.innerHTML = originalText;
                  btn.style.backgroundColor = '';
                  btn.style.color = '';
                }, 2000);
              }

              if (onSetDelaySeconds) onSetDelaySeconds(delaySec);
              if (onSetConcurrency) onSetConcurrency(targetConc);

              // Final sync
              fetch('/api/turbo/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  searchBoostLevel: boost,
                  maxConcurrency: targetConc,
                  delayBetweenSearches: delaySec * 1000
                })
              }).catch(() => {});
            }}
            id="save-speed-btn"
            className="ml-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all border border-slate-700 dark:border-slate-200 active:scale-95 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Salvar
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: STREAMLINED INTERACTIVE FILTERS & INTELLIGENCE MODES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Filter className="w-3 h-3" />
            Filtros & Direcionamento
          </h4>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
          {/* 1. DDD Filter Select */}
          <div className="relative flex items-center col-span-2 sm:col-span-1">
            <Compass className="w-3 h-3 text-indigo-500 absolute left-2 pointer-events-none z-10" />
            <select
              value={currentTargetState}
              onChange={(e) => {
                const val = e.target.value;
                if (onSetTargetState) onSetTargetState(val);
                if (onUpdateSearchFilterConfig) onUpdateSearchFilterConfig({ targetState: val });
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[9px] rounded-lg pl-6 pr-1 py-1 cursor-pointer hover:border-indigo-500 transition-colors truncate uppercase tracking-tighter h-8"
            >
              <option value="ALL">🌐 Todos os DDDs</option>
              <option value="SP">📍 SP (11 a 19)</option>
              <option value="11">📲 DDD 11 (SP)</option>
              <option value="19">📲 DDD 19 (Campinas)</option>
              <option value="MG">📍 MG (31...)</option>
              <option value="31">📲 DDD 31 (BH)</option>
              <option value="PR">📍 PR (41...)</option>
              <option value="41">📲 DDD 41 (Curitiba)</option>
              <option value="RJ">📍 RJ (21...)</option>
              <option value="BA">📍 BA (71...)</option>
              <option value="SC">📍 SC (47...)</option>
            </select>
          </div>

          {/* 2. Phone Filter Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextType = currentPhoneType === 'Celular' ? 'ALL' : 'Celular';
              if (onUpdateSearchFilterConfig) onUpdateSearchFilterConfig({ phoneType: nextType });
            }}
            className={`w-full py-1 px-2 rounded-lg text-[9px] font-black border cursor-pointer transition-all flex items-center justify-center gap-1.5 truncate uppercase tracking-tighter h-8 ${
              currentPhoneType === 'Celular'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-emerald-500'
            }`}
          >
            <Phone className="w-3 h-3 shrink-0" />
            <span>{currentPhoneType === 'Celular' ? 'Só Whats' : 'Todos'}</span>
          </button>

          {/* 3. Document Filter Toggle */}
          <button
            type="button"
            onClick={() => {
              if (onUpdateSearchFilterConfig) onUpdateSearchFilterConfig({ onlyWithDocument: !currentOnlyDocument });
            }}
            className={`w-full py-1 px-2 rounded-lg text-[9px] font-black border cursor-pointer transition-all flex items-center justify-center gap-1.5 truncate uppercase tracking-tighter h-8 ${
              currentOnlyDocument
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-amber-500'
            }`}
          >
            <Building2 className="w-3 h-3 shrink-0" />
            <span>{currentOnlyDocument ? 'CNPJ Ativo' : 'CNPJ Off'}</span>
          </button>

          {/* 4. Email Filter Toggle */}
          <button
            type="button"
            onClick={() => {
              if (onUpdateSearchFilterConfig) onUpdateSearchFilterConfig({ onlyWithEmail: !searchFilterConfig?.onlyWithEmail });
            }}
            className={`w-full py-1 px-2 rounded-lg text-[9px] font-black border cursor-pointer transition-all flex items-center justify-center gap-1.5 truncate uppercase tracking-tighter h-8 ${
              searchFilterConfig?.onlyWithEmail
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-indigo-500'
            }`}
          >
            <Mail className="w-3 h-3 shrink-0" />
            <span>{searchFilterConfig?.onlyWithEmail ? 'E-mail On' : 'E-mail Off'}</span>
          </button>

          {/* 5. Specialized Engine Toggle (Turbo Search) */}
          <button
            type="button"
            onClick={() => {
              const nextMode = searchFilterConfig?.engineMode === 'specialized' ? 'global' : 'specialized';
              if (onUpdateSearchFilterConfig) onUpdateSearchFilterConfig({ engineMode: nextMode });
            }}
            className={`w-full py-1 px-2 rounded-lg text-[9px] font-black border cursor-pointer transition-all flex items-center justify-center gap-1.5 truncate uppercase tracking-tighter h-8 ${
              searchFilterConfig?.engineMode === 'specialized'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-blue-500'
            }`}
          >
            <Zap className="w-3 h-3 shrink-0" />
            <span>{searchFilterConfig?.engineMode === 'specialized' ? 'Turbo On' : 'Turbo Off'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-emerald-500" />
            Inteligência & Automação
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
          {/* 6. Deterministic Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (onUpdateSearchFilterConfig) onUpdateSearchFilterConfig({ deterministicMode: !searchFilterConfig?.deterministicMode });
            }}
            className={`w-full py-1 px-2 rounded-lg text-[9px] font-black border cursor-pointer transition-all flex items-center justify-center gap-1.5 truncate uppercase tracking-tighter h-8 ${
              searchFilterConfig?.deterministicMode
                ? 'bg-violet-600 text-white border-violet-700 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-violet-500'
            }`}
            title="Desativa expansão estratégica da IA e foca no termo exato."
          >
            <Target className="w-3 h-3 shrink-0" />
            <span>{searchFilterConfig?.deterministicMode ? 'Determ. On' : 'Determ. Off'}</span>
          </button>

          {/* 7. Varredura Profunda (Deep Search Fallback) */}
          <button
            type="button"
            onClick={onToggleDeepSearchFallback}
            className={`w-full py-1 px-2 rounded-lg text-[9px] font-black border cursor-pointer transition-all flex items-center justify-center gap-1.5 truncate uppercase tracking-tighter h-8 ${
              deepSearchFallbackEnabled
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-rose-500'
            }`}
            title="Se a busca simples falhar, executa uma varredura multi-estágio avançada."
          >
            <Layers className="w-3 h-3 shrink-0" />
            <span>{deepSearchFallbackEnabled ? 'Profundo On' : 'Profundo Off'}</span>
          </button>

          {/* 8. Expansão Geográfica (Geo Expansion) */}
          <button
            type="button"
            onClick={onToggleAutoGeographicExpansion}
            className={`w-full py-1 px-2 rounded-lg text-[9px] font-black border cursor-pointer transition-all flex items-center justify-center gap-1.5 truncate uppercase tracking-tighter h-8 ${
              autoGeographicExpansionEnabled
                ? 'bg-cyan-600 text-white border-cyan-700 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-cyan-500'
            }`}
            title="Injeta automaticamente variações estaduais (SP, MG, RJ...) na fila."
          >
            <Globe className="w-3 h-3 shrink-0" />
            <span>{autoGeographicExpansionEnabled ? 'Geo Expand On' : 'Geo Expand Off'}</span>
          </button>

          {/* 9. AI Search Expansion (Smart Brain) */}
          <button
            type="button"
            onClick={onToggleAiSearch}
            className={`w-full py-1 px-2 rounded-lg text-[9px] font-black border cursor-pointer transition-all flex items-center justify-center gap-1.5 truncate uppercase tracking-tighter h-8 ${
              loopState.aiSearchEnabled
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:border-emerald-500'
            }`}
            title="Usa o Search Brain V2 para expandir termos e sinônimos comercialmente relevantes."
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>{loopState.aiSearchEnabled ? 'Cérebro IA On' : 'Cérebro IA Off'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
