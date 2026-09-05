/**
 * MINERADOR PRO - DataSource Interface
 * Contract for all data source adapters
 */

export interface DiscoveryResult {
  url: string;
  title: string;
  snippet: string;
  metadata: Record<string, any>;
  discoveredAt: Date;
}

export interface RawDocument {
  url: string;
  content: string;
  contentType: string;
  fetchedAt: Date;
  httpStatus: number;
  headers: Record<string, string>;
  metadata: Record<string, any>;
}

export interface ExtractedRecord {
  title: string;
  description?: string;
  priceRaw?: string;
  priceNormalized?: number;
  currency?: string;
  location?: {
    city?: string;
    state?: string;
    region?: string;
  };
  phone?: string;
  publishedAt?: Date;
  images?: string[];
  vehicle?: {
    brand?: string;
    model?: string;
    year?: number;
    mileage?: number;
  };
  metadata: Record<string, any>;
}

export interface SourceHealth {
  isAvailable: boolean;
  httpStatus?: number;
  responseTimeMs?: number;
  parsingSuccessRate: number;
  extractionSuccessRate: number;
  resultVolume: number;
  duplicateRatio: number;
  invalidRatio: number;
  freshnessHours: number;
  errorCount: number;
  healthScore: number;
}

export interface DataSource {
  readonly name: string;
  readonly type: 'search_engine' | 'classified' | 'marketplace' | 'directory' | 'rss';
  readonly baseUrl?: string;
  
  discover(params: DiscoveryParams): Promise<DiscoveryResult[]>;
  fetch(url: string): Promise<RawDocument>;
  parse(document: RawDocument): Promise<ExtractedRecord[]>;
  healthCheck(): Promise<SourceHealth>;
}

export interface DiscoveryParams {
  query: string;
  location?: {
    city?: string;
    state?: string;
    radius?: number;
  };
  filters?: Record<string, any>;
  limit?: number;
  page?: number;
}

export abstract class BaseDataSource implements DataSource {
  abstract readonly name: string;
  abstract readonly type: 'search_engine' | 'classified' | 'marketplace' | 'directory' | 'rss';
  abstract readonly baseUrl?: string;
  
  abstract discover(params: DiscoveryParams): Promise<DiscoveryResult[]>;
  abstract fetch(url: string): Promise<RawDocument>;
  abstract parse(document: RawDocument): Promise<ExtractedRecord[]>;
  abstract healthCheck(): Promise<SourceHealth>;
  
  protected normalizePhone(phone: string): string | null {
    if (!phone) return null;
    
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle Brazilian numbers
    if (digits.length === 10 || digits.length === 11) {
      // Add country code
      return `+55${digits}`;
    }
    
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      return `+${digits}`;
    }
    
    return null;
  }
  
  protected normalizePrice(priceRaw: string): number | null {
    if (!priceRaw) return null;
    
    // Remove currency symbols and whitespace
    let cleaned = priceRaw.replace(/[R$\s]/g, '').trim();
    
    // Handle Brazilian number format (1.000,00)
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Format: 1.000,00
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      // Format: 1000,00
      cleaned = cleaned.replace(',', '.');
    }
    
    const value = parseFloat(cleaned);
    return isNaN(value) ? null : value;
  }
  
  protected extractLocation(text: string): { city?: string; state?: string } | null {
    // Simple Brazilian city/state extraction
    const patterns = [
      /([A-Za-z\s]+)\s*-\s*([A-Z]{2})/,
      /([A-Za-z\s]+)\/,\s*([A-Z]{2})/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          city: match[1].trim(),
          state: match[2].trim().toUpperCase()
        };
      }
    }
    
    return null;
  }
}
