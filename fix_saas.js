import fs from 'fs';
let content = fs.readFileSync('src/components/SaaSMonetizationPlannerModal.tsx', 'utf8');
content = content.replace(/<p className="text-xs text-slate-500 font-medium">Calcule quanto você can faturar vendendo leads, comissões e assinaturas<\/p>/, '');
fs.writeFileSync('src/components/SaaSMonetizationPlannerModal.tsx', content);
