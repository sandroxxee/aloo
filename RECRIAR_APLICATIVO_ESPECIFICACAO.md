# Especificação para recriar o Asset Intelligence

**Autor:** Manus AI  
**Objetivo:** reconstruir o produto como um aplicativo novo, preservando as capacidades de operação comercial já mapeadas, mas sem reutilizar o layout, a hierarquia visual ou a organização atual das telas.

> Este documento descreve o que o novo aplicativo deve fazer. Ele não autoriza remover funcionalidades já existentes, criar resultados sintéticos, usar rotação de IP, burlar bloqueios ou adicionar serviços de busca pagos.

## 1. Visão do produto

O novo aplicativo deve ser uma **central de operação comercial para o mercado de transporte, caminhões, frotas, peças pesadas e logística**. Sua função é ajudar uma equipe a transformar pesquisas comerciais em contatos organizados, oportunidades qualificadas, acompanhamento de relacionamento e ações de campanha.

Em vez de reproduzir o atual painel denso, a recriação deve funcionar como uma **mesa de trabalho operacional**. O usuário começa por uma intenção simples — encontrar negócios, organizar contatos ou conduzir uma campanha — e a interface revela somente os controles necessários naquele momento.

| Princípio | Decisão para a nova versão |
|---|---|
| Foco | Uma tarefa comercial por vez, com contexto preservado. |
| Navegação | Seções de negócio claras, não uma coleção de ferramentas técnicas. |
| Dados | Resultados reais, estados vazios claros e origem rastreável. |
| Segurança | Cadência controlada, retentativas responsáveis e nenhuma técnica de evasão. |
| Interface | Nova linguagem visual, sem copiar os cartões, gradientes, navegação ou composição atuais. |
| Desempenho | Listas virtualizadas, carregamento por demanda, componentes isolados e animações discretas. |

## 2. O que deve ser preservado funcionalmente

As capacidades a seguir foram identificadas nos módulos atuais e precisam existir na recriação, mesmo que tenham nomes, telas e fluxos diferentes.

| Domínio | Capacidades obrigatórias |
|---|---|
| Pesquisa comercial | Pesquisa por termos, cidades, categorias, DDDs e filtros de contato; fila de mineração; pausas; progresso; logs; deduplicação; normalização de telefones brasileiros. |
| Inteligência de termos | Banco de palavras-chave; organização por categoria, prioridade, região e status; geração e expansão assistida por IA; remoção de duplicados; termos negativos; recomendações e análise de desempenho. |
| Radar geográfico | Seleção de cidade, estado, categoria e raio; mapa; busca real por proximidade; exibição de empresas encontradas; gravação de leads; estado explícito para carregamento, vazio e erro. |
| Base de leads | Tabela paginada ou virtualizada; busca; filtros; classificação; importação; exportação; edição e deduplicação; persistência local e integração com armazenamento configurado. |
| CRM | Pipeline por estágios; detalhes da oportunidade; movimentação de leads; descarte consciente; histórico e agendamentos de retorno. |
| Inteligência comercial | Indicadores de base, eficiência, origem, categorias, regiões, conversão e oportunidades; relatórios de análise somente quando houver dados suficientes. |
| Mensagens | Composição de campanhas; modelos de mensagem; variáveis dinâmicas; prévia; fila; teste de envio; grupos; respostas automáticas; triagem de contatos; acompanhamento de entregas e respostas. |
| Integrações | Configuração opcional de IA, webhooks, provedores de WhatsApp, e-mail, exportação CSV/JSON e conectores de nuvem. |
| Operação e suporte | Auditoria de eventos, alertas reais, backup/exportação, importação, diagnóstico técnico, proteção de acesso e preferências. |

## 3. Restrições funcionais obrigatórias

O comportamento abaixo deve continuar explícito na nova implementação.

