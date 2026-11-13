import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { criaturaDe, estadoNuevo, nuevaCriatura } from '../src/core/estado/juego';
import { deserializar } from '../src/core/estado/guardado';
import { abrirSobre, costoDe } from '../src/core/sobres/sobres';
import { cobrarDiario, diarioDisponible, premioDeHoy } from '../src/core/progresion/diario';
import { cobrarMision, misionesDeHoy, misionesPorCobrar, registrar } from '../src/core/progresion/misiones';
import { partidasConPremio, terminarMinijuego } from '../src/core/minijuegos/minijuegos';
import { diaLocal } from '../src/core/items/items';

/** Mediodía local de un día cualquiera, y los días siguientes. */
const DIA = 86_400_000;
const base = (() => {
  const d = new Date(2026, 10, 12, 12, 0, 0);
  return d.getTime();
})();
const dia = (n: number) => base + n * DIA;

function conCriaturas() {
  const e = estadoNuevo(DATOS, base);
  e.criaturas.push(nuevaCriatura('lumbrito', 10, 'comun', false), nuevaCriatura('solarion', 46, 'comun', false));
  e.equipo = ['lumbrito', 'solarion'];
  return e;
}

describe('partidas guardadas', () => {
  it('una partida de la versión 2 pasa a la actual sin perder nada', () => {
    const v2 = { ...estadoNuevo(DATOS, 0), version: 2, monedas: 321 } as Record<string, unknown>;
    for (const k of ['diario', 'minijuegos', 'misiones', 'sobresRegalo']) delete v2[k];
    const e = deserializar(JSON.stringify(v2))!;
    expect(e.version).toBe(6);
    expect(e.monedas).toBe(321);
    expect(e.diario).toEqual({ ultimoDia: -1, racha: 0 });
    expect(e.sobresRegalo).toEqual({});
  });
});

describe('premio diario', () => {
  it('se cobra una vez por día y la racha sube con días seguidos', () => {
    const e = estadoNuevo(DATOS, base);
    const m0 = e.monedas;
    expect(diarioDisponible(e, dia(0))).toBe(true);
    expect(cobrarDiario(DATOS, e, dia(0))).toMatchObject({ dia: 1, racha: 1, monedas: 50, sobre: null });
    expect(e.monedas).toBe(m0 + 50);
    expect(cobrarDiario(DATOS, e, dia(0) + 3_600_000)).toBeNull();
    expect(cobrarDiario(DATOS, e, dia(1))!.racha).toBe(2);
  });
  it('saltarse un día corta la racha', () => {
    const e = estadoNuevo(DATOS, base);
    cobrarDiario(DATOS, e, dia(0));
    cobrarDiario(DATOS, e, dia(1));
    expect(premioDeHoy(DATOS, e, dia(3)).racha).toBe(1);
    expect(cobrarDiario(DATOS, e, dia(3))!.dia).toBe(1);
  });
  it('el día 7 regala un Sobre Raro que se abre gratis, y el ciclo vuelve a empezar', () => {
    const e = estadoNuevo(DATOS, base);
    for (let d = 0; d < 6; d++) expect(cobrarDiario(DATOS, e, dia(d))!.sobre).toBeNull();
    expect(cobrarDiario(DATOS, e, dia(6))).toMatchObject({ dia: 7, sobre: 'raro' });
    expect(e.sobresRegalo.raro).toBe(1);
    expect(costoDe(DATOS, e, 'raro', dia(6))).toMatchObject({ gratis: true, regalo: true, costo: 0 });
    const monedas = e.monedas;
    expect(Array.isArray(abrirSobre(DATOS, e, 'raro', new Rng(1), dia(6)))).toBe(true);
    expect(e.monedas).toBe(monedas);
    expect(e.sobresRegalo.raro).toBe(0);
    expect(costoDe(DATOS, e, 'raro', dia(6)).gratis).toBe(false);
    expect(cobrarDiario(DATOS, e, dia(7))!.dia).toBe(1);
  });
});

