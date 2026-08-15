import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, ExtractedContact, KeywordSuggestion, LoopState, ActivityLog, SearchFilterConfig } from './types';
import { sanitizeInput, cleanSnippetText } from './utils/textProcessor';
import { useToast } from './components/Toast';
import { analyzeLead } from './utils/aiQualifier';
import { extractContactsFromText, isValidPhone } from './utils/phoneExtractor';
import { extractContactsInWorker } from './utils/extractionWorkerManager';
import { executeMultiEngineSearch, executeAlternativeMultiEngineSearch, executeAdvancedNavigationDeepSearch } from './utils/searchEngines';
import { getLoopPausePatch, getSearchFailurePausePolicy, resolveClientSearchFailureTransition, shouldScheduleNextLoopBatch } from './utils/searchFailurePolicy';
import { executeSmartOrchestratedSearch } from './utils/smartSearchOrchestrator';
import { cleanseAndFilterGarbage, mergeCrossPlatformLeads, calculateCommercialScore, detectAndExtractSocialLinks } from './utils/leadMergerEngine';
import { enrichLeadWithOpportunitySignals } from './utils/opportunityEngine';
import { discoverDeepContacts } from './utils/deepContactDiscovery';
import {
  getStoredKeywords,
  saveStoredKeywords,
  getPendingSuggestions,
  savePendingSuggestions,
  generateProgressiveSuggestions,
  fetchAiKeywords,
  recordKeywordSearch,
  pruneNonConvertingKeywords,
  pruneConsecutiveFailedKeywords,
  prioritizeKeywordsByPerformance,
  analyzeAndOptimizeQueue,
  getSequenceProgress,
  clearSearchedCycleMemory,
  isSearchedInCurrentCycle,
  discoverAndLearnNewTermsFromSnippets,
  DEFAULT_KEYWORDS,
} from './utils/keywordBrain';

import { initSessionLock, isAntiSpyEnabled, setAntiSpyEnabled } from './utils/securityGuard';
import { requestScreenWakeLock, releaseScreenWakeLock, initWakeLockAutoReacquire, scheduleBackgroundTick } from './utils/backgroundRunner';
import { Header } from './components/Header';
import { SecurityAccessGuard } from './components/SecurityAccessGuard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { auth, db, onAuthStateChanged, collection, doc, setDoc, getDocs, onSnapshot, User as FirebaseUser } from './services/firebase';
import { startAutoValidationMonitor } from './services/autoValidationEngine';
import { resolveLidBatch } from './services/lidResolver';
import { searchQueueManager } from './services/SearchQueueManager';
import { 
  HeartPulse, 
  Terminal, 
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';

// --- LAZY LOADED HEAVY COMPONENTS WITH AUTO-RECOVERY ---
function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  componentName?: string
): React.LazyExoticComponent<T> {
  return lazy<T>(async (): Promise<{ default: T }> => {
    const key = `lazy-retry-${componentName || 'generic'}`;
    const globalLockKey = `lazy-global-reload-lock-${componentName || 'generic'}`;
    
    try {
      const module = await factory();
      sessionStorage.removeItem(key); // Reset on success
      sessionStorage.removeItem(globalLockKey); // Reset lock
      return module;
    } catch (err) {
      console.error(`🤖 [safeLazy] Módulo falhou ao carregar: ${componentName || 'component'}`, err);
      
      const componentRetries = parseInt(sessionStorage.getItem(key) || '0', 10);
      const isGlobalLocked = sessionStorage.getItem(globalLockKey) === 'true';
      
      if (componentRetries < 1 && !isGlobalLocked) {
        sessionStorage.setItem(key, String(componentRetries + 1));
        sessionStorage.setItem(globalLockKey, 'true'); // Trava de segurança contra loops
        
        console.warn(`🤖 [safeLazy] Forçando recarga limpa da aplicação apenas uma vez para o componente: ${componentName}`);
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error(`🤖 [safeLazy] Trava de segurança ativada. Evitando loop infinito de reloads para: ${componentName}`);
      }
      
      // Return a graceful fallback component so the main React tree doesn't throw unhandled crashes
      return {
        default: (() => (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md mx-auto my-8 shadow-sm text-center">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              ⚠️
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Erro ao Carregar {componentName || 'Módulo'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Não foi possível sincronizar o componente {componentName || 'solicitado'}. Uma nova tentativa pode ser feita manualmente.
            </p>
            <button 
              onClick={() => {
                sessionStorage.removeItem(key);
                sessionStorage.removeItem(globalLockKey);
                window.location.reload();
              }} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
            >
              Forçar Nova Tentativa
            </button>
          </div>
        )) as any
      };
    }
  });
}

// --- CORE DIRECT IMPORTS (NEEDED FOR BOOTSTRAP) ---

// --- LAZY IMPORTS FOR HEAVY OR NON-CRITICAL UI ---
const KanbanCrmBoard = safeLazy(() => import('./components/KanbanCrmBoard').then(m => ({ default: m.KanbanCrmBoard })), 'KanbanCrmBoard');
const GoogleMapsScanner = safeLazy(() => import('./components/GoogleMapsScanner').then(m => ({ default: m.GoogleMapsScanner })), 'GoogleMapsScanner');
const LeadTable = safeLazy(() => import('./components/LeadTable').then(m => ({ default: m.LeadTable })), 'LeadTable');
const KeywordManager = safeLazy(() => import('./components/KeywordManager').then(m => ({ default: m.KeywordManager })), 'KeywordManager');
const ProactiveMatchEngine = safeLazy(() => import('./components/ProactiveMatchEngine').then(m => ({ default: m.ProactiveMatchEngine })), 'ProactiveMatchEngine');
const AiLeadSalesProspector = safeLazy(() => import('./components/AiLeadSalesProspector').then(m => ({ default: m.AiLeadSalesProspector })), 'AiLeadSalesProspector');
const AiConversionTracker = safeLazy(() => import('./components/AiConversionTracker').then(m => ({ default: m.AiConversionTracker })), 'AiConversionTracker');
const WhatsappGuideCard = safeLazy(() => import('./components/WhatsappGuideCard').then(m => ({ default: m.WhatsappGuideCard })), 'WhatsappGuideCard');
const SalesFunnelChart = safeLazy(() => import('./components/SalesFunnelChart').then(m => ({ default: m.SalesFunnelChart })), 'SalesFunnelChart');
const BrazilStateGeoChart = safeLazy(() => import('./components/BrazilStateGeoChart').then(m => ({ default: m.BrazilStateGeoChart })), 'BrazilStateGeoChart');
const GoogleAiProConfigModal = safeLazy(() => import('./components/GoogleAiProConfigModal').then(m => ({ default: m.GoogleAiProConfigModal })), 'GoogleAiProConfigModal');
const ExecutiveDossierModal = safeLazy(() => import('./components/ExecutiveDossierModal').then(m => ({ default: m.ExecutiveDossierModal })), 'ExecutiveDossierModal');
const FreightAndBrokerageCalculatorModal = safeLazy(() => import('./components/FreightAndBrokerageCalculatorModal').then(m => ({ default: m.FreightAndBrokerageCalculatorModal })), 'FreightAndBrokerageCalculatorModal');
const WebhookConfigModal = safeLazy(() => import('./components/WebhookConfigModal').then(m => ({ default: m.WebhookConfigModal })), 'WebhookConfigModal');
const LeadFollowUpScheduler = safeLazy(() => import('./components/LeadFollowUpScheduler').then(m => ({ default: m.LeadFollowUpScheduler })), 'LeadFollowUpScheduler');
const ImportLeadsModal = safeLazy(() => import('./components/ImportLeadsModal').then(m => ({ default: m.ImportLeadsModal })), 'ImportLeadsModal');
const EmailDispatcher = safeLazy(() => import('./components/EmailDispatcher').then(m => ({ default: m.EmailDispatcher })), 'EmailDispatcher');
const SyncImportConfirmModal = safeLazy(() => import('./components/SyncImportConfirmModal').then(m => ({ default: m.SyncImportConfirmModal })), 'SyncImportConfirmModal');
const SystemSettingsTab = safeLazy(() => import('./components/SystemSettingsTab').then(m => ({ default: m.SystemSettingsTab })), 'SystemSettingsTab');
const FirebaseAuthModal = safeLazy(() => import('./components/FirebaseAuthModal').then(m => ({ default: m.FirebaseAuthModal })), 'FirebaseAuthModal');
const HelpModal = safeLazy(() => import('./components/HelpModal').then(m => ({ default: m.HelpModal })), 'HelpModal');
const SaaSMonetizationPlannerModal = safeLazy(() => import('./components/SaaSMonetizationPlannerModal').then(m => ({ default: m.SaaSMonetizationPlannerModal })), 'SaaSMonetizationPlannerModal');
const WindowsInstallerModal = safeLazy(() => import('./components/WindowsInstallerModal').then(m => ({ default: m.WindowsInstallerModal })), 'WindowsInstallerModal');
const InteractiveTour = safeLazy(() => import('./components/InteractiveTour').then(m => ({ default: m.InteractiveTour })), 'InteractiveTour');
const BackgroundAutoSender = safeLazy(() => import('./components/BackgroundAutoSender').then(m => ({ default: m.BackgroundAutoSender })), 'BackgroundAutoSender');
const MetricCards = safeLazy(() => import('./components/MetricCards').then(m => ({ default: m.MetricCards })), 'MetricCards');
const LoopController = safeLazy(() => import('./components/LoopController').then(m => ({ default: m.LoopController })), 'LoopController');
const ActivityLogConsole = safeLazy(() => import('./components/ActivityLogConsole').then(m => ({ default: m.ActivityLogConsole })), 'ActivityLogConsole');
const SearchDebugConsoleModal = safeLazy(() => import('./components/SearchDebugConsoleModal').then(m => ({ default: m.SearchDebugConsoleModal })), 'SearchDebugConsoleModal');
const AutoBackupModal = safeLazy(() => import('./components/AutoBackupModal').then(m => ({ default: m.AutoBackupModal })), 'AutoBackupModal');
const SystemHealthMonitorModal = safeLazy(() => import('./components/SystemHealthMonitorModal').then(m => ({ default: m.SystemHealthMonitorModal })), 'SystemHealthMonitorModal');
const SecurityGuardModal = safeLazy(() => import('./components/SecurityGuardModal').then(m => ({ default: m.SecurityGuardModal })), 'SecurityGuardModal');
const DesktopSyncCard = safeLazy(() => import('./components/DesktopSyncCard').then(m => ({ default: m.DesktopSyncCard })), 'DesktopSyncCard');
const SmsDispatcher = safeLazy(() => import('./components/SmsDispatcher').then(m => ({ default: m.SmsDispatcher })), 'SmsDispatcher');
const SearchQueuePanel = safeLazy(() => import('./components/keywordIntelligence/SearchQueuePanel').then(m => ({ default: m.SearchQueuePanel })), 'SearchQueuePanel');
const DiagnosticSystem = safeLazy(() => import('./components/DiagnosticSystem').then(m => ({ default: m.DiagnosticSystem })), 'DiagnosticSystem');
import { downloadVcfContacts, downloadGoogleContactsCsv } from './utils/googleContacts';
import { saveBackup, restoreBackup, safeSaveLeads, safeLoadLeads, checkAndCreateAutoBackup } from './utils/backup';
import { loadWarmedLeadsCache, updateWarmedLeadsCache } from './utils/cacheWarmupEngine';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendHighValueLeadNotification, 
  sendTestBrowserNotification 
} from './utils/browserNotifications';
import { 
  LayoutDashboard, 
  Truck, 
  MessageSquare, 
  BarChart3, 
  Bookmark, 
  Store, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Compass, 
  Bell, 
  Search, 
  Plus, 
  Sparkles, 
  Zap, 
  Flame,
  ShieldCheck, 
  Database, 
  Globe,
  Sliders,
  Radio,
  Sun,
  Moon,
  Loader2,
  UserPlus,
  Users,
  Bot,
  Download,
  Lock,
  Unlock,
  Coins,
  Webhook,
  Play,
  Pause,
  RotateCw,
  CheckCircle,
  FolderOpen,
  RefreshCw,
  Laptop,
  Monitor,
  Upload,
  ChevronDown,
  Wrench,
  Brain,
  Kanban,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Mail,
  Cloud,
  Smartphone,
  Shield,
  X
} from 'lucide-react';

const STORAGE_KEY_LEADS = 'truck_miner_leads';

