import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo, nuevaCriatura } from '../src/core/estado/juego';
import { Batalla, crearCombatiente } from '../src/core/combate/motor';
import { Rng } from '../src/core/rng';
import {
  avanzar, crono, empezar, enPie, eraGrieta, eventoDe, excavar, fogata, grietaDisponible, jefeEra, mapaDe, nodoActual, puedeRevivir,
  resolverEvento, revivir, rivalesNodo, siguientes, terminarCombate,
} from '../src/core/modos/crono';

const MARTES = new Date(2026, 10, 17, 12).getTime();
function partida() {
  const e = estadoNuevo(DATOS, 0);
  e.criaturas = ['lumbrito', 'aletin', 'brotin'].map((id) => nuevaCriatura(id, 30, 'comun', false));
  e.equipo = e.criaturas.map((c) => c.especie);
  return e;
}

describe('Cronoportal', () => {
  it('cada era tiene su familia prehistórica exclusiva y su jefe en forma final', () => {
    const tipos = DATOS.economia.crono.eras.map((_, i) => DATOS.criaturas.get(jefeEra(DATOS, i + 1))!);
    expect(tipos.map((c) => c.tipo)).toEqual(['marea', 'rayo', 'brote', 'cielo', 'roca']);
    for (const c of tipos) {
      expect(c.etapa).toBe(4);
      expect(c.origen).toBe('crono');
      expect(c.definitivo).toBeTruthy();
    }
  });

  it('el mapa es estable, conectado y termina en el jefe con una fogata antes', () => {
    for (let s = 0; s < 40; s++) {
      const m = mapaDe(DATOS, 1 + (s % 5), s);
      expect(mapaDe(DATOS, 1 + (s % 5), s)).toEqual(m);
      const cols = DATOS.economia.crono.columnas;
      expect(m.nodos.filter((n) => n.tipo === 'jefe')).toHaveLength(1);
      expect(m.nodos.filter((n) => n.col === cols - 2).some((n) => n.tipo === 'fogata')).toBe(true);
      expect(m.nodos.filter((n) => n.col === 0).every((n) => n.tipo === 'combate')).toBe(true);
      // Todo nodo (salvo los de la primera columna) tiene entrada y todo nodo (salvo el jefe) tiene salida.
      for (const n of m.nodos) {
        if (n.col > 0) expect(m.nodos.some((x) => x.sig.includes(n.id))).toBe(true);
        if (n.tipo !== 'jefe') expect(n.sig.length).toBeGreaterThan(0);
      }
    }
  });

  it('solo se avanza por caminos conectados; la vida se arrastra y perder termina la expedición', () => {
    const e = partida();
    expect(empezar(DATOS, e, 2, 1)).toBeNull(); // era cerrada
    const ex = empezar(DATOS, e, 1, 7)!;
    const m = mapaDe(DATOS, 1, 7);
    const fuera = m.nodos.find((n) => n.col === 2)!;
    expect(avanzar(DATOS, e, fuera.id)).toBeNull();
    const primero = siguientes(m, null)[0]!;
    expect(avanzar(DATOS, e, primero.id)!.id).toBe(primero.id);
    const r = terminarCombate(DATOS, e, true, { lumbrito: 0.4, aletin: 0, brotin: 1 });
    expect(r.fin).toBe('sigue');
    expect(r.monedas).toBeGreaterThan(0);
    expect(enPie(e)).toEqual(['lumbrito', 'brotin']);
    expect(ex.vida.lumbrito).toBe(0.4);
    const sig = siguientes(m, primero.id)[0]!;
    avanzar(DATOS, e, sig.id);
    expect(terminarCombate(DATOS, e, false, {}).fin).toBe('derrota');
    expect(crono(e).expedicion).toBeUndefined();
  });

  it('fogata, excavación y eventos', () => {
    const e = partida();
    const ex = empezar(DATOS, e, 1, 3)!;
    ex.actual = '1-0';
    ex.vida = { lumbrito: 0, aletin: 0.3, brotin: 1 };
    fogata(DATOS, e);
    expect(ex.vida).toEqual({ lumbrito: 0.5, aletin: 0.8, brotin: 1 });
    const antes = crono(e).fosiles.anomalo ?? 0;
    const x = excavar(DATOS, e);
    expect(x.fosiles).toBeGreaterThanOrEqual(1);
    expect(crono(e).fosiles.anomalo).toBe(antes + x.fosiles);
    expect(['huevo', 'ambar', 'grieta', 'manantial']).toContain(eventoDe(e));
    const r = resolverEvento(DATOS, e, 1);
    expect(r.clave).toMatch(/^crono\.ev\./);
  });

  it('vencer al jefe abre la era siguiente y da fósiles y ámbar; revivir da la cría una sola vez', () => {
    const e = partida();
    empezar(DATOS, e, 1, 5);
    const m = mapaDe(DATOS, 1, 5);
    crono(e).expedicion!.actual = m.nodos.find((n) => n.tipo === 'jefe')!.id;
    expect(nodoActual(DATOS, e)!.tipo).toBe('jefe');
    const r = terminarCombate(DATOS, e, true, { lumbrito: 0.5 });
    expect(r).toMatchObject({ fin: 'jefe', eraNueva: true, fosiles: 2, ambar: 1 });
    expect(crono(e).eraMax).toBe(2);
    expect(puedeRevivir(DATOS, e, 'anomalo')).toBe(false); // 2 fósiles + 1 ámbar < 5
    crono(e).fosiles.anomalo = 4;
    expect(puedeRevivir(DATOS, e, 'anomalo')).toBe(true); // 4 + 1 ámbar
    const c = revivir(DATOS, e, 'anomalo')!;
    expect(c.especie).toBe('anomalo_1');
    expect(crono(e).ambar).toBe(0);
    crono(e).fosiles.anomalo = 9;
    expect(puedeRevivir(DATOS, e, 'anomalo')).toBe(false); // ya la tiene
  });

  it('la Grieta del día: una vez por día, en una era ya vencida, con premios dobles', () => {
    const e = partida();
    expect(grietaDisponible(e, MARTES)).toBe(false);
    crono(e).vencidas = [1];
    expect(grietaDisponible(e, MARTES)).toBe(true);
    const n = eraGrieta(e, MARTES);
    const ex = empezar(DATOS, e, n, 1, true, MARTES)!;
    expect(ex.grieta).toBe(true);
    expect(grietaDisponible(e, MARTES)).toBe(false);
    ex.actual = '0-0';
    const r = terminarCombate(DATOS, e, true, {});
    expect(r.monedas).toBe((DATOS.economia.crono.monedasCombate + DATOS.economia.crono.monedasPorEra * n) * 2);
  });

  it('los rivales: el jefe primero con su familia; en los combates, tipos de la era', () => {
    const m = mapaDe(DATOS, 3, 9);
    const jefe = rivalesNodo(DATOS, 3, m.nodos.find((n) => n.tipo === 'jefe')!, 9, 3);
    expect(jefe.map((c) => c.especie.id)).toEqual(['estego_4', 'estego_3', 'estego_2']);
    const comb = rivalesNodo(DATOS, 3, m.nodos.find((n) => n.tipo === 'combate')!, 9, 3);
    expect(comb).toHaveLength(3);
    for (const c of comb) expect(c.especie.familia === 'estego' || DATOS.economia.crono.eras[2]!.tipos.includes(c.especie.tipo)).toBe(true);
  });
});

