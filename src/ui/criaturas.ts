import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import type { RarezaId } from '../esquemas/esquemas';

/** Texturas derivadas de los sprites: variante brillante (otra paleta) y silueta para el Bestiario. */

export const COLOR_RAREZA: Record<RarezaId, string> = { comun: '#6f7f96', poco_comun: '#2f9a4c', rara: '#2c7fd0', epica: '#8a45c8' };

export function estrellas(rareza: RarezaId): string {
  const r = DATOS.sobres.rarezas.find((x) => x.id === rareza)!;
  return `${'★'.repeat(r.estrellas)} ${r.nombre}`;
}

/** Clave de textura de una criatura. vista: frente | espalda | icono | silueta */
export function textura(idEspecie: string, vista: 'frente' | 'espalda' | 'icono' | 'silueta' | 'blanca', brillante = false): string {
  const base = DATOS.criaturas.get(idEspecie)!.sprites;
  if (vista === 'silueta') return `${base}_frente_s`;
  if (vista === 'blanca') return `${base}_frente_w`;
  return `${base}_${vista}${brillante && vista !== 'icono' ? '_b' : ''}`;
}

function derivar(escena: Phaser.Scene, clave: string, sufijo: string, f: (d: Uint8ClampedArray, i: number) => void): void {
  if (escena.textures.exists(clave + sufijo)) return;
  const img = escena.textures.get(clave).getSourceImage() as HTMLImageElement;
  const tex = escena.textures.createCanvas(clave + sufijo, img.width, img.height)!;
  tex.context.drawImage(img, 0, 0);
  const datos = tex.context.getImageData(0, 0, img.width, img.height);
  for (let i = 0; i < datos.data.length; i += 4) if (datos.data[i + 3]! > 0) f(datos.data, i);
  tex.context.putImageData(datos, 0, 0);
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Gira el tono de un color (placeholder de la paleta brillante hasta tener paletas dibujadas a mano). */
function girarTono(d: Uint8ClampedArray, i: number): void {
  const r = d[i]! / 255;
  const g = d[i + 1]! / 255;
  const b = d[i + 2]! / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max - min < 0.08) return; // grises, blancos y contorno no cambian
  const dif = max - min;
  const s = l > 0.5 ? dif / (2 - max - min) : dif / (max + min);
  let h = max === r ? (g - b) / dif + (g < b ? 6 : 0) : max === g ? (b - r) / dif + 2 : (r - g) / dif + 4;
  h = (h / 6 + 0.42) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const canal = (x: number) => {
    x = (x + 1) % 1;
    return x < 1 / 6 ? p + (q - p) * 6 * x : x < 1 / 2 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p;
  };
  d[i] = Math.round(canal(h + 1 / 3) * 255);
  d[i + 1] = Math.round(canal(h) * 255);
  d[i + 2] = Math.round(canal(h - 1 / 3) * 255);
}

const altos = new Map<string, number>();
const anchos = new Map<string, number>();

/** Alto en píxeles de la parte visible del sprite de frente (para centrar los efectos sobre el cuerpo). */
export function altoVisible(idEspecie: string): number {
  return altos.get(DATOS.criaturas.get(idEspecie)!.sprites) ?? 48;
}

/**
 * Para miniaturas (cartas, Bestiario, listas): centra la parte visible del sprite en el punto dado.
 * Los sprites se apoyan en la base de un lienzo de 96×96, así que sin esto las criaturas chicas quedarían bajas.
 */
export function centrarVisible<T extends Phaser.GameObjects.Image>(img: T, idEspecie: string): T {
  return img.setOrigin(0.5, 1 - altoVisible(idEspecie) / 2 / img.height);
}

/**
 * Miniatura: centra la criatura y la escala para que entre en una caja de `caja` px, sin pasar de `maxEscala`
 * (así las bebés no se ven gigantes y las grandes no se salen de su casilla).
 */
export function miniatura<T extends Phaser.GameObjects.Image>(img: T, idEspecie: string, caja: number, maxEscala: number): T {
  const sprites = DATOS.criaturas.get(idEspecie)!.sprites;
  const lado = Math.max(altoVisible(idEspecie), anchos.get(sprites) ?? 48);
  return centrarVisible(img, idEspecie).setScale(Math.min(maxEscala, caja / lado));
}

/** Alto (desde la base del lienzo) y ancho de la parte visible de un sprite. */
function medir(escena: Phaser.Scene, clave: string): { alto: number; ancho: number } {
  const img = escena.textures.get(clave).getSourceImage() as HTMLImageElement;
  const lienzo = document.createElement('canvas');
  lienzo.width = img.width;
  lienzo.height = img.height;
  const ctx = lienzo.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height).data;
  let arriba = img.height;
  let izq = img.width;
  let der = -1;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++)
      if (d[(y * img.width + x) * 4 + 3]! > 0) {
        arriba = Math.min(arriba, y);
        izq = Math.min(izq, x);
        der = Math.max(der, x);
      }
  return { alto: img.height - arriba, ancho: Math.max(1, der - izq + 1) };
}

export function prepararTexturasCriaturas(escena: Phaser.Scene): void {
  for (const c of DATOS.criaturas.values()) {
    const m = medir(escena, `${c.sprites}_frente`);
    altos.set(c.sprites, m.alto);
    anchos.set(c.sprites, m.ancho);
    for (const vista of ['frente', 'espalda', 'icono']) escena.textures.get(`${c.sprites}_${vista}`).setFilter(Phaser.Textures.FilterMode.NEAREST);
    derivar(escena, `${c.sprites}_frente`, '_b', girarTono);
    derivar(escena, `${c.sprites}_espalda`, '_b', girarTono);
    derivar(escena, `${c.sprites}_frente`, '_s', (d, i) => {
      d[i] = 0x2b;
      d[i + 1] = 0x3a;
      d[i + 2] = 0x78;
    });
    // Silueta blanca para el parpadeo de la evolución.
    derivar(escena, `${c.sprites}_frente`, '_w', (d, i) => {
      d[i] = 0xff;
      d[i + 1] = 0xff;
      d[i + 2] = 0xff;
    });
  }
}
