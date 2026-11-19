import type { CriaturaJugador, DesafioHistoria, EstadoJuego, ModoHistoria, PremioMeta, Region } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { Rng } from '../rng';
import { crearCombatiente, type Combatiente } from '../combate/motor';
import { formaParaNivel } from '../combate/rival';
import { darPremio } from '../progresion/premios';

/**
 * Modo Historia «La sombra del Eclipse» (D264). Seis regiones, cada una con 4 paradas en orden:
 * 0 Jefe A · 1 desafío del entorno · 2 Jefe B (Jefe Regional) · 3 Guardián (Píxel Maestro y sobre).
 * Al terminar las seis se abre el combate final contra el Arquitecto.
 *
 * Los jugadores nuevos empiezan con casi todo cerrado y la historia lo va abriendo; las partidas anteriores
 * a la historia (sin `estado.historia`) siguen con todo abierto y pueden jugarla igual.
 */
export const PARADAS = 4;
export type Parada = 0 | 1 | 2 | 3;

/** Estado de la historia para una partida nueva (con los modos cerrados). */
export function historiaNueva(): NonNullable<EstadoJuego['historia']> {
  return { libre: false, paradas: [], final: false };
}

/** La historia de la partida; las partidas viejas la empiezan con todo abierto. */
function historiaDe(estado: EstadoJuego): NonNullable<EstadoJuego['historia']> {
  if (!estado.historia) estado.historia = { libre: true, paradas: [], final: false };
  return estado.historia;
}

/** Lo que pide (y abre al llegar) el desafío del entorno. */
export function modosDelDesafio(d: DesafioHistoria): ModoHistoria[] {
  if (d.tipo === 'minijuego') return ['minijuegos', `mj.${d.id}`];
  if (d.tipo === 'mina') return ['minijuegos', 'mj.mina'];
  return [d.tipo];
}

/** ¿El desafío del entorno ya está cumplido? Se mira la partida, como los Primeros pasos. */
export function desafioCumplido(estado: EstadoJuego, d: DesafioHistoria): boolean {
  switch (d.tipo) {
    case 'minijuego':
      return (estado.minijuegos.records[d.id] ?? 0) > 0 || (estado.minijuegos.partidas[d.id] ?? 0) > 0;
    case 'mina':
      return estado.mina.zonaMax >= d.zona;
    case 'crono':
      return estado.crono?.vencidas.includes(d.era) ?? false;
    case 'torre':
      return estado.torre.mejor >= d.piso;
  }
}

export function paradaVencida(estado: EstadoJuego, r: Region, n: Parada): boolean {
  const h = estado.historia;
  if (h?.paradas.includes(`${r.id}:${n}`)) return true;
  // El desafío vale con haberlo cumplido, pero solo una vez que se llegó a él (Jefe A vencido).
  return n === 1 && !!h?.paradas.includes(`${r.id}:0`) && desafioCumplido(estado, r.desafio);
}

/** La próxima parada a jugar de la región (4 = terminada). */
export function siguienteParada(estado: EstadoJuego, r: Region): number {
  for (let n = 0; n < PARADAS; n++) if (!paradaVencida(estado, r, n as Parada)) return n;
  return PARADAS;
}

export function regionTerminada(estado: EstadoJuego, r: Region): boolean {
  return paradaVencida(estado, r, 3);
}

/** La región i se puede jugar si la anterior está terminada. */
export function regionAbierta(datos: Datos, estado: EstadoJuego, i: number): boolean {
  return i === 0 || regionTerminada(estado, datos.historia.regiones[i - 1]!);
}

export function finalAbierto(datos: Datos, estado: EstadoJuego): boolean {
  return datos.historia.regiones.every((r) => regionTerminada(estado, r));
}

/** Cuántos Píxeles Maestros (regiones terminadas) tiene. */
export function pixelesMaestros(datos: Datos, estado: EstadoJuego): number {
  return datos.historia.regiones.filter((r) => regionTerminada(estado, r)).length;
}

/** ¿Está abierto este modo? Las partidas libres (viejas o con la historia terminada) lo tienen todo. */
export function modoAbierto(datos: Datos, estado: EstadoJuego, modo: ModoHistoria): boolean {
  const h = estado.historia;
  if (!h || h.libre) return true;
  if (datos.historia.inicio.includes(modo)) return true;
  return datos.historia.regiones.some(
    (r, i) => (regionAbierta(datos, estado, i) && modosDelDesafio(r.desafio).includes(modo)) || (regionTerminada(estado, r) && r.abre.includes(modo)),
  );
}

/** En qué región se abre un modo (para avisar «se abre en el Bosque»); null si ya está abierto o nunca se cierra. */
export function regionQueAbre(datos: Datos, modo: ModoHistoria): Region | null {
  return datos.historia.regiones.find((r) => modosDelDesafio(r.desafio).includes(modo) || r.abre.includes(modo)) ?? null;
}

