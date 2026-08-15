import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">\s*Este painel de inteligência comercial está protegido para assegurar o correto uso das APIs de busca e automação de envios\.\s*<\/p>/, '<p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">Acesso Restrito</p>');
content = content.replace(/<p className="text-\[11px\] text-slate-500 dark:text-slate-400 font-medium mt-0\.5">Acesso rápido aos módulos de inteligência, manutenção e sincronização\.<\/p>/, '');

fs.writeFileSync('src/App.tsx', content);
