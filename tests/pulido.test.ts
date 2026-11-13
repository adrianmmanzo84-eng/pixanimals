import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { estadoNuevo } from '../src/core/estado/juego';
import { cartaInicial } from '../src/core/sobres/sobres';

describe('carta inicial', () => {
  it('da una sola criatura de etapa 1, Poco común, de cualquier familia', () => {
    const vistas = new Set<string>();
    for (let s = 1; s <= 300; s++) {
      const e = estadoNuevo(DATOS, 0);
      const c = cartaInicial(DATOS, e, new Rng(s));
      expect(e.bienvenida).toBe(true);
      expect(e.criaturas).toHaveLength(1);
      expect(e.equipo).toEqual([c.especie]);
      expect(DATOS.criaturas.get(c.especie)!.etapa).toBe(1);
      expect(c.rareza).toBe('poco_comun');
      vistas.add(c.especie);
    }
    const familias = [...DATOS.criaturas.values()].filter((c) => c.etapa === 1).length;
    expect(vistas.size).toBe(familias);
  });
});
