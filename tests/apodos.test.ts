import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo, combatienteDe, alternarFavorita, favoritaDe, limpiarApodo, nombreDe, ponerApodo } from '../src/core/estado/juego';
import { evolucionar } from '../src/core/progresion/evolucion';
import type { EstadoJuego } from '../src/esquemas/esquemas';

function conCriaturas(...ids: string[]): EstadoJuego {
  const e = estadoNuevo(DATOS, 0);
  e.criaturas = ids.map((especie) => ({ especie, nivel: 30, xp: 0, rareza: 'comun', brillante: false, vitaminas: {}, entrenamiento: 0, amuleto: null }));
  e.equipo = [...ids];
  return e;
}

describe('Apodos y favorita', () => {
  it('limpia el apodo: recorta, quita signos raros y espacios de más, máximo 12', () => {
    expect(limpiarApodo('  Chispi  ')).toBe('Chispi');
    expect(limpiarApodo('Super   <b>Lio</b>')).toBe('Super bLio/b');
    expect(limpiarApodo('Ñandú el más grande del mundo')).toBe('Ñandú el más');
    expect(limpiarApodo('😀🐱🦊')).toBe('😀🐱🦊');
    expect(limpiarApodo('   ')).toBe('');
  });

  it('el apodo se muestra en vez del nombre, también en combate, y se quita dejándolo vacío', () => {
    const e = conCriaturas('lumbrito');
    const c = e.criaturas[0]!;
    expect(nombreDe(DATOS, c)).toBe('Lumbrito');
    ponerApodo(e, 'lumbrito', 'Chispi');
    expect(nombreDe(DATOS, c)).toBe('Chispi');
    expect(combatienteDe(DATOS, c).nombre).toBe('Chispi');
    ponerApodo(e, 'lumbrito', '');
    expect(c.apodo).toBeUndefined();
    expect(nombreDe(DATOS, c)).toBe('Lumbrito');
  });

  it('el apodo y la favorita siguen a la criatura cuando evoluciona', () => {
    const e = conCriaturas('lumbrito');
    const c = e.criaturas[0]!;
    ponerApodo(e, 'lumbrito', 'Chispi');
    alternarFavorita(e, 'lumbrito');
    const destino = DATOS.criaturas.get('lumbrito')!.evoluciona[0]!.a;
    c.entrenamiento = DATOS.economia.entrenamiento.max;
    evolucionar(DATOS, e, 'lumbrito', destino);
    expect(c.especie).toBe(destino);
    expect(nombreDe(DATOS, c)).toBe('Chispi');
    expect(favoritaDe(e)).toBe(c);
  });

  it('solo una favorita; marcarla de nuevo la desmarca', () => {
    const e = conCriaturas('lumbrito', 'heliavo');
    expect(alternarFavorita(e, 'lumbrito')).toBe(true);
    expect(alternarFavorita(e, 'heliavo')).toBe(true);
    expect(favoritaDe(e)?.especie).toBe('heliavo');
    expect(e.criaturas.filter((c) => c.favorita)).toHaveLength(1);
    expect(alternarFavorita(e, 'heliavo')).toBe(false);
    expect(favoritaDe(e)).toBeNull();
  });
});
