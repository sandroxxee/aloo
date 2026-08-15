import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');
content = content.replace('text-xl font-display font-medium text-slate-900 tracking-[0.2em] uppercase', 'text-2xl font-display font-medium text-slate-900 dark:text-white');
content = content.replace('px-2 py-0.5 text-[8px] font-bold bg-slate-900 text-white rounded tracking-[0.2em]', 'px-2.5 py-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700');
content = content.replace('text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1 hidden sm:block', 'text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 hidden sm:block');
fs.writeFileSync('src/components/Header.tsx', content);
