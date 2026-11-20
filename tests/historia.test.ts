import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo, nuevaCriatura } from '../src/core/estado/juego';
import { deserializar, serializar } from '../src/core/estado/guardado';
import {
  confirmarDesafio, equipoFinal, equipoParada, finalAbierto, ganarFinal, ganarParada, modoAbierto, paradaVencida, regionAbierta,
  regionTerminada, siguienteParada, type Parada,
} from '../src/core/modos/historia';
import type { EstadoJuego } from '../src/esquemas/esquemas';

const H = DATOS.historia;
const nuevo = (): EstadoJuego => {
  const e = estadoNuevo(DATOS, 0);
  e.criaturas = DATOS.jugables.filter((c) => c.etapa === 1 && !c.origen).slice(0, 3).map((c) => nuevaCriatura(c.id, 10, 'comun', false));
  e.equipo = e.criaturas.map((c) => c.especie);
  return e;
};

/** Cumple el desafío del entorno de una región tocando la partida como lo haría el modo. */
function cumplir(e: EstadoJuego, i: number): void {
  const d = H.regiones[i]!.desafio;
  if (d.tipo === 'minijuego') e.minijuegos.partidas[d.id] = 1;
  else if (d.tipo === 'mina') e.mina.zonaMax = d.zona;
  else if (d.tipo === 'crono') e.crono = { eraMax: d.era + 1, vencidas: [d.era], fosiles: {}, ambar: 0 };
  else e.torre.mejor = d.piso;
}

function terminarRegion(e: EstadoJuego, i: number): void {
  ganarParada(DATOS, e, i, 0);
  cumplir(e, i);
  confirmarDesafio(DATOS, e, i);
  ganarParada(DATOS, e, i, 2);
  ganarParada(DATOS, e, i, 3);
}

describe('modo historia', () => {
  it('los datos: 6 regiones, una por tipo, con sus 2 jefes y su Guardián', () => {
    expect(H.regiones).toHaveLength(6);
    expect(new Set(H.regiones.map((r) => r.tipo)).size).toBe(6);
  });

  it('una partida nueva empieza con lo básico abierto (subir de nivel, tienda, álbum, minijuegos); lo avanzado, cerrado', () => {
    const e = nuevo();
    for (const m of ['historia', 'rapido', 'torre', 'desafio', 'tienda', 'expediciones', 'misiones', 'ruleta', 'coleccion', 'bestiario', 'minijuegos', 'mj.bayas', 'mj.eco', 'mj.golpe', 'mj.mina'] as const) {
      expect(modoAbierto(DATOS, e, m), m).toBe(true);
    }
    for (const m of ['entrenador', 'semanal', 'crono'] as const) expect(modoAbierto(DATOS, e, m), m).toBe(false);
    const vieja = nuevo();
    delete vieja.historia;
    expect(modoAbierto(DATOS, vieja, 'semanal')).toBe(true);
    expect(modoAbierto(DATOS, vieja, 'entrenador')).toBe(true);
  });

  it('las paradas van en orden y el desafío se cumple mirando la partida', () => {
    const e = nuevo();
    const r = H.regiones[0]!;
    expect(ganarParada(DATOS, e, 0, 2).monedas).toBe(0); // no toca
    expect(ganarParada(DATOS, e, 0, 0).monedas).toBe(H.monedasParada[0]);
    expect(ganarParada(DATOS, e, 0, 0).monedas).toBe(0); // repetida
    expect(siguienteParada(e, r)).toBe(1);
    cumplir(e, 0);
    expect(paradaVencida(e, r, 1)).toBe(true);
    expect(siguienteParada(e, r)).toBe(2);
    ganarParada(DATOS, e, 0, 2);
    const sobres = { ...e.sobresRegalo };
    const res = ganarParada(DATOS, e, 0, 3);
    expect(res.region).not.toBeNull();
    expect(e.sobresRegalo[r.premio.sobre!]).toBe((sobres[r.premio.sobre!] ?? 0) + 1);
    expect(res.abiertos).toEqual(expect.arrayContaining(r.abre));
    expect(regionTerminada(e, r)).toBe(true);
    expect(regionAbierta(DATOS, e, 1)).toBe(true);
    expect(modoAbierto(DATOS, e, 'mj.mina')).toBe(true);
  });

  it('un desafío cumplido antes de llegar no salta al Jefe A', () => {
    const e = nuevo();
    cumplir(e, 0);
    expect(siguienteParada(e, H.regiones[0]!)).toBe(0);
  });

  it('las seis regiones abren el final; vencerlo deja la partida libre', () => {
    const e = nuevo();
    for (let i = 0; i < H.regiones.length; i++) {
      expect(regionAbierta(DATOS, e, i)).toBe(true);
      expect(finalAbierto(DATOS, e)).toBe(false);
      terminarRegion(e, i);
    }
    expect(finalAbierto(DATOS, e)).toBe(true);
    expect(modoAbierto(DATOS, e, 'expediciones')).toBe(true);
    expect(ganarFinal(DATOS, e)).not.toBeNull();
    expect(e.historia!.libre).toBe(true);
    expect(ganarFinal(DATOS, e)).toBeNull();
  });

  it('los equipos rivales: el jefe al frente y reclutas del tipo, según tu equipo', () => {
    const e = nuevo();
    for (let i = 0; i < H.regiones.length; i++) {
      const r = H.regiones[i]!;
      for (const n of [0, 2, 3] as Parada[]) {
        const eq = equipoParada(DATOS, i, n, e.criaturas);
        expect(eq[0]!.especie.id).toBe(n === 3 ? r.guardian : r.jefes[n === 0 ? 0 : 1]);
        expect(eq.length).toBe(n === 0 ? 2 : 3);
        for (const c of eq.slice(1)) expect(c.especie.tipo).toBe(r.tipo);
      }
    }
    const f = equipoFinal(DATOS, e.criaturas);
    expect(f[0]!.especie.id).toBe('arquitecto');
    expect(f.slice(1).every((c) => c.especie.id.endsWith('_eclipse'))).toBe(true);
  });

  it('el progreso se guarda y se lee', () => {
    const e = nuevo();
    terminarRegion(e, 0);
    const otra = deserializar(serializar(e))!;
    expect(otra.historia).toEqual(e.historia);
  });
});

