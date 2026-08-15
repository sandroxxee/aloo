# 🚀 03_FEATURES.md - MAPA COMPLETO DE FUNCIONALIDADES E RECURSOS DO SISTEMA

> **ASSET INTELLIGENCE - PLATAFORMA SAAS ENTERPRISE DE INTELIGÊNCIA COMERCIAL**
> Este documento traz o inventário minucioso e exaustivo de todas as funcionalidades, radares, motores de mineração, recursos de IA, automações, ferramentas de vendas e APIs ativas no ecossistema.

---

## 🛰️ 1. RADARES E MOTORES DE MINERAÇÃO COMERCIAL

### 1.1. Radares Especializados de Mercado
- **Radar Comercial B2B**: Localização de empresas, indústrias, transportadoras e prestadores de serviços em todo o Brasil.
- **Radar de Empresas & Frotistas**: Identificação de frotas ativas, renovação de frota de veículos pesados e transportadoras.
- **Radar de Repasses & Oportunidades Urgentes**: Captura de anúncios com urgência de venda, liquidantes e repasses abaixo da FIPE.
- **Radar de Compradores Ativos**: Captura de pesquisas e anúncios de compra (*"procuro"*, *"compro"*, *"necessito"*).
- **Radar de Vendedores Urgentes**: Captura de ofertas diretas (*"vendo"*, *"repasso"*, *"urgente"*, *"oportunidade"*).
- **Radar de Peças e Serviços Pesados**: Localização de desmanches credenciados, auto peças pesadas, oficinas diesel e guinchos 24h.

### 1.2. Radares por Plataforma e Mecanismo (`searchEngines.ts`)
- **Radar Google Maps & Lugares**: Geolocalização comercial por raio (km), cidade, bairro e estado.
- **Radar Google & Bing Web**: Rotação entre motores de busca globais e regionais.
- **Radar OLX / Mercado Livre**: Varredura em plataformas de anúncios classificados e e-commerce pesado.
- **Radar Facebook Groups & Marketplace**: Varredura em grupos de compra e venda e ofertas sociais.
- **Crawler Multi-Mecanismo com Rotação de User-Agents**: Alternância de cabeçalhos de navegadores e leituras resilientes para prevenção de bloqueios.

### 1.3. SmartSearchOrchestrator V2 (`smartSearchOrchestrator.ts`)
- **Mecanismo Invisível de Orquestração Comercial**: Transforma o termo informado pelo usuário (ex: `Scania R540`) em dezenas de variações estratégicas de alta intenção comercial (`vendo`, `procuro`, `urgente`, `abaixo da FIPE`, `renovacao de frota`, `particular`, `direto proprietario`).
- **Priorização Ponderada e Inteligência de Plataformas**: Ranqueia automaticamente quais variações e plataformas executar em primeiro lugar com base no histórico de leads minerados, WhatsApps capturados e taxa de conversão em vendas.
- **Cache Local TTL & Lotes Paralelos Throttled**: Previne requisições duplicadas via cache de 15 min com TTL, executa buscas em paralelo com controle de throttle, e consolida contatos deduplicando rigorosamente por telefone.

---

## 🧠 2. CENTRAL DE INTELIGÊNCIA DE TERMOS & APRENDIZADO (KEYWORD BRAIN)

### 2.1. Banco de Termos Catalogados (`TermDatabaseTable.tsx`)
- **Tabela de Gerenciamento do Banco**: Visualização do histórico completo de palavras-chave ativas, pausadas ou arquivadas.
- **Cálculo de Score de Rendimento (0 a 100)**: Score inteligente calculado com base em leads gerados, WhatsApps válidos e taxa de fechamento.
- **Edição & Atribuição de Metadados**: Categorização por nicho commercial, definição de UF alvo e status operacional.
- **Ações em Lote**: Ativação, pausa, exclusão e injeção em massa na fila de mineração.

### 2.2. IA Geradora de Termos Multimodo (`AiTermGeneratorTab.tsx`)
- **9 Modos de Geração Gemini**:
  1. *Conservador*: Termos diretos de alta precisão.
  2. *Comercial*: Foco em intenção de negociação B2B.
  3. *Long Tail*: Termos específicos de causa e efeito.
  4. *Regional*: Adiciona regionalismos e cidades estratégicas.
  5. *Similaridade*: Busca modelos e marcas correlatas.
  6. *Competidores*: Termos da concorrência e marcas rivais.
  7. *Tendências*: Palavras de alta busca no momento.
  8. *Livre / Aberto*: Criatividade para expansão de nicho.
  9. *Nicho Profundo*: Termos técnicos de engenharia/peças.

### 2.3. Catálogo Nacional de Nichos B2B (`NicheCatalogTab.tsx`)
- **Biblioteca Pré-Configurada**:
  - Caminhões e Cavalos Mecânicos (Scania, Volvo, Mercedes, Iveco, VW).
  - Implementos Rodoviários (Carretas Baú, Caçambas, Sider, Bicaçambas).
  - Máquinas Agrícolas e Tratores (John Deere, New Holland, Massey Ferguson).
  - Linha Amarela e Construção (Escavadeiras, Retroescavadeiras, Pá Carregadeira).
  - Peças Diesel Pesadas (Motores, Câmbios ZF, Diferenciais Meritor, Turbinas).
  - Serviços Especializados (Oficinas Diesel, Borracharias 24h, Guinchos Prancha).

