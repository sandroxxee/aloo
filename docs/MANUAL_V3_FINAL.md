# Manual de Entrega - Asset Intelligence Enterprise V3.1

## 🚩 Checklist de Entrega P0 (Crítico - Bloqueio de Banimento)
- [x] **Rate Limit Hourly**: Travado em 20 envios por hora por instância.
- [x] **Jitter Pro**: Delay randômico entre 90s e 240s por mensagem.
- [x] **Presença Real**: Simulação de `composing` por 4 segundos antes de disparar.
- [x] **Time Window**: Disparos permitidos apenas entre 08h e 18h (America/Sao_Paulo).
- [x] **LID Resolution**: Prioridade total ao LID via `whatsappNumbers` para evitar flags de "número desconhecido".

## 🚀 Checklist de Entrega P1 (Conversão & Inteligência)
- [x] **Semantic Spintax**: Reescrita de mensagem via Gemini 3.6 Flash para cada lead.
- [x] **Detector de Lojista**: Identificação de vendedores com 3+ anúncios ativos (Prioridade: Oferta de Ferramenta).
- [x] **Stop on Reply**: Interrupção imediata da campanha quando o lead responde (Reply Webhook Stop).
- [x] **Blacklist Semântica**: Descarte automático de termos como "leilão", "sinistro", "sucata".

## 🛠️ Checklist de Entrega P2 (Estrutura & Backend)
- [x] **Normalize BR Universal**: Correção de 12 para 13 dígitos (+9) automática.
- [x] **Persistent Queue**: Fila salva em `queue_state.json` para resiliência a reinícios de servidor.
- [x] **Tool Buyer logic**: Filtragem inteligente para oferecer a automação apenas a perfis compatíveis.

---
**Status Final:** Sistema atualizado para nível Enterprise V3.1. Taxa de entrega esperada: >85%. Risco de banimento: Mínimo (Humanizado).
