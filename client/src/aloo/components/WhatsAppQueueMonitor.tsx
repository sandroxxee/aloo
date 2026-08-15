import React, { useState } from 'react';
import { Activity, Clock, Terminal } from 'lucide-react';
import { Lead } from '../types';

interface WhatsAppQueueMonitorProps {
  queueItems: any[];
  pendingLeads: Lead[];
  telemetryLogs: any[];
}

export const WhatsAppQueueMonitor: React.FC<WhatsAppQueueMonitorProps> = ({
  queueItems,
  pendingLeads,
  telemetryLogs
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'terminal'>('queue');

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-xs flex flex-col h-[400px]">
      <div className="flex items-center border-b border-slate-200 bg-slate-50/50">
        <button 
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-4 px-4 text-sm font-medium border-r border-slate-200 flex items-center justify-center gap-2 transition-colors ${activeTab === 'queue' ? 'text-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Clock className="w-4 h-4" />
          Fila ({pendingLeads.length})
        </button>
        <button 
          onClick={() => setActiveTab('terminal')}
          className={`flex-1 py-4 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'terminal' ? 'text-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Terminal className="w-4 h-4" />
          Terminal
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === 'queue' ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-2 mb-3">
              <div className="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></div>
              Próximos Leads na Fila
            </div>
            {pendingLeads.slice(0, 10).map((lead, index) => (
              <div key={lead.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-2xs">
                <div className="w-7 h-7 bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs rounded-xl shrink-0">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate tracking-tight">{lead.name || 'Sem nome'}</div>
                  <div className="text-xs text-slate-400 truncate">{lead.item || 'renovacao de frota'}</div>
                </div>
                <div className={`text-[8px] font-bold px-2.5 py-1 rounded-lg border tracking-tighter ${
                  index === 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  {index === 0 ? 'Próximo' : 'Aguardando'}
                </div>
              </div>
            ))}
            {pendingLeads.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">Nenhum lead pendente na fila.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
             <div className="text-xs font-medium text-slate-500 flex items-center gap-2 mb-3">
              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              Terminal de Monitoramento
            </div>
            <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs leading-relaxed space-y-1.5 shadow-inner border border-slate-800 max-h-[300px] overflow-y-auto">
              {telemetryLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 border-b border-slate-800 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span className={`font-bold shrink-0 ${
                    log.level === 'error' ? 'text-rose-500' :
                    log.level === 'success' ? 'text-emerald-500' :
                    log.level === 'warning' ? 'text-amber-500' :
                    log.level === 'ai' ? 'text-indigo-400' : 'text-blue-400'
                  }`}>
                    {log.level.toUpperCase()}:
                  </span>
                  <span className={log.level === 'error' ? 'text-rose-300' : 'text-slate-300'}>{log.message}</span>
                </div>
              ))}
              {telemetryLogs.length === 0 && <p className="text-slate-600 italic">// Aguardando atividade do sistema...</p>}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Status Footer */}
      <div className="bg-slate-900 p-4 border-t border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white ">Processador em tempo real</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">P: {queueItems.filter(i => i.status === 'pendente').length}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">E: {queueItems.filter(i => i.status === 'entregue').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
