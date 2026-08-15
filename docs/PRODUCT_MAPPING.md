# MAPEAMENTO GERAL DO SISTEMA - ASSET INTELLIGENCE ENTERPRISE

Este documento detalha toda a estrutura atual (Menus, Funções, Sub-funções, Visual e Temas) para servir como guia arquitetural para a versão final da plataforma.

## 1. Identidade Visual e Temas
- **Cores Principais:** Indigo (primária), Slate (neutros/fundos), Rose (alertas/erros), Emerald (sucesso/lucro).
- **Modo Noturno (Dark Mode):** Suporte nativo com fundos em `slate-950` e bordas em `slate-800`.
- **Estilo de Interface:** Design minimalista, bordas arredondadas (`rounded-xl` / `rounded-2xl`), sombras suaves (`shadow-sm`, `shadow-xl`), e botões responsivos com feedback ao passar o mouse (`hover`).

## 2. Menu Lateral (Navegação Principal)
O menu lateral é o coração da plataforma, dividido nos seguintes módulos:

### 2.1. 📊 Dashboard (Visão Geral)
* **Objetivo:** Visão analítica de performance comercial.
* **Sub-abas:**
  - **Overview:** Resumo rápido de leads, taxa de conversão e leads quentes.
  - **Cérebro IA:** Insights automáticos e métricas avançadas processadas pelo Gemini.
  - **Relatórios (ROI):** Gráficos de investimento vs. retorno.
  - **Ferramentas Extras:** Calculadoras e utilitários rápidos.

### 2.2. 🔍 Mineração de Leads (Radar)
* **Objetivo:** O motor de busca autônomo (Search Brain V2).
* **Funcionalidades:**
  - Busca de veículos/imóveis com filtros de urgência (Abaixo da FIPE, Repasse).
  - Web Scraping em paralelo (OLX, Mercado Livre, Webmotors, etc).
  - **Extrator de Contatos:** Descobre telefones e CNPJs em tempo real.
  - **Identificador de Lixo:** Bloqueia spam e anúncios sem relevância.

### 2.3. 🗂️ CRM & Pipeline Kanban
* **Objetivo:** Gestão de vendas (Arrastar e soltar).
* **Colunas:** Novo Lead ➡️ Em Contato ➡️ Em Negociação ➡️ Ganho ➡️ Perdido.
* **Funcionalidades Ocultas:**
  - Cálculo de comissão/valor em negociação em tempo real.
  - Acesso ao "Dossiê Executivo por IA" de cada lead.

### 2.4. 📍 Mapa de Calor (Geo-Radar)
* **Objetivo:** Visão geográfica e densidade de oportunidades.
* **Funcionalidades:** Renderiza no Google Maps/Leaflet de onde estão vindo os leads (por estado e cidade).

### 2.5. 💬 Disparador WhatsApp (Auto Sender)
* **Objetivo:** Máquina de automação de cadência.
* **Sub-abas:**
  - **Campanhas (Sender):** Criação de texto, anexos, SpinTax (variáveis dinâmicas de IA).
  - **Configurações da Fila:** Ajuste de Min/Max delay (Jitter) e Cooldown de segurança (evitar banimento).
  - **Validadores & Anti-bloqueio:** Configurações de proteção do chip.
  - **Respostas Automáticas (Auto Reply):** Bot de atendimento básico.
  - **Grupos:** Extrator de contatos de grupos.

### 2.6. 📧 Disparador de E-mail (Email Dispatcher)
* **Objetivo:** Cold-mailing para leads corporativos.
* **Funcionalidades:**
  - Envio através de Resend, Brevo (Sendinblue), SendGrid.
  - Rotação de texto por IA (SpinTax HTML).

### 2.7. 📱 Disparador de SMS (SMS Dispatcher)
* **Objetivo:** Comunicação direta com o lead offline.
* **Funcionalidades:** Integração nativa com gateways (ex: SMSDev, Twilio).

### 2.8. 🔑 Inteligência de Palavras (Keywords)
* **Objetivo:** Aprender quais termos fecham mais vendas.
* **Funcionalidades:** Monitoramento do Custo por Lead e ROI por palavra-chave pesquisada.

### 2.9. 💼 Marketplace Interno (Vender Leads)
* **Objetivo:** Possibilidade de revender leads qualificados ou encaminhar para corretores/parceiros.

### 2.10. ⚙️ Ajustes e Sistema (Settings)
* **Objetivo:** Painel de controle e integrações.
* **Funcionalidades:**
  - Chaves de API (Gemini, OpenAI, Resend, SMSDev, Evolution API).
  - Ferramentas de Teste (Testar WhatsApp, Testar E-mail, Testar SMS).
  - Backups manuais, Sincronização Cloud, Instalação Windows (PWA/Electron).
  - Monitor de Saúde da Memória (Health Monitor).

## 3. Modais e Componentes Globais (Flutuantes)
- **Modal de Dossiê Executivo:** Análise SWOT, perfil e poder de barganha de uma carteira de leads inteira.
- **Assistente de Negociação Copilot:** Sugere scripts de quebra de objeção durante a negociação.
- **Exportador VCF/Excel Inteligente:** Prepara a lista para importar nos contatos do celular ou para planilhas organizadas.
- **Calculadora de Frete:** Utilitário para calcular logística de compra/venda de veículos.
- **Segurança (Security Guard):** PIN de acesso ou bloqueio de certas ações (como exportar leads).

---
*Este mapeamento servirá como base para as próximas otimizações e simplificações de UX, focando em entregar um produto final limpo, focado e livre de complexidade desnecessária.*
