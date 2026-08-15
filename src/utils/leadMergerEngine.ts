import { Lead, ExtractedContact, LeadChangeRecord, SocialLinks } from '../types';
import { enrichLeadWithOpportunitySignals } from './opportunityEngine';

/**
 * Motor de Inteligência Comercial FASE 2: Unificação, Score, Eliminador de Lixo e Histórico Comercial
 */

/**
 * 1. Cálculo de Score Comercial (0-100) baseado no valor real para fechamento de negócios
 */
export function calculateCommercialScore(lead: Partial<Lead>): number {
  let score = 30; // Pontuação base inicial

  // Validade de Contatos Diretos (Até +30)
  const hasRawPhone = Boolean(lead.rawPhone && lead.rawPhone.length >= 10);
  const hasWa = lead.whatsappStatus === 'has-whatsapp' || Boolean(lead.waMeUrl) || (lead.phoneType === 'Celular');
  if (hasRawPhone) score += 15;
  if (hasWa) score += 15;

  // Identificação Comercial & CNPJ (Até +20)
  if (lead.companyName && lead.companyName.trim().length > 2) score += 10;
  if (lead.document && lead.document.replace(/\D/g, '').length >= 11) score += 10;

  // Enriquecimento de Localização (Até +10)
  if (lead.city && lead.stateUf) score += 10;
  else if (lead.location) score += 5;

  // Presença Digital e Canais (Até +15)
  if (lead.email) score += 5;
  if (lead.webPageUrl) score += 5;
  if (lead.socialLinks && (lead.socialLinks.instagram || lead.socialLinks.facebook || lead.socialLinks.site)) score += 5;

  // Presença Multi-Plataforma (Até +15)
  const platCount = lead.allPlatforms?.length || 1;
  if (platCount >= 3) score += 15;
  else if (platCount >= 2) score += 10;

  // Atuação Cross-Regional Multi-Estado (+15)
  if (lead.isMultiStateSeller || (lead.crossRegionalStates && lead.crossRegionalStates.length >= 2)) {
    score += 15;
  }

  // Intenção e Qualificação Comercial (Até +10)
  if (lead.intent === 'Compra' || lead.qualification === 'Repasse' || lead.qualification === 'Abaixo da Tabela') {
    score += 10;
  }

  return Math.min(100, Math.max(10, Math.round(score)));
}

/**
 * 2. Extrator de Redes Sociais e Website Oficial a partir de texto/URL
 */
export function detectAndExtractSocialLinks(text?: string, primaryUrl?: string): SocialLinks {
  const links: SocialLinks = {};
  const combined = `${text || ''} ${primaryUrl || ''}`.toLowerCase();

  // Instagram
  const instaMatch = combined.match(/(?:instagram\.com\/|@)([a-zA-Z0-9_\.]{3,30})/i);
  if (instaMatch && !['p', 'reel', 'stories', 'explore'].includes(instaMatch[1])) {
    links.instagram = `https://instagram.com/${instaMatch[1]}`;
  }

  // Facebook
  const fbMatch = combined.match(/(?:facebook\.com\/)([a-zA-Z0-9_\.-]{3,50})/i);
  if (fbMatch && !['sharer', 'dialog', 'plugins'].includes(fbMatch[1])) {
    links.facebook = `https://facebook.com/${fbMatch[1]}`;
  }

  // LinkedIn
  const linkedinMatch = combined.match(/(?:linkedin\.com\/(?:in|company)\/)([a-zA-Z0-9_\.-]{3,50})/i);
  if (linkedinMatch) {
    links.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }

  // Site Oficial
  const siteMatch = combined.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:com\.br|com|net\.br|ind\.br))/i);
  if (siteMatch && !siteMatch[1].includes('olx.com') && !siteMatch[1].includes('mercadolivre.com') && !siteMatch[1].includes('facebook.com') && !siteMatch[1].includes('google.com')) {
    links.site = `https://www.${siteMatch[1]}`;
  }

  return links;
}

/**
 * 3. Eliminador de Lixo e Spam (Filtro Anti-Ruído Comercial)
 */