describe('minijuegos', () => {
  it('el puntaje da de 8 a 20 de Entrenamiento y de 5 a 15 monedas', () => {
    const e = conCriaturas();
    const m0 = e.monedas;
    const r = terminarMinijuego(DATOS, e, 'bayas', 'lumbrito', 1, 30, dia(0));
    expect(r).toMatchObject({ conPremio: true, entrenamiento: 20, monedas: 15, record: true });
    expect(criaturaDe(e, 'lumbrito')!.entrenamiento).toBe(20);
    expect(e.monedas).toBe(m0 + 15);
    expect(terminarMinijuego(DATOS, e, 'bayas', 'lumbrito', 0.5, 10, dia(0))).toMatchObject({ entrenamiento: 14, monedas: 10, record: false });
  });
  it('puntaje 0 no da nada', () => {
    const e = conCriaturas();
    expect(terminarMinijuego(DATOS, e, 'eco', 'lumbrito', 0, 0, dia(0))).toMatchObject({ entrenamiento: 0, monedas: 0 });
  });
  it('solo 5 partidas por minijuego y por día dan premio; al día siguiente vuelve', () => {
    const e = conCriaturas();
    for (let i = 0; i < 5; i++) expect(terminarMinijuego(DATOS, e, 'golpe', 'lumbrito', 1, 5, dia(0)).conPremio).toBe(true);
    expect(partidasConPremio(DATOS, e, 'golpe', dia(0))).toBe(0);
    expect(terminarMinijuego(DATOS, e, 'golpe', 'lumbrito', 1, 5, dia(0))).toMatchObject({ conPremio: false, monedas: 0, entrenamiento: 0 });
    expect(partidasConPremio(DATOS, e, 'bayas', dia(0))).toBe(5);
    expect(partidasConPremio(DATOS, e, 'golpe', dia(1))).toBe(5);
  });
  it('una criatura en su etapa final no suma Entrenamiento, pero las monedas sí', () => {
    const e = conCriaturas();
    expect(terminarMinijuego(DATOS, e, 'bayas', 'solarion', 1, 5, dia(0))).toMatchObject({ entrenamiento: 0, monedas: 15 });
  });
  it('avisa cuando la criatura queda lista para evolucionar', () => {
    const e = conCriaturas();
    const l = criaturaDe(e, 'lumbrito')!;
    l.nivel = 16;
    l.entrenamiento = 90;
    expect(terminarMinijuego(DATOS, e, 'eco', 'lumbrito', 1, 8, dia(0)).lista).toBe(true);
  });
});

describe('misiones diarias', () => {
  it('3 por día, de eventos distintos, siempre las mismas para el mismo día', () => {
    const a = estadoNuevo(DATOS, base);
    const b = estadoNuevo(DATOS, base);
    const ma = misionesDeHoy(DATOS, a, dia(0));
    expect(ma).toHaveLength(3);
    expect(new Set(ma.map((m) => m.def.evento)).size).toBe(3);
    expect(misionesDeHoy(DATOS, b, dia(0) + 5_000).map((m) => m.def.id)).toEqual(ma.map((m) => m.def.id));
    const dias = new Set(Array.from({ length: 8 }, (_, d) => misionesDeHoy(DATOS, estadoNuevo(DATOS, base), dia(d)).map((m) => m.def.id).join()));
    expect(dias.size).toBeGreaterThan(1);
  });
  it('avanzan con su evento, se cobran una sola vez y se renuevan al otro día', () => {
    const e = estadoNuevo(DATOS, base);
    const m = misionesDeHoy(DATOS, e, dia(0))[0]!;
    const otro = DATOS.economia.misiones.lista.find((x) => !misionesDeHoy(DATOS, e, dia(0)).some((y) => y.def.evento === x.evento))?.evento;
    if (otro) registrar(DATOS, e, otro, 99, dia(0));
    expect(misionesDeHoy(DATOS, e, dia(0))[0]!.progreso).toBe(0);
    expect(cobrarMision(DATOS, e, m.def.id, dia(0))).toBeNull();
    const completas = registrar(DATOS, e, m.def.evento, m.def.meta, dia(0));
    expect(completas.map((x) => x.id)).toContain(m.def.id);
    expect(misionesPorCobrar(DATOS, e, dia(0))).toBe(1);
    const antes = { monedas: e.monedas, esencia: e.esencia };
    expect(cobrarMision(DATOS, e, m.def.id, dia(0))).toEqual(m.def.premio);
    if (m.def.premio.tipo === 'monedas') expect(e.monedas).toBe(antes.monedas + m.def.premio.cantidad);
    else expect(e.esencia).toBe(antes.esencia + m.def.premio.cantidad);
    expect(cobrarMision(DATOS, e, m.def.id, dia(0))).toBeNull();
    misionesDeHoy(DATOS, e, dia(1));
    expect(e.misiones.dia).toBe(diaLocal(dia(1)));
    expect(e.misiones.lista.every((x) => x.progreso === 0 && !x.cobrada)).toBe(true);
  });
  it('abrir un sobre y jugar minijuegos cuentan para sus misiones', () => {
    const e = conCriaturas();
    e.monedas = 10_000;
    e.misiones = { dia: diaLocal(dia(0)), lista: [{ id: 'sobre_1', progreso: 0, cobrada: false }, { id: 'minijuego_2', progreso: 0, cobrada: false }, { id: 'record_1', progreso: 0, cobrada: false }] };
    abrirSobre(DATOS, e, 'basico', new Rng(2), dia(0));
    terminarMinijuego(DATOS, e, 'bayas', 'lumbrito', 0.5, 12, dia(0));
    const m = misionesDeHoy(DATOS, e, dia(0));
    expect(m.map((x) => x.progreso)).toEqual([1, 1, 1]);
  });
});
