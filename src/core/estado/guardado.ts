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

/**
 * Lleva una partida guardada con una versión anterior a la actual, sin perder nada.
 * v1 → v2 (Fase 3): Bolsa, incienso, vitaminas y barra de Entrenamiento.
 * v2 → v3 (Fase 4): premio diario, minijuegos, misiones y sobres regalados.
 * v3 → v4 (Fase 5): Torre de Desafíos, Entrenador del día y amuletos.
 */
export function migrar(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const o = obj as Record<string, unknown>;
  if (o.version === 1) {
    o.version = 2;
    o.inventario = {};
    o.incienso = { hasta: 0, mult: 1 };
    if (Array.isArray(o.criaturas)) for (const c of o.criaturas as Record<string, unknown>[]) Object.assign(c, { vitaminas: {}, entrenamiento: 0 });
  }
  if (o.version === 2) {
    o.version = 3;
    o.diario = { ultimoDia: -1, racha: 0 };
    o.minijuegos = { dia: -1, partidas: {}, records: {} };
    o.misiones = { dia: -1, lista: [] };
    o.sobresRegalo = {};
  }
  if (o.version === 3) {
    o.version = 4;
    o.torre = { piso: 1, mejor: 0 };
    o.entrenador = { diaCobrado: -1 };
    if (Array.isArray(o.criaturas)) for (const c of o.criaturas as Record<string, unknown>[]) c.amuleto = null;
  }
  return o;
}

/** Devuelve la partida si el texto es válido; si no, null (nunca lanza). */
export function deserializar(texto: string | null): EstadoJuego | null {
  if (!texto) return null;
  try {
    const r = EstadoJuegoZ.safeParse(migrar(JSON.parse(texto)));
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
