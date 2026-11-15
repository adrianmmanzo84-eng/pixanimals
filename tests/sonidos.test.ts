import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Evita que vuelva a pasar lo de la v0.15.1: todo `sonido.tocar('x')` del código debe existir en sfx.ts. */
function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? archivos(p) : p.endsWith('.ts') ? [p] : [];
  });
}

describe('Sonidos', () => {
  it('cada sonido que se toca existe', () => {
    const sfx = readFileSync('src/audio/sfx.ts', 'utf8');
    const definidos = new Set([...sfx.matchAll(/^\s{2}([a-z0-9_]+): \[/gm)].map((m) => m[1]));
    for (let i = 0; i < 4; i++) definidos.add(`eco${i}`);
    const usados = new Set<string>();
    for (const f of archivos('src')) for (const m of readFileSync(f, 'utf8').matchAll(/sonido\.tocar\('([a-z0-9_]+)'\)/g)) usados.add(m[1]!);
    const faltan = [...usados].filter((u) => !definidos.has(u));
    expect(faltan).toEqual([]);
  });
});
