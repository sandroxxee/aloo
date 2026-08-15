import { Lead, ExtractedContact } from '../types';
import { executeMultiEngineSearch } from './searchEngines';
import { cleanseAndFilterGarbage, mergeCrossPlatformLeads, detectAndExtractSocialLinks } from './leadMergerEngine';
import { isValidPhone } from './phoneExtractor';

/**
 * Motor de Descoberta Inteligente de Contatos (FASE 2)
 * Quando um lead/anúncio não possui telefone ou tem dados incompletos:
 * Busca automaticamente no Google, Google Maps, Site Oficial, Redes Sociais e CNPJ.
 * Relaciona todas as informações sem duplicar contatos.
 */
export async function discoverDeepContacts(lead: Lead): Promise<{ updatedLead: Lead; newItemsFound: number }> {
  let newItemsFound = 0;
  let currentLead = { ...lead };

  // Identificar quais informações cruciais estão faltando
  const missingPhone = !lead.rawPhone || !isValidPhone(lead.rawPhone);
  const missingEmail = !lead.email;
  const missingDoc = !lead.document;
  const missingCompany = !lead.companyName || lead.companyName === 'Particular';
  const missingSocials = !lead.socialLinks || (!lead.socialLinks.instagram && !lead.socialLinks.facebook && !lead.socialLinks.site);

  // Se o lead já tiver absolutamente tudo preenchido, retornar imediatamente
  if (!missingPhone && !missingEmail && !missingDoc && !missingCompany && !missingSocials) {
    return { updatedLead: currentLead, newItemsFound: 0 };
  }

  // 1. Formular Queries Estratégicas de Busca de Contatos
  const searchQueries: string[] = [];
  const baseTerm = lead.companyName && lead.companyName !== 'Particular' ? lead.companyName : lead.name || lead.item;
  const locTerm = lead.city ? `${lead.city} ${lead.stateUf || ''}` : lead.location || '';

  if (baseTerm) {
    searchQueries.push(`"${baseTerm}" ${locTerm} contato whatsapp email`);
    if (missingDoc) {
      searchQueries.push(`"${baseTerm}" ${locTerm} cnpj receita federal`);
    }
    if (missingSocials) {
      searchQueries.push(`"${baseTerm}" ${locTerm} instagram facebook site`);
    }
  }

  if (searchQueries.length === 0) {
    return { updatedLead: currentLead, newItemsFound: 0 };
  }

  // 2. Executar buscas em cascata multi-motor silenciosas
  for (const query of searchQueries.slice(0, 2)) {
    try {
      const searchRes = await executeMultiEngineSearch(query, 1, 'global', undefined, true);
      if (searchRes.success && searchRes.contacts && searchRes.contacts.length > 0) {
        // Filtrar lixo
        const cleanContacts = cleanseAndFilterGarbage(searchRes.contacts);

        for (const contact of cleanContacts) {
          // Extrair redes sociais
          const socials = detectAndExtractSocialLinks(contact.snippetContext, contact.webPageUrl);
          
          // Verificar se descobrimos novos campos
          const wasEmail = !currentLead.email && Boolean(contact.email);
          const wasDoc = !currentLead.document && Boolean(contact.document);
          const wasSocial = (!currentLead.socialLinks?.instagram && Boolean(socials.instagram)) ||
                            (!currentLead.socialLinks?.site && Boolean(socials.site));

          if (wasEmail || wasDoc || wasSocial) {
            newItemsFound++;
          }

          // Realizar fusão não-destrutiva
          const mergeResult = mergeCrossPlatformLeads(currentLead, contact);
          currentLead = mergeResult.mergedLead;
        }
      }
    } catch (err) {
      console.warn('deepContactDiscovery: erro ao consultar fonte complementar:', err);
    }
  }

  return { updatedLead: currentLead, newItemsFound };
}
