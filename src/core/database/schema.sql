-- MINERADOR PRO - Database Schema
-- PostgreSQL/SQLite compatible

-- ============================================
-- CORE TABLES
-- ============================================

-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'OPERATOR' CHECK(role IN ('ADMIN', 'OPERATOR', 'VIEWER')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL
);

-- ============================================
-- MINING SOURCES
-- ============================================

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  base_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  priority INTEGER DEFAULT 50,
  rate_limit_per_minute INTEGER DEFAULT 60,
  config_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_available BOOLEAN,
  http_status INTEGER,
  response_time_ms INTEGER,
  parsing_success_rate REAL DEFAULT 0,
  extraction_success_rate REAL DEFAULT 0,
  result_volume INTEGER DEFAULT 0,
  duplicate_ratio REAL DEFAULT 0,
  invalid_ratio REAL DEFAULT 0,
  freshness_hours REAL,
  error_count INTEGER DEFAULT 0,
  health_score REAL DEFAULT 100,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

-- ============================================
-- RAW DATA STORAGE
-- ============================================

CREATE TABLE IF NOT EXISTS raw_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  content_hash TEXT,
  raw_content TEXT,
  extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  content_type TEXT,
  status TEXT DEFAULT 'RAW',
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE INDEX IF NOT EXISTS idx_raw_documents_url ON raw_documents(url);
CREATE INDEX IF NOT EXISTS idx_raw_documents_source ON raw_documents(source_id);

-- ============================================
-- VEHICLE KNOWLEDGE BASE
-- ============================================

CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  normalized_name TEXT UNIQUE,
  country TEXT,
  is_active BOOLEAN DEFAULT 1,
  synonyms_json TEXT
);

CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT,
  category TEXT,
  body_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  UNIQUE(brand_id, name)
);

CREATE INDEX IF NOT EXISTS idx_models_brand ON models(brand_id);

-- ============================================
-- VEHICLES & ADVERTISEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id INTEGER,
  model_id INTEGER,
  year INTEGER,
  mileage INTEGER,
  engine TEXT,
  transmission TEXT,
  body_type TEXT,
  category TEXT,
  license_plate TEXT,
  vin TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (model_id) REFERENCES models(id)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model ON vehicles(brand_id, model_id);

