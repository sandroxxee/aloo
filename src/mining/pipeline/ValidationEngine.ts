/**
 * MINERADOR PRO - Validation Engine
 * Validates extracted data and detects anomalies
 */

import { ExtractedRecord } from '../sources/DataSource';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  anomalies: Anomaly[];
  correctedFields: Record<string, any>;
}

export interface Anomaly {
  field: string;
  type: 'IMPOSSIBLE_PRICE' | 'SUSPICIOUS_PRICE' | 'IMPOSSIBLE_YEAR' | 
        'INVALID_PHONE' | 'INVALID_LOCATION' | 'DUPLICATE' | 'INCONSISTENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  originalValue: any;
  suggestedValue?: any;
}

export class ValidationEngine {
  
  async validate(record: ExtractedRecord): Promise<ValidationResult> {
    const anomalies: Anomaly[] = [];
    const correctedFields: Record<string, any> = {};
    
    // Validate price
    if (record.priceNormalized) {
      const priceValidation = this.validatePrice(record.priceNormalized, record.vehicle);
      if (priceValidation.anomaly) {
        anomalies.push(priceValidation.anomaly);
      }
      if (priceValidation.corrected) {
        correctedFields.priceNormalized = priceValidation.corrected;
      }
    }
    
    // Validate year
    if (record.vehicle?.year) {
      const yearValidation = this.validateYear(record.vehicle.year);
      if (yearValidation.anomaly) {
        anomalies.push(yearValidation.anomaly);
      }
    }
    
    // Validate phone
    if (record.phone) {
      const phoneValidation = this.validatePhone(record.phone);
      if (!phoneValidation.isValid) {
        anomalies.push({
          field: 'phone',
          type: 'INVALID_PHONE',
          severity: 'MEDIUM',
          message: 'Invalid phone number format',
          originalValue: record.phone
        });
      }
    }
    
    // Determine overall validity
    const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL');
    const isValid = criticalAnomalies.length === 0;
    
    const confidence = this.calculateConfidence(anomalies);
    
    return {
      isValid,
      confidence,
      anomalies,
      correctedFields
    };
  }
  
  private validatePrice(price: number, vehicle?: { brand?: string; model?: string; year?: number }): {
    anomaly?: Anomaly;
    corrected?: number;
  } {
    // Check for impossible prices
    if (price <= 0) {
      return {
        anomaly: {
          field: 'price',
          type: 'IMPOSSIBLE_PRICE',
          severity: 'CRITICAL',
          message: 'Price is zero or negative',
          originalValue: price
        }
      };
    }
    
    // Check for suspiciously low prices (potential errors or scams)
    if (price < 10000) {
      return {
        anomaly: {
          field: 'price',
          type: 'SUSPICIOUS_PRICE',
          severity: 'HIGH',
          message: 'Price is suspiciously low for a truck',
          originalValue: price
        }
      };
    }
    
    // Check for impossibly high prices
    if (price > 5000000) {
      return {
        anomaly: {
          field: 'price',
          type: 'SUSPICIOUS_PRICE',
          severity: 'HIGH',
          message: 'Price is impossibly high',
          originalValue: price
        }
      };
    }
    
    // Check for common extraction errors (e.g., missing decimal)
    if (price > 100000 && price % 1000 === 0 && price < 2000) {
      // Might be 1.500 extracted as 1500 instead of 1500.00
      // This is actually correct for Brazilian format
    }
    
    return {};
  }
  
  private validateYear(year: number): { anomaly?: Anomaly } {
    const currentYear = new Date().getFullYear();
    const minYear = 1970;
    
    if (year < minYear || year > currentYear + 1) {
      return {
        anomaly: {
          field: 'year',
          type: 'IMPOSSIBLE_YEAR',
          severity: 'HIGH',
          message: `Year ${year} is outside valid range (${minYear}-${currentYear + 1})`,
          originalValue: year
        }
      };
    }
    
    return {};
  }
  
  private validatePhone(phone: string): { isValid: boolean } {
    // Brazilian phone validation
    const normalized = phone.replace(/\D/g, '');
    
    // Must have 10-11 digits (area code + number)
    if (normalized.length < 10 || normalized.length > 12) {
      return { isValid: false };
    }
    
    // Area code must be 2 digits (11-99)
    const areaCode = parseInt(normalized.substring(0, 2));
    if (areaCode < 11 || areaCode > 99) {
      return { isValid: false };
    }
    
    return { isValid: true };
  }
  
  private calculateConfidence(anomalies: Anomaly[]): number {
    if (anomalies.length === 0) return 1.0;
    
    const severityWeights = {
      LOW: 0.05,
      MEDIUM: 0.15,
      HIGH: 0.30,
      CRITICAL: 0.50
    };
    
    const totalPenalty = anomalies.reduce(
      (sum, a) => sum + severityWeights[a.severity],
      0
    );
    
    return Math.max(0, 1 - totalPenalty);
  }
}
