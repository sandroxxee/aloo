/**
 * MINERADOR PRO - Opportunity Scorer
 * Calculates opportunity priority from multiple signals
 */

import { ExtractedRecord } from '../sources/DataSource';

export interface OpportunityScore {
  dataConfidence: number;
  opportunityScore: number;
  recencyScore: number;
  commercialScore: number;
  sellerConfidence: number;
  sourceQuality: number;
  finalPriority: number;
}

export class OpportunityScorer {
  
  async score(record: ExtractedRecord): Promise<OpportunityScore> {
    const dataConfidence = this.scoreDataConfidence(record);
    const opportunityScore = this.scoreOpportunity(record);
    const recencyScore = this.scoreRecency(record);
    const commercialScore = this.scoreCommercialIntent(record);
    const sellerConfidence = this.scoreSellerConfidence(record);
    const sourceQuality = 0.8; // Default, would come from source_health table
    
    // Weighted average
    const finalPriority = (
      dataConfidence * 0.15 +
      opportunityScore * 0.25 +
      recencyScore * 0.20 +
      commercialScore * 0.20 +
      sellerConfidence * 0.10 +
      sourceQuality * 0.10
    );
    
    return {
      dataConfidence,
      opportunityScore,
      recencyScore,
      commercialScore,
      sellerConfidence,
      sourceQuality,
      finalPriority
    };
  }
  
  private scoreDataConfidence(record: ExtractedRecord): number {
    let score = 0.5;
    
    // Has price
    if (record.priceNormalized) score += 0.2;
    
    // Has phone
    if (record.phone) score += 0.15;
    
    // Has location
    if (record.location?.city || record.location?.state) score += 0.10;
    
    // Has vehicle info
    if (record.vehicle?.brand || record.vehicle?.model) score += 0.10;
    
    // Has description
    if (record.description && record.description.length > 50) score += 0.05;
    
    return Math.min(1.0, score);
  }
  
  private scoreOpportunity(record: ExtractedRecord): number {
    // Placeholder - would use ML or rules to detect good deals
    return 0.6;
  }
  
  private scoreRecency(record: ExtractedRecord): number {
    if (!record.publishedAt) return 0.5;
    
    const hoursSincePublished = (
      Date.now() - record.publishedAt.getTime()
    ) / (1000 * 60 * 60);
    
    if (hoursSincePublished < 1) return 1.0;
    if (hoursSincePublished < 6) return 0.9;
    if (hoursSincePublished < 24) return 0.8;
    if (hoursSincePublished < 72) return 0.6;
    if (hoursSincePublished < 168) return 0.4;
    
    return 0.2;
  }
  
  private scoreCommercialIntent(record: ExtractedRecord): number {
    const text = `${record.title} ${record.description}`.toLowerCase();
    
    const highIntentTerms = [
      'urgente', 'oportunidade', 'repasse', 'abaixo da fipe',
      'preç·§o de ocasiã·£o', 'imperdí·´vel', 'promocã·£o'
    ];
    
    const mediumIntentTerms = [
      'vendo', 'à·´ venda', 'disponí·´vel', 'trato', 'aceito troca'
    ];
    
    let score = 0.5;
    
    for (const term of highIntentTerms) {
      if (text.includes(term)) score += 0.15;
    }
    
    for (const term of mediumIntentTerms) {
      if (text.includes(term)) score += 0.05;
    }
    
    return Math.min(1.0, score);
  }
  
  private scoreSellerConfidence(record: ExtractedRecord): number {
    let score = 0.5;
    
    // Has phone
    if (record.phone) score += 0.3;
    
    // Phone is WhatsApp
    if (record.phone && record.phone.includes('whatsapp')) score += 0.1;
    
    // Has complete location
    if (record.location?.city && record.location?.state) score += 0.1;
    
    return Math.min(1.0, score);
  }
}
