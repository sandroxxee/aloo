import React from 'react';
import { HelpCircle, X, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="glass-panel shadow-elegant w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm  text-slate-900">Guia de Uso - Asset Intelligence</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p><strong className="text-slate-800">1. Palavras-Chave:</strong> Adicione termos de veículos ou peças pesadas para a varredura contínua do motor IA.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p><strong className="text-slate-800">2. Extração Autônoma:</strong> O sistema IA pesquisa motores e extrai telefones e WhatsApps válidos automaticamente.</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p><strong className="text-slate-800">3. Campanhas WhatsApp:</strong> Configure sua mensagem com variáveis humanas e envie diretamente para a base.</p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl">
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
