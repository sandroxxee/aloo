# 📑 Manual de Funcionamento e Arquitetura do Asset Intelligence Enterprise

Este documento descreve detalhadamente o ciclo de vida completo do lead dentro da plataforma **Asset Intelligence Enterprise**: desde a busca autônoma de mercado, passando pela higienização de números, classificação inteligente por Inteligência Artificial (Intenção de Venda/Compra), CRM e enriquecimento, até o disparo automatizado e ultra-personalizado no WhatsApp.

---

```
                       FLUXO DE DADOS ENTRADA-SAÍDA (PIPELINE)
                      
   [ 🔍 Varredura / Busca ] ──► [ Search Brain V2 (Sinônimos & Termos) ]
                                                │
                                                ▼
   [ 🛡️ Higienização e Filtros ] ◄─ [ Deep Contact Discovery (CNPJ & Redes) ]
                │
                ▼
   [ 🧠 IA de Qualificação ] ──► Classifica: Compra / Venda / Porte / Score
                                                │
                                                ▼
   [ 🗂️ CRM & Memória Cloud ] ◄─► Sincronização Firestore & Histórico de Preços
                │
                ▼
   [ 💬 Disparador de Mensagens ] ◄─ Gemini IA (Gera o Pitch Perfeito com Spintax)
                │
                ▼
   [ 🚀 Evolution API / Oficial ] ──► Disparo Seguro com Delays Humanizados
```

---

## 🔍 1. Varredura, Inteligência de Busca e Mineração de Leads

A etapa de mineração foi desenhada para atuar como um cérebro autônomo que não depende apenas de palavras-chaves engessadas digitadas pelo usuário.

### A. Search Brain V2 (`smartSearchOrchestrator.ts`)
* **Expansão de Sinônimos e Termos (`expandSeedModelSynonyms`)**: Ao buscar por termos do setor de transporte pesado como `"Volvo FH 540"`, o algoritmo expande as buscas automaticamente para sinônimos comerciais relacionados, tais como `"FH 540 6x4"`, `"FH engatado"`, `"Volvo teto alto"`, cobrindo lacunas de anúncios informais.
* **Aprendizado por Snippet (`discoverAndLearnNewTermsFromSnippets`)**: Conforme varre a web, o orquestrador lê os anúncios retornados e aprende novas gírias de vendas ou siglas do mercado (ex: *"repasse"*, *"com dívida"*, *"renovação de frota"*, *"único dono"*) para retroalimentar as próximas buscas em tempo real.
* **Detecção de Oportunidades Especiais**: Termos de urgência extrema como *"torro"*, *"urgente"*, *"abaixo da tabela"* ou *"motivo de mudança"* são imediatamente etiquetados com alta prioridade de abordagem.

### B. Scraping Adaptativo e Paralelismo (`scrapingSpeedAccelerator.ts` & `extractionWorkerManager.ts`)
* **Algoritmo de Concorrência por Latência**: O robô mede o tempo de resposta das fontes de dados e ajusta o número de requisições simultâneas dinamicamente para maximizar a velocidade sem sofrer bloqueios de IP.
* **Rotação de User-Agents**: Utiliza uma lista rotativa de alta entropia contendo navegadores reais (Windows, macOS, Android, iPhone) para garantir anonimato completo durante as varreduras de mercado.

---

## 🧽 2. Unificação, Higienização de Contatos e Regras de Números

Após capturar um anúncio bruto, o Asset Intelligence inicia o processo de purga de ruídos e enriquecimento de dados.

### A. Validação Estrutural e Remoção de Lixo Comercial
* O sistema purga automaticamente telefones inválidos, números de SAC (0800), e-mails de suporte, manuais em PDF de montadoras, vagas de emprego e spam que não tenham valor comercial.
* **Deep Contact Discovery (`deepContactDiscovery.ts`)**: Se um anúncio de alta relevância (como frotas de caminhões) não possui telefone visível, o motor inicia uma busca paralela em background no Google Maps, redes sociais (Instagram, Facebook, LinkedIn) e na Receita Federal (via CNPJ do vendedor) para descobrir o contato real do decisor.

### B. Regras Estritas de Números de Telefone para WhatsApp
1. **Limpeza de Caracteres**: Remove parênteses, traços, espaços e códigos de país informais. Exemplo: `+55 (11) 98765-4321` vira `5511987654321`.
2. **Tratamento do Nononodígito Brasileiro**:
   * O sistema analisa o DDD do número. Se for menor ou igual a `27` (Regiões Sul, Sudeste e parte do Centro-Oeste) ou específico para celulares de 9 dígitos, aplica as validações recomendadas pelas operadoras.
3. **Conversão para o Sufixo do Protocolo do WhatsApp**:
   * Para disparos via **Evolution API** ou **WhatsApp Oficial**, todos os números precisam ser roteados na formatação oficial da Meta/Baileys.
   * O Asset Intelligence garante que todos os números de destino sejam sanitizados e terminem estritamente com `@s.whatsapp.net` (Ex: `5511987654321@s.whatsapp.net`), eliminando erros de digitação e falhas no envio em massa.

### C. Lead Merger Engine (`leadMergerEngine.ts`)
* Se um mesmo vendedor publica vários anúncios diferentes (por exemplo, um cavalo mecânico na OLX, uma carreta no Mercado Livre e peças no Facebook), o motor cruza os telefones ou nomes de usuário e funde todos os anúncios em um **Cadastro de Lead Único**.
* O cadastro centralizado lista todas as plataformas nas quais o vendedor está ativo (`allPlatforms`), links sociais e históricos de alteração de preço.

---

## 🧠 3. Classificação e Qualificação por IA (Vende, Compra ou Porte)

