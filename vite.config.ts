import { defineConfig } from 'vite';

// base relativa: el build funciona en cualquier subcarpeta (GitHub Pages, Cloudflare Pages, itch.io).
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 2500 },
  test: { include: ['tests/**/*.test.ts'] },
} as never);
