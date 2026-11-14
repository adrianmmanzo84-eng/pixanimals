/**
 * Compartir un texto: en el teléfono abre el menú de compartir del sistema (WhatsApp, etc.);
 * en la computadora, o si eso falla, lo copia al portapapeles.
 */
export type ResultadoCompartir = 'compartido' | 'copiado' | 'error';

export async function compartirTexto(texto: string): Promise<ResultadoCompartir> {
  const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
  const tactil = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  if (tactil && typeof nav.share === 'function') {
    try {
      await nav.share({ text: texto });
      return 'compartido';
    } catch (e) {
      // Cerrar el menú sin elegir no es un error.
      if ((e as Error)?.name === 'AbortError') return 'compartido';
    }
  }
  try {
    await navigator.clipboard.writeText(texto);
    return 'copiado';
  } catch {
    return 'error';
  }
}

/** Dirección pública del juego (la página actual, sin parámetros). */
export function urlJuego(): string {
  return location.origin + location.pathname;
}
