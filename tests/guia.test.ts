import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { migrar } from '../src/core/estado/guardado';
import { EstadoJuegoZ } from '../src/esquemas/esquemas';
import { cobrarPaso, pasoActual, PASOS_GUIA } from '../src/core/progresion/guia';

describe('Primeros pasos', () => {
  it('empieza después de elegir la primera carta', () => {
    const e = estadoNuevo(DATOS, 0);
    expect(pasoActual(e)).toBeNull();
    e.bienvenida = true;
    expect(pasoActual(e)?.id).toBe('combate');
  });

  it('se cobran en orden, cada uno con su premio, y el último da un Sobre Raro', () => {
    const e = estadoNuevo(DATOS, 0);
    e.bienvenida = true;
    expect(cobrarPaso(DATOS, e)).toBeNull();
    e.estadisticas.victorias = 1;
    const m0 = e.monedas;
    expect(cobrarPaso(DATOS, e)?.id).toBe('combate');
    expect(e.monedas).toBe(m0 + DATOS.economia.guia.combate.monedas);
    expect(pasoActual(e)?.id).toBe('sobre');
    // Cumplir pasos más adelante no salta el actual.
    e.torre.mejor = 3;
    expect(cobrarPaso(DATOS, e)).toBeNull();
    e.estadisticas.sobres = 1;
    e.equipo = ['a', 'b', 'c'];
    e.minijuegos.records = { eco: 4 };
    const cobrados: string[] = [];
    for (let p = cobrarPaso(DATOS, e); p; p = cobrarPaso(DATOS, e)) cobrados.push(p.id);
    expect(cobrados).toEqual(['sobre', 'equipo', 'minijuego', 'torre']);
    expect(pasoActual(e)).toBeNull();
    expect(e.guia.paso).toBe(PASOS_GUIA.length);
    expect(e.sobresRegalo.raro).toBe(1);
  });

  it('las partidas que ya habían empezado no ven la guía', () => {
    const v8 = { ...estadoNuevo(DATOS, 0), version: 8, bienvenida: true } as Record<string, unknown>;
    delete v8.guia;
    const m = EstadoJuegoZ.parse(migrar(v8));
    expect(m.version).toBe(10);
    expect(pasoActual(m)).toBeNull();
    const nueva = { ...estadoNuevo(DATOS, 0), version: 8 } as Record<string, unknown>;
    delete nueva.guia;
    expect(EstadoJuegoZ.parse(migrar(nueva)).guia.paso).toBe(0);
  });
});
