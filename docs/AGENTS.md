# Diretrizes, Memória e Arquitetura do Projeto: ASSET INTELLIGENCE ENTERPRISE

> **MEMÓRIA DE LONGO PRAZO DO PROJETO - LEITURA OBRIGATÓRIA PARA A IA**
> Este arquivo e a suite de contexto (`PROJECT_CONTEXT.md`, `01_PROJECT_CONTEXT.md`, `02_DEVELOPMENT_RULES.md`, `03_PRODUCT_VISION.md`, `03_FEATURES.md`, `04_UX.md`, `05_DEVELOPMENT_RULES.md`, `06_AI_BEHAVIOR.md`, `ARCHITECTURE.md`, `FEATURES.md`) servem como a memória central e permanente do sistema. Consulte este inventário antes de sugerir ou implementar qualquer nova funcionalidade para não gastar tokens ou repetir ideias já criadas.

---

## 🎯 Visão do Produto & Princípio Máximo
- **Radar Nacional de Oportunidades Comerciais**: O ASSET INTELLIGENCE não é apenas um minerador ou disparador, é uma Plataforma SaaS Enterprise de Inteligência Comercial.
- **Princípio Máximo**: Cada nova funcionalidade deve responder: *"Esta função ajuda o usuário a fechar mais negócios?"*. Se a resposta for não- **UX Inteligente**: Menos botões e filtros manuais, mais automação e inteligência invisível por IA Gemini (`gemini-1.5-flash`).

---

## ⚡ Regras de Otimização de Tokens e Eficiência de Desenvolvimento

1. **Arquitetura Modular Mandatória**:
   - NUNCA adicione blocos extensos de código diretamente em `App.tsx`, `server.ts` ou `BackgroundAutoSender.tsx`.
   - Qualquer nova funcionalidade ou aba DEVE ser criada em um componente próprio dentro de `/src/components/` ou hook em `/src/hooks/`.
2. **Edições Cirúrgicas**:
   - Edite apenas o arquivo responsável pela funcionalidade solicitada. Isso evita ler e reescrever arquivos gigantes (como `App.tsx`), reduz o consumo de tokens e acelera o tempo de resposta em até 80%.
3. **Modelos de IA Padronizados**:
   - O modelo oficial para geração de textos, pitches de vendas e inteligência é o **`gemini-1.5-flash`**. NUNCA substitua por modelos descontinuados.
4. **Sem Repetição ou Código Duplicado**:
   - Antes de iniciar qualquer tarefa, verifique os módulos já existentes no inventário.
5. **Inicialização e Navegação Leve e Estável (App.tsx)**:
   - Toda e qualquer melhoria no sistema DEVE priorizar a leveza, estabilidade e rapidez do arquivo de inicialização (`App.tsx`). Importações diretas e carregamento resiliente garantem que o app abra instantaneamente sem erros de chunks dinâmicos ou travamentos na navegação.

---

## 📦 Inventário do Sistema (O QUE JÁ ESTÁ CONSTRUÍDO E ATIVO)

