# 🏗️ ARCHITECTURE.md - ARQUITETURA DE SISTEMA ENTERPRISE

> **ASSET INTELLIGENCE - PLATAFORMA SAAS ENTERPRISE DE INTELIGÊNCIA COMERCIAL**
> Documentação técnica da arquitetura do sistema: estrutura de diretórios, fluxo de dados, motores de mineração, integrações de IA, camada de persistência, mecanismos de cache, gerenciamento de filas e rotas da API.

---

## 📁 1. ESTRUTURA DE PASTAS E MÓDULOS

```text
├── 01_PROJECT_CONTEXT.md          # Visão do Produto, Público e Identidade
├── 02_DEVELOPMENT_RULES.md        # Diretrizes e Convenções de Desenvolvimento
├── 03_PRODUCT_VISION.md           # Visão Estratégica e Filosofia de UX
├── 04_AI_BEHAVIOR.md              # Comportamento e Regras da IA Gemini
├── AGENTS.md                      # Memória do Agente IA e Inventário do Sistema
├── ARCHITECTURE.md                # Arquitetura Técnica do Sistema (Este documento)
├── PROJECT_CONTEXT.md             # Sumário Consolidado de Contexto do Projeto
├── package.json                   # Dependências e scripts de Build/Start
├── server.ts                      # Servidor backend Express (Rotas da API, Gemini e Webhook)
├── vite.config.ts                 # Configuração do bundler Vite
├── src/
│   ├── main.tsx                   # Ponto de entrada React SPA
│   ├── App.tsx                    # Componente Raiz (Navegação dos Portais)
│   ├── index.css                  # Estilos Globais Tailwind CSS
│   ├── types.ts                   # Tipos e Interfaces globais do sistema (Leads, Kanban, etc.)
│   ├── firebase.ts                # Inicialização do Firebase Firestore & Auth
│   ├── types/
│   │   └── keywordIntelligence.ts # Tipos do Cérebro de Termos, Nichos e Simulações
│   ├── components/                # Componentes Modulares UI
│   │   ├── KeywordManager.tsx     # Central de Inteligência de Termos (Orquestrador)
│   │   ├── keywordIntelligence/   # Submódulos da Central de Termos
│   │   │   ├── TermDatabaseTable.tsx       # Tabela Interativa e Histórico do Banco de Termos
│   │   │   ├── AiTermGeneratorTab.tsx      # Gerador Multimodo Gemini (9 Modos)
│   │   │   ├── NicheCatalogTab.tsx         # Catálogo de Nichos Nacionais B2B
│   │   │   ├── CombinatorialExpanderTab.tsx# Motor de Expansão Combinatória
│   │   │   ├── DiscoveryAndAntiNoiseTab.tsx# IA Descobridora e Filtro Anti-Ruído
│   │   │   ├── CrossScannerTab.tsx         # Motor de Cruzamento Simultâneo
│   │   │   ├── TrendsAndAnalyticsTab.tsx   # Gráficos de Tendência e Mapa Nacional
│   │   │   └── SimulatorAndLabTab.tsx      # Simulador Pré-Execução e Laboratório IA
│   │   ├── BackgroundAutoSender.tsx        # Disparador e Fila de Envio WhatsApp
│   │   ├── GoogleMapsScanner.tsx           # Varredura Geográfica por Raio e Região
│   │   ├── LeafletScannerMap.tsx           # Mapa Interativo com Pins de Leads
│   │   ├── KanbanCrmBoard.tsx              # Pipeline de Vendas CRM
│   │   ├── LeadTable.tsx                   # Tabela Virtualizada (react-window)
│   │   ├── SystemHealthMonitorModal.tsx    # Monitor de RAM, Diagnóstico e Memória
│   │   ├── AutoBackupModal.tsx             # Backup Automático e Checkpoints
│   │   ├── SecurityGuardModal.tsx          # Proteção por PIN/Senha e Log de Cópia
│   │   └── ...                             # DEMAIS COMPONENTES MODULARES
│   ├── hooks/                     # Hooks React Customizados
│   │   ├── useWhatsApp.ts         # Hook de Estado e Conexão WhatsApp
│   │   ├── useLeadSync.ts         # Hook de Sincronização em Tempo Real Firestore
│   │   └── ...
│   └── utils/                     # Algoritmos, Extratores e Motores de Dados
│       ├── smartSearchOrchestrator.ts   # Motor Orquestrador de Intenção Comercial V2 (Search Brain V2)
│       ├── opportunityEngine.ts         # Motor de Oportunidades (Radares de Urgência, Desconto, Frota, Expansão/Liquidação)
│       ├── leadMergerEngine.ts          # Motor de Unificação Cruzada, Score Comercial, Monitor de Alterações e Eliminador de Lixo
│       ├── deepContactDiscovery.ts      # Descoberta Inteligente de Contatos (Web, Maps, Socials, CNPJ)
│       ├── keywordIntelligenceEngine.ts # Algoritmo de Score, Nichos e Matriz Combinatória
│       ├── keywordBrain.ts              # Aprendizado de Performance e Reordenamento da Fila
│       ├── phoneExtractor.ts            # Extrator Regex de Telefones, WhatsApp e Validador DDD
│       ├── textProcessor.ts             # Normalização Semântica e Limpeza de Textos
│       ├── aiQualifier.ts               # Qualificação e Scoring Automático de Leads
│       ├── searchEngines.ts             # Crawlers, Rotação de User-Agents e Scraping
│       ├── backgroundRunner.ts          # Executor de Tarefas Assíncronas em Segundo Plano
│       ├── extractionWorkerManager.ts   # Gerenciador de Concorrência de Workers
│       ├── securityGuard.ts             # Criptografia, Hash e Validação de Acesso
│       └── backup.ts                    # Exportação/Importação e Checkpoints
```

