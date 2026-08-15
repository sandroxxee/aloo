export type LeadIntent = 'Venda' | 'Compra' | 'Troca' | 'Aluguel' | 'Outro';

export type LeadCategory = 'Caminhões' | 'Peças' | 'Implementos' | 'Manutenção' | 'Pneus' | 'Motores' | 'Serviços' | 'Logística';

export type SellerType = 'Particular' | 'Lojista / Concessionária' | 'Transportadora / Frotista' | 'Desmanche / Auto Peças' | 'LOJISTA_LOTADO';

export type LeadQualification = 'Repasse' | 'Renovação de Frota' | 'Abaixo da Tabela' | 'Anúncio Recente' | 'Normal';

export type LeadSentiment = 'interesse' | 'hesitacao' | 'desinteresse';

export interface LeadChangeRecord {
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
  note: string;
  importance: 'high' | 'medium' | 'low';
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  site?: string;
}

export interface VisualAnalysisResult {
  assetCondition?: 'Excelente' | 'Regular' | 'Desgastado' | 'Sucata / Peças';
  detectedFleetBrands?: string[];
  visualBadges?: string[];
  summary?: string;
  confidenceScore?: number;
  analyzedAt?: string;
}

export interface Lead {
  id: string;
  phone: string;            // Formatted e.g. (11) 98765-4321
  rawPhone: string;         // E.164 digits e.g. 5511987654321
  ddd: string;              // e.g. 11
  phoneType?: 'Celular' | 'Fixo';
  email?: string;
  document?: string; // CPF or CNPJ // Celular (WhatsApp) vs Fixo (Landline)
  name?: string;            // e.g. "Sr. Carlos" or "Falar com Marcos"
  sellerFullName?: string;  // Full seller name e.g. "Marcos Antônio da Silva"
  intent: LeadIntent;       // Venda, Compra, Troca, Aluguel
  item: string;             // Brand/Model/Item detected e.g. "Volvo FH 540"
  price?: string;           // e.g. "R$ 380.000"
  location?: string;        // e.g. "Curitiba - PR"
  city?: string;            // e.g. "Curitiba"
  stateUf?: string;         // e.g. "PR"
  adDate?: string;          // e.g. "Publicado há 2 dias" or "26/07/2026"
  waMeUrl?: string;         // Direct wa.me link e.g. https://wa.me/5511987654321?text=...
  query: string;            // Keyword that led to this contact
  source: 'Automático' | 'Manual';
  snippetContext?: string;  // Surrounding text excerpt
  sellerType?: SellerType;  // Particular, Lojista / Concessionária, Transportadora, Desmanche
  category?: LeadCategory;  // Caminhões, Peças, Implementos, Manutenção
  companyName?: string;     // e.g. "Transportadora Transparaná" or "Scania AutoVeículos"
  webPageUrl?: string;      // Detected store/profile URL
  adPlatform?: 'OLX' | 'Facebook' | 'Instagram' | 'Mercado Livre' | 'Webmotors' | 'Outro'; // Platform source
  adCount?: number;         // Count of ads associated with this phone number
  qualification?: LeadQualification; // Repasse, Renovação de Frota, Abaixo da Tabela, Anúncio Recente
  outreachStatus?: 'pendente' | 'enviado' | 'respondido' | 'ignorado'; // WhatsApp background outreach status
  whatsappStatus?: 'unchecked' | 'has-whatsapp' | 'no-whatsapp'; // Triagem manual de validade
  isPublicRegister?: boolean;       // Se foi minerado de cadastro público (Ex: Receita Federal, CNPJ)
  isBusinessDirectory?: boolean;    // Se foi minerado de lista telefônica/guias de empresas
  aiQualificationScore?: number;    // 0-100, baseado em probabilidade de negócio
  aiSummary?: string;               // Resumo breve gerado por IA
  sentiment?: LeadSentiment;        // Análise de sentimento da resposta/conversa
  sentimentReason?: string;         // Justificativa da IA para o sentimento
  priorityLevel?: 1 | 2 | 3;        // Nível de prioridade da linha (1 = Normal, 2 = Média, 3 = Alta)
  kanbanStage?: 'novo' | 'contatado' | 'negociacao' | 'ganho' | 'perdido'; // CRM Kanban stage
  createdAt: string;        // ISO string
  socialLinks?: SocialLinks;
  allPlatforms?: string[];         // Todas as plataformas unificadas (OLX, Mercado Livre, Facebook, etc.)
  allWebPageUrls?: string[];       // Todos os links de anúncios/perfis vinculados ao mesmo vendedor
  historyChanges?: LeadChangeRecord[]; // Histórico de alterações (preço, descrição, status)
  firstSeenAt?: string;            // ISO String do primeiro avistamento
  lastSeenAt?: string;             // ISO String da última atualização
  updatesCount?: number;           // Quantidade de atualizações e alterações registradas
  hasProfilePic?: boolean;         // V3.1: Se o contato possui foto de perfil no WhatsApp
  profilePicUrl?: string;          // V3.1: URL da foto de perfil
  distanceFromXanxereKm?: number;  // V3.1: Distância calculada de Xanxerê/SC
  isDesperateDealer?: boolean;     // V3.1: Identificado como Lojista Lotado (3+ anúncios em 7 dias)
  commercialScore?: number;        // 0-100 Score comercial unificado de completude e valor
  totalContactsFound?: number;     // Quantidade total de contatos/telefones descobertos para o vendedor
  segment?: string;                // Segmento comercial identificado (ex: Transportes, Auto Peças, Concessionária)
  isUrgent?: boolean;              // Radar de Urgência Extrema (ex: motivo viagem, preciso vender hoje)
  isBelowMarket?: boolean;         // Radar Abaixo da Tabela / FIPE
  belowMarketDiscount?: string;    // Percentual ou valor estimado de desconto abaixo do mercado
  hasPriceDrop?: boolean;          // Radar de Queda de Preço registrada no histórico
  isFleetRenovation?: boolean;     // Radar de Renovação de Frota / Desmobilização corporativa
  companyStatusSignal?: 'expansao' | 'encerramento' | 'estavel'; // Radar Empresarial (Expansão vs Liquidação)
  opportunityBadges?: string[];   // Rótulos de oportunidade de alto valor comercial
  weakSignals?: string[];         // Sinais fracos de urgência detectados no snippet/descrição
  visualAnalysis?: VisualAnalysisResult; // Enriquecimento Preditivo por Visão Computacional / IA
  isMultiStateSeller?: boolean;   // Vendedor/Frotista atuando em múltiplos estados
  crossRegionalStates?: string[]; // Lista de estados identificados na atuação do vendedor
  cadenceStep?: number;            // Etapa do Funil de Cadência (1 = Dia 1 Pitch, 2 = Dia 2 Proposta, 3 = Dia 3 Fechamento/Repasse)
  lastCadenceSentAt?: string;      // ISO string do último envio de cadência
  nextCadenceScheduledAt?: string; // ISO string do próximo envio agendado
  cadenceStatus?: 'active' | 'paused' | 'completed'; // Estado da cadência de acompanhamento
  repliedCount?: number;
  tags?: string[];                 // Tags personalizadas do lead para categorização rápida
}

