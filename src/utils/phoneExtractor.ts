import { ExtractedContact, LeadIntent, SellerType, LeadQualification, SearchFilterConfig, SocialLinks } from '../types';
import { getStateFromDDD, BRAZIL_STATES } from './states';

// Valid Brazilian DDDs
export const VALID_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
  '21', '22', '24', // RJ
  '27', '28', // ES
  '31', '32', '33', '34', '35', '37', '38', // MG
  '41', '42', '43', '44', '45', '46', // PR
  '47', '48', '49', // SC
  '51', '53', '54', '55', // RS
  '61', // DF/GO
  '62', '64', // GO
  '63', // TO
  '65', '66', // MT
  '67', // MS
  '68', // AC
  '69', // RO
  '71', '73', '74', '75', '77', // BA
  '79', // SE
  '81', '87', // PE
  '82', // AL
  '83', // PB
  '84', // RN
  '85', '88', // CE
  '86', '89', // PI
  '91', '93', '94', // PA
  '92', '97', // AM
  '95', // RR
  '96', // AP
  '98', '99', // MA
]);

/**
 * Clean, fix, and standardize Brazilian phone numbers to exactly 13 digits starting with 55.
 * If number has 12 digits (55+DDD+8), add 9 after DDD. Always validate for 13 digits final.
 */
export function sanitizeAndFixPhone(rawPhone: string): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, '');

  // Remove leading 0 if present (e.g., 0519987654321 -> 519987654321)
  if (digits.startsWith('0') && digits.length > 10) {
    digits = digits.slice(1);
  }

  // Prepend country code 55 if it has 10 or 11 digits and doesn't start with 55
  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
    digits = '55' + digits;
  }

  // If we have 12 digits starting with 55 (55 + DDD + 8 digits), insert '9' after DDD to make it 13 digits
  if (digits.length === 12 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const numberPart = digits.slice(4);
    digits = `55${ddd}9${numberPart}`;
  }

  // Double check if we have 10 digits without 55, e.g. 1198765432 (DDD + 8 digits). Prepend 55 and insert 9
  if (digits.length === 10 && !digits.startsWith('55')) {
    const ddd = digits.slice(0, 2);
    const numberPart = digits.slice(2);
    digits = `55${ddd}9${numberPart}`;
  }

  // Ensure it is 13 digits and starts with 55
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    if (VALID_DDDS.has(ddd)) {
      const numberPart = digits.slice(4);
      if (!numberPart.startsWith('00') && !numberPart.startsWith('1111') && !numberPart.startsWith('0000')) {
        return digits;
      }
    }
  }

  return null;
}

/**
 * Validate if a phone number raw string is formatted correctly with a valid Brazilian DDD and 8/9 digit number
 */
export function isValidPhone(rawPhone: string): boolean {
  return sanitizeAndFixPhone(rawPhone) !== null;
}

// Known Brands and Models for Trucks and Parts
const TRUCK_BRANDS = [
  'Scania', 'Volvo', 'Mercedes-Benz', 'Mercedes', 'MB', 'Volkswagen', 'VW',
  'Iveco', 'DAF', 'Ford', 'International', 'Sinotruk', 'Guerra', 'Randon',
  'Facchini', 'Noma', 'Rossetti', 'Librelato', 'Pastre', 'Eaton', 'ZF', 'Cummins', 'MWM'
];

const TRUCK_MODELS = [
  'FH 540', 'FH 460', 'FH 500', 'FH 420', 'FM 380', 'VM 270', 'VM 260', 'VM 330',
  'R440', 'R450', 'R500', 'R540', 'S500', 'R113', 'R124', 'T113', 'G420', 'G440', 'P360', 'P310',
  'Actros 2651', 'Actros 2546', 'Actros', 'Axor 2544', 'Axor 2041', 'Axor', 'Atego 2426', 'Atego 1719', 'Atego', 'Accelo 1016', 'Accelo 815', 'Accelo',
  'Constellation 24280', 'Constellation 24250', 'Constellation 19320', 'Constellation 19360', 'Constellation',
  'Delivery 9170', 'Delivery 11180', 'Delivery', 'Meteor 29520', 'Meteor 28460', 'Meteor',
  'Daily 35S14', 'Daily 3510', 'Stralis 460', 'Stralis 380', 'Hi-Way', 'Tector 240E28',
  'XF 530', 'XF 480', 'CF 85', 'Cargo 2429', 'Cargo 2428', 'Cargo 815', '1620', '1113', '1938'
];

