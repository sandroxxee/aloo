# MAPA COMPLETO DO SISTEMA: ASSET INTELLIGENCE ENTERPRISE

> **DOCUMENTO DE REFERÊNCIA DE ARQUITETURA SÊNIOR**
> Este documento mapeia de forma exaustiva e estruturada todos os endpoints de API do backend, a árvore de telas, abas e modais do frontend, as matrizes de integrações e webhooks, o fluxo do ciclo de vida do lead e o dicionário de mensagens e alertas críticos do Asset Intelligence Enterprise.

---

## 1. Mapa de Rotas do Backend (API Endpoints)

O backend do Asset Intelligence é construído sobre o **Express (Node.js)** em TypeScript. A seguir estão listados todos os endpoints HTTP ativos mapeados do arquivo `server.ts` e de seus submódulos de serviço.

### A. Automação de WhatsApp (Nativo Baileys)
*Todos os endpoints abaixo estão montados sob o prefixo `/api/whatsapp/native`.*

| Método | Endpoint | Parâmetros de Entrada | Lógica de Negócio / Serviço | Tipo de Retorno |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/pool/config` | *Nenhum* | Retorna estatísticas de uso de memória, status da fila de mensagens, quantidade de conexões ativas e tempo de ociosidade antes do Graceful Shutdown. | `JSON { success: true, idleTimeoutMinutes, activeConnections, queueLength, totalMessagesSent, memoryUsageMB, lastQueueProcessTime, lastActivityTime }` |
| **POST** | `/pool/config` | `idleTimeoutMinutes` (Body, number) | Permite alterar o tempo de ociosidade da conexão ativa antes de encerrar o socket para poupar recursos em nuvem. | `JSON { success: true, idleTimeoutMinutes }` |
| **POST** | `/logout` | *Nenhum* | Encerra a conexão WebSocket com os servidores do WhatsApp, exclui as credenciais da pasta `auth_info_baileys` e reseta o status do motor. | `JSON { success: true, message: string }` |
| **POST** | `/restart` | *Nenhum* | Interrompe o socket atual de forma segura, limpa pastas temporárias de autenticação quebrada e reinicia o processo de escuta para gerar um QR Code limpo. | `JSON { success: true, message: string }` |
| **GET** | `/watchdog/status` | *Nenhum* | Retorna o status operacional do Watchdog em segundo plano, informando se o verificador está ligado, o intervalo e falhas consecutivas. | `JSON { success: true, enabled, intervalMs, lastCheck, isManualLogout, consecutiveFailures }` |
| **POST** | `/watchdog/config` | `enabled` (boolean), `intervalMs` (number) | Atualiza o agendador de autoverificação de conexões do WhatsApp, alterando se o monitoramento está ativo e o intervalo de teste. | `JSON { success: true, enabled, intervalMs }` |
| **POST** | `/whatsappNumbers/zap` | `numbers` (Body, string[]) | Recebe uma lista de telefones brutos e os resolve em JIDs (WhatsApp IDs) diretamente consultando o socket do Baileys conectado. | `JSON Array [{ jid: string, lid: string, exists: true }]` |
| **POST** | `/ai-heal` | *Nenhum* | Executa o plano de auto-cura profunda. Lê os últimos 15 logs do Baileys e os envia ao Gemini 1.5 Flash para diagnosticar a causa de desconexões, retornando ações de correção recomendadas. | `JSON { success: true, diagnostics: string, actionTaken: string }` |
| **POST** | `/send` | `phone`, `message`, `mediaUrl`, `buttons`, `simulateTyping`, `typingDelay`, `priority` (Body) | Enfileira ou envia uma mensagem customizada (texto, imagem, vídeo ou áudio PTT) simulando o comportamento de digitação humana com delays progressivos. | `JSON { success: true, messageId: string }` |
| **GET** | `/priority-settings` | *Nenhum* | Obtém as regras de priorização de envio de campanhas (se envia leads novos, responde perguntas, confirmações) e o delay inteligente anti-ban. | `JSON { newLeads, questions, appointments, objections, smartDelay }` |
| **POST** | `/priority-settings` | `newLeads`, `questions`, `appointments`, `objections`, `smartDelay` (Body) | Salva as preferências do motor de prioridade e atraso inteligente anti-spam. | `JSON { success: true, settings }` |

### B. Controle de Disparos em Massa (Fila de Campanha)
*Todos os endpoints abaixo estão montados sob o prefixo `/api/whatsapp/native/queue`.*

| Método | Endpoint | Parâmetros de Entrada | Lógica de Negócio / Serviço | Tipo de Retorno |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/start` | `leads`, `template`, `messageType`, `mediaUrl`, `minDelay`, `maxDelay`, `cooldownFreq`, `cooldownDuration`, `gatewayConfig`, `buttons`, `isPTT` (Body) | Recebe uma lista de leads e as configurações de delay, enfileira o disparo em massa, define o estado operacional como `running` e processa o primeiro lote com jitter aleatório. | `JSON { success: true, count: number, status: string }` |
| **POST** | `/pause` | *Nenhum* | Pausa temporariamente os disparos da fila em massa, parando os timers de envio e guardando o índice atual. | `JSON { success: true, status: 'paused' }` |
| **POST** | `/resume` | *Nenhum* | Retoma o envio em massa a partir do último índice processado na fila. | `JSON { success: true, status: 'running' }` |
| **POST** | `/cancel` | *Nenhum* | Cancela definitivamente a campanha ativa, zera o índice de progresso, esvazia a lista de pendentes e atualiza o estado para `idle`. | `JSON { success: true, status: 'idle' }` |
| **POST** | `/gateway-config` | `gatewayConfig` (Body) | Altera e persiste as configurações do gateway de envio (Se nativo, Evolution, Z-API ou Oficial). | `JSON { success: true }` |
| **GET** | `/status` | *Nenhum* | Retorna o andamento em tempo real do disparo em massa, índice atual, total enviado, tempo para o próximo disparo e relatórios individuais. | `JSON { success: true, status, total, currentIndex, sentCount, cooldownEnd, nextRunTime, reports: [] }` |
| **GET** | `/export` | *Nenhum* | Gera e retorna um arquivo de download CSV formatado em `UTF-8` contendo o relatório de entrega das mensagens de campanha (Lead, Telefone, Status, Data/Hora). | `CSV File (relatorio_envios_massa.csv)` |

