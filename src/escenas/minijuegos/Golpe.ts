import Phaser from 'phaser';
import type { MinijuegoId } from '../../esquemas/esquemas';
import type { AccionEntrada } from '../../entrada';
import { sonido } from '../../audio/sfx';
import { t } from '../../i18n/i18n';
import { marcaCriatura } from '../../ui/criaturas';
import { C, n } from '../../ui/estilo';
import { Texto } from '../../ui/texto';
import { MinijuegoBase } from './Base';

/** Golpes del minijuego (el límite total). */
const RONDAS = 8;
const X0 = 30;
const X1 = 210;
/** Barra del marcador (más abajo: arriba están la criatura y el objetivo). */
const Y = 112;
/** Dónde está tu criatura y dónde el objetivo. */
const YO = { x: 72, y: 70 };
const BLANCO = { x: 160, y: 66 };
/** Hoja de bloques de la Mina (16×16, 17 columnas por zona; columnas 15 y 16: grietas). */
const COLUMNAS_HOJA = 17;

/**
 * Objetivos para romper (D252): bloques de la Mina, cada uno con su dureza (daño necesario).
 * Un golpe Perfecto hace 2 de daño, uno Bien hace 1 y un fallo, 0.
 */
const OBJETIVOS = [
  { id: 'tierra', col: 0, dureza: 2, color: 0x8a5a3a },
  { id: 'piedra', col: 1, dureza: 3, color: 0x9aa0a8 },
  { id: 'dura', col: 2, dureza: 4, color: 0x4a4e5e },
  { id: 'roca', col: 3, dureza: 5, color: 0x7a7e88 },
  { id: 'metal', col: 4, dureza: 6, color: 0x3a3c48 },
] as const;
type Objetivo = (typeof OBJETIVOS)[number];

/**
 * Golpe Justo: frena el marcador con A dentro de la franja y tu criatura embiste el objetivo. Cada golpe lo
 * agrieta según el daño; al romperse sale volando en pedazos y llega otro más duro. La franja se achica y el
 * marcador acelera; hay 8 golpes en total. El puntaje sigue siendo el daño hecho (0 a 16).
 */
export class MiniGolpe extends MinijuegoBase {
  protected readonly id: MinijuegoId = 'golpe';
  protected readonly arena = 'volcan' as const;
  private g!: Phaser.GameObjects.Graphics;
  private aviso!: Texto;
  private ronda = 0;
  private puntos = 0;
  private rotos = 0;
  private x = X0;
  private dir = 1;
  private centro = 120;
  private ancho = 34;
  private moviendo = false;
  private golpeando = false;
  // Objetivo actual
  private obj: Objetivo = OBJETIVOS[0];
  private zona = 1;
  private dano = 0;
  private bloque: Phaser.GameObjects.Image | null = null;
  private grieta: Phaser.GameObjects.Image | null = null;
  private lineas!: Phaser.GameObjects.Graphics;
  private barraVida!: Phaser.GameObjects.Graphics;
  private grietas: { x: number; y: number }[][] = [];

  constructor() {
    super('MiniGolpe');
  }

  protected preparar(): void {
    // Los bloques son pixel art de 16×16: se amplían sin suavizado.
    this.textures.get('mina_bloques').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.g = this.add.graphics();
    this.yo = marcaCriatura(this, YO.x, YO.y, this.especie, 30);
    this.tweens.killTweensOf(this.yo);
    this.yo.setY(YO.y);
    this.lineas = this.add.graphics().setDepth(3);
    this.barraVida = this.add.graphics().setDepth(3);
    this.aviso = new Texto(this, 0, 124, 240, 14, '#ffffff', 'centro', { tam: 10, peso: 600, borde: '#2b3a78' });
    this.ronda = 0;
    this.puntos = 0;
    this.rotos = 0;
    this.moviendo = false;
    this.golpeando = false;
    this.nuevoObjetivo(false);
    this.nuevaRonda(false);
  }

  // ---------------------------------------------------------------- objetivo

  /** El siguiente objetivo: cada uno roto sube la dureza posible. */
  private nuevoObjetivo(entrar = true): void {
    const tope = Math.min(OBJETIVOS.length - 1, 1 + this.rotos);
    this.obj = OBJETIVOS[Phaser.Math.Between(Math.max(0, tope - 2), tope)]!;
    this.zona = Phaser.Math.Between(1, 5);
    this.dano = 0;
    this.grietas = [];
    this.lineas.clear();
    this.grieta?.destroy();
    this.grieta = null;
    this.bloque?.destroy();
    const base = (this.zona - 1) * COLUMNAS_HOJA;
    this.bloque = this.add.image(entrar ? 260 : BLANCO.x, BLANCO.y, 'mina_bloques', base + this.obj.col).setScale(3).setDepth(2);
    // Sombra en el piso.
    if (entrar) this.tweens.add({ targets: this.bloque, x: BLANCO.x, duration: 320, ease: 'Back.easeOut' });
    this.pintarVida();
  }

