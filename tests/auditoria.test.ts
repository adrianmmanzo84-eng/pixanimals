import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DATOS } from '../src/core/datos';
import { equipoBajo, MARGEN_BAJO, nivelDelEquipo, nivelParada } from '../src/core/modos/historia';
import { ZONAS, zonaDeRegion } from '../src/core/modos/practica';
import type { CriaturaJugador } from '../src/esquemas/esquemas';

const con = (...niveles: number[]) => niveles.map((nivel) => ({ nivel }) as CriaturaJugador);

describe('correcciones de la auditoría (D278)', () => {
  it('nivel medio del equipo', () => {
    expect(nivelDelEquipo(con(5, 5, 6))).toBe(5);
    expect(nivelDelEquipo(con(7, 8, 8))).toBe(8);
    expect(nivelDelEquipo([])).toBe(1);
  });

  it('avisa con el equipo 3 niveles o más por debajo', () => {
    expect(MARGEN_BAJO).toBe(3);
    expect(equipoBajo(11, 14)).toBe(true);
    expect(equipoBajo(12, 14)).toBe(false);
    expect(equipoBajo(7, 14)).toBe(true);
    // El primer jefe del Bosque se juega recién salido del prólogo (Nv 5 contra 7): no debe asustar.
    expect(equipoBajo(DATOS.sobres.nivelInicial, nivelParada(DATOS.historia.regiones[0]!, 0))).toBe(false);
  });

  it('cada región tiene su zona de práctica para el atajo', () => {
    DATOS.historia.regiones.forEach((r, i) => {
      const z = ZONAS[zonaDeRegion(i)]!;
      expect(z.region).toBe(i);
      // La zona sirve para entrenar hacia el nivel de la región.
      expect(z.nivel[1]).toBeLessThanOrEqual(r.nivel);
    });
  });

  it('Atrás de Android cierra cada panel con un botón que existe', () => {
    const html = readFileSync('index.html', 'utf8');
    const nativo = readFileSync('src/nativo.ts', 'utf8');
    for (const [, panel, boton] of nativo.matchAll(/\['([\w-]+)', '([\w-]+)'\]/g)) {
      expect(html).toContain(`id="${panel}"`);
      expect(html).toContain(`id="${boton}"`);
    }
  });

  it('en compras, un toque en la pantalla no compra', () => {
    const compras = readFileSync('src/escenas/Compras.ts', 'utf8');
    expect(compras).toMatch(/a === 'a'\) \{\s*\/\/[^\n]*\n\s*if \(Entrada\.esToque\(\)\) return;/);
  });

  it('no quedan textos fijos en español en la Bolsa', () => {
    expect(readFileSync('src/escenas/BolsaEscena.ts', 'utf8')).not.toContain(".poner('B: volver')");
  });
});
