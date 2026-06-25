import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import manifest from './src/manifest';

export default defineConfig({
  plugins: [tailwindcss(), crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: 'index.html',
        'group-add': 'group-add.html',
        'add-rule': 'add-rule.html',
      },
    },
  },
});
