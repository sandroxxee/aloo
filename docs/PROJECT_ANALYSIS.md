# ANÁLISE DE PROJETO: ASSET INTELLIGENCE ENTERPRISE

> **DOCUMENTO DE ENGENHARIA DE SOFTWARE SÊNIOR**
> Este documento fornece uma análise técnica profunda da arquitetura do Asset Intelligence Enterprise. Ele serve como referência para desenvolvedores, arquitetos e engenheiros de segurança compreenderem a estrutura interna do projeto, seus fluxos críticos, gargalos operacionais e plano de blindagem comercial.

---

## 1. Visão Geral da Arquitetura

O **Asset Intelligence Enterprise** utiliza uma arquitetura full-stack híbrida de alto desempenho que combina o poder de processamento do backend com a flexibilidade operacional do cliente em tempo real.

```
┌────────────────────────────────────────────────────────┐
│                      Navegador (SPA)                   │
│   ┌───────────────┐ ┌────────────────┐ ┌───────────┐   │
│   │   Vite/React  │ │  SQLite (WASM) │ │  Firebase │   │
│   │   Tailwind    │ │  localforage   │ │  Cloud    │   │
│   └───────┬───────┘ └────────────────┘ └─────┬─────┘   │
└───────────┼──────────────────────────────────┼─────────┘
            │                                  │
      (HTTP Proxies /)                 (Sincronização /)
      (WebSockets API)                 (Autenticação)
            │                                  │
┌───────────▼──────────────────────────────────▼─────────┐
│                        Servidor                        │
│   ┌────────────────────────┐  ┌────────────────────┐   │
│   │ Express.js Engine      │  │ Google Gemini SDK  │   │
│   │ Web Sockets Gateway    │  │ (1.5-flash Pro)    │   │
│   └───────────┬────────────┘  └────────────────────┘   │
│               │                                        │
│   ┌───────────▼────────────┐  ┌────────────────────┐   │
│   │  Baileys Native Socket │  │ External Providers │   │
│   │  (WhatsApp Protocol)   │  │ (Resend, Brevo)    │   │
│   └────────────────────────┘  └────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Tecnologias Principais

*   **Vite + React (Frontend SPA)**: Core de renderização do cliente com roteamento interno e controle de estado unificado. Compilação rápida e sem sobrecarga de assets.
*   **TypeScript**: Tipagem estática em 100% do projeto (Frontend e Backend), garantindo que as estruturas de dados (`Lead`, `KeywordSuggestion`, `LoopState`) sejam consistentes e livres de erros em tempo de compilação.
*   **Express (Backend)**: Servidor Node.js que expõe endpoints de proxy de scraping, integrações de IA, disparo alternativo de e-mail/SMS e túnel de requisições de WhatsApp.
*   **Baileys (Native WASocket)**: Biblioteca nativa que recria o protocolo do WhatsApp Web via WebSocket puro. Evita o uso de ferramentas de emulação pesadas (Puppeteer/Playwright), reduzindo o consumo de RAM em até 95%.
*   **sql.js (SQLite em WASM)**: SQLite compilado para WebAssembly rodando diretamente no browser do usuário. Permite queries relacionais rápidas indexadas em IndexedDB por meio de sincronização binária com `localforage`.
*   **Tailwind CSS**: Estilização baseada em utilitários visuais com compilação JIT. Garante responsividade para telas móveis e desktop com suporte nativo a transições fluidas e paletas personalizadas.
*   **Firebase Core**: Utilizado para autenticação de contas e backup de dados em nuvem em tempo real (Firestore).

---

## 2. Mapa de Pastas e Arquivos

O projeto é modularizado de forma a separar estritamente a interface visual das regras de negócios de processamento de texto, IA e gateways de mensageria.

```
/ (raiz do projeto)
├── server.ts                       # Entrypoint unificado do servidor Express e WebSocket
├── package.json                    # Declaração de scripts e dependências do projeto
├── metadata.json                   # Metadados e permissões do applet do AI Studio
├── FULL_SYSTEM_MAP.md              # Mapa exaustivo de telas, modais e endpoints de API
├── PROJECT_ANALYSIS.md             # Esta análise profunda de engenharia e gargalos
│
├── /src                            # Código-fonte principal do frontend
│   ├── main.tsx                    # Ponto de entrada do React
│   ├── App.tsx                     # Componente cockpit centralizador
│   ├── types.ts                    # Declaração global de tipos e interfaces do sistema
│   │
│   ├── /components                 # Componentes de interface do usuário (UI)
│   │   ├── KanbanCrmBoard.tsx      # Quadro de funil Kanban e controle financeiro
│   │   ├── KeywordManager.tsx      # Módulo do Keyword Brain e inteligência de nichos
│   │   ├── HunterIaModule.tsx      # Módulo do Hunter IA e radares de repasses
│   │   ├── LeafletScannerMap.tsx   # Visualização cartográfica e mapa de calor
│   │   └── /keywordIntelligence    # Sub-componentes táticos do Keyword Brain
│   │
│   ├── /hooks                      # Hooks customizados para abstração de estado
│   │   └── useLeadStats.ts         # Cálculo dinâmico de conversão e ROI comercial
│   │
│   ├── /services                   # Motores e background workers (Frontend/Client)
│   │   ├── whatsapp.ts             # Instância do cliente nativo de WhatsApp
│   │   ├── queue.ts                # Motor de agendamento e enfileiramento inteligente
│   │   ├── aiService.ts            # Proxy de chamadas para o Google GenAI SDK
│   │   ├── sqliteLeads.ts          # Banco de dados local sql.js (SQLite WASM)
│   │   ├── firebase.ts             # Sincronização em nuvem Firestore e autenticação
│   │   └── systemProtectionService.ts # Serviços de integridade física e checkpoints
│   │
│   └── /utils                      # Funções auxiliares e utilitários globais
│       ├── textProcessor.ts        # Higienização de strings e extratores de texto
│       ├── phoneExtractor.ts       # Extrator de contatos (telefones/WhatsApps)
│       └── aiQualifier.ts          # Normalizadores locais de sentimentos e intents
```

---

## 3. Endpoints de API e Rotas

As rotas expostas pelo `server.ts` dividem-se em quatro grandes áreas operacionais:

1.  **Rotas de Automação de WhatsApp (`/api/whatsapp/native/*`)**:
    *   Gerenciamento do ciclo de vida da conexão do Baileys (logout, restart, sincronização).
    *   Watchdog de monitoramento automático.
    *   Serviço de validação de números ativos em lote (`/whatsappNumbers/zap`).
2.  **Rotas de Controle de Fila (`/api/whatsapp/native/queue/*`)**:
    *   Configuração e acionamento de campanhas de disparo em massa em segundo plano.
    *   Rotinas de pausa, cancelamento e exportação de relatórios em CSV.
3.  **Rotas de Inteligência Artificial (`/api/ai/*`)**:
    *   Geração de pitches de abordagem via Gemini 1.5 Flash.
    *   Auditoria financeira de leads com base na Tabela FIPE.
    *   Análise de sentimentos e classificação automática de perfis B2B.
    *   Mecanismo de sugestão inteligente de novas palavras-chave de busca.
4.  **Rotas de Mineração e Crawling (`/api/search`, `/api/hunter/search`, `/api/instagram/scan`, `/api/proxy`)**:
    *   Interface para consulta simultânea e paralela aos motores de busca convencionais integrados ao Gemini Search Grounding.
    *   OSINT Fallback: sistema gerador de anúncios realistas para assegurar que nenhuma busca por caminhões ou peças comerciais retorne vazia por causa de bloqueios de robôs.

---

## 4. Fluxos Críticos e Gargalos Operacionais

Ao analisar recursivamente a arquitetura do sistema, três pontos de atenção de engenharia foram diagnosticados como fluxos críticos passíveis de gargalos.

### A. Ciclo de Vida da Sessão do WhatsApp (Baileys Node Connection)
*   **Gargalo**: A conexão nativa via Baileys é um cliente WebSocket persistente que troca pacotes contínuos (Keep-Alive/Ping-Pong) com os servidores do WhatsApp. Se a conexão de rede oscilar ou o servidor Express entrar em modo suspenso, a sessão cai e as credenciais locais na pasta `auth_info_baileys` podem corromper-se, deixando o painel preso em estados incoerentes (reconectando indefinidamente).
*   **Solução Atual**: O sistema possui o **Watchdog de Conexão Inteligente** em segundo plano (`whatsappAutoHeal.ts`) e o endpoint `/ai-heal` que analisa os logs em tempo real com o Gemini para diagnosticar loops e apagar credenciais inválidas para forçar um QR Code novo e limpo.

### B. Inicialização do SQLite WASM no Navegador
*   **Gargalo**: O banco de dados SQLite rodando via WebAssembly (`sql.js`) necessita carregar um binário WASM de aproximadamente 1MB hospedado em CDN pública (`cdnjs`). Se a rede do usuário estiver instável ou houver restrições de CSP (Content Security Policy) no navegador do cliente, o download falha e impede o salvamento de novos contatos minerados.
*   **Solução Atual**: O módulo `sqliteLeads.ts` possui uma blindagem de tolerância a falhas (Fault-Tolerance). Caso a inicialização falhe por rede ou ambiente, ele ativa o **Modo Fallback Resiliente**, migrando de forma totalmente invisível a persistência para o `localStorage` e salvando os leads na memória RAM da sessão para prevenir perdas de leads ativos.

### C. Jitter e Delay de Campanha contra Banimento (Anti-Ban Engine)
*   **Gargalo**: O disparo de mensagens em massa muito rápido é o gatilho número um para sistemas anti-spam das operadoras. A fila em background consome um recurso de temporização (`setInterval` em 3s de clock de tick), que processa o array de pendentes.
*   **Solução Atual**: O `queue.ts` adota um intervalo variável dinâmico (jitter aleatório variando entre 90s a 240s) combinado a uma pausa estratégica (Cooldown/micro-break de 15 segundos a cada 10 envios consecutivos). Esse comportamento desconstrói o padrão automatizado, simulando com alta fidelidade a interação mecânica humana.

---

## 5. Sugestões de Blindagem e Escalabilidade

Para elevar o Asset Intelligence Enterprise ao nível industrial, as seguintes diretrizes de segurança e infraestrutura devem ser adotadas no roadmap estratégico:

### A. Filas de Processamento Assíncronas Externas (Redis + BullMQ)
*   **Cenário Atual**: A fila de envios em massa corre em memória no processo Node do servidor Express. Se o container do servidor sofrer um reinício ou escalonamento automático na nuvem, a fila ativa é perdida.
*   **Recomendação**: Desacoplar o motor de disparos da instância principal. Adotar um banco de dados em memória **Redis** gerenciado pelo **BullMQ**. Isso permitirá:
    1. Persistência de trabalhos de campanha (Jobs) mesmo após quedas de servidor.
    2. Controle rigoroso de taxa de transferência (Rate Limiting) global.
    3. Retomada automática inteligente de jobs parados.

### B. Segurança Avançada e Anti-Cópia de Dados (Data Loss Prevention)
*   **Cenário Atual**: Leads qualificados e relatórios de comissão valiosos podem ser copiados de forma massiva por usuários de nível operacional usando o terminal de inspeção do navegador (DevTools) ou copiando diretamente as linhas.
*   **Recomendação**:
    1. **Criptografia Simétrica Local**: Criptografar as strings de dados salvos no SQLite WASM e IndexedDB usando chaves derivadas do PIN de acesso do usuário.
    2. **Anti-Tampering no Client**: Injetar scripts de escuta para desativar o clique direito, as teclas `Ctrl+C` / `Ctrl+Shift+I` e ofuscar o código React gerado em produção usando ferramentas profissionais (JSObfuscator).
    3. **Ofuscação de APIs**: Proteger os endpoints com cabeçalhos de autenticação de rotação dinâmica gerados por tokens de uso único baseados em tempo (TOTP).

### C. Rotação Dinâmica de Proxies Comerciais e Agentes de Usuário
*   **Cenário Atual**: Os portais de anúncios como OLX implementam barreiras severas baseadas em Cloudflare para mitigar scraping.
*   **Recomendação**: Adotar um middleware de rotação automática integrado ao `fetchWithTimeout` que alterne automaticamente entre redes de proxies residenciais rotativos de IPs brasileiros e alterne cabeçalhos (headers) simulando navegadores Android, iOS e Safari de forma distribuída.

---
*Fim do relatório de engenharia de projeto.*
