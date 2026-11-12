/**
 * Genera sprites placeholder por código, con las mismas reglas que los sprites finales:
 * 64×64 (frente y espalda), icono 64×32 (2 cuadros de 32×32), máx. 16 colores con transparencia,
 * contorno oscuro de 1 px y luz desde arriba a la izquierda.
 * Solo crea los archivos que falten: nunca pisa un sprite existente.
 * Uso: npm run placeholders
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

type Rgb = [number, number, number];
const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// Índices de paleta: 0 transparente · 1 contorno · 2 base · 3 sombra · 4 luz · 5 acento · 6 acento 2 · 7 blanco · 8 oscuro · 9 panza
const PALETAS: Record<string, Rgb[]> = {
  brasa: ['#000000', '#3a1a10', '#f08030', '#c05820', '#f8b060', '#f8d030', '#e03820', '#f8f8f8', '#201010', '#f8d8a0'].map(hex),
  marea: ['#000000', '#102040', '#4890e0', '#2868b8', '#80c0f8', '#38d0d0', '#f0f8f8', '#f8f8f8', '#101828', '#d8f0f8'].map(hex),
  brote: ['#000000', '#2a1c10', '#a87848', '#805830', '#c8a070', '#68b040', '#a0d868', '#f8f8f8', '#201810', '#e8dcb0'].map(hex),
};

class Lienzo {
  px: Uint8Array;
  /** Escala del dibujo respecto de la etapa 1, anclada abajo al centro (para las etapas 2 y 3). */
  k = 1;
  private tx(x: number): number {
    return 32 + (x - 32) * this.k;
  }
  private ty(y: number): number {
    return 60 + (y - 58) * this.k;
  }
  constructor(readonly w: number, readonly h: number) {
    this.px = new Uint8Array(w * h);
  }
  set(x: number, y: number, c: number): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c;
  }
  get(x: number, y: number): number {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x]! : 0;
  }
  /** Elipse con sombreado: luz arriba a la izquierda, sombra abajo a la derecha. */
  elipse(cx: number, cy: number, rx: number, ry: number, base: number, sombra = base, luz = base): void {
    cx = this.tx(cx);
    cy = this.ty(cy);
    rx *= this.k;
    ry *= this.k;
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        const d = dx + dy;
        this.set(x, y, d > 0.55 ? sombra : d < -0.8 ? luz : base);
      }
  }
  triangulo(p: [number, number][], c: number): void {
    const [a, b, d] = p.map(([x, y]) => [this.tx(x), this.ty(y)]) as [[number, number], [number, number], [number, number]];
    const area = (q: [number, number], r: [number, number], s: [number, number]) => (r[0] - q[0]) * (s[1] - q[1]) - (r[1] - q[1]) * (s[0] - q[0]);
    const minX = Math.floor(Math.min(a[0], b[0], d[0]));
    const maxX = Math.ceil(Math.max(a[0], b[0], d[0]));
    const minY = Math.floor(Math.min(a[1], b[1], d[1]));
    const maxY = Math.ceil(Math.max(a[1], b[1], d[1]));
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        const w0 = area(a, b, [x, y]);
        const w1 = area(b, d, [x, y]);
        const w2 = area(d, a, [x, y]);
        if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) this.set(x, y, c);
      }
  }
  /** Rectángulo en coordenadas del dibujo (se escala con la etapa). */
  rect(x: number, y: number, w: number, h: number, c: number): void {
    const x0 = Math.round(this.tx(x));
    const y0 = Math.round(this.ty(y));
    const w2 = Math.max(1, Math.round(w * this.k));
    const h2 = Math.max(1, Math.round(h * this.k));
    for (let j = 0; j < h2; j++) for (let i = 0; i < w2; i++) this.set(x0 + i, y0 + j, c);
  }
  contorno(): void {
    const copia = this.px.slice();
    const lleno = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h && copia[y * this.w + x] !== 0;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (copia[y * this.w + x] === 0 && (lleno(x + 1, y) || lleno(x - 1, y) || lleno(x, y + 1) || lleno(x, y - 1))) this.px[y * this.w + x] = 1;
  }
  espejo(): Lienzo {
    const l = new Lienzo(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) l.px[y * this.w + x] = this.px[y * this.w + (this.w - 1 - x)]!;
    return l;
  }
}

function ojos(l: Lienzo, x1: number, x2: number, y: number): void {
  for (const x of [x1, x2]) {
    l.rect(x, y, 2, 3, 8);
    l.rect(x, y, 1, 1, 7);
  }
}

