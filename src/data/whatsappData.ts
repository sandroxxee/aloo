import { WhatsAppChip, WhatsAppGroup, AutoReplyRule, MessageTemplate } from '../types';

export const INITIAL_MULTI_CHIPS: WhatsAppChip[] = [
  { id: 'chip_1', name: 'Chip #1 (Linha Principal)', phone: '(51) 98327-3324', status: 'active', sentCount: 18, dailyLimit: 200 },
  { id: 'chip_2', name: 'Chip #2 (Vendas Comercial)', phone: '(11) 97123-4567', status: 'active', sentCount: 11, dailyLimit: 200 },
  { id: 'chip_3', name: 'Chip #3 (Suporte Frotas)', phone: '(41) 99888-7766', status: 'active', sentCount: 5, dailyLimit: 200 },
];

export const INITIAL_GROUPS: WhatsAppGroup[] = [
  {
    id: 'grp_1',
    name: 'VIP - Ofertas & Repasse de Caminhões',
    category: 'Compradores Frotas',
    inviteLink: 'https://chat.whatsapp.com/Dk82F92Ksk921Ks8',
    description: 'Grupo exclusivo para frotistas e compradores diretos com oportunidades com valor abaixo da tabela.',
    memberCount: 142,
    createdDate: '15/07/2026'
  },
  {
    id: 'grp_2',
    name: 'Desmonte & Peças Pesadas Volvo/Scania',
    category: 'Venda de Peças',
    inviteLink: 'https://chat.whatsapp.com/Lp993Ksk8110Qazx',
    description: 'Grupo focado no envio rápido de lotes de peças, caixas, motores e diferenciais para socorro imediato.',
    memberCount: 89,
    createdDate: '22/07/2026'
  }
];

export const INITIAL_AUTO_REPLIES: AutoReplyRule[] = [
  {
    id: 'ar_1',
    triggerKeywords: 'olá, oi, bom dia, boa tarde, boa noite, interessado, proposta',
    replyText: 'Olá {nome}! Tudo bem? Recebi seu contato referente ao {marca} em {cidade} (anunciado por {preco}). Como posso agilizar seu atendimento hoje?',
    category: 'Atendimento Inicial',
    enabled: true,
  },
  {
    id: 'ar_2',
    triggerKeywords: 'preço, valor, quanto custa, tabela, pix, desconto, oferta',
    replyText: 'Olá {nome}! O valor cadastrado para o {marca} em {cidade} é de {preco}. Temos flexibilidade para pagamento à vista ou propostas de repasse. Quer enviar sua oferta?',
    category: 'Negociação',
    enabled: true,
  },
  {
    id: 'ar_3',
    triggerKeywords: 'onde fica, cidade, localização, endereço, vistoria, ver caminhão, fotos',
    replyText: 'Perfeito {nome}! O {marca} está localizado na região de {cidade}. Podemos agendar uma visita presencial ou enviar vídeos detalhados da cabine e mecânica!',
    category: 'Vistoria & Fotos',
    enabled: true,
  },
  {
    id: 'ar_4',
    triggerKeywords: 'disponível, ainda tem, ta a venda, estoque, disponível?',
    replyText: 'Sim {nome}! O {marca} anunciado em {cidade} por {preco} continua disponível no estoque para negociação rápida.',
    category: 'Estoque',
    enabled: true,
  }
];

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 't_system_promotion_1',
    name: '🚀 Divulgação de Hub de Negócios (Sincronização)',
    category: 'Divulgação / Sistema',
    text: '{Olá|Oi|Tudo bem}! Vi seu anúncio referente a {item}. Já pensou em centralizar suas ofertas em um Hub de Negócios integrado? É a forma mais eficiente de conectar ativos no Brasil hoje. Me diga se quer saber como otimizar seu alcance!'
  },
  {
    id: 't_system_promotion_2',
    name: '🤖 Oferecimento de Inteligência de Ativos (Business Sync)',
    category: 'Divulgação / Sistema',
    text: '{Fala|Opa|Olá}! Notei que você trabalha com {item}. Sabia que temos um sistema de inteligência de mercado e sincronização de contatos integrado para alavancar seus fluxos comerciais? Posso te explicar rápido como funciona?'
  },
  {
    id: 't_broadcast_general',
    name: '📢 Divulgação Geral Padrão (Para Todos)',
    category: 'Universal / Neutro',
    text: '{Olá|Oi|Tudo bem}! Vi sua publicação referente a {item} em {cidade}. Temos ótimas condições para fechar negócio hoje. Como posso te ajudar?'
  },
  {
    id: 't_universal_1',
    name: '🌐 Abordagem Universal (Sem Nome e Intenção Neutra)',
    category: 'Universal / Neutro',
    text: '{Olá|Oi|Tudo bem}! Vi sua publicação referente a {item} em {cidade}. Você ainda está negociando ele?'
  },
  {
    id: 't_universal_2',
    name: '🎯 Pergunta Direta de Anúncio (Alta Resposta)',
    category: 'Universal / Neutro',
    text: '{Oi|Fala|Tudo joia}! Sobre o anúncio do {item} em {cidade}: o valor de {preco} continua mantido pra negócio?'
  },
  {
    id: 't_micro',
    name: '⚡ Micro-Comprometimento Rápido',
    category: 'Compra de Caminhão',
    text: '{Olá|Oi|Tudo bem|Fala} {nome}! O {item} de {cidade} ainda está disponível?'
  },
  {
    id: 't_buyer',
    name: '🤝 Cliente Comprador Pronto na Fila',
    category: 'Compra de Caminhão',
    text: '{Olá|Oi} {nome}! Tenho um cliente frotista interessado procurando exatamente um {item} em {cidade}. Qual o valor mínimo que você faz à vista hoje?'
  },
  {
    id: 't_pix',
    name: '💰 Liquidez Imediata PIX À Vista',
    category: 'Oferta À Vista',
    text: '{Oi|Olá|Bom dia} {nome}! Gostei muito do {item} em {cidade}. Se fecharmos hoje com PIX na hora, quanto consegue fazer?'
  },
  {
    id: 't_repasse',
    name: '🔄 Avaliação para Troca / Repasse de Frota',
    category: 'Troca / Repasse',
    text: '{Olá|Oi} {nome}! Trabalho com renovação de frota. Aceita veículo na troca pelo {item} ou prefere só venda à vista?'
  }
];

