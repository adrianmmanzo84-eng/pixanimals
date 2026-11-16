import type { CriaturaJugador, EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { Rng } from '../rng';
import { diaLocal } from '../items/items';
import { crearCombatiente, type Combatiente, type ReglaEra } from '../combate/motor';
import { formaParaNivel } from '../combate/rival';
import { recibir } from '../sobres/sobres';

/**
 * Cronoportal (D231–D235): viajes a 5 eras prehistóricas. Cada viaje es una expedición por un mapa de columnas
 * (como un camino que se ramifica): combates, excavaciones, eventos y fogatas, y el jefe al final. La vida del equipo
 * se arrastra entre combates. Al vencer al jefe se abre la era siguiente. Con fósiles (o ámbar) se revive en el
 * Laboratorio la cría de cada familia prehistórica: la única forma de conseguirlas.
 */

export type TipoNodo = 'combate' | 'excavacion' | 'evento' | 'fogata' | 'jefe';
export interface Nodo {
  id: string;
  col: number;
  fila: number;
  tipo: TipoNodo;
  /** Nodos de la columna siguiente a los que lleva. */
  sig: string[];
}
export interface Mapa {
  nodos: Nodo[];
  columnas: number;
}

export interface EstadoCrono {
  eraMax: number;
  vencidas: number[];
  fosiles: Record<string, number>;
  ambar: number;
  expedicion?: Expedicion;
  grietaDia?: number;
}
export interface Expedicion {
  era: number;
  semilla: number;
  /** Nodo actual (null: todavía no eligió el primero). */
  actual: string | null;
  visitados: string[];
  /** Equipo con el que partió y su vida (0 a 1). */
  equipo: string[];
  vida: Record<string, number>;
  /** Grieta del día: premios dobles. */
  grieta: boolean;
  /** Nodos de evento ya resueltos (para no repetirlos al volver al mapa). */
  resueltos: string[];
  /** Lo ganado en esta expedición (resumen al final). */
  botin: { monedas: number; fosiles: number; ambar: number };
}

export function crono(estado: EstadoJuego): EstadoCrono {
  estado.crono ??= { eraMax: 1, vencidas: [], fosiles: {}, ambar: 0 };
  return estado.crono as EstadoCrono;
}

export function era(datos: Datos, n: number) {
  return datos.economia.crono.eras[n - 1]!;
}

/** Forma final de la familia de una era (el jefe). */
export function jefeEra(datos: Datos, n: number): string {
  const fam = era(datos, n).familia;
  return [...datos.criaturas.values()].find((c) => c.familia === fam && c.etapa === 4)!.id;
}

/** Cría (etapa 1) de una familia. */
export function criaFamilia(datos: Datos, familia: string): string {
  return [...datos.criaturas.values()].find((c) => c.familia === familia && c.etapa === 1)!.id;
}

// ------------------------------------------------------------------ mapa

const PESOS: [TipoNodo, number][] = [
  ['combate', 50],
  ['excavacion', 20],
  ['evento', 18],
  ['fogata', 12],
];

/** Mapa de una expedición: siempre el mismo para la misma era y semilla. */
export function mapaDe(datos: Datos, n: number, semilla: number): Mapa {
  const c = datos.economia.crono;
  const rng = new Rng(semilla * 7 + n * 101);
  const cols: Nodo[][] = [];
  for (let col = 0; col < c.columnas; col++) {
    const jefe = col === c.columnas - 1;
    const cuantos = jefe ? 1 : rng.entero(2, 3);
    const fila: Nodo[] = [];
    for (let f = 0; f < cuantos; f++) {
      let tipo: TipoNodo = 'combate';
      if (jefe) tipo = 'jefe';
      else if (col > 0) {
        let x = rng.entero(1, 100);
        for (const [t, p] of PESOS) {
          if ((x -= p) <= 0) {
            tipo = t;
            break;
          }
        }
      }
      fila.push({ id: `${col}-${f}`, col, fila: f, tipo, sig: [] });
    }
    cols.push(fila);
  }
  // Antes del jefe, siempre una fogata posible.
  const previa = cols[c.columnas - 2]!;
  if (!previa.some((x) => x.tipo === 'fogata')) previa[rng.entero(0, previa.length - 1)]!.tipo = 'fogata';
  // Conexiones: cada nodo va a 1 o 2 de la columna siguiente (cercanos en altura) y nadie queda sin entrada.
  for (let col = 0; col < cols.length - 1; col++) {
    const a = cols[col]!;
    const b = cols[col + 1]!;
    const pos = (i: number, n: number) => (n === 1 ? 0.5 : i / (n - 1));
    for (const x of a) {
      const cerca = [...b].sort((p, q) => Math.abs(pos(p.fila, b.length) - pos(x.fila, a.length)) - Math.abs(pos(q.fila, b.length) - pos(x.fila, a.length)));
      x.sig.push(cerca[0]!.id);
      if (b.length > 1 && rng.prob(55)) x.sig.push(cerca[1]!.id);
    }
    for (const y of b) if (!a.some((x) => x.sig.includes(y.id))) a.reduce((m, x) => (Math.abs(x.fila - y.fila) < Math.abs(m.fila - y.fila) ? x : m)).sig.push(y.id);
  }
  return { nodos: cols.flat(), columnas: c.columnas };
}

/** Nodos que se pueden elegir ahora. */
export function siguientes(mapa: Mapa, actual: string | null): Nodo[] {
  if (actual === null) return mapa.nodos.filter((x) => x.col === 0);
  const a = mapa.nodos.find((x) => x.id === actual);
  return a ? mapa.nodos.filter((x) => a.sig.includes(x.id)) : [];
}

// ------------------------------------------------------------------ expedición

export function grietaDisponible(estado: EstadoJuego, ahora: number): boolean {
  return crono(estado).grietaDia !== diaLocal(ahora) && crono(estado).vencidas.length > 0;
}

/** Era de la Grieta del día: una de las ya abiertas, igual para todo el día. */
export function eraGrieta(estado: EstadoJuego, ahora: number): number {
  const max = crono(estado).eraMax;
  return 1 + (new Rng(diaLocal(ahora) * 31).entero(0, 1000) % max);
}

export function empezar(datos: Datos, estado: EstadoJuego, n: number, semilla: number, grieta = false, ahora = Date.now()): Expedicion | null {
  const cr = crono(estado);
  if (n > cr.eraMax || n < 1 || !estado.equipo.length) return null;
  if (grieta) {
    if (!grietaDisponible(estado, ahora)) return null;
    cr.grietaDia = diaLocal(ahora);
  }
  void datos;
  cr.expedicion = { era: n, semilla, actual: null, visitados: [], equipo: [...estado.equipo], vida: Object.fromEntries(estado.equipo.map((e) => [e, 1])), grieta, resueltos: [], botin: { monedas: 0, fosiles: 0, ambar: 0 } };
  return cr.expedicion;
}

export function abandonar(estado: EstadoJuego): void {
  delete crono(estado).expedicion;
}

/** Elige el próximo nodo (debe estar conectado al actual). */
export function avanzar(datos: Datos, estado: EstadoJuego, id: string): Nodo | null {
  const ex = crono(estado).expedicion;
  if (!ex) return null;
  const mapa = mapaDe(datos, ex.era, ex.semilla);
  const n = siguientes(mapa, ex.actual).find((x) => x.id === id);
  if (!n) return null;
  ex.actual = id;
  ex.visitados.push(id);
  return n;
}

export function nodoActual(datos: Datos, estado: EstadoJuego): Nodo | null {
  const ex = crono(estado).expedicion;
  if (!ex?.actual) return null;
  return mapaDe(datos, ex.era, ex.semilla).nodos.find((x) => x.id === ex.actual) ?? null;
}

/** Criaturas del equipo de la expedición que siguen en pie. */
export function enPie(estado: EstadoJuego): string[] {
  const ex = crono(estado).expedicion;
  return ex ? ex.equipo.filter((e) => (ex.vida[e] ?? 0) > 0) : [];
}

/** Nivel de los rivales según la columna (de nivel mínimo a máximo de la era). */
export function nivelNodo(datos: Datos, n: number, col: number): number {
  const e = era(datos, n);
  const cols = datos.economia.crono.columnas;
  return Math.round(e.nivel[0] + ((e.nivel[1] - e.nivel[0]) * col) / (cols - 1));
}

/** Rivales de un nodo de combate o del jefe. */
export function rivalesNodo(datos: Datos, n: number, nodo: Nodo, semilla: number, cuantos: number): Combatiente[] {
  const e = era(datos, n);
  const nivel = nivelNodo(datos, n, nodo.col);
  const familia = [...datos.criaturas.values()].filter((c) => c.familia === e.familia).sort((a, b) => b.etapa - a.etapa);
  if (nodo.tipo === 'jefe') {
    // El guardián de la era primero (+2 niveles) y detrás su familia, hasta igualar tu equipo.
    const eq = [crearCombatiente(datos, familia[0]!.id, nivel + 2)];
    for (const c of familia.slice(1, Math.max(1, Math.min(3, cuantos)))) eq.push(crearCombatiente(datos, c.id, nivel));
    return eq;
  }
  const rng = new Rng(semilla + nodo.col * 977 + nodo.fila * 131);
  const comunes = [...datos.criaturas.values()].filter((c) => c.etapa === 1 && !c.origen && e.tipos.includes(c.tipo)).map((c) => c.id);
  const res: Combatiente[] = [];
  for (let i = 0; i < Math.max(1, Math.min(3, cuantos)); i++) {
    // Una de cada tres es de la familia prehistórica de la era (en la forma que da su nivel, sin la final).
    const propia = i === 0 && rng.prob(60);
    const base = propia ? familia[familia.length - 1]!.id : comunes[rng.entero(0, comunes.length - 1)]!;
    let forma = formaParaNivel(datos, base, nivel);
    if (propia && datos.criaturas.get(forma)!.etapa === 4) forma = familia[1]!.id;
    res.push(crearCombatiente(datos, forma, nivel));
  }
  return res;
}

function mult(ex: Expedicion): number {
  return ex.grieta ? 2 : 1;
}

/** Guarda la vida del equipo tras un combate y cobra lo que corresponda. */
export function terminarCombate(datos: Datos, estado: EstadoJuego, victoria: boolean, vidas: Record<string, number>): { monedas: number; fosiles: number; ambar: number; eraNueva: boolean; fin: 'sigue' | 'derrota' | 'jefe' } {
  const cr = crono(estado);
  const ex = cr.expedicion;
  const nada = { monedas: 0, fosiles: 0, ambar: 0, eraNueva: false };
  if (!ex) return { ...nada, fin: 'derrota' };
  for (const [e, v] of Object.entries(vidas)) if (e in ex.vida) ex.vida[e] = Math.max(0, Math.min(1, v));
  const nodo = nodoActual(datos, estado);
  if (!victoria || !enPie(estado).length) {
    abandonar(estado);
    return { ...nada, fin: 'derrota' };
  }
  const c = datos.economia.crono;
  const e = era(datos, ex.era);
  if (nodo?.tipo === 'jefe') {
    const monedas = (c.premioJefe.monedas + c.premioJefe.porEra * ex.era) * mult(ex);
    const fosiles = c.premioJefe.fosiles * mult(ex);
    const ambar = c.premioJefe.ambar * mult(ex);
    estado.monedas += monedas;
    cr.fosiles[e.familia] = (cr.fosiles[e.familia] ?? 0) + fosiles;
    cr.ambar += ambar;
    const eraNueva = !cr.vencidas.includes(ex.era);
    if (eraNueva) cr.vencidas = [...cr.vencidas, ex.era].sort((a, b) => a - b);
    cr.eraMax = Math.max(cr.eraMax, Math.min(c.eras.length, ex.era + 1));
    abandonar(estado);
    return { monedas, fosiles, ambar, eraNueva, fin: 'jefe' };
  }
  const monedas = (c.monedasCombate + c.monedasPorEra * ex.era) * mult(ex);
  estado.monedas += monedas;
  ex.botin.monedas += monedas;
  return { ...nada, monedas, fin: 'sigue' };
}

/** Excavación: fósiles de la familia de la era (y algo de monedas). */
export function excavar(datos: Datos, estado: EstadoJuego): { fosiles: number; monedas: number } {
  const cr = crono(estado);
  const ex = cr.expedicion!;
  const c = datos.economia.crono;
  const rng = new Rng(ex.semilla * 13 + ex.visitados.length * 71);
  const fosiles = rng.entero(c.excavacion.fosiles[0], c.excavacion.fosiles[1]) * mult(ex);
  const monedas = c.excavacion.monedas * mult(ex);
  const fam = era(datos, ex.era).familia;
  cr.fosiles[fam] = (cr.fosiles[fam] ?? 0) + fosiles;
  estado.monedas += monedas;
  ex.botin.fosiles += fosiles;
  ex.botin.monedas += monedas;
  ex.resueltos.push(ex.actual!);
  return { fosiles, monedas };
}

/** Fogata: todo el equipo recupera vida (las caídas vuelven a pie). */
export function fogata(datos: Datos, estado: EstadoJuego): void {
  const ex = crono(estado).expedicion!;
  const cura = datos.economia.crono.fogata / 100;
  for (const e of ex.equipo) ex.vida[e] = Math.min(1, (ex.vida[e] ?? 0) + cura);
  ex.resueltos.push(ex.actual!);
}

/** Eventos: una decisión corta con dos caminos. */
export const EVENTOS = ['huevo', 'ambar', 'grieta', 'manantial'] as const;
export type EventoCrono = (typeof EVENTOS)[number];

export function eventoDe(estado: EstadoJuego): EventoCrono {
  const ex = crono(estado).expedicion!;
  return EVENTOS[new Rng(ex.semilla + ex.visitados.length * 53).entero(0, EVENTOS.length - 1)]!;
}

/** Resultado de elegir la opción 0 o 1 de un evento (texto: clave i18n crono.ev.<evento>.r<op>[x]). */
export function resolverEvento(datos: Datos, estado: EstadoJuego, opcion: 0 | 1): { clave: string; fosiles: number; ambar: number; monedas: number; vida: number } {
  const cr = crono(estado);
  const ex = cr.expedicion!;
  const ev = eventoDe(estado);
  const rng = new Rng(ex.semilla * 3 + ex.visitados.length * 29 + opcion);
  const fam = era(datos, ex.era).familia;
  const r = { clave: `crono.ev.${ev}.r${opcion}`, fosiles: 0, ambar: 0, monedas: 0, vida: 0 };
  const m = mult(ex);
  if (ev === 'huevo') {
    if (opcion === 0) r.fosiles = 1 * m;
    else r.vida = 0.25;
  } else if (ev === 'ambar') {
    if (opcion === 0) r.ambar = 1 * m;
    else r.monedas = 60 * m;
  } else if (ev === 'grieta') {
    if (opcion === 0) {
      if (rng.prob(50)) r.fosiles = 2 * m;
      else {
        r.vida = -0.2;
        r.clave += 'x';
      }
    }
  } else if (ev === 'manantial') {
    if (opcion === 0) r.vida = 0.35;
    else r.monedas = 40 * m;
  }
  cr.fosiles[fam] = (cr.fosiles[fam] ?? 0) + r.fosiles;
  cr.ambar += r.ambar;
  estado.monedas += r.monedas;
  ex.botin.fosiles += r.fosiles;
  ex.botin.ambar += r.ambar;
  ex.botin.monedas += r.monedas;
  if (r.vida) for (const e of ex.equipo) if ((ex.vida[e] ?? 0) > 0) ex.vida[e] = Math.max(0.05, Math.min(1, ex.vida[e]! + r.vida));
  ex.resueltos.push(ex.actual!);
  return r;
}

// ------------------------------------------------------------------ laboratorio

/** Fósiles que faltan para revivir la cría de una familia (el ámbar cubre lo que falte). */
export function puedeRevivir(datos: Datos, estado: EstadoJuego, familia: string): boolean {
  const cr = crono(estado);
  if (estado.criaturas.some((c) => datos.criaturas.get(c.especie)?.familia === familia)) return false;
  const costo = datos.economia.crono.fragmentos;
  return (cr.fosiles[familia] ?? 0) + cr.ambar >= costo && (cr.fosiles[familia] ?? 0) > 0;
}

export function revivir(datos: Datos, estado: EstadoJuego, familia: string): CriaturaJugador | null {
  if (!puedeRevivir(datos, estado, familia)) return null;
  const cr = crono(estado);
  const costo = datos.economia.crono.fragmentos;
  const usa = Math.min(costo, cr.fosiles[familia] ?? 0);
  cr.fosiles[familia] = (cr.fosiles[familia] ?? 0) - usa;
  cr.ambar -= costo - usa;
  const especie = criaFamilia(datos, familia);
  recibir(datos, estado, especie, 'rara', false);
  return estado.criaturas.find((c) => c.especie === especie) ?? null;
}

/** Regla de la era para el motor de combate. */
export function reglaDe(datos: Datos, n: number): ReglaEra {
  return era(datos, n).regla as ReglaEra;
}

export function equipoExpedicion(estado: EstadoJuego): CriaturaJugador[] {
  return enPie(estado)
    .map((e) => estado.criaturas.find((c) => c.especie === e))
    .filter((c): c is CriaturaJugador => !!c);
}