export function cleanseAndFilterGarbage<T extends { rawPhone?: string; snippetContext?: string; webPageUrl?: string; name?: string; createdAt?: string; firstSeenAt?: string }>(
  items: T[]
): T[] {
  const BANNED_PATTERNS = [
    'vaga de emprego', 'trabalhe conosco', 'contrata-se', 'curriculum',
    'manual pdf', 'download gratis', 'termos de uso', 'politica de privacidade',
    'erro 404', 'pagina nao encontrada', 'anuncio finalizado', 'anuncio removido',
    'pagina indisponivel', '00000000', '11111111', '12345678',
    'leilão', 'leilao', 'sinistro', 'sinistrado', 'sem doc', 'sem documento', 'sucata',
    'precisa de reparo', 'batido', 'recuperado', 'alienado', 'financiado', 'agio', 'ágio'
  ];

  const genericNames = ['vendedor', 'anunciante', 'particular', 'proprietario', 'proprietário', 'contato', 'desconhecido', 'perfil', 'usuario', 'usuário'];

  return items.filter(item => {
    // 0. V3.1: Filtro Geográfico (Opcional - se houver coordenadas)
    if ((item as any).distanceKm && (item as any).distanceKm > 600) {
      return false; // GeoFilter 600km V3.1
    }

    // 1. Validar Telefone se presente (Mandatório para captação comercial)
    const phoneCandidate = item.rawPhone || (item as any).formattedPhone || (item as any).phone || '';
    const cleanDigits = phoneCandidate.replace(/\D/g, '');
    if (cleanDigits.length < 10 || cleanDigits.length > 13) return false;
    if (/^(\d)\1+$/.test(cleanDigits)) return false;
    if (!item.rawPhone && cleanDigits) {
      item.rawPhone = cleanDigits;
    }

    // 2. Validar Contexto / Snippet
    const ctx = (item.snippetContext || '').toLowerCase();
    for (const pattern of BANNED_PATTERNS) {
      if (ctx.includes(pattern)) return false;
    }

    // 3. Limpeza de Nomes "Chutados" ou Genéricos
    if (item.name) {
      const lowerName = item.name.toLowerCase().trim();
      if (genericNames.includes(lowerName)) {
        (item as any).name = undefined; // Remove nome genérico sem descartar o lead
      }
    }

    return true;
  });
}

/**
 * 4. Cruzamento Automático Multi-Plataforma, Fusão de Dados e Registro de Alterações
 */