  /** Puntitos de dureza que le quedan al objetivo, debajo de él. */
  private pintarVida(): void {
    const g = this.barraVida.clear();
    const d = this.obj.dureza;
    const ancho = d * 5 - 1;
    for (let i = 0; i < d; i++) g.fillStyle(i < d - this.dano ? 0xf5c542 : 0x3a3f58, 1).fillRect(BLANCO.x - ancho / 2 + i * 5, BLANCO.y + 28, 4, 3);
  }

  /** Grietas: las del dibujo de la Mina y, además, líneas desde el punto del golpe (una más por daño). */
  private agrietar(dano: number): void {
    if (!this.bloque) return;
    const base = (this.zona - 1) * COLUMNAS_HOJA;
    const frac = this.dano / this.obj.dureza;
    const etapa = frac >= 2 / 3 ? 2 : frac >= 1 / 3 ? 1 : 0;
    if (etapa) {
      if (!this.grieta) this.grieta = this.add.image(BLANCO.x, BLANCO.y, 'mina_bloques', base + 14 + etapa).setScale(3).setDepth(2.5);
      else this.grieta.setFrame(base + 14 + etapa);
    }
    for (let k = 0; k < dano; k++) {
      const linea = [{ x: BLANCO.x - 20 + Phaser.Math.Between(-2, 6), y: BLANCO.y + Phaser.Math.Between(-10, 10) }];
      let ang = Phaser.Math.FloatBetween(-0.7, 0.7);
      for (let s = 0; s < 4; s++) {
        const p = linea[linea.length - 1]!;
        ang += Phaser.Math.FloatBetween(-0.6, 0.6);
        linea.push({ x: Math.min(BLANCO.x + 22, p.x + Math.cos(ang) * 8), y: Phaser.Math.Clamp(p.y + Math.sin(ang) * 8, BLANCO.y - 22, BLANCO.y + 22) });
      }
      this.grietas.push(linea);
    }
    const g = this.lineas.clear();
    for (const l of this.grietas) {
      g.lineStyle(1.4, 0x141018, 0.9).beginPath().moveTo(l[0]!.x, l[0]!.y);
      for (const p of l.slice(1)) g.lineTo(p.x, p.y);
      g.strokePath();
      g.lineStyle(0.6, 0xffffff, 0.35).beginPath().moveTo(l[0]!.x + 0.6, l[0]!.y + 0.6);
      for (const p of l.slice(1)) g.lineTo(p.x + 0.6, p.y + 0.6);
      g.strokePath();
    }
  }

  /** Se rompe: pedazos volando, polvo y el siguiente objetivo. */
  private romper(): void {
    if (!this.bloque) return;
    this.rotos++;
    sonido.tocar('golpe_fuerte');
    this.cameras.main.shake(140, 0.01);
    const color = this.obj.color;
    for (let i = 0; i < 14; i++) {
      const lado = Phaser.Math.Between(3, 7);
      const p = this.add.rectangle(BLANCO.x + Phaser.Math.Between(-16, 16), BLANCO.y + Phaser.Math.Between(-16, 16), lado, lado, i % 3 ? color : 0xffffff, 1).setDepth(4).setStrokeStyle(0.6, 0x141018);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-10, 46),
        y: p.y + Phaser.Math.Between(-34, 30),
        angle: Phaser.Math.Between(-240, 240),
        alpha: 0,
        duration: Phaser.Math.Between(420, 700),
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
    this.destellos(BLANCO.x, BLANCO.y, 14);
    const b = this.bloque;
    this.bloque = null;
    this.grieta?.destroy();
    this.grieta = null;
    this.lineas.clear();
    b.destroy();
    this.barraVida.clear();
    this.aviso.poner(t('mj.golpe.roto'));
    this.time.delayedCall(260, () => this.nuevoObjetivo(true));
  }

  // ---------------------------------------------------------------- marcador

  private nuevaRonda(mover = true): void {
    this.ronda++;
    this.ancho = Math.max(12, 36 - (this.ronda - 1) * 3);
    this.centro = X0 + this.ancho / 2 + Math.random() * (X1 - X0 - this.ancho);
    this.x = Math.random() < 0.5 ? X0 : X1;
    this.dir = this.x === X0 ? 1 : -1;
    this.moviendo = mover;
    this.ponerMarcador();
    this.pintar();
  }

