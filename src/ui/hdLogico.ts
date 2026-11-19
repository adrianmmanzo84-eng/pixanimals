import Phaser from 'phaser';

/**
 * Arte HD con tamaño lógico (D261). Las piezas de efectos, animaciones, Mina y caminos llegan a 4× de su tamaño
 * (un ícono de 32 px llega a 128). El código del juego sigue pensando en el tamaño anterior (`setScale(0.25)`,
 * `scale: 1.2`…): estas imágenes guardan el factor 1/4 por dentro y por fuera siguen usando la escala de siempre,
 * así que no hay que tocar cada llamada ni cambia el tamaño en pantalla. El ancho y el alto (`width`, `height`)
 * sí son los reales de la textura: para el tamaño anterior hay que dividirlos por `HD`.
 */
export const HD = 4;
const K = 1 / HD;

const PREFIJOS = ['fximg_', 'fxat_', 'huevo'];
const EXACTAS = new Set(['mina_bloques', 'carta_dorso', 'ruta_nodo', 'ruta_vencido', 'ruta_jefe']);
const extra = new Set<string>();

/** Registra claves de textura HD con tamaño lógico (animaciones, por ejemplo). */
export function registrarHD(claves: Iterable<string>): void {
  for (const c of claves) extra.add(c);
}

export function esHD(clave: string): boolean {
  return EXACTAS.has(clave) || extra.has(clave) || PREFIJOS.some((p) => clave.startsWith(p));
}

type Obj = Phaser.GameObjects.Image;

/**
 * Phaser 4 lee `scaleX`/`scaleY` (los públicos) al dibujar. Mientras el dibujante de imágenes trabaja, las
 * imágenes HD devuelven la escala real (la de dentro); el resto del tiempo, la lógica.
 */
let dibujando = false;
let enganchado = false;
function engancharDibujante(): void {
  if (enganchado) return;
  enganchado = true;
  const T = (Phaser.Renderer.WebGL as unknown as { RenderNodes: Record<string, { prototype: { run: (...a: unknown[]) => unknown } }> }).RenderNodes.TransformerImage!.prototype;
  const original = T.run;
  T.run = function (this: unknown, ...a: unknown[]) {
    const antes = dibujando;
    dibujando = true;
    try {
      return original.apply(this, a);
    } finally {
      dibujando = antes;
    }
  };
}

function descriptor(o: object, nombre: string): PropertyDescriptor | undefined {
  for (let p: object | null = o; p; p = Object.getPrototypeOf(p)) {
    const d = Object.getOwnPropertyDescriptor(p, nombre);
    if (d) return d;
  }
  return undefined;
}

/** Hace que la imagen use la escala «lógica» (1 = tamaño del dibujo anterior, un cuarto de la textura HD). */
export function logicoHD<T extends Obj>(img: T): T {
  if ((img as unknown as { __hd?: boolean }).__hd) return img;
  for (const nombre of ['scaleX', 'scaleY', 'scale'] as const) {
    const d = descriptor(img, nombre);
    if (!d?.get || !d.set) return img;
    const { get, set } = d;
    Object.defineProperty(img, nombre, {
      configurable: true,
      get() {
        const real = get.call(this) as number;
        return dibujando ? real : real / K;
      },
      set(v: number) {
        set.call(this, v * K);
      },
    });
  }
  Object.defineProperty(img, '__hd', { value: true });
  img.scaleX = 1;
  img.scaleY = 1;
  return img;
}

let instalado = false;

/** Engancha la fábrica de imágenes y sprites: las de textura HD pasan a escala lógica sin que nadie lo pida. */
export function instalarHD(): void {
  if (instalado) return;
  instalado = true;
  engancharDibujante();
  const F = Phaser.GameObjects.GameObjectFactory.prototype as unknown as Record<string, (...a: unknown[]) => Obj>;
  for (const tipo of ['image', 'sprite'] as const) {
    const original = F[tipo]!;
    F[tipo] = function (this: unknown, x: unknown, y: unknown, textura: unknown, ...resto: unknown[]) {
      const o = original.call(this, x, y, textura, ...resto);
      return typeof textura === 'string' && esHD(textura) ? logicoHD(o) : o;
    };
  }
}
