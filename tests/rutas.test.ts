import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo, nuevaCriatura } from '../src/core/estado/juego';
import { equipoEstacion, estaciones, ganarEstacion, vencidas } from '../src/core/modos/rutas';
import { entrenadorDelDia } from '../src/core/modos/entrenador';
import { jefeDeLaSemana } from '../src/core/modos/semanal';

const MARTES = new Date(2026, 10, 17, 12).getTime();
const mios = ['lumbrito', 'aletin', 'brotin'].map((id) => nuevaCriatura(id, 20, 'comun', false));

describe('caminos del Entrenador y del Jefe de la semana', () => {
  it('3 estaciones previas crecientes y el jefe al final', () => {
    for (const modo of ['entrenador', 'semanal'] as const) {
      const l = estaciones(DATOS, modo, MARTES, mios);
      expect(l).toHaveLength(4);
      expect(l.map((e) => e.jefe)).toEqual([false, false, false, true]);
      expect(l.slice(0, 3).map((e) => e.equipo.length)).toEqual([1, 2, 3]);
      expect(l[0]!.nivel).toBeLessThan(l[1]!.nivel);
      expect(l[2]!.nivel).toBeLessThan(l[3]!.nivel);
      for (const e of l) for (const id of e.equipo) expect(DATOS.criaturas.get(id)!.origen).toBeUndefined();
      expect(estaciones(DATOS, modo, MARTES, mios)).toEqual(l); // igual para todos ese día/semana
    }
    const ent = entrenadorDelDia(DATOS, MARTES);
    for (const e of estaciones(DATOS, 'entrenador', MARTES, mios).slice(0, 3)) for (const id of e.equipo) expect(DATOS.criaturas.get(id)!.tipo).toBe(ent.tipo);
    const tipo = DATOS.criaturas.get(jefeDeLaSemana(DATOS, MARTES))!.tipo;
    for (const e of estaciones(DATOS, 'semanal', MARTES, mios).slice(0, 3))
      for (const id of e.equipo) {
        expect(DATOS.criaturas.get(id)!.tipo).toBe(tipo);
        expect(DATOS.criaturas.get(id)!.etapa).toBeGreaterThanOrEqual(2);
      }
    expect(equipoEstacion(DATOS, 'semanal', MARTES, mios, 3)[0]!.especie.id).toBe(jefeDeLaSemana(DATOS, MARTES));
  });

  it('se avanza en orden, paga una vez y se reinicia al día (o semana) siguiente', () => {
    const e = estadoNuevo(DATOS, 0);
    const m0 = e.monedas;
    expect(vencidas(e, 'entrenador', MARTES)).toBe(0);
    expect(ganarEstacion(DATOS, e, 'entrenador', MARTES, 1, mios)).toBe(0); // fuera de orden
    expect(ganarEstacion(DATOS, e, 'entrenador', MARTES, 0, mios)).toBe(DATOS.economia.rutas.monedas[0]);
    expect(ganarEstacion(DATOS, e, 'entrenador', MARTES, 0, mios)).toBe(0); // repetida
    expect(vencidas(e, 'entrenador', MARTES)).toBe(1);
    expect(e.monedas).toBe(m0 + DATOS.economia.rutas.monedas[0]!);
    ganarEstacion(DATOS, e, 'entrenador', MARTES, 1, mios);
    ganarEstacion(DATOS, e, 'entrenador', MARTES, 2, mios);
    expect(vencidas(e, 'entrenador', MARTES)).toBe(3);
    expect(ganarEstacion(DATOS, e, 'entrenador', MARTES, 3, mios)).toBe(0); // el jefe va por su premio de siempre
    expect(vencidas(e, 'semanal', MARTES)).toBe(0); // caminos independientes
    expect(vencidas(e, 'entrenador', MARTES + 86_400_000)).toBe(0);
    expect(vencidas(e, 'semanal', MARTES)).toBe(0);
  });
});
