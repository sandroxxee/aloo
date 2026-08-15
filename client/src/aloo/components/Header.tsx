import React from 'react';
import { 
  Zap, 
  ChevronDown, 
  Activity, 
  HelpCircle, 
  WifiOff, 
  X,
  Cloud,
  ShieldCheck,
  Smartphone,
  Info,
  Search,
  Bell,
  Sliders,
  Database,
  Brain,
  Globe,
  Webhook,
  Sun,
  Moon
} from 'lucide-react';
import { User } from 'firebase/auth';
import { useConnectionMonitor } from '../hooks/useConnectionMonitor';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  isProtectModalOpen: boolean;
  setIsProtectModalOpen: (open: boolean) => void;
  isHealthMonitorOpen: boolean;
  setIsHealthMonitorOpen: (open: boolean) => void;
  isWebhookModalOpen?: boolean;
  setIsWebhookModalOpen: (open: boolean) => void;
  leadsCount: number;
  loopStatus: string;
  onSearchChange: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Visão geral', icon: Activity },
  { id: 'leads', label: 'Leads', icon: Database },
  { id: 'crm_kanban', label: 'Pipeline', icon: Sliders },
  { id: 'maps', label: 'Radar', icon: Globe },
  { id: 'keywords', label: 'Inteligência', icon: Brain },
  { id: 'whatsapp', label: 'Mensagens', icon: Smartphone },
];

export const Header: React.FC<HeaderProps> = ({
  theme,
  setTheme,
  isLocked,
  setIsLocked,
  isProtectModalOpen,
  setIsProtectModalOpen,
  isHealthMonitorOpen,
  setIsHealthMonitorOpen,
  isWebhookModalOpen,
  setIsWebhookModalOpen,
  leadsCount,
  loopStatus,
  onSearchChange,
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuthModal,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { lastSearchLatency, isLatencyHigh, dismissWarning } = useConnectionMonitor();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950 transition-colors duration-200">
      <div className="max-w-[1920px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4 lg:gap-8">
        
        {/* Brand Section */}
        <div className="flex items-center gap-4 shrink-0">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center border border-slate-800 dark:border-slate-200 transition-colors cursor-pointer group"
          >
            <Zap className="w-5 h-5 text-white dark:text-slate-900 fill-current" />
          </div>
          <div className="hidden xl:block">
            <h1 className="text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight uppercase">
              Asset <span className="text-blue-600 dark:text-blue-500">Intelligence</span>
            </h1>
             <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mt-1 flex items-center gap-1.5">
              Centro de operações
            </p>
          </div>
        </div>

        {/* Navigation Nexus */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800/50">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-2 group ${
                  isActive 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
                {item.id === 'leads' && (
                  <span className={`px-1 py-0.5 rounded text-[8px] font-black ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                    {leadsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Engine Nexus */}
        <div className="flex-1 max-w-xs relative group hidden md:block">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
           <input 
             type="text" 
             placeholder="BUSCAR NO PAINEL..." 
             onChange={(e) => onSearchChange(e.target.value)}
             className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-all placeholder:text-slate-400"
           />
        </div>

        {/* Controls & Operations */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* User Auth & Cloud Sync */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
              currentUser
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-900 dark:hover:border-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{currentUser ? 'Nuvem ativa' : 'Sincronizar'}</span>
          </button>

          {/* Settings / Lock Control */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-3 z-50 overflow-hidden"
                  onMouseLeave={() => setIsMenuOpen(false)}
                >
                  <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-900 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.16em]">Opções do sistema</p>
                  </div>
                  
                  <div className="space-y-1">
                    <button
                      onClick={() => { setIsLocked(!isLocked); setIsMenuOpen(false); }}
                      className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white hover:text-slate-900 dark:hover:text-slate-900 rounded-2xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                        Bloqueio do projeto
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${isLocked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                         <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isLocked ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    <button
                      onClick={() => { setIsProtectModalOpen(true); setIsMenuOpen(false); }}
                      className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white hover:text-slate-900 dark:hover:text-slate-900 rounded-2xl transition-all flex items-center gap-4"
                    >
                      <Sliders className="w-5 h-5 text-indigo-500" />
                      Configurações de segurança
                    </button>

                    <button
                      onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }}
                      className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white hover:text-slate-900 dark:hover:text-slate-900 rounded-2xl transition-all flex items-center gap-4"
                    >
                      <Database className="w-5 h-5 text-amber-500" />
                      Central do sistema
                    </button>

                    <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      onClick={() => { setIsWebhookModalOpen(!isWebhookModalOpen); setIsMenuOpen(false); }}
                      className="w-full px-5 py-3 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors flex items-center gap-4"
                    >
                      <Webhook className="w-4 h-4 text-slate-500" />
                      Integrações
                    </button>

                    <button
                      onClick={() => { setIsHealthMonitorOpen(!isHealthMonitorOpen); setIsMenuOpen(false); }}
                      className="w-full px-5 py-3 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors flex items-center gap-4"
                    >
                      <Activity className="w-4 h-4 text-slate-500" />
                      Saúde do sistema
                    </button>

                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="w-full px-5 py-3 text-left text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors flex items-center gap-4"
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                      Alternar tema
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Licença</span>
                        <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Enterprise Pro</span>
                     </div>
                     <div className="w-9 h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 fill-current" />
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      <nav className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={`mobile-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                isActive
                  ? 'bg-slate-800 text-white dark:bg-slate-800'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
