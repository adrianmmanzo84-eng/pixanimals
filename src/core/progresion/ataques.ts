import type { Datos } from '../datos';
import type { CriaturaJugador } from '../../esquemas/esquemas';

/**
 * Aprender ataques (D217).
 * - Se aprenden ataques Ofensivos, Defensivos y de Apoyo del mismo tipo que use alguna criatura común de la misma
 *   etapa o menor (sin Finales ni Definitivos, ni los de Eclipse, jefes o familias exclusivas).
 * - Van en los espacios 0 a 2, en cualquier combinación; el espacio 3 (el Final) es fijo.
 * - Lo aprendido queda en la memoria de la criatura y se puede volver a poner cuando quieras.
 */
export const ESPACIO_FINAL = 3;
const ROLES_APRENDIBLES = new Set(['ofensiva', 'defensiva', 'soporte']);

const cache = new Map<string, string[]>();

/** Todos los ataques que puede aprender una especie (ordenados por nombre). */
export function aprendibles(datos: Datos, especie: string): string[] {
  const clave = especie;
  const hit = cache.get(clave);
  if (hit && cache.get('__datos') === (datos as unknown as string[])) return hit;
  const e = datos.criaturas.get(especie);
  if (!e) return [];
  const ids = new Set<string>();
  for (const c of datos.criaturas.values()) {
    const propia = c.familia === e.familia;
    // Fuentes: criaturas comunes del mismo tipo y la propia familia (incluso si es exclusiva).
    if (!propia && (c.origen || c.id.endsWith('_eclipse') || c.tipo !== e.tipo)) continue;
    if (c.etapa > Math.min(e.etapa, 4)) continue;
    for (const id of c.habilidades) {
      const h = datos.habilidades.get(id);
      if (h && h.tipo === e.tipo && ROLES_APRENDIBLES.has(h.rol)) ids.add(id);
    }
  }
  const lista = [...ids].sort((a, b) => datos.habilidades.get(a)!.nombre.localeCompare(datos.habilidades.get(b)!.nombre));
  cache.set('__datos', datos as unknown as string[]);
  cache.set(clave, lista);
  return lista;
}

/** Los 4 ataques con los que pelea: los de su especie, con los que eligió en los espacios 0 a 2. */
export function ataquesDe(datos: Datos, c: CriaturaJugador): string[] {
  const original = datos.criaturas.get(c.especie)!.habilidades;
  const validos = new Set([...aprendibles(datos, c.especie), ...original.slice(0, ESPACIO_FINAL)]);
  const res = [...original];
  (c.ataques ?? []).forEach((id, i) => {
    if (i < ESPACIO_FINAL && id && validos.has(id)) res[i] = id;
  });
  // Nunca dos veces el mismo: si se repite (datos viejos), vuelve el original de ese espacio.
  for (let i = 0; i < ESPACIO_FINAL; i++) if (res.indexOf(res[i]!) !== i) res[i] = original[i]!;
  return new Set(res).size === res.length ? res : [...original];
}

/** Ataques que ya sabe y puede poner en un espacio: los originales de su especie más los aprendidos. */
export function conocidos(datos: Datos, c: CriaturaJugador): string[] {
  const validos = new Set(aprendibles(datos, c.especie));
  const originales = datos.criaturas.get(c.especie)!.habilidades.slice(0, ESPACIO_FINAL);
  return [...new Set([...originales, ...(c.aprendidos ?? []).filter((id) => validos.has(id))])];
}

/** Ataques que todavía no conoce (lo que puede ofrecer un nivel o un Pergamino). */
export function nuevosPara(datos: Datos, c: CriaturaJugador): string[] {
  const ya = new Set([...conocidos(datos, c), ...ataquesDe(datos, c)]);
  return aprendibles(datos, c.especie).filter((id) => !ya.has(id));
}

/** Pone un ataque en un espacio (0 a 2). Si ya estaba en otro espacio, intercambian lugar. Queda en la memoria. */
export function aprender(datos: Datos, c: CriaturaJugador, habilidad: string, espacio: number): boolean {
  if (espacio < 0 || espacio >= ESPACIO_FINAL) return false;
  if (!aprendibles(datos, c.especie).includes(habilidad) && !datos.criaturas.get(c.especie)!.habilidades.slice(0, ESPACIO_FINAL).includes(habilidad)) return false;
  const actuales = ataquesDe(datos, c);
  const especie = datos.criaturas.get(c.especie)!;
  const elegidos: (string | null)[] = actuales.slice(0, ESPACIO_FINAL).map((id, i) => (id === especie.habilidades[i] ? null : id));
  const otro = actuales.indexOf(habilidad);
  if (otro >= 0 && otro < ESPACIO_FINAL && otro !== espacio) elegidos[otro] = actuales[espacio] === especie.habilidades[otro] ? null : actuales[espacio]!;
  elegidos[espacio] = habilidad === especie.habilidades[espacio] ? null : habilidad;
  c.ataques = elegidos;
  if (!especie.habilidades.includes(habilidad)) c.aprendidos = [...new Set([...(c.aprendidos ?? []), habilidad])];
  if (c.ofertaAtaque === habilidad) delete c.ofertaAtaque;
  return true;
}

/** Vuelve a los ataques originales de su especie (la memoria se conserva). */
export function restablecer(c: CriaturaJugador): void {
  delete c.ataques;
}

/** Número estable a partir de un texto (para elegir ofertas sin azar: misma criatura y nivel, misma oferta). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Al subir de nivel: si cruzó un múltiplo de `cadaNiveles`, ofrece un ataque nuevo (queda pendiente en la criatura
 * hasta que el jugador lo acepte o lo descarte; una oferta nueva reemplaza a la anterior).
 */
export function ofertaPorNivel(datos: Datos, c: CriaturaJugador, nivelAntes: number): string | null {
  const cada = datos.economia.ataques.cadaNiveles;
  const hito = Math.floor(c.nivel / cada) * cada;
  if (hito <= nivelAntes || hito < cada) return null;
  const nuevos = nuevosPara(datos, c);
  if (!nuevos.length) return null;
  c.ofertaAtaque = nuevos[hash(`${c.especie}:${hito}`) % nuevos.length]!;
  return c.ofertaAtaque;
}

/** Descarta la oferta pendiente. */
export function descartarOferta(c: CriaturaJugador): void {
  delete c.ofertaAtaque;
}

/** Las opciones de un Pergamino de Técnica: hasta `n` ataques nuevos, distintos, elegidos con la semilla. */
export function opcionesPergamino(datos: Datos, c: CriaturaJugador, semilla: number, n = 3): string[] {
  const nuevos = nuevosPara(datos, c);
  const res: string[] = [];
  let s = semilla >>> 0;
  while (res.length < Math.min(n, nuevos.length)) {
    s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0;
    const id = nuevos[s % nuevos.length]!;
    if (!res.includes(id)) res.push(id);
  }
  return res;
}