### C. Inteligência Artificial (Integração Gemini & LLMs)
*Todos os endpoints abaixo estão montados sob o prefixo `/api`.*

| Método | Endpoint | Parâmetros de Entrada | Lógica de Negócio / Serviço | Tipo de Retorno |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/ai/niche-strategy` | `niche` (Body, string) | Recebe um nicho comercial (ex: "caminhões") e usa o Gemini 1.5 Flash para gerar dados demográficos, locais ideais de captação, termos de busca e uma estratégia de abordagem. | `JSON { success: true, strategy: { audienceLocations, adPatterns, suggestedKeywords, strategySummary } }` |
| **POST** | `/api/ai/analyze-conversions` | `recentLeads`, `currentKeywords` (Body) | Analisa uma amostra de leads recentes capturados e sugere 3 novas palavras-chave de alta conversão para expandir as buscas do usuário. | `JSON { success: true, insight: string, newKeywords: Array }` |
| **POST** | `/api/ai/auto-enhance-keywords` | `query`, `rawSnippets`, `existingKeywords`, `hasResults`, `zeroResultCount` (Body) | Analisa o resultado de termos com 0 resultados ou bem-sucedidos para otimizar ou substituir palavras-chave na fila de varredura ativa. | `JSON { success: true, hasResults, flagForRemoval, reason, newKeywords }` |
| **POST** | `/api/ai/cross-scan-keywords`| `keywords`, `truckModels`, `partsCategories`, `targetUF` (Body) | Realiza um cruzamento matricial entre modelos de veículos e categorias de peças eliminando duplicatas exatas ou redundâncias fonéticas por IA. | `JSON { success: true, optimizedKeywords, removedKeywords, matrixCrossCount, summary }` |
| **POST** | `/api/ai/pitch` | `phone`, `name`, `intent`, `item`, `price`, `location`, `snippet`, `tone` (Body)| Cria um script persuasivo personalizado para WhatsApp baseado na ficha do anúncio minerado e no tom selecionado. | `JSON { success: true, pitchText, suggestedFollowUp, leadQualityScore, qualityReason }` |
| **POST** | `/api/ai/sentiment` | `lead` (Body) | Classifica o sentimento do lead ("interesse", "hesitacao", "desinteresse") a partir do snippet textual do anúncio. | `JSON { success: true, sentiment, reason }` |
| **POST** | `/api/ai/profile` | `lead` OU `leads` (Body) | Recebe um lead (ou lote de leads) e analisa o snippet para extrair de forma estruturada: Nome, Localização Real (Cidade/UF), Razão Social e Tipo de Vendedor (Frotista, Desmanche, Lojista). | `JSON { success: true, profile: { name, sellerFullName, city, stateUf, companyName, sellerType, aiSummary } }` |
| **POST** | `/api/ai/auto-respond` | `lead`, `replyText`, `tone` (Body) | Analisa a mensagem recebida pelo lead no WhatsApp e cria uma auto-resposta com base no tom e sentimento detectado. | `JSON { success: true, sentiment, reason, suggestedReply }` |
| **POST** | `/api/ai/reformulate` | `query`, `reason` (Body) | Cria novas buscas alternativas quando o termo atual falha por bloqueio ou ausência de indexação. | `JSON { success: true, alternatives: string[] }` |
| **POST** | `/api/ai/chat` | `messages` (Body, array) | Chat Assistant geral com busca de Grounding ativa. O Gemini acessa a web em tempo real para pesquisar preços de caminhões, FIPE ou regulamentos de trânsito. | `JSON { success: true, text: string, sources: [] }` |
| **POST** | `/api/ai/test-key` | `apiKey` (Body, string) | Testa e valida se a chave Google AI Studio informada pelo usuário é válida e ativa a cota Pro de alta velocidade. | `JSON { success: true, message: string, tier: string }` |
| **POST** | `/api/ai/lead-audit` | `lead` (Body) | Avalia a atratividade de mercado de um lead, estimando preço médio da FIPE, margem de arbitragem comercial e comissão estimada. | `JSON { success: true, fipeEstimate, arbitrageMarginPercent, estimatedCommission, opportunityScore, opportunityBadge, talkingPoints: [], customPitch }` |
| **POST** | `/api/ai/portfolio-dossier` | `leads` (Body) | Compila um Dossiê Executivo SWOT completo sobre a carteira de leads atual do usuário, estimando o valor global do estoque e estratégias de venda. | `JSON { success: true, dossier: { totalMappedValue, leadListCommercialValue, topDemandRegions, topCategories, monetizationStrategies, executiveSummary } }` |
| **POST** | `/api/ai/qualify-lead` | `snippet`, `item`, `price`, `ddd`, `location` (Body) | Qualifica o lead e gera um badge ("Lead Quente", "Frotista") com base na urgência deduzida no texto. | `JSON { success: true, result: { score, qualificationBadge, vehicleSpecs, dealTier, summary } }` |
| **POST** | `/api/ai/find-buyers-pitch` | `leadsCount`, `niche`, `targetCity` (Body) | Gera scripts persuasivos para oferecer e vender um lote de leads minerados para lojistas locais do nicho. | `JSON { success: true, pitch: string }` |
| **POST** | `/api/ai/simulate-places` | `targetCity`, `niche` (Body) | Gera 4 empresas fictícias porém altamente contextualizadas na região para simulação de venda de leads. | `JSON { success: true, companies: Array }` |
| **POST** | `/api/ai/handle-objection` | `objection`, `buyerName`, `niche` (Body) | Cria respostas rápidas e contornos de objeção em WhatsApp para vendas corporativas. | `JSON { success: true, response: string }` |
| **POST** | `/api/ai/generate` | `prompt`, `model` (Body) | Endpoint genérico para interagir diretamente com o Gemini 1.5 Flash. | `JSON { success: true, text: string }` |
| **POST** | `/api/ai/commercial-briefing`| `leads` (Body) | Analisa a lista de leads do usuário e fornece insights táticos diários ordenados por maior chance de lucro. | `JSON { success: true, insights: Array }` |

### D. Motores de Mineração & Crawling (Scrapers & Proxies)
*Todos os endpoints abaixo estão montados sob o prefixo `/api`.*

| Método | Endpoint | Parâmetros de Entrada | Lógica de Negócio / Serviço | Tipo de Retorno |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/search` | `query`, `searchDepth`, `offset`, `engineMode`, `filterConfig` (Body) | Rastreia de forma concorrente em múltiplos buscadores (Yahoo, Bing, DuckDuckGo, Mojeek) juntamente com Gemini Search Grounding. Conta com roteamento de proxies e possui um gerador OSINT Fallback caso os motores principais bloqueiem o tráfego. | `JSON { success: true, sourceEngine, rawContent, searchDepth, offset, duration }` |
| **POST** | `/scrape/portal` ou `/proxy`| `url` (Body, string) | Proxy para requisitar o HTML de páginas de portais de anúncios diretamente pelo servidor para bypass de CORS do navegador. | `JSON { success: true, content: string, cached: boolean }` |
| **POST** | `/hunter/search` | `query` (Body, string) | Motor exclusivo do Hunter IA. Busca anúncios de repasse nas regiões sul e sudeste, extraindo preços, contatos e detalhes técnicos para a grade rápida. | `JSON { success: true, engine, query, count, results: [] }` |
| **POST** | `/instagram/scan` | `profile` (Body, string) | Efetua buscas profundas no Google Grounding sobre o perfil do Instagram, extraindo dados de bio, contatos, posts e números deixados em comentários por interessados. | `JSON { success: true, profile: {}, posts: [] }` |
| **POST** | `/ads/scan` | `keyword` (Body, string) | Varre classificados e posts patrocinados associados à palavra-chave para extrair telefones do mercado rodoviário. | `JSON { success: true, ads: [] }` |
| **POST** | `/social/scan` | `targetType`, `keyword` (Body) | Busca leads qualificados dentro de páginas públicas e perfis de vendas do Facebook e do Instagram. | `JSON { success: true, results: [] }` |

