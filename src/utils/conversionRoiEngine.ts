import { Lead } from '../types';

export interface KeywordRoiMetrics {
  keyword: string;
  totalLeads: number;
  totalWhatsAppValid: number;
  responseRatePercent: number;
  dealsClosed: number;
  estimatedRevenue: number; // Em R$
  estimatedCost: number;    // Em R$
  roiPercent: number;       // Return on Investment %
}

export interface PlatformPerformanceMetrics {
  platform: string;
  totalLeads: number;
  whatsAppRatePercent: number;
  closedDealsCount: number;
  revenueInBrl: number;
}

export interface SystemRoiOverview {
  totalLeadsMined: number;
  totalWhatsAppValid: number;
  overallResponseRatePercent: number;
  totalClosedDeals: number;
  totalEstimatedRevenueBrl: number;
  estimatedTotalCostBrl: number;
  overallRoiPercent: number;
  topPerformingKeywords: KeywordRoiMetrics[];
  platformPerformance: PlatformPerformanceMetrics[];
}

/**
 * 📊 FASE 4 — CONVERSION & ROI ANALYTICS ENGINE
 * Calcula retorno sobre investimento, métricas de conversão por palavra-chave e eficiência de plataformas.
 */
export function calculateConversionAndRoiMetrics(
  leads: Lead[],
  estimatedCostPerLeadBrl: number = 2.50,
  averageTicketBrl: number = 15000
): SystemRoiOverview {
  const keywordMap: Record<string, {
    leadsCount: number;
    waCount: number;
    closedCount: number;
  }> = {};

  const platformMap: Record<string, {
    leadsCount: number;
    waCount: number;
    closedCount: number;
  }> = {};

  let totalClosedCount = 0;
  let totalWaCount = 0;

  for (const lead of leads) {
    const kw = (lead.query || 'Geral').trim();
    const plat = (lead.adPlatform || 'Google / Outros').trim();
    const isClosed = (lead as any).kanbanStage === 'Fechado/Ganho' || (lead as any).qualification === 'Fechado/Ganho';
    const hasWa = !!(lead.phone?.includes('WhatsApp') || lead.snippetContext?.toLowerCase().includes('whatsapp'));

    if (isClosed) totalClosedCount++;
    if (hasWa) totalWaCount++;

    // Keyword Stats
    if (!keywordMap[kw]) {
      keywordMap[kw] = { leadsCount: 0, waCount: 0, closedCount: 0 };
    }
    keywordMap[kw].leadsCount++;
    if (hasWa) keywordMap[kw].waCount++;
    if (isClosed) keywordMap[kw].closedCount++;

    // Platform Stats
    if (!platformMap[plat]) {
      platformMap[plat] = { leadsCount: 0, waCount: 0, closedCount: 0 };
    }
    platformMap[plat].leadsCount++;
    if (hasWa) platformMap[plat].waCount++;
    if (isClosed) platformMap[plat].closedCount++;
  }

  const totalLeadsMined = leads.length;
  const estimatedTotalCostBrl = totalLeadsMined * estimatedCostPerLeadBrl;
  const totalEstimatedRevenueBrl = totalClosedCount * averageTicketBrl;
  
  const netProfit = totalEstimatedRevenueBrl - estimatedTotalCostBrl;
  const overallRoiPercent = estimatedTotalCostBrl > 0 
    ? Math.round((netProfit / estimatedTotalCostBrl) * 100) 
    : 0;

  const overallResponseRatePercent = totalLeadsMined > 0 
    ? Math.round((totalWaCount / totalLeadsMined) * 100) 
    : 0;

  // Process Keywords
  const topPerformingKeywords: KeywordRoiMetrics[] = Object.entries(keywordMap).map(([kw, data]) => {
    const kwRevenue = data.closedCount * averageTicketBrl;
    const kwCost = data.leadsCount * estimatedCostPerLeadBrl;
    const kwNetProfit = kwRevenue - kwCost;
    const kwRoi = kwCost > 0 ? Math.round((kwNetProfit / kwCost) * 100) : 0;
    const responseRate = data.leadsCount > 0 ? Math.round((data.waCount / data.leadsCount) * 100) : 0;

    return {
      keyword: kw,
      totalLeads: data.leadsCount,
      totalWhatsAppValid: data.waCount,
      responseRatePercent: responseRate,
      dealsClosed: data.closedCount,
      estimatedRevenue: kwRevenue,
      estimatedCost: kwCost,
      roiPercent: kwRoi
    };
  }).sort((a, b) => b.roiPercent - a.roiPercent || b.dealsClosed - a.dealsClosed);

  // Process Platforms
  const platformPerformance: PlatformPerformanceMetrics[] = Object.entries(platformMap).map(([plat, data]) => {
    const waRate = data.leadsCount > 0 ? Math.round((data.waCount / data.leadsCount) * 100) : 0;
    return {
      platform: plat,
      totalLeads: data.leadsCount,
      whatsAppRatePercent: waRate,
      closedDealsCount: data.closedCount,
      revenueInBrl: data.closedCount * averageTicketBrl
    };
  }).sort((a, b) => b.closedDealsCount - a.closedDealsCount || b.totalLeads - a.totalLeads);

  return {
    totalLeadsMined,
    totalWhatsAppValid: totalWaCount,
    overallResponseRatePercent,
    totalClosedDeals: totalClosedCount,
    totalEstimatedRevenueBrl,
    estimatedTotalCostBrl,
    overallRoiPercent,
    topPerformingKeywords,
    platformPerformance
  };
}
