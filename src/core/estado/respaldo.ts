import type { EstadoJuego } from '../../esquemas/esquemas';
import { deserializar } from './guardado';
import { diaLocal } from '../items/items';

/**
 * Respaldo de la partida: además del guardado principal (localStorage), cada guardado se copia a un
 * segundo almacén (IndexedDB) como «actual» y una vez por día como «dia-N» (se conservan los últimos días).
 * Si al abrir el juego el principal falta o está dañado, se recupera la copia válida más reciente.
 * Aquí está solo la lógica; el acceso a IndexedDB vive en src/respaldoIdb.ts.
 */
export interface Respaldo {
  clave: string;
  texto: string;
  /** Cuándo se escribió (ms). */
  en: number;
}

/** Copias diarias que se conservan. */
export const DIAS_CONSERVADOS = 3;
/** Cada cuántos días se recuerda descargar una copia en archivo. */
export const DIAS_RECORDATORIO = 7;
const MS_DIA = 86_400_000;

/** Si el guardado principal sirve, no hace falta recuperar (null). Si no, la copia válida más reciente. */
export function elegirRecuperacion(principal: string | null, respaldos: Respaldo[]): { estado: EstadoJuego; desde: Respaldo } | null {
  if (deserializar(principal)) return null;
  for (const r of [...respaldos].sort((a, b) => b.en - a.en)) {
    const estado = deserializar(r.texto);
    if (estado) return { estado, desde: r };
  }
  return null;
}

export const claveDia = (ahora: number): string => `dia-${diaLocal(ahora)}`;

/** Claves de copias diarias que sobran (se conservan las `DIAS_CONSERVADOS` más nuevas). */
export function clavesSobrantes(claves: string[]): string[] {
  const dias = claves
    .filter((c) => c.startsWith('dia-'))
    .map((c) => Number(c.slice(4)))
    .filter((d) => Number.isFinite(d))
    .sort((a, b) => b - a);
  return dias.slice(DIAS_CONSERVADOS).map((d) => `dia-${d}`);
}

/** ¿Recordar descargar una copia? Solo con algo que perder, si pasaron 7 días desde la última y no se avisó hoy. */
export function debeRecordarCopia(estado: EstadoJuego, ultimaCopia: number, ultimoAviso: number, ahora: number): boolean {
  if (estado.registro.length < 5) return false;
  if (ahora - ultimaCopia < DIAS_RECORDATORIO * MS_DIA) return false;
  return diaLocal(ultimoAviso) !== diaLocal(ahora);
}

/** Nombre del archivo de copia: pixanimals-partida-2026-11-14.txt */
export function nombreArchivo(ahora: number): string {
  const d = new Date(ahora);
  const dd = (n: number) => String(n).padStart(2, '0');
  return `pixanimals-partida-${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}.txt`;
}
