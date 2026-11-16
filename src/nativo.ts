import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import type { Respaldo } from './core/estado/respaldo';

/**
 * App de Android (D245). En el navegador nada de esto corre.
 * - Botón Atrás del teléfono: cierra el panel de ajustes, o funciona como B; en la pantalla de título, minimiza.
 * - Tercera copia de la partida en el almacén de la app (Android la incluye en su copia de seguridad de Google).
 */
export const esNativo = Capacitor.isNativePlatform();

const CLAVE = 'partida';

export function iniciarNativo(pantallaActual: () => string[], pulsarB: () => void): void {
  if (!esNativo) return;
  document.body.classList.add('nativo');
  void App.addListener('backButton', () => {
    if (document.body.classList.contains('ajustes-abiertos')) {
      document.body.classList.remove('ajustes-abiertos');
      return;
    }
    if (pantallaActual().includes('Titulo')) {
      void App.minimizeApp();
      return;
    }
    pulsarB();
  });
}

/** Copia de la partida en el almacén de la app (no lanza nunca). */
export function guardarNativo(texto: string, ahora = Date.now()): void {
  if (!esNativo) return;
  void Preferences.set({ key: CLAVE, value: JSON.stringify({ texto, en: ahora }) }).catch(() => undefined);
}

/** La copia del almacén de la app, como un respaldo más para la recuperación al abrir. */
export async function leerNativo(): Promise<Respaldo | null> {
  if (!esNativo) return null;
  try {
    const { value } = await Preferences.get({ key: CLAVE });
    if (!value) return null;
    const r = JSON.parse(value) as { texto: string; en: number };
    return { clave: 'nativo', texto: r.texto, en: r.en };
  } catch {
    return null;
  }
}

export function borrarNativo(): void {
  if (esNativo) void Preferences.remove({ key: CLAVE }).catch(() => undefined);
}