  private ponerMarcador(): void {
    this.marcador.poner(t('mj.golpe.marcador2', { r: Math.min(this.ronda, RONDAS), t: RONDAS, n: this.puntos, k: this.rotos }));
  }

  private pintar(): void {
    const g = this.g.clear();
    g.fillStyle(0x141830, 0.8).fillRoundedRect(X0 - 3, Y - 8, X1 - X0 + 6, 16, 4);
    g.fillStyle(C.barraFondo, 1).fillRect(X0, Y - 5, X1 - X0, 10);
    g.fillStyle(0x3fbf6a, 1).fillRect(this.centro - this.ancho / 2, Y - 5, this.ancho, 10);
    g.fillStyle(0xf5e070, 1).fillRect(this.centro - this.ancho * 0.175, Y - 5, this.ancho * 0.35, 10);
    g.fillStyle(n('#ffffff'), 1).fillRect(Math.round(this.x) - 1, Y - 9, 3, 18);
    // Sombras de tu criatura y del objetivo en el piso.
    g.fillStyle(0x000000, 0.28).fillEllipse(YO.x, YO.y + 15, 26, 5).fillEllipse(BLANCO.x, BLANCO.y + 25, 44, 6);
  }

  protected empezar(): void {
    this.moviendo = true;
  }

  protected override paso(dt: number): void {
    if (!this.moviendo) return;
    this.x += this.dir * (95 + this.ronda * 16) * dt;
    if (this.x >= X1) [this.x, this.dir] = [X1, -1];
    if (this.x <= X0) [this.x, this.dir] = [X0, 1];
    this.pintar();
  }

  /** Embestida: la criatura se lanza contra el objetivo y vuelve (más fuerte con Perfecto). */
  private async embestir(pts: number): Promise<void> {
    const yo = this.yo;
    if (!yo) return;
    this.golpeando = true;
    this.tweens.killTweensOf(yo);
    const hasta = pts > 0 ? BLANCO.x - 34 : BLANCO.x - 44;
    await new Promise<void>((r) => this.tweens.add({ targets: yo, x: hasta, y: YO.y - 4, duration: 110, ease: 'Quad.easeIn', onComplete: () => r() }));
    // Contacto.
    if (pts > 0) {
      sonido.tocar(pts === 2 ? 'golpe_fuerte' : 'golpe');
      this.destellos(BLANCO.x - 20, BLANCO.y, pts === 2 ? 10 : 5);
      if (this.bloque) this.tweens.add({ targets: [this.bloque, this.grieta].filter(Boolean), x: BLANCO.x + (pts === 2 ? 4 : 2), duration: 50, yoyo: true, repeat: 1 });
      if (pts === 2) this.cameras.main.shake(90, 0.006);
    } else sonido.tocar('negado');
    await new Promise<void>((r) => this.tweens.add({ targets: yo, x: YO.x, y: YO.y, duration: 220, ease: 'Back.easeOut', onComplete: () => r() }));
    this.golpeando = false;
  }

  protected tecla(a: AccionEntrada): void {
    if (a !== 'a' || !this.moviendo || this.golpeando) return;
    this.moviendo = false;
    const d = Math.abs(this.x - this.centro);
    const pts = d <= this.ancho * 0.175 ? 2 : d <= this.ancho / 2 ? 1 : 0;
    this.puntos += pts;
    this.aviso.poner(t(pts === 2 ? 'mj.golpe.perfecto' : pts === 1 ? 'mj.golpe.bien' : 'mj.golpe.fallo'));
    if (pts === 2) {
      this.time.delayedCall(200, () => sonido.grito(this.especie));
      this.cameras.main.flash(90, 255, 240, 160);
    }
    void this.embestir(pts).then(() => {
      if (pts > 0) {
        this.dano = Math.min(this.obj.dureza, this.dano + pts);
        this.agrietar(pts);
        this.pintarVida();
        if (this.dano >= this.obj.dureza) this.romper();
      }
      this.ponerMarcador();
    });
    this.time.delayedCall(820, () => {
      this.aviso.poner('');
      if (this.ronda >= RONDAS)
        void this.terminar(this.puntos / (RONDAS * 2), this.puntos, t('mj.golpe.fin2', { n: this.puntos, m: RONDAS * 2, k: this.rotos }));
      else this.nuevaRonda();
    });
  }
}
