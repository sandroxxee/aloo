import fs from 'fs';
let config = fs.readFileSync('vite.config.ts', 'utf8');

const replacement = `    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'motion/react', 'lucide-react', 'firebase'],
          charts: ['recharts', 'd3']
        }
      },
      external: [`;

config = config.replace('    rollupOptions: {\n      external: [', replacement);
fs.writeFileSync('vite.config.ts', config);
