import Phaser from 'phaser';
import { DATOS } from '../../core/datos';
import type { MinijuegoId } from '../../esquemas/esquemas';
import { Entrada, type AccionEntrada } from '../../entrada';
import { sonido } from '../../audio/sfx';
import { t } from '../../i18n/i18n';
import { miniatura, textura } from '../../ui/criaturas';
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

interface Rodante {
  img: Phaser.GameObjects.Image;
  vx: number;
}

const GRAVEDAD = 560;
const IMPULSO = 190;

/**
 * Lluvia de Bayas: mueve a tu criatura con las flechas y atrapa bayas; las piedras te quitan dos.
 * Con A (o arriba) salta: alcanza bayas más altas y esquiva las piedras que ruedan por el suelo.
 */
export class MiniBayas extends MinijuegoBase {
  protected readonly id: MinijuegoId = 'bayas';
  protected readonly arena = 'pradera' as const;
  private cosas: Cosa[] = [];
  private tiempo = 0;
  private proxima = 0;
  private puntos = 0;
  private aturdido = 0;
  private rodantes: Rodante[] = [];
  private proximaRodante = 0;
  /** Altura del salto (0 = en el suelo) y velocidad vertical. */
  private altura = 0;
  private vy = 0;
  /** Hacia dónde mira: los sprites miran a la izquierda; mirando a la derecha se espejan. */
  private derecha = false;

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
    this.rodantes = [];
    this.proximaRodante = 5;
    this.altura = 0;
    this.vy = 0;
    this.derecha = false;
    if (this.textures.exists(`${DATOS.criaturas.get(this.especie)!.sprites}_mini`)) {
      // Arte HD (D252): la mini, apoyada en el suelo por los pies.
      this.yo = miniatura(this.add.image(120, SUELO, textura(this.especie, 'frente')), this.especie, 26, 0.4).setOrigin(0.5, 0.985);
    } else {
      this.yo = this.add.sprite(120, SUELO, textura(this.especie, 'icono'), 0).setOrigin(0.5, 1);
      let cuadro = 0;
      this.time.addEvent({ delay: 300, loop: true, callback: () => this.yo!.setFrame((cuadro ^= 1)) });
    }
    this.pintarMarcador();
  }

  protected empezar(): void {}

  /** Piedras que ruedan por el suelo desde un costado: hay que saltarlas. */
  private paseRodantes(dt: number, avance: number): void {
    this.proximaRodante -= dt;
    if (this.proximaRodante <= 0) {
      this.proximaRodante = 3.5 + Math.random() * 2.5 - avance;
      const desdeIzq = Math.random() < 0.5;
      const img = this.add.image(desdeIzq ? -8 : 248, SUELO - 5, 'mj_piedra').setScale(1.6);
      this.rodantes.push({ img, vx: (desdeIzq ? 1 : -1) * (70 + 45 * avance) });
    }
    for (const r of [...this.rodantes]) {
      r.img.x += r.vx * dt;
      r.img.rotation += (r.vx / 6) * dt;
      const choca = this.aturdido <= 0 && this.altura < 10 && Math.abs(r.img.x - this.yo!.x) < 12;
      if (choca) {
        this.puntos = Math.max(0, this.puntos - 2);
        this.aturdido = 0.7;
        this.cameras.main.shake(120, 0.01);
        sonido.tocar('golpe');
      }
      if (choca || r.img.x < -20 || r.img.x > 260) {
        r.img.destroy();
        this.rodantes.splice(this.rodantes.indexOf(r), 1);
      }
    }
  }

  private pintarMarcador(): void {
    const resta = Math.max(0, Math.ceil(DURACION - this.tiempo));
    this.marcador.poner(t('mj.bayas.marcador', { n: this.puntos, s: resta }));
  }

  protected tecla(a: AccionEntrada): void {
    if (this.aturdido > 0) return;
    if ((a === 'a' || a === 'arriba') && this.altura === 0) {
      this.vy = -IMPULSO;
      sonido.tocar('cursor');
      return;
    }
    // Un toque mueve un poco (para el mando táctil); mantener apretado mueve seguido en `paso`.
    if (a === 'izquierda') this.mover(-6);
    if (a === 'derecha') this.mover(6);
  }

  private mover(dx: number): void {
    this.yo!.x = Math.max(14, Math.min(226, this.yo!.x + dx));
    this.derecha = dx > 0;
    this.yo!.setFlipX(this.derecha);
  }

  protected override paso(dt: number): void {
    this.tiempo += dt;
    const avance = Math.min(1, this.tiempo / DURACION);
    if (this.aturdido > 0) {
      this.aturdido -= dt;
      this.yo!.setAlpha(Math.floor(this.aturdido * 12) % 2 ? 0.4 : 1);
      if (this.aturdido <= 0) this.yo!.setAlpha(1);
    } else {
      const v = 120 * dt;
      if (Entrada.apretada('izquierda')) this.mover(-v);
      else if (Entrada.apretada('derecha')) this.mover(v);
    }
    // Salto
    if (this.vy !== 0 || this.altura > 0) {
      this.vy += GRAVEDAD * dt;
      this.altura = Math.max(0, this.altura - this.vy * dt);
      if (this.altura === 0) this.vy = 0;
    }
    this.yo!.y = SUELO - this.altura;
    this.paseRodantes(dt, avance);

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
      const atrapada = c.img.y > this.yo!.y - 26 && c.img.y < this.yo!.y && Math.abs(c.img.x - this.yo!.x) < 15 && this.aturdido <= 0;
      if (atrapada) {
        if (c.tipo === 'piedra') {
          this.puntos = Math.max(0, this.puntos - 2);
          this.aturdido = 0.7;
          this.cameras.main.shake(120, 0.01);
          sonido.tocar('golpe');
          this.globo(t('mj.bayas.auch'), this.yo!.x, this.yo!.y - 34, '#ffb0b0');
        } else {
          this.puntos += c.tipo === 'dorada' ? 3 : 1;
          sonido.tocar('atrapa');
          const sy = this.yo!.scaleY;
          this.tweens.add({ targets: this.yo!, scaleY: sy * 0.85, duration: 60, yoyo: true });
          // ¡A comer! (D252): globo de texto y miguitas; la dorada, con brillos.
          const frases = c.tipo === 'dorada' ? ['mj.bayas.delicioso'] : ['mj.bayas.nam', 'mj.bayas.glup', 'mj.bayas.rico'];
          this.globo(t(frases[Math.floor(Math.random() * frases.length)]!), this.yo!.x, this.yo!.y - 34, c.tipo === 'dorada' ? '#ffe27a' : '#ffffff');
          for (let k = 0; k < 6; k++) {
            const m = this.add.rectangle(this.yo!.x + (Math.random() * 10 - 5), this.yo!.y - 18, 2, 2, c.tipo === 'dorada' ? 0xffd76a : 0xd0425a).setDepth(600);
            this.tweens.add({ targets: m, x: m.x + (Math.random() * 24 - 12), y: m.y - 6 - Math.random() * 10, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => m.destroy() });
          }
          if (c.tipo === 'dorada') this.destellos(this.yo!.x, this.yo!.y - 18, 8);
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
      for (const c of this.rodantes) c.img.destroy();
      this.cosas = [];
      this.rodantes = [];
      void this.terminar(Math.min(1, this.puntos / META), this.puntos, t('mj.bayas.fin', { n: this.puntos }));
    }
  }
}
