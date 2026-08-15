import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/Senha padrão de demonstração: <strong className="text-slate-400">1234<\/strong>/g, 'Senha padrão do sistema: <strong className="text-slate-400">1234</strong>');
content = content.replace(/<span>Entrar Direto com Senha Padrão \(1234\)<\/span>/g, '<span>Entrar com Senha Padrão (1234)</span>');
content = content.replace(/<span>Redefinir Senha para 1234 & Entrar Agora<\/span>/g, '<span>Redefinir Senha (1234)</span>');

fs.writeFileSync('src/App.tsx', content);
console.log('Updated App.tsx passcode screen text');
