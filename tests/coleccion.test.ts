import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { estadoNuevo, nuevaCriatura } from '../src/core/estado/juego';
import { deserializar } from '../src/core/estado/guardado';
import {
  bloqueoExpedicion, bloqueoFusion, cobrarExpedicion, cobrarMeta, enviarExpedicion, fusionar, metasAlbum, metasMedallas, registradas,
} from '../src/core/progresion/coleccion';
import { evolucionar } from '../src/core/progresion/evolucion';
import { jefeDeLaSemana, resultadoSemanal, semanaLocal, tipoDeLaSemana } from '../src/core/modos/semanal';
import { precioSobre, recibir } from '../src/core/sobres/sobres';

const HORA = 3_600_000;
const DIA = 24 * HORA;

describe('Álbum', () => {
  it('las etapas anteriores de lo que tienes cuentan como registradas (evolucionar no las borra)', () => {
    const e = estadoNuevo(DATOS, 0);
    e.criaturas.push(nuevaCriatura('ignileon', 30, 'comun', false));
    expect([...registradas(DATOS, e)].sort()).toEqual(['ignileon', 'leobrasa', 'lumbrito']);
  });
  it('completar una familia se cobra una sola vez y da su premio', () => {
    const e = estadoNuevo(DATOS, 0);
    e.criaturas.push(nuevaCriatura('solarion', 40, 'comun', false));
    const meta = metasAlbum(DATOS, e).find((m) => m.id === 'familia_brasa')!;
    expect(meta.completa).toBe(true);
    const esencia = e.esencia;
    expect(cobrarMeta(DATOS, e, 'familia_brasa')).toEqual(DATOS.economia.album.familia);
    expect(e.esencia).toBe(esencia + (DATOS.economia.album.familia.esencia ?? 0));
    expect(e.sobresRegalo[DATOS.economia.album.familia.sobre!]).toBe(1);
    expect(cobrarMeta(DATOS, e, 'familia_brasa')).toBeNull();
  });
  it('no se cobra lo incompleto', () => {
    const e = estadoNuevo(DATOS, 0);
    recibir(DATOS, e, 'lumbrito', 'comun', false);
    expect(cobrarMeta(DATOS, e, 'familia_brasa')).toBeNull();
  });
  it('evolucionar suma la nueva especie al registro', () => {
    const e = estadoNuevo(DATOS, 0);
    recibir(DATOS, e, 'lumbrito', 'comun', false);
    const c = e.criaturas[0]!;
    c.nivel = 16;
    c.entrenamiento = DATOS.economia.entrenamiento.max;
    expect(evolucionar(DATOS, e, 'lumbrito', 'leobrasa')).toBe(true);
    expect(e.registro).toContain('leobrasa');
  });
});

describe('Medallas', () => {
  it('se cobran por niveles: bronce, luego plata', () => {
    const e = estadoNuevo(DATOS, 0);
    const [b, p] = DATOS.economia.medallas.find((m) => m.id === 'victorias')!.metas;
    e.estadisticas.victorias = p;
    expect(metasMedallas(DATOS, e).find((m) => m.id.startsWith('victorias'))!.id).toBe('victorias_0');
    expect(cobrarMeta(DATOS, e, 'victorias_0')).not.toBeNull();
    const sig = metasMedallas(DATOS, e).find((m) => m.id.startsWith('victorias'))!;
    expect(sig.id).toBe('victorias_1');
    expect(sig.completa).toBe(true);
    expect(b).toBeLessThan(p);
  });
});

describe('Fusión', () => {
  it('las repetidas se guardan como copias y 3 suben una rareza', () => {
    const e = estadoNuevo(DATOS, 0);
    recibir(DATOS, e, 'aletin', 'comun', false);
    expect(bloqueoFusion(DATOS, e, 'aletin')).toBe('pocas_copias');
    for (let i = 0; i < 3; i++) recibir(DATOS, e, 'aletin', 'comun', false);
    expect(e.copias.aletin).toBe(3);
    expect(fusionar(DATOS, e, 'aletin')).toBe('poco_comun');
    expect(e.copias.aletin).toBe(0);
    expect(e.estadisticas.fusiones).toBe(1);
    e.criaturas[0]!.rareza = 'epica';
    e.copias.aletin = 5;
    expect(bloqueoFusion(DATOS, e, 'aletin')).toBe('maxima');
  });
});

