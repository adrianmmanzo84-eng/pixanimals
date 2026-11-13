import type { EstadoJuego, PremioRuleta } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { diaLocal } from '../items/items';
import type { Rng } from '../rng';
import { darPremio } from './premios';

/**
 * Ruleta diaria: un giro gratis por día (se renueva a medianoche, hora local).
 * Cada casilla da monedas, Esencia, un sobre de regalo y/o un ítem; nunca criaturas.
 * La casilla sale por peso: las de premio grande son más difíciles.
 */
export function ruletaDisponible(estado: EstadoJuego, ahora: number): boolean {
  return estado.ruleta.ultimoDia !== diaLocal(ahora);
}

/** Probabilidad (0–100) de cada casilla, en el orden de la ruleta. */
export function probabilidades(datos: Datos): number[] {
  const segs = datos.economia.ruleta.segmentos;
  const total = segs.reduce((t, s) => t + s.peso, 0);
  return segs.map((s) => (s.peso * 100) / total);
}

/** Entrega el premio de una casilla. */
export function darPremioRuleta(estado: EstadoJuego, p: PremioRuleta): void {
  darPremio(estado, p);
  if (p.item) estado.inventario[p.item] = (estado.inventario[p.item] ?? 0) + p.cantidad;
}

/** Gira: elige la casilla por peso, entrega el premio y marca el día. Devuelve el índice, o null si ya se giró hoy. */
export function girarRuleta(datos: Datos, estado: EstadoJuego, rng: Rng, ahora: number): number | null {
  if (!ruletaDisponible(estado, ahora)) return null;
  const segs = datos.economia.ruleta.segmentos;
  let tiro = rng.sig() * segs.reduce((t, s) => t + s.peso, 0);
  let i = 0;
  while (i < segs.length - 1 && tiro >= segs[i]!.peso) tiro -= segs[i++]!.peso;
  darPremioRuleta(estado, segs[i]!.premio);
  estado.ruleta.ultimoDia = diaLocal(ahora);
  return i;
}

/** Milisegundos hasta el próximo giro (medianoche local). */
export function faltaRuleta(ahora: number): number {
  const d = new Date(ahora);
  const manana = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  return Math.max(0, manana - ahora);
}
