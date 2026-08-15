import { ExtractedContact, SearchFilterConfig, SearchExecutionSummary } from '../types';
import { executeSmartOrchestratedSearch } from '../utils/smartSearchOrchestrator';

export type SearchTaskStatus = 'pending' | 'running' | 'completed' | 'error';

export interface SearchTask {
  id: string;
  keyword: string;
  status: SearchTaskStatus;
  progress: number; // 0-100
  contactsFound: number;
  startTime?: string;
  endTime?: string;
  error?: string;
  summary?: SearchExecutionSummary;
}

type Listener = (tasks: SearchTask[]) => void;

class SearchQueueManager {
  private tasks: SearchTask[] = [];
  private listeners: Listener[] = [];
  private maxConcurrent = 3;
  private activeCount = 0;

  constructor() {
    // Load from session storage if needed, or start fresh
  }

  public subscribe(listener: Listener) {
    this.listeners.push(listener);
    listener(this.tasks);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l([...this.tasks]));
  }

  public addTask(keyword: string, filterConfig?: SearchFilterConfig) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newTask: SearchTask = {
      id: taskId,
      keyword,
      status: 'pending',
      progress: 0,
      contactsFound: 0,
      startTime: new Date().toISOString(),
    };

    this.tasks = [newTask, ...this.tasks];
    this.notify();
    this.processQueue(filterConfig);
    return taskId;
  }

  private async processQueue(filterConfig?: SearchFilterConfig) {
    if (this.activeCount >= this.maxConcurrent) return;

    const pendingTask = this.tasks.find(t => t.status === 'pending');
    if (!pendingTask) return;

    pendingTask.status = 'running';
    this.activeCount++;
    this.notify();

    try {
      // We wrap the orchestrator to track results
      const results = await executeSmartOrchestratedSearch(
        pendingTask.keyword,
        2, // default depth
        'global', // default engine
        filterConfig,
        (progress) => {
          pendingTask.progress = Math.round(progress * 100);
          this.notify();
        }
      );

      pendingTask.status = 'completed';
      pendingTask.progress = 100;
      pendingTask.contactsFound = results.executionSummary?.uniqueLeadsRetained || results.contacts?.length || 0;
      pendingTask.summary = results.executionSummary;
      pendingTask.endTime = new Date().toISOString();
      
      // Emit a custom event so App.tsx can handle the new leads
      const event = new CustomEvent('search_task_completed', { 
        detail: { 
          keyword: pendingTask.keyword, 
          contacts: results.contacts || [],
          summary: results
        } 
      });
      window.dispatchEvent(event);

    } catch (err: any) {
      pendingTask.status = 'error';
      pendingTask.error = err.message || String(err);
      console.error(`[SearchQueueManager] Error executing task ${pendingTask.id}:`, err);
    } finally {
      this.activeCount--;
      this.notify();
      this.processQueue(filterConfig);
    }
  }

  public getTasks() {
    return this.tasks;
  }

  public clearCompleted() {
    this.tasks = this.tasks.filter(t => t.status !== 'completed' && t.status !== 'error');
    this.notify();
  }
}

export const searchQueueManager = new SearchQueueManager();
