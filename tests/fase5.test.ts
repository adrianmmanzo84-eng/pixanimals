import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { combatienteDe, criaturaDe, estadoNuevo, nuevaCriatura } from '../src/core/estado/juego';
import { deserializar } from '../src/core/estado/guardado';
import { agregar, cantidad, catalogo, equiparAmuleto } from '../src/core/items/items';
import { Batalla, crearCombatiente, type Accion } from '../src/core/combate/motor';
import { formaParaNivel } from '../src/core/combate/rival';
import { datosPiso, equipoPiso, premioPiso, resultadoTorre } from '../src/core/modos/torre';
import { entrenadorCobrado, entrenadorDelDia, equipoEntrenador, nivelEntrenador, resultadoEntrenador } from '../src/core/modos/entrenador';

const DIA = 86_400_000;
const base = new Date(2026, 10, 13, 12).getTime();
const hab = (i: number): Accion => ({ tipo: 'habilidad', indice: i });

describe('partida v4', () => {
  it('una partida v3 pasa a v4 con Torre, Entrenador y amuletos vacíos', () => {
    const v3 = { ...estadoNuevo(DATOS, 0), version: 3, monedas: 77 } as Record<string, unknown>;
    delete v3.torre;
    delete v3.entrenador;
    v3.criaturas = [{ especie: 'lumbrito', nivel: 5, xp: 0, rareza: 'comun', brillante: false, vitaminas: {}, entrenamiento: 0 }];
    const e = deserializar(JSON.stringify(v3))!;
    expect(e.version).toBe(5);
    expect(e.monedas).toBe(77);
    expect(e.torre).toEqual({ piso: 1, mejor: 0 });
    expect(e.criaturas[0]!.amuleto).toBeNull();
  });
});

describe('formas según el nivel', () => {
  it('sigue la línea principal y, si se pide, toma la Eclipse desde nivel 40', () => {
    expect(formaParaNivel(DATOS, 'lumbrito', 10)).toBe('lumbrito');
    expect(formaParaNivel(DATOS, 'lumbrito', 30)).toBe('ignileon');
    expect(formaParaNivel(DATOS, 'lumbrito', 45)).toBe('solarion');
    expect(formaParaNivel(DATOS, 'lumbrito', 45, true)).toBe('solarion_eclipse');
  });
});

describe('Torre de Desafíos', () => {
  it('cada piso es más difícil; los jefes, cada 5, suben 2 niveles', () => {
    const p1 = datosPiso(DATOS, 1, 3);
    const p4 = datosPiso(DATOS, 4, 3);
    const p5 = datosPiso(DATOS, 5, 3);
    expect(p1.nivel).toBe(5);
    expect(p4.nivel).toBe(11);
    expect(p5).toMatchObject({ jefe: true, nivel: 15, ia: 'tactica' });
    expect(p1.ia).toBe('novata');
    expect(datosPiso(DATOS, 30, 3).nivel).toBe(DATOS.balance.nivelMax);
    expect(datosPiso(DATOS, 30, 3).ia).toBe('experta');
  });
  it('un piso tiene siempre el mismo equipo, del tamaño pedido y sin familias repetidas', () => {
    expect(datosPiso(DATOS, 7, 3).especies).toEqual(datosPiso(DATOS, 7, 3).especies);
    const p = datosPiso(DATOS, 12, 3);
    expect(p.especies).toHaveLength(3);
    expect(new Set(p.especies.map((e) => DATOS.criaturas.get(e)!.familia)).size).toBe(3);
    expect(datosPiso(DATOS, 12, 2).especies).toHaveLength(2);
    expect(equipoPiso(DATOS, p).every((c) => c.nivel === p.nivel)).toBe(true);
  });
  it('los jefes altos usan una forma Eclipse', () => {
    expect(DATOS.criaturas.get(datosPiso(DATOS, 20, 3).especies[0]!)!.sprites.endsWith('_4b')).toBe(true);
  });
  it('premio solo la primera vez: 30 + 5×piso; jefes dan Sobre Básico y cada 10 pisos un Raro', () => {
    expect(premioPiso(DATOS, 3)).toEqual({ monedas: 45, sobre: null });
    expect(premioPiso(DATOS, 5)).toEqual({ monedas: 55, sobre: 'basico' });
    expect(premioPiso(DATOS, 10)).toEqual({ monedas: 80, sobre: 'raro' });
    const e = estadoNuevo(DATOS, 0);
    const m = e.monedas;
    expect(resultadoTorre(DATOS, e, 1, false)).toMatchObject({ monedas: 0, nuevo: false });
    expect(e.torre.piso).toBe(1);
    expect(resultadoTorre(DATOS, e, 1, true)).toMatchObject({ monedas: 35, nuevo: true });
    expect(e.torre).toEqual({ piso: 2, mejor: 1 });
    expect(resultadoTorre(DATOS, e, 1, true)).toMatchObject({ monedas: 0, nuevo: false });
    expect(e.monedas).toBe(m + 35);
    for (let p = 2; p <= 5; p++) resultadoTorre(DATOS, e, p, true);
    expect(e.sobresRegalo.basico).toBe(1);
  });
});