### 2.4. Motor de Expansão Combinatória (`CombinatorialExpanderTab.tsx`)
- **Matriz Combinatória N-Dimensional**: Permutação entre *Marcas x Modelos x Intenções x Estados (UFs) x DDDs x Canais*.
- **Geração Massiva com Deduplicação**: Criação de centenas de combinações únicas sem redundância.

### 2.5. IA Anti-Ruído & Lista Negra (`DiscoveryAndAntiNoiseTab.tsx`)
- **Detector de Termos Emergentes**: Identifica novas expressões encontradas nas descrições de anúncios durante as pesquisas.
- **Filtro Anti-Ruído / Palavras Negativas**: Bloqueio automático de termos indesejados (*"pdf"*, *"edital"*, *"vaga"*, *"grátis"*, *"manual"*, *"esquema"*).

### 2.6. Motor de Cruzamento Simultâneo (`CrossScannerTab.tsx`)
- **Cruzador B2B de Múltiplas Variáveis**: Combinação em matriz de Intenções (Venda, Compra, Troca, Aluguel) x Perfil do Vendedor (Particular, Revenda, Frotista, Desmanche) x Categorias x Estados.

### 2.7. Analytics, Tendências e Telemetria (`TrendsAndAnalyticsTab.tsx`)
- **Gráficos Recharts**: Telemetria visual do volume diário de leads e WhatsApps capturados.
- **Mapa de Cobertura Nacional**: Densidade de leads por estado (UF).
- **Dicionário Semântico de Sinônimos**: Mapeamento de variações de modelos e apelidos de mercado.

### 2.8. Simulador Pré-Execução & Laboratório IA (`SimulatorAndLabTab.tsx`)
- **Calculadora Estimativa de Resultados**: Previsão do volume de leads, WhatsApps válidos, tempo de execução e índice de qualidade antes de rodar.
- **Laboratório Estratégico de Nichos**: Análise de público e canal para qualquer mercado submetido.

---

## 🤖 3. INTELIGÊNCIA ARTIFICIAL & QUALIFICAÇÃO (GEMINI 3.6 FLASH)

- **Scoring & Qualificação Automática (`aiQualifier.ts`)**:
  - Avaliação de probabilidade de fechamento (0 a 100).
  - Classificação de Temperatura: *Quente* (Alta intenção), *Morno* (Em pesquisa), *Frio* (Baixa interação).
  - Detecção de Porte do Cliente: Pequeno, Médio, Grande Frotista, Corporativo.
- **Gerador de Pitches e Copys de Venda**:
  - Criação automática de mensagens de abordagem personalizadas via WhatsApp.
  - Variações de abordagem (Consultivo, Direto, Parceria Comercial).

---

## 💬 4. AUTOMAÇÃO WHATSAPP & DISPARO EM SEGUNDO PLANO

- **Disparador Inteligente (`BackgroundAutoSender.tsx`)**:
  - Fila de envios assíncrona em segundo plano.
  - Delays aleatórios humanizados anti-bloqueio (ex: 15s a 45s).
  - Intercalação de modelos de mensagens e substituição de variáveis (`{nome}`, `{empresa}`, `{cidade}`).
- **Conexão Baileys / WhatsApp Web (`useWhatsApp.ts`)**:
  - Leitura via QR Code no navegador.
  - Monitoramento contínuo de status da conexão e reconexão automática.

---

## 📊 5. CRM KANBAN, TABELA VIRTUALIZADA E GESTÃO DE VENDAS

- **Pipeline Kanban (`KanbanCrmBoard.tsx`)**:
  - Colunas do Funil: *Novo Lead*, *Em Contato*, *Em Negociação*, *Fechado/Ganho*, *Perdido*.
  - Cálculo do valor financeiro acumulado no pipeline em R$.
  - Drag and drop e movimentação rápida de cards.
- **Tabela Virtualizada (`LeadTable.tsx`)**:
  - Suporte a milhares de registros sem travamentos (`react-window`).
  - Busca instantânea e ordenação multinível.
- **Agendador de Follow-up (`LeadFollowUpScheduler.tsx`)**:
  - Agendamento de retornos e lembretes com alertas no sistema.

---

## ☁️ 6. CLOUD SYNC, SEGURANÇA E BACKUP

- **Sincronização Firebase Firestore (`firebase.ts`)**: Sincronização em nuvem e persistência contínua.
- **Checkpoints e Backup Automático (`AutoBackupModal.tsx`)**: Cópia de segurança automática a cada 100 leads.
- **Proteção e Auditoria (`SecurityGuardModal.tsx`)**: Proteção por PIN e log de cópias/exportações.
- **Monitor de Saúde (`SystemHealthMonitorModal.tsx`)**: Telemetria de memória RAM e limpeza de cache.

---

## 📥 7. EXPORTAÇÃO, IMPORTAÇÃO E APIS

- **Exportador Excel & CSV**: Planilhas limpas e organizadas por colunas.
- **Exportador VCF**: Arquivos para importação direta no celular ou Google Contacts.
- **Importador de Listas**: Carga em massa de palavras e contatos via texto/CSV.
- **Rotas API Express (`server.ts`)**: Endpoints REST para IA, WhatsApp, exportação e Webhooks (N8N, Make, Pipedrive).
