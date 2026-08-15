import fs from 'fs';
let config = fs.readFileSync('vite.config.ts', 'utf8');
config = config.replace("'lucide-react', 'firebase']", "'lucide-react']");
fs.writeFileSync('vite.config.ts', config);