| Regra | Implementação esperada |
|---|---|
| Resultados | Não criar contatos, avaliações, empresas, métricas ou histórico fictícios para preencher a interface. |
| Busca | Não usar API paga de busca sem decisão explícita do administrador. |
| Rede | Não implementar proxy, VPN, rotação de IP, troca de agente de usuário, bypass de CAPTCHA ou técnicas de evasão. |
| Cadência | Aplicar intervalo configurável, retentativa com recuo progressivo e feedback de indisponibilidade. |
| Estado vazio | Explicar a próxima ação possível sem dar a impressão de falha silenciosa. |
| Integrações | Indicar de forma inequívoca quando uma ação é simulação, teste local ou envio real. |
| Dados sensíveis | Não exibir tokens, senhas ou números completos sem necessidade operacional. |

## 4. Nova arquitetura de experiência

### 4.1 Navegação principal

Organizar o novo produto em seis áreas de negócio. A navegação deve ser uma barra lateral recolhível em desktop e uma barra inferior contextual em mobile. Cada área abre em uma rota própria e mantém seu estado independente.

| Área | Objetivo | Conteúdo principal |
|---|---|---|
| **Início** | Retomar o trabalho | Resumo do dia, próximos retornos, fila ativa, alertas reais e atalhos de continuidade. |
| **Descobrir** | Encontrar negócios | Pesquisa por termo, local e categoria; controle de cadência; mapa quando necessário; resultados reais. |
| **Leads** | Organizar a base | Tabela de contatos, filtros, importação, exportação, etiquetas e perfil do lead. |
| **Pipeline** | Conduzir oportunidades | Colunas CRM, agenda de follow-up, histórico e ações comerciais. |
| **Campanhas** | Comunicar e acompanhar | Criação de campanhas, modelos, prévia, filas, testes e métricas de execução. |
| **Configurar** | Administrar a operação | Integrações, preferências, dados, segurança, automações reais e diagnóstico. |

### 4.2 Fluxo de descoberta

O fluxo de busca deve abrir como um **construtor de consulta**, e não como um painel de controles. O usuário escolhe uma intenção comercial, informa localidade e segmento, revisa a cadência e inicia. Durante a execução, a tela troca para uma visão de progresso com registros de atividades e resultados que chegam de fato.

1. Definir **o que procurar**: termo, segmento ou modelo de negócio.
2. Definir **onde procurar**: cidade, estado, DDD ou cobertura geográfica.
3. Definir **como qualificar**: tipo de telefone, e-mail, site, categoria e filtros.
4. Revisar a cadência segura e iniciar a operação.
5. Exibir somente contatos retornados pelas fontes consultadas.
6. Permitir salvar, etiquetar, exportar ou encaminhar contatos ao pipeline.

### 4.3 Fluxo de lead para oportunidade

Um contato não deve nascer como oportunidade. O novo fluxo deve ter distinção visual e de dados entre **resultado descoberto**, **lead salvo**, **lead qualificado** e **oportunidade em negociação**. O perfil de lead deve concentrar identidade, origem, contatos, observações, etiquetas, próxima ação e histórico.

## 5. Direção visual nova

### 5.1 Conceito: “Mesa de operações”

A nova experiência deve abandonar o aspecto de painel técnico escuro e usar uma linguagem de **workbench comercial**: fundo claro levemente quente, superfícies neutras, blocos de informação compactos, acento verde-petróleo para ações positivas e azul profundo para navegação e análise. O resultado deve lembrar uma ferramenta de operação de equipe, não um terminal de mineração.

| Token | Direção |
|---|---|
| Fundo base | `#F5F7F6`, com textura muito discreta de pontos ou grade. |
| Superfície | `#FFFFFF`, com bordas `#E5EAE7` e sombra curta. |
| Texto principal | `#17211C`, alto contraste e tom menos frio que preto puro. |
| Texto auxiliar | `#66736B`, para metadados e orientação. |
| Ação principal | Verde-petróleo `#0F766E`. |
| Análise e navegação | Azul marinho `#1E3A5F`. |
| Atenção | Âmbar `#B45309`; erro `#B42318`; sucesso `#15803D`. |
| Tipografia | `Manrope` ou `Inter` para interface; `IBM Plex Mono` somente para códigos e logs. |
| Raio | 10–14 px em superfícies; 8 px em controles compactos. |
| Movimento | Apenas opacidade e transformação, entre 120 e 220 ms; respeitar `prefers-reduced-motion`. |

