import type { EstadoJuego, PremioMeta, RarezaId } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import type { Rng } from '../rng';
import { criaturaDe } from '../estado/juego';
import { agregar } from '../items/items';
import { darXp } from './experiencia';
import { darPremio } from './premios';
import { ORDEN_RAREZA, itemDeRareza, tirarRareza } from '../sobres/sobres';

/**
 * Lo que impulsa a coleccionar y volver: Álbum (completar familias, tipos y la colección),
 * Medallas (objetivos largos), Fusión de copias repetidas, Expediciones y la Semana temática.
 * Todo se gana jugando: nada se compra con dinero real.
 */

// ---------------------------------------------------------------- premios

export { darPremio } from './premios';

// ---------------------------------------------------------------- Álbum

/** Especies que alguna vez fueron tuyas: el registro, las actuales y las etapas anteriores de las actuales. */
export function registradas(datos: Datos, estado: EstadoJuego): Set<string> {
  const r = new Set(estado.registro);
  const anterior = new Map<string, string>();
  for (const c of datos.criaturas.values()) for (const e of c.evoluciona) anterior.set(e.a, c.id);
  for (const c of estado.criaturas) {
    let id: string | undefined = c.especie;
    while (id) {
      r.add(id);
      id = anterior.get(id);
    }
  }
  return r;
}

export interface Meta {
  id: string;
  /** Clave de texto y sus valores. */
  texto: string;
  valores: Record<string, string | number>;
  progreso: number;
  meta: number;
  premio: PremioMeta;
  completa: boolean;
  cobrada: boolean;
}

/** Metas del Álbum: cada familia (4 etapas), cada forma Eclipse, cada tipo completo y la colección total. */
export function metasAlbum(datos: Datos, estado: EstadoJuego): Meta[] {
  const reg = registradas(datos, estado);
  const cfg = datos.economia.album;
  const metas: Meta[] = [];
  const todas = [...datos.criaturas.values()];
  const familias = [...new Set(todas.map((c) => c.familia))];
  const normales = (f: string) => todas.filter((c) => c.familia === f && !c.id.endsWith('_eclipse'));
  const meta = (id: string, texto: string, valores: Meta['valores'], progreso: number, total: number, premio: PremioMeta): Meta => ({
    id,
    texto,
    valores,
    progreso: Math.min(progreso, total),
    meta: total,
    premio,
    completa: progreso >= total,
    cobrada: estado.album.cobrados.includes(id),
  });
  // Colección total
  const total = reg.size;
  for (const c of cfg.coleccion) metas.push(meta(`coleccion_${c.meta}`, 'alb.coleccion', { n: c.meta }, total, c.meta, c.premio));
  // Tipos
  for (const tipo of [...datos.tipos.values()].filter((t) => t.id !== 'neutro')) {
    const del = todas.filter((c) => c.tipo === tipo.id && !c.id.endsWith('_eclipse'));
    if (!del.length) continue;
    metas.push(meta(`tipo_${tipo.id}`, 'alb.tipo', { t: tipo.nombre }, del.filter((c) => reg.has(c.id)).length, del.length, cfg.tipo));
  }
  // Familias y sus Eclipse
  for (const f of familias) {
    const lista = normales(f);
    const final = lista.find((c) => c.etapa === 4) ?? lista[lista.length - 1]!;
    metas.push(meta(`familia_${f}`, 'alb.familia', { n: final.nombre }, lista.filter((c) => reg.has(c.id)).length, lista.length, cfg.familia));
    const ecl = todas.find((c) => c.familia === f && c.id.endsWith('_eclipse'));
    if (ecl) metas.push(meta(`eclipse_${ecl.id}`, 'alb.eclipse', { n: ecl.nombre }, reg.has(ecl.id) ? 1 : 0, 1, cfg.eclipse));
  }
  // Las completas sin cobrar primero, luego las que avanzan, al final las cobradas.
  const orden = (m: Meta) => (m.completa && !m.cobrada ? 0 : m.cobrada ? 2 : 1);
  return metas.sort((a, b) => orden(a) - orden(b) || b.progreso / b.meta - a.progreso / a.meta);
}

