import { registroVacio, type RegistroCompras } from '../core/compras/compras';
import { guardarValorNativo, leerValorNativo } from '../nativo';

/**
 * Registro de compras del dispositivo (D279), común a las 3 ranuras: en localStorage y, en la app, también en el
 * almacén de la app. Al abrir se unen los dos (si uno se perdió, el otro alcanza).
 */
const CLAVE = 'pixanimals.compras';
const CLAVE_NATIVA = 'compras';

function parsear(texto: string | null): RegistroCompras {
  try {
    const o = JSON.parse(texto ?? 'null') as Partial<RegistroCompras> | null;
    if (!o || !Array.isArray(o.recibos)) return registroVacio();
    return { recibos: o.recibos.filter((x): x is string => typeof x === 'string'), bienvenida: typeof o.bienvenida === 'number' ? o.bienvenida : null };
  } catch {
    return registroVacio();
  }
}

function leerLocal(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

/** El registro en memoria (se carga al abrir y se guarda tras cada entrega). */
export const registro: RegistroCompras = parsear(leerLocal());

export async function cargarRegistro(): Promise<void> {
  const nativo = parsear(await leerValorNativo(CLAVE_NATIVA));
  registro.recibos = [...new Set([...registro.recibos, ...nativo.recibos])];
  registro.bienvenida ??= nativo.bienvenida;
}

export async function guardarRegistro(): Promise<void> {
  const texto = JSON.stringify(registro);
  try {
    localStorage.setItem(CLAVE, texto);
  } catch {
    /* sin almacenamiento */
  }
  await guardarValorNativo(CLAVE_NATIVA, texto);
}