### 5.2 Composição da tela

A tela deve ter uma **coluna de contexto** estreita à esquerda, uma área central de trabalho e um painel lateral opcional para detalhes, filtros ou atividade recente. Em mobile, o painel lateral torna-se uma folha deslizante; a coluna de contexto reduz-se a navegação inferior.

Evitar cartões enormes, títulos em caixa alta, gradientes fortes, excesso de badges, ícones repetidos e controles com a mesma prioridade. Toda tela deve ter um título, uma ação primária inequívoca, uma área de conteúdo e uma ação de retorno ou saída clara.

## 6. Modelos de dados recomendados

| Entidade | Campos essenciais |
|---|---|
| `Lead` | id, nome, empresa, telefone normalizado, telefone exibido, e-mail, site, endereço, cidade, UF, origem, consulta de origem, etiquetas, status, criadoEm. |
| `Opportunity` | id, leadId, etapa, valor estimado, prioridade, responsável, próximaAçãoEm, observações, atualizadoEm. |
| `SearchJob` | id, consulta, localidade, filtros, cadência, status, iniciadoEm, finalizadoEm, contagemReal, diagnóstico. |
| `SearchResult` | id, jobId, dados da empresa, origem, coordenadas, contatos, elegível, salvoEm. |
| `Campaign` | id, canal, modelo, público, status, agendamento, total, enviados, respostas, falhas. |
| `CampaignMessage` | id, campaignId, leadId, conteúdo renderizado, status, enviadoEm, entregueEm, respondidoEm. |
| `Integration` | id, tipo, ativo, configuração segura, últimaVerificação, status. |
| `ActivityEvent` | id, tipo, entidade, entidadeId, descrição, origem, criadoEm. |

## 7. Arquitetura técnica recomendada

O novo código deve substituir o componente raiz grande por módulos pequenos e previsíveis. O frontend continua em React e TypeScript; o backend deve expor contratos tipados. O estado de cada domínio deve ficar perto do domínio, e não concentrado em um único arquivo de aplicação.

```text
client/src/
  app/                    # shell, rotas, providers e tema
  features/
    discovery/            # pesquisa, jobs, resultados e mapa
    leads/                # tabela, perfil, filtros, importação e exportação
    pipeline/             # oportunidades, estágios e follow-ups
    campaigns/            # composição, filas, modelos e acompanhamento
    intelligence/         # termos, sugestões, métricas e análise
    settings/             # integrações, preferências, dados e segurança
  components/ui/          # primitives visuais reutilizáveis
  lib/                    # formato, normalização, validação e clientes
server/
  routers/                # contratos por domínio
  services/               # integração, busca, cadência, deduplicação
  jobs/                   # execução controlada e cancelável de pesquisa
```

| Decisão | Justificativa |
|---|---|
| Rotas por domínio | Evita que a navegação dependa de dezenas de estados internos. |
| Serviços de busca isolados | Mantém cadência, deduplicação, diagnóstico e cancelamento testáveis. |
| Lista virtualizada | Evita travamento ao crescer a base de leads. |
| Estado assíncrono por job | Permite mostrar progresso, parar a operação e recuperar a tela. |
| UI por estados | Carregando, vazio, sucesso parcial, erro e sem permissão devem ser componentes explícitos. |
| Design tokens | Permitem reformular o visual sem reescrever cada funcionalidade. |

## 8. Funcionalidades por fase de reconstrução

### Fase 1 — Fundação operacional

