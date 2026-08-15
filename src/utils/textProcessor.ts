export function sanitizeInput(input: string, maxLength: number = 200): string {
  if (!input) return '';
  const cleaned = input
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  return cleaned.substring(0, maxLength);
}

/**
 * Limpa automaticamente espaços excessivos, quebras de linha e caracteres especiais indesejados em snippets de texto.
 * Preserva caracteres acentuados, números e pontuações úteis para o domínio comercial (ex: preços, telefones, etc).
 */
export function cleanSnippetText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '') // Remove tags HTML
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove caracteres de controle invisíveis
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove caracteres de largura zero
    .replace(/[\r\n]+/g, ' ') // Substitui quebras de linha por espaço simples
    .replace(/\s+/g, ' ')     // Substitui múltiplos espaços por um único espaço
    .replace(/[^\w\sÀ-ÿ\d.,;:!?()\-+/*%#@R$"'[\]]/g, '') // Remove caracteres estranhos mantendo acentos e pontuação útil
    .trim();
}

/**
 * Normaliza e limpa completamente snippets e descrições extraídas antes de persistir no banco de dados.
 */
export function normalizeSnippetForDb(text: string, maxLength: number = 1000): string {
  if (!text) return '';
  const cleaned = cleanSnippetText(text);
  return cleaned.substring(0, maxLength);
}



/**
 * Oculta parcialmente informações de contato (telefone/email) para exibição segura na tela.
 */
export function maskContact(contact: string): string {
  if (!contact) return '';
  const str = String(contact);
  
  if (str.includes('@')) {
    const [name, domain] = str.split('@');
    if (name.length <= 2) return str;
    return name.substring(0, 2) + '***@' + domain;
  }
  
  if (str.length >= 8) {
    if (str.includes('(') && str.includes(')')) {
       const parts = str.split(')');
       if (parts.length === 2) {
          const ddd = parts[0] + ')';
          let num = parts[1].trim();
          if (num.length >= 8) {
            return ddd + ' ' + num.charAt(0) + '****-**' + num.slice(-2);
          }
       }
    } else {
       return str.substring(0, 4) + '****' + str.slice(-2);
    }
  }
  
  return str;
}