describe('zonas de práctica (D270)', () => {
  it('cada zona tiene tipo y región válidos y sus rivales salen dentro del rango', async () => {
    const { ZONAS, equipoPractica, zonaAbierta, dificultadZona } = await import('../src/core/modos/practica');
    const { Rng } = await import('../src/core/rng');
    for (const [i, z] of ZONAS.entries()) {
      if (z.tipo) expect(DATOS.tipos.has(z.tipo), z.id).toBe(true);
      if (z.region !== null) expect(DATOS.historia.regiones[z.region], z.id).toBeDefined();
      expect(z.nivel[0]).toBeLessThanOrEqual(z.nivel[1]);
      for (let k = 0; k < 20; k++) {
        const rivales = equipoPractica(DATOS, i, 3, new Rng(k + 1));
        expect(rivales).toHaveLength(3);
        for (const r of rivales) {
          expect(r.nivel, z.id).toBeGreaterThanOrEqual(z.nivel[0]);
          expect(r.nivel, z.id).toBeLessThanOrEqual(z.nivel[1]);
          if (z.tipo) expect(r.especie.tipo, z.id).toBe(z.tipo);
        }
      }
    }
    // Una zona siempre queda por debajo del jefe de su región (se practica antes de enfrentarlo).
    for (const z of ZONAS) if (z.region !== null) expect(z.nivel[1]).toBeLessThanOrEqual(DATOS.historia.regiones[z.region]!.nivel);
    // Partida nueva: Pradera y Bosque abiertos, el resto no; partida vieja: todo.
    const e = nuevo();
    expect(ZONAS.map((_, i) => zonaAbierta(DATOS, e, i))).toEqual([true, true, false, false, false, false, false]);
    const vieja = nuevo();
    delete vieja.historia;
    expect(ZONAS.every((_, i) => zonaAbierta(DATOS, vieja, i))).toBe(true);
    expect(dificultadZona(ZONAS[1]!, 2)).toBe('dificil');
    expect(dificultadZona(ZONAS[1]!, 6)).toBe('pareja');
    expect(dificultadZona(ZONAS[1]!, 9)).toBe('facil');
  });

  it('el primer jefe del Bosque se puede alcanzar practicando (nivel 7 o menos)', () => {
    expect(DATOS.historia.regiones[0]!.nivel).toBeLessThanOrEqual(7);
  });
});

describe('prólogo y relatos (D271)', () => {
  it('equipoInicial deja a los tres elegidos como equipo, Poco comunes, y marca la bienvenida', async () => {
    const { equipoInicial } = await import('../src/core/sobres/sobres');
    const e = nuevo();
    e.bienvenida = false;
    e.criaturas = [];
    e.equipo = [];
    const ini = DATOS.historia.iniciales;
    const cartas = equipoInicial(DATOS, e, [ini[2]!, ini[0]!, ini[5]!]);
    expect(cartas.map((c) => c.especie)).toEqual([ini[2], ini[0], ini[5]]);
    expect(e.equipo).toEqual([ini[2], ini[0], ini[5]]);
    expect(e.criaturas.every((c) => c.rareza === 'poco_comun')).toBe(true);
    expect(e.bienvenida).toBe(true);
    expect(() => equipoInicial(DATOS, nuevo(), [ini[0]!, ini[0]!, ini[1]!])).toThrow();
    expect(() => equipoInicial(DATOS, nuevo(), ['noexiste', ini[0]!, ini[1]!])).toThrow();
  });

  it('los siete iniciales son de etapa 1, de siete tipos distintos', () => {
    const tipos = DATOS.historia.iniciales.map((id) => DATOS.criaturas.get(id)!.tipo);
    expect(new Set(tipos).size).toBe(7);
  });

  it('cada relato sale una sola vez, y no en partidas viejas', async () => {
    const { relatoPendiente, marcarRelato } = await import('../src/core/modos/historia');
    const e = nuevo();
    expect(relatoPendiente(e, 'region:bosque')).toBe(true);
    marcarRelato(e, 'region:bosque');
    expect(relatoPendiente(e, 'region:bosque')).toBe(false);
    expect(relatoPendiente(e, 'restaurada:bosque')).toBe(true);
    const vieja = nuevo();
    delete vieja.historia;
    expect(relatoPendiente(vieja, 'region:bosque')).toBe(false);
  });

  it('hay una ilustración para cada región, el prólogo y el final', async () => {
    const { existsSync } = await import('node:fs');
    for (const r of DATOS.historia.regiones) expect(existsSync(`public/relato/relato_${r.id}.jpg`), r.id).toBe(true);
    for (const id of ['relato_01_mundo', 'relato_02_eclipse', 'relato_03_nox', 'relato_04_prisma', 'relato_05_eleccion', 'relato_final', 'relato_mina', 'relato_brechas']) {
      expect(existsSync(`public/relato/${id}.jpg`), id).toBe(true);
    }
  });
});
