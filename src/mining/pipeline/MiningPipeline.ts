/**
 * MINERADOR PRO - Mining Pipeline
 * Orchestrates the complete data mining workflow
 */

import { getDatabase } from '../../core/database/connection';
import { DataSource, DiscoveryParams, DiscoveryResult, RawDocument, ExtractedRecord } from '../sources/DataSource';
import { SpiralEngine, RegionMiningPerformance } from '../geographic/SpiralEngine';
import { ValidationEngine } from './ValidationEngine';
import { DeduplicationEngine } from './DeduplicationEngine';
import { OpportunityScorer } from './OpportunityScorer';

export interface MiningConfig {
  sources: DataSource[];
  concurrency: number;
  rateLimitPerMinute: number;
  enableValidation: boolean;
  enableDeduplication: boolean;
  enableScoring: boolean;
}

export interface MiningStats {
  startedAt: Date;
  completedAt?: Date;
  queriesExecuted: number;
  resultsFound: number;
  advertisementsExtracted: number;
  opportunitiesFound: number;
  duplicatesRemoved: number;
  validationErrors: number;
  errors: number;
}

export class MiningPipeline {
  private db = getDatabase();
  private spiralEngine: SpiralEngine;
  private validationEngine: ValidationEngine;
  private dedupEngine: DeduplicationEngine;
  private scorer: OpportunityScorer;
  private config: MiningConfig;
  private stats: MiningStats;
  
  constructor(config: MiningConfig) {
    this.config = config;
    this.spiralEngine = new SpiralEngine();
    this.validationEngine = new ValidationEngine();
    this.dedupEngine = new DeduplicationEngine();
    this.scorer = new OpportunityScorer();
    
    this.stats = {
      startedAt: new Date(),
      queriesExecuted: 0,
      resultsFound: 0,
      advertisementsExtracted: 0,
      opportunitiesFound: 0,
      duplicatesRemoved: 0,
      validationErrors: 0,
      errors: 0
    };
  }
  
  /**
   * Run one mining cycle
   */
  async runCycle(): Promise<MiningStats> {
    console.log('[MiningPipeline] Starting mining cycle...');
    
    // 1. Get next geographic target
    const targetRegion = await this.spiralEngine.getNextMiningTarget();
    if (!targetRegion) {
      console.log('[MiningPipeline] No regions to mine');
      return this.stats;
    }
    
    console.log(`[MiningPipeline] Targeting region: ${targetRegion.name}`);
    
    // 2. Generate search queries for this region
    const queries = this.generateQueriesForRegion(targetRegion);
    
    // 3. Execute discovery for each query
    for (const query of queries) {
      await this.executeDiscovery(query, targetRegion);
    }
    
    // 4. Update region performance
    await this.spiralEngine.markRegionAsMined(targetRegion.id, {
      opportunityScore: this.stats.opportunitiesFound / Math.max(1, this.stats.advertisementsExtracted),
      resultDensity: this.stats.resultsFound / queries.length,
      freshnessScore: 0.8, // TODO: Calculate
      validationRate: 1 - (this.stats.validationErrors / Math.max(1, this.stats.advertisementsExtracted)),
      duplicateRate: this.stats.duplicatesRemoved / Math.max(1, this.stats.advertisementsExtracted),
      commercialQuality: 0.7 // TODO: Calculate
    });
    
    this.stats.completedAt = new Date();
    console.log('[MiningPipeline] Cycle completed', this.stats);
    
    return this.stats;
  }
  
  private generateQueriesForRegion(region: any): string[] {
    // Brazilian truck-related search queries
    const baseQueries = [
      'caminhã·£o à venda',
      'cavalo mecâ·´nico venda',
      'carreta venda',
      'caminhã·£o Volvo',
      'caminhã·£o Scania',
      'caminhã·£o Mercedes',
      'repasse caminhã·£o',
      'oportunidade caminhã·£o',
      'caminhã·£o barato',
      'venda caminhõ·µ·es'
    ];
    
    const queries: string[] = [];
    
    for (const base of baseQueries) {
      queries.push(`${base} ${region.name}`);
      queries.push(`${base} regiã·£o`);
    }
    
    return queries;
  }
  
