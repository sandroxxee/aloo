import fs from 'fs';
let content = fs.readFileSync('src/components/AiLeadSalesProspector.tsx', 'utf8');
content = content.replace(/<p className="text-xs text-slate-500 font-medium">Estruture pacotes, encontre compradores e automatize o envio da oferta.<\/p>/, '');
fs.writeFileSync('src/components/AiLeadSalesProspector.tsx', content);
