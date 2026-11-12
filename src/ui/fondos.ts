import Phaser from 'phaser';
import { ESCALA } from './texto';

/**
 * Fondos con estilo de dibujo animado, pintados por código en alta resolución.
 * Son placeholders: más adelante se pueden reemplazar por ilustraciones propias.
 */
export type FondoId = 'pradera' | 'costa' | 'volcan' | 'bosque' | 'menu';
export const FONDO_POR_TIPO: Record<string, FondoId> = { brasa: 'volcan', marea: 'costa', brote: 'bosque' };

type Ctx = CanvasRenderingContext2D;
const W = 240 * ESCALA;

/** Azar con semilla: el mismo fondo se dibuja siempre igual. */
function azar(semilla: number): () => number {
  let s = semilla;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function degradado(c: Ctx, y0: number, y1: number, colores: string[]): void {
  const g = c.createLinearGradient(0, y0, 0, y1);
  colores.forEach((col, i) => g.addColorStop(i / (colores.length - 1), col));
  c.fillStyle = g;
  c.fillRect(0, y0, W, y1 - y0);
}

function circulo(c: Ctx, x: number, y: number, r: number, color: string): void {
  c.fillStyle = color;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

function elipse(c: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

function sol(c: Ctx, x: number, y: number, r: number, color: string, halo: string): void {
  const g = c.createRadialGradient(x, y, r * 0.6, x, y, r * 3.2);
  g.addColorStop(0, halo);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  circulo(c, x, y, r, color);
}

function nube(c: Ctx, x: number, y: number, s: number, color = '#ffffff', sombra = '#d6e8f6'): void {
  const bolas: [number, number, number][] = [[0, 0, 26], [30, -12, 32], [64, -2, 26], [92, 6, 18], [-26, 8, 18]];
  for (const [dx, dy, r] of bolas) circulo(c, x + dx * s, y + (dy + 7) * s, r * s, sombra);
  for (const [dx, dy, r] of bolas) circulo(c, x + dx * s, y + dy * s, r * s, color);
  c.fillStyle = sombra;
  c.fillRect(x - 40 * s, y + 20 * s, 150 * s, 3 * s);
}

/** Franja de colinas onduladas desde yBase hasta abajo. */
function colinas(c: Ctx, alto: number, yBase: number, amp: number, largo: number, fase: number, color: string): void {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, alto);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, yBase + Math.sin(x / largo + fase) * amp + Math.sin(x / (largo * 0.37) + fase * 2.1) * amp * 0.3);
  c.lineTo(W, alto);
  c.fill();
}

function montana(c: Ctx, x: number, y: number, w: number, h: number, color: string, luz: string, nieve?: string): void {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - w / 2, y);
  c.lineTo(x, y - h);
  c.lineTo(x + w / 2, y);
  c.fill();
  c.fillStyle = luz;
  c.beginPath();
  c.moveTo(x - w / 2, y);
  c.lineTo(x, y - h);
  c.lineTo(x - w * 0.08, y);
  c.fill();
  if (nieve) {
    c.fillStyle = nieve;
    c.beginPath();
    c.moveTo(x, y - h);
    c.lineTo(x - w * 0.11, y - h * 0.72);
    c.lineTo(x - w * 0.03, y - h * 0.78);
    c.lineTo(x + w * 0.04, y - h * 0.7);
    c.lineTo(x + w * 0.11, y - h * 0.74);
    c.fill();
  }
}

function arbol(c: Ctx, x: number, y: number, s: number, copa: string, luz: string, tronco: string): void {
  c.fillStyle = tronco;
  c.fillRect(x - 5 * s, y - 34 * s, 10 * s, 36 * s);
  for (const [dx, dy, r] of [[0, -62, 30], [-22, -46, 24], [22, -46, 24], [0, -40, 26]] as const) circulo(c, x + dx * s, y + dy * s, r * s, copa);
  circulo(c, x - 9 * s, y - 68 * s, 13 * s, luz);
  circulo(c, x - 24 * s, y - 50 * s, 9 * s, luz);
}

/** Plataformas donde se apoyan las criaturas (coordenadas del mundo × 4). */
function plataformas(c: Ctx, color: string, borde: string): void {
  for (const [x, y, rx, ry] of [[232, 422, 150, 22], [728, 358, 136, 19]] as const) {
    elipse(c, x, y + 5, rx, ry, borde);
    elipse(c, x, y, rx, ry, color);
  }
}