Uma das maiores dores da inteligência comercial é filtrar parceiros reais de curiosos ou atravessadores. O Asset Intelligence resolve isso utilizando a inteligência do **Gemini** (`gemini-1.5-flash`) acoplada ao pipeline de triagem.

### A. Intenção Comercial do Lead (`aiQualifier.ts` & `leadCategoryClassifier.ts`)
A IA lê o conteúdo, o título e as descrições dos anúncios minerados e responde com precisão:
* **"Vendedor Direto"**: Proprietário querendo desmobilizar ou vender um ativo rapidamente.
* **"Comprador Ativo / Frotista"**: Empresas ou frotistas buscando agregar caminhões ou comprar peças em lotes.
* **"Lojista / Repasse"**: Revendedores que vendem abaixo do valor de mercado para desocupar pátio.
* **"Intermediário / Corretor"**: Corretores de caminhões com margem para comissões.

### B. Porte do Negócio & Perfil
* Classifica o lead de acordo com o vocabulário e ativos detectados: **Microempreendedor** (autônomo), **Pequeno/Médio Transportador** ou **Grande Transportadora (Frota Enterprise)**.

### C. Score Comercial Unificado (0 a 100)
A plataforma calcula uma nota dinâmica para cada oportunidade com base nos seguintes pesos:
* **Possui WhatsApp Verificado**: +30 pontos.
* **Anúncio de Empresa com CNPJ Ativo**: +25 pontos.
* **Nível de Urgência de Venda/Compra Detectado**: +25 pontos.
* **Presença de Redes Sociais e E-mail**: +20 pontos.

---

## 🗂️ 4. CRM, Segmentação de Leads e Memória Permanente

Após ser minerado, higienizado e qualificado pela inteligência artificial, o lead é catalogado no ecossistema de dados.

### A. Pipeline Kanban de Vendas (`KanbanCrmBoard.tsx`)
* Os leads entram automaticamente nas colunas dinâmicas do Kanban: **Novo Lead** ➔ **Em Contato** ➔ **Em Negociação** ➔ **Fechado/Ganho** ou **Perdido**.
* O valor estimado em R$ de cada oportunidade é somado em tempo real no topo de cada coluna, permitindo uma visão clara do funil de vendas ativo.

### B. Memória de CRM e Sincronização Cloud (Firebase Firestore)
* **Sincronização em Tempo Real**: Evita a perda de dados caso o navegador seja fechado ou o cache limpo. O backup salva as informações completas no banco de dados Firestore.
* **Histórico de Monitoramento de Preço (`hasPriceDrop`)**: O sistema acompanha se o vendedor alterou o valor do anúncio (sinal clássico de necessidade de liquidez rápida) e registra no histórico de alterações do lead.

---

## 💬 5. Disparador de Mensagens e IA Copywriter de Alta Conversão

Quando o operador decide iniciar os disparos em massa ou individuais na aba **Zap**, a plataforma aciona o seu estágio mais avançado de engenharia: a geração dinâmica do **Pitch de Vendas Perfeito**.

### A. Personalização Extrema por IA (A Abordagem "Zero Spam")
Em vez de disparar uma mensagem genérica e engessada que causa bloqueios de chips, o **Copilot do Gemini 3.6 Flash** gera a abordagem lendo toda a memória acumulada do lead:

1. **Nome do Lead**: Se o nome do lead foi verificado no anúncio ou no WhatsApp, ele é chamado pelo nome diretamente na abertura.
2. **Intenção Comercial**:
   * Se o lead foi classificado como **Vendedor**, a IA cria um pitch focado em: *"Tenho interesse no seu anúncio do [Item] publicado em [Plataforma], gostaria de fazer uma oferta"* (Barganha ou Parceria de Venda).
   * Se o lead foi classificado como **Comprador**, o pitch foca em: *"Consigo fornecer frotas e peças com valores diferenciados direto de repasse para o seu perfil comercial, quer analisar a tabela?"*.
3. **Urgência e Psicologia de Vendas**: Se o robô detectou pressa ou "abaixo da FIPE" no anúncio, o pitch utiliza gatilhos sutis de velocidade de transação e pagamento à vista.

### B. Engenharia Antibanimento e Spintax
* **Geração de Spintax**: O editor de mensagens e a IA estruturam as frases em blocos de alternativas. Exemplo: `{Olá|Oi|Como vai}, {tudo bem|tudo certo}? {Vi|Analisei} seu anúncio do...`. Cada disparo assume uma combinação única de caracteres, impedindo que os algoritmos de detecção do WhatsApp identifiquem comportamento robótico em massa.
* **Delays Humanizados**: O motor de envio (`BackgroundAutoSender.tsx`) insere intervalos randômicos variáveis (ex: de 15 a 45 segundos) entre cada balão de mensagem e digitação simulada.

### C. Roteamento Multicanal (Gateways de Envio)
A plataforma permite escolher três canais ativos para realizar os disparos em segundo plano:
1. **Modo Simulador**: Simula os disparos diretamente no servidor para fins de testes, auditoria e aquecimento sem risco físico aos chips.
2. **Evolution API**: Integração completa baseada no motor Baileys. Suporta envio de textos estruturados, mídias ricas (imagens, vídeos) e **gravação de áudio simulada** (onde um arquivo de voz `.ogg/.opus` é entregue como se tivesse sido gravado na hora pelo microfone do operador).
3. **WhatsApp Oficial (Meta Cloud API)**: O canal definitivo para operações corporativas, oferecendo taxa de entrega de 100% e proteção absoluta contra banimentos de contas corporativas.

---

Com este fluxo integrado, o **Asset Intelligence Enterprise** deixa de ser uma simples ferramenta de spam e torna-se uma plataforma unificada de inteligência comercial de ponta a ponta, projetada especificamente para acelerar transações no mercado corporativo e de veículos pesados.