CREATE TABLE IF NOT EXISTS advertisements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  source_url TEXT NOT NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price_raw TEXT,
  price_normalized INTEGER,
  price_confidence REAL DEFAULT 1.0,
  currency TEXT DEFAULT 'BRL',
  vehicle_id INTEGER,
  year INTEGER,
  mileage INTEGER,
  location_city TEXT,
  location_state TEXT,
  location_region TEXT,
  published_at DATETIME,
  updated_at DATETIME,
  discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_verified_at DATETIME,
  status TEXT DEFAULT 'ACTIVE',
  images_json TEXT,
  metadata_json TEXT,
  content_hash TEXT,
  FOREIGN KEY (source_id) REFERENCES sources(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_advertisements_source ON advertisements(source_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_url ON advertisements(source_url);
CREATE INDEX IF NOT EXISTS idx_advertisements_discovered ON advertisements(discovered_at);
CREATE INDEX IF NOT EXISTS idx_advertisements_location ON advertisements(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_advertisements_price ON advertisements(price_normalized);

-- ============================================
-- ENTITIES: PEOPLE, COMPANIES, PHONES
-- ============================================

CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  normalized_name TEXT,
  is_seller BOOLEAN DEFAULT 0,
  is_buyer BOOLEAN DEFAULT 0,
  confidence_score REAL DEFAULT 0.5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT,
  cnpj TEXT,
  is_dealership BOOLEAN DEFAULT 0,
  is_fleet BOOLEAN DEFAULT 0,
  is_auction BOOLEAN DEFAULT 0,
  confidence_score REAL DEFAULT 0.5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number_raw TEXT NOT NULL,
  number_normalized TEXT NOT NULL,
  number_type TEXT,
  area_code TEXT,
  is_whatsapp BOOLEAN DEFAULT 0,
  is_valid BOOLEAN DEFAULT 1,
  confidence_score REAL DEFAULT 0.8,
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_phones_normalized ON phones(number_normalized);
CREATE INDEX IF NOT EXISTS idx_phones_raw ON phones(number_raw);

CREATE TABLE IF NOT EXISTS advertisement_phones (
  advertisement_id INTEGER NOT NULL,
  phone_id INTEGER NOT NULL,
  is_primary BOOLEAN DEFAULT 0,
  extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (advertisement_id, phone_id),
  FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
  FOREIGN KEY (phone_id) REFERENCES phones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS advertisement_sellers (
  advertisement_id INTEGER NOT NULL,
  person_id INTEGER,
  company_id INTEGER,
  seller_type TEXT,
  confidence REAL DEFAULT 0.5,
  PRIMARY KEY (advertisement_id),
  FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES people(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- ============================================
-- OPPORTUNITIES
-- ============================================

CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advertisement_id INTEGER NOT NULL UNIQUE,
  data_confidence_score REAL DEFAULT 0.5,
  opportunity_score REAL DEFAULT 0.5,
  recency_score REAL DEFAULT 0.5,
  commercial_score REAL DEFAULT 0.5,
  seller_confidence_score REAL DEFAULT 0.5,
  source_quality_score REAL DEFAULT 0.5,
  final_priority REAL DEFAULT 0.5,
  anomaly_status TEXT DEFAULT 'NORMAL',
  anomaly_reason TEXT,
  is_high_priority BOOLEAN DEFAULT 0,
  is_validated BOOLEAN DEFAULT 0,
  validated_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON opportunities(final_priority DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_validated ON opportunities(is_validated, validated_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_anomaly ON opportunities(anomaly_status);

-- ============================================
-- SEARCH & MINING STATE
-- ============================================

CREATE TABLE IF NOT EXISTS search_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text TEXT NOT NULL,
  location_city TEXT,
  location_state TEXT,
  location_region TEXT,
  source_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  results_count INTEGER DEFAULT 0,
  valid_results INTEGER DEFAULT 0,
  duplicates INTEGER DEFAULT 0,
  opportunities INTEGER DEFAULT 0,
  quality_score REAL DEFAULT 0.5,
  success_pattern BOOLEAN DEFAULT 0,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query_text);
CREATE INDEX IF NOT EXISTS idx_search_queries_location ON search_queries(location_city, location_state);

CREATE TABLE IF NOT EXISTS search_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status TEXT DEFAULT 'RUNNING',
  queries_executed INTEGER DEFAULT 0,
  results_found INTEGER DEFAULT 0,
  opportunities_found INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  geographic_region TEXT,
  mining_mode TEXT
);

CREATE TABLE IF NOT EXISTS mining_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_key TEXT UNIQUE NOT NULL,
  state_value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VALIDATION & DEDUPLICATION
-- ============================================

CREATE TABLE IF NOT EXISTS validation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advertisement_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  confidence_before REAL,
  confidence_after REAL,
  strategy_used TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_validation_events_ad ON validation_events(advertisement_id);

CREATE TABLE IF NOT EXISTS corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advertisement_id INTEGER NOT NULL,
  field_name TEXT NOT NULL,
  original_value TEXT,
  corrected_value TEXT,
  correction_method TEXT,
  confidence REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advertisement_id) REFERENCES advertisements(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS duplicates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advertisement_id_1 INTEGER NOT NULL,
  advertisement_id_2 INTEGER NOT NULL,
  similarity_score REAL NOT NULL,
  match_signals_json TEXT,
  is_confirmed BOOLEAN DEFAULT 0,
  resolution TEXT,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (advertisement_id_1) REFERENCES advertisements(id),
  FOREIGN KEY (advertisement_id_2) REFERENCES advertisements(id)
);

CREATE INDEX IF NOT EXISTS idx_duplicates_pair ON duplicates(advertisement_id_1, advertisement_id_2);

-- ============================================
-- AI TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS ai_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_type TEXT NOT NULL,
  input_data TEXT NOT NULL,
  model_provider TEXT,
  model_name TEXT,
  status TEXT DEFAULT 'PENDING',
  priority INTEGER DEFAULT 50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_type ON ai_tasks(task_type);

CREATE TABLE IF NOT EXISTS ai_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL UNIQUE,
  output_data TEXT,
  confidence REAL,
  tokens_used INTEGER,
  duration_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES ai_tasks(id) ON DELETE CASCADE
);

-- ============================================
-- MESSAGING
-- ============================================

CREATE TABLE IF NOT EXISTS message_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  subject TEXT,
  body_template TEXT NOT NULL,
  variables_json TEXT,
  channel TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  template_id INTEGER,
  status TEXT DEFAULT 'DRAFT',
  scheduled_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES message_templates(id)
);

CREATE TABLE IF NOT EXISTS message_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  opportunity_id INTEGER,
  message_body TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  priority INTEGER DEFAULT 50,
  scheduled_at DATETIME,
  sent_at DATETIME,
  delivered_at DATETIME,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES message_campaigns(id),
  FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
);

CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status);
CREATE INDEX IF NOT EXISTS idx_message_queue_scheduled ON message_queue(scheduled_at);

CREATE TABLE IF NOT EXISTS message_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (queue_id) REFERENCES message_queue(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS suppression_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE NOT NULL,
  reason TEXT,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  is_permanent BOOLEAN DEFAULT 0
);

-- ============================================
-- AUDIT & MONITORING
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_type TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics(metric_name, timestamp DESC);

-- ============================================
-- GEOGRAPHIC REGIONS
-- ============================================

CREATE TABLE IF NOT EXISTS geographic_regions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,
  parent_region_id INTEGER,
  center_lat REAL,
  center_lng REAL,
  radius_km REAL,
  opportunity_score REAL DEFAULT 0.5,
  result_density REAL DEFAULT 0,
  freshness_score REAL DEFAULT 0.5,
  validation_rate REAL DEFAULT 0.5,
  duplicate_rate REAL DEFAULT 0,
  commercial_quality REAL DEFAULT 0.5,
  mining_priority REAL DEFAULT 0.5,
  last_mined_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_region_id) REFERENCES geographic_regions(id)
);

