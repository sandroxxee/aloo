/**
 * MINERADOR PRO - Deduplication Engine
 * Detects duplicate advertisements using multiple signals
 */

import { getDatabase } from '../../core/database/connection';
import { ExtractedRecord } from '../sources/DataSource';

export class DeduplicationEngine {
  private db = getDatabase();
  
  async checkDuplicate(record: ExtractedRecord): Promise<boolean> {
    // Check by URL
    if (record.metadata.url) {
      const exists = this.db.prepare(`
        SELECT 1 FROM advertisements 
        WHERE source_url = ? 
        LIMIT 1
      `).get(record.metadata.url);
      
      if (exists) return true;
    }
    
    // Check by title similarity + price + location
    if (record.title && record.priceNormalized) {
      const similar = this.db.prepare(`
        SELECT 1 FROM advertisements
        WHERE title LIKE ?
        AND price_normalized BETWEEN ? AND ?
        AND (location_city = ? OR location_state = ?)
        LIMIT 1
      `).get(
        `%${this.normalizeText(record.title).substring(0, 50)}%`,
        record.priceNormalized * 0.95,
        record.priceNormalized * 1.05,
        record.location?.city || '',
        record.location?.state || ''
      );
      
      if (similar) return true;
    }
    
    // Check by phone
    if (record.phone) {
      const normalizedPhone = this.normalizePhone(record.phone);
      if (normalizedPhone) {
        // Would need to join with phones table
        // Simplified for now
      }
    }
    
    return false;
  }
  
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private normalizePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10 || digits.length === 11) {
      return `+55${digits}`;
    }
    
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      return `+${digits}`;
    }
    
    return null;
  }
}
