import type { Datos } from '../datos';
import type { EstadoJuego } from '../../esquemas/esquemas';
import { regionTerminada } from '../modos/historia';

/**
 * Ranuras de guardado (D279): hasta 3 partidas separadas en el mismo dispositivo. La ranura 1 usa las mismas
 * claves de siempre, así que las partidas existentes quedan en ella sin migrar nada.
 */
export const RANURAS = 3;
export type Ranura = 1 | 2 | 3;
export const TODAS: readonly Ranura[] = [1, 2, 3];

export const esRanura = (n: unknown): n is Ranura => n === 1 || n === 2 || n === 3;

/** Clave del guardado principal (localStorage). */
export const claveLocal = (r: Ranura): string => (r === 1 ? 'pixanimals.partida' : `pixanimals.partida.${r}`);
/** Clave en el almacén de la app de Android. */
export const claveNativa = (r: Ranura): string => (r === 1 ? 'partida' : `partida.${r}`);
/** Prefijo de las copias de seguridad en IndexedDB («actual», «dia-N»; la ranura 1 sin prefijo). */
export const prefijoRespaldo = (r: Ranura): string => (r === 1 ? '' : `r${r}/`);

/** ¿Esta clave de copia es de la ranura r? Devuelve la clave sin prefijo, o null. */
export function claveDeRanura(clave: string, r: Ranura): string | null {
  const p = prefijoRespaldo(r);
  if (p) return clave.startsWith(p) ? clave.slice(p.length) : null;
  return clave.includes('/') ? null : clave;
}

/** Lo que muestra la tarjeta de una ranura con partida. */
export interface ResumenRanura {
  /** Especies del equipo (para dibujarlas). */
  equipo: string[];
  nivel: number;
  criaturas: number;
  monedas: number;
  /** Región en curso de la historia (id); 'final' (falta el Arquitecto), 'completa', 'libre' (sin historia) o null si no empezó. */
  region: string | null;
  /** Regiones terminadas. */
  regiones: number;
}

export function resumir(datos: Datos, e: EstadoJuego): ResumenRanura {
  const regs = datos.historia.regiones;
  const hechas = regs.filter((r) => regionTerminada(e, r)).length;
  const equipo = e.equipo.slice(0, 3);
  const mios = e.criaturas.filter((c) => equipo.includes(c.especie));
  const nivel = mios.length ? Math.round(mios.reduce((s, c) => s + c.nivel, 0) / mios.length) : 0;
  let region: string | null = null;
  if (e.historia) region = e.historia.final ? 'completa' : e.historia.libre ? 'libre' : hechas >= regs.length ? 'final' : regs[hechas]!.id;
  return { equipo, nivel, criaturas: e.criaturas.length, monedas: e.monedas, region, regiones: hechas };
}

/** Fechas del último guardado de cada ranura (se guarda aparte, en una clave chica). */
export const CLAVE_FECHAS = 'pixanimals.ranuras';
export const CLAVE_ACTIVA = 'pixanimals.ranura';

export function leerFechas(texto: string | null): Partial<Record<Ranura, number>> {
  try {
    const o = JSON.parse(texto ?? '{}') as Record<string, unknown>;
    const r: Partial<Record<Ranura, number>> = {};
    for (const n of TODAS) if (typeof o[n] === 'number') r[n] = o[n] as number;
    return r;
  } catch {
    return {};
  }
}
