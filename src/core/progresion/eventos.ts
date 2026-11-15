import type { EstadoJuego, EventoDef } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { diaLocal } from '../items/items';
import { darPremio } from './premios';

/**
 * Eventos de calendario: cada día puede haber uno, igual para todos y sin servidor (sale de la fecha local).
 * Las fechas especiales («12-25») ganan a los de día de la semana (0 = domingo … 6 = sábado).
 * Sus efectos son multiplicadores que leen combate, minijuegos, expediciones y sobres;
 * algunos traen además un sobre de regalo, que se cobra una vez por año desde el menú.
 * Todo se define en `economia.json` → `eventos`.
 */
const MS_DIA = 86_400_000;

function fechaLocal(ahora: number): Date {
  // El día local como fecha UTC: así getUTC* dan el día, mes y día de la semana del jugador.
  return new Date(diaLocal(ahora) * MS_DIA);
}

export function eventoDeHoy(datos: Datos, ahora: number): EventoDef | null {
  const f = fechaLocal(ahora);
  const mmdd = `${String(f.getUTCMonth() + 1).padStart(2, '0')}-${String(f.getUTCDate()).padStart(2, '0')}`;
  const lista = datos.economia.eventos;
  return lista.find((e) => e.fechas?.includes(mmdd)) ?? lista.find((e) => e.dias?.includes(f.getUTCDay())) ?? null;
}

type Efecto = keyof EventoDef['efectos'];

/** Multiplicador de hoy para un efecto (1 si no hay evento o no lo toca). */
export function multEvento(datos: Datos, efecto: Efecto, ahora: number): number {
  return eventoDeHoy(datos, ahora)?.efectos[efecto] ?? 1;
}

/** Probabilidad (en %) de que una criatura salga brillante hoy. */
export function probBrillante(datos: Datos, ahora: number): number {
  return (100 / datos.sobres.brillanteUnoEn) * multEvento(datos, 'brillante', ahora);
}

const claveRegalo = (e: EventoDef, ahora: number) => `${e.id}-${fechaLocal(ahora).getUTCFullYear()}`;

/** Sobre de regalo del evento de hoy, si tiene y todavía no se cobró este año. */
export function regaloPendiente(datos: Datos, estado: EstadoJuego, ahora: number): { evento: EventoDef; sobre: string } | null {
  const e = eventoDeHoy(datos, ahora);
  if (!e?.regalo || estado.eventos.regalos.includes(claveRegalo(e, ahora))) return null;
  return { evento: e, sobre: e.regalo };
}

export function cobrarRegalo(datos: Datos, estado: EstadoJuego, ahora: number): string | null {
  const r = regaloPendiente(datos, estado, ahora);
  if (!r) return null;
  estado.eventos.regalos.push(claveRegalo(r.evento, ahora));
  darPremio(estado, { monedas: 0, esencia: 0, sobre: r.sobre });
  return r.sobre;
}
