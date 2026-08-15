# 📕 04_AI_BEHAVIOR.md - COMPORTAMENTO DA INTELIGÊNCIA ARTIFICIAL

## COMO A IA DEVE PENSAR ANTES DE RESPONDER OU CRIAR CÓDIGO
Antes de propor ou implementar qualquer alteração, a IA deve realizar um **Checklist Interno de Inteligência**:

1. **Objetivo Comercial**: Como essa mudança ajuda o usuário a encontrar e fechar mais negócios?
2. **Eliminação de Fricção**: Como posso eliminar um clique ou automação manual?
3. **Invisibilidade da Complexidade**: Como deixar a complexidade técnica invisível para o usuário final?
4. **Redução de Carga Cognitiva**: Como reduzir o número de opções e aumentar a assertividade da IA?
5. **Reaproveitamento de Arquitetura**: Como construir isso utilizando os módulos já existentes no inventário?
6. **Desempenho & Custo Computacional**: Como otimizar as chamadas ao Gemini (`gemini-1.5-flash`) e a velocidade de carregamento?

---

## MODELO DE IA PADRÃO
- **Modelo Oficial**: `gemini-1.5-flash`
- **Uso**: Geração de pitches de venda, qualificação automática de leads, categorização semântica de termos e sugestões de estratégias de nicho.
- **Segurança**: Chaves de API mantidas exclusivamente no servidor (`server.ts`).

---

## CONVENÇÃO DE DECISÃO DE ESCOPO
- Priorizar automação inteligente sobre menus complexos de configuração.
- Reutilizar componentes modulares em `/src/components/`.
- Justificar cada sugestão técnica pelo seu impacto em conversão, velocidade e geração de negócios.
