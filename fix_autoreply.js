import fs from 'fs';
let content = fs.readFileSync('src/components/WhatsAppAutoReplyManager.tsx', 'utf8');

content = content.replace(/<p className="text-sm text-slate-500 leading-relaxed">Persuasivo, focado em fechar negócios, convencer a visitar o pátio e pegar o telefone de contato\.<\/p>/, '<p className="text-sm text-slate-500 leading-relaxed">Persuasivo</p>');
content = content.replace(/<p className="text-sm text-slate-500 leading-relaxed">Técnica e direta\. Excelente para esclarecer dúvidas sobre marcas de peças pesadas e orçamentos\.<\/p>/, '<p className="text-sm text-slate-500 leading-relaxed">Consultoria Técnica</p>');
content = content.replace(/<p className="text-sm text-slate-500 leading-relaxed">Altamente focado na resolução imediata de dúvidas operacionais, prazos e fretes\.<\/p>/, '<p className="text-sm text-slate-500 leading-relaxed">Operacional e Fretes</p>');
content = content.replace(/<p className="text-xs text-slate-400 max-w-xs mt-0\.5">As conversas automáticas reais geradas pelo bot no seu WhatsApp conectado aparecerão aqui em tempo real\.<\/p>/, '');

fs.writeFileSync('src/components/WhatsAppAutoReplyManager.tsx', content);
