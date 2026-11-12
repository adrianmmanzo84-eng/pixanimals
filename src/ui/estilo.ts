import Phaser from 'phaser';
import { ESCALA } from './texto';

/** Paleta de la interfaz. Los indicadores nunca dependen solo del color: siempre llevan texto o número. */
export const C = {
  tinta: '#1f2340',
  tintaSuave: '#5b6a8c',
  papel: '#fbfaf3',
  papelSombra: '#d9dfe6',
  marco: '#2b3a78',
  marcoClaro: '#5aa9f0',
  resalte: '#c0394f',
  apagado: '#9fb0c4',
  psAlto: 0x3fbf6a,
  psMedio: 0xf5b942,
  psBajo: 0xd0425a,
  barraFondo: 0x39425e,
};

export const COLOR_TIPO: Record<string, number> = {
  brasa: 0xf07a3c, marea: 0x3f9be8, brote: 0x45b35f, rayo: 0xd9a514, roca: 0x9a8466, cielo: 0x5cb8de, sombra: 0x7a56b0, neutro: 0x9fb0c4,
};
export const COLOR_ESTADO: Record<string, number> = { quemadura: 0xc0394f, veneno: 0x7a3a9a, paralisis: 0xc89010, sueno: 0x5b6a8c };

export const n = (hex: string) => parseInt(hex.slice(1), 16);

/** El mundo mide 240×160; la cámara lo amplía 4× sobre un lienzo de 960×640. */
export function prepararCamara(escena: Phaser.Scene): void {
  escena.cameras.main.setZoom(ESCALA);
  escena.cameras.main.centerOn(120, 80);
}

/** Ventana de interfaz redondeada, con sombra suave. */
export function ventana(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, alfa = 1): void {
  g.fillStyle(0x141830, 0.28 * alfa).fillRoundedRect(x + 0.5, y + 1.2, w, h, 4);
  g.fillStyle(n(C.marco), alfa).fillRoundedRect(x, y, w, h, 4);
  g.fillStyle(n(C.marcoClaro), alfa).fillRoundedRect(x + 0.9, y + 0.9, w - 1.8, h - 1.8, 3.3);
  g.fillStyle(n(C.papel), alfa).fillRoundedRect(x + 1.7, y + 1.7, w - 3.4, h - 3.4, 2.6);
}
