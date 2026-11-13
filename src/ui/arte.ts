import Phaser from 'phaser';
import type { Item, StatId, EstadoId } from '../esquemas/esquemas';
import { C, n } from './estilo';
import { COLOR_RAREZA } from './criaturas';
import LISTA from './arte-ui.json';

/**
 * Arte de interfaz dibujado por el autor (src/ui/arte-ui.json, importado con scripts/importar_ui.py):
 * ítems, sobres, medallas, monedas, tipos, estados, categorías, menú, expediciones y marcos.
 * Los íconos son de 32×32: a 8 px del mundo se ven 1:1 en pantalla (cámara 4×), a 16 px al doble.
 * Si falta una pieza, cada pantalla conserva su dibujo por código.
 */
const PIEZAS = LISTA as Record<string, { ruta: string; tam: number[] }>;

export function cargarArteUI(escena: Phaser.Scene): void {
  for (const [clave, p] of Object.entries(PIEZAS)) escena.load.image(`ui_${clave}`, p.ruta);
}

/** Pixel art: se amplía sin suavizado. */
export function prepararArteUI(escena: Phaser.Scene): void {
  for (const clave of Object.keys(PIEZAS)) if (escena.textures.exists(`ui_${clave}`)) escena.textures.get(`ui_${clave}`).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

export function hayArte(escena: Phaser.Scene, clave: string): boolean {
  return escena.textures.exists(`ui_${clave}`);
}

/**
 * Imagen de una pieza centrada en (x, y), con su lado mayor = `tam` px del mundo.
 * Devuelve null si la pieza no existe (quien llama dibuja su reemplazo).
 */
export function pieza(escena: Phaser.Scene, clave: string, x: number, y: number, tam: number, contenedor?: Phaser.GameObjects.Container): Phaser.GameObjects.Image | null {
  if (!hayArte(escena, clave)) return null;
  const img = escena.add.image(x, y, `ui_${clave}`);
  img.setScale(tam / Math.max(img.width, img.height));
  contenedor?.add(img);
  return img;
}

export const claveItem = (item: Item): string => `item_${item.id}`;
export const claveTipo = (tipo: string): string => `tipo_${tipo}`;
export const claveEstado = (e: EstadoId | 'lentitud' | 'debilidad'): string => `estado_${e}`;
export const claveCategoria = (c: 'fisica' | 'especial' | 'estado' | 'definitivo'): string =>
  c === 'fisica' ? 'categoria_fisico' : c === 'especial' ? 'categoria_especial' : c === 'estado' ? 'categoria_apoyo' : 'categoria_definitivo';
export const claveSobre = (id: string): string => `sobre_${id}`;
export const claveMedalla = (id: string, nivel: number): string => (nivel > 0 ? `medalla_${id}_${nivel}` : `medalla_${id}_bloqueada`);
export const claveMarco = (rareza: string): string => `marco_${rareza}`;

/** Stat que baja cada encanto (para el ícono de estado del rival). */
export const ESTADO_DE_STAT: Partial<Record<StatId, 'lentitud' | 'debilidad'>> = { vel: 'lentitud', atq: 'debilidad' };

/**
 * Marco de carta de su rareza (64×88, interior transparente) encima de una carta centrada en el contenedor,
 * a escala 1: cada píxel del dibujo ocupa 4 en pantalla. Con brillante, el destello en la esquina.
 */
export function marcoCarta(escena: Phaser.Scene, cont: Phaser.GameObjects.Container, rareza: string, brillante: boolean, clave = claveMarco(rareza)): void {
  const marco = pieza(escena, clave, 0, 0, 88, cont);
  if (marco) marco.setScale(1);
  if (brillante) pieza(escena, 'brillante', 22, -34, 16, cont);
}

/** Fondo de carta (62×92 centrada): papel liso si hay marco dibujado (lo pone marcoCarta); si no, el borde de color por código. */
export function fondoCarta(escena: Phaser.Scene, rareza: keyof typeof COLOR_RAREZA): Phaser.GameObjects.Graphics {
  const g = escena.add.graphics();
  if (hayArte(escena, claveMarco(rareza))) {
    g.fillStyle(n(C.papel), 1).fillRoundedRect(-30, -42, 60, 84, 3);
    return g;
  }
  g.fillStyle(0x10142c, 1).fillRoundedRect(-31, -46, 62, 92, 5);
  g.fillStyle(n(COLOR_RAREZA[rareza]), 1).fillRoundedRect(-29, -44, 58, 88, 4);
  g.fillStyle(n(C.papel), 1).fillRoundedRect(-26.5, -41.5, 53, 83, 3);
  return g;
}
