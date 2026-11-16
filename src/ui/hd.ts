import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import listaHD from './hd-lista.json';

/**
 * Arte HD de las criaturas (D243), generado desde los originales del autor con `scripts/importar_hd.py`.
 * Tiene el mismo encuadre que los sprites de 96×96, así que reemplaza al pixel art sin mover nada:
 *   - mini (128×128): listas, tarjetas y menú. Se cargan todas al arrancar (pesan poco).
 *   - grande (384×384, frente y espalda): combate y detalle. Se cargan a pedido, solo las que hacen falta.
 * Sin versión HD (o mientras la grande carga) se sigue usando el pixel art.
 */

const CON_HD = new Set<string>(listaHD as string[]);
/** Lado del lienzo grande y del mini, en píxeles de textura. El lienzo lógico mide 96. */
export const LADO_GRANDE = 384;
export const LADO_MINI = 128;

type Vista = 'frente' | 'espalda';

export function tieneHD(sprites: string): boolean {
  return CON_HD.has(sprites);
}

const spritesDe = (especie: string): string => DATOS.criaturas.get(especie)!.sprites;

export const claveMini = (sprites: string): string => `${sprites}_mini`;
export const claveGrande = (sprites: string, vista: Vista): string => `${sprites}_${vista}_hd`;

/** En Arranque: todas las minis. */
export function cargarMinis(load: Phaser.Loader.LoaderPlugin): void {
  for (const s of CON_HD) load.image(claveMini(s), `hd/${s}_mini.webp`);
}

/**
 * Carga a pedido las grandes (frente y espalda) de estas especies. Devuelve una promesa que se cumple cuando
 * están listas (enseguida si ya estaban). Las que no tienen versión HD se ignoran.
 */
export function cargarGrandes(escena: Phaser.Scene, especies: string[]): Promise<void> {
  const faltan: string[] = [];
  for (const e of new Set(especies)) {
    const s = spritesDe(e);
    if (!tieneHD(s)) continue;
    for (const v of ['frente', 'espalda'] as Vista[]) {
      const clave = claveGrande(s, v);
      if (!escena.textures.exists(clave)) faltan.push(clave);
    }
  }
  if (!faltan.length) return Promise.resolve();
  return new Promise((listo) => {
    const load = escena.load;
    for (const clave of faltan) {
      const [s, v] = [clave.replace(/_(frente|espalda)_hd$/, ''), clave.includes('_espalda_') ? 'espalda' : 'frente'];
      load.image(clave, `hd/${s}_${v}.webp`);
    }
    load.once(Phaser.Loader.Events.COMPLETE, () => listo());
    load.start();
  });
}

/** Paleta brillante (giro de tono, igual que el pixel art), creada la primera vez que hace falta. */
function brillante(escena: Phaser.Scene, clave: string, girar: (d: Uint8ClampedArray, i: number) => void): string {
  const destino = `${clave}_b`;
  if (escena.textures.exists(destino)) return destino;
  const img = escena.textures.get(clave).getSourceImage() as HTMLImageElement;
  const tex = escena.textures.createCanvas(destino, img.width, img.height)!;
  tex.context.drawImage(img, 0, 0);
  const datos = tex.context.getImageData(0, 0, img.width, img.height);
  for (let i = 0; i < datos.data.length; i += 4) if (datos.data[i + 3]! > 8) girar(datos.data, i);
  tex.context.putImageData(datos, 0, 0);
  tex.refresh();
  return destino;
}

/** Colores de las siluetas del pixel art (azul del Bestiario, negra sin descubrir, blanca de la evolución). */
export const SILUETA = { s: 0x2b3a78, n: 0x10121c, w: 0xffffff } as const;

/**
 * Lo que hay que dibujar para una clave de textura de criatura del pixel art (`<sprites>_frente[_b|_s|_n|_w]`,
 * `<sprites>_espalda[_b]`): la textura HD (mini o grande), el factor de escala respecto del lienzo de 96 y,
 * si es silueta, el color de relleno. `null` si no hay versión HD disponible.
 */
export function versionHD(
  escena: Phaser.Scene,
  clave: string,
  tamano: 'mini' | 'grande',
  girar: (d: Uint8ClampedArray, i: number) => void,
): { clave: string; factor: number; relleno: number | null } | null {
  const m = /^(.+)_(frente|espalda)(?:_([bsnw]))?$/.exec(clave);
  if (!m) return null;
  const [, sprites, vista, mod] = m as unknown as [string, string, Vista, 'b' | 's' | 'n' | 'w' | undefined];
  if (!tieneHD(sprites)) return null;
  let base: string;
  let lado: number;
  const mini = claveMini(sprites);
  const grande = claveGrande(sprites, vista);
  if (tamano === 'mini' && vista === 'frente' && escena.textures.exists(mini)) [base, lado] = [mini, LADO_MINI];
  else if (escena.textures.exists(grande)) [base, lado] = [grande, LADO_GRANDE];
  else return null; // la grande todavía no cargó: se usa el pixel art
  const relleno = mod === 's' || mod === 'n' || mod === 'w' ? SILUETA[mod] : null;
  return { clave: mod === 'b' ? brillante(escena, base, girar) : base, factor: 96 / lado, relleno };
}
