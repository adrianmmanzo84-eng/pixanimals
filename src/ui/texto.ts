import Phaser from 'phaser';

/**
 * Texto suavizado. El juego se dibuja a 4× (960×640 reales para un mundo de 240×160),
 * así que las letras se renderizan en alta resolución y se ven nítidas y redondeadas,
 * mientras las criaturas y los efectos conservan su píxel grande.
 */
export const ESCALA = 4;
export const FAMILIA = 'Fredoka';
export const ALTO_LINEA = 9;
const TAM = 7.4;

export interface OpcionesTexto {
  /** Alto de letra en unidades del mundo (240×160). */
  tam?: number;
  peso?: 500 | 600;
  /** Contorno alrededor de las letras, para texto sobre fondos ilustrados. */
  borde?: string;
}

const medidor = document.createElement('canvas').getContext('2d')!;
let serie = 0;
const fuente = (tam: number, peso: number) => `${peso} ${tam * ESCALA}px ${FAMILIA}, system-ui, sans-serif`;

export function medir(texto: string, tam = TAM, peso = 500): number {
  medidor.font = fuente(tam, peso);
  return medidor.measureText(texto).width / ESCALA;
}

/** Parte un texto en líneas que caben en el ancho dado (en unidades del mundo). */
export function partir(texto: string, ancho: number, tam = TAM): string[] {
  const lineas: string[] = [];
  for (const parrafo of texto.split('\n')) {
    let linea = '';
    for (const palabra of parrafo.split(' ')) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (linea && medir(prueba, tam) > ancho) {
        lineas.push(linea);
        linea = palabra;
      } else linea = prueba;
    }
    lineas.push(linea);
  }
  return lineas;
}

export class Texto {
  readonly imagen: Phaser.GameObjects.Image;
  private readonly tex: Phaser.Textures.CanvasTexture;
  private actual = '';
  private colorActual: string;
  private readonly tam: number;
  private readonly peso: number;
  private readonly borde: string | undefined;

  constructor(
    escena: Phaser.Scene,
    x: number,
    y: number,
    private readonly ancho: number,
    private readonly alto: number,
    color = '#1a1c2c',
    private readonly alineado: 'izq' | 'der' | 'centro' = 'izq',
    opciones: OpcionesTexto = {},
  ) {
    const clave = `txt${serie++}`;
    this.tam = opciones.tam ?? TAM;
    this.peso = opciones.peso ?? 500;
    this.borde = opciones.borde;
    this.tex = escena.textures.createCanvas(clave, ancho * ESCALA, alto * ESCALA)!;
    this.imagen = escena.add.image(x, y, clave).setOrigin(0, 0).setScale(1 / ESCALA);
    this.colorActual = color;
    // Al cerrar la escena se libera la textura para no acumular memoria entre combates.
    escena.events.once(Phaser.Scenes.Events.SHUTDOWN, () => escena.textures.remove(clave));
  }

  /** Dibuja el texto (ya partido en líneas con \n). */
  poner(texto: string, color = this.colorActual): this {
    if (texto === this.actual && color === this.colorActual) return this;
    this.actual = texto;
    this.colorActual = color;
    const ctx = this.tex.context;
    ctx.clearRect(0, 0, this.ancho * ESCALA, this.alto * ESCALA);
    ctx.font = fuente(this.tam, this.peso);
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    const salto = ALTO_LINEA * (this.tam / TAM);
    texto.split('\n').forEach((linea, i) => {
      const w = ctx.measureText(linea).width / ESCALA;
      const x = this.alineado === 'izq' ? 0.5 : this.alineado === 'der' ? this.ancho - w - 0.5 : (this.ancho - w) / 2;
      const y = this.tam * 0.9 + i * salto;
      if (this.borde) {
        ctx.strokeStyle = this.borde;
        ctx.lineWidth = ESCALA * 1.6;
        ctx.strokeText(linea, x * ESCALA, y * ESCALA);
      }
      ctx.fillStyle = color;
      ctx.fillText(linea, x * ESCALA, y * ESCALA);
    });
    this.tex.refresh();
    return this;
  }

  visible(v: boolean): this {
    this.imagen.setVisible(v);
    return this;
  }
}
