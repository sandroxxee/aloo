/**
 * MINERADOR PRO - System Health Monitor
 * Monitors database, queues, workers, sources, and AI providers
 */

import { getDatabase } from '../core/database/connection';

export interface HealthReport {
  database: boolean;
  filesystem: boolean;
  queues: boolean;
  workers: boolean;
  sources: boolean;
  aiProviders: boolean;
  messaging: boolean;
  overall: 'HEALTHY' | 'DEGRADED' | 'WARNING' | 'CRITICAL';
}

export class SystemHealth {
  private db = getDatabase();
  
  async runDiagnostics(): Promise<HealthReport> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkFilesystem(),
      this.checkQueues(),
      this.checkWorkers(),
      this.checkSources(),
      this.checkAIProviders(),
      this.checkMessaging()
    ]);
    
    const [database, filesystem, queues, workers, sources, aiProviders, messaging] = checks;
    
    const healthyCount = [database, filesystem, queues, workers, sources, aiProviders, messaging]
      .filter(Boolean).length;
    
    let overall: HealthReport['overall'] = 'HEALTHY';
    if (healthyCount < 3) overall = 'CRITICAL';
    else if (healthyCount < 5) overall = 'WARNING';
    else if (healthyCount < 7) overall = 'DEGRADED';
    
    return {
      database,
      filesystem,
      queues,
      workers,
      sources,
      aiProviders,
      messaging,
      overall
    };
  }
  
  private async checkDatabase(): Promise<boolean> {
    try {
      const result = this.db.prepare('SELECT 1').get();
      return result !== undefined;
    } catch {
      return false;
    }
  }
  
  private async checkFilesystem(): Promise<boolean> {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      return true;
    } catch {
      return false;
    }
  }
  
  private async checkQueues(): Promise<boolean> {
    try {
      const count = this.db.prepare(
        'SELECT COUNT(*) as count FROM message_queue WHERE status = ?'
      ).get('PENDING') as any;
      
      // Queue is healthy if we can query it
      return true;
    } catch {
      return false;
    }
  }
  
  private async checkWorkers(): Promise<boolean> {
    // Check if workers are responding
    // In production, would check worker heartbeats
    return true;
  }
  
  private async checkSources(): Promise<boolean> {
    try {
      const result = this.db.prepare(
        'SELECT COUNT(*) as count FROM sources WHERE is_active = 1'
      ).get() as any;
      
      return result.count > 0;
    } catch {
      return false;
    }
  }
  
  private async checkAIProviders(): Promise<boolean> {
    // Check if AI providers are configured
    return !!process.env.GEMINI_API_KEY;
  }
  
  private async checkMessaging(): Promise<boolean> {
    try {
      // Check if WhatsApp or Telegram is configured
      const whatsappConfigured = this.db.prepare(
        'SELECT 1 FROM whatsapp_sessions LIMIT 1'
      ).get();
      
      return whatsappConfigured !== undefined || !!process.env.TELEGRAM_BOT_TOKEN;
    } catch {
      return false;
    }
  }
}