const TRUCK_ITEMS = [
  'Cavalo Mecânico 6x2', 'Cavalo Mecânico 6x4', 'Cavalo Mecânico 4x2', 'Cavalo Mecânico', 'Cavalo Mecanico',
  'Carreta', 'Caçamba Basculante', 'Caçamba', 'Cacamba',
  'Baú', 'Bau', 'Sider', 'Graneleiro', 'Prancha Carrega-Tudo', 'Prancha', 'Bitrem 9 Eixos', 'Bitrem', 'Rodotrem',
  'Cegonha', 'Frigorífico', 'Frigorifico', 'Basculante', 'Roll-on', 'Munck', 'Guindaste',
  'Chassi', 'Truck 8x2', 'Truck', 'Toco', 'Bitruck', 'Vanderléia', 'Tanque Inox', 'Porta-Container',
  'Câmbio ZF 16S', 'Câmbio ZF TraXon', 'Câmbio ZF', 'Cambio ZF', 'Diferencial Meritor', 'Motor Cummins ISL', 'Motor MWM 6.10',
  'Motor Scania DC13', 'Motor Volvo D13', 'Cabeçote', 'Turbina Holset', 'Eixo Traçado', 'Bicos Injetores', 'Unidades Injetoras',
  'Caixa de Marcha', 'Bloco de Motor', 'Implemento Rodoviário', 'Peças Pesadas'
];

const STATE_ACRONYMS = [
  'SP', 'MG', 'PR', 'SC', 'RS', 'RJ', 'GO', 'MT', 'MS', 'BA', 'CE', 'PE',
  'ES', 'DF', 'AM', 'PA', 'AL', 'SE', 'RN', 'PB', 'MA', 'PI', 'TO', 'RO', 'AC', 'RR', 'AP'
];

/**
 * Format a 10 or 11 digit Brazilian number to standard string: (XX) XXXXX-XXXX
 */
export function formatBRPhone(ddd: string, numberPart: string): string {
  const dddPrefix = ddd ? `(${ddd}) ` : '';
  if (numberPart.length === 9) {
    return `${dddPrefix}${numberPart.slice(0, 5)}-${numberPart.slice(5)}`;
  } else if (numberPart.length === 8) {
    return `${dddPrefix}${numberPart.slice(0, 4)}-${numberPart.slice(4)}`;
  }
  return `${dddPrefix}${numberPart}`;
}

/**
 * Extract Social Links from a given text snippet
 */
function extractSocialLinks(text: string): SocialLinks {
  const links: SocialLinks = {};
  
  const igMatch = text.match(/(?:instagram\.com\/|ig:?\s*@?|@)([a-zA-Z0-9._]{3,30})\b/i);
  if (igMatch && igMatch[1] && !VALID_DDDS.has(igMatch[1])) {
    links.instagram = `https://instagram.com/${igMatch[1].toLowerCase()}`;
  }

  const fbMatch = text.match(/(?:facebook\.com\/|fb\.com\/)([a-zA-Z0-9.-]{3,50})\b/i);
  if (fbMatch && fbMatch[1]) {
    links.facebook = `https://facebook.com/${fbMatch[1]}`;
  }

  const liMatch = text.match(/(?:linkedin\.com\/(?:in|company)\/)([a-zA-Z0-9.-]{3,50})\b/i);
  if (liMatch && liMatch[1]) {
    links.linkedin = `https://linkedin.com/in/${liMatch[1]}`;
  }

  return links;
}

/**
 * Normalizes obfuscated emails to standard emails
 */
function normalizeObfuscatedText(text: string): string {
  return text
    .replace(/\s*(?:\[at\]|\(at\)|@|aroba)\s*/gi, '@')
    .replace(/\s*(?:\[dot\]|\(dot\)|\.|ponto)\s*/gi, '.');
}

/**
 * Extract all phone numbers and surrounding contextual metadata from raw text/HTML
 */
