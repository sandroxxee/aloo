# Auditoria de Migração — Aloo para WebDev

## Escopo inventariado

O repositório `sandroxxee/aloo` contém um frontend React/Vite extenso, com componentes, hooks, serviços, utilitários, estilos e páginas concentrados em `src/`. O backend atual está centralizado em `server.ts`, com serviços auxiliares em `src/services/`, incluindo IA Gemini, fila de tarefas, WebSocket, integração com WhatsApp e mecanismos de recuperação automática.

## Incompatibilidades e adaptações necessárias

| Área | Módulos de origem | Situação no WebDev | Estratégia de migração |
|---|---|---|---|
| Processo persistente | `server.ts`, `src/services/queue.ts`, `src/services/whatsappAutoHeal.ts` | O modo Autoscale é orientado a requisições e não preserva processos em memória. | Preparar o app para Reserved Hosting e mover rotinas periódicas para Heartbeat quando apropriado. |
| WhatsApp/Baileys | `src/services/whatsapp.ts`, `@whiskeysockets/baileys` | A sessão, QR code e credenciais não podem depender do disco efêmero do contêiner. | Migrar o estado de conexão e as credenciais para persistência gerenciada; validar viabilidade de rede e memória antes de ativar em produção. |
| Persistência local | `server.ts` (`data/client_memory.json`), `sqliteLeads.ts`, arquivos de sessão | O sistema de arquivos do runtime não é fonte de verdade persistente. | Converter dados operacionais em tabelas do banco e arquivos em armazenamento S3; manter cache local apenas como otimização. |
| WebSocket | `server.ts` e `ws` | Requer processo único de longa duração para sessões estáveis. | Manter endpoint no servidor WebDev e ativar Reserved Hosting antes do uso operacional. |
| Backend Express | `server.ts` e rotas `/api/*` | O template já possui Express, OAuth e gateway em `server/_core`. | Integrar rotas novas sem alterar o núcleo do template e preservar o prefixo `/api`. |
| IA Gemini e integrações | `src/services/aiService.ts`, `LocalAiService.ts` | Chaves não podem ser expostas no bundle do navegador. | Mover chamadas sensíveis para o servidor e cadastrar `GEMINI_API_KEY` como segredo. |
| Firebase | `src/services/firebase.ts`, `firebase-applet-config.json` | A configuração pública pode ser exposta, mas dados e regras exigem validação. | Registrar os valores públicos de cliente separadamente, proteger operações privilegiadas no servidor e revisar regras de acesso. |
| Build do navegador | `vite.config.ts`, `src/main.tsx` | O navegador não resolve imports externos bare como `buffer`. | Manter `buffer` fora de `rollupOptions.external` para que o polyfill seja empacotado. |

## Decisão de migração

O frontend pode ser migrado gradualmente para `client/src`, preservando a organização funcional original. O backend precisa ser separado em rotas, serviços e tarefas compatíveis com o runtime WebDev. Funcionalidades que dependem de estado em memória, sessões de WhatsApp, filas contínuas ou WebSocket devem operar somente após a ativação explícita de Reserved Hosting e a substituição da persistência baseada em arquivos.
