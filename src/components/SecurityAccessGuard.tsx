import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Lock } from 'lucide-react';

interface SecurityAccessGuardProps {
  children: React.ReactNode;
  onAddLog?: (log: any) => void;
}

export const SecurityAccessGuard: React.FC<SecurityAccessGuardProps> = ({ children, onAddLog }) => {
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  const triggerSecurityNotice = useCallback((message: string) => {
    setSecurityNotice(message);
    if (onAddLog) {
      onAddLog({
        id: `sec_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'warning',
        message: `[Segurança Guard] ${message}`,
      });
    }
    const timer = setTimeout(() => {
      setSecurityNotice(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [onAddLog]);

  useEffect(() => {
    // Helper to check if event target is an interactive/editable input element
    const isEditable = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
        return true;
      }
      return Boolean(target.closest('input, textarea, [contenteditable="true"]'));
    };

    // 1. Keyboard Shortcut Guard: Block F12, DevTools, Ctrl+U, Ctrl+S, etc.
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const code = e.code;

      // Block F12
      if (code === 'F12' || key === 'f12') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityNotice('🔒 F12 Bloqueado: Ferramentas de Desenvolvedor Protegidas.');
        return false;
      }

      // Block Ctrl+Shift+I / J / C / K (DevTools)
      if (isCmdOrCtrl && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityNotice('🔒 Inspetor Bloqueado: Acesso a ferramentas de desenvolvimento desativado.');
        return false;
      }

      // Block Ctrl+U (View Source)
      if (isCmdOrCtrl && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityNotice('🔒 Código-Fonte Protegido: Exibição de código-fonte desativada.');
        return false;
      }

      // Block Ctrl+S / Ctrl+P (Save Page / Print Page)
      if (isCmdOrCtrl && (key === 's' || key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityNotice('🔒 Download/Impressão Protegido: Utilize as exportações oficiais do painel.');
        return false;
      }
    };

    // 2. Right-Click Context Menu Guard
    const handleContextMenu = (e: MouseEvent) => {
      if (!isEditable(e.target)) {
        e.preventDefault();
        triggerSecurityNotice('🔒 Menu de Inspeção Bloqueado: Proteção de dados comerciais ativa.');
      }
    };

    // 3. Copy & Cut Guard
    const handleCopyCut = (e: ClipboardEvent) => {
      if (!isEditable(e.target)) {
        e.preventDefault();
        triggerSecurityNotice('🔒 Cópia Direta Protegida: Utilize os botões oficiais de exportação para Excel/VCF.');
      }
    };

    // 4. Drag Text Protection
    const handleDragStart = (e: DragEvent) => {
      if (!isEditable(e.target) && !(e.target as HTMLElement)?.closest('[draggable="true"]')) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('copy', handleCopyCut, true);
    window.addEventListener('cut', handleCopyCut, true);
    window.addEventListener('dragstart', handleDragStart, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('copy', handleCopyCut, true);
      window.removeEventListener('cut', handleCopyCut, true);
      window.removeEventListener('dragstart', handleDragStart, true);
    };
  }, [triggerSecurityNotice]);

  return (
    <div className="relative min-h-screen">
      {/* Floating Security Guard Notice Toast */}
      {securityNotice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999999] bg-slate-950/95 text-white border border-rose-500/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 backdrop-blur-md max-w-md w-full mx-auto">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Segurança Enterprise
            </span>
            <span className="text-xs font-bold text-slate-200 leading-snug truncate">
              {securityNotice}
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