/** Nivel de los rivales de una parada (el Guardián, un poco más alto). */
export function nivelParada(r: Region, n: Parada): number {
  return r.nivel + [0, 0, 2, 4][n]!;
}

/** Escoltas del tipo de la región, evolucionadas según el nivel (siempre las mismas para la misma parada). */
function escoltas(datos: Datos, tipo: string | null, nivel: number, cantidad: number, semilla: number): string[] {
  const rng = new Rng(semilla);
  const pool = [...datos.criaturas.values()].filter((c) => c.etapa === 1 && !c.origen && !c.jefe && (!tipo || c.tipo === tipo)).map((c) => c.id);
  const res: string[] = [];
  while (res.length < cantidad && pool.length) res.push(formaParaNivel(datos, pool.splice(rng.entero(0, pool.length - 1), 1)[0]!, nivel));
  return res;
}

/** Equipo rival de una parada de combate: el jefe al frente y sus reclutas (tantos como tu equipo, hasta 2 o 3). */
export function equipoParada(datos: Datos, indice: number, n: Parada, mios: CriaturaJugador[]): Combatiente[] {
  const r = datos.historia.regiones[indice]!;
  const nivel = nivelParada(r, n);
  const jefe = n === 3 ? r.guardian : r.jefes[n === 0 ? 0 : 1];
  const tam = Math.min(Math.max(1, mios.length), n === 0 ? 2 : 3);
  const ids = [jefe, ...escoltas(datos, r.tipo, nivel - 2, tam - 1, indice * 97 + n * 13 + 5)];
  return ids.map((id) => crearCombatiente(datos, id, id === jefe ? nivel : nivel - 2));
}

/** El Arquitecto y dos lugartenientes Nox (formas Eclipse). */
export function equipoFinal(datos: Datos, mios: CriaturaJugador[]): Combatiente[] {
  const f = datos.historia.final;
  const nox = [...datos.criaturas.values()].filter((c) => c.id.endsWith('_eclipse')).map((c) => c.id);
  const rng = new Rng(4242);
  const tam = Math.min(Math.max(1, mios.length), 3);
  const ids = [f.jefe];
  while (ids.length < tam && nox.length) ids.push(nox.splice(rng.entero(0, nox.length - 1), 1)[0]!);
  return ids.map((id) => crearCombatiente(datos, id, id === f.jefe ? f.nivel : f.nivel - 3));
}

export interface ResultadoParada {
  /** Monedas de la parada (solo la primera vez). */
  monedas: number;
  /** Premio de la región, al vencer al Guardián por primera vez. */
  region: PremioMeta | null;
  /** Modos que se abrieron con esta victoria. */
  abiertos: ModoHistoria[];
}

function abiertosAhora(datos: Datos, estado: EstadoJuego): Set<ModoHistoria> {
  const todos = new Set<ModoHistoria>([...datos.historia.inicio, ...datos.historia.regiones.flatMap((r) => [...modosDelDesafio(r.desafio), ...r.abre])]);
  return new Set([...todos].filter((m) => modoAbierto(datos, estado, m)));
}

/** Al ganar una parada de combate: la marca (si era la que tocaba) y paga. Repetirla no da nada. */
export function ganarParada(datos: Datos, estado: EstadoJuego, indice: number, n: Parada): ResultadoParada {
  const r = datos.historia.regiones[indice]!;
  const h = historiaDe(estado);
  const res: ResultadoParada = { monedas: 0, region: null, abiertos: [] };
  if (!regionAbierta(datos, estado, indice) || siguienteParada(estado, r) !== n || n === 1) return res;
  const antes = abiertosAhora(datos, estado);
  h.paradas.push(`${r.id}:${n}`);
  res.monedas = datos.historia.monedasParada[n]!;
  estado.monedas += res.monedas;
  if (n === 3) {
    darPremio(estado, r.premio);
    res.region = r.premio;
  }
  res.abiertos = [...abiertosAhora(datos, estado)].filter((m) => !antes.has(m));
  return res;
}

/** El desafío del entorno se marca solo (se mira la partida); esto lo confirma y paga sus monedas una vez. */
export function confirmarDesafio(datos: Datos, estado: EstadoJuego, indice: number): number {
  const r = datos.historia.regiones[indice]!;
  const h = historiaDe(estado);
  if (siguienteParada(estado, r) <= 1 || h.paradas.includes(`${r.id}:1`)) return 0;
  h.paradas.push(`${r.id}:1`);
  estado.monedas += datos.historia.monedasParada[1]!;
  return datos.historia.monedasParada[1]!;
}

/** Vencer al Arquitecto: la historia termina y todo queda abierto. */
export function ganarFinal(datos: Datos, estado: EstadoJuego): PremioMeta | null {
  const h = historiaDe(estado);
  if (!finalAbierto(datos, estado) || h.final) return null;
  h.final = true;
  h.libre = true;
  darPremio(estado, datos.historia.final.premio);
  return datos.historia.final.premio;
}
