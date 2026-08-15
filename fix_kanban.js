import fs from 'fs';
let content = fs.readFileSync('src/components/KanbanCrmBoard.tsx', 'utf8');

content = content.replace('bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80', 'glass-panel shadow-sm rounded-xl overflow-hidden');
content = content.replace(/border-t-4 \$\{col\.headerBorder\} rounded-t-xl bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/g, 'bg-white dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800');

fs.writeFileSync('src/components/KanbanCrmBoard.tsx', content);
