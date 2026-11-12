import Phaser from 'phaser';
import type { MinijuegoId } from '../../esquemas/esquemas';
import type { AccionEntrada } from '../../entrada';
import { sonido } from '../../audio/sfx';
import { t } from '../../i18n/i18n';
import { textura } from '../../ui/criaturas';
import { C, n } from '../../ui/estilo';
import { Texto } from '../../ui/texto';
import { MinijuegoBase } from './Base';

const RONDAS = 8;
const X0 = 30;
const X1 = 210;
const Y = 92;

/** Golpe Justo: frena el marcador con A dentro de la franja; la franja se achica y el marcador acelera. */
export class MiniGolpe extends MinijuegoBase {
  protected readonly id: MinijuegoId = 'golpe';
  protected readonly arena = 'volcan' as const;
  private g!: Phaser.GameObjects.Graphics;
  private yo!: Phaser.GameObjects.Sprite;
  private aviso!: Texto;
  private ronda = 0;
  private puntos = 0;
  private x = X0;
  private dir = 1;
  private centro = 120;
  private ancho = 34;
  private moviendo = false;

  constructor() {
    super('MiniGolpe');
  }

  protected preparar(): void {
    this.g = this.add.graphics();
    this.yo = this.add.sprite(120, 70, textura(this.especie, 'icono'), 0).setOrigin(0.5, 1);
    this.aviso = new Texto(this, 0, 106, 240, 14, '#ffffff', 'centro', { tam: 10, peso: 600, borde: '#2b3a78' });
    this.ronda = 0;
    this.puntos = 0;
    this.moviendo = false;
    this.nuevaRonda(false);
  }

  private nuevaRonda(mover = true): void {
    this.ronda++;
    this.ancho = Math.max(12, 36 - (this.ronda - 1) * 3);
    this.centro = X0 + this.ancho / 2 + Math.random() * (X1 - X0 - this.ancho);
    this.x = Math.random() < 0.5 ? X0 : X1;
    this.dir = this.x === X0 ? 1 : -1;
    this.moviendo = mover;
    this.marcador.poner(t('mj.golpe.marcador', { r: Math.min(this.ronda, RONDAS), t: RONDAS, n: this.puntos }));
    this.pintar();
  }

  private pintar(): void {
    const g = this.g.clear();
    g.fillStyle(0x141830, 0.8).fillRoundedRect(X0 - 3, Y - 8, X1 - X0 + 6, 16, 4);
    g.fillStyle(C.barraFondo, 1).fillRect(X0, Y - 5, X1 - X0, 10);
    g.fillStyle(0x3fbf6a, 1).fillRect(this.centro - this.ancho / 2, Y - 5, this.ancho, 10);
    g.fillStyle(0xf5e070, 1).fillRect(this.centro - this.ancho * 0.175, Y - 5, this.ancho * 0.35, 10);
    g.fillStyle(n('#ffffff'), 1).fillRect(Math.round(this.x) - 1, Y - 9, 3, 18);
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

  protected tecla(a: AccionEntrada): void {
    if (a !== 'a' || !this.moviendo) return;
    this.moviendo = false;
    const d = Math.abs(this.x - this.centro);
    const pts = d <= this.ancho * 0.175 ? 2 : d <= this.ancho / 2 ? 1 : 0;
    this.puntos += pts;
    this.aviso.poner(t(pts === 2 ? 'mj.golpe.perfecto' : pts === 1 ? 'mj.golpe.bien' : 'mj.golpe.fallo'));
    sonido.tocar(pts === 2 ? 'sube' : pts === 1 ? 'atrapa' : 'negado');
    if (pts > 0) this.tweens.add({ targets: this.yo, y: 60, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
    this.marcador.poner(t('mj.golpe.marcador', { r: this.ronda, t: RONDAS, n: this.puntos }));
    this.time.delayedCall(650, () => {
      this.aviso.poner('');
      if (this.ronda >= RONDAS) void this.terminar(this.puntos / (RONDAS * 2), this.puntos, t('mj.golpe.fin', { n: this.puntos, m: RONDAS * 2 }));
      else this.nuevaRonda();
    });
  }
}
