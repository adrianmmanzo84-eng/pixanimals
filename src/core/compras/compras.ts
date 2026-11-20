import type { EstadoJuego } from '../../esquemas/esquemas';
import { diaLocal } from '../items/items';
import type { Rng } from '../rng';

/**
 * Compras con dinero real (D246, D277). El cobro lo hace Google Play; aquí solo está lo que el juego decide:
 * qué se vende, cuántas compras se permiten por día, no acreditar dos veces el mismo recibo y el historial.
 * Las monedas y los cristales comprados se suman a los mismos totales que los ganados jugando.
 */

export interface Producto {
  /** Identificador del producto en Google Play Console (minúsculas, números y guiones bajos). */
  id: string;
  tipo: 'monedas' | 'cristales' | 'pack';
  monedas: number;
  cristales: number;
  /** Sobre de regalo (se abre gratis) que incluye. */
  sobre?: string;
  /** Precio de referencia en dólares, solo para mostrar si Google Play no responde. El cobro real usa el de Play. */
  usd: string;
  /** De compra única (no consumible). */
  unico: boolean;
}

export const PRODUCTOS: readonly Producto[] = [
  { id: 'monedas_1200', tipo: 'monedas', monedas: 1200, cristales: 0, usd: '0,99', unico: false },
  { id: 'monedas_6600', tipo: 'monedas', monedas: 6600, cristales: 0, usd: '4,99', unico: false },
  { id: 'monedas_14400', tipo: 'monedas', monedas: 14400, cristales: 0, usd: '9,99', unico: false },
  { id: 'cristales_300', tipo: 'cristales', monedas: 0, cristales: 300, usd: '0,99', unico: false },
  { id: 'cristales_1650', tipo: 'cristales', monedas: 0, cristales: 1650, usd: '4,99', unico: false },
  { id: 'cristales_3600', tipo: 'cristales', monedas: 0, cristales: 3600, usd: '9,99', unico: false },
  { id: 'bienvenida', tipo: 'pack', monedas: 3000, cristales: 500, sobre: 'legendario', usd: '2,99', unico: true },
];

/** Compras por día que se permiten (protección para menores y familias). */
export const MAX_POR_DIA = 5;
const MAX_RECIBOS = 60;
const MAX_HISTORIAL = 60;

export const productoDe = (id: string): Producto | undefined => PRODUCTOS.find((p) => p.id === id);

type Compras = NonNullable<EstadoJuego['compras']>;

/** Las compras de la partida (se crean vacías en las partidas que todavía no compraron). */
export function comprasDe(estado: EstadoJuego): Compras {
  estado.compras ??= { dia: -1, hoy: 0, bienvenida: false, recibos: [], historial: [] };
  return estado.compras;
}

/** Compras hechas hoy. */
export function comprasHoy(estado: EstadoJuego, ahora: number): number {
  const c = estado.compras;
  return c && c.dia === diaLocal(ahora) ? c.hoy : 0;
}

export type Veto = 'limite' | 'yaTienes' | 'desconocido';

/** ¿Se puede empezar esta compra ahora? null si sí. */
export function vetoDeCompra(estado: EstadoJuego, id: string, ahora: number): Veto | null {
  const p = productoDe(id);
  if (!p) return 'desconocido';
  if (p.unico && estado.compras?.bienvenida) return 'yaTienes';
  if (comprasHoy(estado, ahora) >= MAX_POR_DIA) return 'limite';
  return null;
}

/**
 * Acredita una compra ya cobrada por Google Play. `recibo` identifica esa compra: si ya se acreditó, no se repite
 * (Google Play puede avisar de la misma compra más de una vez, por ejemplo al reabrir la app).
 * No aplica el límite diario: lo que ya se cobró siempre se entrega.
 */
export function acreditar(estado: EstadoJuego, id: string, recibo: string, ahora: number): 'ok' | 'repetida' | 'desconocido' {
  const p = productoDe(id);
  if (!p) return 'desconocido';
  const c = comprasDe(estado);
  if (c.recibos.includes(recibo)) return 'repetida';
  // El pack único se entrega una sola vez; si Google lo vuelve a informar (se consulta cada vez), no se repite.
  if (p.unico && c.bienvenida) {
    c.recibos = [...c.recibos, recibo].slice(-MAX_RECIBOS);
    return 'repetida';
  }
  estado.monedas += p.monedas;
  estado.esencia += p.cristales;
  if (p.sobre) estado.sobresRegalo[p.sobre] = (estado.sobresRegalo[p.sobre] ?? 0) + 1;
  if (p.unico) c.bienvenida = true;
  const dia = diaLocal(ahora);
  if (c.dia !== dia) {
    c.dia = dia;
    c.hoy = 0;
  }
  c.hoy += 1;
  c.recibos = [...c.recibos, recibo].slice(-MAX_RECIBOS);
  c.historial = [...c.historial, { id, en: ahora }].slice(-MAX_HISTORIAL);
  return 'ok';
}

/** Pregunta de la puerta para adultos: una cuenta que un niño de 7 años no resuelve de memoria. */
export function desafioAdulto(rng: Rng): { texto: string; respuesta: number } {
  const a = rng.entero(14, 19);
  const b = rng.entero(7, 9);
  const c = rng.entero(11, 29);
  return { texto: `${a} × ${b} + ${c}`, respuesta: a * b + c };
}

/**
 * Cómo se paga según dónde corre el juego (D277):
 * - app de Android de tienda → Google Play; APK de depuración → compra simulada (se avisa en pantalla);
 * - navegador: compra simulada solo en desarrollo o con `?prueba`; en la web publicada no se vende nada.
 */
export function modoDePago(a: { nativo: boolean; depuracion: boolean; desarrollo: boolean; prueba: boolean }): 'play' | 'simulada' | 'ninguna' {
  if (a.nativo) return a.depuracion ? 'simulada' : 'play';
  return a.desarrollo || a.prueba ? 'simulada' : 'ninguna';
}
