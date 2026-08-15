import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills(),
    chunkSplitPlugin({
      strategy: 'default',
      customSplitting: {
        // App specific modules can be split into logical chunks if helpful
        'app-intelligence-engines': [
          './src/utils/keywordBrain.ts',
          './src/utils/smartSearchOrchestrator.ts',
          './src/utils/opportunityEngine.ts',
          './src/utils/leadMergerEngine.ts',
          './src/utils/cadenceEngine.ts'
        ],
        'app-components-heavy': [
          './src/components/LeadTable.tsx',
          './src/components/GoogleMapsScanner.tsx',
          './src/components/LeafletScannerMap.tsx',
          './src/components/KeywordManager.tsx'
        ]
      }
    })
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  optimizeDeps: {
    entries: [
      './src/main.tsx',
      './src/App.tsx'
    ],
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'axios',
      'motion/react',
      'framer-motion',
      'vite-plugin-node-polyfills/shims/buffer'
    ]
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      external: [
        'util', 'zlib', 'crypto', 'fs', 'net', 'tls', 'stream', 'stream/promises', 'path', 'os', 'child_process', 'events', 'url', 'http', 'https', 'assert', 'querystring', 'buffer', 'async_hooks', 'fs/promises',
        'node:child_process', 'node:crypto', 'node:fs', 'node:path', 'node:os', 'node:util', 'node:module', 'node:v8', 'node:buffer', 'node:events', 'node:stream'
      ]
    }
  }
});