describe('Expediciones', () => {
  it('solo salen criaturas fuera del equipo, hasta llenar los lugares, y vuelven con premio al terminar', () => {
    const e = estadoNuevo(DATOS, 0);
    for (const id of ['lumbrito', 'aletin', 'brotin', 'gequito', 'larvin', 'mantin']) recibir(DATOS, e, id, 'comun', false);
    expect(bloqueoExpedicion(DATOS, e, 'lumbrito', 1)).toBe('en_equipo');
    expect(enviarExpedicion(DATOS, e, 'gequito', 4, 0)).toBe(true);
    expect(bloqueoExpedicion(DATOS, e, 'gequito', 1)).toBe('ya_fuera');
    expect(bloqueoExpedicion(DATOS, e, 'larvin', 3)).toBe('duracion');
    expect(cobrarExpedicion(DATOS, e, 'gequito', new Rng(1), 3 * HORA)).toBeNull();
    const monedas = e.monedas;
    const botin = cobrarExpedicion(DATOS, e, 'gequito', new Rng(1), 4 * HORA)!;
    expect(botin.monedas).toBeGreaterThan(0);
    expect(e.monedas).toBe(monedas + botin.monedas);
    expect(e.expediciones).toHaveLength(0);
    expect(e.estadisticas.expediciones).toBe(1);
  });
});

describe('Semana temática', () => {
  it('rota los 7 tipos, una vez por semana', () => {
    const tipos = new Set<string>();
    for (let s = 0; s < 7; s++) tipos.add(tipoDeLaSemana(DATOS, s * 7 * DIA + DIA));
    expect(tipos.size).toBe(7);
    // El día 4 (lunes 5/1/1970) y el 10 (domingo) son la misma semana; el 11 ya es otra.
    expect(semanaLocal(4 * DIA, 0)).toBe(semanaLocal(10 * DIA, 0));
    expect(semanaLocal(11 * DIA, 0)).toBe(semanaLocal(10 * DIA, 0) + 1);
  });
  it('el sobre del tipo de la semana cuesta menos y el jefe es una forma Eclipse de ese tipo', () => {
    const ahora = 10 * DIA;
    const tipo = tipoDeLaSemana(DATOS, ahora);
    const def = DATOS.sobres.sobres.find((s) => s.tipo === tipo)!;
    expect(precioSobre(DATOS, def, ahora)).toBeLessThan(def.costo);
    const jefe = DATOS.criaturas.get(jefeDeLaSemana(DATOS, ahora))!;
    expect(jefe.id.endsWith('_eclipse')).toBe(true);
    expect(jefe.tipo).toBe(tipo);
  });
  it('el premio se cobra una vez por semana', () => {
    const e = estadoNuevo(DATOS, 0);
    expect(resultadoSemanal(DATOS, e, true, 5 * DIA)).not.toBeNull();
    expect(resultadoSemanal(DATOS, e, true, 5 * DIA + HORA)).toBeNull();
  });
});

describe('guardado v5', () => {
  it('una partida v4 se migra sin perder nada', () => {
    const e = estadoNuevo(DATOS, 0) as unknown as Record<string, unknown>;
    e.version = 4;
    for (const k of ['copias', 'registro', 'album', 'medallas', 'expediciones', 'semanal']) delete e[k];
    e.estadisticas = { combates: 3, victorias: 2, sobres: 1 };
    const m = deserializar(JSON.stringify(e))!;
    expect(m.version).toBe(5);
    expect(m.estadisticas).toMatchObject({ combates: 3, victorias: 2, fusiones: 0 });
    expect(m.expediciones).toEqual([]);
  });
});
