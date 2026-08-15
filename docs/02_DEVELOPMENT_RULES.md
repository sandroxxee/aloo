# 📗 02_DEVELOPMENT_RULES.md - REGRAS DE DESENVOLVIMENTO E ARQUITETURA

## O QUE NUNCA FAZER (REGRAS INVIOLÁVEIS)
1. **Nunca criar código duplicado**: Reutilizar componentes, hooks e rotas existentes.
2. **Nunca quebrar compatibilidade**: Manter funcionamento dos contratos de dados e rotas da API.
3. **Nunca alterar APIs existentes sem necessidade**: Evitar breaking changes em rotas ativas `/api/*`.
4. **Nunca remover funcionalidades**: Preservar os módulos já construídos e documentados no inventário.
5. **Nunca criar telas repetidas ou componentes idênticos**: Modularizar e parametrizar.
6. **Nunca mudar a arquitetura sem justificativa real**: Manter o ecossistema React + Express + Gemini.
7. **Nunca diminuir a performance**: Manter suporte a tabelas virtualizadas (`react-window`) e carregamento sob demanda.
8. **Nunca criar código não modular ou funções gigantes**: Manter responsabilidade única por arquivo.
9. **Nunca adicionar dependências desnecessárias ou redundantes**: Deferir pacotes não utilizados.

---

## PADRÃO DE CÓDIGO ENTERPRISE
- **Modular**: Separação clara entre componentes UI, hooks customizados, tipos TypeScript e utilitários.
- **Tipado**: Interfaces e types rigorosos em `src/types/` (TypeScript sem `any`).
- **Documentado**: Código limpo, legível e autoexplicativo com comentários em pontos críticos.
- **Componentizado**: Subcomponentes pequenos, focados e reutilizáveis.
- **Escalável & Orientado a Performance**: Uso de memoização (`useMemo`, `useCallback`), virtualização e gerenciamento otimizado de estado.
- **Preparado para IA**: Integrações com SDK oficial `@google/genai` e modelo `gemini-1.5-flash`.

---

## ESTRUTURA DE ARQUIVOS E ORGANIZAÇÃO
- `/src/components/`: Componentes visuais por contexto e módulos funcionais.
- `/src/hooks/`: Hooks React customizados para lógica de estado, sincronização e workers.
- `/src/utils/`: Funções puras, algoritmos de mineração, parsing e inteligência.
- `/src/types/`: Definições globais de interfaces e enums TypeScript.
- `/server.ts`: Servidor backend Express com rotas proxy para IA e scraping seguro.
