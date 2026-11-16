import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const version = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }).version;
let commit = (process.env.GITHUB_SHA ?? '').slice(0, 7);
try {
  commit ||= execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  /* sin git */
}

// base relativa: el build funciona en cualquier subcarpeta (GitHub Pages, Cloudflare Pages, itch.io).
export default defineConfig({
  base: './',
  define: { __VERSION__: JSON.stringify(version), __COMMIT__: JSON.stringify(commit) },
  build: { target: 'es2022', chunkSizeWarningLimit: 2500 },
  test: { include: ['tests/**/*.test.ts'] },
} as never);
