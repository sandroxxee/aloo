/**
 * Normalizador Universal de Telefones Brasileiros V3.1
 * Regras:
 * 1. Remove tudo que não é número.
 * 2. Se length == 12 (55 + DDD + 8 dígitos) -> Insere o 9 após o DDD (posição 4).
 * 3. Se length == 10 ou 11 (sem 55) -> Adiciona 55 e garante o 9º dígito se necessário.
 * 4. Retorna string numérica pura (sem +).
 */
export function normalizeBRUniversal(phone: string): string {
  let clean = phone.replace(/\D/g, '');

  // Caso 1: Já tem o DDI 55
  if (clean.startsWith('55')) {
    // Se tem 12 dígitos (55 + DDD + 8), insere o 9
    if (clean.length === 12) {
      const ddi = clean.substring(0, 2);
      const ddd = clean.substring(2, 4);
      const rest = clean.substring(4);
      clean = `${ddi}${ddd}9${rest}`;
    }
  } else {
    // Caso 2: Não tem o DDI 55
    if (clean.length === 10) {
      // DDD + 8 dígitos -> Adiciona 55 e insere 9
      const ddd = clean.substring(0, 2);
      const rest = clean.substring(2);
      clean = `55${ddd}9${rest}`;
    } else if (clean.length === 11) {
      // Já tem o 9? (DDD + 9 dígitos)
      if (clean[2] === '9') {
        clean = `55${clean}`;
      } else {
        // Provavelmente 11 dígitos errados ou com DDI diferente? 
        // Se for 11 dígitos e não começar com 55, assumimos DDD + 9 dígitos
        clean = `55${clean}`;
      }
    } else if (clean.length === 9) {
      // Apenas o número com 9 dígitos? (Incomum sem DDD, mas tratamos)
      // Aqui não temos o DDD, então fica difícil normalizar 100%
      // Por segurança, mantemos e deixamos o sistema avisar ou falhar no envio
    }
  }

  // Garantia final: Se começar com 55 e tiver 12 dígitos, forçar o 9
  if (clean.startsWith('55') && clean.length === 12) {
    clean = clean.slice(0, 4) + '9' + clean.slice(4);
  }

  return clean;
}
