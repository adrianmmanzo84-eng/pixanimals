import { EstadoJuegoZ, type EstadoJuego } from '../../esquemas/esquemas';

/**
 * Capa de guardado. Hoy guarda en el navegador; para cuentas en línea (Supabase, Firebase…)
 * basta con escribir otra clase que cumpla `Almacen`.
 */
export interface Almacen {
  leer(): string | null;
  escribir(datos: string): void;
  borrar(): void;
}

const CLAVE = 'pixanimals.partida';

/** Guarda en localStorage. Si el navegador lo impide, sigue funcionando en memoria. */
export class AlmacenLocal implements Almacen {
  private memoria: string | null = null;
  leer(): string | null {
    try {
      return localStorage.getItem(CLAVE) ?? this.memoria;
    } catch {
      return this.memoria;
    }
  }
  escribir(datos: string): void {
    this.memoria = datos;
    try {
      localStorage.setItem(CLAVE, datos);
    } catch {
      /* sin almacenamiento persistente */
    }
  }
  borrar(): void {
    this.memoria = null;
    try {
      localStorage.removeItem(CLAVE);
    } catch {
      /* nada */
    }
  }
}

export function serializar(estado: EstadoJuego): string {
  return JSON.stringify(estado);
}

/** Devuelve la partida si el texto es válido; si no, null (nunca lanza). */
export function deserializar(texto: string | null): EstadoJuego | null {
  if (!texto) return null;
  try {
    const r = EstadoJuegoZ.safeParse(JSON.parse(texto));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

const PREFIJO = 'PIX1-';

/** Código de guardado para copiar y pegar en otro dispositivo. */
export function exportarCodigo(estado: EstadoJuego): string {
  const bytes = new TextEncoder().encode(serializar(estado));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return PREFIJO + btoa(bin);
}

export function importarCodigo(codigo: string): EstadoJuego | null {
  const limpio = codigo.trim();
  if (!limpio.startsWith(PREFIJO)) return null;
  try {
    const bin = atob(limpio.slice(PREFIJO.length));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return deserializar(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
