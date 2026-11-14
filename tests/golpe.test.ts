import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente, type Evento } from '../src/core/combate/motor';
import { accionConDano, calificarGolpe, GOLPE, posicionGolpe } from '../src/core/combate/golpe';

const especie = DATOS.jugables[0]!;
const batalla = () =>
  new Batalla(DATOS, [crearCombatiente(DATOS, especie.id, 30, {}), crearCombatiente(DATOS, DATOS.jugables[5]!.id, 30, {})], new Rng(42));

describe('Golpe justo', () => {
  it('califica según la distancia al centro', () => {
    expect(calificarGolpe(0.5)).toEqual({ nota: 'perfecto', mult: GOLPE.perfecto.mult });
    expect(calificarGolpe(0.5 + GOLPE.perfecto.distancia + 0.01).nota).toBe('bien');
    expect(calificarGolpe(0.5 - GOLPE.bien.distancia - 0.01)).toEqual({ nota: 'fallo', mult: 1 });
    expect(calificarGolpe(0).nota).toBe('fallo');
  });

  it('la marca va y vuelve entre 0 y 1', () => {
    expect(posicionGolpe(0, 0)).toBe(0);
    expect(posicionGolpe(GOLPE.cruce, 0)).toBeCloseTo(1);
    expect(posicionGolpe(GOLPE.cruce * 2, 0)).toBeCloseTo(0);
    expect(posicionGolpe(GOLPE.cruce / 2, 1)).toBeCloseTo(0.5);
  });

  it('solo aparece en acciones que hacen daño', () => {
    const bat = batalla();
    const habs = bat.act(0).habilidades;
    const ofensiva = habs.findIndex((h) => h.def.potencia > 0);
    const apoyo = habs.findIndex((h) => h.def.potencia === 0);
    expect(accionConDano(bat, 0, { tipo: 'habilidad', indice: ofensiva })).toBe(true);
    if (apoyo >= 0) expect(accionConDano(bat, 0, { tipo: 'habilidad', indice: apoyo })).toBe(false);
    expect(accionConDano(bat, 0, { tipo: 'empujon' })).toBe(true);
    expect(accionConDano(bat, 0, { tipo: 'definitivo' })).toBe(false);
  });

  it('el potenciador multiplica el daño del jugador', () => {
    const dano = (mult: number) => {
      const bat = batalla();
      bat.potenciador = [mult, 1];
      const ev: Evento[] = bat.ejecutarTurno({ tipo: 'empujon' }, { tipo: 'empujon' });
      const d = ev.find((e) => e.t === 'dano' && e.lado === 1);
      return d && d.t === 'dano' ? d.cantidad : 0;
    };
    const normal = dano(1);
    const perfecto = dano(GOLPE.perfecto.mult);
    expect(normal).toBeGreaterThan(0);
    expect(perfecto).toBeGreaterThan(normal);
    expect(perfecto / normal).toBeGreaterThan(1.1);
    expect(perfecto / normal).toBeLessThan(1.4);
  });
});