describe('Entrenador del día', () => {
  it('es el mismo durante el día y cambia otros días', () => {
    const a = entrenadorDelDia(DATOS, base);
    expect(entrenadorDelDia(DATOS, base + 3_600_000)).toEqual(a);
    const otros = new Set(Array.from({ length: 10 }, (_, d) => JSON.stringify(entrenadorDelDia(DATOS, base + d * DIA))));
    expect(otros.size).toBeGreaterThan(5);
    expect(a.iniciales).toHaveLength(3);
    expect(DATOS.criaturas.get(a.iniciales[0]!)!.tipo).toBe(a.tipo);
  });
  it('su nivel es el de tu criatura más fuerte + 2, y evoluciona según ese nivel', () => {
    const mios = [nuevaCriatura('lumbrito', 20, 'comun', false), nuevaCriatura('aletin', 12, 'comun', false)];
    expect(nivelEntrenador(DATOS, mios)).toBe(22);
    const eq = equipoEntrenador(DATOS, entrenadorDelDia(DATOS, base), mios);
    expect(eq).toHaveLength(2);
    expect(eq.every((c) => c.nivel === 22 && c.especie.etapa === 2)).toBe(true);
  });
  it('la primera victoria del día da 150 monedas y un Sobre Elemental; la segunda, nada', () => {
    const e = estadoNuevo(DATOS, base);
    const m = e.monedas;
    expect(resultadoEntrenador(DATOS, e, false, base)).toEqual({ monedas: 0, sobre: null });
    const r = resultadoEntrenador(DATOS, e, true, base);
    expect(r.monedas).toBe(150);
    expect(['brasa', 'marea', 'brote']).toContain(r.sobre);
    expect(e.sobresRegalo[r.sobre!]).toBe(1);
    expect(entrenadorCobrado(e, base)).toBe(true);
    expect(resultadoEntrenador(DATOS, e, true, base).monedas).toBe(0);
    expect(e.monedas).toBe(m + 150);
    expect(entrenadorCobrado(e, base + DIA)).toBe(false);
  });
});

describe('amuletos', () => {
  it('se venden en la tienda', () => {
    expect(catalogo(DATOS).filter((i) => i.efecto.tipo === 'amuleto')).toHaveLength(6);
  });
  it('equipar suma +10 % al stat; cambiar devuelve el anterior a la Bolsa; quitar lo devuelve', () => {
    const e = estadoNuevo(DATOS, 0);
    e.criaturas.push(nuevaCriatura('lumbrito', 30, 'comun', false));
    const c = criaturaDe(e, 'lumbrito')!;
    const sin = combatienteDe(DATOS, c).stats;
    expect(equiparAmuleto(DATOS, e, 'lumbrito', 'amuleto_fuerza')).toBe(false);
    agregar(e, 'amuleto_fuerza');
    agregar(e, 'amuleto_pluma');
    expect(equiparAmuleto(DATOS, e, 'lumbrito', 'amuleto_fuerza')).toBe(true);
    expect(cantidad(e, 'amuleto_fuerza')).toBe(0);
    const con = combatienteDe(DATOS, c).stats;
    expect(con.atq).toBeGreaterThan(sin.atq);
    expect(con.atq / sin.atq).toBeCloseTo(1.1, 1);
    expect(con.def).toBe(sin.def);
    expect(equiparAmuleto(DATOS, e, 'lumbrito', 'amuleto_pluma')).toBe(true);
    expect(cantidad(e, 'amuleto_fuerza')).toBe(1);
    expect(equiparAmuleto(DATOS, e, 'lumbrito', null)).toBe(true);
    expect(c.amuleto).toBeNull();
    expect(cantidad(e, 'amuleto_pluma')).toBe(1);
    expect(equiparAmuleto(DATOS, e, 'lumbrito', 'pocion')).toBe(false);
  });
});

describe('combates de equipo', () => {
  it('en equipo se pega un 25 % más fuerte que en 1 contra 1', () => {
    const golpe = (equipo: boolean) => {
      const a = [crearCombatiente(DATOS, 'lumbrito', 20)];
      const b = [crearCombatiente(DATOS, 'aletin', 20)];
      if (equipo) {
        a.push(crearCombatiente(DATOS, 'brotin', 20));
        b.push(crearCombatiente(DATOS, 'brotin', 20));
      }
      const bat = new Batalla(DATOS, [a, b], new Rng(5));
      const ev = bat.ejecutarTurno(hab(0), hab(2)).find((x) => x.t === 'dano' && x.lado === 1);
      return ev && ev.t === 'dano' ? ev.cantidad : 0;
    };
    const uno = golpe(false);
    const tres = golpe(true);
    expect(uno).toBeGreaterThan(0);
    expect(tres / uno).toBeGreaterThan(1.15);
    expect(tres / uno).toBeLessThan(1.35);
  });
});

describe('música', () => {
  it('cada canción tiene sus 4 canales del mismo largo, en compases enteros y con notas válidas', async () => {
    const { CANCIONES } = await import('../src/audio/canciones');
    const { leerCanal } = await import('../src/audio/musica');
    expect(Object.keys(CANCIONES)).toEqual(expect.arrayContaining(['menu', 'combate', 'jefe', 'minijuego', 'victoria', 'derrota']));
    for (const [id, c] of Object.entries(CANCIONES)) {
      const largos = (['p1', 'p2', 'tri', 'ruido'] as const).map((k) => leerCanal(c[k], k === 'ruido').largo);
      expect(new Set(largos).size, id).toBe(1);
      expect(largos[0]! % 16, id).toBe(0);
      for (const e of leerCanal(c.ruido, true).eventos) expect(['k', 's', 'h']).toContain(e.nota);
      for (const k of ['p1', 'p2', 'tri'] as const) for (const e of leerCanal(c[k]).eventos) expect(e.nota as number).toBeGreaterThan(30);
    }
  });
});
