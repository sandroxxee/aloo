import React, { useState } from 'react';
import { Calendar, Clock, Plus, CheckCircle2, Zap, MessageSquare } from 'lucide-react';
import { Lead, LeadFollowUpTask } from '../types';
import { CADENCE_FUNNEL_STAGES, isLeadDueForCadence } from '../utils/cadenceEngine';

interface LeadFollowUpSchedulerProps {
  leads: Lead[];
  onOpenWhatsappModal?: () => void;
  onAddLog?: (log: any) => void;
}

export const LeadFollowUpScheduler: React.FC<LeadFollowUpSchedulerProps> = ({
  leads,
  onOpenWhatsappModal,
}) => {
  const [tasks, setTasks] = useState<LeadFollowUpTask[]>([]);
  const [taskTitle, setTaskTitle] = useState('');

  // Identificar leads que precisam de ação na Cadência de 3 Dias
  const leadsDueForCadence = leads.filter(isLeadDueForCadence);

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    const newTask: LeadFollowUpTask = {
      id: `task_${Date.now()}`,
      title: taskTitle.trim(),
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: 'medium',
      category: 'whatsapp',
      recurrence: 'none',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setTaskTitle('');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900">Agendador de Follow-Up & Lembretes</h3>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Novo lembrete (ex: Retornar proposta para Sr. Roberto)..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-600"
        />
        <button
          onClick={handleAddTask}
          disabled={!taskTitle.trim()}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agendar</span>
        </button>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Nenhum lembrete de follow-up pendente.</p>
        ) : (
          tasks.map(t => (
            <div
              key={t.id}
              onClick={() => toggleTask(t.id)}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                t.completed ? 'bg-slate-50 border-slate-200 text-slate-400 line-through' : 'bg-white border-slate-200 text-slate-800 font-medium'
              }`}
            >
              <span>{t.title}</span>
              <CheckCircle2 className={`w-4 h-4 ${t.completed ? 'text-emerald-600' : 'text-slate-300'}`} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
