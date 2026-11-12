import Phaser from 'phaser';
import type { MinijuegoId } from '../../esquemas/esquemas';
import { Entrada, type AccionEntrada } from '../../entrada';
import { sonido } from '../../audio/sfx';
import { t } from '../../i18n/i18n';
import { textura } from '../../ui/criaturas';
import { MinijuegoBase } from './Base';

const DURACION = 30;
const SUELO = 140;
const META = 35;

type Tipo = 'baya' | 'dorada' | 'piedra';
const MAPAS: Record<Tipo, { filas: string[]; paleta: Record<string, string> }> = {
  baya: { filas: ['...gg..', '..gg...', '.rrrr..', 'rrwrrr.', 'rrrrrr.', 'rrrrrr.', '.rrrr..'], paleta: { g: '#3f7a30', r: '#d0425a', w: '#ffd6de' } },
  dorada: { filas: ['...gg..', '..gg...', '.yyyy..', 'yywyyy.', 'yyyyoy.', 'yyyyyy.', '.yyyy..'], paleta: { g: '#3f7a30', y: '#f5c542', o: '#e09a20', w: '#fff6c8' } },
  piedra: { filas: ['..aaa..', '.aAAAa.', 'aAAwAAa', 'aAAAAAa', 'aAAAAaa', '.aaaaa.'], paleta: { a: '#5c6170', A: '#9aa0ae', w: '#d6dae2' } },
};

interface Cosa {
  img: Phaser.GameObjects.Image;
  tipo: Tipo;
  vy: number;
}

/** Lluvia de Bayas: mueve a tu criatura con las flechas y atrapa bayas; las piedras te quitan dos. */
export class MiniBayas extends MinijuegoBase {
  protected readonly id: MinijuegoId = 'bayas';
  protected readonly arena = 'pradera' as const;
  private yo!: Phaser.GameObjects.Sprite;
  private cosas: Cosa[] = [];
  private tiempo = 0;
  private proxima = 0;
  private puntos = 0;
  private aturdido = 0;

  constructor() {
    super('MiniBayas');
  }

  protected preparar(): void {
    for (const [tipo, m] of Object.entries(MAPAS)) {
      const clave = `mj_${tipo}`;
      if (this.textures.exists(clave)) continue;
      const tex = this.textures.createCanvas(clave, m.filas[0]!.length, m.filas.length)!;
      m.filas.forEach((fila, y) => [...fila].forEach((ch, x) => {
        if (ch === '.') return;
        tex.context.fillStyle = m.paleta[ch]!;
        tex.context.fillRect(x, y, 1, 1);
      }));
      tex.refresh();
      tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    this.cosas = [];
    this.tiempo = 0;
    this.proxima = 0.4;
    this.puntos = 0;
    this.aturdido = 0;
    this.yo = this.add.sprite(120, SUELO, textura(this.especie, 'icono'), 0).setOrigin(0.5, 1);
    let cuadro = 0;
    this.time.addEvent({ delay: 300, loop: true, callback: () => this.yo.setFrame((cuadro ^= 1)) });
    this.pintarMarcador();
  }

  protected empezar(): void {}

  private pintarMarcador(): void {
    const resta = Math.max(0, Math.ceil(DURACION - this.tiempo));
    this.marcador.poner(t('mj.bayas.marcador', { n: this.puntos, s: resta }));
  }

  protected tecla(a: AccionEntrada): void {
    // Un toque mueve un poco (para el mando táctil); mantener apretado mueve seguido en `paso`.
    if (this.aturdido > 0) return;
    if (a === 'izquierda') this.yo.x = Math.max(14, this.yo.x - 6);
    if (a === 'derecha') this.yo.x = Math.min(226, this.yo.x + 6);
  }

  protected override paso(dt: number): void {
    this.tiempo += dt;
    const avance = Math.min(1, this.tiempo / DURACION);
    if (this.aturdido > 0) {
      this.aturdido -= dt;
      this.yo.setAlpha(Math.floor(this.aturdido * 12) % 2 ? 0.4 : 1);
      if (this.aturdido <= 0) this.yo.setAlpha(1);
    } else {
      const v = 120 * dt;
      if (Entrada.apretada('izquierda')) this.yo.x = Math.max(14, this.yo.x - v);
      if (Entrada.apretada('derecha')) this.yo.x = Math.min(226, this.yo.x + v);
      this.yo.setFlipX(Entrada.apretada('derecha'));
    }

    this.proxima -= dt;
    if (this.proxima <= 0) {
      this.proxima = 0.7 - 0.35 * avance;
      const r = Math.random();
      const tipo: Tipo = r < 0.1 ? 'dorada' : r < 0.32 ? 'piedra' : 'baya';
      const img = this.add.image(16 + Math.random() * 208, 22, `mj_${tipo}`).setScale(1.4);
      this.cosas.push({ img, tipo, vy: 45 + 55 * avance + Math.random() * 15 });
    }

    for (const c of [...this.cosas]) {
      c.img.y += c.vy * dt;
      const atrapada = c.img.y > SUELO - 26 && c.img.y < SUELO && Math.abs(c.img.x - this.yo.x) < 15 && this.aturdido <= 0;
      if (atrapada) {
        if (c.tipo === 'piedra') {
          this.puntos = Math.max(0, this.puntos - 2);
          this.aturdido = 0.7;
          this.cameras.main.shake(120, 0.01);
          sonido.tocar('golpe');
        } else {
          this.puntos += c.tipo === 'dorada' ? 3 : 1;
          sonido.tocar('atrapa');
          this.tweens.add({ targets: this.yo, scaleY: 0.85, duration: 60, yoyo: true });
        }
      }
      if (atrapada || c.img.y > 150) {
        c.img.destroy();
        this.cosas.splice(this.cosas.indexOf(c), 1);
      }
    }
    this.pintarMarcador();
    if (this.tiempo >= DURACION) {
      for (const c of this.cosas) c.img.destroy();
      this.cosas = [];
      void this.terminar(Math.min(1, this.puntos / META), this.puntos, t('mj.bayas.fin', { n: this.puntos }));
    }
  }
}