### E. Gateways Externos & Integrações de Mensageria
*Endpoints de controle de canais e mensageria integrados.*

| Método | Endpoint | Parâmetros de Entrada | Lógica de Negócio / Serviço | Tipo de Retorno |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/whatsapp/send-cloud` | `phone`, `name`, `message`, `messageType`, `mediaUrl`, `gatewayConfig` (Body) | Envia mensagens em nuvem roteando a requisição para Evolution API, Z-API ou API Oficial de Nuvem, gerenciando os cabeçalhos de autenticação de forma invisível. | `JSON { success: true, gateway, messageId, timestamp, log }` |
| **POST** | `/api/email/dispatch` | `to`, `subject`, `textBody`, `htmlBody`, `providerConfig` (Body) | Despacha e-mails comerciais em lote ou individuais usando as APIs gratuitas da Resend, Brevo ou Webhook de disparo externo. | `JSON { success: true, message: string }` |
| **POST** | `/api/sms/dispatch` | `phone`, `message`, `provider`, `providerConfig` (Body) | Envia SMS instantâneos por meio do SMSDev Brasil ou de gateway Android configurado no painel. | `JSON { success: true, message: string }` |
| **POST** | `/api/webhook/dispatch` | `lead`, `eventType`, `overrideConfig` (Body) | Envia as informações completas do lead para fluxos integrados de CRM externos (N8N, Make, Zapier, Pipedrive). | `JSON { success: true, status, log }` |

---

## 2. Mapa de Telas, Abas e Modais do Frontend

A interface do Asset Intelligence Enterprise é desenvolvida em **React 18** e estilizada com **Tailwind CSS**. É baseada em um layout moderno, de painel único fluido, que responde de forma ágil com transições animadas (`motion` da biblioteca `motion/react`).

```
[ASSET INTELLIGENCE DASHBOARD COCKPIT]
 ├── Cabeçalho Centralizado (Logo, Versão, Status WhatsApp, Conexão Cloud, Botões de Monitoramento)
 ├── Cartões Métricos Superiores (Total Leads, Leads Quentes, Respostas Recebidas, ROI Comercial)
 ├── Menu de Navegação por Abas (Tabs)
 │    ├── Aba 📊 Painel Geral & Busca (Grade de Leads Virtualizada, Painel de Console de Logs em Tempo Real)
 │    ├── Aba 🔍 Varredura Avançada (Multimotores, Filtros Regionais por DDD/UF, Scheduler de Cron Jobs)
 │    ├── Aba 🧠 Cérebro de Busca (Word Bank, Cross Scanner de Peças, Trends de Mercado, Dossiê de Nichos)
 │    ├── Aba 💬 Automação WhatsApp (Conexão QR Code, Anti-Block humanizado, Autorespostas por IA, Campanhas)
 │    ├── Aba 🎯 Hunter IA (Varredor Autônomo B2B, Radar de Repasse de Frotas de Caminhões)
 │    ├── Aba 🤝 CRM & Kanban (Pipeline de Vendas, Funil Financeiro, Diretor Comercial Tático IA)
 │    └── Aba ⚙️ Configurações (Chaves de API, Webhooks, Senha do Guardião, Logs de Sincronização)
 └── Modais de Diálogo Flutuantes (Interação sob Demanda)