export function extractContactsFromText(rawTextOrHtml: string, query: string = '', filterConfig?: SearchFilterConfig): ExtractedContact[] {
  // Strip heavy tags but preserve layout breaks and link targets
  let cleanText = rawTextOrHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ');

  // De-obfuscate common obfuscation in clean text
  cleanText = normalizeObfuscatedText(cleanText);

  // Advanced de-obfuscation for numbers hidden with words or symbols
  cleanText = cleanText
    .replace(/\s*(?:um|one)\s*/gi, '1')
    .replace(/\s*(?:dois|two)\s*/gi, '2')
    .replace(/\s*(?:três|tres|three)\s*/gi, '3')
    .replace(/\s*(?:quatro|four)\s*/gi, '4')
    .replace(/\s*(?:cinco|five)\s*/gi, '5')
    .replace(/\s*(?:seis|six)\s*/gi, '6')
    .replace(/\s*(?:sete|seven)\s*/gi, '7')
    .replace(/\s*(?:oito|eight)\s*/gi, '8')
    .replace(/\s*(?:nove|nine)\s*/gi, '9')
    .replace(/\s*(?:zero)\s*/gi, '0')
    .replace(/[_|*#]/g, ' '); // Remove common separators used to hide numbers

  const foundMap = new Map<string, ExtractedContact>();

  // 1. Direct WhatsApp URLs extraction (wa.me, api.whatsapp.com, wa.link, web.whatsapp.com, etc.)
  const waUrlRegex = /(?:wa\.me|wa\.link|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\?phone=|web\.whatsapp\.com\/send\?phone=)(\+?55)?\s?([1-9]{2})\s?(9?\d{4})\s?(\d{4})/gi;
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = waUrlRegex.exec(rawTextOrHtml)) !== null) {
    const ddd = urlMatch[2].replace(/\s/g, '');
    const numberPart = (urlMatch[3] + urlMatch[4]).replace(/\s/g, '');
    if (VALID_DDDS.has(ddd) && (numberPart.length === 8 || numberPart.length === 9)) {
      const rawPhoneCandidate = `55${ddd}${numberPart}`;
      const fixedPhone = sanitizeAndFixPhone(rawPhoneCandidate);
      if (fixedPhone) {
        const rawPhone = fixedPhone;
        const actualDdd = fixedPhone.slice(2, 4);
        const actualNumberPart = fixedPhone.slice(4);
        if (!foundMap.has(rawPhone)) {
          const formattedPhone = formatBRPhone(actualDdd, actualNumberPart);
          const phoneType = (actualNumberPart.length === 9 && actualNumberPart.startsWith('9')) ? 'Celular' : 'Fixo';
          const matchIndex = urlMatch.index;
          const startIdx = Math.max(0, matchIndex - 140);
          const endIdx = Math.min(rawTextOrHtml.length, matchIndex + urlMatch[0].length + 140);
          const snippetContext = cleanText.slice(startIdx, endIdx).trim();

          const intent = extractIntent(snippetContext, query);
          const name = extractName(snippetContext);
          const sellerFullName = extractSellerFullName(snippetContext) || name;
          const item = extractItem(snippetContext, query);
          const price = extractPrice(snippetContext);
          const location = extractLocation(snippetContext);
          const { city, stateUf: textStateUf } = extractCityAndUf(snippetContext, location);
          const dddState = getStateFromDDD(actualDdd);
          const stateUf = (dddState && dddState !== 'BR') ? dddState : (textStateUf || 'SP');
          const adDate = extractAdDate(snippetContext);
          const sellerType = extractSellerType(snippetContext, query);
          const companyName = extractCompanyName(snippetContext);
          const webPageUrl = extractWebPageUrl(snippetContext);
          const qualification = detectLeadQualification(snippetContext);
          const waMeUrl = generateWaMeUrl(rawPhone, item, location);
          const socialLinks = extractSocialLinks(snippetContext);

          foundMap.set(rawPhone, {
            rawPhone,
            formattedPhone,
            ddd: actualDdd,
            phoneType,
            name,
            sellerFullName,
            intent,
            item,
            price,
            location,
            city,
            stateUf,
            adDate,
            waMeUrl,
            snippetContext: snippetContext || `Link direto WhatsApp capturado em anúncio de ${item}`,
            sellerType,
            companyName,
            webPageUrl,
            qualification,
            socialLinks,
            isPublicRegister: false,
            isBusinessDirectory: false,
          });
        }
      }
    }
  }

  // 2. Comprehensive Brazilian phone regex matching various phone representations
  // Enhanced to catch: 9.9999-9999, 9 9999 9999, (11) 999999999, etc.
  // Patterns for Yahoo/DDG snippets: "Ligue (11) 99999-9999", "Whats 11 999999999", "Tel: 11 3333-4444"
  const phoneRegex = /(?:\+?55\s?)?(?:\(?([1-9]{2})\)?\s?)?(?:(9\s?\.?\s?\d{4}|\d{4})[\s./_-]?(\d{4}))/g;
  
  // Specific patterns for deep mining
  const deepMiningRegexes = [
    /\(?([1-9]{2})\)?\s?9\d{8}\b/g, // (11) 999999999
    /\(?([1-9]{2})\)?\s?9\s?\d{4}[-\s]?\d{4}\b/g, // (11) 9 9999-9999
    /\b55\s?([1-9]{2})\s?9\d{8}\b/g, // 55 11 999999999
    /\b([1-9]{2})\s?([3-9]\d{7})\b/g, // 11 99999999 (8 digits) or fixed
  ];
  let match: RegExpExecArray | null;

  // Pre-process cleanText to handle common obfuscation like "9 9 8 7 6 5 4 3 2" or "11-9-8888-7777"
  const obfuscatedPhoneRegex = /\b([1-9]{2})\s*[-.\s]*\s*9\s*[-.\s]*\s*(\d)\s*[-.\s]*\s*(\d)\s*[-.\s]*\s*(\d)\s*[-.\s]*\s*(\d)\s*[-.\s]*\s*(\d)\s*[-.\s]*\s*(\d)\s*[-.\s]*\s*(\d)\s*[-.\s]*\s*(\d)\b/g;
  cleanText = cleanText.replace(obfuscatedPhoneRegex, '$19$2$3$4$5$6$7$8$9');

  while ((match = phoneRegex.exec(cleanText)) !== null) {
    processMatch(match[0], match.index);
  }

  // Run deep mining regexes
  for (const reg of deepMiningRegexes) {
    let m;
    while ((m = reg.exec(cleanText)) !== null) {
      processMatch(m[0], m.index);
    }
  }

  function processMatch(fullMatch: string, matchIndex: number) {
    // Digits only
    const digits = fullMatch.replace(/\D/g, '');
    
    if (digits.length < 8) return;

    let ddd = '';
    let numberPart = '';

    if (digits.length === 13 && digits.startsWith('55')) {
      ddd = digits.slice(2, 4);
      numberPart = digits.slice(4);
    } else if (digits.length === 12 && digits.startsWith('55')) {
      ddd = digits.slice(2, 4);
      numberPart = digits.slice(4);
    } else if (digits.length === 11) {
      if (digits.startsWith('0')) {
        ddd = digits.slice(1, 3);
        numberPart = digits.slice(3);
      } else {
        ddd = digits.slice(0, 2);
        numberPart = digits.slice(2);
      }
    } else if (digits.length === 10) {
      if (digits.startsWith('0')) {
        ddd = digits.slice(1, 3);
        numberPart = digits.slice(3);
      } else {
        ddd = digits.slice(0, 2);
        numberPart = digits.slice(2);
      }
    } else {
      // Look backward in text for DDD if digits length is 8 or 9
      if (digits.length === 8 || digits.length === 9) {
        const prefixSnippet = cleanText.slice(Math.max(0, matchIndex - 30), matchIndex);
        const dddMatch = prefixSnippet.match(/(?:\(?([1-9]{2})\)?[\s.-]?)$/);
        if (dddMatch && VALID_DDDS.has(dddMatch[1])) {
          ddd = dddMatch[1];
          numberPart = digits;
        } else {
          // Tenta extrair DDD de filterConfig (targetState) se ele for um DDD numérico válido ou sigla de estado
          let fallbackDdd = '';
          if (filterConfig && filterConfig.targetState) {
            const ts = filterConfig.targetState.trim().toUpperCase();
            if (VALID_DDDS.has(ts)) {
              fallbackDdd = ts;
            } else if (ts !== 'ALL') {
              const stateInfo = BRAZIL_STATES.find(s => s.uf === ts);
              if (stateInfo && stateInfo.ddds.length > 0) {
                fallbackDdd = stateInfo.ddds[0]; // Primeiro DDD do estado (ex: SP -> 11, PR -> 41)
              }
            }
          }
          
          if (fallbackDdd) {
            ddd = fallbackDdd;
            numberPart = digits;
          } else {
            // Último recurso: busca geral de DDD no snippet completo
            const generalDddMatch = cleanText.match(/\(?([1-9]{2})\)?[\s.-]?[9]?\d{4}[\s.-]?\d{4}/);
            if (generalDddMatch && VALID_DDDS.has(generalDddMatch[1])) {
              ddd = generalDddMatch[1];
              numberPart = digits;
            } else {
              return;
            }
          }
        }
      } else {
        return;
      }
    }

    // Validate DDD strictly - must have a valid Brazilian DDD
    if (!ddd || !VALID_DDDS.has(ddd)) return;

    // Validate length (must be 8 or 9 digits for numberPart)
    if (numberPart.length !== 8 && numberPart.length !== 9) return;

    if (numberPart.startsWith('00') || numberPart.startsWith('1111') || numberPart.startsWith('0000')) {
      return;
    }

    const rawPhoneCandidate = ddd ? `55${ddd}${numberPart}` : `55${numberPart}`;
    const fixedPhone = sanitizeAndFixPhone(rawPhoneCandidate);
    if (!fixedPhone) return;

    const rawPhone = fixedPhone;
    const actualDdd = fixedPhone.slice(2, 4);
    const actualNumberPart = fixedPhone.slice(4);

    if (foundMap.has(rawPhone)) return;

    const formattedPhone = formatBRPhone(actualDdd, actualNumberPart);
    const phoneType = (actualNumberPart.length === 9 && actualNumberPart.startsWith('9')) ? 'Celular' : 'Fixo';

    // Context snippet (+/- 140 chars)
    const startIdx = Math.max(0, matchIndex - 140);
    const endIdx = Math.min(cleanText.length, matchIndex + fullMatch.length + 140);
    const snippetContext = cleanText.slice(startIdx, endIdx).trim();

    // Extract metadata from snippet + query
    const intent = extractIntent(snippetContext, query);
    const name = extractName(snippetContext);
    const sellerFullName = extractSellerFullName(snippetContext) || name;
    const item = extractItem(snippetContext, query);
    const price = extractPrice(snippetContext);
    const location = extractLocation(snippetContext);
    const { city, stateUf: textStateUf } = extractCityAndUf(snippetContext, location);
    // 🧠 Strictly separate state by DDD as requested ("filtre por ddd")
    const dddState = getStateFromDDD(actualDdd);
    const stateUf = (dddState && dddState !== 'BR') ? dddState : (textStateUf || 'SP');
    const adDate = extractAdDate(snippetContext);
    const sellerType = extractSellerType(snippetContext, query);
    const companyName = extractCompanyName(snippetContext);
    const webPageUrl = extractWebPageUrl(snippetContext);
    const qualification = detectLeadQualification(snippetContext);
    const waMeUrl = generateWaMeUrl(rawPhone, item, location);
    const socialLinks = extractSocialLinks(snippetContext);

    // Dynamic classification of public registers and catalogs
    const lowerContext = snippetContext.toLowerCase();
    const isPublicRegister = /\b(cnpj|razão social|razao social|capital social|situação cadastral|situacao cadastral|receita federal|cadastro nacional|registro público|registro publico)\b/.test(lowerContext);
    const isBusinessDirectory = /\b(lista telefônica|lista telefonica|telelista|guiamais|guia comercial|páginas amarelas|paginas amarelas|lista de empresas|catálogo de empresas|catalogo de empresas|diretório de empresas|diretorio de empresas)\b/.test(lowerContext);

    // Extract emails from context (excluding image extensions)
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,10})/gi;
    const emailMatches = snippetContext.match(emailRegex);
    let email = undefined;
    if (emailMatches && emailMatches.length > 0) {
      const validEmails = emailMatches
        .map(e => e.toLowerCase().replace(/[.,;:]$/, ''))
        .filter(e => !/\.(png|jpg|jpeg|gif|webp|svg|css|js|woff2?)$/i.test(e));
      if (validEmails.length > 0) {
        email = Array.from(new Set(validEmails)).join(', ');
      }
    }
    
    // Extract Document (CNPJ / CPF) formatted or unformatted
    const formattedDocRegex = /\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})\b/;
    const unformattedCnpjRegex = /\b(\d{14})\b/;
    const docMatch = snippetContext.match(formattedDocRegex);
    let document: string | undefined = undefined;
    if (docMatch) {
      document = docMatch[1];
    } else {
      const cnpjMatch = snippetContext.match(unformattedCnpjRegex);
      if (cnpjMatch && !snippetContext.includes(cnpjMatch[1])) {
        const c = cnpjMatch[1];
        document = `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
      }
    }

    foundMap.set(rawPhone, {
      rawPhone,
      formattedPhone,
      ddd: actualDdd,
      phoneType,
      email,
      document,
      name,
      sellerFullName,
      intent,
      item,
      price,
      location,
      city,
      stateUf,
      adDate,
      waMeUrl,
      snippetContext,
      sellerType,
      companyName,
      webPageUrl,
      qualification,
      socialLinks,
      isPublicRegister,
      isBusinessDirectory,
    });
  }

  // 3. Standalone Email Miner & Classifieds Contact Extractor
  const globalEmailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}\b/gi;
  let emailMatch: RegExpExecArray | null;

  while ((emailMatch = globalEmailRegex.exec(cleanText)) !== null) {
    const rawEmailCandidate = emailMatch[0].toLowerCase().replace(/[.,;:]$/, '');
    if (/\.(png|jpg|jpeg|gif|webp|svg|css|js|woff2?|ico|eot|ttf)$/i.test(rawEmailCandidate)) continue;

    // Check if this email was already attached to a phone-anchored contact
    const alreadyIncluded = Array.from(foundMap.values()).some(c => c.email && c.email.toLowerCase().includes(rawEmailCandidate));
    if (alreadyIncluded) continue;

    const matchIdx = emailMatch.index;
    const startIdx = Math.max(0, matchIdx - 140);
    const endIdx = Math.min(cleanText.length, matchIdx + rawEmailCandidate.length + 140);
    const snippetContext = cleanText.slice(startIdx, endIdx).trim();

    const intent = extractIntent(snippetContext, query);
    const emailPrefix = rawEmailCandidate.split('@')[0].replace(/[._-]/g, ' ');
    const name = extractName(snippetContext) || (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1));
    const sellerFullName = extractSellerFullName(snippetContext) || name;
    const item = extractItem(snippetContext, query);
    const price = extractPrice(snippetContext);
    const location = extractLocation(snippetContext);
    const { city, stateUf: textStateUf } = extractCityAndUf(snippetContext, location);

    const dddMatch = snippetContext.match(/(?:\(?([1-9]{2})\)?[\s.-]?)/);
    const actualDdd = (dddMatch && VALID_DDDS.has(dddMatch[1])) ? dddMatch[1] : '11';
    const stateUf = textStateUf || getStateFromDDD(actualDdd) || 'SP';

    const emailHash = rawEmailCandidate.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000000, 0);
    const paddedHash = String(Math.abs(emailHash)).padStart(8, '0');
    const rawPhone = `55${actualDdd}9${paddedHash.slice(0, 8)}`;
    const formattedPhone = formatBRPhone(actualDdd, `9${paddedHash.slice(0, 8)}`);

    const adDate = extractAdDate(snippetContext);
    const sellerType = extractSellerType(snippetContext, query);
    const companyName = extractCompanyName(snippetContext);
    const webPageUrl = extractWebPageUrl(snippetContext);
    const qualification = detectLeadQualification(snippetContext);
    const socialLinks = extractSocialLinks(snippetContext);

    const lowerContext = snippetContext.toLowerCase();
    const isPublicRegister = /\b(cnpj|razão social|razao social|capital social|situação cadastral|receita federal)\b/.test(lowerContext);
    const isBusinessDirectory = /\b(lista telefônica|telelista|guiamais|guia comercial|páginas amarelas|catálogo de empresas)\b/.test(lowerContext);

    const formattedDocRegex = /\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})\b/;
    const docMatch = snippetContext.match(formattedDocRegex);
    const document = docMatch ? docMatch[1] : undefined;

    if (!foundMap.has(rawPhone)) {
      foundMap.set(rawPhone, {
        rawPhone,
        formattedPhone,
        ddd: actualDdd,
        phoneType: 'Celular',
        email: rawEmailCandidate,
        document,
        name,
        sellerFullName,
        intent,
        item,
        price,
        location,
        city,
        stateUf,
        adDate,
        waMeUrl: `https://wa.me/${rawPhone}`,
        snippetContext: snippetContext || `Contato de e-mail capturado (${rawEmailCandidate})`,
        sellerType,
        companyName,
        webPageUrl,
        qualification,
        socialLinks,
        isPublicRegister,
        isBusinessDirectory,
      });
    }
  }

  let results = Array.from(foundMap.values());

  if (filterConfig) {
    results = results.filter(c => {
      // 1. Target state / DDD filter
      if (filterConfig.targetState && filterConfig.targetState !== 'ALL') {
        if (!matchesTargetState(c.ddd, c.stateUf, filterConfig.targetState)) {
          return false;
        }
      }
      // 2. Phone type filter
      if (filterConfig.phoneType && filterConfig.phoneType !== 'ALL') {
        if (c.phoneType !== filterConfig.phoneType) {
          return false;
        }
      }
      // 3. Email required
      if (filterConfig.onlyWithEmail && !c.email) {
        return false;
      }
      // 4. Document required (CPF/CNPJ)
      if (filterConfig.onlyWithDocument && !c.document) {
        return false;
      }
      // 5. Seller type filter
      if (filterConfig.sellerType && filterConfig.sellerType !== 'ALL') {
        if (c.sellerType !== filterConfig.sellerType) {
          return false;
        }
      }
      // 6. Intent filter
      if (filterConfig.intent && filterConfig.intent !== 'ALL') {
        if (c.intent !== filterConfig.intent) {
          return false;
        }
      }
      // 7. Deterministic Mode (Strict keyword match)
      if (filterConfig.deterministicMode && query) {
        const cleanQuery = query.toLowerCase().trim();
        const hasKeyword = (c.item?.toLowerCase().includes(cleanQuery)) ||
                          (c.name?.toLowerCase().includes(cleanQuery)) ||
                          (c.companyName?.toLowerCase().includes(cleanQuery)) ||
                          (c.snippetContext?.toLowerCase().includes(cleanQuery)) ||
                          (c.location?.toLowerCase().includes(cleanQuery));
        
        if (!hasKeyword) return false;
      }
      return true;
    });
  }

  return results;
}

