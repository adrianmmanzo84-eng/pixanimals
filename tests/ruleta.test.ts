import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { estadoNuevo } from '../src/core/estado/juego';
import { deserializar } from '../src/core/estado/guardado';
import { faltaRuleta, girarRuleta, probabilidades, ruletaDisponible } from '../src/core/progresion/ruleta';

const HORA = 3_600_000;
/** Mediodía local de un día cualquiera, para no caer cerca de la medianoche. */
const mediodia = new Date(2026, 10, 13, 12, 0, 0).getTime();

describe('ruleta diaria', () => {
  it('nunca da criaturas: solo monedas, Esencia, sobres e ítems', () => {
    for (const s of DATOS.economia.ruleta.segmentos) {
      const claves = Object.keys(s.premio).filter((k) => k !== 'cantidad');
      for (const k of claves) expect(['monedas', 'esencia', 'sobre', 'item']).toContain(k);
    }
  });

  it('las probabilidades suman 100 y el premio grande es el más raro', () => {
    const p = probabilidades(DATOS);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    const especial = DATOS.economia.ruleta.segmentos.findIndex((s) => s.especial);
    expect(p[especial]).toBe(Math.min(...p));
  });

  it('un giro por día: el segundo del mismo día no hace nada y al día siguiente vuelve', () => {
    const e = estadoNuevo(DATOS, 0);
    expect(ruletaDisponible(e, mediodia)).toBe(true);
    expect(girarRuleta(DATOS, e, new Rng(1), mediodia)).not.toBeNull();
    const copia = JSON.stringify(e);
    expect(girarRuleta(DATOS, e, new Rng(2), mediodia + 5 * HORA)).toBeNull();
    expect(JSON.stringify(e)).toBe(copia);
    expect(ruletaDisponible(e, mediodia + 24 * HORA)).toBe(true);
    expect(faltaRuleta(mediodia)).toBe(12 * HORA);
  });

  it('entrega el premio de la casilla que sale, y las casillas salen según su peso', () => {
    const veces = DATOS.economia.ruleta.segmentos.map(() => 0);
    const rng = new Rng(7);
    for (let d = 0; d < 4000; d++) {
      const e = estadoNuevo(DATOS, 0);
      const antes = { monedas: e.monedas, esencia: e.esencia };
      const i = girarRuleta(DATOS, e, rng, mediodia)!;
      veces[i]!++;
      const p = DATOS.economia.ruleta.segmentos[i]!.premio;
      expect(e.monedas - antes.monedas).toBe(p.monedas ?? 0);
      expect(e.esencia - antes.esencia).toBe(p.esencia ?? 0);
      if (p.sobre) expect(e.sobresRegalo[p.sobre]).toBe(1);
      if (p.item) expect(e.inventario[p.item]).toBe(p.cantidad);
      expect(e.criaturas).toHaveLength(0);
    }
    const prob = probabilidades(DATOS);
    veces.forEach((v, i) => expect(Math.abs((v / 4000) * 100 - prob[i]!)).toBeLessThan(2.5));
  });

  it('una partida v5 se migra a v6 con la ruleta disponible', () => {
    const e = estadoNuevo(DATOS, 0) as unknown as Record<string, unknown>;
    e.version = 5;
    delete e.ruleta;
    const m = deserializar(JSON.stringify(e))!;
    expect(m.version).toBe(6);
    expect(ruletaDisponible(m, mediodia)).toBe(true);
  });
});
