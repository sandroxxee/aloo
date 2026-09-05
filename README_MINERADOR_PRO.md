# MINERADOR PRO

## Plataforma Brasileira de Inteligê·ªncia de Oportunidades Comerciais

MINERADOR PRO é um sistema autô·´·nomo de mineraç·£o, validaç·£o e priorizaç·£o de oportunidades comerciais brasileiras, especializado em veí·´culos pesados (caminhõ·µ·es, carretas, ô ·nibus, má ·quinas agrí·´colas e de construç·£o).

---

## Visã·£o Geral

### Objetivo Principal

> Continuar descobrindo, coletando, validando, enriquecendo, classificando, pontuando, deduplicando e priorizando oportunidades comerciais reais de fontes p úblicas acessí·´veis.

### Domí·´nios de Atuaç·£o

- Caminhõ·µ·es e cavalos mecâ·´nicos
- Carretas e semi-reboques
- Ô ·nibus e veí·´culos comerciais
- Má ·quinas agrí·´colas e de construç·£o
- Peças, motores e componentes
- Serviços automotivos e oficinas
- Leilõ·µ·es e desmanches
- Frotas e revendas

---

## Arquitetura do Sistema

```
src/
├── core/
│   ├── database/          # Schema SQLite/PostgreSQL, conexã·£o, migrations
│   ├── config/            # Configuraç·µes do sistema
│   ├── auth/              # Autenticaç·£o e sessõ·µ·es
│   └── security/          # Segurança e proteç·£o
│
├── mining/
│   ├── sources/           # Adapters para fontes de dados
│   ├── geographic/        # Motor de expansã·£o geográ·´fica espiral
│   ├── pipeline/          # Pipeline completo de mineraç·£o
│   └── utils/             # Utilitá·´rios de mineraç·£o
│
├── intelligence/
│   ├── ai/                # AI Orchestrator e providers
│   ├── vehicle/           # Base de conhecimento de veí·´culos
│   └── scoring/           # Sistemas de scoring
│
├── messaging/
│   ├── WhatsAppAdapter.ts # Integraç·£o WhatsApp
│   └── TelegramAdapter.ts # Integraç·£o Telegram
│
├── cli/
│   └── commands.ts        # Comandos CLI
│
└── utils/
    └── SystemHealth.ts    # Monitoramento de saúde do sistema
```

---

## Pipeline de Dados

```
SOURCE → DISCOVERY → FETCH → EXTRACTION → RAW STORAGE
    ↓
NORMALIZATION → VALIDATION → ENTITY RESOLUTION → DEDUPLICATION
    ↓
ENRICHMENT → INTELLIGENCE → SCORING → DATABASE
    ↓
USER / AUTOMATION / MESSAGING
```

---

## Instalaç·£o

### Pré-requisitos

- Node.js 18+
- npm ou bun
- SQLite (embutido) ou PostgreSQL

### Passos

```bash
# 1. Instalar dependê·ªncias
npm install

# 2. Configurar variá·´veis de ambiente
cp .env.example .env
# Editar .env com suas chaves de API

# 3. Executar setup
npm run setup

# 4. Iniciar mineraç·£o
npm run start
```

---

## Comandos CLI

### `npm run setup`

Inicializa o banco de dados e executa migrations.

```
MINERADOR PRO - Setup

✓ Node.js version: v20.x.x

Initializing database...
✓ Database initialized

Running migrations...
✓ Migrations completed

Checking environment...
✓ DATABASE_URL is set
⚠ GEMINI_API_KEY is not set

✓ Setup completed!
```

### `npm run start`

Inicia o motor de mineraç·£o contí·´nuo.

```bash
npm run start
```

- Expansã·£o geográ·´fica a partir de Xanxerê·´-SC
- Mineraç·£o autô·´·noma e contí·´nua
- Validaç·£o e scoring em tempo real
- Persistê·ªncia de estado para recovery

### `npm run doctor`

Diagnó·´·stico completo do sistema.

```bash
npm run doctor
```

Verifica:
- Database
- Filesystem
- Queues
- Workers
- Sources
- AI Providers
- Messaging

### `npm run mine`

Executa um ciclo manual de mineraç·£o.

```bash
npm run mine
```

Ú· ´til para testes e debug.

### `npm run migrate`

Executa migrations pendentes do banco de dados.

```bash
npm run migrate
```

### `npm run worker`

Inicia o worker de background para processamento assí·´ncrono.

```bash
npm run worker
```

---

## Configuraç·£o

### Variá·´veis de Ambiente

```bash
# Database
DATABASE_URL=sqlite://./data/minerador_pro.db

# AI Providers (opcional)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

# Google Search (opcional)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_custom_search_engine_id

# Messaging
WHATSAPP_INSTANCE_NAME=minerador_pro
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Sistema
NODE_ENV=production
LOG_LEVEL=info
```

---

## Fontes de Dados

O sistema suporta m últiplas fontes atravé·´s de adapters:

- **Search Engines**: Google Search, Bing
- **Classifieds**: OLX, Mercado Livre, Webmotors
- **Marketplaces**: Facebook Marketplace
- **Directories**: Pá·´ginas amarelas, listas de empresas
- **RSS/Atom**: Feeds de sites especializados

Cada fonte implementa a interface `DataSource`:

