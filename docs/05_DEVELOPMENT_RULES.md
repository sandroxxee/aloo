# 📄 05_DEVELOPMENT_RULES.md - FILOSOFIA DE CÓDIGO E REGRAS DE DESENVOLVIMENTO ENTERPRISE

> **ASSET INTELLIGENCE - PLATAFORMA SAAS ENTERPRISE DE INTELIGÊNCIA COMERCIAL**
> Este documento define a filosofia de engenharia, arquitetura de software, padrões de performance, convenções do React/Node.js e as regras de ouro invioláveis para manter o ecossistema escalável, robusto e livre de incompatibilidades.

---

## 🏛️ 1. FILOSOFIA DE ENGENHARIA E ARQUITETURA

### 1.1. Nunca Duplicar Código (DRY - Don't Repeat Yourself)
- **Regra de Ouro**: Antes de criar qualquer nova função, hook ou componente, consulte o inventário em `AGENTS.md` e a suite de contexto para reutilizar o que já existe.
- **Componentes Reutilizáveis**: Modais, tabelas, seletores, cards e badges devem ser parametrizados em componentes modulares em `/src/components/`.
- **Hooks Compartilhados**: Lógicas de estado complexas (ex: sincronização de leads, estado do WhatsApp, persistência no Firestore) devem residir estritamente em `/src/hooks/`.
- **Services e Utilities Isolados**: Algoritmos de parsing, extração Regex, score de inteligência e exportação devem ser funções puras testáveis em `/src/utils/`.
- **Workers Independentes**: Tarefas pesadas e processos em segundo plano (ex: `backgroundRunner.ts`, `extractionWorkerManager.ts`) devem operar desacoplados do ciclo de vida dos componentes UI.
- **IA Desacoplada**: A integração com a IA Gemini (`gemini-1.5-flash`) deve ser realizada via rotas proxy server-side em `/server.ts` através do SDK oficial `@google/genai`. **NUNCA** exponha chaves de API no cliente nem acesse diretamente o SDK do browser.

---

## ⚡ 2. PERFORMANCE E OTIMIZAÇÃO DE RECURSOS

### 2.1. Virtualização de Listas e Tabelas
- **`react-window` Mandatório**: Para listagens de leads e contatos que podem ultrapassar centenas de linhas (`LeadTable.tsx`), a virtualização é obrigatória. Não renderizar listas longas diretamente no DOM sem virtualização.

### 2.2. Cache e Memoização Estratégica
- **`useMemo` & `useCallback`**: Memoizar filtros pesados, ordenações, cálculos estatísticos e callbacks passados para componentes filhos.
- **Cache Local & Persistência**: Reutilizar consultas recentes e metadados no `localStorage` ou cache em memória antes de efetuar chamadas redundantes para a rede ou para o Gemini.

### 2.3. Controle de Taxa (Debounce & Throttle)
- **Debounce em Buscas e Inputs**: Aplicar debounce (300ms a 500ms) em campos de pesquisa de texto livre para evitar re-renderizações desnecessárias.
- **Throttle em Disparos e Workers**: Respeitar intervalos mínimos e delays humanizados (ex: 15s a 45s) para filas assíncronas do WhatsApp e requisições de mineração.

---

## 💾 3. BANCO DE DADOS & PERSISTÊNCIA (FIRESTORE)

### 3.1. Coleções Principais do Firestore
- **`leads`**: Registros dos contatos minerados com campos normalizados (nome, telefone, cidade, UF, score, canal, status no Kanban).
- **`intelligent_terms`**: Histórico contínuo do Cérebro de Termos (keywords, execuções, leads gerados, WhatsApps válidos, score).
- **`negative_terms`**: Lista negra de termos bloqueados pelo filtro anti-ruído.
- **`system_backups`**: Checkpoints de backup automático e histórico de segurança.

### 3.2. Regras de Modelagem e Leitura/Escrita
- **Escritas em Lote (Batch Writes)**: Sempre que salvar múltiplos leads ou atualizar status em massa, utilizar operações em lote do Firestore para garantir atomicidade e economizar consumo de API.
- **Otimização de Índices**: Manter consultas compostas alinhadas com os índices do Firestore (`status`, `createdAt`, `score`).

---

## ⚛️ 4. CONVENÇÕES DO FRONTEND (REACT + TYPESCRIPT)

### 4.1. Organização dos Diretórios
```text
src/
├── components/          # Componentes visuais UI organizados por contexto
│   └── keywordIntelligence/ # Submódulos específicos da Central de Termos
├── hooks/               # Custom React Hooks
├── types/               # Definições de tipos TypeScript (.ts)
├── utils/               # Algoritmos, extratores e serviços puros
└── main.tsx / App.tsx   # Entry point e orquestração global
```

### 4.2. Convenção de Nomenclatura
- **Componentes**: `PascalCase.tsx` (Ex: `TermDatabaseTable.tsx`, `KanbanCrmBoard.tsx`).
- **Hooks**: `camelCase.ts` iniciando com `use` (Ex: `useWhatsApp.ts`, `useLeadSync.ts`).
- **Utilities e Helpers**: `camelCase.ts` (Ex: `phoneExtractor.ts`, `aiQualifier.ts`).
- **Tipos e Interfaces**: `PascalCase` em `src/types/` (Ex: `IntelligentTerm`, `LeadItem`).
- **Constantes**: `UPPER_SNAKE_CASE` (Ex: `BRAZIL_STATES`, `DEFAULT_SYNONYMS`).

### 4.3. Tipagem Estrita TypeScript
- **Proibido usar `any`**: Todos os dados, props, parâmetros de função e retornos devem ter tipos explícitos definidos em `src/types/` ou `src/types/keywordIntelligence.ts`.

---

## 🖥️ 5. ARQUITETURA DO BACKEND (`server.ts`)

### 5.1. Organização das Rotas Express
- **Prefixos `/api/*`**: Todas as rotas do backend devem ter o prefixo `/api/` para roteamento correto no Cloud Run e Vite.
- **Middlewares**: Middleware de JSON parsing, tratamento de erros centralizado e logging de requisições.
- **Rotas de IA**:
  - `POST /api/ai/keywords`: Geração inteligente de termos via Gemini 3.6 Flash.
  - `POST /api/ai/niche-strategy`: Plano de ação e mapa para nichos de mercado.
  - `POST /api/ai/qualify`: Qualificação preditiva e scoring de conversão.
  - `POST /api/ai/pitch`: Geração de abordagens comerciais para WhatsApp.

---

## 🚨 6. REGRAS DE OURO INVIOLÁVEIS (NUNCA QUEBRAR)

1. **NUNCA alterar APIs ativas sem retrocompatibilidade**: Não alterar parâmetros ou retornos de rotas `/api/*` existentes para não quebrar módulos ativos.
2. **NUNCA quebrar compatibilidade de dados**: Respeitar as interfaces de `LeadItem`, `IntelligentTerm` e `NegativeTermItem`.
3. **NUNCA criar código morto ou não utilizado**: Remover imports não utilizados, variáveis sem uso e arquivos legados.
4. **NUNCA colocar lógicas de backend ou chaves no cliente**: Manter chaves do Gemini e chamadas sensíveis exclusivamente no servidor (`server.ts`).
5. **NUNCA criar componentes/arquivos gigantescos**: Se um componente ultrapassar 400 linhas, extrair submódulos para manter legibilidade, economia de tokens e facilidade de manutenção.
6. **SEMPRE validar a compilação e o linter**: Todo código alterado deve passar perfeitamente pelo `compile_applet` e `lint_applet` sem erros de TypeScript ou syntax.
