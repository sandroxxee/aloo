import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Helper global para disparar toasts fora de componentes React (ex: utilitários, webhooks, exportadores)
 */
export function showToastNotification(message: string, type: ToastType = 'info', duration = 4000) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { message, type, duration }
    }));
  }
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, message, type, duration };
    
    setToasts(prev => [...prev.slice(-4), newToast]); // Mantém no máximo 5 toasts ativos simultaneamente
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => {
    toast(message, 'success', duration);
  }, [toast]);

  const error = useCallback((message: string, duration?: number) => {
    toast(message, 'error', duration);
  }, [toast]);

  const info = useCallback((message: string, duration?: number) => {
    toast(message, 'info', duration);
  }, [toast]);

  const warning = useCallback((message: string, duration?: number) => {
    toast(message, 'warning', duration);
  }, [toast]);

  // Escuta eventos globais de toast
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: ToastType; duration?: number }>;
      if (customEvent.detail && customEvent.detail.message) {
        toast(customEvent.detail.message, customEvent.detail.type || 'info', customEvent.detail.duration);
      }
    };

    window.addEventListener('app-toast', handleGlobalToast);
    return () => {
      window.removeEventListener('app-toast', handleGlobalToast);
    };
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      
      {/* Floating Toast Container no canto superior direito */}
      <div 
        id="toast-container"
        className="fixed top-5 right-5 z-[99999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <ToastItem 
              key={t.id} 
              toast={t} 
              onClose={() => removeToast(t.id)} 
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: ToastMessage;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const { message, type } = toast;

  const styles = {
    success: {
      bg: 'bg-emerald-900/90 text-emerald-100 border-emerald-700/80 shadow-emerald-950/40',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-900/90 text-rose-100 border-rose-700/80 shadow-rose-950/40',
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-900/90 text-amber-100 border-amber-700/80 shadow-amber-950/40',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    info: {
      bg: 'bg-slate-900/90 text-slate-100 border-slate-700/80 shadow-slate-950/40',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    },
  }[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -25, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl text-xs font-semibold ${styles.bg}`}
      style={{ originX: 1 }}
    >
      {styles.icon}
      
      <div className="flex-1 min-w-0 pt-0.5 leading-relaxed break-words">
        {message}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg focus:outline-none shrink-0 cursor-pointer"
        title="Fechar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