### 1. 🔍 Varredura, Mineração e Captura de Leads
- **Search Brain V2 (`smartSearchOrchestrator.ts`)**: Cérebro de busca comercial autônomo. Expansão automática de marcas, modelos e sinônimos (`expandSeedModelSynonyms`), radares de repasse e renovação de frota, inteligência temporal, descoberta contínua de termos em snippets (`discoverAndLearnNewTermsFromSnippets`) e deduplicação multi-critério sem alterar a UX.
- **Opportunity Engine V2 (`opportunityEngine.ts`)**: Transformação de anúncios em oportunidades. Radares automáticos de urgência extrema, ofertas abaixo da tabela/FIPE, reduções de preços no histórico (`hasPriceDrop`), desmobilização corporativa/renovação de frota, sinais empresariais e **Radar de Sinais Fracos em Tempo Real** (`detectWeakSignalsRadar` para encerramento de filial, desocupação de pátio, mudança de estado, inventários e dívidas).
- **Enriquecimento Preditivo de ICP por Visão Computacional (`visualIcpEnricher.ts`, `/api/ai/analyze-visual-icp`)**: Análise de imagens e meta-descrições via Gemini 1.5 Flash para mapear estado de conservação (Excelente, Regular, Desgastado, Sucata), marcas de frota e insígnias visuais antes da leitura de texto.
- **Deduplicação Cross-Regional Avançada (`leadMergerEngine.ts`)**: Consolidação de anúncios publicados pelo mesmo vendedor/frotista em múltiplos estados (`crossRegionalStates`, `isMultiStateSeller`), unificando histórico de preços e presencia regional.
- **Scraping & Mining Speed Accelerator Engine (`scrapingSpeedAccelerator.ts`)**: Concorrência adaptativa por latência, rotação de User-Agents e algoritmo anti-bloqueio com recuo exponencial.
- **Parallel Extraction Worker Pool V2 (`extractionWorkerManager.ts`)**: Processamento assíncrono não-bloqueante de snippets e extração em lotes de alta velocidade.
- **Descoberta Inteligente de Contatos (`deepContactDiscovery.ts`)**: Varredura em tempo real em background no Google, Maps, Site Oficial, Instagram, Facebook, LinkedIn e Receita Federal (CNPJ) para enriquecer anúncios sem telefone.
- **Cruzamento Automático Multi-Plataforma & Fusão (`leadMergerEngine.ts`)**: Unificação automática de anúncios do mesmo vendedor encontrados na OLX, Mercado Livre, Facebook, Google Maps e sites próprios em um cadastro único (`allPlatforms`, `allWebPageUrls`, `socialLinks`).
- **Monitor de Alterações de Anúncios (`leadMergerEngine.ts`)**: Rastreia alterações de preços (quedas de valor, "Abaixo da FIPE", "Repasse"), alterações de snippet e status do anúncio (`historyChanges`).
- **Score Comercial Unificado (0-100)**: Algoritmo dinâmico que pontua leads por valor de fechamento (WhatsApp verificado, empresa/CNPJ, e-mail, redes sociais, urgência e recência).
- **Eliminador de Lixo e Ruído Comercial**: Purga em tempo real de telefones inválidos/repetidos, anúncios finalizados, manuais em PDF, vagas de emprego e spam sem valor comercial.
- **Google Maps & Web Scanner**: Leitura geográfica regional e estadual (`GoogleMapsScanner.tsx`, `LeafletScannerMap.tsx`).
- **Motor de Busca Multi-Mecanismo**: Rotação entre motores de busca e user-agents (`searchEngines.ts`).
- **Inteligência de Palavras-Chave**: Gerenciador dinâmico de termos com aprendizado de desempenho (`keywordBrain.ts`, `KeywordManager.tsx`, `keywordIntelligenceEngine.ts`).
- **Extrator de Contatos & Validador**: Extração de telefones, e-mails, documentos (CPF/CNPJ) e triagem de tipo (`phoneExtractor.ts`).
- **Classificador e Qualificador por IA**: Análise automática de porte, intenção e scoring de conversão (`aiQualifier.ts`).

### 2. 💬 Automação WhatsApp e Disparo Inteligente
- **Cadence Pipeline Engine V2 (`cadenceEngine.ts`)**: Sequenciamento de abordagem em 3 dias (Dia 1 Pitch, Dia 2 Proposta, Dia 3 Fechamento/Repasse) com controle automático de agendamento e transições.
- **Disparador em Segundo Plano (`BackgroundAutoSender.tsx`)**: Fila de envios com delays humanizados, rotação de mensagens e proteção anti-bloqueio.
- **Conexão Baileys / WhatsApp (`whatsapp.ts`)**: Suporte a QR Code, verificação de conexão, reconexão automática e limpeza de memória.
- **Gerador de Pitches de Venda Gemini IA (`gemini-1.5-flash`)**: Criação de mensagens personalizadas e persuasivas por perfil de vendedor/comprador.
- **Fila e Anti-Spam (`queue.ts`)**: Controle de taxa de envio e agendamento de tarefas.