---

## 🔄 2. FLUXO DE DADOS (FRONTEND → BACKEND → IA → PERSISTÊNCIA)

```text
[ Usuário no React (SPA) ]
          │
          ├──> 1. Dispara pesquisa de termo ou nicho comercial
          │
[ Frontend (Hooks / Components) ]
          │
          ├──> 2. Consulta Cache Local / LocalStorage (Verifica histórico)
          │
          ├──> 3. Envia requisição HTTP POST para a API Express (/server.ts)
          │
[ Backend Node.js (server.ts) ]
          │
          ├──> 4. Autentica e aplica Rate Limiting / Rotação de Headers
          │
          ├──> 5. Chamada para a IA Gemini (SDK oficial @google/genai)
          │        └── Modelo: gemini-1.5-flash (Análise, Qualificação, Pitches)
          │
          ├──> 6. Executa Crawler / Motor de Mineração (searchEngines.ts)
          │        └── Scraping seguro + Rotação de Proxies e User-Agents
          │
          ├──> 7. Processa Texto e Extrai Telefones (phoneExtractor.ts)
          │        └── Validação de DDDs e Verificação de WhatsApp Válido
          │
[ Retorno de Dados Otimizado ]
          │
          ├──> 8. Atualiza Estado React e Tabela Virtualizada (LeadTable.tsx)
          │
          └──> 9. Sincronização em Segundo Plano no Firestore (firebase.ts)
```

---

## ⚙️ 3. MOTORES DO SISTEMA

### 3.1. Motor de Mineração & Captura
- **Leitura Geográfica & Web**: Coleta anúncios, páginas públicas e mapas interativos por estado, cidade e bairro (`GoogleMapsScanner.tsx`, `LeafletScannerMap.tsx`).
- **Extração Regex de Alta Precisão**: Identifica telefones, WhatsApp, e-mails, CNPJ, CPF, nomes de proprietários e cargos (`phoneExtractor.ts`).
- **Validador de DDD e Operadora**: Confirma formato nacional brasileiro e regionaliza contatos capturados.

### 3.2. Motor de Inteligência de Termos (`keywordIntelligenceEngine.ts`)
- **Cálculo de Score Dinâmico (0 a 100)**: Pondera histórico de pesquisas, volume de leads minerados, proporção de WhatsApps válidos e taxa de conversão em vendas.
- **Expansor Combinatório**: Permuta automaticamente Marcas x Modelos x Intenções x Estados x DDDs.
- **Motor Cruzado Simultâneo**: Cruza perfil do vendedor (Particular, Revenda, Frotista) com intenção (Venda, Compra, Aluguel) e localização.

