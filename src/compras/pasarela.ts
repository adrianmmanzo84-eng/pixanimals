import { registerPlugin } from '@capacitor/core';
import { esNativo } from '../nativo';
import { juego } from '../juego';
import { modoDePago, PRODUCTOS } from '../core/compras/compras';

/**
 * Pasarela de pago (D277). En la app de Android cobra Google Play (plugin PixBilling). En una versión de prueba
 * (APK de depuración, modo desarrollo o `?prueba`) la compra es simulada y se avisa. En la web no se vende nada.
 */
export interface CompraPlay {
  id: string;
  /** Identificador de esa compra (número de pedido): sirve para no acreditarla dos veces. */
  recibo: string;
  token: string;
}

export type EstadoPago = 'ok' | 'cancelada' | 'pendiente' | 'poseido' | 'error';

export interface Pasarela {
  /** play: cobra Google Play. simulada: compra de prueba. ninguna: no se puede comprar aquí (web). */
  modo: 'play' | 'simulada' | 'ninguna';
  precios(): Promise<Record<string, string>>;
  comprar(id: string): Promise<{ estado: EstadoPago; compra?: CompraPlay }>;
  pendientes(): Promise<CompraPlay[]>;
  cerrar(compra: CompraPlay, consumible: boolean): Promise<void>;
}

interface PluginBilling {
  info(): Promise<{ depuracion: boolean }>;
  precios(o: { ids: string }): Promise<{ precios: Record<string, string> }>;
  comprar(o: { id: string }): Promise<{ estado: EstadoPago; compra?: CompraPlay }>;
  pendientes(): Promise<{ compras: CompraPlay[] }>;
  cerrar(o: { token: string; consumible: boolean }): Promise<{ cerrada: boolean }>;
}

const IDS = PRODUCTOS.map((p) => p.id).join(',');

function crearPlay(plugin: PluginBilling): Pasarela {
  return {
    modo: 'play',
    precios: () => plugin.precios({ ids: IDS }).then((r) => r.precios ?? {}, () => ({})),
    comprar: (id) => plugin.comprar({ id }).catch(() => ({ estado: 'error' as const })),
    pendientes: () => plugin.pendientes().then((r) => r.compras ?? [], () => []),
    cerrar: (c, consumible) => plugin.cerrar({ token: c.token, consumible }).then(() => undefined, () => undefined),
  };
}

/** Compra de prueba: no cobra nada. Se acredita al instante, con un recibo nuevo cada vez. */
function crearSimulada(): Pasarela {
  let n = 0;
  return {
    modo: 'simulada',
    precios: () => Promise.resolve({}),
    comprar: (id) => Promise.resolve({ estado: 'ok' as const, compra: { id, recibo: `SIM.${Date.now()}.${n++}`, token: 'sim' } }),
    pendientes: () => Promise.resolve([]),
    cerrar: () => Promise.resolve(),
  };
}

const ninguna: Pasarela = {
  modo: 'ninguna',
  precios: () => Promise.resolve({}),
  comprar: () => Promise.resolve({ estado: 'error' as const }),
  pendientes: () => Promise.resolve([]),
  cerrar: () => Promise.resolve(),
};

let elegida: Promise<Pasarela> | null = null;

/** La pasarela de esta instalación (se decide una sola vez). */
export function pasarela(): Promise<Pasarela> {
  elegida ??= (async () => {
    const plugin = esNativo ? registerPlugin<PluginBilling>('PixBilling') : null;
    let depuracion = false;
    try {
      depuracion = plugin ? (await plugin.info()).depuracion : false;
    } catch {
      return ninguna;
    }
    const modo = modoDePago({ nativo: esNativo, depuracion, desarrollo: import.meta.env.DEV, prueba: juego.prueba });
    return modo === 'play' ? crearPlay(plugin!) : modo === 'simulada' ? crearSimulada() : ninguna;
  })();
  return elegida;
}