export interface SearchResult {
  title: string;
  snippet: string;
  url?: string;
  sourceEngine: string;
}

export interface ExtractedContact {
  rawPhone: string;
  formattedPhone: string;
  ddd: string;
  phoneType?: 'Celular' | 'Fixo';
  email?: string;
  document?: string;
  name?: string;
  sellerFullName?: string;
  intent: LeadIntent;
  item: string;
  price?: string;
  location?: string;
  city?: string;
  stateUf?: string;
  adDate?: string;
  waMeUrl?: string;
  snippetContext: string;
  sellerType?: SellerType;
  companyName?: string;
  webPageUrl?: string;
  adPlatform?: 'OLX' | 'Facebook' | 'Instagram' | 'Mercado Livre' | 'Webmotors' | 'Outro';
  qualification?: LeadQualification;
  socialLinks?: SocialLinks;
  isPublicRegister?: boolean;
  isBusinessDirectory?: boolean;
}

export interface KeywordMetric {
  keyword: string;
  totalSearches: number;
  leadsFound: number;
  validPhonesCount: number;
  conversionRate: number;
  status: 'active' | 'deprecated' | 'promoted';
  lastSearchedAt?: string;
  notes?: string;
  consecutiveFailures?: number;
}

export interface KeywordSuggestion {
  id: string;
  keyword: string;
  sourceItem: string;
  intent: LeadIntent;
  createdAt: string;
  feedback?: 'like' | 'dislike';
}

export type KeywordFeedbackType = 'like' | 'dislike';

export interface KeywordFeedbackItem {
  id: string;
  keyword: string;
  feedback: KeywordFeedbackType;
  timestamp: string;
  intent?: LeadIntent;
  item?: string;
  seedPrompt?: string;
}

export interface TrainingStats {
  totalFeedback: number;
  likesCount: number;
  dislikesCount: number;
  accuracyEstimate: number;
}

export interface SearchFilterConfig {
  targetState: string;            // e.g. 'ALL', 'SP', 'MG', 'PR', 'RJ', 'GO', '11', '41', etc.
  phoneType: 'ALL' | 'Celular' | 'Fixo';
  sellerType: 'ALL' | SellerType;
  intent: 'ALL' | LeadIntent;
  engineMode: string;             // 'global' | 'olx' | 'social' | 'specialized' | 'duckduckgo' | 'economy'
  onlyWithEmail: boolean;
  onlyWithDocument: boolean;
  multiAdsOnly?: boolean;
  deterministicMode?: boolean;    // Precise search without AI expansion or fuzzy matching
}

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'ai';

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  engine?: string;
  keyword?: string;
  message: string;
  details?: string;
}

