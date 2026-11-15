import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { serializar } from '../src/core/estado/guardado';
import { clavesSobrantes, debeRecordarCopia, elegirRecuperacion, nombreArchivo } from '../src/core/estado/respaldo';

const DIA = 86_400_000;
const ahora = new Date(2026, 10, 20, 12).getTime();

function partida(monedas: number): string {
  const e = estadoNuevo(DATOS, 0);
  e.monedas = monedas;
  return serializar(e);
}

describe('Respaldo de la partida', () => {
  it('si el guardado principal sirve, no recupera nada', () => {
    expect(elegirRecuperacion(partida(10), [{ clave: 'actual', texto: partida(99), en: ahora }])).toBeNull();
  });

  it('si falta o está dañado, recupera la copia válida más reciente', () => {
    const respaldos = [
      { clave: 'dia-1', texto: partida(50), en: ahora - 2 * DIA },
      { clave: 'actual', texto: '{roto', en: ahora },
      { clave: 'dia-2', texto: partida(80), en: ahora - DIA },
    ];
    for (const principal of [null, '', '{"version":', 'basura']) {
      const r = elegirRecuperacion(principal, respaldos);
      expect(r?.estado.monedas).toBe(80);
      expect(r?.desde.clave).toBe('dia-2');
    }
    expect(elegirRecuperacion(null, [])).toBeNull();
  });

  it('conserva solo las últimas 3 copias diarias', () => {
    expect(clavesSobrantes(['actual', 'dia-10', 'dia-14', 'dia-12', 'dia-11', 'dia-13']).sort()).toEqual(['dia-10', 'dia-11']);
    expect(clavesSobrantes(['actual', 'dia-1', 'dia-2'])).toEqual([]);
  });

  it('recuerda descargar una copia cada 7 días, una vez por día y solo con progreso', () => {
    const e = estadoNuevo(DATOS, 0);
    e.registro = ['a', 'b', 'c', 'd', 'e'];
    expect(debeRecordarCopia(e, ahora - 8 * DIA, 0, ahora)).toBe(true);
    expect(debeRecordarCopia(e, ahora - 3 * DIA, 0, ahora)).toBe(false);
    expect(debeRecordarCopia(e, ahora - 8 * DIA, ahora - 3_600_000, ahora)).toBe(false);
    e.registro = ['a'];
    expect(debeRecordarCopia(e, 0, 0, ahora)).toBe(false);
  });

  it('nombra el archivo con la fecha', () => {
    expect(nombreArchivo(new Date(2026, 0, 5, 10).getTime())).toBe('pixanimals-partida-2026-01-05.txt');
  });
});