CREATE INDEX IF NOT EXISTS idx_geographic_regions_type ON geographic_regions(type);
CREATE INDEX IF NOT EXISTS idx_geographic_regions_priority ON geographic_regions(mining_priority DESC);

-- ============================================
-- VIEWS
-- ============================================

CREATE VIEW IF NOT EXISTS view_recent_opportunities AS
SELECT 
  o.id,
  o.final_priority,
  o.opportunity_score,
  o.recency_score,
  a.title,
  a.price_normalized,
  a.location_city,
  a.location_state,
  a.discovered_at,
  v.brand_id,
  v.model_id,
  b.name as brand_name,
  m.name as model_name
FROM opportunities o
JOIN advertisements a ON o.advertisement_id = a.id
LEFT JOIN vehicles v ON a.vehicle_id = v.id
LEFT JOIN brands b ON v.brand_id = b.id
LEFT JOIN models m ON v.model_id = m.id
WHERE o.is_validated = 1
ORDER BY o.final_priority DESC, a.discovered_at DESC
LIMIT 100;

CREATE VIEW IF NOT EXISTS view_source_health AS
SELECT 
  s.id,
  s.name,
  s.type,
  s.is_active,
  s.priority,
  sh.health_score,
  sh.is_available,
  sh.response_time_ms,
  sh.parsing_success_rate,
  sh.result_volume,
  sh.duplicate_ratio,
  sh.checked_at
FROM sources s
LEFT JOIN (
  SELECT source_id, MAX(checked_at) as max_checked
  FROM source_health
  GROUP BY source_id
) latest ON s.id = latest.source_id
LEFT JOIN source_health sh ON s.id = sh.source_id AND sh.checked_at = latest.max_checked
ORDER BY s.priority DESC;

-- ============================================
-- INITIAL DATA
-- ============================================

INSERT INTO geographic_regions (name, type, center_lat, center_lng, radius_km, mining_priority) 
VALUES ('Xanxerê·´', 'city', -26.8747, -52.4089, 50, 100);

INSERT INTO geographic_regions (name, type, mining_priority) VALUES ('Santa Catarina', 'state', 50);
INSERT INTO geographic_regions (name, type, mining_priority) VALUES ('Rio Grande do Sul', 'state', 50);
INSERT INTO geographic_regions (name, type, mining_priority) VALUES ('Paraná··', 'state', 50);
INSERT INTO geographic_regions (name, type, mining_priority) VALUES ('Sã·£o Paulo', 'state', 40);
INSERT INTO geographic_regions (name, type, mining_priority) VALUES ('Brasil', 'country', 30);

INSERT INTO brands (name, normalized_name, synonyms_json) VALUES 
('Volvo', 'volvo', '["VOLVO", "volvo"]'),
('Scania', 'scania', '["SCANIA", "scania"]'),
('Mercedes-Benz', 'mercedes_benz', '["MERCEDES", "Mercedes", "MB", "mb"]'),
('Ford Cargo', 'ford_cargo', '["FORD", "Ford", "CARGO", "Cargo"]'),
('Iveco', 'iveco', '["IVECO", "iveco"]'),
('DAF', 'daf', '["DAF", "daf"]'),
('MAN', 'man', '["MAN", "man"]'),
('Volkswagen', 'volkswagen', '["VW", "vw", "VOLKSWAGEN", "Volkswagen"]'),
('Agrale', 'agrale', '["AGRALE", "Agrale"]'),
('International', 'international', '["INTERNATIONAL", "International"]');

INSERT INTO sources (name, type, base_url, priority, rate_limit_per_minute) VALUES
('Google Search', 'search_engine', 'https://www.google.com/search', 80, 30),
('Mercado Livre', 'marketplace', 'https://www.mercadolivre.com.br', 70, 60),
('OLX', 'classified', 'https://www.olx.com.br', 70, 60),
('Webmotors', 'marketplace', 'https://www.webmotors.com.br', 60, 60),
('Facebook Marketplace', 'marketplace', 'https://www.facebook.com/marketplace', 50, 30);

-- ============================================
-- MIGRATION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT UNIQUE NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (migration_name) VALUES ('initial_schema');
