/**
 * Cuándo se hizo la última copia fuera del juego (código copiado o archivo descargado) y cuándo se avisó
 * por última vez. Son datos del dispositivo, no de la partida: viven aparte en localStorage.
 */
const COPIA = 'pixanimals.ultimaCopia';
const AVISO = 'pixanimals.ultimoAvisoCopia';

const leer = (clave: string): number => {
  try {
    return Number(localStorage.getItem(clave) ?? 0) || 0;
  } catch {
    return 0;
  }
};
const escribir = (clave: string, v: number): void => {
  try {
    localStorage.setItem(clave, String(v));
  } catch {
    /* sin almacenamiento */
  }
};

export const ultimaCopia = (): number => leer(COPIA);
export const ultimoAviso = (): number => leer(AVISO);
export const marcarCopia = (ahora = Date.now()): void => escribir(COPIA, ahora);
export const marcarAviso = (ahora = Date.now()): void => escribir(AVISO, ahora);
