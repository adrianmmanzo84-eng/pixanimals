import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente, type Accion } from '../src/core/combate/motor';
import { elegirAccion } from '../src/core/combate/ia';

const hab = (i: number): Accion => ({ tipo: 'habilidad', indice: i });
const criaturas = [...DATOS.criaturas.values()];
/** Índice de la habilidad de guardia de la criatura activa del lado. */
const guardia = (bat: Batalla, lado: 0 | 1) => bat.act(lado).habilidades.findIndex((h) => h.def.efectos.some((e) => e.tipo === 'guardia'));

/** Combate de etapa final, Definitivo habilitado para ambos, jugado con apoyos hasta el turno indicado. */
function hastaTurno(n: number, a = 'solarion', b = 'leviatan') {
  const bat = new Batalla(DATOS, [crearCombatiente(DATOS, a, 46), crearCombatiente(DATOS, b, 46)], new Rng(3));
  bat.definitivoPermitido = [true, true];
  for (let i = 0; i < n; i++) bat.ejecutarTurno(hab(2), hab(2));
  return bat;
}

describe('ataques por evolución', () => {
  it('cada familia mejora el ofensivo en la etapa 2, el apoyo en la 3 y el final en la 4; la Eclipse tiene su propio final', () => {
    for (const f of new Set(criaturas.map((c) => c.familia))) {
      const [e1, e2, e3, e4] = criaturas.filter((c) => c.familia === f && !c.sprites.endsWith('b')).sort((x, y) => x.etapa - y.etapa);
      const ecl = criaturas.find((c) => c.familia === f && c.sprites.endsWith('b'))!;
      const h = (c: typeof e1, i: number) => DATOS.habilidades.get(c!.habilidades[i]!)!;
      expect(h(e2, 0).potencia, f).toBeGreaterThan(h(e1, 0).potencia);
      expect(e2!.habilidades.slice(1)).toEqual(e1!.habilidades.slice(1));
      expect(e3!.habilidades[2]).not.toBe(e2!.habilidades[2]);
      // El final de la etapa 4 pega más que el de la etapa 1 (90 a 110 según la familia); el Eclipse, parecido.
      expect(h(e4, 3).potencia, f).toBeGreaterThan(h(e1, 3).potencia);
      expect(Math.abs(h(ecl, 3).potencia - h(e4, 3).potencia), f).toBeLessThanOrEqual(5);
      expect(ecl.habilidades[3]).not.toBe(e4!.habilidades[3]);
      expect(new Set(criaturas.flatMap((c) => (c.familia !== f ? c.habilidades : []))).has(e2!.habilidades[0]!)).toBe(false);
    }
  });
  it('solo las etapas finales y las Eclipse tienen Definitivo, y cada uno es distinto', () => {
    const conDef = criaturas.filter((c) => c.definitivo);
    expect(conDef).toHaveLength(66);
    expect(conDef.every((c) => c.etapa === 4)).toBe(true);
    expect(new Set(conDef.map((c) => c.definitivo)).size).toBe(66);
    expect(crearCombatiente(DATOS, 'lumbrito', 10).definitivo).toBeNull();
    expect(crearCombatiente(DATOS, 'solarion', 46).definitivo?.id).toBe('sol_supremo');
  });
});

describe('Ataque Definitivo', () => {
  it('no se puede antes del turno 5 ni sin permiso', () => {
    const bat = hastaTurno(3);
    expect(bat.bloqueoDefinitivo(0)).toBe('turno');
    const sin = new Batalla(DATOS, [crearCombatiente(DATOS, 'solarion', 46), crearCombatiente(DATOS, 'leviatan', 46)], new Rng(1));
    expect(sin.bloqueoDefinitivo(0)).toBe('no_permitido');
    expect(hastaTurno(4).bloqueoDefinitivo(0)).toBeNull();
  });
  it('elimina al rival de un golpe, sin importar su vida, y solo una vez por combate', () => {
    const bat = new Batalla(
      DATOS,
      [
        [crearCombatiente(DATOS, 'lumbrito', 5), crearCombatiente(DATOS, 'solarion', 30)],
        [crearCombatiente(DATOS, 'titan_ancestral', 50), crearCombatiente(DATOS, 'titan_eclipse', 50)],
      ],
      new Rng(2),
    );
    bat.definitivoPermitido = [true, false];
    bat.ejecutarTurno({ tipo: 'cambio', indice: 1 }, hab(2));
    for (let i = 0; i < 3; i++) bat.ejecutarTurno(hab(2), hab(2));
    const ps = bat.act(1).ps;
    expect(ps).toBeGreaterThan(100);
    const ev = bat.ejecutarTurno({ tipo: 'definitivo' }, hab(2));
    expect(ev).toContainEqual({ t: 'definitivo', lado: 0 });
    expect(ev).toContainEqual(expect.objectContaining({ t: 'dano', lado: 1, cantidad: ps, ps: 0 }));
    expect(ev).toContainEqual({ t: 'debilitado', lado: 1 });
    expect(bat.bloqueoDefinitivo(0)).toBe('usado');
  });
  it('si el rival se cubre ese turno, lo resiste y el Definitivo se pierde', () => {
    const bat = hastaTurno(4);
    const ps = bat.act(1).ps;
    const ev = bat.ejecutarTurno({ tipo: 'definitivo' }, hab(guardia(bat, 1)));
    expect(ev).toContainEqual({ t: 'definitivo_bloqueado', lado: 1 });
    expect(bat.act(1).ps).toBe(ps);
    expect(bat.bloqueoDefinitivo(0)).toBe('usado');
  });
  it('el rival que necesita carga avisa un turno antes, y cambiar de criatura pierde la carga', () => {
    const bat = hastaTurno(3);
    bat.definitivoConCarga = [false, true];
    expect(bat.bloqueoDefinitivo(1)).toBe('turno');
    expect(bat.puedeCargar(1)).toBe(true);
    const ev = bat.ejecutarTurno(hab(2), { tipo: 'cargar' });
    expect(ev).toContainEqual({ t: 'carga', lado: 1 });
    expect(bat.bloqueoDefinitivo(1)).toBeNull();
    expect(bat.ejecutarTurno(hab(2), { tipo: 'definitivo' })).toContainEqual({ t: 'definitivo', lado: 1 });
  });
  it('la IA rival carga y después lo usa; y se cubre casi siempre cuando el otro avisó', () => {
    const bat = hastaTurno(3);
    bat.definitivoConCarga = [false, true];
    const rng = new Rng(9);
    let cargo = false;
    for (let i = 0; i < 10 && !cargo; i++) cargo = elegirAccion(bat, 1, 'experta', rng).tipo === 'cargar';
    expect(cargo).toBe(true);
    bat.ejecutarTurno(hab(2), { tipo: 'cargar' });
    expect(elegirAccion(bat, 1, 'experta', rng)).toEqual({ tipo: 'definitivo' });
    // Del otro lado: el lado 0 (sin Definitivo propio) ve el aviso y se cubre la mayoría de las veces.
    bat.definitivoPermitido[0] = false;
    let cubre = 0;
    for (let i = 0; i < 100; i++) {
      const a = elegirAccion(bat, 0, 'experta', new Rng(i));
      if (a.tipo === 'habilidad' && a.indice === guardia(bat, 0)) cubre++;
    }
    expect(cubre).toBeGreaterThan(60);
  });
});