```typescript
interface DataSource {
  discover(params): Promise<DiscoveryResult[]>;
  fetch(url): Promise<RawDocument>;
  parse(document): Promise<ExtractedRecord[]>;
  healthCheck(): Promise<SourceHealth>;
}
```

---

## Expansã·£o Geográ·´fica

O sistema utiliza expansã·£o em espiral a partir de **Xanxerê·´-SC**:

```
CENTER: Xanxerê·´-SC
  ↓
RING 1: Municí·´pios vizinhos (50km)
  ↓
RING 2: Regiã·£o (150km)
  ↓
RING 3: Santa Catarina
  ↓
RING 4: Sul do Brasil
  ↓
RING 5: Brasil
```

Cada regiã·£o recebe um **score de prioridade** baseado em:
- Densidade de resultados
- Taxa de validaç·£o
- Qualidade comercial
- Recê·ªncia
- Volume de duplicatas

---

## Validaç·£o e Anomalias

O sistema detecta automaticamente:

### Anomalias Crí·´ticas

- Preç·§os impossí·´veis (zero, negativo)
- Anos fora de faixa ( < 1970 ou > futuro)
- Telefones invá·´lidos
- Localizaç·µes inconsistentes

### Anomalias Suspeitas

- Descontos muito grandes (>70% abaixo da mé ·dia)
- Extraç·µes com baixa confiança
- Descriç·µ ·es inconsistentes
- Dados incompletos

Quando uma anomalia é detectada:

```
RAW VALUE
    ↓
ANOMALY DETECTED
    ↓
RE-EVALUATION (multi-pass)
    ↓
CROSS-SOURCE VALIDATION
    ↓
CONFIDENCE UPDATE
    ↓
ACCEPT / FLAG / REJECT
```

---

## Scoring de Oportunidades

Cada oportunidade recebe m últiplos scores:

```typescript
{
  dataConfidenceScore: 0.85,    // Qualidade dos dados
  opportunityScore: 0.72,       // Potencial comercial
  recencyScore: 0.95,           // Recê·ªncia
  commercialScore: 0.88,        // Intenç·£o comercial
  sellerConfidenceScore: 0.76,  // Credibilidade do vendedor
  sourceQualityScore: 0.80,     // Qualidade da fonte
  finalPriority: 0.82           // Prioridade final
}
```

**Prioridade final** = média ponderada dos scores

---

## Deduplicaç·£o

O sistema usa m últiplos sinais para detectar duplicatas:

- URL normalizada
- Tí·´tulo similar (fuzzy matching)
- Preç·§o dentro de 5%
- Localizaç·£o (cidade/estado)
- Telefone normalizado
- Hash de conte údo

Duplicatas confirmadas sã·£o marcadas e nã·£o aparecem nos resultados.

---

## Mensageria

### WhatsApp

Adapter para Evolution API ou similares:

- Gerenciamento de sessã·£o
- Fila de mensagens
- Supressã·£o (opt-out)
- Retry com backoff

### Telegram

Bot nativo via Telegram Bot API:

- Envio em batch
- Rate limiting automá·´tico
- Templates personalizá·´veis

---

## Seguranç·§a

### Autenticaç·£o

- Password hashing com bcrypt/Argon2id
- Sessõ·µ·es seguras com expiraç·£o
- CSRF protection
- Brute-force protection

### Autorizaç·£o

- Roles: ADMIN, OPERATOR, VIEWER
- Permissõ·µ·es server-side
- Audit logs de açõ·µ·es sensí·´veis

### Proteç·£o de Dados

- Parameterized queries (SQL injection protection)
- Secrets em environment variables
- Logs sem credenciais
- Rate limiting por fonte

---

## Monitoramento

### System Health

O comando `npm run doctor` verifica:

- Database connectivity
- Filesystem permissions
- Queue depth
- Worker responsiveness
- Source availability
- AI provider status
- Messaging session state

### Mé ·tricas

O sistema registra:

- CPU e memory usage
- Queue depth
- Worker utilization
- Database latency
- Source latency
- Active/failed jobs
- Retry volume

---

## Recovery

O sistema é projetado para recovery automá·´tico:

### Apó·´·s Crash

1. Estado é persistido no banco
2. Filas sã·£o durá·´veis
3. Jobs em progresso sã·£o retomados
4. Sessõ·µ· ·es de messaging sã·£o restauradas

### Apó·´·s Reinicio

```bash
npm run start
```

O sistema:
- Carrega estado anterior
- Verifica saúde das fontes
- Retoma mineraç·£o de onde parou
- Nã·£o perde dados processados

---

## Pró·´·ximos Passos

### Em Desenvolvimento

- [ ] Frontend operacional
- [ ] Dashboard de oportunidades
- [ ] Configuraç·£o de fontes via UI
- [ ] Templates de mensagens visuais
- [ ] Relató·´·rios e aná·´lises
- [ ] Exportaç·£o de dados
- [ ] API REST

### Roadmap

1. **Fase 1**: Core de mineraç·£o (concluí·´do)
2. **Fase 2**: Validaç·£o e scoring (concluí·´do)
3. **Fase 3**: Messaging (concluí·´do)
4. **Fase 4**: Frontend operacional (em andamento)
5. **Fase 5**: Aná·´lises e relató·´·rios (planejado)

---

## Licenç·§a

Projeto privado - Todos os direitos reservados

---

## Suporte

Para d úvidas ou problemas, abra uma issue no repositó·´·rio.
