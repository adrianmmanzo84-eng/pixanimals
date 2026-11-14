import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { migrar } from '../src/core/estado/guardado';
import { EstadoJuegoZ } from '../src/esquemas/esquemas';
import { equipoSemanal, jefeDeLaSemana, semanaLocal, tipoDeLaSemana } from '../src/core/modos/semanal';
import { datosPiso, equipoPiso, guardianDePiso } from '../src/core/modos/torre';
import { progresoJefes, registrarJefe } from '../src/core/modos/jefes';
import { progresoMedalla } from '../src/core/progresion/coleccion';

const DIA = 86_400_000;
const jefes = [...DATOS.criaturas.values()].filter((c) => c.jefe);

describe('jefes', () => {
  it('hay 14 semanales (2 por tipo) y 6 Guardianes, y no son criaturas del jugador', () => {
    expect(jefes.filter((j) => j.jefe === 'semanal')).toHaveLength(14);
    expect(jefes.filter((j) => j.jefe === 'guardian')).toHaveLength(6);
    for (const tipo of DATOS.tipos.keys()) if (tipo !== 'neutro') expect(jefes.filter((j) => j.jefe === 'semanal' && j.tipo === tipo)).toHaveLength(2);
    for (const j of jefes) expect(DATOS.jugables).not.toContain(j);
    expect(DATOS.jugables).toHaveLength(165);
    expect(new Set(jefes.map((j) => j.sprites)).size).toBe(20);
  });

  it('ningún jefe es más débil que una forma final normal (520) y los Guardianes pasan de 600', () => {
    const total = (id: string) => Object.values(DATOS.criaturas.get(id)!.base).reduce((a, b) => a + b, 0);
    for (const j of jefes) expect(total(j.id)).toBeGreaterThanOrEqual(520);
    for (const id of Object.values(DATOS.economia.torre.guardianes)) expect(total(id)).toBeGreaterThanOrEqual(600);
  });

  it('el jefe de la semana es del tipo de la semana y sus 2 jefes se turnan', () => {
    const lunes = 4 * DIA;
    for (let w = 0; w < 14; w++) {
      const ahora = lunes + w * 7 * DIA;
      const jefe = DATOS.criaturas.get(jefeDeLaSemana(DATOS, ahora))!;
      expect(jefe.jefe).toBe('semanal');
      expect(jefe.tipo).toBe(tipoDeLaSemana(DATOS, ahora));
      // El mismo tipo vuelve 7 semanas después con el otro jefe, y a las 14 con el mismo.
      expect(jefeDeLaSemana(DATOS, ahora + 7 * 7 * DIA)).not.toBe(jefe.id);
      expect(jefeDeLaSemana(DATOS, ahora + 14 * 7 * DIA)).toBe(jefe.id);
    }
    expect(semanaLocal(lunes, 0)).toBeGreaterThan(0);
  });

  it('el equipo semanal lleva al jefe al frente', () => {
    const ahora = 10 * DIA;
    const equipo = equipoSemanal(DATOS, ahora, [{ especie: 'solarion', nivel: 30, xp: 0, rareza: 'comun', brillante: false, vitaminas: {}, entrenamiento: 0, amuleto: null }]);
    expect(equipo[0]!.especie.id).toBe(jefeDeLaSemana(DATOS, ahora));
  });

  it('los Guardianes ocupan los pisos 30, 40, 50, 60, 80 y 100 y van al frente del equipo rival', () => {
    expect(Object.keys(DATOS.economia.torre.guardianes).map(Number)).toEqual([30, 40, 50, 60, 80, 100]);
    for (const [piso, id] of Object.entries(DATOS.economia.torre.guardianes)) {
      const p = datosPiso(DATOS, Number(piso), 3);
      expect(p.jefe).toBe(true);
      expect(p.guardian).toBe(id);
      expect(p.especies[0]).toBe(id);
      expect(equipoPiso(DATOS, p)[0]!.especie.jefe).toBe('guardian');
    }
    expect(guardianDePiso(DATOS, 35)).toBeNull();
    expect(datosPiso(DATOS, 35, 3).guardian).toBeNull();
  });

  it('la primera victoria contra un jefe da su insignia, una sola vez, y cuenta para la medalla', () => {
    const e = estadoNuevo(DATOS, 0);
    expect(registrarJefe(DATOS, e, 'caldrak')).toBe(true);
    expect(registrarJefe(DATOS, e, 'caldrak')).toBe(false);
    expect(registrarJefe(DATOS, e, 'solarion')).toBe(false);
    expect(progresoJefes(DATOS, e)).toEqual({ vencidos: 1, total: 20 });
    expect(progresoMedalla(DATOS, e, 'jefes')).toBe(1);
  });

  it('una partida v6 se migra a v7 sin insignias', () => {
    const v6 = { ...estadoNuevo(DATOS, 0), version: 6 } as Record<string, unknown>;
    delete v6.jefes;
    const m = EstadoJuegoZ.parse(migrar(v6));
    expect(m.version).toBe(7);
    expect(m.jefes).toEqual([]);
  });
});
