import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente, type Accion } from '../src/core/combate/motor';
import { estadoNuevo } from '../src/core/estado/juego';
import { sobreBienvenida } from '../src/core/sobres/sobres';
import { generarRival } from '../src/core/combate/rival';
import { nuevaCriatura } from '../src/core/estado/juego';

const hab = (i: number): Accion => ({ tipo: 'habilidad', indice: i });
const criaturas = [...DATOS.criaturas.values()];

describe('tabla de tipos', () => {
  const elementales = [...DATOS.tipos.values()].filter((t) => t.id !== 'neutro');
  it('7 tipos: cada uno vence a 2 y pierde contra 2', () => {
    expect(elementales).toHaveLength(7);
    for (const t of elementales) {
      expect(t.vence).toHaveLength(2);
      expect(elementales.filter((o) => o.vence.includes(t.id))).toHaveLength(2);
      for (const v of t.vence) expect(DATOS.tipos.get(v)!.vence).not.toContain(t.id);
    }
  });
  it('se mantiene el triángulo original Brasa > Brote > Marea > Brasa', () => {
    expect(DATOS.tipos.get('brasa')!.vence).toContain('brote');
    expect(DATOS.tipos.get('brote')!.vence).toContain('marea');
    expect(DATOS.tipos.get('marea')!.vence).toContain('brasa');
  });
  it('todos los tipos tienen criaturas', () => {
    for (const t of elementales) expect(criaturas.some((c) => c.tipo === t.id)).toBe(true);
  });
});

describe('familias nuevas', () => {
  it('cada familia tiene 4 etapas en cadena (16, 28, 40) y una forma Eclipse', () => {
    const familias = new Set(criaturas.map((c) => c.familia));
    for (const f of familias) {
      const linea = criaturas.filter((c) => c.familia === f && !c.sprites.endsWith('b')).sort((a, b) => a.etapa - b.etapa);
      expect(linea.map((c) => c.etapa)).toEqual([1, 2, 3, 4]);
      for (let e = 0; e < 3; e++) expect(linea[e]!.evoluciona.find((x) => !x.item)).toEqual({ a: linea[e + 1]!.id, nivel: [16, 28, 40][e] });
      expect(linea[2]!.evoluciona.some((x) => x.item === 'piedra_eclipse')).toBe(true);
      expect(new Set(linea.map((c) => c.tipo)).size).toBe(1);
    }
  });
  it('los nombres caben en la interfaz (16 letras) y no se repiten', () => {
    const nombres = criaturas.map((c) => c.nombre);
    expect(new Set(nombres).size).toBe(nombres.length);
    for (const n of nombres) expect(n.length).toBeLessThanOrEqual(16);
  });
  it('el sobre de bienvenida da solo las 3 criaturas iniciales', () => {
    const e = estadoNuevo(DATOS, 0);
    const cartas = sobreBienvenida(DATOS, e, new Rng(1));
    expect(cartas.map((c) => c.especie)).toEqual(['lumbrito', 'aletin', 'brotin']);
  });
  it('el rival puede salir de cualquier familia', () => {
    const vistas = new Set<string>();
    const equipo = [nuevaCriatura('lumbrito', 10, 'comun', false), nuevaCriatura('aletin', 10, 'comun', false), nuevaCriatura('brotin', 10, 'comun', false)];
    for (let s = 0; s < 200; s++) for (const c of generarRival(DATOS, equipo, new Rng(s))) vistas.add(c.especie.familia);
    expect(vistas.size).toBe(13);
  });
});

describe('pasivas con alias', () => {
  it('Piedra Viva cura como Raíces y avisa con su propio nombre', () => {
    expect(DATOS.balance.pasivasAlias.piedra_viva!.mecanica).toBe('raices');
    const bat = new Batalla(DATOS, [crearCombatiente(DATOS, 'caracolin', 20), crearCombatiente(DATOS, 'lumbrito', 20)], new Rng(4));
    let curo = false;
    for (let i = 0; i < 6 && !bat.terminado; i++) curo ||= bat.ejecutarTurno(hab(2), hab(0)).some((e) => e.t === 'cura' && e.lado === 0 && e.origen === 'pasiva');
    expect(curo).toBe(true);
  });
  it('Carga Estática se acumula como Oleaje al usar una habilidad de soporte', () => {
    const bat = new Batalla(DATOS, [crearCombatiente(DATOS, 'ajolin', 20), crearCombatiente(DATOS, 'caracolin', 20)], new Rng(2));
    const ev = bat.ejecutarTurno(hab(2), hab(2));
    expect(ev).toContainEqual({ t: 'pasiva', lado: 0, pasiva: 'carga_estatica' });
    expect(bat.lados[0].oleaje).toBe(true);
  });
});
