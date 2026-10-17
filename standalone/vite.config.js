import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

// Build a separate game-only entry. Never overwrite the hosted app or remove
// game hooks. No Base44 plugin/auth/backend; official CrazyGames SDK is loaded in HTML.
export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  base: './',
  publicDir: false,
  define: { 'import.meta.env.CRAZYGAMES': 'true' },
  plugins: [
    react(),
    { name: 'standalone-html', transformIndexHtml: {
      order: 'pre',
      handler: () => readFileSync(new URL('./index.html', import.meta.url), 'utf8'),
    }, generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        for (const id of Object.keys(output.modules)) {
          if (/@base44[\\/]|src[\\/](api[\\/]|lib[\\/]AuthContext)/.test(id)) throw new Error(`Hosted-only dependency in standalone game: ${id}`);
        }
      }
      for (const name of ['Inter-OFL.txt', 'Orbitron-OFL.txt']) {
        this.emitFile({ type: 'asset', fileName: `licenses/${name}`, source: readFileSync(new URL(`../src/assets/fonts/${name}`, import.meta.url), 'utf8') });
      }
    } },
  ],
  resolve: { alias: [
    { find: '@/App.jsx', replacement: fileURLToPath(new URL('./src/App.jsx', import.meta.url)) },
    { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
  ] },
  build: { outDir: 'dist-standalone', emptyOutDir: true, sourcemap: false },
});