/** Dibuja una criatura: la etapa 1 de su familia, ampliada y con rasgos extra en las etapas 2 y 3. `frente` mira a la izquierda; la espalda no tiene cara. */
function dibujar(familia: string, etapa: number, frente: boolean): Lienzo {
  const l = new Lienzo(64, 64);
  l.k = [1, 1.16, 1.3][etapa - 1]!;
  // Rasgos que se suman al evolucionar (se dibujan detrás del cuerpo).
  if (familia === 'brasa' && etapa >= 2) {
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2;
      const r = etapa === 3 ? 22 : 19;
      l.triangulo([[31 + Math.cos(ang) * r, 31 + Math.sin(ang) * r], [31 + Math.cos(ang - 0.35) * 12, 31 + Math.sin(ang - 0.35) * 12], [31 + Math.cos(ang + 0.35) * 12, 31 + Math.sin(ang + 0.35) * 12]], a % 2 ? 6 : 5);
    }
  }
  if (familia === 'marea' && etapa >= 2) {
    l.triangulo([[14, 38], [2, 30], [12, 48]], 5);
    l.triangulo([[48, 38], [60, 28], [52, 48]], 5);
    if (etapa === 3) l.triangulo([[32, 4], [20, 30], [46, 30]], 6);
  }
  if (familia === 'brote' && etapa === 3) {
    for (const d of [-1, 1]) {
      l.rect(32 + d * 10 - 1, 6, 2, 16, 3);
      l.rect(32 + d * 16 - 1, 8, 2, 8, 3);
      l.rect(32 + d * 10 + (d > 0 ? 0 : -6), 12, 6, 2, 3);
      l.elipse(32 + d * 17, 7, 4, 3, 5, 5, 6);
      l.elipse(32 + d * 9, 4, 4, 3, 5, 5, 6);
    }
  }
  if (familia === 'brasa') {
    // Cachorro de león: melena corta, cola con mechón oscuro y brasa en la frente.
    // (Sin llama en la cola a propósito: es un rasgo demasiado asociado a otra franquicia.)
    l.triangulo([[44, 48], [54, 40], [50, 50]], 2);
    l.elipse(55, 38, 3, 3, 3, 3, 3);
    l.elipse(31, 31, 16, 14, 3, 3, 3);
    l.elipse(32, 47, 12, 9, 2, 3, 4);
    l.elipse(25, 55, 4, 3, 2, 3, 4);
    l.elipse(39, 55, 4, 3, 2, 3, 4);
    l.elipse(21, 21, 4, 4, 2, 3, 4);
    l.elipse(41, 21, 4, 4, 2, 3, 4);
    l.elipse(31, 31, 13, 11, 2, 3, 4);
    if (frente) {
      l.elipse(21, 21, 2, 2, 9);
      l.elipse(41, 21, 2, 2, 9);
      l.elipse(30, 37, 6, 4, 9);
      l.elipse(31, 49, 6, 5, 9);
      l.elipse(31, 23, 3, 2, 6);
      l.elipse(31, 23, 1, 1, 5);
      ojos(l, 24, 34, 29);
      l.rect(29, 35, 1, 1, 8); l.rect(30, 35, 1, 1, 8); l.rect(30, 37, 1, 1, 8); l.rect(29, 38, 1, 1, 8); l.rect(31, 38, 1, 1, 8);
    } else {
      l.elipse(31, 27, 9, 6, 3, 3, 2);
    }
  } else if (familia === 'marea') {
    // Tiburón bebé: aleta dorsal como vela, cola, panza clara.
    l.triangulo([[44, 44], [57, 33], [55, 52]], 3);
    l.triangulo([[32, 12], [25, 31], [41, 31]], 5);
    l.triangulo([[32, 16], [29, 30], [36, 30]], 6);
    l.triangulo([[16, 44], [10, 54], [22, 49]], 3);
    l.triangulo([[44, 48], [50, 57], [40, 52]], 3);
    l.elipse(31, 42, 15, 13, 2, 3, 4);
    if (frente) {
      l.elipse(29, 47, 10, 7, 9);
      ojos(l, 21, 33, 36);
      l.rect(21, 35, 1, 1, 8); l.rect(22, 35, 1, 1, 8); l.rect(33, 35, 1, 1, 8); l.rect(34, 35, 1, 1, 8);
      for (let x = 23; x <= 34; x++) l.rect(x, 46, 1, 1, 8);
      l.rect(25, 47, 1, 1, 7); l.rect(28, 47, 1, 1, 7); l.rect(31, 47, 1, 1, 7);
    } else {
      l.triangulo([[32, 30], [28, 44], [36, 44]], 3);
    }
  } else {
    // Osezno: orejas redondas, brote de hojas en la cabeza, panza clara.
    l.elipse(32, 47, 14, 10, 2, 3, 4);
    l.elipse(23, 56, 5, 3, 2, 3, 4);
    l.elipse(41, 56, 5, 3, 2, 3, 4);
    l.elipse(21, 23, 4, 4, 2, 3, 4);
    l.elipse(43, 23, 4, 4, 2, 3, 4);
    l.elipse(32, 31, 13, 10, 2, 3, 4);
    l.rect(32, 20, 1, 1, 5); l.rect(32, 19, 1, 1, 5); l.rect(32, 18, 1, 1, 5);
    l.elipse(28, 15, 4, 2, 5, 5, 6);
    l.elipse(37, 14, 4, 2, 5, 5, 6);
    if (frente) {
      l.elipse(21, 23, 2, 2, 9);
      l.elipse(43, 23, 2, 2, 9);
      l.elipse(31, 36, 6, 4, 9);
      l.elipse(32, 49, 8, 6, 9);
      ojos(l, 25, 36, 29);
      l.rect(30, 34, 1, 1, 8); l.rect(31, 34, 1, 1, 8); l.rect(32, 34, 1, 1, 8); l.rect(31, 35, 1, 1, 8); l.rect(31, 37, 1, 1, 8);
    } else {
      l.elipse(32, 45, 8, 5, 5, 5, 6);
      l.elipse(32, 55, 3, 2, 3);
    }
  }
  // Rasgos que van por encima del cuerpo.
  if (familia === 'brasa' && etapa === 3) {
    for (const dx of [-7, 0, 7]) l.triangulo([[31 + dx - 3, 14], [31 + dx, 5], [31 + dx + 3, 14]], 5);
    l.elipse(19, 44, 5, 4, 3, 3, 3);
    l.elipse(45, 44, 5, 4, 3, 3, 3);
  }
  if (familia === 'marea' && etapa === 3) {
    l.elipse(20, 34, 5, 3, 3, 3, 3);
    l.elipse(43, 34, 5, 3, 3, 3, 3);
    l.rect(16, 50, 2, 2, 6);
    l.rect(44, 51, 2, 2, 6);
  }
  if (familia === 'marea' && etapa === 2 && frente) l.elipse(31, 53, 12, 2, 6, 6, 6);
  if (familia === 'brote' && etapa >= 2) {
    l.elipse(19, 41, 6, 4, 3, 3, 3);
    l.elipse(45, 41, 6, 4, 3, 3, 3);
    l.rect(17, 40, 5, 1, 1);
    l.rect(43, 40, 5, 1, 1);
  }
  l.contorno();
  return frente ? l : l.espejo();
}