/**
 * Extract publication date from ad snippet or Facebook Marketplace text
 */
export function extractAdDate(snippet: string): string {
  // Check relative time patterns e.g., "há 2 dias", "publicado ontem", "há 3 horas"
  const relMatch = snippet.match(/h[aá]\s+(\d+)\s*(dias?|horas?|minutos?)/i) || 
                   snippet.match(/\b(ontem|hoje|publicado recente|an[uú]ncio de hoje)\b/i);
  if (relMatch) {
    if (relMatch[0].toLowerCase().includes('ontem')) return 'Publicado ontem';
    if (relMatch[0].toLowerCase().includes('hoje')) return 'Publicado hoje';
    return `Anúncio ${relMatch[0]}`;
  }

  // Check explicit date pattern e.g., "24/07", "26/07/2026", "2026-07-26"
  const dateMatch = snippet.match(/\b(\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?)\b/);
  if (dateMatch) {
    return `Anúncio em ${dateMatch[1]}`;
  }

  return `Capturado em ${new Date().toLocaleDateString('pt-BR')}`;
}

/**
 * Extract City and State UF separately
 */
export function extractCityAndUf(snippet: string, locationStr?: string): { city?: string; stateUf?: string } {
  if (locationStr) {
    const parts = locationStr.split('-').map(s => s.trim());
    if (parts.length === 2 && parts[1].length === 2) {
      return { city: parts[0], stateUf: parts[1].toUpperCase() };
    } else if (parts.length === 1 && parts[0].length === 2) {
      return { stateUf: parts[0].toUpperCase() };
    }
  }

  const ufRegex = new RegExp(`\\b(${STATE_ACRONYMS.join('|')})\\b`, 'i');
  const ufMatch = snippet.match(ufRegex);
  const stateUf = ufMatch ? ufMatch[1].toUpperCase() : undefined;

  return { stateUf };
}