```

### A. Detalhamento das Abas Principais

1. **Painel Geral & Varredura (`App.tsx`)**:
   - **Propósito**: Cockpit central do sistema. Une a barra de busca imediata de portais ao console de atividades e à tabela principal.
   - **Dados que consome**: Consome o estado local `leads` (lista virtualizada com `react-window` para alto desempenho), status da conexão ativa do WhatsApp e logs de mineração em tempo real.
2. **Varredura Avançada & Filtros (`App.tsx` + `GoogleMapsScanner.tsx`)**:
   - **Propósito**: Concentra as configurações de segmentação. Permite escolher o motor (OLX, DuckDuckGo, Social, Specialized), definir estados do Brasil por siglas e ativar o Modo Deep Navigation.
   - **Dados que consome**: Lista de DDDs nacionais, estados brasileiros, configurações de filtros avançados (`SearchFilterConfig`).
3. **CRM Kanban Board (`KanbanCrmBoard.tsx`)**:
   - **Propósito**: Pipeline de vendas visual. Permite arrastar os leads capturados entre as colunas (*Novo Lead, Em Contato, Negociação, Fechado/Ganho, Perdido*) com cálculo de receita total acumulada em tempo real.
   - **Dados que consome**: Estado de CRM sincronizado com o Firestore/Local, lista de leads e valores médios de comissão por veículo.
4. **Cérebro de Palavras-Chave (Keyword Brain - `KeywordManager.tsx`)**:
   - **Propósito**: Módulo de IA com 8 sub-abas para pesquisa tática:
     - *Niche Catalog*: Modelos prontos de frotas pesadas.
     - *Cross Scanner*: Combinação matricial automatizada (ex: "Scania" x "Câmbio ZF").
     - *Trends*: Análise de demanda comercial de peças.
     - *Discovery*: Detector de ruído e purga de lixo.
   - **Dados que consome**: API `/api/ai/cross-scan-keywords`, tabela interna de nichos e banco local de termos.
5. **Automação WhatsApp (`WhatsAppConfigManager.tsx`)**:
   - **Propósito**: Centraliza a conexão Baileys nativa, exibição do QR Code de sincronização, regras de anti-banimento, velocidade de digitação e histórico de logs do Bot de respostas automáticas.
   - **Dados que consome**: APIs de status de conexão, logs websocket de tempo real, fila em massa `/api/whatsapp/native/queue/status`.
6. **Hunter IA (`HunterIaModule.tsx`)**:
   - **Propósito**: Módulo inteligente automatizado para revenda e repasse de frotas de caminhões. Varre ofertas urgentes e as compara com a Tabela FIPE de forma autônoma.
   - **Dados que consome**: Endpoint `/api/hunter/search` e banco de referências FIPE.

### B. Modals e Diálogos Táticos

*   **`AiCopilotNegotiationModal`**:
    *   *Propósito*: Abre um copiloto de negociações para o lead selecionado. Gera scripts de WhatsApp para contornar objeções ("tá caro", "tá longe", "precisa financiar") gerados pelo Gemini.
    *   *Dados que consome*: Ficha completa do lead, mensagens recentes do histórico do WhatsApp.
*   **`ExecutiveDossierModal`**:
    *   *Propósito*: Gera um dossiê executivo SWOT sobre a carteira atual do usuário, informando liquidez do inventário e comissões potenciais acumuladas.
    *   *Dados que consome*: Toda a lista de leads ativos do painel.
*   **`GeoDensityHeatmapModal`**:
    *   *Propósito*: Exibe um mapa geográfico do Brasil (via Leaflet/D3) pintando os estados com maior concentração de ativos pesados e caminhões localizados na varredura.
    *   *Dados que consome*: Lista de leads e suas coordenadas extraídas baseadas em DDD e Cidade.
*   **`FreightAndBrokerageCalculatorModal`**:
    *   *Propósito*: Calculadora de logística integrada para cotação de fretes por KM e taxas de corretagem comercial de intermediação.
    *   *Dados que consome*: Origem, Destino e comissão negociada.
*   **`SecurityGuardModal` & `SecurityAccessGuard`**:
    *   *Propósito*: Bloqueia telas críticas, solicita PIN de segurança do administrador e registra logs de cópia e exportação não autorizados (Anti-Vazamento).
    *   *Dados que consome*: Senha armazenada e histórico de logs de segurança locais.
*   **`SystemHealthMonitorModal`**:
    *   *Propósito*: Exibe o diagnóstico de desempenho do navegador, consumo de memória RAM, vazamento de memória em eventos e possui limpador manual de cache do sistema.
    *   *Dados que consome*: APIs nativas `performance.memory` do navegador.

---

## 3. Matriz de Integrações e Fluxo de Dados

A arquitetura do Asset Intelligence é projetada para ser altamente interoperável e resiliente, integrando-se nativamente com serviços líderes de mercado.

```
       [PORTAIS DE BUSCA]               [GOOGLE MAPS & WEB]
               │                                 │
               ▼                                 ▼
   ┌───────────────────────────────────────────────────────────┐
   │                    BUSCA MULTI-MECANISMO                  │
   │               (Crawlers Locais + Grounding IA)            │
   └─────────────────────────────┬─────────────────────────────┘
                                 ▼
   ┌───────────────────────────────────────────────────────────┐
   │                     LeadMergerEngine                      │
   │           (Filtro de Lixo, Unificação & Deduplicação)     │
   └─────────────────────────────┬─────────────────────────────┘
                                 ▼
   ┌───────────────────────────────────────────────────────────┐
   │                      GEMINI 1.5 FLASH                     │
   │          (Auditoria FIPE, Classificação & Perfil B2B)     │
   └──────────────────────┬──────────────┬─────────────────────┘
                          │              │
                          ▼              ▼
           ┌──────────────────────┐┌───────────────────────────┐
           │      CLOUDSYNC       ││         CRM SYNC          │
           │ (Firestore / Auth)   ││ (Webhooks n8n/Make/Zapier)│
           └──────────────────────┘└───────────────────────────┘
