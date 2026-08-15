import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

content = content.replace('ENTERPRISE', 'Enterprise');
fs.writeFileSync('src/components/Header.tsx', content);
