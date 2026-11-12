import es from './es.json';

/** Todos los textos del juego salen de un archivo por idioma. Agregar un idioma = agregar otro JSON. */
const IDIOMAS: Record<string, Record<string, string>> = { es };
let actual = IDIOMAS.es!;

export function ponerIdioma(id: string): void {
  actual = IDIOMAS[id] ?? IDIOMAS.es!;
}

export function t(clave: string, vars: Record<string, string | number> = {}): string {
  const base = actual[clave] ?? IDIOMAS.es![clave] ?? clave;
  return base.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
