import type Phaser from 'phaser';
import type { Item } from '../esquemas/esquemas';
import { n } from './estilo';

/**
 * Iconos de ítems y monedas dibujados por código (unos 10×10 px en el mundo de 240×160).
 * La forma depende del tipo de ítem y el color sale de items.json, así un ítem nuevo ya tiene icono.
 */
export function iconoItem(g: Phaser.GameObjects.Graphics, item: Item, x: number, y: number, escala = 1): void {
  const c = n(item.color);
  const k = escala;
  const borde = 0x1f2340;
  const luz = 0xffffff;
  switch (item.efecto.tipo) {
    case 'xp': // caramelo envuelto
      g.fillStyle(borde, 1).fillTriangle(x - 6 * k, y - 3 * k, x - 6 * k, y + 3 * k, x - 2 * k, y);
      g.fillStyle(borde, 1).fillTriangle(x + 6 * k, y - 3 * k, x + 6 * k, y + 3 * k, x + 2 * k, y);
      g.fillStyle(c, 1).fillTriangle(x - 5 * k, y - 2 * k, x - 5 * k, y + 2 * k, x - 2 * k, y);
      g.fillStyle(c, 1).fillTriangle(x + 5 * k, y - 2 * k, x + 5 * k, y + 2 * k, x + 2 * k, y);
      g.fillStyle(borde, 1).fillCircle(x, y, 3.6 * k);
      g.fillStyle(c, 1).fillCircle(x, y, 2.8 * k);
      g.fillStyle(luz, 0.8).fillCircle(x - 1 * k, y - 1 * k, 0.9 * k);
      break;
    case 'vitamina': // cápsula
      g.fillStyle(borde, 1).fillRoundedRect(x - 5.5 * k, y - 3 * k, 11 * k, 6 * k, 3 * k);
      g.fillStyle(0xfbfaf3, 1).fillRoundedRect(x - 4.5 * k, y - 2 * k, 9 * k, 4 * k, 2 * k);
      g.fillStyle(c, 1).fillRoundedRect(x - 4.5 * k, y - 2 * k, 4.5 * k, 4 * k, { tl: 2 * k, bl: 2 * k, tr: 0, br: 0 });
      break;
    case 'incienso': // cono con humo
      g.fillStyle(borde, 1).fillTriangle(x - 4 * k, y + 5 * k, x + 4 * k, y + 5 * k, x, y - 2 * k);
      g.fillStyle(c, 1).fillTriangle(x - 3 * k, y + 4 * k, x + 3 * k, y + 4 * k, x, y - 0.5 * k);
      g.fillStyle(0xd8d0f0, 0.9).fillCircle(x + 1 * k, y - 4 * k, 1.4 * k).fillCircle(x - 1 * k, y - 6 * k, 1.1 * k);
      break;
    case 'escudo': // carta con escudo
      g.fillStyle(borde, 1).fillRoundedRect(x - 4 * k, y - 5.5 * k, 8 * k, 11 * k, 1.5 * k);
      g.fillStyle(c, 1).fillRoundedRect(x - 3 * k, y - 4.5 * k, 6 * k, 9 * k, 1 * k);
      g.fillStyle(luz, 1).fillTriangle(x - 2 * k, y - 2 * k, x + 2 * k, y - 2 * k, x, y + 3 * k);
      break;
    case 'piedra': // gema
      g.fillStyle(borde, 1).fillTriangle(x - 5 * k, y - 1 * k, x + 5 * k, y - 1 * k, x, y + 6 * k);
      g.fillStyle(borde, 1).fillRect(x - 5 * k, y - 4 * k, 10 * k, 3 * k);
      g.fillStyle(c, 1).fillTriangle(x - 4 * k, y - 1 * k, x + 4 * k, y - 1 * k, x, y + 4.5 * k);
      g.fillStyle(c, 1).fillRect(x - 4 * k, y - 3 * k, 8 * k, 2 * k);
      g.fillStyle(luz, 0.7).fillRect(x - 2 * k, y - 3 * k, 2 * k, 1 * k);
      break;
    case 'amuleto': // medallón con cordón
      g.lineStyle(1 * k, 0x8a6a3a, 1).beginPath().arc(x, y - 3 * k, 3.5 * k, Math.PI, 0).strokePath();
      g.fillStyle(borde, 1).fillCircle(x, y + 1.5 * k, 4.4 * k);
      g.fillStyle(0xf5c542, 1).fillCircle(x, y + 1.5 * k, 3.6 * k);
      g.fillStyle(c, 1).fillCircle(x, y + 1.5 * k, 2.4 * k);
      g.fillStyle(luz, 0.8).fillCircle(x - 0.9 * k, y + 0.6 * k, 0.7 * k);
      break;
    default: // frasco (poción, antídoto, tónico)
      g.fillStyle(borde, 1).fillRect(x - 1.5 * k, y - 6 * k, 3 * k, 3 * k);
      g.fillStyle(borde, 1).fillCircle(x, y + 1.5 * k, 4.6 * k);
      g.fillStyle(0xd9dfe6, 1).fillCircle(x, y + 1.5 * k, 3.8 * k);
      g.fillStyle(c, 1).fillCircle(x, y + 2.3 * k, 3 * k);
      g.fillStyle(0xa87848, 1).fillRect(x - 1 * k, y - 6 * k, 2 * k, 1.5 * k);
      g.fillStyle(luz, 0.8).fillCircle(x - 1.4 * k, y + 0.5 * k, 0.8 * k);
  }
}

/** Moneda (dorada) o Esencia (gema violeta), para precios y recursos. */
export function iconoMoneda(g: Phaser.GameObjects.Graphics, moneda: 'monedas' | 'esencia', x: number, y: number): void {
  if (moneda === 'monedas') {
    g.fillStyle(0x8a5a00, 1).fillCircle(x, y, 3.2);
    g.fillStyle(0xf5c542, 1).fillCircle(x, y, 2.4);
    g.fillStyle(0xfff0a0, 1).fillRect(x - 0.5, y - 1.5, 1, 3);
  } else {
    g.fillStyle(0x4a2a7a, 1).fillTriangle(x - 3.2, y, x + 3.2, y, x, y - 3.6).fillTriangle(x - 3.2, y, x + 3.2, y, x, y + 3.6);
    g.fillStyle(0xb88ae8, 1).fillTriangle(x - 2.2, y, x + 2.2, y, x, y - 2.5).fillTriangle(x - 2.2, y, x + 2.2, y, x, y + 2.5);
  }
}