Construir autenticação, layout novo, navegação, tema, base de dados de leads, tabela virtualizada, perfil de lead, importação/exportação e pipeline CRM. Nenhuma automação ou integração externa deve ser assumida como ativa.

### Fase 2 — Descoberta e inteligência

Adicionar construtor de consultas, fila de pesquisa, palavras-chave, normalização brasileira, deduplicação, logs, cadência segura, mapa e resultados reais. A interface precisa continuar útil quando uma fonte externa não responder.

### Fase 3 — Campanhas e relacionamento

Adicionar modelos de mensagem, filas, prévia, teste, rastreamento de retorno, grupos, respostas automáticas e integrações configuradas pelo administrador.

### Fase 4 — Análise, governança e suporte

Adicionar indicadores reais, relatórios, backup, auditoria, diagnóstico, permissões e integrações administrativas. Qualquer automação periódica deve ser opt-in e exibida como pausada até receber configuração válida.

## 9. Critérios de aceite da nova versão

| Critério | Como verificar |
|---|---|
| Novo visual | A nova composição não reutiliza o cabeçalho, o grid, os cartões ou a navegação do aplicativo atual. |
| Preservação funcional | Os seis domínios principais podem ser acessados e seus fluxos continuam disponíveis. |
| Integridade | Nenhum resultado comercial aparece sem retorno real de uma fonte. |
| Desempenho | Tabelas grandes permanecem navegáveis e filtros não bloqueiam a interface. |
| Responsividade | Operações de busca, lead, pipeline e campanha permanecem acessíveis em 375 px, 768 px e desktop. |
| Clareza | Cada ação de integração identifica se é teste, simulação ou envio real. |
| Segurança | Não existem recursos de proxy, VPN, rotação de IP, troca de agente de usuário ou bypass de bloqueios. |
| Manutenibilidade | Cada domínio possui testes unitários e não depende de um componente monolítico. |

## 10. Prompt pronto para iniciar a recriação com uma IA de código

```text
Reconstrua o Asset Intelligence como um novo aplicativo React + TypeScript, sem copiar o layout, o tema ou a hierarquia visual atuais. Preserve estas capacidades: descoberta comercial por termo, cidade, categoria e DDD; fila de pesquisas; normalização e deduplicação de contatos brasileiros; leads com importação, exportação e tabela virtualizada; CRM por pipeline; gestão de palavras-chave e análise de desempenho; campanhas de WhatsApp/e-mail/SMS com modelos, prévia, fila e acompanhamento; integrações configuráveis; backup, diagnóstico e segurança.

Use a experiência “Mesa de operações”: fundo claro levemente quente, superfícies brancas, acento verde-petróleo, azul profundo para análise, barra lateral recolhível no desktop e navegação inferior no mobile. Organize o produto em Início, Descobrir, Leads, Pipeline, Campanhas e Configurar. Cada área deve ser uma rota independente, com estados explícitos de carregamento, vazio e erro.

Não crie resultados, empresas, contatos, métricas, avaliações ou históricos fictícios. Não use APIs pagas de busca, proxy, VPN, rotação de IP, troca de User-Agent, CAPTCHA bypass ou técnicas de evasão. Para buscas, implemente apenas cadência configurável, retentativa com backoff e diagnóstico honesto de falhas. Mantenha listas grandes virtualizadas e escreva testes para normalização, deduplicação, estados de busca e permissões.
```

## 11. Mapa de referência da implementação existente

Os componentes atuais podem ser consultados como referência funcional, mas não como referência de layout: `GoogleMapsScanner`, `LoopController`, `KeywordManager`, `LeadTable`, `KanbanCrmBoard`, `BackgroundAutoSender`, `SystemSettingsTab`, `CommercialIntelligenceCenter`, `EmailDispatcher`, `SmsDispatcher`, `TemplateManager`, `WebhookConfigModal` e os serviços de busca, classificação, normalização, enriquecimento, IA, backup e persistência.

> A regra de transição é simples: **preservar capacidades e dados, substituir a experiência.**
