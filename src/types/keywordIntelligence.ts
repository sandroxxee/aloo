export type TermPriority = 'Alta' | 'Média' | 'Baixa';
export type TermStatus = 'Ativo' | 'Pausado' | 'Otimizado' | 'Rejeitado' | 'Descoberto';
export type AiGeneratorMode = 
  | 'Conservador' 
  | 'Comercial' 
  | 'Long Tail' 
  | 'Regional' 
  | 'Similaridade' 
  | 'Competidores' 
  | 'Tendências' 
  | 'Livre' 
  | 'Nicho Profundo';

export interface TermExecutionLog {
  id: string;
  timestamp: string;
  leadsFound: number;
  validPhones: number;
  whatsAppsFound: number;
  durationSec: number;
  engineUsed: string;
  costEst: number;
  roiEst: number;
}

export interface IntelligentTerm {
  id: string;
  keyword: string;
  category: string;
  subcategory: string;
  tags: string[];
  niche: string;
  region: string;
  stateUf: string;
  city: string;
  priority: TermPriority;
  score: number; // 0 - 100
  status: TermStatus;
  createdAt: string;
  lastExecution: string | null;
  lastConversion: string | null;
  executionCount: number;
  leadsFound: number;
  validPhonesCount: number;
  whatsAppsCount: number;
  companiesCount: number;
  individualsCount: number;
  conversionRate: number; // percentage
  estimatedROI: number; // em R$
  costPerLead: number; // em R$
  avgExecutionTimeSec: number;
  aiExplanation?: string;
  executionHistory: TermExecutionLog[];
}

export interface NicheCatalogItem {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  icon: string;
  description: string;
  mainKeywords: string[];
  secondaryKeywords: string[];
  synonyms: string[];
  negativeKeywords: string[];
  priorityCities: string[];
  priorityStates: string[];
}

export interface NegativeTermItem {
  id: string;
  term: string;
  category: 'Empregos' | 'Manuais/PDF' | 'Cursos/Aulas' | 'Notícias/Fipe' | 'Outros';
  source: 'Auto-Aprendido' | 'Manual';
  createdAt: string;
  occurrencesBlocked: number;
  status: 'Ativo' | 'Pendente';
}

export interface SynonymGroup {
  id: string;
  canonicalTerm: string;
  synonyms: string[];
  category: string;
}

export interface TermDiscoveryItem {
  id: string;
  term: string;
  category: string;
  sourceContext: string;
  discoveredAt: string;
  estimatedVolume: 'Alto' | 'Médio' | 'Baixo';
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
}

export interface SimulationResult {
  totalTerms: number;
  estimatedLeads: number;
  estimatedPhones: number;
  estimatedWhatsApps: number;
  estimatedTimeMin: number;
  estimatedCostBrl: number;
  qualityIndex: number; // 0 - 100
  recommendations: string[];
}
