import { describe, expect, it } from 'vitest';
import { CANCIONES } from '../src/audio/canciones';
import { leerCanal } from '../src/audio/musica';
import { DATOS } from '../src/core/datos';

describe('canciones (D274)', () => {
  for (const [id, c] of Object.entries(CANCIONES)) {
    it(`${id}: los cuatro canales miden lo mismo (el bucle no se desfasa)`, () => {
      const largos = (['p1', 'p2', 'tri', 'ruido'] as const).map((k) => leerCanal(c[k], k === 'ruido').largo);
      expect(new Set(largos).size, `${id}: ${largos.join(', ')}`).toBe(1);
      expect(largos[0]! % 16, 'compases enteros de 16 pasos').toBe(0);
    });
  }
  it('las canciones de historia tienen al menos 8 compases (el doble que las de antes)', () => {
    for (const id of ['mapa', 'prologo', 'eclipse', 'arquitecto', ...DATOS.historia.regiones.map((r) => `region_${r.id}`)]) {
      const c = CANCIONES[id]!;
      expect(c, id).toBeDefined();
      expect(leerCanal(c.p1).largo, id).toBeGreaterThanOrEqual(128);
    }
  });
});

describe('uso de la música en las escenas (D274)', () => {
  it('toda canción nombrada en una escena existe', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = new URL('../src/escenas/', import.meta.url);
    const ids = new Set<string>();
    const lee = (d: URL) => {
      for (const f of readdirSync(d, { withFileTypes: true })) {
        if (f.isDirectory()) lee(new URL(`${f.name}/`, d));
        else if (f.name.endsWith('.ts')) {
          const txt = readFileSync(new URL(f.name, d), 'utf8');
          for (const m of txt.matchAll(/(?:musica\.tocar\(|musica: )\s*'([a-z_0-9]+)'/g)) ids.add(m[1]!);
        }
      }
    };
    lee(dir);
    expect(ids.size).toBeGreaterThanOrEqual(6);
    for (const id of ids) expect(CANCIONES[id], id).toBeDefined();
  });
  it('cada región tiene su canción', () => {
    for (const r of DATOS.historia.regiones) expect(CANCIONES[`region_${r.id}`], r.id).toBeDefined();
  });
});
