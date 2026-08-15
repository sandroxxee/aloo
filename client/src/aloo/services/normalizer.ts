/**
 * Normalizador de Telefones do Brasil (V3.6)
 * Adiciona o dígito 9 em números móveis brasileiros com 12 dígitos (55 + DDD + 8 dígitos)
 */
export function normalizarBR(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');

  // Se começar com 55 e tiver 12 dígitos (55 + DDD + 8 dígitos)
  if (cleaned.startsWith('55') && cleaned.length === 12) {
    const ddd = cleaned.substring(2, 4);
    const subscriber = cleaned.substring(4);
    // Adiciona o '9' após o DDD
    cleaned = `55${ddd}9${subscriber}`;
  } 
  // Se não tiver 55 mas tiver 10 dígitos (DDD + 8 dígitos)
  else if (cleaned.length === 10) {
    const ddd = cleaned.substring(0, 2);
    const subscriber = cleaned.substring(2);
    cleaned = `55${ddd}9${subscriber}`;
  }
  // Se tiver 11 dígitos sem 55 (DDD + 9 dígitos)
  else if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = `55${cleaned}`;
  }

  return cleaned;
}
