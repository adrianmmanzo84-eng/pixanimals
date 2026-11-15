import es from './es.json';
import en from './en.json';

/**
 * Todos los textos del juego salen de un archivo por idioma. Agregar un idioma = agregar otro JSON
 * (y su `datos-xx.json` para los nombres y descripciones de los datos).
 * El idioma se elige así: el guardado en este dispositivo, si no el del navegador (español si empieza con «es»,
 * si no inglés). En pruebas (sin navegador), español.
 */
export type Idioma = 'es' | 'en';
const IDIOMAS: Record<Idioma, Record<string, string>> = { es, en };
const CLAVE = 'pixanimals.idioma';

function detectar(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'es' || guardado === 'en') return guardado;
  } catch {
    /* sin almacenamiento */
  }
  if (typeof navigator === 'undefined' || !navigator.language) return 'es';
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

let idActual: Idioma = typeof window === 'undefined' ? 'es' : detectar();
let actual = IDIOMAS[idActual];

export function idioma(): Idioma {
  return idActual;
}

export function ponerIdioma(id: string): void {
  idActual = id === 'en' ? 'en' : 'es';
  actual = IDIOMAS[idActual];
}

/** Cambia el idioma y lo recuerda en este dispositivo (la página se recarga para redibujar todo). */
export function guardarIdioma(id: Idioma): void {
  try {
    localStorage.setItem(CLAVE, id);
  } catch {
    /* sin almacenamiento: vale solo por esta sesión */
  }
  ponerIdioma(id);
}

export function t(clave: string, vars: Record<string, string | number> = {}): string {
  const base = actual[clave] ?? IDIOMAS.es[clave] ?? clave;
  return base.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