describe('reglas de las eras en combate', () => {
  const pelea = (regla: 'marea' | 'esporas' | 'estampida' | 'meteoro' | 'frio', turnos: number) => {
    const bat = new Batalla(DATOS, [[crearCombatiente(DATOS, 'solarion', 60)], [crearCombatiente(DATOS, 'titan_ancestral', 60)]], new Rng(8));
    bat.regla = regla;
    const ev = [];
    for (let i = 0; i < turnos && !bat.terminado; i++) ev.push(...bat.ejecutarTurno({ tipo: 'habilidad', indice: 2 }, { tipo: 'habilidad', indice: 2 }));
    return { bat, ev };
  };
  it('meteoro: al turno 8 todos quedan con un 25 % de vida como mucho', () => {
    const { bat, ev } = pelea('meteoro', 8);
    expect(ev.some((e) => e.t === 'regla' && e.turnos === 0)).toBe(true);
    for (const l of [0, 1] as const) expect(bat.act(l).ps).toBeLessThanOrEqual(Math.floor(bat.act(l).stats.ps * 0.25));
  });
  it('frío: baja la Velocidad cada turno salvo a los de tipo Brasa', () => {
    const { ev } = pelea('frio', 3);
    const frio = ev.filter((e) => e.t === 'regla' && e.regla === 'frio');
    expect(frio.filter((e) => e.t === 'regla' && e.lado === 0)).toHaveLength(0); // solarion es Brasa
    expect(frio.filter((e) => e.t === 'regla' && e.lado === 1)).toHaveLength(Math.min(3, DATOS.balance.etapas.max)); // hasta el tope de etapas
  });
  it('estampida: cada 4 turnos le quita vida a quien tenga menos', () => {
    const { ev } = pelea('estampida', 4);
    expect(ev.filter((e) => e.t === 'regla' && e.regla === 'estampida')).toHaveLength(1);
  });
  it('marea: los turnos múltiplos de 3 marcan marea alta', () => {
    const { bat, ev } = pelea('marea', 2);
    expect(ev.some((e) => e.t === 'regla' && e.regla === 'marea')).toBe(true);
    bat.ejecutarTurno({ tipo: 'habilidad', indice: 2 }, { tipo: 'habilidad', indice: 2 });
    expect(bat.mareaAlta()).toBe(true);
  });
});
