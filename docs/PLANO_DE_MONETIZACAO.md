# Estratégia de Monetização SaaS - Minerador de Leads Pro

Esta é a documentação estratégica para transformar o Minerador de Leads em um SaaS (Software as a Service) altamente rentável. O modelo baseia-se em **Tiered Pricing** (Preços por Camadas), alinhando o valor entregue (leads extraídos, automação e inteligência artificial) ao preço pago pelo usuário.

---

## 1. Estrutura de Planos (Tiered Pricing)

### 🟢 Plano Gratuito (Trial / Freemium)
**Objetivo:** Gerar o momento "Aha!" e mostrar o valor da ferramenta.
*   **Limite de Leads:** 50 leads por mês.
*   **Funcionalidades:** Busca manual no mapa, visualização de dados básicos (Nome, Telefone, Endereço).
*   **Restrições:** Sem exportação para CSV, sem Piloto Automático, sem acesso à IA.
*   **Chamada para Ação:** Ao tentar exportar ou ativar o Piloto Automático, exibir modal de "Faça Upgrade".

### 🔵 Plano Starter (Aprox. R$ 97,00 / mês)
**Objetivo:** Focado em autônomos e pequenos vendedores locais.
*   **Limite de Leads:** 2.000 leads por mês.
*   **Funcionalidades:** 
    * Busca com rotação de proxy básica (Smart Backoff).
    * Exportação em CSV/Excel.
    * Acesso ao link direto do WhatsApp por lead.
*   **Suporte:** E-mail (resposta em 48h).

### 🟣 Plano Pro (Aprox. R$ 197,00 / mês) - *Mais Popular*
**Objetivo:** Focado em SDRs, agências e equipes comerciais que precisam de volume.
*   **Limite de Leads:** 10.000 leads por mês.
*   **Funcionalidades:**
    * **Piloto Automático (Radar Autônomo):** O sistema varre múltiplas cidades e nichos em segundo plano.
    * **Pool de Proxies Premium:** Evita bloqueios de taxa (Rate Limit 429) no Google.
    * **Enriquecimento de Dados:** Busca automática de e-mail e website (quando disponíveis).
*   **Suporte:** Chat / Ticket prioritário (resposta em 24h).

### 🟡 Plano Elite / IA (Aprox. R$ 497,00+ / mês)
**Objetivo:** Operações robustas de Outbound, com automação ponta a ponta.
*   **Limite de Leads:** Ilimitado (sujeito à política de uso justo / limites da API).
*   **Inteligência Artificial (Integração Gemini):**
    * **Lead Scoring AI:** A IA analisa a empresa e dá uma nota (Quente/Frio) com base no nicho e dados extraídos.
    * **Gerador de Cold Messages:** A IA redige mensagens personalizadas (WhatsApp/E-mail) para cada lead com base no seu contexto comercial.
*   **Automação de Funil:**
    * Integração com RD Station, HubSpot ou ActiveCampaign via Webhook.
    * Disparos em massa (quando integrado a APIs oficiais de WhatsApp como Z-API ou Evolution API).
*   **Suporte:** Prioritário via WhatsApp e Onboarding dedicado.

---

## 2. Esboço de Arquitetura de Assinaturas (Stripe / Mercado Pago)

Para implementar isso a nível de código de forma segura, o fluxo ideal envolveria:

### A. Banco de Dados (Usuários e Limites)
Cada usuário na sua base de dados (Ex: Firebase ou PostgreSQL) terá um perfil contendo:
*   `stripe_customer_id`: ID do cliente no gateway.
*   `subscription_tier`: 'free' | 'starter' | 'pro' | 'elite'.
*   `leads_mined_this_month`: Contador (zera a cada ciclo de faturamento).
*   `subscription_status`: 'active' | 'past_due' | 'canceled'.

### B. O Fluxo de Compra (Frontend + Backend)
1. **Paywall UI:** No frontend (React), se o usuário clicar no botão de Piloto Automático estando no plano Free, exiba um modal com a tabela de preços.
2. **Checkout:** Ao escolher o Plano Pro, o Frontend chama sua API (Ex: `/api/checkout`).
3. **Sessão:** A API cria uma **Checkout Session** (Stripe) ou **Preference** (Mercado Pago) e retorna a URL.
4. **Pagamento Seguro:** O usuário é redirecionado para a página oficial do gateway para pagar via PIX ou Cartão.

### C. Webhooks (A Mágica da Automação)
Seu servidor precisa ter um endpoint (Ex: `/api/webhooks/stripe`) para receber eventos em tempo real do gateway de pagamento:
*   `checkout.session.completed`: O pagamento foi aprovado. A API atualiza o `subscription_tier` do usuário para `pro`.
*   `invoice.payment_succeeded`: A renovação mensal deu certo, zere o contador `leads_mined_this_month`.
*   `customer.subscription.deleted`: O usuário cancelou, retorne-o para o plano `free`.

### D. Controle de Funcionalidades (Feature Flags)
No Frontend, você usará os dados do usuário para bloquear a interface:
```typescript
// Exemplo Conceitual
const handleStartAutoPilot = () => {
  if (user.subscription_tier === 'free' || user.subscription_tier === 'starter') {
    showPaywallModal("O Piloto Automático é exclusivo do Plano Pro.");
    return;
  }
  startAutoPilotEngine();
};
```

---

## 3. Roteiro de Implementação (Próximos Passos)

Caso deseje transformar esse plano em código na aplicação, a sequência de desenvolvimento seria:
1.  **Autenticação & Banco de Dados:** Retomar a integração com Firebase ou configurar PostgreSQL para gerenciar Contas de Usuários.
2.  **Dashboard de Faturamento (Billing):** Criar a tela "Meu Plano" onde o usuário vê quantos leads já usou no mês.
3.  **Backend Express:** Configurar um servidor (Node.js/Express) seguro para não expor as chaves secretas do Stripe/Mercado Pago.
4.  **Integração IA:** Adicionar a rota do Google Gemini para o plano Elite (onde a IA redige a mensagem personalizada para o vendedor enviar ao Lead).