export function mergeCrossPlatformLeads(
  existingLead: Lead,
  newInput: Partial<Lead> | ExtractedContact
): { mergedLead: Lead; changes: LeadChangeRecord[] } {
  const changes: LeadChangeRecord[] = [];
  const nowIso = new Date().toISOString();

  // Consolidação de Plataformas
  const existingPlats = new Set<string>(existingLead.allPlatforms || [existingLead.adPlatform || 'Outro']);
  const newPlat = newInput.adPlatform || 'Outro';
  if (newPlat && newPlat !== 'Outro') {
    existingPlats.add(newPlat);
  }
  const updatedPlatforms = Array.from(existingPlats);

  // Consolidação Cross-Regional Multi-Estado
  const statesSet = new Set<string>(existingLead.crossRegionalStates || []);
  if (existingLead.stateUf) statesSet.add(existingLead.stateUf.toUpperCase().trim());
  if (newInput.stateUf) statesSet.add(newInput.stateUf.toUpperCase().trim());
  const updatedCrossRegionalStates = Array.from(statesSet).filter(s => s.length === 2);
  const isMultiStateSeller = updatedCrossRegionalStates.length >= 2;

  if (newInput.stateUf && existingLead.stateUf && newInput.stateUf.toUpperCase() !== existingLead.stateUf.toUpperCase()) {
    changes.push({
      timestamp: nowIso,
      field: 'cross_regional_presence',
      oldValue: existingLead.stateUf,
      newValue: newInput.stateUf,
      note: `📍 Anúncio vinculado em novo estado (${newInput.stateUf}). Vendedor operando em múltiplos estados (${updatedCrossRegionalStates.join(', ')}).`,
      importance: 'medium'
    });
  }

  // Consolidação de Links
  const existingUrls = new Set<string>(existingLead.allWebPageUrls || (existingLead.webPageUrl ? [existingLead.webPageUrl] : []));
  if (newInput.webPageUrl) {
    existingUrls.add(newInput.webPageUrl);
  }
  const updatedUrls = Array.from(existingUrls);

  // Redes Sociais
  const newSocials = detectAndExtractSocialLinks(newInput.snippetContext, newInput.webPageUrl);
  const updatedSocials: SocialLinks = {
    instagram: existingLead.socialLinks?.instagram || newSocials.instagram,
    facebook: existingLead.socialLinks?.facebook || newSocials.facebook,
    linkedin: existingLead.socialLinks?.linkedin || newSocials.linkedin,
    site: existingLead.socialLinks?.site || newSocials.site,
  };

  // Monitor de Alteração de Preço
  let updatedPrice = existingLead.price;
  let updatedQualification = existingLead.qualification;
  if (newInput.price && newInput.price !== existingLead.price) {
    const oldVal = existingLead.price || 'Não Informado';
    const newVal = newInput.price;
    
    // Tentar calcular se houve queda de preço em R$
    const oldNum = parseFloat(oldVal.replace(/\D/g, '')) || 0;
    const newNum = parseFloat(newVal.replace(/\D/g, '')) || 0;

    let note = `Preço alterado de ${oldVal} para ${newVal}`;
    let importance: 'high' | 'medium' | 'low' = 'medium';

    if (oldNum > 0 && newNum > 0 && newNum < oldNum) {
      const diff = oldNum - newNum;
      note = `🔥 Oportunidade: Preço reduzido em R$ ${diff.toLocaleString('pt-BR')}! (${oldVal} ➔ ${newVal})`;
      importance = 'high';
      updatedQualification = 'Abaixo da Tabela';
    }

    changes.push({
      timestamp: nowIso,
      field: 'price',
      oldValue: oldVal,
      newValue: newVal,
      note,
      importance
    });

    updatedPrice = newVal;
  }

  // Monitor de Alteração de Descrição / Status
  if (newInput.snippetContext && existingLead.snippetContext && newInput.snippetContext !== existingLead.snippetContext) {
    const newCtxLower = newInput.snippetContext.toLowerCase();
    if (newCtxLower.includes('vendido') || newCtxLower.includes('encerrado')) {
      changes.push({
        timestamp: nowIso,
        field: 'status',
        oldValue: 'Ativo',
        newValue: 'Vendido',
        note: 'Anúncio atualizado como vendido/encerrado pelo vendedor.',
        importance: 'high'
      });
    }
  }

  // Fusão Não-Destrutiva de Campos (Complementar sem sobrescrever)
  const genericNames = ['vendedor', 'anunciante', 'particular', 'proprietario', 'proprietário', 'contato', 'desconhecido', 'perfil', 'usuario', 'usuário'];
  
  const cleanName = (n?: string) => {
    if (!n) return undefined;
    const lower = n.toLowerCase().trim();
    if (genericNames.includes(lower)) return undefined;
    if (n.length < 3) return undefined;
    // Descarta se for exatamente uma das palavras de descarte ou se contiver apenas números de telefone
    if (/^(caminhao|caminhão|pecas|peças|whatsapp|tel|fixo|celular)$/i.test(lower)) return undefined;
    if (/\d{8,}/.test(lower.replace(/\s/g, ''))) return undefined;
    return n;
  };

  const mergedLead: Lead = {
    ...existingLead,
    // Complementar dados cadastrais caso faltem, com limpeza rigorosa
    name: cleanName(existingLead.name) || cleanName(newInput.name),
    sellerFullName: cleanName(existingLead.sellerFullName) || cleanName(newInput.sellerFullName),
    companyName: existingLead.companyName || newInput.companyName,
    sellerType: existingLead.sellerType || newInput.sellerType,
    document: existingLead.document || newInput.document,
    email: existingLead.email || newInput.email,
    city: existingLead.city || newInput.city,
    stateUf: existingLead.stateUf || newInput.stateUf,
    location: existingLead.location || newInput.location,
    waMeUrl: existingLead.waMeUrl || newInput.waMeUrl,

    // Atualização de Preço e Qualificação
    price: updatedPrice,
    qualification: updatedQualification || existingLead.qualification || 'Normal',

    // Redes Sociais & Links
    socialLinks: updatedSocials,
    allPlatforms: updatedPlatforms,
    allWebPageUrls: updatedUrls,
    webPageUrl: existingLead.webPageUrl || newInput.webPageUrl,

    // Atuação Cross-Regional
    crossRegionalStates: updatedCrossRegionalStates,
    isMultiStateSeller,

    // Histórico e Métricas
    firstSeenAt: existingLead.firstSeenAt || existingLead.createdAt || nowIso,
    lastSeenAt: nowIso,
    updatesCount: (existingLead.updatesCount || 0) + (changes.length > 0 ? 1 : 0),
    adCount: (existingLead.adCount || 1) + 1,
    totalContactsFound: (existingLead.totalContactsFound || 1) + (newInput.rawPhone && newInput.rawPhone !== existingLead.rawPhone ? 1 : 0),
    historyChanges: [...(existingLead.historyChanges || []), ...changes]
  };

  // Recalcular Score Comercial Unificado
  mergedLead.commercialScore = calculateCommercialScore(mergedLead);

  // FASE 2 — Opportunity Engine: Enriquecer com Radares de Oportunidade Comerciais
  const finalLead = enrichLeadWithOpportunitySignals(mergedLead);

  return { mergedLead: finalLead, changes };
}