```

### A. Matriz de Serviços Externos

| Serviço | Tipo | Propósito | Configuração |
| :--- | :--- | :--- | :--- |
| **Google GenAI SDK** | API (Inteligência) | Processamento de linguagem natural, extração de contatos, classificação B2B de perfis e geração de estratégias comerciais. | Variável de ambiente `GEMINI_API_KEY` ou chave Pro informada no painel de usuário. |
| **Baileys (Native WASocket)** | Protocolo (WhatsApp) | Conecta-se diretamente ao WhatsApp via leitura de QR Code, permitindo verificação de conexões ativas, envio de mensagens e acompanhamento de respostas. | Local, mantido na pasta `/auth_info_baileys`. |
| **Evolution API / Z-API** | API (WhatsApp Cloud) | Alternativa para disparo em massa em nuvem sem depender do celular ativo no navegador. | Configurado sob demanda no gateway com URL e API Key do painel. |
| **Resend & Brevo** | API (E-mail) | Disparo automático de e-mails de acompanhamento de campanhas direto do backend. | Variáveis `RESEND_API_KEY` ou `BREVO_API_KEY`. |
| **Firebase Firestore** | Banco de Dados / Cloud | Sincronização em tempo real de leads, configurações e histórico do Kanban de forma resiliente contra limpezas de cache de navegador. | Blueprint Firebase configurado via plataforma. |
| **CRM Webhook Sync** | Gateway de Saída | Dispara pacotes JSON com leads qualificados quente para canais externos como Make, Discord, RD Station e N8N. | Configurado com URLs de webhook no menu de configurações do sistema. |

### B. Ciclo de Vida do Lead (Data Lifecycle)

1. **Ingressão e Mineração**:
   - Uma busca por termo (ex: "vendo volvo fh 540") é iniciada.
   - O sistema dispara consultas simultâneas aos buscadores através da API `/api/search` combinadas ao Gemini Search Grounding.
   - Caso haja falhas de rede ou bloqueio de robôs (Anti-Bot), o motor ativa a **Rede OSINT Resiliente** para gerar leads realistas contextualizados na categoria do usuário.
2. **Filtragem de Ruído e Unificação (`leadMergerEngine.ts`)**:
   - Os leads coletados em formato bruto passam pelo sanitizador e validador de telefones (`phoneExtractor.ts`).
   - Telefones inválidos, fixos convencionais não marcados como comerciais ou spans são sumariamente expurgados.
   - Se um mesmo vendedor anunciou em portais diferentes (ex: OLX e Mercado Livre), o `leadMergerEngine` unifica as ofertas em um único lead, anexando todas as URLs de origem.
3. **Qualificação e Auditoria de IA**:
   - O lead passa pelo endpoint `/api/ai/profile` e `/api/ai/lead-audit`.
   - O perfil é classificado (Particular vs Concessionária vs Desmanche).
   - O preço anunciado é comparado à média de mercado da Tabela FIPE por IA, gerando a margem de arbitragem comercial e o Score Comercial Único (0-100).
4. **Armazenamento e Sincronização**:
   - O lead é persistido na tabela virtualizada do frontend e enviado para backup no Firestore através do `firebase.ts` se a conta estiver ativa.
   - O **Guardião de Núcleo (`systemProtectionService.ts`)** cria pontos de salvamento automático (Checkpoints) locais a cada 100 leads novos adicionados.
5. **Ação Comercial & Envio**:
   - O usuário arrasta o lead para "Em Contato" no Kanban ou inicia uma campanha em massa.
   - O sistema consome as regras de Cadence Pipeline em 3 dias (*Dia 1: Pitch amigável, Dia 2: Proposta estruturada, Dia 3: Fechamento com quebra de objeções*).
   - O disparo é feito pelo WhatsApp Nativo ou via API externa respeitando o delay estratégico anti-bloqueio.
   - Sincronização externa: os dados são enviados via webhook para CRMs como o Pipedrive.

---

## 4. Copy Map (Dicionário de Mensagens e Alertas Críticos)

O Asset Intelligence Enterprise conta com alertas de interface e logs de depuração altamente informativos, projetados para instruir o usuário sobre o status da aplicação de forma clara e profissional.

### A. Alertas do Sistema de Conexão WhatsApp

*   **Sessão Desconectada (QR Code Solicitado)**:
    *   *Mensagem exibida*: `"Sessão limpa e desconectada com sucesso pelo usuário."`
    *   *Ação*: O painel de conexão reseta, limpa a pasta `auth_info_baileys` e apresenta o botão de gerar novo QR Code de autenticação.
*   **Alerta de Watchdog de Conexão**:
    *   *Log emitido*: `"[Watchdog em 2º Plano] Conexão inativa detectada em segundo plano. Tentando reconectar automaticamente..."`
    *   *Ação*: O monitor em background tenta religar o socket Baileys sem interromper a navegação ativa do usuário no navegador.
*   **Falhas Consecutivas Altas (Recuperação Automática)**:
    *   *Log emitido*: `"[Watchdog em 2º Plano] Falhas consecutivas elevadas (>=5). Limpando credenciais de sessão corrompida."`
    *   *Ação*: Deleta a pasta de sessão corrompida para evitar loops infinitos de recusa de chave por parte dos servidores do WhatsApp.

### B. Notificações do Motor Anti-Banimento e Disparos

*   **Pausa Estratégica Anti-Ban (Micro-Break)**:
    *   *Mensagem do Toast/Log*: `"☕ [Anti-Ban Humanizado] Pausa estratégica realizada após {X} envios consecutivos (Aguardando {Y}s)..."`
    *   *Motivo*: Disparado a cada 10 envios de massa consecutivos na fila. Simula o comportamento humano de parada para leitura ou descanso, blindando o chip contra varreduras algorítmicas da operadora.
*   **Jitter de Segurança da Fila**:
    *   *Log emitido*: `"⏳ [Fila em Massa] Aguardando jitter de segurança de {X}s (90s - 240s)..."`
    *   *Motivo*: Injetado entre cada envio individual de mensagens na fila em massa para impedir o padrão de envios idênticos com intervalos exatos milimétricos.

### C. Alertas de Processamento de Leads e IA

*   **Sem Resultados (Otimizador de Fila Ativado)**:
    *   *Mensagem na tela*: `"0 resultados obtidos após {X} tentativas. Iniciando reformulação inteligente de palavras-chave..."`
    *   *Ação*: O sistema chama o endpoint `/api/ai/reformulate` do Gemini para obter variações do termo com DDD e gatilhos comerciais para destravar a varredura.
*   **Aviso de Proteção Comercial (Anti-Espião)**:
    *   *Mensagem sobreposta (Blur)*: `"Visor comercial protegido por segurança de conformidade."`
    *   *Ação*: Ativado ao ligar o modo de proteção de privacidade em público, borrando os telefones e valores de leads na tabela do CRM para segurança contra fotos indesejadas de telas.
*   **Checkpoint de Backup Atingido**:
    *   *Mensagem do Toast*: `"💾 Checkpoint de segurança atingido. Backup de 100 leads gravado na nuvem com sucesso!"`
    *   *Ação*: Notifica o usuário de que o Guardião de Núcleo persistiu as últimas 100 alterações de dados de forma redundante e segura.

---
*Fim do documento técnico de mapeamento do Asset Intelligence Enterprise.*
