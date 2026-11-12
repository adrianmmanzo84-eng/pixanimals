import type { EstadoJuego, EventoMision, Mision } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { diaLocal } from '../items/items';
import { Rng } from '../rng';

/**
 * Misiones diarias: cada día salen `porDia` misiones de la lista, sin repetir el tipo de evento.
 * Avanzan con `registrar` (llamado desde combate, sobres, minijuegos…) y se cobran una sola vez.
 */

export interface MisionDeHoy {
  def: Mision;
  progreso: number;
  cobrada: boolean;
  completa: boolean;
}

/** Las misiones de hoy; si cambió el día, sortea las nuevas (siempre las mismas para un mismo día). */
export function misionesDeHoy(datos: Datos, estado: EstadoJuego, ahora: number): MisionDeHoy[] {
  const hoy = diaLocal(ahora);
  if (estado.misiones.dia !== hoy) {
    const rng = new Rng(hoy * 7919 + 13);
    const bolsa = [...datos.economia.misiones.lista];
    const elegidas: Mision[] = [];
    while (elegidas.length < datos.economia.misiones.porDia && bolsa.length) {
      const m = bolsa.splice(Math.floor(rng.sig() * bolsa.length), 1)[0]!;
      // Sin dos misiones del mismo evento, mientras queden otras.
      if (elegidas.some((e) => e.evento === m.evento) && bolsa.some((b) => !elegidas.some((e) => e.evento === b.evento))) continue;
      elegidas.push(m);
    }
    estado.misiones = { dia: hoy, lista: elegidas.map((m) => ({ id: m.id, progreso: 0, cobrada: false })) };
  }
  return estado.misiones.lista.flatMap((m) => {
    const def = datos.economia.misiones.lista.find((d) => d.id === m.id);
    return def ? [{ def, progreso: Math.min(m.progreso, def.meta), cobrada: m.cobrada, completa: m.progreso >= def.meta }] : [];
  });
}

/** Suma progreso a las misiones de hoy que escuchan ese evento. Devuelve las que se acaban de completar. */
export function registrar(datos: Datos, estado: EstadoJuego, evento: EventoMision, cantidad = 1, ahora = Date.now()): Mision[] {
  const nuevas: Mision[] = [];
  for (const m of misionesDeHoy(datos, estado, ahora)) {
    if (m.def.evento !== evento || m.completa) continue;
    const guardada = estado.misiones.lista.find((x) => x.id === m.def.id)!;
    guardada.progreso = Math.min(m.def.meta, guardada.progreso + cantidad);
    if (guardada.progreso >= m.def.meta) nuevas.push(m.def);
  }
  return nuevas;
}

/** Cobra una misión completa. Devuelve el premio, o null si no se puede. */
export function cobrarMision(datos: Datos, estado: EstadoJuego, id: string, ahora = Date.now()): Mision['premio'] | null {
  const m = misionesDeHoy(datos, estado, ahora).find((x) => x.def.id === id);
  if (!m || !m.completa || m.cobrada) return null;
  estado.misiones.lista.find((x) => x.id === id)!.cobrada = true;
  if (m.def.premio.tipo === 'monedas') estado.monedas += m.def.premio.cantidad;
  else estado.esencia += m.def.premio.cantidad;
  return m.def.premio;
}

/** Cuántas misiones están completas y sin cobrar (para el aviso del menú). */
export function misionesPorCobrar(datos: Datos, estado: EstadoJuego, ahora = Date.now()): number {
  return misionesDeHoy(datos, estado, ahora).filter((m) => m.completa && !m.cobrada).length;
}