const PINTORES: Record<FondoId, (c: Ctx, alto: number) => void> = {
  pradera(c, alto) {
    const r = azar(7);
    degradado(c, 0, 310, ['#4aa6ee', '#9fd6f7', '#e9f7fc']);
    sol(c, 800, 150, 40, '#fff8d2', 'rgba(255,246,190,0.75)');
    nube(c, 120, 150, 1.1);
    nube(c, 470, 205, 0.7);
    nube(c, 640, 130, 0.9);
    montana(c, 250, 300, 380, 150, '#8ea6da', '#b3c5ec', '#f4f8ff');
    montana(c, 520, 300, 300, 110, '#9ab0e0', '#bccbee', '#f4f8ff');
    montana(c, 860, 300, 340, 130, '#8ea6da', '#b3c5ec', '#f4f8ff');
    colinas(c, alto, 268, 18, 150, 0.4, '#9bd98f');
    colinas(c, alto, 292, 14, 110, 2.2, '#7bcb78');
    degradado(c, 318, alto, ['#74c76b', '#56ad58']);
    colinas(c, 330, 318, 6, 70, 1.1, '#74c76b');
    for (let i = 0; i < 46; i++) {
      const x = r() * W;
      const y = 330 + r() * (alto - 336);
      c.fillStyle = '#4b9d50';
      c.fillRect(x, y, 3, 9);
      c.fillRect(x + 5, y + 2, 3, 7);
      if (i % 3 === 0) circulo(c, x + 14, y + 4, 4, ['#ffffff', '#ffe46b', '#ff9fc0'][i % 9 === 0 ? 2 : i % 2]!);
    }
    plataformas(c, '#a9e08f', '#4f9f54');
  },
  costa(c, alto) {
    const r = azar(21);
    degradado(c, 0, 250, ['#3d9ee6', '#96d6f5', '#fff3d2']);
    sol(c, 170, 160, 44, '#fffbe0', 'rgba(255,238,170,0.8)');
    nube(c, 420, 120, 1.0);
    nube(c, 760, 170, 0.75);
    degradado(c, 244, 330, ['#2388d6', '#58c2ea']);
    colinas(c, 262, 246, 0, 100, 0, '#2388d6');
    c.fillStyle = '#3f8d5c';
    c.beginPath();
    c.ellipse(700, 250, 120, 34, 0, Math.PI, 0);
    c.fill();
    c.fillStyle = '#58a870';
    c.beginPath();
    c.ellipse(680, 250, 70, 22, 0, Math.PI, 0);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = 4;
    c.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const x = r() * W;
      const y = 262 + r() * 54;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 18, y - 6, x + 36 + r() * 30, y);
      c.stroke();
    }
    degradado(c, 326, alto, ['#f7e4ae', '#e7c986']);
    colinas(c, 346, 330, 5, 60, 0.7, '#ffffff');
    colinas(c, 352, 337, 5, 60, 0.7, '#f7e4ae');
    for (let i = 0; i < 30; i++) circulo(c, r() * W, 356 + r() * (alto - 362), 2 + r() * 3, i % 4 === 0 ? '#ffffff' : '#d4b272');
    elipse(c, 900, 372, 46, 26, '#8d8a9a');
    elipse(c, 890, 364, 36, 20, '#aaa8b8');
    plataformas(c, '#fff0c4', '#d2b06e');
  },
  volcan(c, alto) {
    const r = azar(33);
    degradado(c, 0, 320, ['#2b1942', '#7b2c52', '#e8663a', '#f9bd66']);
    nube(c, 180, 110, 1.0, '#5a2a52', '#43203f');
    nube(c, 720, 80, 0.9, '#5a2a52', '#43203f');
    montana(c, 760, 320, 420, 150, '#5a2c44', '#74384c');
    // Volcán principal con cráter encendido.
    c.fillStyle = '#3c2032';
    c.beginPath();
    c.moveTo(120, 322);
    c.lineTo(330, 96);
    c.lineTo(440, 96);
    c.lineTo(640, 322);
    c.fill();
    c.fillStyle = '#55303f';
    c.beginPath();
    c.moveTo(120, 322);
    c.lineTo(330, 96);
    c.lineTo(372, 96);
    c.lineTo(300, 322);
    c.fill();
    sol(c, 385, 92, 22, '#ffd36a', 'rgba(255,150,60,0.8)');
    elipse(c, 385, 98, 56, 12, '#ff8a3a');
    c.strokeStyle = '#ff9a3c';
    c.lineWidth = 9;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(400, 104);
    c.quadraticCurveTo(430, 180, 410, 230);
    c.quadraticCurveTo(396, 280, 440, 320);
    c.stroke();
    c.strokeStyle = '#ffd36a';
    c.lineWidth = 3;
    c.stroke();
    degradado(c, 318, alto, ['#523440', '#2f1f2a']);
    colinas(c, 334, 320, 5, 80, 0.3, '#523440');
    c.strokeStyle = '#ff8a3a';
    c.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      let x = r() * W;
      let y = 340 + r() * (alto - 360);
      c.beginPath();
      c.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += 14 + r() * 22;
        y += (r() - 0.5) * 22;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    for (let i = 0; i < 26; i++) circulo(c, r() * W, 60 + r() * 250, 2 + r() * 2.5, i % 2 ? '#ffd36a' : '#ff8a3a');
    plataformas(c, '#7a4c58', '#24161f');
  },
  bosque(c, alto) {
    const r = azar(12);
    degradado(c, 0, 310, ['#7fd3bd', '#c6efd8', '#f2fbe2']);
    sol(c, 480, 60, 34, '#fffde6', 'rgba(255,255,220,0.7)');
    c.fillStyle = 'rgba(255,255,255,0.22)';
    for (const x of [300, 470, 640]) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x + 70, 0);
      c.lineTo(x - 110, 330);
      c.lineTo(x - 200, 330);
      c.fill();
    }
    for (let i = 0; i < 16; i++) arbol(c, i * 64 + r() * 30, 300, 1.15 + r() * 0.3, '#86cba6', '#9ed8b6', '#6ea98c');
    for (let i = 0; i < 11; i++) arbol(c, i * 96 + r() * 40 - 10, 318, 1.7 + r() * 0.4, '#4ea674', '#68ba88', '#3f7f5c');
    degradado(c, 312, alto, ['#63b45c', '#3f8f4c']);
    colinas(c, 330, 314, 6, 90, 1.4, '#63b45c');
    arbol(c, 30, 372, 3.0, '#2f8456', '#45a06c', '#5a4030');
    arbol(c, 940, 352, 2.7, '#2f8456', '#45a06c', '#5a4030');
    for (let i = 0; i < 34; i++) {
      const x = 90 + r() * (W - 180);
      const y = 336 + r() * (alto - 342);
      if (i % 5 === 0) {
        c.fillStyle = '#fff4dc';
        c.fillRect(x + 3, y + 2, 4, 8);
        elipse(c, x + 5, y + 2, 8, 5, '#e2574c');
      } else {
        c.fillStyle = '#347d42';
        c.fillRect(x, y, 3, 9);
        c.fillRect(x + 5, y + 3, 3, 6);
      }
    }
    plataformas(c, '#a5dc86', '#2f7a40');
  },
  menu(c, alto) {
    degradado(c, 0, alto, ['#2f6fd0', '#6fbdf0', '#d9f2fb']);
    sol(c, 820, 110, 46, '#fff8d2', 'rgba(255,246,190,0.7)');
    nube(c, 90, 90, 1.0);
    nube(c, 560, 60, 0.7);
    nube(c, 300, 590, 1.3, '#ffffff', '#cfe6f6');
    nube(c, 760, 610, 1.1, '#ffffff', '#cfe6f6');
  },
};

/** Devuelve la clave de textura del fondo, creándola la primera vez. */
/** Ilustraciones propias: public/fondos/<id>.jpg (960×448). Si falta alguna, se usa el fondo pintado por código. */
export const FONDOS_ILUSTRADOS: FondoId[] = ['pradera', 'costa', 'volcan', 'bosque'];

export function fondo(escena: Phaser.Scene, id: FondoId): string {
  const ilustrado = `fondoimg_${id}`;
  if (escena.textures.exists(ilustrado)) return ilustrado;
  const clave = `fondo_${id}`;
  if (!escena.textures.exists(clave)) {
    const alto = (id === 'menu' ? 160 : 112) * ESCALA;
    const tex = escena.textures.createCanvas(clave, W, alto)!;
    PINTORES[id](tex.context, alto);
    tex.refresh();
  }
  return clave;
}
