import fs from 'fs';

// Update App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  /\{autoEngineRotation \? 'Rotação On' : 'Rotação Off'\}/g,
  "{autoEngineRotation ? 'Motores Dinâmicos' : 'Motor Fixo'}"
);
appContent = appContent.replace(
  /<span className="block font-black text-indigo-400 dark:text-indigo-600 mb-1">🤖 AUTO-ROTAÇÃO DE MOTOR<\/span>/g,
  '<span className="block font-black text-indigo-400 dark:text-indigo-600 mb-1">🤖 MOTORES DINÂMICOS</span>'
);
fs.writeFileSync('src/App.tsx', appContent);

// Update LoopController.tsx
let loopContent = fs.readFileSync('src/components/LoopController.tsx', 'utf8');
loopContent = loopContent.replace(
  /<span>Auto-Rotação<\/span>/g,
  '<span>Motores Dinâmicos</span>'
);
loopContent = loopContent.replace(
  /<span className="block font-bold text-indigo-400 dark:text-indigo-600 mb-1">🤖 AUTO-ROTAÇÃO DE MOTOR<\/span>/g,
  '<span className="block font-bold text-indigo-400 dark:text-indigo-600 mb-1">🤖 MOTORES DINÂMICOS</span>'
);
fs.writeFileSync('src/components/LoopController.tsx', loopContent);

console.log('Successfully updated rotation text in App.tsx and LoopController.tsx');
