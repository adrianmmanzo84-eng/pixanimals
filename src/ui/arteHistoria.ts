import Phaser from 'phaser';
import { DATOS } from '../core/datos';

/**
 * Arte del Modo Historia (D264): mapa del mundo, fondos de las regiones nuevas, Píxeles Maestros, el Prisma
 * y la escena final. Se carga al entrar a la historia (no en el arranque).
 */
export const FONDOS_HISTORIA = ['desierto', 'cumbre_helada', 'ruinas', 'origen_eclipse'];

export function claveFondo(id: string): string {
  return `fondoimg_${id}`;
}

export function clavePixel(region: string): string {
  return `pixel_maestro_${region}`;
}

/** Pide lo que falte; devuelve true si hubo que cargar algo (la escena espera a su `load`). */
export function cargarArteHistoria(escena: Phaser.Scene): void {
  const pedir = (clave: string, ruta: string) => {
    if (!escena.textures.exists(clave)) escena.load.image(clave, ruta);
  };
  pedir('historia_mapa', 'historia/mapa.jpg');
  pedir('historia_final', 'historia/final.jpg');
  pedir('historia_prisma', 'historia/prisma_restaurador.png');
  for (const f of FONDOS_HISTORIA) pedir(claveFondo(f), `fondos/${f}.jpg`);
  for (const r of DATOS.historia.regiones) pedir(clavePixel(r.id), `historia/pixel_maestro_${r.id}.png`);
}

/** Suavizado para el arte grande (se ve reducido). */
export function suavizarArteHistoria(escena: Phaser.Scene): void {
  const claves = ['historia_mapa', 'historia_final', 'historia_prisma', ...FONDOS_HISTORIA.map(claveFondo), ...DATOS.historia.regiones.map((r) => clavePixel(r.id))];
  for (const c of claves) if (escena.textures.exists(c)) escena.textures.get(c).setFilter(Phaser.Textures.FilterMode.LINEAR);
}

/**
 * Versión gris de una textura: así se ve una región que el Eclipse apagó (D260). Se calcula una vez por fondo.
 * Los Pixanimals no se tocan: conservan su color sobre el paisaje gris.
 */
export function texturaGris(escena: Phaser.Scene, clave: string): string {
  const gris = `${clave}_gris`;
  if (escena.textures.exists(gris) || !escena.textures.exists(clave)) return escena.textures.exists(gris) ? gris : clave;
  const img = escena.textures.get(clave).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const cv = escena.textures.createCanvas(gris, img.width, img.height)!;
  const ctx = cv.context;
  ctx.drawImage(img, 0, 0);
  const datos = ctx.getImageData(0, 0, img.width, img.height);
  const p = datos.data;
  for (let i = 0; i < p.length; i += 4) {
    // Gris apenas frío y algo más oscuro: «sin color», no blanco.
    const l = 0.3 * p[i]! + 0.59 * p[i + 1]! + 0.11 * p[i + 2]!;
    p[i] = l * 0.9;
    p[i + 1] = l * 0.92;
    p[i + 2] = l * 0.98;
  }
  ctx.putImageData(datos, 0, 0);
  cv.refresh();
  cv.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return gris;
}