### 3.3. Search Brain V2 (`smartSearchOrchestrator.ts`)
- **Cérebro de Busca Comercial Autônomo**: Converte buscas semente simples em uma teia de variações de modelos, marcas, sinônimos (`expandSeedModelSynonyms`) e intenções comerciais.
- **Radares de Repasse e Renovação de Frota**: Detecta ativamente liquidações, encerramento de atividades, venda de ativos, trocas de frota e veículos abaixo da tabela FIPE.
- **Motor de Descoberta Automática de Novos Termos**: Analisa descrições de anúncios e snippets extraídos para identificar gírias, apelidos e novos modelos (`discoverAndLearnNewTermsFromSnippets`), alimentando continuamente o `keywordBrain.ts`.
- **Deduplicação Inteligente Multi-Critério & Ranking**: Unifica e filtra por Telefone, WhatsApp, URL, CNPJ e Similaridade Textual, reordenando a execução e priorizando as plataformas de maior conversão.

### 3.4. Motor de Unificação Cruzada, Score e Eliminador de Lixo (`leadMergerEngine.ts` & `deepContactDiscovery.ts`)
- **Cruzamento Automático Multi-Plataforma**: Unifica automaticamente registros do mesmo vendedor encontrados na OLX, Mercado Livre, Facebook, Google Maps e sites proprietários em um único cadastro (`allPlatforms`, `allWebPageUrls`, `socialLinks`).
- **Score Comercial Unificado (0 a 100)**: Pontuação dinâmica baseada na precisão e completude dos contatos (WhatsApp, empresa/CNPJ, e-mail, localização, redes sociais, urgência e recência do anúncio).
- **Monitor de Alterações de Anúncios**: Detecta alterações de preços (quedas de valor em R$, "Abaixo da FIPE", "Repasse"), mudanças em snippets/contexto ou encerramento de anúncios, registrando no log `historyChanges`.
- **Descoberta Inteligente de Contatos**: Se um anúncio ou empresa estiver sem telefone ou com dados incompletos, executa varreduras complementares automáticas no Google, Maps, Receita Federal (CNPJ) e redes sociais, complementando os campos sem duplicar contatos.
- **Eliminador de Lixo e Ruído Comercial**: Purga automaticamente números telefônicos inválidos/repetidos (ex: `00000000`), anúncios expirados, vagas de emprego, manuais PDF e ruídos sem valor comercial.

### 3.5. Opportunity Engine V2 (`opportunityEngine.ts`)
- **Radar de Urgência Extrema**: Extração automática de gatilhos de pressa e venda imediata ("motivo viagem", "preciso vender hoje", "liquidando", "desapego").
- **Radar Abaixo da FIPE / Desconto**: Análise de ofertas abaixo do valor de tabela e identificação de percentuais de margem comercial.
- **Radar de Queda de Preço**: Monitoramento contínuo de diminuições de valores nos anúncios (`hasPriceDrop`), gerando alertas e badges nos cadastros unificados.
- **Radar de Renovação de Frota**: Identificação automática de desmobilizações corporativas e trocas de frota de transportadoras (`isFleetRenovation`).
- **Radar Empresarial (Expansão vs Encerrando Atividades)**: Classificação de sinais contextuais entre expansão corporativa vs encerramento de atividades/liquidação.
- **Timeline Comercial & Histórico Temporal**: Rastreio do ciclo de vida dos anúncios (`firstSeenAt`, `lastSeenAt`, `updatesCount` e `historyChanges`).

---

## 🧠 4. INTELIGÊNCIA ARTIFICIAL (GEMINI 3.6 FLASH)