### 3. 📊 CRM, Kanban e Gestão de Vendas
- **Pipeline Kanban de Vendas CRM (`KanbanCrmBoard.tsx`)**: Organização visual dos leads nas etapas *Novo Lead*, *Em Contato*, *Em Negociação*, *Fechado/Ganho* e *Perdido*, com cálculo de valor em R$ em tempo real.
- **Agente Diretor Comercial IA V3.5 (`commercialDirectorAgent.ts`)**: Módulo de inteligência que analisa a carteira e gera briefings táticos diários com insights de lucro e priorização de fechamento.
- **Termômetro de Fechamento & Estratégia Tática (`AiCopilotNegotiationModal.tsx`)**: Análise preditiva de probabilidade de fechamento (0-100%) e definição de estratégia (Agressiva vs Diplomática) por lead.
- **Conversion & ROI Analytics Engine V2 (`conversionRoiEngine.ts`)**: Módulo de ROI % por palavra-chave, taxa de conversão e custo por lead em tempo real.
- **CRM Webhook Sync Engine V2 (`webhookSyncEngine.ts`)**: Integração em tempo real via JSON Webhooks com N8N, Make, Zapier, Pipedrive e RD Station.
- **Dossiê Executivo por IA (`ExecutiveDossierModal.tsx`)**: Análise tática de carteira por Gemini 1.5 Flash com poder de barganha, SWOT e faturamento esperado.
- **AI Copilot Negotiation Script Engine (`AiCopilotNegotiationModal.tsx`, `aiNegotiationCopilot.ts`)**: Geração em tempo real por Gemini 1.5 Flash de scripts para quebra de objeções de preço no WhatsApp.
- **Geo-Location Density Heatmap (`GeoDensityHeatmapModal.tsx`)**: Análise e mapa de densidade de frotas e ativos por estado e região do Brasil.
- **Calculadora de Frete & Margem Comercial (`FreightAndBrokerageCalculatorModal.tsx`)**: Cotação de frete por KM entre estados e comissão de intermediação.
- **Exportador Inteligente VCF & Excel (`SmartExcelExportModal.tsx`)**: Exportação em lote para agenda de celular/WhatsApp (.VCF) e planilhas Excel (.XLS).
- **Tabela Virtualizada de Alta Performance (`LeadTable.tsx`)**: Suporte a milhares de linhas usando `react-window` sem travamentos de tela.
- **Agendador de Follow-up (`LeadFollowUpScheduler.tsx`)**: Tarefas de acompanhamento com lembretes, recorrência e cadência de 3 dias.

### 4. ☁️ Dados, Backup e Segurança
- **Sistema de Cache Warming Estratégico (`cacheWarmupEngine.ts`)**: Armazenamento em `localStorage` contendo apenas os metadados essenciais dos primeiros 50 leads para tempo de abertura instantâneo (0ms), seguido de lazy loading do restante via SQLite e scroll infinito progressivo.
- **Sincronização Cloud & Firebase (`firebase.ts`)**: Autenticação de usuários e backup em tempo real no Firestore (`ai-studio-mineradordeconta-2d30a2b6-92d3-4794-89a3-a3753185e287`).
- **Guardião de Núcleo V3.5 (`systemProtectionService.ts`)**: Sistema de Snapshots que protege não apenas os leads, mas toda a arquitetura de ferramentas, prompts e configurações do sistema contra perdas.
- **Checkpoints de Backup Automático (`AutoBackupModal.tsx`, `DesktopSyncCard.tsx`)**: Salvamento automático a cada 100 leads.
- **Exportação Multi-Formato**: Downloads em CSV, Excel Inteligente (`SmartExcelExportModal.tsx`) e VCF de Contatos de Celular (`googleContacts.ts`).
- **Central de Segurança e Auditoria (`SecurityGuardModal.tsx`, `SecurityAccessGuard.tsx`)**: Proteção por PIN/senha e log de cópia/exportação.

### 5. 🛠️ Diagnóstico e Saúde do Sistema
- **Monitor de Saúde e Memória (`SystemHealthMonitorModal.tsx`)**: Diagnóstico em tempo real de RAM, vazamentos de memória e limpeza de caches.

---

## 🚀 Próximas Etapas no Roadmap de Inovação

1. **Otimização Continuada de Performance de Scraping**: Aprimoramentos de rotação de proxies e paralelismo para varreduras ultra-velozes.

