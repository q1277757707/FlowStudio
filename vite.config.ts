import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { viteApiMockPlugin } from './mock/viteApiMockPlugin';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [vue(), viteApiMockPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: `${rootDir}/index.html`,
        eventGuide: `${rootDir}/event-guide.html`
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@designer-core': fileURLToPath(new URL('./packages/designer-core/src', import.meta.url)),
      '@designer-materials': fileURLToPath(new URL('./packages/designer-materials/src', import.meta.url)),
      '@designer-renderer': fileURLToPath(new URL('./packages/designer-renderer/src', import.meta.url)),
      '@designer-sandbox': fileURLToPath(new URL('./packages/designer-sandbox/src', import.meta.url)),
      '@designer-event': fileURLToPath(new URL('./packages/designer-event/src', import.meta.url)),
      '@app-designer': fileURLToPath(new URL('./packages/app-designer/src', import.meta.url))
    }
  }
});
