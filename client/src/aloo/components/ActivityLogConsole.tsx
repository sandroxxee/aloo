import React from 'react';
import { Terminal, Trash2, ShieldCheck, Bug } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogConsoleProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
  autoRecoveryMode?: boolean;
  onToggleAutoRecovery?: () => void;
  onOpenDebugConsole?: () => void;
}

export const ActivityLogConsole: React.FC<ActivityLogConsoleProps> = ({
  logs,
  onClearLogs,
  autoRecoveryMode = true,
  onToggleAutoRecovery,
  onOpenDebugConsole,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-4 font-mono text-xs shadow-xl space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white tracking-wide text-sm">Console de Atividades em Tempo Real</h3>
          <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-sans">
            {logs.length} logs
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDebugConsole && (
            <button
              onClick={onOpenDebugConsole}
              className="px-2.5 py-1 rounded-lg text-xs font-sans font-bold bg-sky-950/80 text-sky-300 border border-sky-700/60 hover:bg-sky-900 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Abrir Console de Depuração e Telemetria de Busca"
            >
              <Bug className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Depuração Busca</span>
            </button>
          )}

          {onToggleAutoRecovery && (
            <button
              onClick={onToggleAutoRecovery}
              className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1 ${
                autoRecoveryMode
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Auto-Recuperação</span>
            </button>
          )}

          <button
            onClick={onClearLogs}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="Limpar Histórico de Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic text-sm text-center py-4">Aguardando atividades do motor de mineração IA...</p>
        ) : (
          logs.map((log) => {
            const levelColor =
              log.level === 'success'
                ? 'text-emerald-400'
                : log.level === 'warning'
                ? 'text-amber-400'
                : log.level === 'error'
                ? 'text-rose-400'
                : log.level === 'ai'
                ? 'text-indigo-400'
                : 'text-slate-300';

            return (
              <div key={log.id} className="flex items-start gap-2 text-sm leading-relaxed border-b border-slate-800/40 pb-1">
                <span className="text-slate-500 shrink-0 font-sans">{log.timestamp}</span>
                <span className={`${levelColor} flex-1 break-words`}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
