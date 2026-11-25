import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { claveNativa, type Ranura } from './core/estado/ranuras';
import type { Respaldo } from './core/estado/respaldo';
import { sonido } from './audio/sfx';

/**
 * App de Android (D245). En el navegador nada de esto corre.
 * - Botón Atrás del teléfono: cierra el panel de ajustes, o funciona como B; en la pantalla de título, minimiza.
 * - Tercera copia de la partida en el almacén de la app (Android la incluye en su copia de seguridad de Google).
 */
export const esNativo = Capacitor.isNativePlatform();


/**
 * Paneles HTML sobre el juego y el botón que los cierra (D278). Con uno abierto, Atrás lo cierra como ese botón
 * (en la puerta para adultos, Cancelar) en vez de actuar sobre la pantalla de detrás.
 */
const PANELES: [string, string][] = [
  ['dialogo-adulto', 'adulto-cancelar'],
  ['dialogo-apodo', 'apodo-cancelar'],
  ['guardado', 'g-cerrar'],
  ['ayuda-instalar', 'ios-ok'],
];

export function cerrarPanelAbierto(): boolean {
  for (const [panel, boton] of PANELES) {
    if (document.getElementById(panel)?.classList.contains('abierto')) {
      document.getElementById(boton)?.click();
      return true;
    }
  }
  return false;
}

export function iniciarNativo(pantallaActual: () => string[], pulsarB: () => void): void {
  if (!esNativo) return;
  document.body.classList.add('nativo');
  // Al minimizar la app o apagar la pantalla, el audio se suspende; al volver, sigue.
  void App.addListener('appStateChange', ({ isActive }) => sonido.enPrimerPlano(isActive));
  void App.addListener('backButton', () => {
    if (document.body.classList.contains('ajustes-abiertos')) {
      document.body.classList.remove('ajustes-abiertos');
      return;
    }
    if (cerrarPanelAbierto()) return;
    if (pantallaActual().includes('Titulo')) {
      void App.minimizeApp();
      return;
    }
    pulsarB();
  });
}

/** Copia de la partida en el almacén de la app (no lanza nunca). */
export function guardarNativo(texto: string, ahora = Date.now(), ranura: Ranura = 1): void {
  void guardarNativoYa(texto, ahora, ranura);
}

/** Igual, pero se puede esperar a que quede escrito (las compras lo necesitan antes de cerrarse en Google Play). */
export async function guardarNativoYa(texto: string, ahora = Date.now(), ranura: Ranura = 1): Promise<void> {
  if (!esNativo) return;
  await Preferences.set({ key: claveNativa(ranura), value: JSON.stringify({ texto, en: ahora }) }).catch(() => undefined);
}

/** La copia del almacén de la app, como un respaldo más para la recuperación al abrir. */
export async function leerNativo(ranura: Ranura = 1): Promise<Respaldo | null> {
  if (!esNativo) return null;
  try {
    const { value } = await Preferences.get({ key: claveNativa(ranura) });
    if (!value) return null;
    const r = JSON.parse(value) as { texto: string; en: number };
    return { clave: 'nativo', texto: r.texto, en: r.en };
  } catch {
    return null;
  }
}

export function borrarNativo(ranura: Ranura = 1): void {
  if (esNativo) void Preferences.remove({ key: claveNativa(ranura) }).catch(() => undefined);
}

/** Valor chico en el almacén de la app (registro de compras del dispositivo, D279). */
export async function leerValorNativo(clave: string): Promise<string | null> {
  if (!esNativo) return null;
  try {
    return (await Preferences.get({ key: clave })).value;
  } catch {
    return null;
  }
}
export async function guardarValorNativo(clave: string, valor: string): Promise<void> {
  if (esNativo) await Preferences.set({ key: clave, value: valor }).catch(() => undefined);
}
