/**
 * MINERADOR PRO - Telegram Adapter
 * Manages Telegram bot messaging
 */

import { getDatabase } from '../core/database/connection';

export interface TelegramConfig {
  botToken: string;
  webhookUrl?: string;
}

export class TelegramAdapter {
  private db = getDatabase();
  private config: TelegramConfig;
  private baseUrl = 'https://api.telegram.org/bot';
  
  constructor(config: TelegramConfig) {
    this.config = config;
  }
  
  async sendMessage(chatId: string, message: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}${this.config.botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });
      
      const result = await response.json() as any;
      return result.ok === true;
    } catch (error) {
      console.error('[Telegram] Send error:', error);
      return false;
    }
  }
  
  async sendBatch(messages: Array<{ chatId: string; message: string }>): Promise<number> {
    let sentCount = 0;
    
    for (const msg of messages) {
      const success = await this.sendMessage(msg.chatId, msg.message);
      if (success) sentCount++;
      
      // Rate limiting (30 messages per second)
      await this.sleep(50);
    }
    
    return sentCount;
  }
  
  async getMe(): Promise<any> {
    const url = `${this.baseUrl}${this.config.botToken}/getMe`;
    const response = await fetch(url);
    const result = await response.json() as any;
    return result.ok ? result.result : null;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
