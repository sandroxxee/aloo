# 🚀 FEATURES.md - INVENTÁRIO COMPLETO DE FUNCIONALIDADES

> **ASSET INTELLIGENCE - PLATAFORMA SAAS ENTERPRISE DE INTELIGÊNCIA COMERCIAL**
> Catálogo detalhado de todas as funcionalidades ativas, motores funcionais, ferramentas de automação e inteligência artificial integradas no sistema.

---

## 📋 SUMÁRIO DE MÓDULOS

1. [🔍 Central de Mineração, Varredura e Captura de Leads](#1--central-de-mineração-varredura-e-captura-de-leads)
2. [🧠 Central de Inteligência de Termos & Aprendizado (Keyword Brain)](#2--central-de-inteligência-de-termos--aprendizado-keyword-brain)
3. [🤖 Inteligência Artificial & Qualificação Automática (Gemini 3.6 Flash)](#3--inteligência-artificial--qualificação-automática-gemini-1.5-flash)
4. [💬 Automação WhatsApp & Disparo Inteligente em Segundo Plano](#4--automação-whatsapp--disparo-inteligente-em-segundo-plano)
5. [📊 CRM Kanban, Tabela Virtualizada e Gestão de Vendas](#5--crm-kanban-tabela-virtualizada-e-gestão-de-vendas)
6. [☁️ Cloud Sync, Checkpoints e Backup Automático](#6--cloud-sync-checkpoints-e-backup-automático)
7. [📥 Importação, Exportação Multi-Formato & VCF](#7--importação-exportação-multi-formato--vcf)
8. [🛡️ Segurança, Auditoria e Controle de Acesso](#8--segurança-auditoria-e-controle-de-acesso)
9. [🩺 Diagnóstico, Telemetria e Monitor de Saúde](#9--diagnóstico-telemetria-e-monitor-de-saúde)

---

## 🔍 1. CENTRAL DE MINERAÇÃO, VARREDURA E CAPTURA DE LEADS

- **Motor de Busca Multi-Mecanismo (`searchEngines.ts`)**:
  - Rotação automática de motores de busca comerciais e plataformas de anúncios.
  - Alternância inteligente de User-Agents e leituras dinâmicas para contorno de bloqueios.
- **Search Brain V2 (`smartSearchOrchestrator.ts`)**:
  - Cérebro de Busca Comercial Autônomo com expansão automática de modelos, marca e sinônimos (`expandSeedModelSynonyms`).
  - Radares de Repasse Comercial e Renovação de Frotas para detecção de liquidações, motivos de mudança e desmobilização de ativos.
  - Orquestração por intenção comercial (`vendo`, `procuro`, `urgente`, `abaixo da FIPE`, `repasse`, `renovacao_frota`, `direto proprietario`).
  - Motor de Descoberta Automática de Novos Termos em Snippets (`discoverAndLearnNewTermsFromSnippets`) que registra gírias e apelidos diretamente no Keyword Brain.
  - Deduplicação inteligente multi-critério (Telefone, WhatsApp, URL, CNPJ, texto) e priorização dinâmica por histórico de plataforma e intenção.
- **Opportunity Engine V2 (`opportunityEngine.ts`)**:
  - Transformação automática de anúncios brutos em oportunidades qualificadas de alto valor de fechamento.
  - **Radar de Urgência Extrema**: Identifica anúncios urgentes ("motivo viagem", "preciso vender hoje", "liquidando", "desapego").
  - **Radar Abaixo da FIPE / Desconto**: Detecta e calcula descontos percentuais e valores abaixo do mercado.
  - **Radar de Queda de Preço**: Monitora diminuições no valor dos veículos no histórico (`historyChanges`).
  - **Radar de Renovação de Frota**: Identifica desmobilização corporativa e substituição de ativos de transportadoras.
  - **Radar Empresarial (Expansão vs Encerrando Atividades)**: Distingue empresas em expansão de frota vs fechamento/liquidação.
  - **Timeline dos Anúncios**: Acompanhamento cronológico completo (primeiro e último avistamento, frequência de atualização e histórico de preços).
- **Cadence Pipeline Engine V2 (`cadenceEngine.ts`)**:
  - Sequenciamento e acompanhamento automatizado em 3 etapas (Dia 1: Primeiro Contato & Pitch Inteligente, Dia 2: Reforço de Valor & Proposta Direta, Dia 3: Fechamento & Condição de Repasse).
  - Rastreamento cronológico de status e agendamento automático de próximas abordagens (`cadenceStep`, `lastCadenceSentAt`, `nextCadenceScheduledAt`).
- **Conversion & ROI Analytics Engine V2 (`conversionRoiEngine.ts`)**:
  - Cálculo em tempo real do retorno sobre investimento (ROI %) por palavra-chave, canal e plataforma de busca.
  - Indicadores financeiros e comerciais: Taxa de Resposta (%), Custo Estimado por Lead (R$), Faturamento Estimado (R$), Rendimento por Termo de Mineração.
- **CRM Webhook Sync Engine V2 (`webhookSyncEngine.ts`)**:
  - Disparo resiliente de notificações JSON em tempo real para N8N, Make, Zapier, Pipedrive, RD Station e CRMs proprietários.
  - Suporte a filtros por score comercial mínimo, eventos de mineração, alteração de status Kanban e fechamento de vendas.
- **Dossiê Executivo por IA Gemini 3.6 Flash (`ExecutiveDossierModal.tsx`)**:
  - Geração de relatórios gerenciais e diretrizes táticas de negociação por IA com análise SWOT da carteira, avaliação do poder de barganha e ROI estimado.
- **Calculadora de Frete & Margem Comercial (`FreightAndBrokerageCalculatorModal.tsx`)**:
  - Estimativa instantânea de frete rodoviário por KM entre estados (SP, MG, PR, SC, RS, GO, MT) e cálculo de comissão de intermediação.
- **Exportador Inteligente VCF & Excel (`SmartExcelExportModal.tsx`)**:
  - Exportação direta de carteira de contatos para agenda de celular/WhatsApp em formato `.vcf` e planilhas formatadas `.xls`.
- **AI Copilot Negotiation Script Engine (`aiNegotiationCopilot.ts`, `AiCopilotNegotiationModal.tsx`)**:
  - Assistente tático impulsionado por Gemini 3.6 Flash para quebra de objeções de preço no WhatsApp ("Preço alto", "Comprador concorrente", "Pagamento parcelado", "Recusa de repasse").
  - Geração de argumentos comerciais com botão de cópia instantânea e envio direto para WhatsApp Web.
- **Geo-Location Density Heatmap (`GeoDensityHeatmapModal.tsx`)**:
  - Visualização gráfica da densidade de frotas e ativos pesados por Estado (SP, MG, PR, SC, RS, GO, MT, BA, etc.) e macro-regiões do Brasil.
  - Indicadores de urgência e FIPE por estado com atalho para filtragem direta na tabela de leads.
- **Scraping & Mining Speed Accelerator Engine (`scrapingSpeedAccelerator.ts`, `extractionWorkerManager.ts`)**:
  - Processamento em lotes paralelos não-bloqueantes com rotação dinâmica de User-Agents e concorrência adaptativa por latência.
  - Retentativa inteligente de requisições com recuo exponencial e eliminação de travamentos de interface.
- **Descoberta Inteligente de Contatos (`deepContactDiscovery.ts`)**:
  - Busca automática em background quando anúncios possuem dados de contato omissos ou parciais.
  - Varredura em tempo real no Google, Google Maps, Site Oficial, Instagram, Facebook, LinkedIn e Receita Federal (CNPJ).
- **Cruzamento Automático & Fusão Multi-Plataforma (`leadMergerEngine.ts`)**:
  - Unificação automática de anúncios do mesmo vendedor veiculados na OLX, Mercado Livre, Facebook, Google Maps e sites proprietários.
  - Vínculo transparente de todas as fontes (`allPlatforms`, `allWebPageUrls`, `socialLinks`) em um único cadastro limpo.
- **Monitor de Alterações de Anúncios**:
  - Registro de histórico de alterações de preço (alertas de queda de valor, "Abaixo da FIPE", "Repasse"), mudanças em snippets/status ou encerramento de anúncio (`historyChanges`).
- **Score Comercial Unificado (0-100)**:
  - Algoritmo de inteligência comercial que ranqueia leads com base no valor real de fechamento (validação de WhatsApp, presença de CNPJ/Empresa, e-mail, redes sociais, recência do anúncio e urgência comercial).
- **Eliminador de Lixo & Ruído Comercial**:
  - Filtro em tempo real que purga telefones falsos/repetidos, anúncios finalizados, manuais em PDF, vagas de emprego e conteúdos irrelevantes.
- **Scanner Geográfico Google Maps (`GoogleMapsScanner.tsx`)**:
  - Varredura por raio em quilômetros, cidades, bairros e estados brasileiros.
  - Captura direta de locais comerciais, transportadoras, oficinas, frotistas e concessionárias.
- **Mapa Interativo de Densidade (`LeafletScannerMap.tsx`)**:
  - Exibição de pins geolocalizados de cada lead minerado no mapa interativo.
  - Agrupamento visual por regiões com maior densidade de oportunidades.
- **Extrator Regex de Alta Precisão (`phoneExtractor.ts`)**:
  - Extração automática de telefones, e-mails, CNPJ, CPF, nomes de responsáveis e ofertas.
  - Validador nacional de DDD e filtro de operadora.
  - Identificação e separação automática entre números fixos e WhatsApps válidos.

---

## 🧠 2. CENTRAL DE INTELIGÊNCIA DE TERMOS & APRENDIZADO (KEYWORD BRAIN)

- **Banco de Termos Interativo (`TermDatabaseTable.tsx`)**:
  - Cadastro, ativação, pausa e gerenciamento de palavras-chave.
  - Histórico de execuções, total de leads encontrados, WhatsApps capturados e taxa de conversão.
  - Edição direta de categoria comercial, estado alvo (UF) e status do termo.
- **Gerador Multimodo de Termos IA (`AiTermGeneratorTab.tsx`)**:
  - 9 modos de geração com Gemini 3.6 Flash: *Conservador*, *Comercial*, *Long Tail*, *Regional*, *Similaridade*, *Competidores*, *Tendências*, *Livre* e *Nicho Profundo*.
- **Catálogo de Nichos Nacionais B2B (`NicheCatalogTab.tsx`)**:
  - Coleção pré-configurada de termos do mercado brasileiro: Caminhões, Implementos, Máquinas Agrícolas, Linha Amarela, Autopeças Pesadas, Oficinas Diesel, Borracharias e Guinchos.
- **Motor de Expansão Combinatória (`CombinatorialExpanderTab.tsx`)**:
  - Permutação em matriz combinatória: *Marcas x Modelos x Intenções x Estados x DDDs*.
  - Geração instantânea de centenas de variações de busca sem redundância.
- **IA Anti-Ruído & Bloqueador de Termos (`DiscoveryAndAntiNoiseTab.tsx`)**:
  - Identificação de termos emergentes encontrados durante as varreduras.
  - Gerenciador de termos negativos para barrar automaticamente contatos irrelevantes (PDFs, editais, vagas de emprego).
- **Motor de Cruzamento Simultâneo (`CrossScannerTab.tsx`)**:
  - Cruzamento em tempo real de Intenção (Venda/Compra/Troca/Aluguel) x Perfil do Vendedor (Particular/Revenda/Frotista) x Categoria x UF.
- **Análise de Tendências & Cobertura do Mapa (`TrendsAndAnalyticsTab.tsx`)**:
  - Gráficos de crescimento diário de leads e WhatsApps capturados (`Recharts`).
  - Dicionário semântico de sinônimos comerciais (ex: *Scania 113* = *Bicudo*, *Scanião*).
- **Simulador Pré-Execução & Laboratório IA (`SimulatorAndLabTab.tsx`)**:
  - Estimativa do volume de leads, números válidos, tempo de execução e custo computacional antes de rodar a campanha.
  - Laboratório de teste de estratégias para qualquer nicho submetido.

---

## 🤖 3. INTELIGÊNCIA ARTIFICIAL & QUALIFICAÇÃO AUTOMÁTICA (GEMINI 3.6 FLASH)

- **Qualificação e Scoring de Leads (`aiQualifier.ts`)**:
  - Pontuação automática de conversão (0 a 100) baseada no perfil e texto do anúncio.
  - Classificação de temperatura (*Quente*, *Morno*, *Frio*).
  - Inferência automática do porte da empresa e urgência de negociação.
- **Gerador de Pitches Persuasivos**:
  - Criação de abordagens comerciais sob medida para cada lead capturado com base no perfil do produto/serviço.
  - Variações de tom: Consultivo, Direto, Negociação Urgente e Parceria B2B.

---

## 💬 4. AUTOMAÇÃO WHATSAPP & DISPARO INTELIGENTE EM SEGUNDO PLANO

- **Disparador em Segundo Plano (`BackgroundAutoSender.tsx`)**:
  - Fila de envios com proteção anti-bloqueio e intervalos aleatórios humanizados (ex: 15 a 45s).
  - Rotação de modelos de mensagens e variáveis personalizadas (`{nome}`, `{empresa}`, `{cidade}`).
- **Conexão Baileys / WhatsApp Web (`useWhatsApp.ts`)**:
  - Leitura por QR Code, monitoramento contínuo da conexão e reconexão automática.
  - Limpeza de sessão e gerenciamento de estado do dispositivo.

---

## 📊 5. CRM KANBAN, TABELA VIRTUALIZADA E GESTÃO DE VENDAS

- **Pipeline Kanban de Vendas (`KanbanCrmBoard.tsx`)**:
  - Estágios visuais: *Novo Lead*, *Em Contato*, *Em Negociação*, *Fechado/Ganho* e *Perdido*.
  - Cálculo do valor total em R$ do pipeline e taxa de conversão em tempo real.
  - Mover leads via Drag and Drop ou seletor rápido.
- **Tabela Virtualizada de Alta Performance (`LeadTable.tsx`)**:
  - Renderização fluida de milhares de registros usando `react-window`.
  - Pesquisa instantânea por nome, telefone, cidade, empresa ou palavra-chave.
  - Ordenação multinível, seleção em lote e ações rápidas.
- **Agendador de Follow-up (`LeadFollowUpScheduler.tsx`)**:
  - Criação de lembretes e tarefas de acompanhamento comercial com notificação visual.

---

## ☁️ 6. CLOUD SYNC, CHECKPOINTS E BACKUP AUTOMÁTICO

- **Sincronização em Tempo Real (`firebase.ts`, `useLeadSync.ts`)**:
  - Persistência contínua dos leads, contatos e status no Firebase Firestore.
- **Checkpoints Automáticos (`AutoBackupModal.tsx`)**:
  - Salvamento automático de cópia de segurança a cada 100 novos leads capturados.
  -Restauração de pontos anteriores com 1 clique.

---

## 📥 7. IMPORTAÇÃO, EXPORTAÇÃO MULTI-FORMATO & VCF

- **Smart Excel & CSV (`SmartExcelExportModal.tsx`)**:
  - Exportação formatada de relatórios completos com dados limpos e campos separados.
- **Exportação para VCF / Contatos do Celular (`googleContacts.ts`)**:
  - Geração de arquivos `.vcf` para importação direta na agenda do celular ou Google Contacts com nome e empresa formatados.
- **Importação em Lote**:
  - Importador em massa de listas de palavras-chave e contatos externos via texto ou CSV.

---

## 🛡️ 8. SEGURANÇA, AUDITORIA E CONTROLE DE ACESSO

- **Proteção por PIN / Senha (`SecurityGuardModal.tsx`)**:
  - Bloqueio de tela de exportação e funções sensíveis do sistema.
- **Log de Cópia e Auditoria (`SecurityAccessGuard.tsx`)**:
  - Rastreamento de tentativas de exportação, cópias de contatos e downloads para segurança da informação.

---

## 🩺 9. DIAGNÓSTICO, TELEMETRIA E MONITOR DE SAÚDE

- **Monitor do Sistema & Memória (`SystemHealthMonitorModal.tsx`)**:
  - Diagnóstico em tempo real de consumo de RAM, requisições por minuto e estado da fila.
  - Botão de higienização de memória e purga de registros duplicados sem reiniciar a página.