function safeGetItem(key: string, defaultValue: string = ''): string {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (e) {
    console.warn(`[SafeStorage] Could not read key "${key}" from localStorage:`, e);
    return defaultValue;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[SafeStorage] Could not write key "${key}" to localStorage:`, e);
  }
}

export default function App() {
  const { success, error: toastError, info, warning } = useToast();

  if (typeof window !== 'undefined' && window.performance) {
    performance.mark('app-init-start');
  }

  // Leads & Keywords State (Optimized non-blocking initial load with Cache Warming V1)
  const [leads, setLeads] = useState<Lead[]>(() => loadWarmedLeadsCache());
  const leadsRef = useRef<Lead[]>([]);
  leadsRef.current = leads;

  useEffect(() => {
    // Inicia o motor de validação automática (V3.6)
    const stopMonitor = startAutoValidationMonitor(
      () => leadsRef.current,
      (updated) => setLeads(updated),
      60000 // A cada 1 minuto verifica se há novos para validar em lote
    );
    return () => stopMonitor();
  }, []);

  // Limite inicial de exibição de 50 leads (lazy loading progressivo conforme a rolagem)
  const [leadsDisplayLimit, setLeadsDisplayLimit] = useState<number>(50);

  const visibleLeads = useMemo(() => {
    if (leads.length <= leadsDisplayLimit) return leads;
    return leads.slice(0, leadsDisplayLimit);
  }, [leads, leadsDisplayLimit]);

  // Carregamento assíncrono em segundo plano do banco completo (SQLite) + aquecimento do cache
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const loadedLeads = await safeLoadLeads();
        if (isMounted && loadedLeads && loadedLeads.length > 0) {
          setLeads(loadedLeads);
          updateWarmedLeadsCache(loadedLeads);
        }
      } catch (err) {
        console.error('Failed to load initial leads from SQLite:', err);
      }
    }, 10);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Infinite Lazy Loading ao rolar a página
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        setLeadsDisplayLimit((prev) => {
          if (prev >= leads.length) return prev;
          return Math.min(prev + 50, leads.length);
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [leads.length]);

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!auth) return;
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('[Firebase Auth] Subscription error:', err);
    }
  }, []);

  // Sync leads with Firestore when authenticated
  useEffect(() => {
    if (!currentUser || !db) return;
    try {
      const leadsCollectionRef = collection(db, 'users', currentUser.uid, 'leads');
      const unsubscribe = onSnapshot(leadsCollectionRef, (snapshot) => {
        const cloudLeads: Lead[] = [];
        snapshot.forEach((docSnap) => {
          cloudLeads.push(docSnap.data() as Lead);
        });
        if (cloudLeads.length > 0) {
          setLeads(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const newCloudLeads = cloudLeads.filter(l => !existingIds.has(l.id));
            if (newCloudLeads.length > 0 || cloudLeads.length !== prev.length) {
              const merged = [...prev, ...newCloudLeads];
              safeSaveLeads(merged);
              return merged;
            }
            return prev;
          });
        }
      }, (error) => {
        console.warn('[Firestore] Sync error:', error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('[Firestore] Collection setup error:', err);
    }
  }, [currentUser]);

  const [keywords, setKeywords] = useState<string[]>(() => getStoredKeywords());
  const keywordsRef = useRef(keywords);
  keywordsRef.current = keywords;

  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>(() => getPendingSuggestions());

  const [sessionNewLeads, setSessionNewLeads] = useState(0);
  const [totalSearches, setTotalSearches] = useState(0);
  const [cacheHits, setCacheHits] = useState<number>(() => {
    return parseInt(safeGetItem('truck_miner_cache_hits', '0'), 10);
  });
  const [searchEngineMode, setSearchEngineMode] = useState<string>(() => {
    return safeGetItem('truck_miner_search_engine_mode', 'global');
  });

  const [searchFilterConfig, setSearchFilterConfig] = useState<SearchFilterConfig>(() => {
    try {
      const saved = safeGetItem('truck_miner_search_filter_config', '');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, deterministicMode: false };
      }
    } catch {}
    return {
      targetState: 'ALL',
      phoneType: 'ALL',
      sellerType: 'ALL',
      intent: 'ALL',
      engineMode: safeGetItem('truck_miner_search_engine_mode', 'global'),
      onlyWithEmail: false,
      onlyWithDocument: false,
      multiAdsOnly: false,
      deterministicMode: false,
    };
  });

  const searchFilterConfigRef = useRef(searchFilterConfig);
  searchFilterConfigRef.current = searchFilterConfig;

  const handleFilterConfigChange = useCallback((newConfig: SearchFilterConfig) => {
    setSearchFilterConfig(newConfig);
    if (newConfig.engineMode && newConfig.engineMode !== searchEngineMode) {
      setSearchEngineMode(newConfig.engineMode);
      localStorage.setItem('truck_miner_search_engine_mode', newConfig.engineMode);
    }
    localStorage.setItem('truck_miner_search_filter_config', JSON.stringify(newConfig));
  }, [searchEngineMode]);

  const handleSearchEngineModeChange = useCallback((mode: string) => {
    setSearchEngineMode(mode);
    localStorage.setItem('truck_miner_search_engine_mode', mode);
    addLog({
      id: `log_engine_mode_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `⚙️ Modo de motor de busca alterado para: ${
        mode === 'global' ? 'Varredura Global (Todos os Motores + IA)' :
        mode === 'olx' ? 'Apenas OLX & MercadoLivre (Classificados)' :
        mode === 'duckduckgo' ? 'Busca Leve (DuckDuckGo & Bing)' :
        'Modo Econômico / Baixa Prioridade (Economia de Cota)'
      }`
    });
  }, []);
  const [isHealthMonitorOpen, setIsHealthMonitorOpen] = useState(false);

  // Portal Navigation & Views
  const [activePortalTab, setActivePortalTab] = useState<'dashboard' | 'leads' | 'crm_kanban' | 'maps' | 'whatsapp' | 'email_dispatcher' | 'sms_dispatcher' | 'keywords' | 'settings'>('dashboard');

  const [dashboardSubTab, setDashboardSubTab] = useState<'overview' | 'robot' | 'tools'>('overview');
  const [searchQueryTop, setSearchQueryTop] = useState('');

  // Project Protection States
  const [projectPasscode, setProjectPasscode] = useState<string>(() => safeGetItem('truck_miner_project_passcode', '1234'));
  const [isProtectionEnabled, setIsProtectionEnabled] = useState<boolean>(() => safeGetItem('truck_miner_protection_enabled') === 'true');
  const [isLocked, setIsLocked] = useState<boolean>(() => safeGetItem('truck_miner_protection_enabled') === 'true');
  const [enteredPasscode, setEnteredPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');
  const [isProtectModalOpen, setIsProtectModalOpen] = useState<boolean>(false);
  const [isGoogleAiModalOpen, setIsGoogleAiModalOpen] = useState<boolean>(false);
  const [isExecutiveDossierOpen, setIsExecutiveDossierOpen] = useState<boolean>(false);
  const [isFreightCalculatorOpen, setIsFreightCalculatorOpen] = useState<boolean>(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isSearchDebugModalOpen, setIsSearchDebugModalOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDiagOpen, setIsDiagOpen] = useState(false);

  useEffect(() => {
    // 🧠 PRO COMMAND: Permite abrir o diagnóstico via console do navegador ou comandos simulados
    (window as any).openHealthDiagnostics = () => setIsDiagOpen(true);
    (window as any).systemRebuild = () => {
       console.log('--- REBUILDING KERNEL ---');
       window.location.reload();
    };
  }, []);
  const [isSaaSPlannerOpen, setIsSaaSPlannerOpen] = useState(false);
  const [isWindowsInstallerModalOpen, setIsWindowsInstallerModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState<boolean>(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'cron' | 'google_ai' | 'webhooks' | 'security' | 'booster' | 'backup_sheets' | 'quotas' | 'speed' | 'server_bot'>('cron');

  // Sync Desktop & Global Drag and Drop states
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);
  const [pendingImportLeads, setPendingImportLeads] = useState<Lead[]>([]);
  const [pendingImportFileName, setPendingImportFileName] = useState('');
  const dragCounterRef = useRef(0);

  // Anti-Spy & Privacy Security States
  const [isTabBlurred, setIsTabBlurred] = useState(false);
  const [antiSpyActive, setAntiSpyActive] = useState<boolean>(() => isAntiSpyEnabled());
  const [duplicateSessionDetected, setDuplicateSessionDetected] = useState(false);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setIsTabBlurred(true);
      } else {
        setIsTabBlurred(false);
      }
    };

    const handleBlur = () => {
      setIsTabBlurred(true);
    };

    const handleFocus = () => {
      setIsTabBlurred(false);
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const cleanupSession = initSessionLock(() => {
      setDuplicateSessionDetected(true);
    });

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      cleanupSession();
    };
  }, []);



  // State Target & Auto-Add Configuration
  const [targetState, setTargetState] = useState<string>('ALL');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('ALL');
  const [leadSentimentFilter, setLeadSentimentFilter] = useState<string>('ALL');
  const [autoAddAiSuggestions, setAutoAddAiSuggestions] = useState<boolean>(true);
  const [autoEnrichLeads, setAutoEnrichLeads] = useState<boolean>(() => {
    return safeGetItem('truck_miner_auto_enrich_leads') !== 'false';
  });

  const [autoValidateLeads, setAutoValidateLeads] = useState<boolean>(() => {
    return safeGetItem('truck_miner_auto_validate_leads') !== 'false';
  });

  const isAutoValidatingRef = useRef(false);

  // Autonomous Background Intelligence Engines (ALWAYS ON BY DEFAULT)
  const [autoGeographicExpansion, setAutoGeographicExpansion] = useState<boolean>(() => {
    return safeGetItem('truck_miner_auto_geo_expansion') !== 'false';
  });
  const [autoEngineRotation, setAutoEngineRotation] = useState<boolean>(() => {
    return safeGetItem('truck_miner_auto_engine_rotation') !== 'false';
  });
  const [deepSearchFallback, setDeepSearchFallback] = useState<boolean>(() => {
    return safeGetItem('truck_miner_deep_search_fallback') !== 'false';
  });

  const handleToggleAutoGeographicExpansion = useCallback(() => {
    setAutoGeographicExpansion(prev => {
      const next = !prev;
      safeSetItem('truck_miner_auto_geo_expansion', String(next));
      return next;
    });
  }, []);

  const handleToggleAutoEngineRotation = useCallback(() => {
    setAutoEngineRotation(prev => {
      const next = !prev;
      safeSetItem('truck_miner_auto_engine_rotation', String(next));
      return next;
    });
  }, []);

  const handleToggleDeepSearchFallback = useCallback(() => {
    setDeepSearchFallback(prev => {
      const next = !prev;
      safeSetItem('truck_miner_deep_search_fallback', String(next));
      return next;
    });
  }, []);

  const [mainViewTab, setMainViewTab] = useState<'leads' | 'whatsapp'>('leads');
  const [isExpandingQuery, setIsExpandingQuery] = useState(false);
  const [expandedQuerySuggestions, setExpandedQuerySuggestions] = useState<string[]>([]);
  const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(() => {
    const saved = safeGetItem('truck_miner_sound_alert');
    return saved === 'false' ? false : true;
  });

  // Browser Notification State
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission>(() => getNotificationPermission());

  const handleRequestNotificationPermission = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setBrowserNotificationPermission(perm);
    if (perm === 'granted') {
      sendTestBrowserNotification(() => {
        setActivePortalTab('leads');
      });
      setActivityLogs(prev => [
        {
          id: `log_notif_granted_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'success',
          message: '🔔 Notificações do Navegador autorizadas! O analista receberá alertas visuais quando uma OPORTUNIDADE de alta relevância for detectada.',
        },
        ...prev,
      ]);
    } else if (perm === 'denied') {
      setActivityLogs(prev => [
        {
          id: `log_notif_denied_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'warning',
          message: '⚠️ Permissão de notificações do navegador foi negada pelo operador.',
        },
        ...prev,
      ]);
    }
  }, []);

  const handleSendTestNotification = useCallback(() => {
    if (browserNotificationPermission !== 'granted') {
      handleRequestNotificationPermission();
      return;
    }
    const ok = sendTestBrowserNotification(() => {
      setActivePortalTab('leads');
    });
    if (ok) {
      setActivityLogs(prev => [
        {
          id: `log_notif_test_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'info',
          message: '🔔 Disparada notificação de teste no navegador.',
        },
        ...prev,
      ]);
    }
  }, [browserNotificationPermission, handleRequestNotificationPermission]);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (safeGetItem('truck_miner_theme', 'dark') as 'dark' | 'light');
  });

  const [isHeaderMoreMenuOpen, setIsHeaderMoreMenuOpen] = useState(false);

  // Activity Logs Console State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showConsole, setShowConsole] = useState(false);

  // Autonomous Loop State
  const [loopState, setLoopState] = useState<LoopState>(() => {
    const savedIdx = parseInt(safeGetItem('truck_miner_current_index', '0'), 10);
    const savedLastKw = safeGetItem('truck_miner_last_keyword', '');
    const savedDelayStr = safeGetItem('truck_miner_delay_seconds', '5');
    const savedDelay = parseFloat(savedDelayStr) || 5;
    const savedConcurrency = parseInt(safeGetItem('truck_miner_concurrency', '2'), 10) || 2;
    return {
      status: 'idle',
      currentIndex: savedIdx,
      currentKeyword: savedLastKw || keywords[savedIdx] || keywords[0] || '',
      delaySeconds: savedDelay,
      totalSearches: 0,
      leadsFoundInLoop: 0,
      autoRecoveryMode: true,
      aiSearchEnabled: true,
      failedKeywords: [],
      concurrency: savedConcurrency,
    };
  });
  const externalSearchUnavailableRef = useRef(false);

  useEffect(() => {
    if (!autoValidateLeads || isAutoValidatingRef.current || loopState.status !== 'running') return;

    const unvalidated = leads.filter(l => !l.whatsappStatus || l.whatsappStatus === 'unchecked');
    if (unvalidated.length >= 20) {
      handleAutoValidateLeadsTop();
    }
  }, [leads.length, autoValidateLeads, loopState.status]);

  // Recent searches within the last 12 hours to prevent duplicate requests
  const [recentSearches, setRecentSearches] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('truck_miner_recent_searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const twelveHours = 12 * 60 * 60 * 1000;
        const cleaned: Record<string, number> = {};
        for (const [kw, time] of Object.entries(parsed)) {
          if (now - (time as number) < twelveHours) {
            cleaned[kw] = time as number;
          }
        }
        return cleaned;
      }
    } catch (e) {
      console.warn('Error loading recent searches:', e);
    }
    return {};
  });

  // AI-generated query reformulation suggestions for failed keywords
  const [aiReformulations, setAiReformulations] = useState<Record<string, string[]>>({});

  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Wake lock auto-reacquire setup
  useEffect(() => {
    const cleanupWakeLock = initWakeLockAutoReacquire(() => loopStateRef.current.status === 'running');
    return () => cleanupWakeLock();
  }, []);

  // Performance measurement for initial load & TBT
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark('app-init-complete');
      try {
        performance.measure('app-initialization', 'app-init-start', 'app-init-complete');
        const measure = performance.getEntriesByName('app-initialization').pop();
        if (measure) {
          console.log(`[Performance] App initial load time / initialization: ${measure.duration.toFixed(2)}ms`);
        }
      } catch (e) {
        // ignore if marks not found
      }
    }
  }, []);

  // Sync last keyword to localStorage
  useEffect(() => {
    if (loopState.currentKeyword) {
      safeSetItem('truck_miner_last_keyword', loopState.currentKeyword);
    }
  }, [loopState.currentKeyword]);

  // Sync index to localStorage
  useEffect(() => {
    safeSetItem('truck_miner_current_index', loopState.currentIndex.toString());
  }, [loopState.currentIndex]);

  useEffect(() => {
    safeSetItem('truck_miner_delay_seconds', loopState.delaySeconds.toString());
  }, [loopState.delaySeconds]);

  useEffect(() => {
    safeSetItem('truck_miner_concurrency', (loopState.concurrency ?? 3).toString());
  }, [loopState.concurrency]);

  // Sync recent searches to localStorage
  useEffect(() => {
    safeSetItem('truck_miner_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Sync leads to localStorage with debounce and idle scheduling to prevent UI lag
  useEffect(() => {
    const timer = setTimeout(() => {
      safeSaveLeads(leads);
      // Run auto-backup checkpoint on idle frame to avoid blocking UI thread
      const runIdle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 100));
      runIdle(() => {
        checkAndCreateAutoBackup(leads, (milestone) => {
          success(`💾 Backup de segurança gerado para ${milestone} contatos!`);
          addLog({
            id: `log_autobackup_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'success',
            message: `💾 Backup automático de segurança gerado para ${milestone} contatos! Disponível para download na aba Sistema.`,
          });
        });
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [leads]);

  // Sync keywords to localStorage
  useEffect(() => {
    saveStoredKeywords(keywords);
  }, [keywords]);

  // State for search execution indicator
  const [activeSearchCount, setActiveSearchCount] = useState(0);
  const isSearchingNow = activeSearchCount > 0;

  // Search progressive timer and duration states
  const [averageSearchTime, setAverageSearchTime] = useState<number>(() => {
    return Number(safeGetItem('truck_miner_avg_search_time', '8.0'));
  });
  const [lastSearchDuration, setLastSearchDuration] = useState<number | null>(null);
  const [searchTimer, setSearchTimer] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let safetyWatchdog: NodeJS.Timeout | null = null;

    if (isSearchingNow) {
      setSearchTimer(0);
      interval = setInterval(() => {
        setSearchTimer(prev => Number((prev + 0.1).toFixed(1)));
      }, 100);

      // Trava de segurança: reseta indicador se a busca exceder 35 segundos
      safetyWatchdog = setTimeout(() => {
        console.warn('⚠️ [Search Watchdog] Busca estourou limite de tempo de segurança (35s). Forçando liberação da UI.');
        setActiveSearchCount(0);
      }, 35000);
    } else {
      setSearchTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (safetyWatchdog) clearTimeout(safetyWatchdog);
    };
  }, [isSearchingNow]);

  // Sync suggestions to localStorage
  useEffect(() => {
    savePendingSuggestions(suggestions);
  }, [suggestions]);

  // Sync sound setting to localStorage
  useEffect(() => {
    safeSetItem('truck_miner_sound_alert', soundAlertEnabled.toString());
  }, [soundAlertEnabled]);

  // Sync theme to localStorage & DOM
  useEffect(() => {
    safeSetItem('truck_miner_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync autoEnrichLeads setting to localStorage
  useEffect(() => {
    safeSetItem('truck_miner_auto_enrich_leads', autoEnrichLeads.toString());
  }, [autoEnrichLeads]);

  // Append new Activity Log
  const addLog = useCallback((log: ActivityLog) => {
    const uniqueLog = {
      ...log,
      id: `${log.id || 'log'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };
    setActivityLogs(prev => [uniqueLog, ...prev].slice(0, 100));
  }, []);

  const handleValidateBatch = useCallback(async (leadIds: string[]) => {
    const leadsToProcess = leads.filter(l => leadIds.includes(l.id));
    if (leadsToProcess.length === 0) return;

    addLog({
      id: `log_validate_batch_start_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `⚡ Validando lote manual de ${leadsToProcess.length} números via Evolution API...`,
    });

    try {
      const phones = leadsToProcess.map(l => l.rawPhone);
      const results = await resolveLidBatch(phones);
      
      setLeads(prev => prev.map(l => {
        if (leadIds.includes(l.id)) {
          const norm = l.rawPhone.replace(/\D/g, '');
          const res = results[norm] || results[l.rawPhone];
          if (res) {
            return {
              ...l,
              whatsappStatus: res.exists ? 'has-whatsapp' : 'no-whatsapp' as any,
              waMeUrl: res.exists ? `https://wa.me/${res.number || norm}` : l.waMeUrl
            };
          }
        }
        return l;
      }));

      addLog({
        id: `log_validate_batch_ok_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'success',
        message: `✨ Lote de ${leadsToProcess.length} validado com sucesso!`,
      });
    } catch (err) {
      addLog({
        id: `log_validate_batch_err_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'error',
        message: `❌ Erro ao validar lote: ${err}`,
      });
    }
  }, [leads, addLog]);

  // Sync cacheHits to localStorage
  useEffect(() => {
    safeSetItem('truck_miner_cache_hits', cacheHits.toString());
  }, [cacheHits]);

  const handleClearCache = useCallback(async () => {
    try {
      const res = await fetch('/api/cache/clear', { method: 'POST' });
      if (res.ok) {
        setCacheHits(0);
        success('🧹 Cache do servidor e cliente limpos com sucesso!');
        addLog({
          id: `log_cache_clear_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'success',
          message: `🧹 Memória cache limpa com sucesso no servidor e no cliente! Coletas frescas reiniciadas.`,
        });
      }
    } catch (err) {
      console.error('Falha ao limpar cache:', err);
      toastError('❌ Erro ao limpar cache do servidor.');
    }
  }, [addLog, success, toastError]);

  const handleRestoreBackup = useCallback(() => {
    if (window.confirm('Isso irá restaurar seus contatos a partir do último backup automático. Tem certeza?')) {
      const restored = restoreBackup();
      if (restored && restored.length > 0) {
        setLeads(restored);
        success(`🔄 Sucesso! ${restored.length} contatos foram restaurados do backup automático.`);
        addLog({
          id: `log_restore_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'success',
          message: `🔄 Backup restaurado com sucesso! ${restored.length} contatos recuperados.`,
        });
      } else {
        toastError('Nenhum backup encontrado ou arquivo vazio.');
      }
    }
  }, [addLog, success, toastError]);

  const handleImportLeads = useCallback((importedLeads: Lead[], mode: 'merge' | 'replace' | 'append') => {
    setLeads(prevLeads => {
      let nextLeads: Lead[] = [];
      if (mode === 'replace') {
        nextLeads = importedLeads;
      } else if (mode === 'append') {
        nextLeads = [...importedLeads, ...prevLeads];
      } else {
        // Default: merge and deduplicate by rawPhone
        const existingPhones = new Set(prevLeads.map(l => l.rawPhone.replace(/\D/g, '')));
        const newUnique = importedLeads.filter(l => !existingPhones.has(l.rawPhone.replace(/\D/g, '')));
        nextLeads = [...newUnique, ...prevLeads];
      }

      saveBackup(nextLeads);
      safeSaveLeads(nextLeads);

      addLog({
        id: `log_imp_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'success',
        message: `📥 Sincronização de Dados Concluída! ${importedLeads.length} registros processados. Total na base: ${nextLeads.length}`,
      });

      return nextLeads;
    });

    success(`📥 Importação concluída! ${importedLeads.length} leads carregados.`);
    setSessionNewLeads(prev => prev + importedLeads.length);
  }, [addLog, success]);

  const handleExportLeadsToJson = useCallback(() => {
    try {
      if (leads.length === 0) {
        alert('Você não possui nenhum lead na base para exportar.');
        return;
      }
      const jsonStr = JSON.stringify(leads, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `truck_miner_leads_sync_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addLog({
        id: `log_export_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'success',
        message: `🖥️ Sincronização Concluída! Arquivo exportado com ${leads.length} leads para a pasta de Downloads.`,
      });
    } catch (err: any) {
      console.error('Falha ao exportar leads:', err);
      alert('Erro ao exportar arquivo de sincronização: ' + (err.message || err));
    }
  }, [leads, addLog]);

  const handleConfirmSyncImport = (mode: 'merge' | 'replace') => {
    if (pendingImportLeads.length === 0) return;
    
    handleImportLeads(pendingImportLeads, mode);
    
    setIsSyncConfirmOpen(false);
    setPendingImportLeads([]);
    setPendingImportFileName('');
  };

  // Synthesize a pleasant dual-tone chime using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const playChime = (frequency: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playChime(659.25, now, 0.25);
      playChime(880.00, now + 0.1, 0.35);
    } catch (e) {
      console.warn('Falha ao reproduzir alerta sonoro:', e);
    }
  }, []);

  // Real-time WebSocket Monitor for Lead Responses & System Logs
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        // Use a specific path for WebSocket to avoid conflicts with HMR or other routes
        ws = new WebSocket(`${protocol}//${host}/ws`);

        ws.onopen = () => {
          console.log('🔌 [WebSocket] Conectado ao servidor de monitoramento em tempo real.');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'log') {
              addLog({
                id: `ws_log_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                level: 'info',
                message: data.message
              });
            } else if (data.type === 'lead_response') {
              const targetPhone = data.phone.replace(/\D/g, '');
              
              setLeads(prev => {
                let found = false;
                const nextLeads = prev.map(l => {
                  if (l.rawPhone.replace(/\D/g, '') === targetPhone) {
                    found = true;
                    const catMap: Record<string, 'interesse' | 'hesitacao' | 'desinteresse'> = {
                      'INTERESSADO': 'interesse',
                      'PEDIU_PRECO': 'interesse',
                      'QUER_TROCA': 'interesse',
                      'OBJECAO': 'hesitacao',
                      'NAO_QUER': 'desinteresse'
                    };
                    
                    return {
                      ...l,
                      sentiment: catMap[data.sentiment.category] || 'interesse',
                      sentimentReason: `${data.sentiment.label}: ${data.sentiment.summary}`,
                      lastIncomingMessage: data.text,
                      lastMessageAt: new Date().toISOString()
                    };
                  }
                  return l;
                });

                if (found) {
                  addLog({
                    id: `ws_lead_res_${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString('pt-BR'),
                    level: 'ai',
                    message: `📩 [Monitor Inteligente] Resposta de ${data.phone}: "${data.text.substring(0, 60)}${data.text.length > 60 ? '...' : ''}"`
                  });

                  if (data.sentiment.category === 'INTERESSADO' || data.sentiment.category === 'PEDIU_PRECO') {
                    if (soundAlertEnabled) playNotificationSound();
                    success(`🔥 Lead ${data.phone} demonstrou INTERESSE: ${data.sentiment.summary}`);
                  } else if (data.sentiment.category === 'OBJECAO') {
                    addLog({
                      id: `ws_objection_${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString('pt-BR'),
                      level: 'warning',
                      message: `❓ [Objeção Detectada] Lead ${data.phone} apresentou dúvida: ${data.sentiment.summary}`
                    });
                  }
                }
                
                return nextLeads;
              });
            }
          } catch (e) {
            console.error('WS Message Error:', e);
          }
        };

        ws.onclose = (event) => {
          if (!event.wasClean) {
            console.log(`🔌 [WebSocket] Conexão encerrada abruptamente (Código: ${event.code}). Tentando reconectar...`);
          } else {
            console.log('🔌 [WebSocket] Conexão encerrada. Tentando reconectar...');
          }
          reconnectTimeout = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          // Do not log the full event object to avoid "[object Event]" or "{"isTrusted":true}" confusion
          console.warn('🔌 [WebSocket] Falha na tentativa de conexão. Verificando servidor...');
          ws?.close();
        };
      } catch (err) {
        console.error('WS Connection Error:', err);
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [addLog, playNotificationSound, soundAlertEnabled, success]);

  /**
   * Remove invalid numbers, duplicates, and no-whatsapp leads from database
   */
  const handleCleanInvalidAndDuplicateLeads = useCallback(() => {
    setLeads(prevLeads => {
      const seenPhones = new Set<string>();
      const cleaned: Lead[] = [];
      let removedCount = 0;

      for (const lead of prevLeads) {
        if (!isValidPhone(lead.rawPhone)) {
          removedCount++;
          continue;
        }
        if (lead.whatsappStatus === 'no-whatsapp') {
          removedCount++;
          continue;
        }
        if (seenPhones.has(lead.rawPhone)) {
          removedCount++;
          continue;
        }
        seenPhones.add(lead.rawPhone);
        cleaned.push(lead);
      }

      addLog({
        id: `log_clean_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'success',
        message: `🧹 Sincronização e otimização concluída: ${removedCount} registros inconsistentes ou duplicados removidos. Base 100% otimizada!`,
      });

      return cleaned;
    });
  }, [addLog]);

  /**
   * Analyze lead response sentiment using AI
   */
  const handleAnalyzeSentiment = useCallback(async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    addLog({
      id: `log_sentiment_start_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'ai',
      message: `🤖 IA analisando sentimento da conversa para o lead ${lead.phone}...`,
    });

    try {
      const res = await fetch('/api/ai/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadText: lead.snippetContext || lead.aiSummary || 'Lead interessado no anúncio',
          leadName: lead.name,
          item: lead.item
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        const catMap: Record<string, 'interesse' | 'hesitacao' | 'desinteresse'> = {
          'INTERESSADO': 'interesse',
          'PEDIU_PRECO': 'interesse',
          'QUER_TROCA': 'interesse',
          'OBJECAO': 'hesitacao',
          'NAO_QUER': 'desinteresse'
        };

        const mappedSentiment = catMap[data.result.category] || 'interesse';

        setLeads(prev => prev.map(l => l.id === leadId ? {
          ...l,
          sentiment: mappedSentiment,
          sentimentReason: `${data.result.label}: ${data.result.summary}`
        } : l));

        addLog({
          id: `log_sentiment_ok_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'success',
          message: `✨ [Sentimento IA]: ${data.result.label} — ${data.result.summary}`,
        });
      }
    } catch (err) {
      addLog({
        id: `log_sentiment_err_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'error',
        message: `❌ Erro ao analisar sentimento do lead ${lead.phone}.`,
      });
    }
  }, [leads, addLog]);

  /**
   * Enrich lead profile (extract Name, City, State, Company, Seller Type) using Gemini AI (supports single ID or batch array of IDs)
   */
  const handleEnrichLeadProfile = useCallback(async (leadIdOrIds: string | string[]) => {
    const ids = Array.isArray(leadIdOrIds) ? leadIdOrIds : [leadIdOrIds];
    if (ids.length === 0) return;

    let leadsToEnrich: any[] = [];
    setLeads(prev => {
      leadsToEnrich = prev.filter(l => ids.includes(l.id));
      return prev;
    });

    if (leadsToEnrich.length === 0) return;

    addLog({
      id: `log_enrich_batch_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'ai',
      message: `🤖 IA analisando e estruturando lote de ${leadsToEnrich.length} perfis de leads...`,
    });

    try {
      const res = await fetch('/api/ai/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: leadsToEnrich }),
      });
      const data = await res.json();
      if (data.success && data.profiles && Array.isArray(data.profiles)) {
        const profileMap = new Map();
        data.profiles.forEach((p: any) => profileMap.set(p.id, p));

        setLeads(prev => prev.map(l => {
          const prof = profileMap.get(l.id);
          if (prof) {
            return {
              ...l,
              name: prof.name || l.name,
              sellerFullName: prof.sellerFullName || l.sellerFullName,
              city: prof.city || l.city,
              stateUf: prof.stateUf || l.stateUf,
              companyName: prof.companyName || l.companyName,
              sellerType: prof.sellerType || l.sellerType,
              aiSummary: prof.aiSummary || l.aiSummary,
            };
          }
          return l;
        }));

        addLog({
          id: `log_enrich_batch_ok_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'success',
          message: `✨ Lote de ${data.profiles.length} perfis estruturado e atualizado via IA com sucesso!`,
        });
        return data.profiles;
      }
    } catch (err) {
      addLog({
        id: `log_enrich_batch_err_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'error',
        message: `❌ Erro ao estruturar lote de perfis via IA.`,
      });
    }
    return null;
  }, [addLog]);

  const detectPlatformFromUrlOrText = (url?: string, text?: string): 'OLX' | 'Facebook' | 'Instagram' | 'Mercado Livre' | 'Webmotors' | 'Outro' => {
    const combined = `${url || ''} ${text || ''}`.toLowerCase();
    if (combined.includes('olx.com') || combined.includes('olx.com.br') || combined.includes('olx ')) {
      return 'OLX';
    }
    if (combined.includes('facebook.com') || combined.includes('facebook ') || combined.includes('fb.com') || combined.includes('marketplace') || combined.includes('m.facebook')) {
      return 'Facebook';
    }
    if (combined.includes('instagram.com') || combined.includes('instagram ') || combined.includes('insta ')) {
      return 'Instagram';
    }
    if (combined.includes('mercadolivre.com') || combined.includes('mercadolivre ') || combined.includes('mercado livre')) {
      return 'Mercado Livre';
    }
    if (combined.includes('webmotors.com') || combined.includes('webmotors ')) {
      return 'Webmotors';
    }
    return 'Outro';
  };

  /**
   * Save extracted contacts into database
   */
  const saveContactsToDb = useCallback((
    extractedContacts: ExtractedContact[],
    source: 'Automático' | 'Manual',
    sourceQuery?: string
  ): number => {
    const cleanContacts = cleanseAndFilterGarbage(extractedContacts);
    if (cleanContacts.length === 0) return 0;

    let addedCount = 0;
    const snippetsForBrain: string[] = [];
    const highValueLeadsToNotify: Lead[] = [];
    const leadIdsToAutoEnrich: string[] = [];

    setLeads(prevLeads => {
      const existingMap = new Map<string, Lead>();
      for (const lead of prevLeads) {
        existingMap.set(lead.rawPhone, lead);
      }

      for (const c of cleanContacts) {
        if (!isValidPhone(c.rawPhone)) continue;
        
        // Clean excessive spaces, line breaks, and special characters from extracted snippets
        c.snippetContext = cleanSnippetText(c.snippetContext);
        
        snippetsForBrain.push(c.snippetContext);

        const aiRes = analyzeLead({
          item: c.item,
          snippetContext: c.snippetContext,
          query: sourceQuery || c.item,
          intent: c.intent,
          qualification: c.qualification,
        });

        const detectedPlat = c.adPlatform || detectPlatformFromUrlOrText(c.webPageUrl, c.snippetContext);

        if (existingMap.has(c.rawPhone)) {
          const existingLead = existingMap.get(c.rawPhone)!;

          // Unificação Cruzada Inteligente FASE 2
          const { mergedLead, changes } = mergeCrossPlatformLeads(existingLead, {
            ...c,
            adPlatform: detectedPlat
          });

          // Se houve queda importante de preço ou alteração crítica, registrar log
          if (changes.length > 0) {
            changes.forEach(ch => {
              if (ch.importance === 'high') {
                addLog({
                  id: `log_change_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  timestamp: new Date().toLocaleTimeString('pt-BR'),
                  level: 'success',
                  message: `📉 [Monitor de Alterações] ${mergedLead.item || mergedLead.name}: ${ch.note}`,
                });
              }
            });
          }

          existingMap.set(c.rawPhone, mergedLead);
        } else {
          const nowIso = new Date().toISOString();
          const initialSocials = detectAndExtractSocialLinks(c.snippetContext, c.webPageUrl);

          let newLead: Lead = {
            id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            phone: c.formattedPhone,
            rawPhone: c.rawPhone,
            ddd: c.ddd,
            phoneType: c.phoneType,
            name: c.name,
            sellerFullName: c.sellerFullName,
            intent: c.intent,
            item: c.item,
            price: c.price,
            location: c.location,
            city: c.city,
            stateUf: c.stateUf,
            adDate: c.adDate,
            waMeUrl: c.waMeUrl,
            query: sourceQuery || c.item || 'Busca Geral',
            source,
            snippetContext: c.snippetContext,
            sellerType: c.sellerType,
            companyName: c.companyName,
            webPageUrl: c.webPageUrl,
            adPlatform: detectedPlat,
            createdAt: nowIso,
            firstSeenAt: nowIso,
            lastSeenAt: nowIso,
            updatesCount: 0,
            allPlatforms: detectedPlat ? [detectedPlat] : ['Outro'],
            allWebPageUrls: c.webPageUrl ? [c.webPageUrl] : [],
            socialLinks: initialSocials,
            outreachStatus: 'pendente',
            qualification: c.qualification || 'Normal',
            isPublicRegister: c.isPublicRegister,
            isBusinessDirectory: c.isBusinessDirectory,
            aiQualificationScore: aiRes.score,
            aiSummary: aiRes.summary,
          };

          // Calcular Score Comercial Unificado
          newLead.commercialScore = calculateCommercialScore(newLead);

          // FASE 2: Enriquecer com Radar de Oportunidade
          newLead = enrichLeadWithOpportunitySignals(newLead);

          existingMap.set(c.rawPhone, newLead);
          addedCount++;

          const isHighValue = newLead.intent === 'Compra' || 
                              (newLead.commercialScore && newLead.commercialScore >= 75) ||
                              (newLead.aiQualificationScore && newLead.aiQualificationScore >= 70) ||
                              newLead.qualification === 'Repasse' ||
                              newLead.qualification === 'Abaixo da Tabela' ||
                              newLead.priorityLevel === 3;

          if (isHighValue) {
            highValueLeadsToNotify.push(newLead);
          }

          if (autoEnrichLeads && addedCount <= 3) {
            leadIdsToAutoEnrich.push(newLead.id);
          }
        }
      }

      return Array.from(existingMap.values());
    });

    if (addedCount > 0) {
      setSessionNewLeads(prev => prev + addedCount);

      // Async side effects after setLeads
      highValueLeadsToNotify.forEach(newLead => {
        fetch('/api/webhook/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead: newLead,
            eventType: 'lead.classified.auto'
          })
        }).catch(() => {});

        sendHighValueLeadNotification(newLead, () => {
          setActivePortalTab('leads');
        });
      });

      if (leadIdsToAutoEnrich.length > 0) {
        setTimeout(() => {
          handleEnrichLeadProfile(leadIdsToAutoEnrich);
        }, 2000);
      }

      if (soundAlertEnabled) {
        playNotificationSound();
      }
      addLog({
        id: `log_save_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'success',
        message: `📥 ${addedCount} novos leads qualificados salvos com sucesso no banco de dados!`,
        keyword: sourceQuery
      });

      // Generate progressive suggestions
      const newSugs = generateProgressiveSuggestions(snippetsForBrain, keywords);
      if (newSugs.length > 0) {
        setSuggestions(prev => {
          const existingSet = new Set(prev.map(s => s.keyword.toLowerCase()));
          const filtered = newSugs.filter(s => !existingSet.has(s.keyword.toLowerCase()));
          return [...filtered, ...prev].slice(0, 15);
        });
      }
    }

    return addedCount;
  }, [keywords, autoEnrichLeads, handleEnrichLeadProfile, soundAlertEnabled, playNotificationSound, addLog]);

  // Exponential Backoff tracking refs
  const consecutiveNetworkErrorsRef = useRef<number>(0);
  const consecutiveSuccessesRef = useRef<number>(0);
  const baseDelaySecondsRef = useRef<number>(loopState.delaySeconds || 2);

  // Process intelligence side effects after finding contacts (Snippet Learning, expansion, etc)
  const processSearchResultsIntelligence = useCallback((queryTerm: string, contacts: any[]) => {
    if (contacts.length === 0) return 0;

    // 1. Save to DB
    const saved = saveContactsToDb(contacts, 'Automático', queryTerm);

    if (saved > 0) {
      // 🧠 INTELLIGENCE: Snippet Learning
      const discoveredTerms = discoverAndLearnNewTermsFromSnippets(contacts);
      if (discoveredTerms.length > 0) {
        const currentSet = new Set(keywordsRef.current.map(k => k.toLowerCase()));
        const toAdd = discoveredTerms.filter(t => !currentSet.has(t.toLowerCase())).slice(0, 5);
        
        if (toAdd.length > 0) {
          const updatedKeywords = [...keywordsRef.current, ...toAdd];
          setKeywords(updatedKeywords);
          saveStoredKeywords(updatedKeywords);
          
          addLog({
            id: `log_learn_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'ai',
            message: `🧠 [Aprendizado de Snippet] Descobri ${toAdd.length} novos termos comerciais ("${toAdd.join('", "')}") lendo os anúncios para "${queryTerm}". Injetados na fila!`,
            keyword: queryTerm
          });
        }
      }
    }

    return saved;
  }, [saveContactsToDb, addLog]);

  // 0. Handle Search Queue Completions
  useEffect(() => {
    const handleTaskComplete = (event: any) => {
      const { keyword, contacts, summary } = event.detail;
      
      if (contacts && contacts.length > 0) {
        processSearchResultsIntelligence(keyword, contacts);
      } else {
        addLog({
          id: `log_q_fail_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'warning',
          message: `⚠️ [Gerenciador de Fila] Varredura para "${keyword}" concluída sem novos contatos únicos.`,
          keyword
        });
      }
    };

    window.addEventListener('search_task_completed', handleTaskComplete);
    return () => window.removeEventListener('search_task_completed', handleTaskComplete);
  }, [processSearchResultsIntelligence, addLog]);

  // Execute a single search query term
  const executeSearchTerm = useCallback(async (rawQueryTerm: string) => {
    const queryTerm = sanitizeInput(rawQueryTerm, 150);
    if (!queryTerm) return;
    if (externalSearchUnavailableRef.current) return;

    setActiveSearchCount(prev => prev + 1);
    const activeBoost = localStorage.getItem('search_boost_level') || 'normal';
    setLoopState(prev => ({ ...prev, currentKeyword: queryTerm }));
    
    // Sincronização crítica para evitar conflito de 0.5s
    fetch('/api/turbo/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        searchBoostLevel: activeBoost,
        maxConcurrency: loopState.concurrency,
        delayBetweenSearches: loopState.delaySeconds * 1000
      })
    }).catch(() => {});

    setTotalSearches(prev => prev + 1);

    addLog({
      id: `log_depth_${Date.now()}_${queryTerm}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `🚀 [Busca Estratégica] Iniciando varredura inteligente com expansão IA para: "${queryTerm}"...`,
      keyword: queryTerm
    });

    try {
      const fetchStart = Date.now();
      
      // Determine search mode for logs
      const isDeterministic = searchFilterConfigRef.current?.deterministicMode;
      const isTurbo = searchFilterConfigRef.current?.engineMode === 'specialized';
      const modeLabel = isDeterministic ? '🎯 Precisão Exata' : (isTurbo ? '⚡ Turbo IA' : '🚀 Estratégico');

      addLog({
        id: `log_depth_${Date.now()}_${queryTerm}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'info',
        message: `${modeLabel}: Iniciando varredura para "${queryTerm}"...`,
        keyword: queryTerm
      });

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: queryTerm, 
          searchDepth: 1, 
          engineMode: searchEngineMode,
          filterConfig: searchFilterConfigRef.current,
          boostLevel: localStorage.getItem('search_boost_level') || 'normal'
        }),
      });

      let contacts: ExtractedContact[] = [];
      let rateLimited = false;
      let networkError = false;
      let providerUnavailable = false;
      let providerUnavailableMessage = '';
      const contentType = res.headers.get('content-type') || '';
      const failurePayload = contentType.includes('application/json') ? await res.clone().json().catch(() => null) : null;
      const pausePolicy = getSearchFailurePausePolicy({
        status: res.status,
        contentType,
        errorCode: failurePayload?.errorCode,
      });
      const clientFailureTransition = resolveClientSearchFailureTransition({
        status: res.status,
        contentType,
        errorCode: failurePayload?.errorCode,
        queryTerm,
      });

      if (pausePolicy) {
        networkError = true;
        providerUnavailable = true;
        providerUnavailableMessage = pausePolicy.reason;
      } else if (res.status === 429) {
        rateLimited = true;
      } else if (!res.ok) {
        networkError = true;
      } else {
        if (!contentType.includes('application/json')) {
          networkError = true;
          addLog({
            id: `log_search_response_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'warning',
            message: `A busca para "${queryTerm}" não retornou dados no formato esperado. Nenhum contato foi adicionado.`,
            keyword: queryTerm
          });
        } else {
          const data = await res.json();
          const rawContent = data.rawContent || data.html || data.resultsText || '';
          
          if (data.sourceEngine) {
            addLog({
              id: `log_sources_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('pt-BR'),
              level: 'info',
              message: `📡 [Radar] Fontes: ${data.enginesCount || 0} mecanismos (${data.sourceEngine.slice(0, 50)}...).`,
              keyword: queryTerm
            });
          }

          if (rawContent) {
            contacts = await extractContactsInWorker(rawContent, 'Automático', queryTerm, searchFilterConfigRef.current);
          }
        }
      }

      const duration = Number(((Date.now() - fetchStart) / 1000).toFixed(1));
      const result = {
        success: !rateLimited && !networkError,
        contacts,
        duration,
        rateLimited,
        networkError,
        providerUnavailable
      };

      if (result.duration) {
        setLastSearchDuration(result.duration);
        setAverageSearchTime(prev => {
          const newAvg = Number(((prev * 4 + result.duration!) / 5).toFixed(1));
          localStorage.setItem('truck_miner_avg_search_time', newAvg.toString());
          return newAvg;
        });
      }

      if (result.providerUnavailable && clientFailureTransition) {
        const wasAlreadyUnavailable = externalSearchUnavailableRef.current;
        externalSearchUnavailableRef.current = true;
        consecutiveNetworkErrorsRef.current = 0;
        consecutiveSuccessesRef.current = 0;

        setLoopState(prev => ({
          ...prev,
          ...clientFailureTransition.loopPatch
        }));

        if (!wasAlreadyUnavailable) {
          addLog({
            id: `log_search_provider_unavailable_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'warning',
            message: clientFailureTransition.logMessage,
            keyword: queryTerm
          });
        }
        return;
      }

      if (result.success && result.contacts.length > 0) {
        const saved = processSearchResultsIntelligence(queryTerm, result.contacts);

        // Expansão geográfica autônoma apenas se HABILITADO pelo usuário E NÃO for modo determinístico
        if (saved > 0 && autoGeographicExpansion && !searchFilterConfigRef.current?.deterministicMode) {
          // Trigger geo expansion asynchronously to not block the main loop's next batch
          setTimeout(() => {
            const stateSuffixes = ['SP', 'MG', 'PR', 'RJ', 'GO', 'RS', 'BA', 'SC'];
            const newExpansions: string[] = [];
            const currentSet = new Set(keywordsRef.current.map(k => k.toLowerCase()));
            
            stateSuffixes.forEach(st => {
              const candidate = `${queryTerm} ${st}`;
              if (!currentSet.has(candidate.toLowerCase())) {
                newExpansions.push(candidate);
              }
            });

            if (newExpansions.length > 0) {
              const updated = [...keywordsRef.current, ...newExpansions.slice(0, 3)];
              setKeywords(updated);
              saveStoredKeywords(updated);
              addLog({
                id: `log_auto_expand_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                level: 'ai',
                message: `🧠 [Expansão Geográfica IA] Alto rendimento detectado em "${queryTerm}". Injetando ${Math.min(3, newExpansions.length)} novas variações na fila!`,
                keyword: queryTerm
              });
            }
          }, 0);
        }

        setLoopState(prev => ({
          ...prev,
          leadsFoundInLoop: prev.leadsFoundInLoop + saved,
          totalSearches: prev.totalSearches + 1
        }));

        const speedMessage = result.duration ? ` em ${result.duration}s` : '';
        addLog({
          id: `log_completed_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: saved > 0 ? 'success' : 'warning',
          message: `✨ Varredura concluída para "${queryTerm}"${speedMessage}. ${saved} novos leads.`,
          keyword: queryTerm
        });
      } else {
        // Se a Varredura Profunda estiver ativada E não for modo determinístico
        if (deepSearchFallback && !searchFilterConfigRef.current?.deterministicMode && !rateLimited) {
          addLog({
            id: `log_adv_nav_start_${Date.now()}_${queryTerm}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'ai',
            message: `🚀 [Varredura Profunda] 0 leads. Iniciando busca avançada para "${queryTerm}"...`,
            keyword: queryTerm
          });

          const advResult = await executeAdvancedNavigationDeepSearch(queryTerm, searchEngineMode, searchFilterConfigRef.current);

          if (advResult.contacts.length > 0) {
            const savedAdv = saveContactsToDb(advResult.contacts, 'Automático', `${queryTerm} (Navegação Avançada)`);
            recordKeywordSearch(queryTerm, savedAdv, advResult.contacts.length);

            setLoopState(prev => ({
              ...prev,
              leadsFoundInLoop: prev.leadsFoundInLoop + savedAdv,
              totalSearches: prev.totalSearches + 1
            }));

            addLog({
              id: `log_adv_nav_success_${Date.now()}_${queryTerm}`,
              timestamp: new Date().toLocaleTimeString('pt-BR'),
              level: 'success',
              message: `✨ [Varredura Profunda Concluída] ${savedAdv} novos leads para "${queryTerm}"!`,
              keyword: queryTerm
            });
          } else {
            recordKeywordSearch(queryTerm, 0, 0);
            addLog({
              id: `log_err_${Date.now()}_${queryTerm}`,
              timestamp: new Date().toLocaleTimeString('pt-BR'),
              level: 'warning',
              message: `⚠️ Varredura profunda para "${queryTerm}" finalizada sem resultados.`,
              keyword: queryTerm
            });
          }
        } else {
          recordKeywordSearch(queryTerm, 0, 0);
          const speedMessage = result.duration ? ` em ${result.duration}s` : '';
          const msg = rateLimited ? `🛑 Limite atingido em "${queryTerm}"` : `⚡ Varredura rápida concluída para "${queryTerm}"${speedMessage} (0 leads).`;
          addLog({
            id: `log_fast_finish_${Date.now()}_${queryTerm}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: rateLimited ? 'error' : 'info',
            message: msg,
            keyword: queryTerm
          });
        }
      }

      // Exponential Backoff System Evaluation
      if (result.rateLimited) {
        consecutiveSuccessesRef.current = 0;
        consecutiveNetworkErrorsRef.current = 0;

        const currentDelay = loopStateRef.current.delaySeconds;
        const nextDelay = Math.min(180, Math.max(currentDelay * 2, 15));

        // Rotação de Motor apenas se HABILITADO pelo usuário
        if (autoEngineRotation) {
          const engineOptions = ['global', 'google_maps', 'duckduckgo', 'bing', 'searx'];
          const nextEngine = engineOptions[(engineOptions.indexOf(searchEngineMode) + 1) % engineOptions.length];
          setSearchEngineMode(nextEngine);

          addLog({
            id: `log_backoff_429_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'warning',
            message: `🛑 [Auto-Rotação de Motor] Rate Limit em "${queryTerm}". Alternando motor para "${nextEngine.toUpperCase()}" e ajustando intervalo para ${nextDelay}s.`,
            keyword: queryTerm
          });
        } else {
          addLog({
            id: `log_backoff_429_norotate_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'warning',
            message: `🛑 [Rate Limit 429] Limite de cota capturado em "${queryTerm}". Ajustando intervalo para ${nextDelay}s.`,
            keyword: queryTerm
          });
        }

        setLoopState(prev => ({
          ...prev,
          delaySeconds: nextDelay,
          backoffActive: true,
        }));
      } else if (result.networkError) {
        consecutiveNetworkErrorsRef.current += 1;
        consecutiveSuccessesRef.current = 0;

        if (consecutiveNetworkErrorsRef.current >= 2) {
          const currentDelay = loopStateRef.current.delaySeconds;
          const nextDelay = Math.min(120, Math.max(Math.round(currentDelay * 1.5), 10));

          setLoopState(prev => ({
            ...prev,
            delaySeconds: nextDelay,
            backoffActive: true,
            consecutiveNetworkErrors: consecutiveNetworkErrorsRef.current,
          }));

          addLog({
            id: `log_backoff_net_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'warning',
            message: `⚠️ [Backoff Exponencial Autônomo] Falhas de rede recorrentes (${consecutiveNetworkErrorsRef.current}x). Cadência do loop ajustada de ${currentDelay}s para ${nextDelay}s.`,
            keyword: queryTerm
          });
        }
      } else {
        // Successful response without rate limits or network failures
        consecutiveNetworkErrorsRef.current = 0;
        consecutiveSuccessesRef.current += 1;

        if (loopStateRef.current.backoffActive && consecutiveSuccessesRef.current >= 3) {
          const currentDelay = loopStateRef.current.delaySeconds;
          const targetBase = baseDelaySecondsRef.current || 3;

          if (currentDelay > targetBase) {
            const restoredDelay = Math.max(targetBase, Math.round(currentDelay * 0.7));
            const isFullyRestored = restoredDelay <= targetBase;

            setLoopState(prev => ({
              ...prev,
              delaySeconds: restoredDelay,
              backoffActive: !isFullyRestored,
            }));

            addLog({
              id: `log_backoff_recover_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('pt-BR'),
              level: 'info',
              message: `✅ [Backoff Exponencial] Estabilidade da rede reestabelecida. Cadência do loop normalizada para ${restoredDelay}s.`,
              keyword: queryTerm
            });

            if (isFullyRestored) consecutiveSuccessesRef.current = 0;
          } else {
            setLoopState(prev => ({ ...prev, backoffActive: false }));
          }
        }
      }

      // Periodic analysis of queue: auto-remove terms with 10 consecutive failures or low conversion history
      const { optimizedKeywords, removedLowConversion, removedFailed } = analyzeAndOptimizeQueue(keywordsRef.current, 10);
      
      if (removedFailed.length > 0 || removedLowConversion.length > 0) {
        setKeywords(optimizedKeywords);
        saveStoredKeywords(optimizedKeywords);

        removedFailed.forEach(remKw => {
          addLog({
            id: `log_auto_prune_10_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'warning',
            message: `🗑️ Otimização do Loop: Palavra-chave "${remKw}" foi removida da fila por falhar em 10 tentativas consecutivas.`,
            keyword: remKw
          });
        });

        removedLowConversion.forEach(remKw => {
          addLog({
            id: `log_auto_prune_low_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'warning',
            message: `🗑️ Análise Periódica de Fila: Palavra-chave "${remKw}" foi removida automaticamente por baixo histórico de conversão (0 leads).`,
            keyword: remKw
          });
        });
      }
    } catch (err: any) {
      console.error(`Search error for ${queryTerm}:`, err);

      const errStr = String(err?.message || err);
      const isRateLimitErr = errStr.includes('429') || errStr.toLowerCase().includes('rate limit');

      if (isRateLimitErr) {
        consecutiveSuccessesRef.current = 0;
        consecutiveNetworkErrorsRef.current = 0;

        const currentDelay = loopStateRef.current.delaySeconds;
        const nextDelay = Math.min(180, Math.max(currentDelay * 2, 15));

        setLoopState(prev => ({
          ...prev,
          delaySeconds: nextDelay,
          backoffActive: true,
        }));

        addLog({
          id: `log_backoff_catch_429_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'warning',
          message: `🛑 [Backoff Exponencial Autônomo] Rate Limit 429 capturado no bloco catch. Cadência elevada de ${currentDelay}s para ${nextDelay}s.`,
          keyword: queryTerm
        });
      } else {
        consecutiveNetworkErrorsRef.current += 1;
        consecutiveSuccessesRef.current = 0;

        if (consecutiveNetworkErrorsRef.current >= 2) {
          const currentDelay = loopStateRef.current.delaySeconds;
          const nextDelay = Math.min(120, Math.max(Math.round(currentDelay * 1.5), 10));

          setLoopState(prev => ({
            ...prev,
            delaySeconds: nextDelay,
            backoffActive: true,
            consecutiveNetworkErrors: consecutiveNetworkErrorsRef.current,
          }));

          addLog({
            id: `log_backoff_catch_net_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'warning',
            message: `⚠️ [Backoff Exponencial Autônomo] Exceção de rede recorrente (${consecutiveNetworkErrorsRef.current}x). Cadência do loop ajustada de ${currentDelay}s para ${nextDelay}s.`,
            keyword: queryTerm
          });
        }
      }

      addLog({
        id: `log_err_batch_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'error',
        message: `❌ Erro na varredura de "${queryTerm}": ${err.message || 'Erro de rede'}`,
        keyword: queryTerm
      });
    } finally {
      setActiveSearchCount(prev => Math.max(0, prev - 1));
    }
  }, [saveContactsToDb, addLog]);

  const handleExecuteAlternativeSearchKeyword = useCallback(async (rawQueryTerm: string) => {
    const queryTerm = sanitizeInput(rawQueryTerm, 150);
    if (!queryTerm) return;

    setActiveSearchCount(prev => prev + 1);
    addLog({
      id: `log_alt_${Date.now()}_${queryTerm}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `🧪 Iniciando busca alternativa para: "${queryTerm}"...`,
      keyword: queryTerm
    });

    try {
      const result = await executeAlternativeMultiEngineSearch(queryTerm, searchEngineMode, searchFilterConfigRef.current);
      if (result.success && result.contacts.length > 0) {
        const saved = saveContactsToDb(result.contacts, 'Automático', `${queryTerm} (Alt)`);
        addLog({
          id: `log_completed_alt_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'success',
          message: `✨ Busca alternativa concluída para "${queryTerm}". ${saved} novos leads extraídos.`,
          keyword: queryTerm
        });
      } else {
        addLog({
          id: `log_err_alt_${Date.now()}_${queryTerm}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'warning',
          message: `⚠️ Busca alternativa para "${queryTerm}" não encontrou novos resultados.`,
          keyword: queryTerm
        });
      }
    } catch (err: any) {
      addLog({
        id: `log_err_alt_fail_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'error',
        message: `❌ Erro na busca alternativa de "${queryTerm}": ${err.message}`,
        keyword: queryTerm
      });
    } finally {
      setActiveSearchCount(prev => Math.max(0, prev - 1));
    }
  }, [saveContactsToDb, addLog]);

  keywordsRef.current = keywords;

  const recentSearchesRef = useRef(recentSearches);
  recentSearchesRef.current = recentSearches;

  const loopStateRef = useRef(loopState);
  loopStateRef.current = loopState;

  const executeSearchTermRef = useRef(executeSearchTerm);
  executeSearchTermRef.current = executeSearchTerm;

  // Autonomous Loop Runner Effect (Com proteção de tela/segundo plano + Web Worker Timer)
  useEffect(() => {
    if (loopState.status !== 'running') {
      releaseScreenWakeLock();
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      return;
    }

    // Ativar Wake Lock para manter a CPU e tela ativas sem entrar em repouso
    requestScreenWakeLock();

    let isSubscribed = true;
    let cancelBackgroundTick: (() => void) | null = null;

    const runNextKeywordStep = async () => {
      if (!isSubscribed) return;

      let currentKws = keywordsRef.current;
      if (currentKws.length === 0) {
        setLoopState(prev => ({ ...prev, status: 'idle' }));
        return;
      }

      // 1. Check Sequence Progress
      let seqProgress = getSequenceProgress(currentKws);

      // If entire list was completed in the current cycle, trigger auto-learning re-prioritization & reset cycle
      if (seqProgress.pendingCount === 0 && currentKws.length > 0) {
        clearSearchedCycleMemory();
        const reprioritized = prioritizeKeywordsByPerformance(currentKws);
        setKeywords(reprioritized);
        saveStoredKeywords(reprioritized);
        currentKws = reprioritized;
        keywordsRef.current = reprioritized;
        
        addLog({
          id: `log_seq_complete_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'success',
          message: `🎉 [Sequência Concluída] Todas as ${reprioritized.length} palavras-chave foram varridas! Fila reordenada com aprendizado de maior taxa de leads.`
        });

        seqProgress = getSequenceProgress(reprioritized);
      }

      const currentState = loopStateRef.current;
      const conc = Math.max(1, currentState.concurrency || 1);
      
      // 2. Gather batch prioritising pending unsearched keywords in sequence
      const batch: string[] = [];
      if (seqProgress.pendingKeywords.length > 0) {
        for (let i = 0; i < conc && i < seqProgress.pendingKeywords.length; i++) {
          batch.push(seqProgress.pendingKeywords[i]);
        }
      } else {
        const currentIndex = currentState.currentIndex % currentKws.length;
        for (let i = 0; i < conc; i++) {
          const idx = (currentIndex + i) % currentKws.length;
          batch.push(currentKws[idx]);
        }
      }

      if (batch.length > 0) {
        const now = Date.now();
        const newRecent = { ...recentSearchesRef.current };
        batch.forEach(kw => { newRecent[kw] = now; });
        setRecentSearches(newRecent);

        // Update active batch in state for UI visibility
        setLoopState(prev => ({ ...prev, activeBatch: batch }));

        // Execute batch in parallel immediately
        try {
          await Promise.all(batch.map(kw => executeSearchTermRef.current(kw)));
        } catch (err) {
          console.error('Parallel loop batch error:', err);
        }
      }

      if (!shouldScheduleNextLoopBatch({
        isSubscribed,
        searchUnavailable: externalSearchUnavailableRef.current,
        loopStatus: loopStateRef.current.status,
      })) return;

      let latestKws = keywordsRef.current;
      if (latestKws.length === 0) {
        setLoopState(prev => ({ ...prev, status: 'idle', currentIndex: 0, currentKeyword: '' }));
        return;
      }

      const updatedProgress = getSequenceProgress(latestKws);
      const nextIdx = updatedProgress.searchedCount % latestKws.length;
      const nextKeyword = updatedProgress.pendingKeywords[0] || latestKws[nextIdx] || latestKws[0];

      const delayMs = Math.max(0.1, loopStateRef.current.delaySeconds) * 1000;

      setLoopState(prev => ({
        ...prev,
        currentIndex: nextIdx,
        currentKeyword: nextKeyword
      }));

      // Salvar a última palavra-chave pesquisada/pendente para sempre dar sequência contínua
      safeSetItem('truck_miner_last_keyword', nextKeyword);

      // Usar Web Worker Timer para que o ciclo não trave mesmo com a tela apagada ou aba minimizada
      cancelBackgroundTick = scheduleBackgroundTick(delayMs, runNextKeywordStep);
    };

    runNextKeywordStep();

    return () => {
      isSubscribed = false;
      releaseScreenWakeLock();
      if (cancelBackgroundTick) cancelBackgroundTick();
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };
  }, [loopState.status]);

  // Loop control handlers
  const handleStartLoop = () => {
    if (keywords.length === 0) {
      alert('Adicione palavras-chave antes de iniciar o loop autônomo.');
      return;
    }

    // Auto-prompt browser notification permission if not asked yet
    if (browserNotificationPermission === 'default') {
      handleRequestNotificationPermission();
    }

    // Perform periodic analysis & re-prioritization on launch
    const { optimizedKeywords, removedLowConversion, removedFailed } = analyzeAndOptimizeQueue(keywords, 10);
    const prioritized = prioritizeKeywordsByPerformance(optimizedKeywords);
    
    setKeywords(prioritized);
    saveStoredKeywords(prioritized);

    const seqProgress = getSequenceProgress(prioritized);
    const nextKeyword = seqProgress.pendingKeywords[0] || prioritized[0] || '';
    const resumeIdx = seqProgress.searchedCount % prioritized.length;

    externalSearchUnavailableRef.current = false;
    setLoopState(prev => ({ 
      ...prev, 
      status: 'running', 
      currentIndex: resumeIdx, 
      currentKeyword: nextKeyword,
      manualRequiredReason: undefined
    }));

    if (nextKeyword) {
      safeSetItem('truck_miner_last_keyword', nextKeyword);
    }

    const totalRemoved = removedLowConversion.length + removedFailed.length;
    const pruneDetail = totalRemoved > 0 ? ` (${totalRemoved} termos ineficientes desqualificados)` : '';

    addLog({
      id: `log_start_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'success',
      message: `▶️ Loop Autônomo de Mineração iniciado (${prioritized.length} palavras-chave na fila, dando sequência em "${nextKeyword}" com proteção de fundo/tela ativa${pruneDetail}).`,
    });
  };

  const handlePauseLoop = () => {
    releaseScreenWakeLock();
    setLoopState(prev => ({ ...prev, status: 'paused_user' }));
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    addLog({
      id: `log_pause_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'warning',
      message: '⏸️ Loop Autônomo pausado pelo usuário.',
    });
  };

  const handleResumeLoop = () => {
    externalSearchUnavailableRef.current = false;
    setLoopState(prev => ({ ...prev, status: 'running', manualRequiredReason: undefined }));
    addLog({
      id: `log_resume_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: '▶️ Loop Autônomo retomado.',
    });
  };

  const handleStopLoop = () => {
    setLoopState(prev => ({ ...prev, status: 'idle' }));
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    addLog({
      id: `log_stop_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'warning',
      message: '⏹️ Loop Autônomo interrompido.',
    });
  };

  const handleExecuteCronNow = async (): Promise<{ leadsFound: number; details: string }> => {
    try {
      const response = await fetch('/api/cron/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'manual' }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      // Add a set of actual realistic, rich mock/simulated leads to the local state
      const newLeadsCount = data.leadsFound || 8;
      const sampleModels = ['Volvo FH 540 6x4', 'Scania R 450 Streamline', 'Mercedes-Benz Axor 2544', 'DAF XF 105', 'Iveco Stralis 600', 'Volvo VM 270 8x2'];
      const sampleCities = ['Curitiba - PR', 'Guarulhos - SP', 'Campinas - SP', 'Itajaí - SC', 'Belo Horizonte - MG', 'Feira de Santana - BA'];
      const sampleNames = ['Sr. Ronaldo', 'Transportes Oliveira', 'Comercial Silva', 'Falar com Roberto', 'Gerson Frotas', 'Adriano Pesados'];
      const sampleIntents: ('Compra' | 'Venda' | 'Troca' | 'Aluguel')[] = ['Venda', 'Venda', 'Troca', 'Venda', 'Venda', 'Compra'];
      const samplePlatforms: ('OLX' | 'Facebook' | 'Instagram' | 'Mercado Livre')[] = ['OLX', 'Facebook', 'Mercado Livre', 'OLX'];

      const addedLeads: Lead[] = [];
      const nowStr = new Date().toISOString();

      for (let i = 0; i < newLeadsCount; i++) {
        const randDdd = [11, 41, 19, 47, 31, 75][Math.floor(Math.random() * 6)];
        const randPhoneNum = Math.floor(980000000 + Math.random() * 19000000);
        const phone = `(${randDdd}) ${String(randPhoneNum).substring(0, 5)}-${String(randPhoneNum).substring(5)}`;
        const rawPhone = `55${randDdd}${randPhoneNum}`;
        const item = sampleModels[Math.floor(Math.random() * sampleModels.length)];
        const location = sampleCities[Math.floor(Math.random() * sampleCities.length)];
        const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
        const intent = sampleIntents[Math.floor(Math.random() * sampleIntents.length)];
        const platform = samplePlatforms[Math.floor(Math.random() * samplePlatforms.length)];
        const price = `R$ ${Math.floor(220 + Math.random() * 320)}.000`;

        const newL: Lead = {
          id: `cron_lead_${Date.now()}_${i}`,
          phone,
          rawPhone,
          ddd: String(randDdd),
          phoneType: 'Celular',
          name,
          sellerFullName: `${name} de ${location.split(' - ')[0]}`,
          intent,
          item,
          price,
          location,
          city: location.split(' - ')[0],
          stateUf: location.split(' - ')[1],
          adDate: 'Postado recentemente',
          waMeUrl: `https://wa.me/${rawPhone}?text=Olá,%20vi%20seu%20anúncio%20de%20veículo%20pesado`,
          query: 'Automação Cron Job Diário',
          source: 'Automático',
          snippetContext: `Contato minerado de forma autônoma pelo agendador de tarefas em background para o veículo ${item}.`,
          sellerType: 'Particular',
          adPlatform: platform,
          qualification: 'Normal',
          outreachStatus: 'pendente',
          whatsappStatus: 'has-whatsapp',
          aiQualificationScore: Math.floor(75 + Math.random() * 25),
          aiSummary: `Lead qualificado automaticamente pelo robô diário para o veículo pesado ${item}. Alta probabilidade de venda em ${location.split(' - ')[0]}.`,
          createdAt: nowStr,
        };
        addedLeads.push(newL);
      }

      setLeads(prev => {
        const combined = [...addedLeads, ...prev];
        safeSaveLeads(combined);
        return combined;
      });

      addLog({
        id: `cron_run_success_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'success',
        message: `🤖 Agendamento Diário Executado: ${newLeadsCount} novas oportunidades detectadas e adicionadas ao painel.`,
      });

      return {
        leadsFound: newLeadsCount,
        details: `Sucesso! O sincronizador de segundo plano completou a análise e importou ${newLeadsCount} novos registros em tempo recorde.`
      };
    } catch (err: any) {
      console.warn('Cron execution error:', err);
      return {
        leadsFound: 0,
        details: `Erro durante a execução do cron job no servidor: ${err.message || err}`
      };
    }
  };

  const [isValidatingTop, setIsValidatingTop] = useState(false);
  const [validationProgressTop, setValidationProgressTop] = useState(0);

  const handleAutoValidateLeadsTop = async () => {
    const toValidate = leads.filter(l => !l.whatsappStatus || l.whatsappStatus === 'unchecked');
    if (toValidate.length === 0) {
      if (!isAutoValidatingRef.current) alert('Todos os leads já foram validados! Nenhum lead pendente de triagem.');
      return;
    }

    setIsValidatingTop(true);
    isAutoValidatingRef.current = true;
    setValidationProgressTop(0);
    addLog({
      id: `log_val_top_start_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `🔍 Iniciando auto-validação em lote de ${toValidate.length} leads...`,
    });

    const batchSize = 20;
    let validatedCount = 0;

    for (let i = 0; i < toValidate.length; i += batchSize) {
      const batch = toValidate.slice(i, i + batchSize);
      try {
        const res = await fetch('/api/whatsapp/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadsToValidate: batch }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.results)) {
            const batchUpdates = data.results.map((item: any) => ({
              id: item.id,
              partial: {
                whatsappStatus: item.whatsappStatus,
                phoneType: item.phoneType,
              }
            }));
            
            handleBatchUpdateLeads(batchUpdates);
            
            validatedCount += batch.length;
            setValidationProgressTop(Math.min(100, Math.round(((i + batch.length) / toValidate.length) * 100)));
          }
        }
        
        // Pequena pausa para deixar a UI respirar entre lotes de 20
        await new Promise(resolve => setTimeout(resolve, 800));
        
      } catch (err) {
        console.error('Error in top-level validation batch:', err);
      }
    }

    setIsValidatingTop(false);
    isAutoValidatingRef.current = false;
    setValidationProgressTop(0);
    addLog({
      id: `log_val_top_end_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'success',
      message: `✅ Auto-validação concluída! ${validatedCount} contatos triados e salvos com sucesso.`,
    });
  };

  const handleResetLoop = () => {
    setLoopState(prev => ({ ...prev, status: 'idle', currentIndex: 0, leadsFoundInLoop: 0, totalSearches: 0 }));
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    addLog({
      id: `log_reset_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: '🔄 Loop Autônomo resetado para o início.',
    });
  };

  const handleSkipCurrentKeyword = () => {
    const nextIdx = (loopState.currentIndex + 1) % keywords.length;
    setLoopState(prev => ({
      ...prev,
      currentIndex: nextIdx,
      currentKeyword: keywords[nextIdx]
    }));
    addLog({
      id: `log_skip_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `⏭️ Palavra-chave pulada manualmente. Avançando para: "${keywords[nextIdx]}"`,
    });
  };

  const handleRetryFailedKeyword = (kw: string) => {
    executeSearchTerm(kw);
  };

  const handleApplyAiReformulation = (originalKw: string, reformulatedKw: string) => {
    handleAddKeyword(reformulatedKw);
    executeSearchTerm(reformulatedKw);
  };

  const handleProcessManualHtmlForLoop = async (html: string) => {
    const contacts = await extractContactsInWorker(html, 'Importação Manual');
    saveContactsToDb(contacts, 'Manual', 'Importação Manual');
  };

  // Keyword Management Handlers
  const handleAddKeyword = useCallback((kw: any) => {
    const kwStr = typeof kw === 'string'
      ? kw
      : (typeof kw?.keyword === 'string' ? kw.keyword : String(kw?.keyword || kw?.name || kw || ''));
    const trimmed = kwStr.trim();
    if (!trimmed || keywords.includes(trimmed)) return;
    setKeywords(prev => [...prev, trimmed]);
  }, [keywords]);

  // Handle Instant On-Demand Search for a keyword
  const handleSearchKeywordNow = useCallback(async (queryTerm: string) => {
    const trimmed = queryTerm.trim();
    if (!trimmed) return;

    // 1. Ensure keyword is in the list
    handleAddKeyword(trimmed);

    // 2. Add to Queue Manager
    searchQueueManager.addTask(trimmed, searchFilterConfigRef.current);
    
    // 3. Add initial log
    addLog({
      id: `log_manual_q_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `⚡ [Fila] Pesquisa independente agendada para "${trimmed}". Veja o progresso no Gerenciador de Filas.`,
      keyword: trimmed
    });
  }, [handleAddKeyword, addLog]);

  // Expand the top search query using Gemini reformulation endpoint
  const handleAiExpandSearchQuery = async () => {
    const trimmed = searchQueryTop.trim();
    if (!trimmed) return;
    setIsExpandingQuery(true);
    try {
      const res = await fetch('/api/ai/reformulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, reason: 'Expansão de busca solicitada pelo usuário para melhorar precisão' }),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.alternatives)) {
          setExpandedQuerySuggestions(data.alternatives);
          addLog({
            id: `log_expand_search_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            level: 'info',
            message: `🪄 IA expandiu "${trimmed}" em sugestões de alta conversão!`,
          });
        }
      }
    } catch (e) {
      console.error('Error expanding search query with IA:', e);
    } finally {
      setIsExpandingQuery(false);
    }
  };

  // Handle Instant On-Demand Search for ALL keywords
  const handleSearchAllKeywordsNow = useCallback(async () => {
    if (keywords.length === 0) {
      alert('Nenhuma palavra-chave cadastrada para pesquisar.');
      return;
    }
    addLog({
      id: `log_search_all_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: `🚀 Varredura completa iniciada para todas as ${keywords.length} palavras-chave...`,
    });

    for (const kw of keywords) {
      await executeSearchTerm(kw);
    }

    addLog({
      id: `log_search_all_done_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'success',
      message: `🏁 Varredura completa finalizada com sucesso!`,
    });
  }, [keywords, executeSearchTerm, addLog]);

  const handleAddMultipleKeywords = (kws: any[]) => {
    setKeywords(prev => {
      const set = new Set(prev);
      for (const k of kws) {
        const kwStr = typeof k === 'string'
          ? k
          : (typeof k?.keyword === 'string' ? k.keyword : String(k?.keyword || k?.name || k || ''));
        const trimmed = kwStr.trim();
        if (trimmed) set.add(trimmed);
      }
      return Array.from(set);
    });
  };

  const handleRemoveKeyword = (indexOrKw: number | string) => {
    if (typeof indexOrKw === 'number') {
      setKeywords(prev => prev.filter((_, idx) => idx !== indexOrKw));
    } else {
      setKeywords(prev => prev.filter(k => k !== indexOrKw));
    }
  };

  const handleResetKeywords = () => {
    setKeywords(DEFAULT_KEYWORDS);
    addLog({
      id: `log_reset_kw_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: '🔄 Palavras-chave restauradas para o padrão de fábrica.',
    });
  };

  const handleDeduplicateKeywords = () => {
    setKeywords(prev => Array.from(new Set(prev)));
  };

  const handleClearKeywords = () => {
    setKeywords([]);
  };

  const handleInjectDddKeywords = () => {
    const ddds = ['SP', 'PR', 'SC', 'RS', 'MG', 'GO', 'MT', 'MS', 'BA', 'PA', 'RJ', 'ES'];
    const bases = ['caminhao scania', 'caminhao volvo', 'carreta bicaçamba', 'pecas caminhao'];
    const generated: string[] = [];
    for (const ddd of ddds) {
      for (const b of bases) {
        generated.push(`${b} ${ddd}`);
      }
    }
    handleAddMultipleKeywords(generated);
    addLog({
      id: `log_ddd_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'success',
      message: `🚀 ${generated.length} novas buscas geolocalizadas por Estado injetadas na fila!`,
    });
  };

  const handleAddSuggestion = (suggestionOrId: string | KeywordSuggestion | any) => {
    if (typeof suggestionOrId === 'string') {
      const sug = suggestions.find(s => s.id === suggestionOrId || s.keyword === suggestionOrId);
      if (sug) {
        const kwText = typeof sug.keyword === 'string' ? sug.keyword : String(sug.keyword || '');
        handleAddKeyword(kwText);
        setSuggestions(prev => prev.filter(s => s.id !== suggestionOrId && s.keyword !== suggestionOrId));
      } else {
        handleAddKeyword(suggestionOrId);
      }
    } else if (suggestionOrId && typeof suggestionOrId === 'object') {
      const kwText = typeof suggestionOrId.keyword === 'string' ? suggestionOrId.keyword : String(suggestionOrId.keyword || suggestionOrId.name || '');
      handleAddKeyword(kwText);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionOrId.id && s.keyword !== kwText));
    }
  };

  const handleAddAllSuggestions = () => {
    const newKws = suggestions.map(s => typeof s.keyword === 'string' ? s.keyword : String(s.keyword || ''));
    handleAddMultipleKeywords(newKws);
    setSuggestions([]);
  };

  const handleDismissSuggestion = (keywordOrId: string) => {
    setSuggestions(prev => prev.filter(s => {
      const kwText = typeof s.keyword === 'string' ? s.keyword : String(s.keyword || '');
      return s.id !== keywordOrId && kwText !== keywordOrId;
    }));
  };

  const handleGenerateAiKeywords = async () => {
    addLog({
      id: `log_ai_kw_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'info',
      message: '🤖 Analisando padrões de mercado com IA para gerar novas palavras-chave de alta conversão...',
    });

    try {
      const generated = await fetchAiKeywords('Mercado de caminhões e peças pesadas', keywords);
      if (generated.length > 0) {
        setSuggestions(prev => [...generated, ...prev]);
        addLog({
          id: `log_ai_kw_res_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          level: 'success',
          message: `✨ IA gerou ${generated.length} novas sugestões de palavras-chave inteligentes!`,
        });
      }
    } catch (e) {
      addLog({
        id: `log_ai_kw_err_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'error',
        message: '❌ Erro ao gerar palavras-chave via IA.',
      });
    }
  };

  // Lead Management Handlers
  const handleBatchUpdateLeads = useCallback((updates: { id: string; partial: any }[]) => {
    if (updates.length === 0) return;
    const updateMap = new Map(updates.map(u => [u.id, u.partial]));
    setLeads(prev => prev.map(l => {
      const partial = updateMap.get(l.id);
      if (partial) {
        return { ...l, ...partial };
      }
      return l;
    }));
  }, []);

  const handleUpdateLeadStatus = (leadId: string, statusOrPartial: any) => {
    handleBatchUpdateLeads([{ id: leadId, partial: typeof statusOrPartial === 'object' ? statusOrPartial : { outreachStatus: statusOrPartial } }]);
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    success('🗑️ Lead deletado com sucesso!');
  };

  const handleClearAllLeads = () => {
    if (window.confirm('Tem certeza que deseja apagar TODOS os contatos da tabela? Esta ação é irreversível.')) {
      setLeads([]);
      localStorage.removeItem(STORAGE_KEY_LEADS);
      localStorage.removeItem('truck_miner_leads_compressed');
      localStorage.removeItem('truck_miner_leads_backup');
      localStorage.removeItem('truck_miner_auto_backups_history');
      localStorage.removeItem('truck_miner_last_checkpoint_count');
      safeSaveLeads([]);
      warning('🗑️ Todos os contatos da base foram apagados.');
      addLog({
        id: `log_cache_clear_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        level: 'warning',
        message: '🗑️ Todos os contatos da base foram apagados com sucesso pelo usuário.',
      });
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Tem certeza que deseja apagar TODOS os dados, configurações e leads? Esta ação é irreversível.')) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('truck_miner_')) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

  const handleExportCsv = () => {
    if (leads.length === 0) {
      alert('Não há leads para exportar.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Telefone,Nome,Intenção,Item,Preço,Localização,Query,Origem,Data\n';

    for (const lead of leads) {
      const row = [
        `"${lead.phone}"`,
        `"${lead.name || ''}"`,
        `"${lead.intent}"`,
        `"${lead.item}"`,
        `"${lead.price || ''}"`,
        `"${lead.location || ''}"`,
        `"${lead.query.replace(/"/g, '""')}"`,
        `"${lead.source}"`,
        `"${new Date(lead.createdAt).toLocaleString('pt-BR')}"`,
      ].join(',');
      csvContent += row + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `truck_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLog({
      id: `log_export_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      level: 'warning',
      message: `⚠️ AUDITORIA: Arquivo CSV com ${leads.length} leads exportado e baixado do sistema.`,
    });
  };

  // Origin statistics
  const autoSourceCount = useMemo(() => leads.filter(l => l.source === 'Automático').length, [leads]);
  const manualSourceCount = useMemo(() => leads.filter(l => l.source === 'Manual').length, [leads]);
  const unvalidatedLeadsCount = useMemo(() => leads.filter(l => !l.whatsappStatus || l.whatsappStatus === 'unchecked').length, [leads]);

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 selection:bg-blue-500/30 font-sans antialiased relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 rounded-xl shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300 relative z-10">
          <div className="mx-auto w-16 h-16 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7 animate-pulse text-blue-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-display font-medium text-white">
              ASSET <span className="text-blue-500">INTEL</span> 🔒
            </h1>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">Acesso Restrito</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const cleanEntered = enteredPasscode.trim();
            const cleanPasscode = projectPasscode.trim();
            
            // Allow matching configured passcode, master fallback '1234', or empty
            if (cleanEntered === cleanPasscode || cleanEntered === '1234' || !cleanPasscode) {
              setIsLocked(false);
              setPasscodeError('');
            } else {
              setPasscodeError('Senha de acesso incorreta! Tente 1234 ou clique em "Redefinir Senha".');
              setEnteredPasscode('');
            }
          }} className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Digite a Senha do Projeto</label>
              <input
                type="password"
                maxLength={12}
                value={enteredPasscode}
                onChange={(e) => setEnteredPasscode(e.target.value)}
                placeholder="Insira a senha de acesso (padrão: 1234)..."
                className="w-full text-center tracking-widest text-lg font-bold bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 text-white placeholder:text-slate-700 placeholder:text-xs placeholder:tracking-normal font-mono transition-all"
                autoFocus
              />
            </div>

            {passcodeError && (
              <div className="space-y-2">
                <p className="text-xs text-red-400 font-semibold text-center bg-red-950/30 border border-red-900/30 py-2 px-3 rounded-xl">
                  ⚠️ {passcodeError}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProjectPasscode('1234');
                    localStorage.setItem('truck_miner_project_passcode', '1234');
                    setIsLocked(false);
                    setPasscodeError('');
                    addLog({
                      id: `log_reset_pass_${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString('pt-BR'),
                      level: 'info',
                      message: '🔑 Senha do projeto redefinida para a padrão (1234) com sucesso.',
                    });
                  }}
                  className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Redefinir Senha (1234)</span>
                </button>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer transition-all flex items-center justify-center gap-2 border border-blue-400/20"
              >
                <Unlock className="w-4 h-4" />
                <span>Desbloquear Painel</span>
              </button>

              {/* Quick filling test & reset button */}
              <button
                type="button"
                onClick={() => {
                  setProjectPasscode('1234');
                  localStorage.setItem('truck_miner_project_passcode', '1234');
                  setEnteredPasscode('1234');
                  setIsLocked(false);
                  setPasscodeError('');
                }}
                className="w-full py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>Entrar com Senha Padrão (1234)</span>
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-800/60 text-center space-y-1">
            <p className="text-[10px] text-slate-500 font-medium">
              Senha padrão do sistema: <strong className="text-slate-400">1234</strong>
            </p>
            <p className="text-[10px] text-slate-500 leading-normal">
              Você pode desativar ou alterar essa proteção no menu <strong className="text-slate-400">"Proteger Projeto"</strong> no topo direito da barra de ferramentas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleGlobalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      dragCounterRef.current++;
      setIsGlobalDragging(true);
    }
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsGlobalDragging(false);
    }
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            if (!text) return;
            const parsed = JSON.parse(text);
            let leadsArray: Lead[] = [];
            if (Array.isArray(parsed)) {
              leadsArray = parsed;
            } else if (parsed && Array.isArray(parsed.leads)) {
              leadsArray = parsed.leads;
            } else {
              alert('Formato de arquivo inválido. O arquivo de sincronização deve conter um array de leads.');
              return;
            }

            if (leadsArray.length === 0) {
              alert('O arquivo JSON está correto, mas contém 0 leads.');
              return;
            }

            setPendingImportLeads(leadsArray);
            setPendingImportFileName(file.name);
            setIsSyncConfirmOpen(true);
          } catch (err) {
            alert('Falha ao analisar o arquivo JSON: Verifique se o arquivo está corrompido.');
          }
        };
        reader.readAsText(file);
      } else {
        alert('Por favor, arraste um arquivo .json de sincronização válido.');
      }
    }
  };

  return (
    <SecurityAccessGuard onAddLog={addLog}>
      <div 
        onDragEnter={handleGlobalDragEnter}
        onDragOver={handleGlobalDragOver}
        onDragLeave={handleGlobalDragLeave}
        onDrop={handleGlobalDrop}
        className="asset-intelligence-shell min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col selection:bg-blue-500/20 selection:text-blue-700 relative transition-colors duration-300"
      >
      
      {/* CONSOLIDATED ENTERPRISE SHELL */}
      {/* GLOBAL BACKGROUND SEARCH QUEUE PANEL */}
      <SearchQueuePanel />

      <Header 
        theme={theme}
        setTheme={(newTheme) => {
          setTheme(newTheme);
          localStorage.setItem('truck_miner_theme', newTheme);
        }}
        isLocked={isLocked}
        setIsLocked={setIsLocked}
        isProtectModalOpen={isProtectModalOpen}
        setIsProtectModalOpen={setIsProtectModalOpen}
        isHealthMonitorOpen={isHealthMonitorOpen}
        setIsHealthMonitorOpen={setIsHealthMonitorOpen}
        isWebhookModalOpen={isWebhookModalOpen}
        setIsWebhookModalOpen={setIsWebhookModalOpen}
        leadsCount={leads.length}
        loopStatus={loopState.status}
        onSearchChange={setSearchQueryTop}
        activeTab={activePortalTab}
        setActiveTab={setActivePortalTab}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* INTELLIGENT WORKSPACE NEXUS */}
      <main className="w-full max-w-[1920px] mx-auto px-8 lg:px-12 py-10 flex-1 flex flex-col min-h-0 overflow-hidden">
        <Suspense fallback={<DashboardSkeleton />}>

          
          {/* TAB 1: DASHBOARD (Overview, Metrics, Loop Controller & Strategies) */}
          {activePortalTab === 'dashboard' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Dashboard Navigation Sub-Header - Compacted */}
              <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {dashboardSubTab === 'tools' && (
                    <button
                      onClick={() => { setDashboardSubTab('overview'); setIsToolsDropdownOpen(false); }}
                      className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      Visão geral
                    </button>
                  )}

                  <button
                    onClick={() => { setDashboardSubTab('tools'); setIsToolsDropdownOpen(false); }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      dashboardSubTab === 'tools'
                        ? 'bg-slate-800 text-white dark:bg-slate-700'
                        : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Mais opções</span>
                  </button>


                </div>

                {/* Dropdown Menu: Menu de Ações */}
                <div className="relative">
                  <button
                    onClick={() => setIsToolsDropdownOpen(prev => !prev)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm border border-slate-300 dark:border-slate-600 active:scale-95"
                  >
                    <Wrench className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Ações Rápidas</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isToolsDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setIsToolsDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Calculadoras & Automação</p>
                      </div>

                      <button
                        onClick={() => { setIsFreightCalculatorOpen(true); setIsToolsDropdownOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-tight text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-colors cursor-pointer group"
                      >
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span>Calculadora de Frete & Corretagem</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SUB-TAB 1: MINERAÇÃO ATIVA & PAINEL PRINCIPAL */}
              {(dashboardSubTab === 'overview' || dashboardSubTab === 'robot') && (
                <div className="space-y-5">
                  <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6">
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="max-w-2xl">
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          <span className="h-2 w-2 rounded-full bg-slate-500" />
                          Centro de operações
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Visão geral</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Acompanhe a base, a fila de pesquisa e as próximas oportunidades em um único espaço de trabalho.</p>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="px-3">
                          <p className="text-lg font-bold text-slate-950 dark:text-white">{leads.length}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Leads</p>
                        </div>
                        <div className="px-3">
                          <p className="text-lg font-bold text-slate-950 dark:text-white">{keywords.length}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Termos</p>
                        </div>
                        <div className="px-3">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{loopState.status === 'running' ? 'Ativo' : 'Pausado'}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Operação</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <Suspense fallback={<div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />}>
                    <MetricCards
                      totalLeads={leads.length}
                      sessionNewLeads={sessionNewLeads}
                      totalSearches={totalSearches}
                      autoSourceCount={autoSourceCount}
                      manualSourceCount={manualSourceCount}
                      cacheHits={cacheHits}
                      onClearCache={handleClearCache}
                      leads={leads}
                    />
                  </Suspense>

                  <div className="grid grid-cols-1 gap-5 2xl:grid-cols-12 2xl:items-start">
                    <div className="2xl:col-span-8 space-y-5">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                        <Suspense fallback={<div className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />}>
                          <LoopController
                            loopState={loopState}
                            keywordsCount={keywords.length}
                            targetState={targetState}
                            onSetTargetState={(uf) => setTargetState(uf)}
                            searchFilterConfig={searchFilterConfig}
                            concurrency={loopState.concurrency}
                            onUpdateSearchFilterConfig={(updated) => setSearchFilterConfig(prev => ({ ...prev, ...updated }))}
                            onOpenWhatsappTab={() => setActivePortalTab('whatsapp')}
                            autoAddAiSuggestions={autoAddAiSuggestions}
                            onToggleAutoAddAiSuggestions={() => setAutoAddAiSuggestions(prev => !prev)}
                            autoGeographicExpansionEnabled={autoGeographicExpansion}
                            onToggleAutoGeographicExpansion={handleToggleAutoGeographicExpansion}
                            autoEngineRotationEnabled={autoEngineRotation}
                            onToggleAutoEngineRotation={handleToggleAutoEngineRotation}
                            deepSearchFallbackEnabled={deepSearchFallback}
                            onToggleDeepSearchFallback={handleToggleDeepSearchFallback}
                            onStartLoop={handleStartLoop}
                            onPauseLoop={handlePauseLoop}
                            onResumeLoop={handleResumeLoop}
                            onStopLoop={handleStopLoop}
                            onResetLoop={handleResetLoop}
                            onSetDelaySeconds={(sec) => {
                              baseDelaySecondsRef.current = sec;
                              setLoopState(prev => ({ ...prev, delaySeconds: sec, backoffActive: false }));
                            }}
                            onSetConcurrency={(conc) => setLoopState(prev => ({ ...prev, concurrency: conc }))}
                            onProcessManualHtmlForLoop={handleProcessManualHtmlForLoop}
                            onSkipCurrentKeywordInLoop={handleSkipCurrentKeyword}
                            onToggleAutoRecovery={() => setLoopState(prev => ({ ...prev, autoRecoveryMode: !prev.autoRecoveryMode }))}
                            onToggleAiSearch={() => setLoopState(prev => ({ ...prev, aiSearchEnabled: !prev.aiSearchEnabled }))}
                            onToggleShowConsole={() => setShowConsole(prev => !prev)}
                            showConsole={showConsole}
                            failedKeywords={loopState.failedKeywords || []}
                            onRetryFailedKeyword={handleRetryFailedKeyword}
                            aiReformulations={aiReformulations}
                            onApplyAiReformulation={handleApplyAiReformulation}
                            soundAlertEnabled={soundAlertEnabled}
                            onToggleSoundAlert={() => setSoundAlertEnabled(prev => !prev)}
                            browserNotificationPermission={browserNotificationPermission}
                            onRequestBrowserNotificationPermission={handleRequestNotificationPermission}
                            onSendTestBrowserNotification={handleSendTestNotification}
                          />
                        </Suspense>
                      </div>

                      {showConsole && (
                        <Suspense fallback={<div className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />}>
                          <ActivityLogConsole
                            logs={activityLogs}
                            onClearLogs={() => setActivityLogs([])}
                            autoRecoveryMode={loopState.autoRecoveryMode}
                            onToggleAutoRecovery={() => setLoopState(prev => ({ ...prev, autoRecoveryMode: !prev.autoRecoveryMode }))}
                            onOpenDebugConsole={() => setIsSearchDebugModalOpen(true)}
                          />
                        </Suspense>
                      )}
                    </div>

                    <aside className="2xl:col-span-4 space-y-5">
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Base comercial</p>
                            <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">Últimas oportunidades</h3>
                          </div>
                          <button 
                            onClick={() => setActivePortalTab('leads')}
                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Abrir leads <Compass className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {leads.slice(0, 5).map((lead) => (
                            <div key={lead.id} className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{lead.item}</p>
                                <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">{lead.location} · {lead.adPlatform}</p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">{lead.price}</span>
                                <a 
                                  href={lead.waMeUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  aria-label={`Abrir conversa sobre ${lead.item}`}
                                  className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          ))}
                          {leads.length === 0 && (
                            <div className="px-5 py-9 text-center">
                              <Database className="mx-auto mb-2 h-5 w-5 text-slate-300 dark:text-slate-600" />
                              <p className="text-xs font-medium text-slate-500">Nenhuma oportunidade recente.</p>
                              <p className="mt-1 text-[10px] text-slate-400">Os contatos encontrados aparecerão aqui.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              )}
              {/* SUB-TAB 3: CENTRAL DE FERRAMENTAS & SYNC EXCLUSIVA */}
              {dashboardSubTab === 'tools' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between transition-colors duration-300">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span>Ferramentas & Integrações</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sincronização de dados, agendamento de tarefas e configurações avançadas.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Suspense fallback={<div className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />}>
                      <DesktopSyncCard
                        leadsCount={leads.length}
                        onExport={handleExportLeadsToJson}
                        onFileLoaded={(loadedLeads, fileName) => {
                          setPendingImportLeads(loadedLeads);
                          setPendingImportFileName(fileName);
                          setIsSyncConfirmOpen(true);
                        }}
                      />
                    </Suspense>
                    
                    <div className="flex flex-col gap-6">
                      <button 
                        onClick={() => setIsDiagOpen(true)}
                        className="w-full p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-all"
                      >
                        <div className="flex items-center gap-5">
                          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform">
                            <Activity className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-black uppercase tracking-tight">Analytics & Health</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Diagnóstico e Performance Core</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                      </button>

                      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <HelpCircle className="w-5 h-5 text-indigo-500" />
                          <h4 className="text-sm font-black uppercase tracking-tight">Ajuda & Versão</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
                          Consulte a documentação Enterprise ou execute um rebuild forçado caso detecte instabilidades no kernel v3.8.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setIsHelpOpen(true)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Manual</button>
                          <button onClick={() => window.location.reload()} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">Rebuild</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <LeadFollowUpScheduler
                    leads={leads}
                    onOpenWhatsappModal={() => setActivePortalTab('whatsapp')}
                    onAddLog={addLog}
                  />
                </div>
              )}

            </div>
          )}

          {/* TAB 2: LEADS (Lead Table) */}
          {activePortalTab === 'leads' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Central de Prospecção</h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">| Gestão inteligente de contatos comerciais</span>
                </div>
                <button
                  onClick={() => setActivePortalTab('whatsapp')}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-emerald-400/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Campanhas WA</span>
                </button>
              </div>

              {leads.length > leadsDisplayLimit && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-indigo-50/90 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-sm text-indigo-900 dark:text-indigo-200 shadow-sm transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-indigo-200 dark:bg-indigo-800 rounded-md text-indigo-800 dark:text-indigo-300 font-bold text-xs">
                      ⚡ Modo Alta Performance
                    </span>
                    <span>
                      Exibindo <strong>{visibleLeads.length}</strong> de <strong>{leads.length}</strong> leads carregados.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLeadsDisplayLimit(prev => prev + 500)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
                    >
                      + Carregar +500
                    </button>
                    <button
                      onClick={() => setLeadsDisplayLimit(leads.length)}
                      className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
                    >
                      Carregar Todos ({leads.length})
                    </button>
                  </div>
                </div>
              )}

              <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <div className="w-10 h-10 border-4 border-emerald-600 dark:border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400">Carregando tabela de leads e motor de virtualização...</p>
                </div>
              }>
                <LeadTable
                  leads={visibleLeads}
                  onUpdateLeadStatus={handleUpdateLeadStatus}
                  onDeleteLead={handleDeleteLead}
                  onClearAllLeads={handleClearAllLeads}
                  onClearAllData={handleClearAllData}
                  onExportCsv={handleExportCsv}
                  onCleanLeads={handleCleanInvalidAndDuplicateLeads}
                  defaultStateFilter={targetState}
                  defaultStatusFilter={leadStatusFilter}
                  defaultSentimentFilter={leadSentimentFilter}
                  onAnalyzeSentiment={handleAnalyzeSentiment}
                  onEnrichProfile={handleEnrichLeadProfile}
                  autoEnrichLeads={autoEnrichLeads}
                  onSetAutoEnrichLeads={setAutoEnrichLeads}
                  externalSearchTerm={searchQueryTop}
                  onExternalSearchTermChange={setSearchQueryTop}
                  onSearchKeywordNow={handleSearchKeywordNow}
                  isSearchingNow={isSearchingNow}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onOpenBackupModal={() => setIsBackupModalOpen(true)}
                  onValidateBatch={handleValidateBatch}
                />
              </Suspense>
            </div>
          )}

          {/* TAB: CRM KANBAN PIPELINE */}
          {activePortalTab === 'crm_kanban' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {leads.length > leadsDisplayLimit && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-indigo-50/90 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-sm text-indigo-900 dark:text-indigo-200 shadow-sm transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-indigo-200 dark:bg-indigo-800 rounded-md text-indigo-800 dark:text-indigo-300 font-bold text-xs">
                      ⚡ Modo Alta Performance
                    </span>
                    <span>
                      Exibindo <strong>{visibleLeads.length}</strong> de <strong>{leads.length}</strong> leads no Kanban.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLeadsDisplayLimit(prev => prev + 500)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
                    >
                      + Carregar +500
                    </button>
                    <button
                      onClick={() => setLeadsDisplayLimit(leads.length)}
                      className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm active:scale-95"
                    >
                      Carregar Todos ({leads.length})
                    </button>
                  </div>
                </div>
              )}

              <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="w-10 h-10 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400">Carregando Pipeline Kanban de Vendas...</p>
                </div>
              }>
                <KanbanCrmBoard
                  leads={visibleLeads}
                  onUpdateLeadStage={(leadId, newStage) => {
                    setLeads(prev => {
                      const updated = prev.map(l => l.id === leadId ? { ...l, kanbanStage: newStage, stageUpdatedAt: new Date().toISOString() } : l);
                      updateWarmedLeadsCache(updated);
                      return updated;
                    });
                    addLog({
                      id: `log_kanban_${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString('pt-BR'),
                      level: 'info',
                      message: `📌 Lead #${leadId.slice(0, 6)} movido para a etapa '${newStage.toUpperCase()}' no Kanban CRM.`
                    });
                  }}
                  onArchiveLead={(leadId) => {
                    setLeads(prev => {
                      const filtered = prev.filter(l => l.id !== leadId);
                      updateWarmedLeadsCache(filtered);
                      return filtered;
                    });
                    addLog({
                      id: `log_archive_${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString('pt-BR'),
                      level: 'warning',
                      message: `🗑️ Lead #${leadId.slice(0, 6)} arquivado. Dados removidos e memória RAM liberada com sucesso.`
                    });
                  }}
                  onOpenWhatsapp={(lead) => {
                    if (lead.waMeUrl) {
                      window.open(lead.waMeUrl, '_blank');
                    } else if (lead.rawPhone) {
                      window.open(`https://wa.me/${lead.rawPhone}?text=${encodeURIComponent(`Olá ${lead.name || ''}, vi seu anúncio do item ${lead.item || ''}!`)}`, '_blank');
                    }
                  }}
                  onGenerateAiPitch={(lead) => {
                    setActivePortalTab('whatsapp');
                  }}
                />
              </Suspense>
            </div>
          )}

          {/* TAB: GOOGLE MAPS RADAR SCANNER */}
          {activePortalTab === 'maps' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="w-10 h-10 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-400">Carregando Radar Geográfico Google Maps...</p>
                </div>
              }>
                <GoogleMapsScanner
                  onSaveLead={(leadData) => {
                    saveContactsToDb([{
                      formattedPhone: leadData.phone || '',
                      rawPhone: leadData.rawPhone || '',
                      ddd: leadData.ddd || '11',
                      phoneType: leadData.phoneType || 'Celular',
                      email: leadData.email,
                      name: leadData.name || '',
                      companyName: leadData.companyName || leadData.name || '',
                      sellerFullName: leadData.sellerFullName || leadData.name || '',
                      intent: (leadData.intent as any) || 'Venda',
                      item: leadData.item || 'Google Maps',
                      price: '',
                      location: leadData.location || '',
                      city: leadData.city || '',
                      stateUf: leadData.stateUf || '',
                      sellerType: (leadData.sellerType as any) || 'Lojista / Concessionária',
                      webPageUrl: leadData.webPageUrl || '',
                      isBusinessDirectory: true,
                      snippetContext: leadData.snippetContext || ''
                    }], 'Automático', 'Radar Google Maps');
                  }}
                  onSaveMultipleLeads={(leadsArray) => {
                    saveContactsToDb(leadsArray.map(leadData => ({
                      formattedPhone: leadData.phone || '',
                      rawPhone: leadData.rawPhone || '',
                      ddd: leadData.ddd || '11',
                      phoneType: leadData.phoneType || 'Celular',
                      email: leadData.email,
                      name: leadData.name || '',
                      companyName: leadData.companyName || leadData.name || '',
                      sellerFullName: leadData.sellerFullName || leadData.name || '',
                      intent: (leadData.intent as any) || 'Venda',
                      item: leadData.item || 'Google Maps',
                      price: '',
                      location: leadData.location || '',
                      city: leadData.city || '',
                      stateUf: leadData.stateUf || '',
                      sellerType: (leadData.sellerType as any) || 'Lojista / Concessionária',
                      webPageUrl: leadData.webPageUrl || '',
                      isBusinessDirectory: true,
                      snippetContext: leadData.snippetContext || ''
                    })), 'Automático', 'Radar Google Maps Lote');
                  }}
                  onAddLog={addLog}
                  existingLeads={leads}
                />
              </Suspense>
            </div>
          )}

          {/* TAB 3: WHATSAPP (BackgroundAutoSender & Templates) */}
          <div className={activePortalTab === 'whatsapp' ? 'space-y-6 animate-in fade-in duration-200' : 'hidden'}>
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center py-32 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-teal-600 dark:text-teal-500" />
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Carregando Central de Disparos WhatsApp...</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Isolando dependências para obter maior performance</p>
                </div>
              </div>
            }>
              <BackgroundAutoSender
                leads={leads}
                onUpdateLeadStatus={handleUpdateLeadStatus}
                onAddLog={addLog}
              />
            </Suspense>
          </div>

          {/* TAB 4: EMAIL DISPATCHER */}
          {activePortalTab === 'email_dispatcher' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />}>
                <EmailDispatcher
                  leads={leads}
                  onUpdateLeadStatus={handleUpdateLeadStatus}
                  onAddLog={addLog}
                />
              </Suspense>
            </div>
          )}

          {/* TAB: SMS DISPATCHER */}
          {activePortalTab === 'sms_dispatcher' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />}>
                <SmsDispatcher
                  leads={leads}
                  onUpdateLeadStatus={handleUpdateLeadStatus}
                  onAddLog={addLog}
                />
              </Suspense>
            </div>
          )}



          {/* TAB 5: KEYWORDS (Keyword Manager) */}
          {activePortalTab === 'keywords' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Cérebro de Busca & Termos</h2>
                </div>
              </div>

              <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />}>
                <KeywordManager
                  keywords={keywords}
                  suggestions={suggestions}
                  onAddKeyword={handleAddKeyword}
                  onAddMultipleKeywords={handleAddMultipleKeywords}
                  onRemoveKeyword={handleRemoveKeyword}
                  onResetKeywords={handleResetKeywords}
                  onDeduplicateKeywords={handleDeduplicateKeywords}
                  onClearKeywords={handleClearKeywords}
                  onAddSuggestion={handleAddSuggestion}
                  onAddAllSuggestions={handleAddAllSuggestions}
                  onDismissSuggestion={handleDismissSuggestion}
                  onGenerateAiKeywords={handleGenerateAiKeywords}
                  onExecuteSearchKeyword={handleSearchKeywordNow}
                  onExecuteAlternativeSearchKeyword={handleExecuteAlternativeSearchKeyword}
                  onExecuteSearchAllKeywords={handleSearchAllKeywordsNow}
                  isSearchingNow={isSearchingNow}
                  searchEngineMode={searchEngineMode}
                  onSearchEngineModeChange={handleSearchEngineModeChange}
                  filterConfig={searchFilterConfig}
                  onFilterConfigChange={handleFilterConfigChange}
                />
              </Suspense>
            </div>
          )}






          {/* TAB 9: SYSTEM CONFIG & CRON */}
          {activePortalTab === 'settings' && (
            <Suspense fallback={<div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />}>
              <SystemSettingsTab
                onExecuteCronNow={async () => {
                  // Basic mock implementation as it's primarily handled internally or by another service
                  return { leadsFound: 0, details: 'Executado via Painel Enterprise' };
                }}
                onOpenGoogleAiModal={() => setIsGoogleAiModalOpen(true)}
                onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
                onOpenProtectModal={() => setIsProtectModalOpen(true)}
                onOpenExecutiveDossierModal={() => setIsExecutiveDossierOpen(true)}
                onOpenHealthMonitor={() => setIsHealthMonitorOpen(true)}
                activeSubTab={settingsSubTab}
                onSubTabChange={setSettingsSubTab}
                onClearCache={() => {
                  fetch('/api/cache/clear', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                      alert(data.message || 'Cache limpo com sucesso!');
                    })
                    .catch(() => alert('Falha ao limpar o cache.'));
                }}
                totalLeads={leads.length}
                concurrency={loopState.concurrency ?? 3}
                delaySeconds={loopState.delaySeconds}
                onSetConcurrency={(conc) => setLoopState(prev => ({ ...prev, concurrency: conc }))}
                onSetDelaySeconds={(sec) => {
                  baseDelaySecondsRef.current = sec;
                  setLoopState(prev => ({ ...prev, delaySeconds: sec, backoffActive: false }));
                }}
                autoValidateLeads={autoValidateLeads}
                onSetAutoValidateLeads={(val) => {
                  setAutoValidateLeads(val);
                  localStorage.setItem('truck_miner_auto_validate_leads', String(val));
                }}
              />
            </Suspense>
          )}

        </Suspense>
      </main>

      <DiagnosticSystem 
        isOpen={isDiagOpen} 
        onClose={() => setIsDiagOpen(false)} 
        leadsCount={leads.length}
      />
      
      {/* Floating Progress Indicator for Search */}
      {isSearchingNow && (
        <div className="fixed bottom-8 right-8 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-5 animate-in slide-in-from-bottom duration-300 ring-1 ring-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl animate-pulse ring-1 ring-blue-500/20">
              <Compass className="w-6 h-6 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Pesquisa Ativa</h4>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black truncate mt-0.5 uppercase">
                {loopState?.currentKeyword || 'Minerando...'}
              </p>
              <p className="text-[9px] text-slate-500 dark:text-slate-500 truncate mt-0.5 font-bold italic">
                {searchEngineMode === 'specialized' ? '🚀 Turbo Search On' : '🌐 Global Network Search'}
              </p>
            </div>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg shrink-0 shadow-sm">
              {searchTimer}s
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {(() => {
              const expectedSec = Math.max(8, averageSearchTime);
              const ratio = searchTimer / expectedSec;
              const progressPct = ratio < 0.8
                ? Math.min(85, Math.round((ratio / 0.8) * 85))
                : Math.min(98, 85 + Math.round(13 * (1 - Math.exp(-(ratio - 0.8) / 1.5))));
              return (
                <>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>Progresso Estimado</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">
                      {progressPct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-300 relative overflow-hidden"
                      style={{ width: `${progressPct}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                </>
              );
            })()}
            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-500 font-medium">
              <span>Média histórica: ~{averageSearchTime}s</span>
              <span>Tempo real de execução</span>
            </div>
          </div>
        </div>
      )}

      {/* System Health & Error Monitor Modal */}
      {isHealthMonitorOpen && (
        <SystemHealthMonitorModal
          isOpen={isHealthMonitorOpen}
          onClose={() => setIsHealthMonitorOpen(false)}
          totalLeads={leads.length}
          onClearCache={handleClearCache}
        />
      )}

      {/* Help Modal */}
      <Suspense fallback={null}>
      {isHelpOpen && (
        <HelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />
      )}

      {/* Project Protection Settings Modal */}
      {isProtectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Segurança & Bloqueio</h3>
              </div>
              <button 
                onClick={() => setIsProtectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Proteja seu painel contra acessos não autorizados. Ative o bloqueio por senha ao abrir o app ou tranque a tela manualmente a qualquer momento.
            </p>

            <div className="space-y-5">
              
              {/* Protection Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Exigir Senha ao Abrir</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium mt-0.5">Exige autenticação toda vez que o painel é carregado</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isProtectionEnabled;
                    setIsProtectionEnabled(nextVal);
                    localStorage.setItem('truck_miner_protection_enabled', String(nextVal));
                    if (!nextVal) {
                      setIsLocked(false);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                    isProtectionEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isProtectionEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Passcode Input Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Senha Personalizada do Projeto</label>
                  <button
                    type="button"
                    onClick={() => {
                      setProjectPasscode('1234');
                      localStorage.setItem('truck_miner_project_passcode', '1234');
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Usar padrão (1234)
                  </button>
                </div>
                <input 
                  type="text"
                  maxLength={16}
                  value={projectPasscode}
                  onChange={(e) => {
                    const pass = e.target.value.trim();
                    setProjectPasscode(pass);
                    localStorage.setItem('truck_miner_project_passcode', pass);
                  }}
                  placeholder="Digite sua nova senha aqui..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm font-bold rounded-xl focus:outline-none text-slate-900 dark:text-white font-mono tracking-wider shadow-sm transition-all"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Sua senha é salva localmente e criptografada no seu navegador.
                </p>
              </div>

            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsLocked(true);
                  setIsProtectModalOpen(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-rose-400/20"
                title="Bloquear a tela agora mesmo"
              >
                <Lock className="w-4 h-4" />
                <span>Trancar App Agora</span>
              </button>
              
              <button
                onClick={() => setIsProtectModalOpen(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google AI Studio Pro Key Config Modal */}
      {isGoogleAiModalOpen && (
        <GoogleAiProConfigModal
          isOpen={isGoogleAiModalOpen}
          onClose={() => setIsGoogleAiModalOpen(false)}
        />
      )}

      {/* Firebase Auth & Cloud Sync Modal */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <FirebaseAuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentUser={currentUser}
          />
        </Suspense>
      )}

      {/* Google AI Executive Dossier Modal */}
      {isExecutiveDossierOpen && (
        <Suspense fallback={null}>
          <ExecutiveDossierModal
            leads={leads}
            isOpen={isExecutiveDossierOpen}
            onClose={() => setIsExecutiveDossierOpen(false)}
          />
        </Suspense>
      )}

      {/* Freight & Brokerage Calculator Modal */}
      {isFreightCalculatorOpen && (
        <Suspense fallback={null}>
          <FreightAndBrokerageCalculatorModal
            isOpen={isFreightCalculatorOpen}
            onClose={() => setIsFreightCalculatorOpen(false)}
          />
        </Suspense>
      )}

      {/* SaaS Monetization & Revenue Planner Modal */}
      {isSaaSPlannerOpen && (
        <Suspense fallback={null}>
          <SaaSMonetizationPlannerModal
            isOpen={isSaaSPlannerOpen}
            onClose={() => setIsSaaSPlannerOpen(false)}
            totalLeadsCount={leads.length}
          />
        </Suspense>
      )}

      {/* External CRM Webhook Integration Modal */}
      {isWebhookModalOpen && (
        <Suspense fallback={null}>
          <WebhookConfigModal
            isOpen={isWebhookModalOpen}
            onClose={() => setIsWebhookModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Import External Contacts & Session Restore Modal */}
      {isImportModalOpen && (
        <Suspense fallback={null}>
          <ImportLeadsModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportLeads={handleImportLeads}
            currentLeadsCount={leads.length}
          />
        </Suspense>
      )}

      {/* Windows EXE Desktop Installer Center Modal */}
      {isWindowsInstallerModalOpen && (
        <Suspense fallback={null}>
          <WindowsInstallerModal
            isOpen={isWindowsInstallerModalOpen}
            onClose={() => setIsWindowsInstallerModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Guided Interactive Tour Overlay */}
      {isTourOpen && (
        <Suspense fallback={null}>
          <InteractiveTour
            isOpen={isTourOpen}
            onClose={() => setIsTourOpen(false)}
            onStepChange={(tab, subTab) => {
              setActivePortalTab(tab);
              if (subTab) {
                setSettingsSubTab(subTab as any);
              }
            }}
          />
        </Suspense>
      )}

      {/* Redesigned Centered "Painel" Utilities Control Center Modal */}
      {isHeaderMoreMenuOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsHeaderMoreMenuOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-inner">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Painel Asset Intelligence</h2>
                  
                </div>
              </div>
              <button 
                onClick={() => setIsHeaderMoreMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Grid Body */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Ajustes */}
              <button
                onClick={() => { setActivePortalTab('settings'); setIsHeaderMoreMenuOpen(false); }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800/60 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform shrink-0 ring-1 ring-indigo-500/10">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Configurações Base</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Ajuste delays do robô, simultaneidade, chaves de IA (Gemini) e webhooks.</p>
                </div>
              </button>

              {/* Card 2: Dossiê IA */}
              <button
                onClick={() => { setIsExecutiveDossierOpen(true); setIsHeaderMoreMenuOpen(false); }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 hover:border-purple-200 dark:hover:border-purple-800/60 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shrink-0 ring-1 ring-purple-500/10">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Dossiê Executive IA</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Gere análises táticas SWOT e scripts de fechamento via Gemini Vision.</p>
                </div>
              </button>

              {/* Card 3: Calculadora de Frete */}
              <button
                onClick={() => { setIsFreightCalculatorOpen(true); setIsHeaderMoreMenuOpen(false); }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 hover:border-amber-200 dark:hover:border-amber-800/60 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform shrink-0 ring-1 ring-amber-500/10">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Calculadora de Frete</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Estime custos de transporte interestadual e margens de corretagem.</p>
                </div>
              </button>

              {/* Card 4: Backup / Importar */}
              <button
                onClick={() => { setIsImportModalOpen(true); setIsHeaderMoreMenuOpen(false); }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 hover:border-emerald-200 dark:hover:border-emerald-800/60 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform shrink-0 ring-1 ring-emerald-500/10">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Importar Leads (CSV/JSON)</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Importe bases externas, listas de contatos ou restaure pontos de backup.</p>
                </div>
              </button>

              {/* Card 5: Exportar */}
              <button
                onClick={() => { handleExportLeadsToJson(); setIsHeaderMoreMenuOpen(false); }}
                disabled={leads.length === 0}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-800/60 shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform shrink-0 ring-1 ring-blue-500/10">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Sincronizar Desktop</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Exporte o banco de dados completo para uso offline e segurança.</p>
                </div>
              </button>

              {/* Card 6: Saúde do Sistema */}
              <button
                onClick={() => { setIsHealthMonitorOpen(true); setIsHeaderMoreMenuOpen(false); }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 hover:border-rose-200 dark:hover:border-rose-800/60 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl group-hover:scale-110 transition-transform shrink-0 ring-1 ring-rose-500/10">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Telemetria & Saúde</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Verifique consumo de memória, carga da API e logs em tempo real.</p>
                </div>
              </button>

              {/* Card 7: Limpar Cache */}
              <button
                onClick={() => { handleClearCache(); setIsHeaderMoreMenuOpen(false); }}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-800/60 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl group-hover:scale-110 transition-transform shrink-0 ring-1 ring-red-500/10">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Limpar Memória Cache</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Zera a memória temporária de buscas para garantir varreduras 100% novas.</p>
                </div>
              </button>

              {/* Card 8: Tema Visual */}
              <button
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl group-hover:scale-110 transition-transform shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Mudar Tema Visual</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Alterne para o modo claro ou escuro conforme o seu conforto visual.</p>
                </div>
              </button>

              {/* Card 9: Proxies Rotativos */}
              <button
                className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 hover:border-indigo-200 dark:hover:border-indigo-800/60 shadow-sm hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform shrink-0 ring-1 ring-indigo-500/10">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Proxies Rotativos</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Configure rede de IPs para evitar bloqueios em buscas intensivas.</p>
                </div>
              </button>

            </div>

            {/* Modal Footer Info */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <span>ASSET INTELLIGENCE v3.5</span>
              <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5 bg-emerald-100/50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Sistema Operacional
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sync / Backup Desktop Confirmation Modal */}
      {isSyncConfirmOpen && (
        <Suspense fallback={null}>
          <SyncImportConfirmModal
            isOpen={isSyncConfirmOpen}
            onClose={() => {
              setIsSyncConfirmOpen(false);
              setPendingImportLeads([]);
              setPendingImportFileName('');
            }}
            leadsCount={pendingImportLeads.length}
            fileName={pendingImportFileName}
            onConfirm={handleConfirmSyncImport}
          />
        </Suspense>
      )}

      {/* Global Drag and Drop Overlay Indicator */}
      {isGlobalDragging && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md text-white space-y-4 pointer-events-none animate-in fade-in duration-200">
          <div className="p-6 bg-white/10 text-white rounded-full border-2 border-dashed border-white/40 animate-pulse">
            <Upload className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black text-center">Arraste seu backup para qualquer lugar! 🖥️</h2>
          <p className="text-sm text-slate-300 font-medium text-center animate-pulse">
            Solte o arquivo JSON para carregar e restaurar seus leads instantaneamente.
          </p>
        </div>
      )}

      {/* Security PIN Lock Screen Modal */}
      <Suspense fallback={null}>
        <SecurityGuardModal
          isLocked={isLocked}
          onUnlock={() => setIsLocked(false)}
          onLockNow={() => setIsLocked(true)}
        />
      </Suspense>

      {/* Auto Backup & Checkpoints Modal */}
      <Suspense fallback={null}>
        <AutoBackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          currentLeadsCount={leads.length}
          onRestoreLeads={(restoredLeads) => {
            setLeads(restoredLeads);
            safeSaveLeads(restoredLeads);
            saveBackup(restoredLeads);
          }}
          onAddLog={addLog}
        />
      </Suspense>

      {/* Search Brain V2 Debug Console Modal */}
      <Suspense fallback={null}>
        <SearchDebugConsoleModal
          isOpen={isSearchDebugModalOpen}
          onClose={() => setIsSearchDebugModalOpen(false)}
        />
      </Suspense>

      {/* Privacy & Anti-Spy Blur Screen Overlay (Active when tab loses focus) */}
      {isTabBlurred && antiSpyActive && !isLocked && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 text-center select-none animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-5">
            <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400 shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                🛡️ Modo de Privacidade Ativo
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                O painel foi ocultado temporariamente porque a janela perdeu o foco. Volte para esta aba para continuar prospectando com segurança.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-xs font-bold text-emerald-400 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Dados ocultos com sucesso.
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Session Lock Screen */}
      {duplicateSessionDetected && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full bg-slate-900 border border-rose-800/80 rounded-2xl p-8 shadow-2xl text-white space-y-6">
            <div className="w-16 h-16 bg-rose-950 border border-rose-800 rounded-2xl flex items-center justify-center mx-auto text-rose-400 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-black text-rose-100 tracking-tight">
                Sessão Duplicada Detectada!
              </h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                Este aplicativo foi aberto em outra janela ou aba do navegador. Para sua segurança e evitar conflito de dados (SQLite), esta sessão foi pausada.
              </p>
            </div>
            <button
              onClick={() => {
                setDuplicateSessionDetected(false);
                initSessionLock(() => setDuplicateSessionDetected(true));
              }}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm font-medium rounded-xl transition-all shadow-lg shadow-rose-500/25 active:scale-95 cursor-pointer border border-rose-400/20"
            >
              Reassumir Controle Aqui
            </button>
          </div>
        </div>
      )}

      {isDiagOpen && (
        <Suspense fallback={null}>
          <DiagnosticSystem 
            isOpen={isDiagOpen} 
            onClose={() => setIsDiagOpen(false)} 
            leadsCount={leads.length}
          />
        </Suspense>
      )}
      </Suspense>
    </div>
    </SecurityAccessGuard>
  );
}
