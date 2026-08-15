import fs from 'fs';
let content = fs.readFileSync('src/components/MetricCards.tsx', 'utf8');

content = content.replace(/bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm/g, 'glass-panel shadow-elegant rounded-2xl p-4 md:p-6 border border-slate-200/50 dark:border-slate-800');
content = content.replace(/bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-850 flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700 relative overflow-hidden/g, 'glass-panel shadow-elegant text-slate-900 dark:text-white rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between transition-all relative overflow-hidden group hover:border-blue-500/30');
content = content.replace(/bg-slate-950 text-white rounded-xl p-5 shadow-sm border border-slate-800 flex flex-col justify-between group transition-all hover:border-slate-700 relative overflow-hidden/g, 'bg-slate-950 text-white rounded-2xl p-6 shadow-elegant border border-slate-800 flex flex-col justify-between group transition-all relative overflow-hidden');

fs.writeFileSync('src/components/MetricCards.tsx', content);