- **SDK**: `@google/genai` (SDK oficial server-side).
- **Modelo Padronizado**: `gemini-1.5-flash` (Respostas instantâneas com custo e consumo de tokens otimizados).
- **Aplicações de IA no Sistema**:
  1. **Qualificação Automática de Leads (`aiQualifier.ts`)**: Classifica o lead entre *Quente*, *Morno* ou *Frio*, infere porte da empresa e intenção de fechamento.
  2. **Gerador Multimodo de Termos (`AiTermGeneratorTab.tsx`)**: Opera em 9 modos (Conservador, Comercial, Long Tail, Regional, Similaridade, Competidores, Tendências, Livre e Nicho Profundo).
  3. **Gerador de Pitches Persuasivos**: Escreve abordagens comerciais sob medida para WhatsApp com base nos dados capturados.
  4. **IA Descobridora & Anti-Ruído (`DiscoveryAndAntiNoiseTab.tsx`)**: Detecta palavras emergentes em anúncios e bloqueia termos irrelevantes (PDFs, vagas, manuais).

---

## 💾 5. BANCO DE DADOS & PERSISTÊNCIA

- **Banco de Dados Principal**: Firebase Firestore (`ai-studio-mineradordeconta-2d30a2b6-92d3-4794-89a3-a3753185e287`).
- **Coleções do Firestore**:
  - `leads`: Armazena todos os leads minerados com status no pipeline Kanban.
  - `intelligent_terms`: Histórico contínuo de palavras-chave, execuções e conversões.
  - `negative_terms`: Banco de palavras bloqueadas pelo filtro anti-ruído.
  - `system_backups`: Checkpoints de segurança sincronizados na nuvem.
- **Estrutura de Fallback Local**: Sincronização em `localStorage` para navegação offline sem perda de estado.

---

## ⚡ 6. CACHE & PERFORMANCE

- **Cache de Termos e Consultas**: Armazena em memória os resultados de termos pesquisados recentemente para evitar requisições redundantes à IA ou aos motores de busca.
- **Tabela Virtualizada (`react-window`)**: Renderiza milhares de linhas na `LeadTable.tsx` mantendo 60 FPS e consumo mínimo de memória RAM.
- **Diagnóstico de Memória (`SystemHealthMonitorModal.tsx`)**: Libera objetos não utilizados e limpa caches periodicamente.

---

## 🚦 7. FILAS (QUEUES)

- **Fila de Mineração (`queue.ts`)**: Fila de palavras-chave com controle de execução para evitar sobrecarga ou bloqueios de IP.
- **Fila de Envio do WhatsApp (`BackgroundAutoSender.tsx`)**: Fila assíncrona de disparos com delays humanizados (ex: 15 a 45 segundos entre mensagens), mantendo proteção anti-bloqueio.

---

## 👷 8. WORKERS & SEGUNDO PLANO

- **Background Auto Runner (`backgroundRunner.ts`)**: Mantém tarefas de varredura executando em segundo plano enquanto o usuário navega por outras abas da plataforma.
- **Worker Manager (`extractionWorkerManager.ts`)**: Gerencia múltiplos threads para extração paralela de contatos e validação de dados em grandes lotes.

---

## 🕷️ 9. CRAWLERS & SCRAPING

- **Rotação de User-Agents (`searchEngines.ts`)**: Simula navegadores reais e dispositivos móveis para contornar bloqueios.
- **Extração Semântica**: Analisa estruturas HTML e dados estruturados para coletar dados relevantes de anúncios comerciais.
- **Respeito aos Limites de Taxa**: Pausas inteligentes e variação de tempo entre requisições.

---

## 🔌 10. ROTAS DA API (`server.ts`)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Verificação de status e integridade do servidor |
| `POST` | `/api/ai/keywords` | Geração inteligente de termos via Gemini 3.6 |
| `POST` | `/api/ai/niche-strategy` | Análise estratégica e plano de ação para nichos |
| `POST` | `/api/ai/qualify` | Qualificação e scoring automático de leads |
| `POST` | `/api/ai/pitch` | Geração de abordagem comercial e pitch de venda |
| `GET` | `/api/whatsapp/status` | Verifica estado da conexão WhatsApp |
| `POST` | `/api/whatsapp/send` | Envia mensagem individual ou em lote |
| `POST` | `/api/webhook/lead` | Webhook para integração com CRMs externos (N8N, Make, Pipedrive) |
| `POST` | `/api/export/excel` | Exportação Inteligente formatada em Excel/CSV |
