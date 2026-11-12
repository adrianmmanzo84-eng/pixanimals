import Phaser from 'phaser';
import type { MinijuegoId } from '../../esquemas/esquemas';
import type { AccionEntrada } from '../../entrada';
import { sonido } from '../../audio/sfx';
import { t } from '../../i18n/i18n';
import { textura } from '../../ui/criaturas';
import { n } from '../../ui/estilo';
import { MinijuegoBase } from './Base';

/** Las 4 teclas en rombo: arriba, izquierda, derecha, abajo. */
const PADS = [
  { x: 120, y: 50, color: 0xd0425a, accion: 'arriba' },
  { x: 88, y: 80, color: 0x3f9be8, accion: 'izquierda' },
  { x: 152, y: 80, color: 0x3fbf6a, accion: 'derecha' },
  { x: 120, y: 110, color: 0xf5b942, accion: 'abajo' },
] as const;
const LADO = 26;
const MAXIMO = 12;

/** Eco: repite la secuencia de flechas; cada vez que la aciertas, se alarga una. */
export class MiniEco extends MinijuegoBase {
  protected readonly id: MinijuegoId = 'eco';
  protected readonly arena = 'bosque' as const;
  private g!: Phaser.GameObjects.Graphics;
  private secuencia: number[] = [];
  private pos = 0;
  private escuchando = false;
  private logrado = 0;

  constructor() {
    super('MiniEco');
  }

  protected override oscurecer(): void {
    this.add.graphics().fillStyle(0x141830, 0.6).fillRect(0, 0, 240, 160);
  }

  protected preparar(): void {
    this.g = this.add.graphics();
    this.secuencia = [];
    this.logrado = 0;
    this.escuchando = false;
    this.add.sprite(120, 80, textura(this.especie, 'icono'), 0).setScale(0.75);
    this.pintar(-1);
    this.marcador.poner(t('mj.eco.marcador', { n: 0 }));
  }

  private pintar(encendido: number): void {
    this.g.clear();
    PADS.forEach((p, i) => {
      const on = i === encendido;
      this.g.fillStyle(0x141830, 0.5).fillRoundedRect(p.x - LADO / 2 + 1, p.y - LADO / 2 + 2, LADO, LADO, 5);
      this.g.fillStyle(on ? 0xffffff : p.color, on ? 1 : 0.55).fillRoundedRect(p.x - LADO / 2, p.y - LADO / 2, LADO, LADO, 5);
      if (on) this.g.fillStyle(p.color, 1).fillRoundedRect(p.x - LADO / 2 + 3, p.y - LADO / 2 + 3, LADO - 6, LADO - 6, 4);
      // Flecha
      const f = n('#ffffff');
      this.g.fillStyle(f, 0.95);
      const s = 6;
      if (p.accion === 'arriba') this.g.fillTriangle(p.x, p.y - s, p.x - s, p.y + s / 2, p.x + s, p.y + s / 2);
      if (p.accion === 'abajo') this.g.fillTriangle(p.x, p.y + s, p.x - s, p.y - s / 2, p.x + s, p.y - s / 2);
      if (p.accion === 'izquierda') this.g.fillTriangle(p.x - s, p.y, p.x + s / 2, p.y - s, p.x + s / 2, p.y + s);
      if (p.accion === 'derecha') this.g.fillTriangle(p.x + s, p.y, p.x - s / 2, p.y - s, p.x - s / 2, p.y + s);
    });
  }

  protected empezar(): void {
    this.secuencia = Array.from({ length: 2 }, () => Math.floor(Math.random() * 4));
    void this.ronda();
  }

  private async ronda(): Promise<void> {
    this.secuencia.push(Math.floor(Math.random() * 4));
    this.escuchando = false;
    this.info.poner(t('mj.eco.mira'));
    await this.esperar(500);
    const paso = Math.max(220, 420 - this.secuencia.length * 18);
    for (const i of this.secuencia) {
      this.pintar(i);
      sonido.tocar(`eco${i}`);
      await this.esperar(paso);
      this.pintar(-1);
      await this.esperar(paso * 0.4);
    }
    this.pos = 0;
    this.escuchando = true;
    this.info.poner(t('mj.eco.tu'));
  }

  protected tecla(a: AccionEntrada): void {
    if (!this.escuchando) return;
    const i = PADS.findIndex((p) => p.accion === a);
    if (i < 0) return;
    this.pintar(i);
    this.time.delayedCall(140, () => this.escuchando && this.pintar(-1));
    if (i !== this.secuencia[this.pos]) {
      this.escuchando = false;
      sonido.tocar('negado');
      this.cameras.main.shake(150, 0.01);
      void this.terminar(Math.min(1, Math.max(0, this.logrado - 2) / 8), this.logrado, t('mj.eco.fin', { n: this.logrado }));
      return;
    }
    sonido.tocar(`eco${i}`);
    this.pos++;
    if (this.pos === this.secuencia.length) {
      this.escuchando = false;
      this.logrado = this.secuencia.length;
      this.marcador.poner(t('mj.eco.marcador', { n: this.logrado }));
      if (this.logrado >= MAXIMO) {
        void this.terminar(1, this.logrado, t('mj.eco.fin', { n: this.logrado }));
        return;
      }
      this.time.delayedCall(450, () => void this.ronda());
    }
  }
}
