# Auditoria Visual — Asset Intelligence

## Achados iniciais

| Área | Observação | Prioridade |
|---|---|---|
| Identidade | A interface combina linguagem em português e inglês, enfraquecendo a consistência do produto. | Alta |
| Hierarquia | Chips, estados, métricas e automações usam muitos acentos simultâneos, competindo com a ação principal. | Alta |
| Navegação | A barra superior concentra ícones e rótulos em espaço reduzido; no móvel, a navegação perde contexto. | Alta |
| Radar | Filtros, controles e automações são visualmente densos e têm peso semelhante. | Alta |
| Estados vazios | O dashboard tem grandes zonas vazias sem orientação suficiente sobre o próximo passo operacional. | Média |
| Modal de integração | Abre sobre o dashboard e domina a primeira leitura visual; precisa de contexto e gatilho mais claro. | Média |
| Mobile | A grade se adapta, mas cabeçalhos, ações e filtros ficam compactos demais para leitura e toque confortáveis. | Alta |

## Direção proposta

O painel será consolidado como um **centro de inteligência operacional**: superfícies azul-marinho profundas, um acento principal de inteligência em azul elétrico, verde exclusivo para ações e sucesso, e cores de alerta reservadas para risco. O texto de interface será priorizado em português, com termos em inglês apenas quando forem nomes de protocolo ou integração.

## Passagem de validação

| Fluxo | Resultado observado | Ação |
|---|---|---|
| Abertura do dashboard | O modal de webhook não aparece mais automaticamente. | Correção validada. |
| Navegação superior | A nomenclatura foi localizada e permanece legível no desktop. | Validar a faixa horizontal no móvel. |
| Leads | A tabela voltou a carregar após alinhar `react-window` à API de virtualização usada pelo componente. A tela vazia agora é informativa, mas ainda mistura nomenclatura em inglês e muitos filtros simultâneos. | Simplificar a linguagem e dar hierarquia aos controles. |
| Pipeline | O Kanban renderiza, mas usa estágios em inglês e dá grande destaque a uma zona destrutiva de descarte, mesmo quando não existem cartões. | Localizar os estágios, reduzir o peso do descarte e orientar o estado vazio. |
| Radar | O Radar agora inicia sem empresas, avaliações ou contatos pré-montados e comunica uma cadência segura sem rotação de IP. A tela ainda concentra extração em lote, modo autônomo, estados, cidades, filtros e resultados na mesma leitura. | Dividir a configuração em etapas de orientação progressiva. |
| Inteligência | O banco de termos está funcional, mas apresenta muitos atalhos concorrentes, filtros e tabelas densas na mesma visualização. | Agrupar ações raras em menu secundário e reduzir a terminologia em inglês residual. |
| Mensagens | O simulador deixa o modo offline visível, porém alterna português e inglês e exibe navegação de automação ampla ao mesmo tempo que o compositor. | Localizar os rótulos, priorizar o compositor e manter o indicador de simulador sempre explícito. |

| Tema | A alternância claro/escuro continua funcional; a prévia foi restaurada ao tema escuro padrão após a verificação. | Manter contraste mínimo e foco visível nos dois temas. |
| Configurações | A aba de proxy não aparece mais na navegação administrativa. O painel de agendamento, porém, mostra histórico, destinatários e alertas ativos apesar de a base estar vazia e de as integrações não estarem comprovadamente configuradas. | Trocar informações de demonstração por estados neutros e instruções de configuração. |

> A validação posterior confirmou a navegação de Configurações sem aba de proxy, com agendador pausado, sem histórico de execução e sem alertas previamente ativos.
| Mobile | A navegação horizontal e os controles de toque aparecem corretamente em 375 px. O dashboard mantém boa legibilidade, mas ainda apresenta rótulos em inglês na área de análise de dados. | Localizar o estado de análise e priorizar textos de orientação em português. |

> A validação posterior confirmou a localização do estado de análise e a remoção visual do controle de rotação de mecanismo na área de mineração.

> A recarga da prévia confirmou que o Radar abre com **0 empresas encontradas** e sem avaliações ou contatos gerados localmente. A próxima validação deve cobrir os fluxos acionados por cidade, lote e modo autônomo.

> O painel de resultados do Radar agora orienta o usuário a iniciar uma busca real e diferencia visualmente carregamento, ausência de contatos e falha de consulta, sem preencher empresas artificiais.

> Após a remoção do modal de proxy do aplicativo principal, a prévia foi recarregada e o console permaneceu sem erros de execução.

## Passagem de validação

| Fluxo | Resultado observado | Ação |
|---|---|---|
| Abertura do dashboard | O modal de webhook não aparece mais automaticamente. | Correção validada. |
| Navegação superior | A nomenclatura foi localizada e permanece legível no desktop. | Validar a faixa horizontal no móvel. |
| Leads | A transição para o componente carregado sob demanda apresentou tela vazia no navegador de auditoria. | Investigar o fallback de carregamento e assegurar estado visual de espera/erro. |
