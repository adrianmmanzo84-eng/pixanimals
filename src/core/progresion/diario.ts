import type { EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { diaLocal } from '../items/items';

/**
 * Premio por entrar cada día. La racha sube si cobraste ayer y vuelve a 1 si te saltaste un día.
 * El último día del ciclo (el 7) regala además un sobre, que queda guardado para abrir gratis.
 */
export interface PremioDiario {
  /** Día dentro del ciclo (1 a `ciclo`). */
  dia: number;
  racha: number;
  monedas: number;
  sobre: string | null;
}

export function diarioDisponible(estado: EstadoJuego, ahora: number): boolean {
  return estado.diario.ultimoDia !== diaLocal(ahora);
}

/** Lo que darías al cobrar hoy, sin cobrarlo. */
export function premioDeHoy(datos: Datos, estado: EstadoJuego, ahora: number): PremioDiario {
  const hoy = diaLocal(ahora);
  const racha = estado.diario.ultimoDia === hoy - 1 ? estado.diario.racha + 1 : estado.diario.ultimoDia === hoy ? estado.diario.racha : 1;
  const d = datos.economia.diario;
  const dia = ((racha - 1) % d.ciclo) + 1;
  return { dia, racha, monedas: d.monedas, sobre: dia === d.ciclo ? d.sobreUltimoDia : null };
}

/** Cobra el premio de hoy. Devuelve null si ya se cobró. */
export function cobrarDiario(datos: Datos, estado: EstadoJuego, ahora: number): PremioDiario | null {
  if (!diarioDisponible(estado, ahora)) return null;
  const p = premioDeHoy(datos, estado, ahora);
  estado.diario = { ultimoDia: diaLocal(ahora), racha: p.racha };
  estado.monedas += p.monedas;
  if (p.sobre) estado.sobresRegalo[p.sobre] = (estado.sobresRegalo[p.sobre] ?? 0) + 1;
  return p;
}
