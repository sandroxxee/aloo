/**
 * MINERADOR PRO - Geographic Spiral Mining Engine
 * Expands from Xanxerê·´-SC outward in rings
 */

import { getDatabase } from '../../core/database/connection';

export interface GeographicRegion {
  id: number;
  name: string;
  type: 'city' | 'region' | 'state' | 'macro_region' | 'country';
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  miningPriority: number;
  lastMinedAt?: Date;
}

export interface SpiralRing {
  ringNumber: number;
  regions: GeographicRegion[];
  averageDistanceKm: number;
}

export class SpiralEngine {
  private db = getDatabase();
  private centerPoint = { lat: -26.8747, lng: -52.4089 }; // Xanxerê·´-SC
  
  /**
   * Get current mining target based on spiral expansion
   */
  async getNextMiningTarget(): Promise<GeographicRegion | null> {
    // Find region with highest priority that hasn't been mined recently
    const query = `
      SELECT id, name, type, center_lat, center_lng, radius_km, mining_priority, last_mined_at
      FROM geographic_regions
      WHERE mining_priority > 0
      ORDER BY mining_priority DESC, last_mined_at ASC NULLS FIRST
      LIMIT 1
    `;
    
    const row = this.db.prepare(query).get() as any;
    
    if (!row) {
      return null;
    }
    
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      centerLat: row.center_lat,
      centerLng: row.center_lng,
      radiusKm: row.radius_km,
      miningPriority: row.mining_priority,
      lastMinedAt: row.last_mined_at ? new Date(row.last_mined_at) : undefined
    };
  }
  
  /**
   * Update region after mining
   */
  async markRegionAsMined(regionId: number, performance: RegionMiningPerformance): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE geographic_regions
      SET 
        last_mined_at = CURRENT_TIMESTAMP,
        opportunity_score = ?,
        result_density = ?,
        freshness_score = ?,
        validation_rate = ?,
        duplicate_rate = ?,
        commercial_quality = ?,
        mining_priority = mining_priority + ?
      WHERE id = ?
    `);
    
    // Adjust priority based on performance
    const priorityAdjustment = this.calculatePriorityAdjustment(performance);
    
    stmt.run(
      performance.opportunityScore,
      performance.resultDensity,
      performance.freshnessScore,
      performance.validationRate,
      performance.duplicateRate,
      performance.commercialQuality,
      priorityAdjustment,
      regionId
    );
  }
  
  private calculatePriorityAdjustment(perf: RegionMiningPerformance): number {
    let adjustment = 0;
    
    // High opportunity score = increase priority
    if (perf.opportunityScore > 0.7) adjustment += 10;
    if (perf.opportunityScore < 0.3) adjustment -= 5;
    
    // High result density = increase priority
    if (perf.resultDensity > 0.7) adjustment += 5;
    if (perf.resultDensity < 0.3) adjustment -= 5;
    
    // High validation rate = increase priority
    if (perf.validationRate > 0.8) adjustment += 10;
    if (perf.validationRate < 0.4) adjustment -= 10;
    
    // High duplicate rate = decrease priority
    if (perf.duplicateRate > 0.5) adjustment -= 10;
    
    // High commercial quality = increase priority
    if (perf.commercialQuality > 0.7) adjustment += 10;
    
    return adjustment;
  }
  
  /**
   * Expand spiral to new regions
   */
  async expandSpiral(): Promise<void> {
    // Get regions that need expansion
    const query = `
      SELECT id, name, type, center_lat, center_lng, radius_km
      FROM geographic_regions
      WHERE type IN ('city', 'region')
      AND mining_priority > 50
      LIMIT 10
    `;
    
    const regions = this.db.prepare(query).all() as any[];
    
    for (const region of regions) {
      // Find nearby municipalities to add
      const nearbyMunicipalities = await this.findNearbyMunicipalities(
        region.center_lat,
        region.center_lng,
        region.radius_km * 2
      );
      
      for (const muni of nearbyMunicipalities) {
        // Check if already exists
        const exists = this.db.prepare(
          'SELECT 1 FROM geographic_regions WHERE name = ?'
        ).get(muni.name);
        
        if (!exists) {
          this.db.prepare(`
            INSERT INTO geographic_regions 
            (name, type, center_lat, center_lng, radius_km, mining_priority, parent_region_id)
            VALUES (?, 'city', ?, ?, 25, 50, ?)
          `).run(muni.name, muni.lat, muni.lng, region.id);
        }
      }
    }
  }
  
  private async findNearbyMunicipalities(
    lat: number, 
    lng: number, 
    radiusKm: number
  ): Promise<Array<{ name: string; lat: number; lng: number }>> {
    // In production, this would query a municipalities database
    // For now, return placeholder data
    return [
      { name: 'Xavantinha', lat: -27.0667, lng: -52.3167 },
      { name: 'Ipuaç··', lat: -26.8167, lng: -52.4833 },
      { name: 'Ouro Verde', lat: -26.8333, lng: -52.3667 },
    ];
  }
  
  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export interface RegionMiningPerformance {
  opportunityScore: number;
  resultDensity: number;
  freshnessScore: number;
  validationRate: number;
  duplicateRate: number;
  commercialQuality: number;
}
