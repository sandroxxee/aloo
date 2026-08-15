import fs from 'fs';
let content = fs.readFileSync('src/components/MetricCards.tsx', 'utf8');

content = content.replace("description: 'Leads capturados via inteligência artificial e varredura web'", "description: 'Descoberta autônoma via IA comercial'");
content = content.replace("description: 'Leads inseridos manualmente ou por planilhas externas'", "description: 'Injeção via CSV / Excel'");
content = content.replace("description: 'Leads extraídos de cadastros comerciais e listas públicas'", "description: 'Sinais empresariais da Receita Federal'");
content = content.replace("description: 'Anúncios minerados na plataforma OLX'", "description: 'Radar de Oportunidades: OLX'");
content = content.replace("description: 'Anúncios minerados no Mercado Livre'", "description: 'Radar de Oportunidades: Mercado Livre'");
content = content.replace("description: 'Anúncios do Facebook Marketplace e Instagram'", "description: 'Mapeamento de Social Selling'");

fs.writeFileSync('src/components/MetricCards.tsx', content);
