import fs from 'fs';
let content = fs.readFileSync('src/components/LeadTable.tsx', 'utf8');
content = content.replace('bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm', 'glass-panel shadow-elegant rounded-2xl border border-slate-200/50 dark:border-slate-800');
fs.writeFileSync('src/components/LeadTable.tsx', content);
