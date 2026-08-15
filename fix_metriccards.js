import fs from 'fs';
let content = fs.readFileSync('src/components/MetricCards.tsx', 'utf8');

content = content.replace(/<p className="text-xs text-slate-300 mt-2 leading-relaxed">[\s\S]*?<\/p>/, '');
content = content.replace(/<p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">[\s\S]*?<\/p>/g, '');

fs.writeFileSync('src/components/MetricCards.tsx', content);
