import type { EstadoJuego, PremioMeta } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { darPremio } from './premios';

/**
 * Primeros pasos: una cadena fija de 5 pasos para quien empieza. Cada paso se cumple mirando la partida
 * (no hace falta registrar eventos), se cobra en orden desde el menú y da un premio chico; el último, un Sobre Raro.
 * El menú muestra el paso actual y deja el cursor sobre la opción que lleva a cumplirlo.
 */
export interface PasoGuia {
  id: 'combate' | 'sobre' | 'equipo' | 'minijuego' | 'torre';
  /** Opción del menú principal que lleva a cumplirlo (índice de OPCIONES en Menu.ts). */
  opcion: number;
  cumplido: (estado: EstadoJuego) => boolean;
}

export const PASOS_GUIA: PasoGuia[] = [
  { id: 'combate', opcion: 0, cumplido: (e) => e.estadisticas.victorias > 0 },
  { id: 'sobre', opcion: 4, cumplido: (e) => e.estadisticas.sobres > 0 },
  { id: 'equipo', opcion: 4, cumplido: (e) => e.equipo.length >= 3 },
  { id: 'minijuego', opcion: 1, cumplido: (e) => Object.keys(e.minijuegos.records).length > 0 || Object.values(e.minijuegos.partidas).some((n) => n > 0) },
  { id: 'torre', opcion: 0, cumplido: (e) => e.torre.mejor >= 1 },
];

/** El paso que toca (null si la guía terminó). */
export function pasoActual(estado: EstadoJuego): PasoGuia | null {
  // Con la historia en curso (partidas nuevas, D264) la guía la reemplaza la propia historia.
  if (estado.historia && !estado.historia.libre) return null;
  return estado.bienvenida ? (PASOS_GUIA[estado.guia.paso] ?? null) : null;
}

export function premioPaso(datos: Datos, paso: PasoGuia): PremioMeta {
  return datos.economia.guia[paso.id];
}

/** Si el paso actual ya se cumplió, da su premio y pasa al siguiente. Devuelve el paso cobrado, o null. */
export function cobrarPaso(datos: Datos, estado: EstadoJuego): PasoGuia | null {
  const p = pasoActual(estado);
  if (!p || !p.cumplido(estado)) return null;
  darPremio(estado, premioPaso(datos, p));
  estado.guia.paso++;
  return p;
}