/** ¿Está completa esta familia? (para el marco dorado del Bestiario) */
export function familiaCompleta(datos: Datos, estado: EstadoJuego, familia: string): boolean {
  const reg = registradas(datos, estado);
  return [...datos.criaturas.values()].filter((c) => c.familia === familia && !c.id.endsWith('_eclipse')).every((c) => reg.has(c.id));
}

// ---------------------------------------------------------------- Medallas

export function progresoMedalla(datos: Datos, estado: EstadoJuego, id: string): number {
  const e = estado.estadisticas;
  switch (id) {
    case 'victorias':
      return e.victorias;
    case 'especies':
      return registradas(datos, estado).size;
    case 'sobres':
      return e.sobres;
    case 'torre':
      return estado.torre.mejor;
    case 'brillantes':
      return estado.criaturas.filter((c) => c.brillante).length;
    case 'expediciones':
      return e.expediciones;
    case 'fusiones':
      return e.fusiones;
    case 'impecables':
      return e.impecables;
    default:
      return 0;
  }
}

/** Una meta por nivel de cada medalla (bronce, plata, oro). Solo se ve el siguiente nivel sin cobrar. */
export function metasMedallas(datos: Datos, estado: EstadoJuego): Meta[] {
  return datos.economia.medallas.map((m) => {
    const p = progresoMedalla(datos, estado, m.id);
    const nivel = m.metas.findIndex((_, i) => !estado.medallas.cobradas.includes(`${m.id}_${i}`));
    const i = nivel < 0 ? 2 : nivel;
    const id = `${m.id}_${i}`;
    return {
      id,
      texto: `med.${m.id}`,
      valores: { n: m.metas[i]!, nivel: i },
      progreso: Math.min(p, m.metas[i]!),
      meta: m.metas[i]!,
      premio: datos.economia.premiosMedalla[i]!,
      completa: p >= m.metas[i]!,
      cobrada: estado.medallas.cobradas.includes(id),
    };
  });
}

/** Cuántos niveles ganó de una medalla (0 a 3). */
export function nivelMedalla(estado: EstadoJuego, id: string): number {
  return [0, 1, 2].filter((i) => estado.medallas.cobradas.includes(`${id}_${i}`)).length;
}

/** Cobra una meta del Álbum o una Medalla completa. Devuelve el premio o null. */
export function cobrarMeta(datos: Datos, estado: EstadoJuego, id: string): PremioMeta | null {
  const album = metasAlbum(datos, estado).find((m) => m.id === id);
  if (album) {
    if (!album.completa || album.cobrada) return null;
    estado.album.cobrados.push(id);
    darPremio(estado, album.premio);
    return album.premio;
  }
  const medalla = metasMedallas(datos, estado).find((m) => m.id === id);
  if (!medalla || !medalla.completa || medalla.cobrada) return null;
  estado.medallas.cobradas.push(id);
  darPremio(estado, medalla.premio);
  return medalla.premio;
}

/** Cuántas metas del Álbum y Medallas hay para cobrar (para avisar en el menú). */
export function metasPorCobrar(datos: Datos, estado: EstadoJuego): number {
  return [...metasAlbum(datos, estado), ...metasMedallas(datos, estado)].filter((m) => m.completa && !m.cobrada).length;
}

// ---------------------------------------------------------------- Fusión

export type MotivoFusion = 'no_tienes' | 'pocas_copias' | 'maxima';

export function bloqueoFusion(datos: Datos, estado: EstadoJuego, especie: string): MotivoFusion | null {
  const c = criaturaDe(estado, especie);
  if (!c) return 'no_tienes';
  if (c.rareza === 'epica') return 'maxima';
  if ((estado.copias[especie] ?? 0) < datos.economia.fusion.copias) return 'pocas_copias';
  return null;
}

