import React from 'react';
import { Zap } from 'lucide-react';

interface WhatsAppFastTestProps {
  fastTestPhone: string;
  setFastTestPhone: (v: string) => void;
  fastTestMessage: string;
  setFastTestMessage: (v: string) => void;
  fastTestLogs: string;
  isFastSending: boolean;
  onFastSend: () => void;
}

export const WhatsAppFastTest: React.FC<WhatsAppFastTestProps> = ({
  fastTestPhone,
  setFastTestPhone,
  fastTestMessage,
  setFastTestMessage,
  fastTestLogs,
  isFastSending,
  onFastSend
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Zap className="w-5 h-5 text-amber-500 fill-current" />
        <h3 className="text-sm font-bold text-slate-900">
          🧪 Teste Rápido de Envio
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone (DDD + Número)</label>
            <input
              type="text"
              value={fastTestPhone}
              onChange={(e) => setFastTestPhone(e.target.value)}
              placeholder="Ex: 51983273324"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Mensagem de Teste</label>
            <textarea
              rows={3}
              value={fastTestMessage}
              onChange={(e) => setFastTestMessage(e.target.value)}
              placeholder="Escreva a mensagem..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>
          <button
            onClick={onFastSend}
            disabled={isFastSending || !fastTestPhone}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white  text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isFastSending ? 'Enviando...' : 'Enviar Teste Agora'}
          </button>
        </div>

        <div className="flex flex-col h-full min-h-[160px]">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Retorno em Tempo Real da API (JSON/Logs)</label>
          <div className="flex-1 bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-800 overflow-y-auto whitespace-pre-wrap min-h-[150px] shadow-inner">
            {fastTestLogs || '// Aguardando envio de teste para exibir retorno da API...'}
          </div>
        </div>
      </div>
    </div>
  );
};
