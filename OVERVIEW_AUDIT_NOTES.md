# Auditoria da Visão Geral — notas de trabalho

## Mapeamento inicial

| Bloco | Controles e comportamento observado |
|---|---|
| Navegação interna | Visão Geral, Análises e Mais opções alternam as subáreas do dashboard. |
| Ações rápidas | Abre somente a Calculadora de Frete & Corretagem. |
| Resumo | Mostra leads, termos e status atual da operação, além de quatro métricas de sessão. |
| Operação | Iniciar/Pausar/Retomar mineração, pular termo, reiniciar fila, som e console de logs. |
| Ritmo | Seletor de velocidade e botão Salvar; o seletor atual apresenta seis perfis. |
| Filtros | DDD/localidade, celular/WhatsApp, CNPJ, e-mail e motor especializado. |
| Automação | Modo determinístico, busca profunda, expansão geográfica e expansão por IA. |
| Dados | Prévia de oportunidades com ligação para Leads e estado vazio claro. |
| Inteligência | Integridade de dados e análise comercial dependente de pelo menos cinco leads verificados. |

## Achados iniciais

1. O painel operacional concentra muitos controles de mesmo peso visual, principalmente em mobile.
2. Ação Rápida possui um único item e pode ser reposicionada como atalho contextual em vez de menu principal.
3. Velocidade possui perfis “Hyper Turbo”, “Turbo” e “Rápido”, além de “Salvar” separado; a linguagem e a redundância serão avaliadas antes de qualquer remoção.
4. Os quatro controles de automação ficam sempre visíveis apesar de serem avançados, o que compete com a ação principal de mineração.

## Subáreas navegadas

| Subárea | Estado observado | Leitura para simplificação |
|---|---|---|
| Análises | Exibe indicadores, gráficos, funil, mapa e agendador mesmo com zero leads. | Sem dados, muitos gráficos vazios competem com a orientação principal; recomenda-se um estado único orientativo e revelar painéis após dados reais. |
| Mais opções | Reúne backup, exportação JSON, diagnóstico, manual, rebuild e lembretes. | São utilidades administrativas; não precisam ocupar a navegação de primeiro nível da Visão Geral. |

## Funções verificadas visualmente

- O menu Ações Rápidas abre a Calculadora de Frete & Corretagem.
- A subárea Análises abre corretamente e mantém seus controles de filtros, gráficos e lembretes acessíveis.
- A subárea Mais opções abre corretamente e apresenta backup, exportação, diagnóstico, ajuda/rebuild e lembretes.

## Teste de controles locais

- O seletor de DDD/localidade atualizou corretamente de `ALL` para `SP` no cabeçalho do painel, sem iniciar busca externa.
- O painel exibe simultaneamente filtro de DDD, quatro filtros rápidos e quatro automações, reforçando o achado de excesso de controles visíveis no primeiro nível.
- O filtro de contato alternou visualmente de `Todos` para `Só Whats`; o filtro de DDD foi restaurado para `ALL` após a validação.
- O console de atividades abriu e fechou corretamente, sem alterar a operação; quando vazio, adiciona uma grande área técnica com pouca informação acionável.

## Recomendações objetivas

| Prioridade | Ação sugerida | Motivo |
|---|---|---|
| Alta | Manter visíveis somente `Iniciar mineração`, localidade/DDD e os filtros de contato mais usados. | Ação principal e direcionamento ficam claros no primeiro olhar. |
| Alta | Mover `Pular`, `Reiniciar`, som e logs para um menu “Controles da operação”. | São ações secundárias; hoje ocupam espaço ao lado da ação principal. |
| Alta | Trocar os quatro botões de automação por uma seção recolhível “Opções avançadas”. | Evita que Determinístico, Profundo, Geo e IA disputem atenção antes da mineração começar. |
| Alta | Retirar o botão separado `Salvar` do seletor de velocidade e aplicar a alteração imediatamente, com uma confirmação discreta. | Elimina uma etapa redundante. |
| Média | Reduzir os perfis visíveis de velocidade para `Rápido`, `Padrão` e `Seguro`; deixar perfis extremos fora da interface principal. | A nomenclatura atual é técnica e incentiva configurações agressivas. |
| Média | Reposicionar Ações Rápidas, que hoje contém só a calculadora, para Mais opções ou como atalho na própria área de ferramentas. | Um menu de primeiro nível com apenas uma ação adiciona peso de navegação sem ganho proporcional. |
| Média | Na aba Análises, quando não houver dados, mostrar um único estado orientativo em vez de gráficos e métricas zeradas. | O estado vazio fica mais honesto, leve e útil. |
| Média | Manter backup, exportação, diagnóstico, manual e rebuild em Mais opções. | São ferramentas administrativas, não decisões operacionais de rotina. |
| Baixa | Fundir o resumo de operação do topo com o status repetido no Radar quando a mineração estiver parada. | Evita duplicação de “Pausado” sem retirar nenhuma informação. |

## Itens que devem permanecer

- Início/pausa da mineração, localidade/DDD, filtros de contato e acesso a Leads.
- Métricas de base, oportunidades recentes, integridade de dados e acesso às análises.
- Backup, exportação, calculadora, diagnóstico, manual, lembretes e console, porém fora do primeiro nível visual.

## Limite da validação

Foram validados navegação, ações rápidas, subáreas, estado vazio, filtro de DDD, filtro de contato e console. A mineração real, o reinício de fila e o rebuild não foram executados porque podem iniciar buscas externas, modificar a fila ou recarregar a aplicação; precisam de uma decisão explícita para um teste operacional.

## Simplificações aplicadas

- Controles secundários da operação foram movidos para o agrupamento recolhível `Controles`.
- As quatro automações passaram para `Opções avançadas`, inicialmente recolhidas.
- A velocidade aplica a configuração ao selecionar; o botão `Salvar` foi ocultado por ser redundante.
- A lista de velocidades passou a priorizar `Rápido`, `Padrão` e `Seguro`, mantendo as demais opções em um grupo avançado.
- Os agrupamentos recolhíveis foram verificados na prévia e mantêm os controles acessíveis.
- A aba Análises agora mostra somente a orientação de base vazia e retorna corretamente à Visão Geral; os gráficos permanecem reservados para quando houver leads.