  private async executeDiscovery(query: string, region: any): Promise<void> {
    this.stats.queriesExecuted++;
    
    const params: DiscoveryParams = {
      query,
      location: {
        city: region.name,
        state: 'SC',
        radius: region.radius_km
      },
      limit: 20
    };
    
    for (const source of this.config.sources) {
      try {
        console.log(`[MiningPipeline] Discovering with ${source.name}: ${query}`);
        
        const results = await source.discover(params);
        this.stats.resultsFound += results.length;
        
        // Process each discovered URL
        for (const result of results) {
          await this.processDiscovery(source, result);
        }
        
      } catch (error) {
        console.error(`[MiningPipeline] Error with source ${source.name}:`, error);
        this.stats.errors++;
      }
    }
  }
  
  private async processDiscovery(source: DataSource, result: DiscoveryResult): Promise<void> {
    try {
      // Fetch the document
      const document = await source.fetch(result.url);
      
      // Parse and extract records
      const records = await source.parse(document);
      
      for (const record of records) {
        await this.processExtractedRecord(source, record);
      }
      
    } catch (error) {
      console.error('[MiningPipeline] Error processing discovery:', error);
      this.stats.errors++;
    }
  }
  
  private async processExtractedRecord(source: DataSource, record: ExtractedRecord): Promise<void> {
    try {
      // Validate
      if (this.config.enableValidation) {
        const validationResult = await this.validationEngine.validate(record);
        if (!validationResult.isValid) {
          this.stats.validationErrors++;
          return;
        }
      }
      
      // Deduplicate
      if (this.config.enableDeduplication) {
        const isDuplicate = await this.dedupEngine.checkDuplicate(record);
        if (isDuplicate) {
          this.stats.duplicatesRemoved++;
          return;
        }
      }
      
      // Store advertisement
      this.storeAdvertisement(source, record);
      this.stats.advertisementsExtracted++;
      
      // Score opportunity
      if (this.config.enableScoring) {
        const score = await this.scorer.score(record);
        if (score.finalPriority > 0.7) {
          this.stats.opportunitiesFound++;
          this.storeOpportunity(record, score);
        }
      }
      
    } catch (error) {
      console.error('[MiningPipeline] Error processing record:', error);
      this.stats.errors++;
    }
  }
  
  private storeAdvertisement(source: DataSource, record: ExtractedRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO advertisements 
      (source_id, source_url, title, description, price_raw, price_normalized, 
       location_city, location_state, metadata_json, content_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Get source_id
    const sourceRow = this.db.prepare(
      'SELECT id FROM sources WHERE name = ?'
    ).get(source.name) as any;
    
    stmt.run(
      sourceRow?.id || 1,
      record.metadata.url || '',
      record.title,
      record.description || '',
      record.priceRaw || '',
      record.priceNormalized || null,
      record.location?.city || null,
      record.location?.state || null,
      JSON.stringify(record),
      this.hashContent(record)
    );
  }
  
  private storeOpportunity(record: ExtractedRecord, score: any): void {
    const adRow = this.db.prepare(
      'SELECT id FROM advertisements WHERE source_url = ? ORDER BY id DESC LIMIT 1'
    ).get(record.metadata.url) as any;
    
    if (adRow) {
      const stmt = this.db.prepare(`
        INSERT INTO opportunities 
        (advertisement_id, data_confidence_score, opportunity_score, recency_score,
         commercial_score, final_priority, is_validated, validated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `);
      
      stmt.run(
        adRow.id,
        score.dataConfidence,
        score.opportunityScore,
        score.recencyScore,
        score.commercialScore,
        score.finalPriority
      );
    }
  }
  
  private hashContent(record: ExtractedRecord): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(record))
      .digest('hex');
  }
}