export type LoopStatus = 'idle' | 'running' | 'paused_manual' | 'paused_user' | 'completed';

export interface LoopState {
  status: LoopStatus;
  currentIndex: number;
  currentKeyword: string;
  delaySeconds: number;
  totalSearches: number;
  leadsFoundInLoop: number;
  lastEngineUsed?: string;
  manualRequiredReason?: string;
  autoRecoveryMode: boolean; // Autonomous real-time error recovery
  aiSearchEnabled: boolean;   // Progressive AI keyword discovery
  repesquisaQueue?: { keyword: string; depth: number }[]; // Fila de repesquisa profunda
  failedKeywords?: string[]; // Termos que não retornaram resultados
  concurrency?: number; // Número de buscas simultâneas em paralelo (padrão: 3)
  backoffActive?: boolean; // Sistema de Backoff Exponencial ativo
  consecutiveNetworkErrors?: number; // Contador de falhas de rede consecutivas
  activeBatch?: string[]; // Lista de palavras-chave sendo pesquisadas simultaneamente no momento
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'call' | 'whatsapp' | 'proposal' | 'meeting' | 'reengagement';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface LeadFollowUpTask {
  id: string;
  title: string;
  description?: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  leadItem?: string;
  dueDate: string; // ISO String
  priority: TaskPriority;
  category: TaskCategory;
  recurrence: TaskRecurrence;
  completed: boolean;
  completedAt?: string;
  notified?: boolean;
  createdAt: string;
}

export type AuditEventType = 'access_login' | 'access_unlock' | 'data_copy' | 'data_export' | 'file_download' | 'password_change' | 'failed_attempt';

export interface AccessAuditLog {
  id: string;
  timestamp: string; // ISO String
  eventType: AuditEventType;
  description: string;
  ipLocation?: string;
  userAgent?: string;
  copiedContentSnippet?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'Universal / Neutro' | 'Venda de Peça' | 'Compra de Caminhão' | 'Troca / Repasse' | 'Parceria' | 'Oferta À Vista' | 'Divulgação / Sistema' | 'Consulta de Preço' | 'Detalhes do Veículo' | 'Follow-up';
  text: string;
  mediaUrl?: string;
  sendAsAudioTTS?: boolean;
  aiSuggested?: boolean;
  userId?: string;
  createdAt?: string;
}

export interface WhatsAppChip {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'paused' | 'banned_prevention';
  sentCount: number;
  dailyLimit: number;
}

export interface AutoReplyRule {
  id: string;
  triggerKeywords: string;
  replyText: string;
  category: 'Atendimento Inicial' | 'Negociação' | 'Vistoria & Fotos' | 'Estoque' | 'Peças';
  enabled: boolean;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  category: string;
  inviteLink: string;
  description: string;
  memberCount: number;
  createdDate: string;
}

export interface SecurityConfig {
  passwordHash?: string; // Stored password/PIN
  isPasswordProtected: boolean; // Is screen lock enabled
  notifyOnAccess: boolean; // Alert on access/login
  notifyOnCopy: boolean; // Alert on text copy/file export
  securityWebhookUrl?: string; // Optional webhook (e.g. Telegram / Discord / Custom server)
  soundAlertsEnabled: boolean; // Play alarm sound on unauthorized copy or access
  autoLockMinutes: number; // Inactivity timeout in minutes (0 = disabled)
}

// --- SEARCH BRAIN V2 DEBUG CONSOLE INTERFACES ---
export type SearchDebugStage =
  | 'INIT'
  | 'CACHE_CHECK'
  | 'HTTP_REQUEST'
  | 'CASCADE_AI'
  | 'CLEANSE_DEDUP'
  | 'DELAY_COOLING'
  | 'COMPLETE'
  | 'ERROR'
  | 'BOTTLENECK';

export interface SearchDebugStep {
  id: string;
  timestamp: string;
  elapsedMs: number;
  stage: SearchDebugStage;
  message: string;
  details?: Record<string, any>;
  durationMs?: number;
  isBottleneck?: boolean;
  query?: string;
  batchIndex?: number;
}

export interface SearchDebugBreakdown {
  cacheMs: number;
  networkHttpMs: number;
  cascadeAiMs: number;
  delaysMs: number;
  dedupProcessingMs: number;
}

export interface SearchExecutionSummary {
  seedTerm: string;
  startTimeIso: string;
  endTimeIso: string;
  totalDurationSeconds: number;
  totalDurationMs: number;
  queriesGeneratedCount: number;
  queriesExecutedCount: number;
  totalRawContactsFound: number;
  uniqueLeadsRetained: number;
  cacheHitsCount: number;
  httpRequestsCount: number;
  rateLimit429Count: number;
  cascadeAiCallsCount: number;
  breakdownMs: SearchDebugBreakdown;
  bottlenecks: string[];
  status: 'success' | 'partial' | 'failed';
}

