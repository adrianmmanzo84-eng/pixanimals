import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente } from '../src/core/combate/motor';
import { darConsuelo } from '../src/core/progresion/consuelo';

const ahora = new Date(2026, 10, 17, 12).getTime();
function derrota(vidaRival: number) {
  const bat = new Batalla(DATOS, [crearCombatiente(DATOS, 'lumbrito', 10), crearCombatiente(DATOS, 'brotin', 10)], new Rng(1));
  bat.act(0).ps = 0;
  bat.act(1).ps = Math.round(bat.act(1).stats.ps * vidaRival);
  return bat;
}

describe('Consuelo al perder', () => {
  it('da Esencia de valiente hasta 3 veces por día', () => {
    const e = estadoNuevo(DATOS, 0);
    const antes = e.esencia;
    for (let i = 0; i < 5; i++) darConsuelo(DATOS, e, derrota(0.8), ahora);
    expect(e.esencia).toBe(antes + 3 * DATOS.economia.consuelo.esencia);
    expect(darConsuelo(DATOS, e, derrota(0.8), ahora + 86_400_000).esencia).toBe(DATOS.economia.consuelo.esencia);
  });

  it('dice «¡casi!» solo si al rival le quedaba menos de la mitad', () => {
    const e = estadoNuevo(DATOS, 0);
    expect(darConsuelo(DATOS, e, derrota(0.2), ahora).casi).toBeCloseTo(0.2, 1);
    expect(darConsuelo(DATOS, e, derrota(0.9), ahora).casi).toBeNull();
  });

  it('aconseja los tipos que le ganan al rival y una criatura tuya de esos tipos', () => {
    const e = estadoNuevo(DATOS, 0);
    e.criaturas = [{ especie: 'lumbrito', nivel: 10, xp: 0, rareza: 'comun', brillante: false, vitaminas: {}, entrenamiento: 0, amuleto: null }];
    const c = darConsuelo(DATOS, e, derrota(0.5), ahora).consejo!;
    expect(c.rival).toBe('brote');
    expect(c.fuertes).toEqual(expect.arrayContaining(['brasa', 'cielo']));
    expect(c.tuya).toBe('lumbrito');
  });
});
