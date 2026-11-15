import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { cobrarRegalo, eventoDeHoy, multEvento, probBrillante, regaloPendiente } from '../src/core/progresion/eventos';

const dia = (a: number, m: number, d: number) => new Date(a, m - 1, d, 12).getTime();

describe('Eventos de calendario', () => {
  it('cada día de la semana tiene el suyo y el martes y jueves no hay', () => {
    expect(eventoDeHoy(DATOS, dia(2026, 11, 16))?.id).toBe('entrenamiento'); // lunes
    expect(eventoDeHoy(DATOS, dia(2026, 11, 17))).toBeNull(); // martes
    expect(eventoDeHoy(DATOS, dia(2026, 11, 18))?.id).toBe('expedicion'); // miércoles
    expect(eventoDeHoy(DATOS, dia(2026, 11, 19))).toBeNull(); // jueves
    expect(eventoDeHoy(DATOS, dia(2026, 11, 20))?.id).toBe('suerte'); // viernes
    expect(eventoDeHoy(DATOS, dia(2026, 11, 21))?.id).toBe('combate'); // sábado
    expect(eventoDeHoy(DATOS, dia(2026, 11, 22))?.id).toBe('combate'); // domingo
  });

  it('las fechas especiales ganan al día de la semana', () => {
    expect(eventoDeHoy(DATOS, dia(2027, 12, 25))?.id).toBe('navidad'); // sábado, pero es Navidad
    expect(eventoDeHoy(DATOS, dia(2026, 10, 31))?.id).toBe('halloween');
    expect(eventoDeHoy(DATOS, dia(2026, 11, 14))?.id).toBe('aniversario');
  });

  it('multiplicadores: 1 si el evento no toca ese efecto', () => {
    expect(multEvento(DATOS, 'monedasCombate', dia(2026, 11, 21))).toBe(1.5);
    expect(multEvento(DATOS, 'brillante', dia(2026, 11, 21))).toBe(1);
    expect(multEvento(DATOS, 'brillante', dia(2026, 11, 17))).toBe(1);
    expect(probBrillante(DATOS, dia(2026, 11, 20))).toBeCloseTo((2 * 100) / DATOS.sobres.brillanteUnoEn);
  });

  it('el regalo de una fecha especial se cobra una vez por año', () => {
    const e = estadoNuevo(DATOS, 0);
    const navidad = dia(2026, 12, 25);
    expect(regaloPendiente(DATOS, e, dia(2026, 11, 17))).toBeNull();
    expect(regaloPendiente(DATOS, e, navidad)?.sobre).toBe('raro');
    expect(cobrarRegalo(DATOS, e, navidad)).toBe('raro');
    expect(e.sobresRegalo.raro).toBe(1);
    expect(cobrarRegalo(DATOS, e, navidad + 3_600_000)).toBeNull();
    expect(regaloPendiente(DATOS, e, dia(2026, 12, 24))).toBeNull(); // misma Navidad, otro día
    expect(regaloPendiente(DATOS, e, dia(2027, 12, 25))?.sobre).toBe('raro'); // al año siguiente, de nuevo
  });
});
