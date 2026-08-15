import fs from 'fs';
let content = fs.readFileSync('src/components/DashboardSkeleton.tsx', 'utf8');

content = content.replace(/bg-slate-900 text-white rounded-\[32px\] p-10 shadow-2xl flex flex-col justify-between min-h-\[220px\] animate-pulse/g, 'bg-slate-950 text-white rounded-2xl p-6 shadow-elegant border border-slate-800 flex flex-col justify-between min-h-[220px] animate-pulse');
content = content.replace(/bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-\[32px\] p-10 shadow-xs flex flex-col justify-between min-h-\[220px\] animate-pulse/g, 'glass-panel shadow-elegant text-slate-900 dark:text-white rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800 flex flex-col justify-between min-h-[220px] animate-pulse');

fs.writeFileSync('src/components/DashboardSkeleton.tsx', content);
