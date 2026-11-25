import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { claveDeRanura, claveLocal, claveNativa, esRanura, leerFechas, prefijoRespaldo, resumir, TODAS } from '../src/core/estado/ranuras';
import { clavesSobrantes } from '../src/core/estado/respaldo';

describe('ranuras de guardado (D279)', () => {
  it('la ranura 1 usa las claves de siempre: las partidas existentes no se mueven', () => {
    expect(claveLocal(1)).toBe('pixanimals.partida');
    expect(claveNativa(1)).toBe('partida');
    expect(prefijoRespaldo(1)).toBe('');
  });

  it('cada ranura tiene claves propias que no chocan entre sí ni con la copia ilegible', () => {
    const claves = TODAS.flatMap((r) => [claveLocal(r), claveNativa(r)]);
    expect(new Set(claves).size).toBe(claves.length);
    expect(TODAS.map((r) => claveLocal(r))).not.toContain('pixanimals.partida.ilegible');
  });

  it('las copias de seguridad de cada ranura se separan por prefijo', () => {
    const claves = ['actual', 'dia-20400', 'r2/actual', 'r2/dia-20400', 'r3/actual'];
    expect(claves.map((c) => claveDeRanura(c, 1))).toEqual(['actual', 'dia-20400', null, null, null]);
    expect(claves.map((c) => claveDeRanura(c, 2))).toEqual([null, null, 'actual', 'dia-20400', null]);
    expect(claves.map((c) => claveDeRanura(c, 3))).toEqual([null, null, null, null, 'actual']);
    // La limpieza de copias diarias trabaja sobre las claves sin prefijo de una sola ranura.
    expect(clavesSobrantes(['dia-1', 'dia-2', 'dia-3', 'dia-4'])).toEqual(['dia-1']);
  });

  it('resumen de una partida nueva y de una avanzada', () => {
    const e = estadoNuevo(DATOS, Date.now());
    const r0 = resumir(DATOS, e);
    expect(r0.region).toBe(DATOS.historia.regiones[0]!.id);
    expect(r0.monedas).toBe(e.monedas);
    e.historia = { libre: false, final: false, paradas: ['bosque:0', 'bosque:1', 'bosque:2', 'bosque:3'] };
    const r1 = resumir(DATOS, e);
    expect(r1.regiones).toBe(1);
    expect(r1.region).toBe(DATOS.historia.regiones[1]!.id);
    e.historia.final = true;
    expect(resumir(DATOS, e).region).toBe('completa');
  });

  it('fechas: tolera datos vacíos o dañados', () => {
    expect(leerFechas(null)).toEqual({});
    expect(leerFechas('basura')).toEqual({});
    expect(leerFechas('{"1":5,"2":"x","7":3}')).toEqual({ 1: 5 });
    expect(esRanura(2)).toBe(true);
    expect(esRanura(4)).toBe(false);
  });
});
