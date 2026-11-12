import type { EstadoJuego, Item } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { Rng } from '../rng';
import { criaturaDe } from '../estado/juego';
import { darXp } from '../progresion/experiencia';

/** Bolsa, tienda y uso de ítems fuera del combate. Todo es lógica pura sobre el estado. */

const MS_DIA = 86_400_000;

/** Número de día local (cambia a medianoche en la zona horaria del jugador). */
export function diaLocal(ahora: number, offsetMinutos = new Date(ahora).getTimezoneOffset()): number {
  return Math.floor((ahora - offsetMinutos * 60_000) / MS_DIA);
}

export function cantidad(estado: EstadoJuego, id: string): number {
  return estado.inventario[id] ?? 0;
}

export function agregar(estado: EstadoJuego, id: string, n = 1): void {
  estado.inventario[id] = cantidad(estado, id) + n;
}

/** Quita n unidades; devuelve false (sin tocar nada) si no alcanzan. */
export function quitar(estado: EstadoJuego, id: string, n = 1): boolean {
  if (cantidad(estado, id) < n) return false;
  estado.inventario[id] = cantidad(estado, id) - n;
  if (estado.inventario[id] === 0) delete estado.inventario[id];
  return true;
}

/** Ítems que se venden. Las piedras solo aparecen si alguna criatura las usa. */
export function catalogo(datos: Datos): Item[] {
  const piedrasUsadas = new Set([...datos.criaturas.values()].flatMap((c) => c.evoluciona.flatMap((e) => (e.item ? [e.item] : []))));
  return [...datos.items.values()].filter((i) => i.precio && (i.uso !== 'evolucion' || piedrasUsadas.has(i.id)));
}

/** Ofertas del día: siempre las mismas para un mismo día, distintas al siguiente. */
export function ofertasDelDia(datos: Datos, dia: number): string[] {
  const rng = new Rng((dia * 2654435761) >>> 0);
  const bolsa = catalogo(datos).map((i) => i.id);
  const res: string[] = [];
  while (res.length < datos.reglasItems.ofertas.cantidad && bolsa.length) res.push(bolsa.splice(rng.entero(0, bolsa.length - 1), 1)[0]!);
  return res;
}

export interface Precio {
  moneda: 'monedas' | 'esencia';
  valor: number;
  /** Precio sin descuento (igual a valor si no está en oferta). */
  normal: number;
  oferta: boolean;
}

export function precioDe(datos: Datos, item: Item, dia: number): Precio | null {
  if (!item.precio) return null;
  const moneda = item.precio.monedas ? 'monedas' : 'esencia';
  const normal = item.precio.monedas ?? item.precio.esencia!;
  const oferta = ofertasDelDia(datos, dia).includes(item.id);
  const valor = oferta ? Math.max(1, Math.round((normal * (100 - datos.reglasItems.ofertas.descuento)) / 100)) : normal;
  return { moneda, valor, normal, oferta };
}

export type MotivoCompra = 'inexistente' | 'no_se_vende' | 'monedas' | 'esencia';

export function comprar(datos: Datos, estado: EstadoJuego, id: string, ahora: number): true | MotivoCompra {
  const item = datos.items.get(id);
  if (!item) return 'inexistente';
  if (!catalogo(datos).includes(item)) return 'no_se_vende';
  const p = precioDe(datos, item, diaLocal(ahora))!;
  if (estado[p.moneda] < p.valor) return p.moneda;
  estado[p.moneda] -= p.valor;
  agregar(estado, id);
  return true;
}

export type ResultadoUso =
  | { ok: true; tipo: 'xp'; niveles: number }
  | { ok: true; tipo: 'vitamina' }
  | { ok: true; tipo: 'incienso'; hasta: number }
  | { ok: false; motivo: 'sin_items' | 'inexistente' | 'no_se_usa_aqui' | 'sin_criatura' | 'nivel_max' | 'tope_stat' | 'tope_total' };

/** Dosis de vitaminas que le quedan a una criatura para un stat (respeta ambos límites). */
export function vitaminasLibres(datos: Datos, estado: EstadoJuego, especie: string, stat: string): number {
  const c = criaturaDe(estado, especie);
  if (!c) return 0;
  const v = c.vitaminas as Record<string, number>;
  const total = Object.values(v).reduce((a, b) => a + b, 0);
  const r = datos.reglasItems.vitaminas;
  return Math.max(0, Math.min(r.maxPorStat - (v[stat] ?? 0), r.maxTotal - total));
}

/** Usa un ítem fuera del combate. Los que van sobre una criatura necesitan `especie`. */
export function usarItem(datos: Datos, estado: EstadoJuego, id: string, ahora: number, especie?: string): ResultadoUso {
  const item = datos.items.get(id);
  if (!item) return { ok: false, motivo: 'inexistente' };
  if (item.uso !== 'fuera') return { ok: false, motivo: 'no_se_usa_aqui' };
  if (cantidad(estado, id) < 1) return { ok: false, motivo: 'sin_items' };
  const e = item.efecto;
  if (e.tipo === 'incienso') {
    quitar(estado, id);
    // Si ya había incienso, el tiempo se suma.
    estado.incienso = { hasta: Math.max(ahora, estado.incienso.hasta) + e.minutos * 60_000, mult: e.mult };
    return { ok: true, tipo: 'incienso', hasta: estado.incienso.hasta };
  }
  const c = especie ? criaturaDe(estado, especie) : undefined;
  if (!c) return { ok: false, motivo: 'sin_criatura' };
  if (e.tipo === 'xp') {
    if (c.nivel >= datos.balance.nivelMax) return { ok: false, motivo: 'nivel_max' };
    quitar(estado, id);
    return { ok: true, tipo: 'xp', niveles: darXp(datos, c, e.cantidad) };
  }
  if (e.tipo === 'vitamina') {
    const v = c.vitaminas[e.stat] ?? 0;
    if (v >= datos.reglasItems.vitaminas.maxPorStat) return { ok: false, motivo: 'tope_stat' };
    if (vitaminasLibres(datos, estado, c.especie, e.stat) <= 0) return { ok: false, motivo: 'tope_total' };
    quitar(estado, id);
    c.vitaminas[e.stat] = v + 1;
    return { ok: true, tipo: 'vitamina' };
  }
  return { ok: false, motivo: 'no_se_usa_aqui' };
}
