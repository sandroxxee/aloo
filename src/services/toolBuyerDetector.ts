/**
 * Detector de Comprador de Ferramenta V3.1
 * Filtra leads por perfil de empresa/atividade econômica
 */
export function isToolBuyer(sellerType?: string): boolean {
  if (!sellerType) return false;
  
  const targetTypes = [
    'LOJA_PECAS',
    'OFICINA',
    'FROTA',
    'TRANSPORTADORA',
    'EMPRESA',
    'REPASSE',
    'REVENDA'
  ];

  const type = sellerType.toUpperCase();
  return targetTypes.some(t => type.includes(t));
}

/**
 * Retorna se o lead deve receber a oferta da ferramenta (Mensagem 4)
 */
export function shouldOfferTool(lead: any): boolean {
  // Regra 1: Tipo de vendedor compatível
  const isTypeCompatible = isToolBuyer(lead.sellerType || lead.type);
  
  // Regra 2: Se foi detectado como Lojista Lotado pelo Detector de Lojista Desesperado
  const isLojistaLotado = lead.type === 'LOJISTA_LOTADO' || lead.qualification === 'LOJISTA_LOTADO';

  return isTypeCompatible || isLojistaLotado;
}