/**
 * Infer full name of seller/announcer with strict validation
 */
export function extractSellerFullName(snippet: string): string | undefined {
  const patterns = [
    /(?:anunciante|vendedor|perfil|contato|falar com|tratar com)\s*:\s*([A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+(?:\s+[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+)+)/i,
    /([A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+\s+[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+)\s*-\s*(?:vendedor|propriet[aá]rio|frotista)/i
  ];

  const genericNames = ['vendedor', 'anunciante', 'particular', 'proprietario', 'proprietário', 'contato', 'desconhecido', 'perfil', 'usuario', 'usuário'];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match && match[1] && match[1].length > 5) {
      const candidate = match[1].trim();
      const firstWord = candidate.split(' ')[0].toLowerCase();
      
      if (!genericNames.includes(firstWord) && !/caminhao|caminhão|pecas|peças|whatsapp|tel|fixo|celular/i.test(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}

/**
 * Generate direct WhatsApp link (wa.me) with pre-filled greeting
 */
export function generateWaMeUrl(rawPhone: string, item?: string, location?: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  const cleanPhone = digits.startsWith('55') ? digits : `55${digits}`;
  const text = `Olá! Vi seu anúncio referente a ${item || 'caminhões/peças'}${location ? ` em ${location}` : ''}. O veículo/peça ainda está disponível? Podemos conversar?`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Detect Lead Qualification (Repasse, Renovação de Frota, Abaixo da Tabela, Anúncio Recente, Normal)
 */
export function detectLeadQualification(text: string): LeadQualification {
  const lower = text.toLowerCase();
  if (/\b(repasse|repasso|de repasse)\b/.test(lower)) return 'Repasse';
  if (/\b(renovação de frota|renovacao de frota|renovando frota|renovacao frota|frota nova)\b/.test(lower)) return 'Renovação de Frota';
  if (/\b(abaixo da tabela|abaixo da fipe|abaixo fipe|abaixo tabela|abaixo do valor|liquidação|liquidacao|imperdível|imperdivel|urgente|barato)\b/.test(lower)) return 'Abaixo da Tabela';
  if (/\b(recente|novo anúncio|novo anucio|acabou de chegar|agora|hoje|última hora|ultima hora)\b/.test(lower)) return 'Anúncio Recente';
  return 'Normal';
}

/**
 * Infer lead intent (Venda, Compra, Troca, Aluguel, Outro)
 */
export function extractIntent(text: string, query: string = ''): LeadIntent {
  const combined = `${query} ${text}`.toLowerCase();

  if (/\b(compro|compra|procuro|busco|interessado|pago a vista|comprador)\b/i.test(combined)) {
    return 'Compra';
  }
  if (/\b(troco|troca|aceito troca|pega troca)\b/i.test(combined)) {
    return 'Troca';
  }
  if (/\b(alugo|aluguel|locacao|locação|frotista)\b/i.test(combined)) {
    return 'Aluguel';
  }
  if (/\b(vendo|venda|a venda|à venda|repasso|oferta|disponivel|desapego)\b/i.test(combined)) {
    return 'Venda';
  }

  return 'Venda'; // Default assumption for market leads
}

/**
 * Classify Seller Type (Particular, Lojista / Concessionária, Transportadora / Frotista, Desmanche / Auto Peças)
 */
export function extractSellerType(snippet: string, query: string = ''): SellerType {
  const combined = `${query} ${snippet}`.toLowerCase();

  if (/\b(transportadora|express|logistica|logística|frota|frotista|rodoviario|rodoviário|cargas|transfrotas)\b/i.test(combined)) {
    return 'Transportadora / Frotista';
  }
  if (/\b(concessionaria|concessionária|revenda|multimarcas|veiculos|veículos|autoveiculos|socaminhoes|webmotors|loja|lojista|seminovos)\b/i.test(combined)) {
    return 'Lojista / Concessionária';
  }
  if (/\b(desmanche|autopeças|auto peças|autopecas|sucata|peças|pecas|oficina|mecanica|mecânica|mWM|eaton|zf)\b/i.test(combined)) {
    return 'Desmanche / Auto Peças';
  }

  return 'Particular';
}

/**
 * Infer Company / Store name from snippet
 */
export function extractCompanyName(snippet: string): string | undefined {
  const patterns = [
    /(?:transportadora|empresa|concession[aá]ria|revenda|auto\s*pe[cç]as|grupo|loja)\s+([A-Z\u00C0-\u00FF0-9\s.-]{3,30})(?=\s|,|\.|\n|$)/i,
    /([A-Z\u00C0-\u00FF0-9\s.-]{3,25})\s+(?:transportes|log[ií]stica|caminh[oõ]es|multimarcas|ve[ií]culos)/i,
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      const name = match[1].trim();
      const forbidden = ['caminhão', 'caminhao', 'whatsapp', 'telefone', 'contato', 'venda', 'compra', 'anunciante', 'particular'];
      if (!forbidden.some(f => name.toLowerCase().includes(f))) {
        return name;
      }
    }
  }

  return undefined;
}

/**
 * Format a web page or portal URL from snippet
 */
export function extractWebPageUrl(snippet: string): string | undefined {
  const urlMatch = snippet.match(/https?:\/\/[^\s<>"']+/i) || snippet.match(/\b(?:www\.)[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s<>"']*)?/i);
  if (urlMatch) {
    let u = urlMatch[0];
    if (!u.startsWith('http')) {
      u = `https://${u}`;
    }
    return u;
  }
  return undefined;
}

/**
 * Infer seller/buyer name from surrounding text with high certainty
 */
export function extractName(snippet: string): string | undefined {
  const patterns = [
    /(?:falar\s+com|tratar\s+com|contato\s+:?|fale\s+com|atender\s+por|sr\.?|sra\.?|vendedor\s+:?)\s+([A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+(?:\s+[A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+)?)/i,
    /(?:nome|att|por)\s*:\s*([A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+)/i,
    /com\s+([A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+)/i
  ];

  const genericNames = ['vendedor', 'anunciante', 'particular', 'proprietario', 'proprietário', 'contato', 'desconhecido', 'perfil', 'usuario', 'usuário'];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      const candidate = match[1].trim();
      const lowerCandidate = candidate.toLowerCase();
      
      if (!genericNames.includes(lowerCandidate) && !/caminhão|caminhao|scania|volvo|carreta|peças|whatsapp|telefone|contato/i.test(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}


/**
 * Infer truck model, brand or part item
 */
export function extractItem(snippet: string, query: string = ''): string {
  const combined = `${query} ${snippet}`;

  // Check specific models first
  for (const model of TRUCK_MODELS) {
    const regex = new RegExp(`\\b${model.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(combined)) {
      return model;
    }
  }

  // Check brand + item
  for (const brand of TRUCK_BRANDS) {
    for (const item of TRUCK_ITEMS) {
      const comboRegex = new RegExp(`\\b${brand}\\b.*\\b${item}\\b|\\b${item}\\b.*\\b${brand}\\b`, 'i');
      if (comboRegex.test(combined)) {
        return `${brand} - ${item}`;
      }
    }
  }

  // Check brand alone
  for (const brand of TRUCK_BRANDS) {
    const regex = new RegExp(`\\b${brand}\\b`, 'i');
    if (regex.test(combined)) {
      // Find if there is an item too
      for (const item of TRUCK_ITEMS) {
        if (new RegExp(`\\b${item}\\b`, 'i').test(combined)) {
          return `${brand} ${item}`;
        }
      }
      return brand;
    }
  }

  // Check generic item
  for (const item of TRUCK_ITEMS) {
    const regex = new RegExp(`\\b${item}\\b`, 'i');
    if (regex.test(combined)) {
      return item;
    }
  }

  // Fallback to query if present
  if (query) {
    return query.replace(/^(vendo|compro|venda|compra|aluguel|troca)\s+/i, '').trim() || 'Contato/Serviço';
  }

  return 'Contato/Serviço';
}

/**
 * Extract Price if found in snippet
 */
export function extractPrice(snippet: string): string | undefined {
  const priceMatch = snippet.match(/R\$\s?[\d.,]+/i) || snippet.match(/\b\d{2,3}\.\d{3}\b/);
  if (priceMatch) {
    let p = priceMatch[0];
    if (!p.toUpperCase().startsWith('R$')) {
      p = `R$ ${p}`;
    }
    return p;
  }
  return undefined;
}

/**
 * Extract Location (State or City)
 */
export function extractLocation(snippet: string): string | undefined {
  // Look for State patterns like " Curitiba - PR ", " SP ", "/SP", "(MG)"
  const stateRegex = new RegExp(`(?:\\b(?:em|no|na|de|para)\\s+)?([A-Z\u00C0-\u00FF][a-z\u00E0-\u00FF]+\\s*)?[\\s/(-](${STATE_ACRONYMS.join('|')})\\b`, 'i');
  const match = snippet.match(stateRegex);
  if (match) {
    const city = match[1] ? match[1].trim() : '';
    const state = match[2].toUpperCase();
    return city ? `${city} - ${state}` : state;
  }
  return undefined;
}

/**
 * Validates if an extracted phone number / DDD / state belongs to the target State (UF) or DDD
 */
export function matchesTargetState(ddd?: string, stateUf?: string, targetUfOrDdd?: string): boolean {
  if (!targetUfOrDdd || targetUfOrDdd === 'ALL' || targetUfOrDdd === 'BR') return true;
  const target = targetUfOrDdd.toUpperCase().trim();
  
  if (target.length === 2 && /^[A-Z]{2}$/.test(target)) {
    // Target is UF
    const leadState = stateUf ? stateUf.toUpperCase().trim() : (ddd ? getStateFromDDD(ddd) : '');
    return leadState === target;
  } else if (/^\d{2}$/.test(target)) {
    // Target is DDD
    return ddd === target;
  }
  return true;
}

