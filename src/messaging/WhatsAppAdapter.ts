/**
 * MINERADOR PRO - WhatsApp Adapter
 * Manages WhatsApp connection and messaging
 */

import { getDatabase } from '../core/database/connection';

export interface WhatsAppConfig {
  apiKey?: string; // For Evolution API or similar
  instanceName: string;
  webhookUrl?: string;
}

export interface WhatsAppSession {
  isConnected: boolean;
  phoneNumber?: string;
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  errorCount: number;
}

export class WhatsAppAdapter {
  private db = getDatabase();
  private config: WhatsAppConfig;
  private session: WhatsAppSession = {
    isConnected: false,
    errorCount: 0
  };
  
  constructor(config: WhatsAppConfig) {
    this.config = config;
  }
  
  async initialize(): Promise<void> {
    // Check if session exists in database
    const sessionRow = this.db.prepare(
      'SELECT * FROM whatsapp_sessions WHERE instance_name = ?'
    ).get(this.config.instanceName) as any;
    
    if (sessionRow) {
      this.session = {
        isConnected: sessionRow.is_connected,
        phoneNumber: sessionRow.phone_number,
        lastConnectedAt: sessionRow.last_connected_at ? new Date(sessionRow.last_connected_at) : undefined,
        lastDisconnectedAt: sessionRow.last_disconnected_at ? new Date(sessionRow.last_disconnected_at) : undefined,
        errorCount: sessionRow.error_count || 0
      };
    }
  }
  
  async connect(): Promise<boolean> {
    try {
      // In production, this would call Evolution API or similar
      console.log('[WhatsApp] Connecting...');
      
      // Simulate connection
      this.session.isConnected = true;
      this.session.lastConnectedAt = new Date();
      
      this.updateSessionState();
      
      return true;
    } catch (error) {
      console.error('[WhatsApp] Connection error:', error);
      this.session.errorCount++;
      this.session.lastDisconnectedAt = new Date();
      this.updateSessionState();
      return false;
    }
  }
  
  async disconnect(): Promise<void> {
    this.session.isConnected = false;
    this.session.lastDisconnectedAt = new Date();
    this.updateSessionState();
  }
  
  async sendMessage(phone: string, message: string): Promise<boolean> {
    if (!this.session.isConnected) {
      throw new Error('WhatsApp is not connected');
    }
    
    // Check suppression list
    const suppressed = this.db.prepare(
      'SELECT 1 FROM suppression_list WHERE phone_number = ? AND is_permanent = 1'
    ).get(this.normalizePhone(phone));
    
    if (suppressed) {
      console.log('[WhatsApp] Message suppressed for:', phone);
      return false;
    }
    
    try {
      // In production, call Evolution API
      console.log(`[WhatsApp] Sending message to ${phone}: ${message.substring(0, 50)}...`);
      
      // Simulate sending
      return true;
    } catch (error) {
      console.error('[WhatsApp] Send error:', error);
      return false;
    }
  }
  
  async sendBatch(messages: Array<{ phone: string; message: string }>): Promise<number> {
    let sentCount = 0;
    
    for (const msg of messages) {
      const success = await this.sendMessage(msg.phone, msg.message);
      if (success) sentCount++;
      
      // Rate limiting
      await this.sleep(1000);
    }
    
    return sentCount;
  }
  
  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10 || digits.length === 11) {
      return `+55${digits}`;
    }
    
    if (digits.startsWith('55')) {
      return `+${digits}`;
    }
    
    return phone;
  }
  
  private updateSessionState(): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO whatsapp_sessions 
      (instance_name, is_connected, phone_number, last_connected_at, last_disconnected_at, error_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      this.config.instanceName,
      this.session.isConnected ? 1 : 0,
      this.session.phoneNumber || null,
      this.session.lastConnectedAt || null,
      this.session.lastDisconnectedAt || null,
      this.session.errorCount
    );
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
