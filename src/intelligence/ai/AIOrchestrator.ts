/**
 * MINERADOR PRO - AI Orchestrator
 * Routes AI tasks to appropriate providers based on task type and cost
 */

import { getDatabase } from '../../core/database/connection';

export type TaskType = 
  | 'classification'
  | 'entity_extraction'
  | 'normalization'
  | 'anomaly_detection'
  | 'query_generation'
  | 'semantic_similarity'
  | 'description_analysis'
  | 'intent_detection'
  | 'opportunity_ranking'
  | 'data_correction';

export interface AITask {
  id?: number;
  type: TaskType;
  inputData: Record<string, any>;
  context?: Record<string, any>;
  priority?: number;
}

export interface AIResult {
  outputData: Record<string, any>;
  confidence: number;
  tokensUsed?: number;
  durationMs?: number;
  provider?: string;
  model?: string;
}

export interface AIProvider {
  name: string;
  isAvailable: boolean;
  costPerToken: number;
  maxContextLength: number;
  capabilities: TaskType[];
  
  execute(task: AITask): Promise<AIResult>;
}

export class AIOrchestrator {
  private db = getDatabase();
  private providers: Map<string, AIProvider> = new Map();
  private taskRouter: TaskRouter;
  
  constructor() {
    this.taskRouter = new TaskRouter();
  }
  
  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }
  
  async executeTask(task: AITask): Promise<AIResult> {
    // 1. Route task to best provider
    const selectedProvider = this.taskRouter.routeTask(task, this.providers);
    
    if (!selectedProvider) {
      throw new Error(`No available provider for task type: ${task.type}`);
    }
    
    // 2. Execute task
    const start = Date.now();
    const result = await selectedProvider.execute(task);
    const duration = Date.now() - start;
    
    // 3. Store task in database
    this.storeTask(task, result, selectedProvider.name, duration);
    
    // 4. Validate result
    const validated = await this.validateResult(task, result);
    
    return validated;
  }
  
  private async validateResult(task: AITask, result: AIResult): Promise<AIResult> {
    // AI outputs must pass deterministic validation when possible
    
    if (task.type === 'normalization' || task.type === 'entity_extraction') {
      // Validate structured output
      if (!result.outputData || typeof result.outputData !== 'object') {
        result.confidence = 0;
      }
    }
    
    if (task.type === 'anomaly_detection') {
      // Cross-check with rule-based validation
      // If AI says price is normal but rule-based says suspicious, reduce confidence
    }
    
    return result;
  }
  
  private storeTask(task: AITask, result: AIResult, provider: string, durationMs: number): void {
    const taskStmt = this.db.prepare(`
      INSERT INTO ai_tasks (task_type, input_data, model_provider, model_name, status, priority)
      VALUES (?, ?, ?, ?, 'COMPLETED', ?)
    `);
    
    const taskId = taskStmt.run(
      task.type,
      JSON.stringify(task.inputData),
      provider,
      result.model || 'unknown',
      task.priority || 50
    ).lastInsertRowid as number;
    
    const resultStmt = this.db.prepare(`
      INSERT INTO ai_results (task_id, output_data, confidence, tokens_used, duration_ms)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    resultStmt.run(
      taskId,
      JSON.stringify(result.outputData),
      result.confidence,
      result.tokensUsed || 0,
      durationMs
    );
  }
}

class TaskRouter {
  routeTask(task: AITask, providers: Map<string, AIProvider>): AIProvider | null {
    // Find providers that support this task type
    const capableProviders = Array.from(providers.values()).filter(
      p => p.isAvailable && p.capabilities.includes(task.type)
    );
    
    if (capableProviders.length === 0) {
      return null;
    }
    
    // Route based on task complexity and cost
    const complexity = this.estimateComplexity(task);
    
    if (complexity === 'LOW') {
      // Use cheapest provider
      return capableProviders.reduce((cheapest, current) => 
        current.costPerToken < cheapest.costPerToken ? current : cheapest
      );
    }
    
    if (complexity === 'HIGH') {
      // Use best quality provider (could be most expensive)
      // For now, just return first available
      return capableProviders[0];
    }
    
    // MEDIUM complexity - balance cost and quality
    return capableProviders[0];
  }
  
  private estimateComplexity(task: AITask): 'LOW' | 'MEDIUM' | 'HIGH' {
    const highComplexityTasks: TaskType[] = [
      'semantic_similarity',
      'opportunity_ranking',
      'data_correction'
    ];
    
    const lowComplexityTasks: TaskType[] = [
      'normalization',
      'entity_extraction'
    ];
    
    if (highComplexityTasks.includes(task.type)) return 'HIGH';
    if (lowComplexityTasks.includes(task.type)) return 'LOW';
    return 'MEDIUM';
  }
}