export const AI_NICHE_GENERATOR_IDEAS: Record<string, string[]> = {
  'Universal / Neutro': [
    '{Olá|Oi|Tudo bem}! Vi sua publicação referente a {item} em {cidade}. O anúncio ainda está ativo para negócio?',
    '{Oi|Fala}! Vi o {item} publicado em {cidade} por {preco}. Você está vendendo ou procurando para comprar?',
    '{Olá|Bom dia}! Gostaria de informações atualizadas sobre a publicação do {item} em {cidade}. Podemos conversar?'
  ],
  'Compra de Caminhão': [
    'Oi {nome}! O {item} em {cidade} ainda está disponível? Tenho um frotista interessado para fechar este mês.',
    'Fala {nome}, tudo bem? Vi seu {item}. Qual o mínimo que você faz à vista sem intermediários?',
    'Olá {nome}! Gostaria de saber se o {item} em {cidade} aceita vistoria cautelar e proposta à vista hoje?'
  ],
  'Venda de Peça': [
    'Oi {nome}! Preciso desse {item} em {cidade} pra socorro de um caminhão da frota. Consegue despacho imediato?',
    'Fala {nome}, vi seu anúncio do {item} ({preco}). Tem conversa no preço pra gente fechar e retirar agora?'
  ],
  'Troca / Repasse': [
    'Olá {nome}! Tudo joia? Sobre o {item} em {cidade}: pega carro/caminhão no negócio ou prefere pagamento via PIX?',
    'Fala {nome}! Tenho interesse em repasse do {item}. Me manda fotos e detalhes se ainda estiver com ele!'
  ],
  'Oferta À Vista': [
    '💰 {nome}, proposta direta: fecho o {item} em {cidade} por {preco} com transferência PIX imediata! Vamos fechar?',
    'Oi {nome}! Tenho capital alocado para compra do {item} ({preco}). Se estiver 100% OK, retiro essa semana.'
  ]
};
