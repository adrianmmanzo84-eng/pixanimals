import { App } from '@capacitor/app';
import { serializar } from '../core/estado/guardado';
import { acreditar, productoDe, vetoDeCompra } from '../core/compras/compras';
import { juego } from '../juego';
import { esNativo, guardarNativoYa } from '../nativo';
import { pasarela, type CompraPlay } from './pasarela';

/**
 * Flujo de una compra (D277): puerta para adultos (la pide la pantalla) → ventana de pago → acreditar y guardar →
 * cerrar la compra en Google Play. Se acredita antes de cerrar: si la app se corta en medio, la compra sigue
 * abierta en Google Play y se entrega (una sola vez) la próxima vez que se abre el juego.
 */
export type ResultadoCompra = 'ok' | 'cancelada' | 'pendiente' | 'error' | 'limite' | 'yaTienes' | 'noDisponible';

let ocupado = false;

/** Guarda la partida de inmediato y espera a que quede en el almacén de la app. */
async function guardarYa(): Promise<void> {
  juego.guardar();
  await guardarNativoYa(serializar(juego.estado));
}

/** Acredita una compra y la cierra en Google Play: 'ok' si se entregó ahora, 'repetida' si ya estaba entregada. */
export async function entregar(compra: CompraPlay): Promise<'ok' | 'repetida' | 'error'> {
  const p = productoDe(compra.id);
  if (!p) return 'error';
  const r = acreditar(juego.estado, compra.id, compra.recibo, Date.now());
  if (r === 'desconocido') return 'error';
  await guardarYa();
  await (await pasarela()).cerrar(compra, !p.unico);
  return r;
}

/** Compras cobradas que quedaron sin entregar. Devuelve los ids de lo que se entregó ahora. */
export async function recuperarPendientes(): Promise<string[]> {
  const entregadas: string[] = [];
  for (const c of await (await pasarela()).pendientes()) if ((await entregar(c)) === 'ok') entregadas.push(c.id);
  return entregadas;
}

/** Hace la compra (la puerta para adultos ya se pasó). */
export async function comprarProducto(id: string): Promise<ResultadoCompra> {
  const pas = await pasarela();
  if (pas.modo === 'ninguna') return 'noDisponible';
  const veto = vetoDeCompra(juego.estado, id, Date.now());
  if (veto === 'limite' || veto === 'yaTienes') return veto;
  if (veto) return 'error';
  if (ocupado) return 'error';
  ocupado = true;
  try {
    const r = await pas.comprar(id);
    if (r.estado === 'ok' && r.compra) return (await entregar(r.compra)) === 'error' ? 'error' : 'ok';
    if (r.estado === 'poseido') {
      // Una compra anterior quedó sin cerrar: se entrega ahora.
      return (await recuperarPendientes()).length ? 'ok' : 'error';
    }
    return r.estado === 'cancelada' ? 'cancelada' : r.estado === 'pendiente' ? 'pendiente' : 'error';
  } finally {
    ocupado = false;
  }
}

/** Al abrir la app y cada vez que vuelve al primer plano, entrega lo que haya quedado pendiente. */
export function iniciarCompras(alEntregar: (ids: string[]) => void): void {
  if (!esNativo) return;
  const revisar = () => {
    // Mientras se paga, la propia compra se entrega al terminar: no se revisa en paralelo.
    if (ocupado) return;
    void recuperarPendientes().then((ids) => ids.length && alEntregar(ids));
  };
  revisar();
  void App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) revisar();
  });
}
