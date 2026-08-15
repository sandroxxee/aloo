import React, { useState, useEffect } from 'react';
import { searchQueueManager, SearchTask } from '../../services/SearchQueueManager';
import { 
  Loader2, CheckCircle2, AlertCircle, Clock, 
  Trash2, Search, BarChart3, ChevronRight, X
} from 'lucide-react';

export const SearchQueuePanel: React.FC = () => {
  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return searchQueueManager.subscribe(setTasks);
  }, []);

  const activeCount = tasks.filter(t => t.status === 'running' || t.status === 'pending').length;

  if (tasks.length === 0 && !isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      {/* Floating Toggle Button */}
      {!isOpen && activeCount > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 hover:bg-slate-800 transition-all group scale-in animate-in"
        >
          <div className="relative">
            <Search className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
              {activeCount}
            </span>
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-tight">Varreduras em Fila</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Processando em segundo plano</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      )}

      {/* Main Panel */}
      {isOpen && (
        <div className="pointer-events-auto w-[400px] max-w-[90vw] bg-white dark:bg-slate-900 rounded-3xl shadow-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Gerenciador de Filas</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{tasks.length} buscas registradas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => searchQueueManager.clearCompleted()}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors"
                title="Limpar concluídos"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3">
            {tasks.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Search className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nenhuma busca na fila</p>
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                          {task.keyword}
                        </span>
                        {task.status === 'running' && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded-sm">
                            Processando
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(task.startTime!).toLocaleTimeString('pt-BR')}</span>
                        {task.contactsFound > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-500">{task.contactsFound} Leads</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {task.status === 'running' && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
                      {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {task.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                      {task.status === 'pending' && <Clock className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {(task.status === 'running' || task.status === 'completed') && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                        <span className="text-slate-500">{task.status === 'completed' ? 'Concluído' : 'Varrendo Snippets...'}</span>
                        <span className="text-emerald-500">{task.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {task.status === 'error' && (
                    <p className="text-[9px] text-rose-500 font-bold uppercase leading-tight">
                      Erro: {task.error}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Motor Enterprise V3.8 Ativo</span>
            </div>
            {tasks.some(t => t.status === 'completed') && (
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Leads salvos no banco</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