/** Funde copias repetidas: la criatura sube una rareza (conserva nivel y experiencia). */
export function fusionar(datos: Datos, estado: EstadoJuego, especie: string): RarezaId | null {
  if (bloqueoFusion(datos, estado, especie) !== null) return null;
  const c = criaturaDe(estado, especie)!;
  estado.copias[especie]! -= datos.economia.fusion.copias;
  c.rareza = ORDEN_RAREZA[ORDEN_RAREZA.indexOf(c.rareza) + 1]!;
  estado.estadisticas.fusiones++;
  return c.rareza;
}

// ---------------------------------------------------------------- Expediciones

const MS_HORA = 3_600_000;

export type MotivoExpedicion = 'no_tienes' | 'en_equipo' | 'ya_fuera' | 'sin_lugar' | 'duracion';

export function bloqueoExpedicion(datos: Datos, estado: EstadoJuego, especie: string, horas: number): MotivoExpedicion | null {
  if (!criaturaDe(estado, especie)) return 'no_tienes';
  if (estado.equipo.includes(especie)) return 'en_equipo';
  if (estado.expediciones.some((x) => x.especie === especie)) return 'ya_fuera';
  if (estado.expediciones.length >= datos.economia.expediciones.lugares) return 'sin_lugar';
  if (!datos.economia.expediciones.duraciones.some((d) => d.horas === horas)) return 'duracion';
  return null;
}

/** Manda a explorar a una criatura que no está en el equipo. */
export function enviarExpedicion(datos: Datos, estado: EstadoJuego, especie: string, horas: number, ahora: number): boolean {
  if (bloqueoExpedicion(datos, estado, especie, horas) !== null) return false;
  estado.expediciones.push({ especie, desde: ahora, horas });
  return true;
}

/** Milisegundos que faltan (0 si ya volvió). */
export function faltaExpedicion(x: EstadoJuego['expediciones'][number], ahora: number): number {
  return Math.max(0, x.desde + x.horas * MS_HORA - ahora);
}

export function enExpedicion(estado: EstadoJuego, especie: string): boolean {
  return estado.expediciones.some((x) => x.especie === especie);
}

export interface BotinExpedicion {
  especie: string;
  monedas: number;
  xp: number;
  subio: boolean;
  item: string | null;
  sobre: string | null;
}

/** Cobra una expedición que ya volvió: monedas (más con más nivel), experiencia, quizás un ítem y un sobre. */
export function cobrarExpedicion(datos: Datos, estado: EstadoJuego, especie: string, rng: Rng, ahora: number): BotinExpedicion | null {
  const i = estado.expediciones.findIndex((x) => x.especie === especie);
  const x = estado.expediciones[i];
  if (!x || faltaExpedicion(x, ahora) > 0) return null;
  const d = datos.economia.expediciones.duraciones.find((y) => y.horas === x.horas)!;
  estado.expediciones.splice(i, 1);
  const c = criaturaDe(estado, especie);
  const monedas = Math.round(d.monedas * (1 + (c?.nivel ?? 1) / 50));
  estado.monedas += monedas;
  const subio = c ? darXp(datos, c, d.xp) > 0 : false;
  let item: string | null = null;
  if (rng.prob(d.probItem)) {
    const sobre = datos.sobres.sobres.find((s) => s.id === d.sobre)!;
    item = itemDeRareza(datos, { ...sobre, items: undefined }, tirarRareza(sobre.prob, rng), rng);
    if (item) agregar(estado, item);
  }
  let sobre: string | null = null;
  if (rng.prob(d.probSobre)) {
    sobre = d.sobre;
    estado.sobresRegalo[sobre] = (estado.sobresRegalo[sobre] ?? 0) + 1;
  }
  estado.estadisticas.expediciones++;
  return { especie, monedas, xp: d.xp, subio, item, sobre };
}

