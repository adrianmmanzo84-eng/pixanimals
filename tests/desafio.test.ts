import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { migrar } from '../src/core/estado/guardado';
import { EstadoJuegoZ } from '../src/esquemas/esquemas';
import { desafioDelDia, desafioJugado, empezarDesafio, numeroDesafio, terminarDesafio, textoCompartir } from '../src/core/modos/desafio';

const DIA = 86_400_000;
const hoy = new Date(2026, 10, 20, 12).getTime();

describe('Desafío del día', () => {
  it('es el mismo para todos durante el día y cambia al siguiente', () => {
    const a = desafioDelDia(DATOS, hoy);
    const b = desafioDelDia(DATOS, hoy + 3_600_000);
    expect(b).toEqual(a);
    const c = desafioDelDia(DATOS, hoy + DIA);
    expect(c.equipo.concat(c.rival)).not.toEqual(a.equipo.concat(a.rival));
  });

  it('6 criaturas jugables distintas de etapa 3', () => {
    for (let i = 0; i < 40; i++) {
      const d = desafioDelDia(DATOS, hoy + i * DIA);
      const todas = [...d.equipo, ...d.rival];
      expect(new Set(todas).size).toBe(6);
      for (const id of todas) {
        const c = DATOS.criaturas.get(id)!;
        expect(c.etapa).toBe(3);
        expect(c.jefe).toBeUndefined();
      }
    }
  });

  it('numera desde el 14/11/2026', () => {
    expect(numeroDesafio(new Date(2026, 10, 14, 10).getTime())).toBe(1);
    expect(numeroDesafio(new Date(2026, 10, 20, 10).getTime())).toBe(7);
  });

  it('un intento por día; la racha cuenta días seguidos y se corta si faltas', () => {
    const e = estadoNuevo(DATOS, 0);
    expect(empezarDesafio(e, hoy)).toBe(true);
    expect(desafioJugado(e, hoy)).toBe(true);
    expect(empezarDesafio(e, hoy + 1000)).toBe(false);
    expect(e.desafio.racha).toBe(1);
    empezarDesafio(e, hoy + DIA);
    expect(e.desafio.racha).toBe(2);
    empezarDesafio(e, hoy + 3 * DIA);
    expect(e.desafio.racha).toBe(1);
    expect(e.desafio.mejorRacha).toBe(2);
  });

  it('el premio se da una sola vez y salir a la mitad cuenta como derrota sin premio', () => {
    const e = estadoNuevo(DATOS, 0);
    const m0 = e.monedas;
    empezarDesafio(e, hoy);
    expect(e.desafio.terminado).toBe(false);
    expect(e.desafio.victoria).toBe(false);
    const p = terminarDesafio(DATOS, e, hoy, { victoria: true, turnos: 9, vidas: [1, 0.3, 0] });
    expect(p.monedas).toBe(DATOS.economia.desafio.monedasVictoria);
    expect(e.monedas).toBe(m0 + p.monedas);
    expect(terminarDesafio(DATOS, e, hoy, { victoria: true, turnos: 9, vidas: [1, 1, 1] }).monedas).toBe(0);
    expect(e.desafio.victorias).toBe(1);
  });

  it('el texto para compartir no nombra al rival', () => {
    const d = desafioDelDia(DATOS, hoy);
    const txt = textoCompartir(6, { victoria: true, turnos: 9, vidas: [1, 0.3, 0] }, 4, 'https://x.y/');
    expect(txt).toBe('PIXANIMALS · Desafío #6\n🏆 Victoria en 9 turnos\n🟩🟨🟥\n🔥 Racha: 4 días\nhttps://x.y/');
    for (const id of [...d.equipo, ...d.rival]) expect(txt).not.toContain(DATOS.criaturas.get(id)!.nombre);
    expect(textoCompartir(6, { victoria: false, turnos: 5, vidas: [0, 0, 0] }, 1, 'u')).not.toContain('Racha');
  });

  it('una partida v7 se migra a v8 sin desafío jugado', () => {
    const v7 = { ...estadoNuevo(DATOS, 0), version: 7 } as Record<string, unknown>;
    delete v7.desafio;
    const m = EstadoJuegoZ.parse(migrar(v7));
    expect(m.version).toBe(9);
    expect(m.desafio.dia).toBe(-1);
  });
});