/** Icono: reduce el frente a la mitad y crea 2 cuadros (el segundo baja 1 px). */
function icono(frente: Lienzo): Lienzo {
  const l = new Lienzo(64, 32);
  for (let cuadro = 0; cuadro < 2; cuadro++)
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const c = frente.get(x * 2, y * 2 + 1) || frente.get(x * 2 + 1, y * 2);
        if (c > 1) l.set(cuadro * 32 + x, y + cuadro - 1, c);
      }
  l.contorno();
  return l;
}

function guardar(l: Lienzo, paleta: Rgb[], ruta: string): void {
  // Nunca se pisa un sprite que ya existe (por ejemplo, el arte definitivo).
  if (existsSync(ruta)) return;
  const png = new PNG({ width: l.w, height: l.h });
  for (let i = 0; i < l.px.length; i++) {
    const c = l.px[i]!;
    const [r, g, b] = paleta[c]!;
    png.data[i * 4] = r;
    png.data[i * 4 + 1] = g;
    png.data[i * 4 + 2] = b;
    png.data[i * 4 + 3] = c === 0 ? 0 : 255;
  }
  writeFileSync(ruta, PNG.sync.write(png));
}

const destino = new URL('../public/sprites/', import.meta.url).pathname;
mkdirSync(destino, { recursive: true });
for (const familia of Object.keys(PALETAS)) {
  const paleta = PALETAS[familia]!;
  for (const etapa of [1, 2, 3]) {
    const frente = dibujar(familia, etapa, true);
    guardar(frente, paleta, `${destino}${familia}_${etapa}_frente.png`);
    guardar(dibujar(familia, etapa, false), paleta, `${destino}${familia}_${etapa}_espalda.png`);
    guardar(icono(frente), paleta, `${destino}${familia}_${etapa}_icono.png`);
  }
  console.log(`✓ ${familia}: 3 etapas (frente, espalda, icono)`);
}
