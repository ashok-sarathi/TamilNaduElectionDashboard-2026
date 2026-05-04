import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootOutputJson = resolve(__dirname, 'output.json');

export default defineConfig({
  root: 'application',
  base: './',
  plugins: [
    react(),
    {
      name: 'serve-root-output-json',
      configureServer(server) {
        server.middlewares.use('/output.json', (_request, response) => {
          if (!existsSync(rootOutputJson)) {
            response.statusCode = 404;
            response.end('output.json not found');
            return;
          }

          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(readFileSync(rootOutputJson, 'utf8'));
        });
      }
    }
  ],
  build: {
    outDir: '../dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/index.css';
          }
          return 'assets/[name][extname]';
        }
      }
    }
  }
});
