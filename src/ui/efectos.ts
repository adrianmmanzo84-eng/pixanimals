import Phaser from 'phaser';
import type { Animacion, EstadoId } from '../esquemas/esquemas';

/**
 * Efectos de ataque en pixel art. Cada partícula es un mini-sprite dibujado por código
 * (se pueden reemplazar por PNG propios más adelante). Cada habilidad elige su efecto
 * con el campo "animacion" de habilidades.json; si no lo tiene, se usa uno según tipo y categoría.
 */
export interface Punto {
  x: number;
  y: number;
}

const PALETA: Record<string, string> = {
  r: '#e03820', o: '#f08030', y: '#f8d030', w: '#ffffff', b: '#2868b8', c: '#4890e0', l: '#a8dcf8',
  g: '#3f7a30', G: '#68b040', L: '#a8d868', d: '#805830', D: '#a87848', p: '#7a3a9a', P: '#b060d0',
  k: '#1f2340', n: '#ffe070',
};

const MAPAS: Record<string, string[]> = {
  llama: ['...r....', '..rr....', '..ror...', '.rooor..', '.royyor.', '.royyor.', '..roor..', '...rr...'],
  gota: ['...b...', '...b...', '..bcb..', '.bclcb.', '.bcccb.', '.bcccb.', '..bbb..'],
  hoja: ['.....gg.', '...gGGg.', '..gGGLg.', '.gGLGg..', '.gLGGg..', 'gGGgg...', '.gg.....'],
  chispa: ['...n...', '...n...', '..nwn..', 'nnwwwnn', '..nwn..', '...n...', '...n...'],
  burbuja: ['..llll..', '.l....l.', 'l.w....l', 'l.w....l', 'l......l', 'l......l', '.l....l.', '..llll..'],
  nota: ['...kk..', '...kkk.', '...k.kk', '...k..k', '...k...', '.kkk...', 'kkkk...', 'kkkk...', '.kk....'],
  zeta: ['PPPPPP', 'pppPPp', '..PPp.', '.PPp..', 'PPpppp', 'PPPPPP'],
  espora: ['.PPP.', 'PPwPP', 'PPPPP', 'pPPPp', '.ppp.'],
  corteza: ['.dddd..', 'dDDDDd.', 'dDdDDDd', 'dDDDdDd', '.dDDDd.', '..ddd..'],
  brillo: ['..L..', '..L..', 'LLwLL', '..L..', '..L..'],
  ola: Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 24 }, (_, x) => {
      const cresta = 5 - Math.round(4 * Math.sin((x / 24) * Math.PI * 2));
      const d = y - cresta;
      return d < 0 ? '.' : d === 0 ? 'w' : d < 3 ? 'l' : y > 12 ? 'b' : 'c';
    }).join(''),
  ),
};

const PARTICULA_TIPO: Record<string, string> = { brasa: 'llama', marea: 'gota', brote: 'hoja', neutro: 'chispa' };
const COLOR_GARRA: Record<string, [number, number]> = {
  brasa: [0xf08030, 0xf8d030],
  marea: [0x4890e0, 0xa8dcf8],
  brote: [0x68b040, 0xa8d868],
  neutro: [0xc8d4dc, 0xffffff],
};

/** Crea una vez las texturas de partículas, con filtro "vecino más cercano" para que se vea el píxel. */
export function crearTexturasEfectos(escena: Phaser.Scene): void {
  for (const [nombre, filas] of Object.entries(MAPAS)) {
    const clave = `fx_${nombre}`;
    if (escena.textures.exists(clave)) continue;
    const tex = escena.textures.createCanvas(clave, filas[0]!.length, filas.length)!;
    filas.forEach((fila, y) =>
      [...fila].forEach((ch, x) => {
        if (ch === '.') return;
        tex.context.fillStyle = PALETA[ch]!;
        tex.context.fillRect(x, y, 1, 1);
      }),
    );
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}

const al = (a: number, b: number) => a + Math.random() * (b - a);

export class Efectos {
  constructor(
    private readonly s: Phaser.Scene,
    private readonly capa: Phaser.GameObjects.Layer,
  ) {}

  // ---------------------------------------------------------------- piezas

  private img(tex: string, x: number, y: number, escala = 1): Phaser.GameObjects.Image {
    const i = this.s.add.image(x, y, `fx_${tex}`).setScale(escala);
    this.capa.add(i);
    return i;
  }

  private graf(): Phaser.GameObjects.Graphics {
    const g = this.s.add.graphics();
    this.capa.add(g);
    return g;
  }

  private tw(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((r) => this.s.tweens.add({ ...cfg, onComplete: () => r() }));
  }

  private espera(ms: number): Promise<void> {
    return new Promise((r) => this.s.time.delayedCall(ms, () => r()));
  }

  /** Una partícula vuela de un punto a otro y desaparece. */
  private async volar(tex: string, a: Punto, b: Punto, dur: number, o: { escala?: number; gira?: boolean; arco?: number } = {}): Promise<void> {
    const i = this.img(tex, a.x, a.y, o.escala ?? 1);
    const arco = o.arco ?? 0;
    const p = { t: 0 };
    await this.tw({
      targets: p,
      t: 1,
      duration: dur,
      onUpdate: () => {
        i.x = a.x + (b.x - a.x) * p.t;
        i.y = a.y + (b.y - a.y) * p.t - Math.sin(p.t * Math.PI) * arco;
        if (o.gira) i.angle = p.t * 540;
      },
    });
    i.destroy();
  }

  /** Partículas que salen disparadas desde un punto. */
  private async estallido(tex: string, en: Punto, cant: number, radio = 20, dur = 320, escala = 1): Promise<void> {
    await Promise.all(
      Array.from({ length: cant }, (_, k) => {
        const ang = (k / cant) * Math.PI * 2 + al(-0.3, 0.3);
        const i = this.img(tex, en.x, en.y, escala);
        return this.tw({ targets: i, x: en.x + Math.cos(ang) * radio, y: en.y + Math.sin(ang) * radio * 0.8, alpha: 0, duration: dur, ease: 'Cubic.easeOut' }).then(() => i.destroy());
      }),
    );
  }

  /** Partículas que suben y se desvanecen (humo, brillos, zetas). */
  private async subir(tex: string, en: Punto, cant: number, dur = 500, ancho = 22): Promise<void> {
    await Promise.all(
      Array.from({ length: cant }, async (_, k) => {
        await this.espera(k * 70);
        const i = this.img(tex, en.x + al(-ancho, ancho), en.y + al(0, 14));
        await this.tw({ targets: i, y: i.y - al(18, 30), alpha: 0, duration: dur });
        i.destroy();
      }),
    );
  }

  /** Anillo de partículas alrededor de un punto: aparece, gira un poco y se va. */
  private async anillo(tex: string, en: Punto, cant: number, desde: number, hasta: number, dur = 420): Promise<void> {
    const ps = Array.from({ length: cant }, () => this.img(tex, en.x, en.y));
    const p = { t: 0 };
    await this.tw({
      targets: p,
      t: 1,
      duration: dur,
      ease: 'Sine.easeOut',
      onUpdate: () =>
        ps.forEach((i, k) => {
          const ang = (k / cant) * Math.PI * 2 + p.t * 1.2;
          const r = desde + (hasta - desde) * p.t;
          i.setPosition(en.x + Math.cos(ang) * r, en.y + Math.sin(ang) * r * 0.85);
          i.setAlpha(p.t < 0.75 ? 1 : (1 - p.t) * 4);
        }),
    });
    ps.forEach((i) => i.destroy());
  }

  /** Tres arañazos hechos de bloques, como un zarpazo. */
  private async garras(en: Punto, tipo: string): Promise<void> {
    const [color, luz] = COLOR_GARRA[tipo] ?? COLOR_GARRA.neutro!;
    const g = this.graf();
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 15; k++) {
        const x = en.x + 12 - k * 1.5 + (j - 1) * 8;
        const y = en.y - 14 + k * 2;
        g.fillStyle(color, 1).fillRect(Math.round(x), Math.round(y), 3, 2);
        if (k > 2 && k < 12) g.fillStyle(luz, 1).fillRect(Math.round(x) + 1, Math.round(y), 1, 2);
      }
      await this.espera(45);
    }
    void this.estallido(PARTICULA_TIPO[tipo] ?? 'chispa', en, 6, 22, 300);
    await this.tw({ targets: g, alpha: 0, duration: 200, delay: 60 });
    g.destroy();
  }

  private async rafaga(tex: string, a: Punto, b: Punto, cant: number, o: { dispersion?: number; dur?: number; arco?: number; gira?: boolean; escala?: number } = {}): Promise<void> {
    const d = o.dispersion ?? 8;
    await Promise.all(
      Array.from({ length: cant }, async (_, k) => {
        await this.espera(k * 38);
        await this.volar(tex, { x: a.x + al(-4, 4), y: a.y + al(-6, 6) }, { x: b.x + al(-d, d), y: b.y + al(-d, d) }, o.dur ?? 260, {
          arco: (o.arco ?? 0) * al(0.4, 1),
          gira: o.gira,
          escala: o.escala,
        });
      }),
    );
  }

  // ---------------------------------------------------------------- efectos

  /** Reproduce el efecto de una habilidad. `yo` es quien la usa; `el`, su rival. */
  async reproducir(anim: Animacion, yo: Punto, el: Punto, tipo: string): Promise<void> {
    try {
      await this.dibujar(anim, yo, el, tipo);
    } catch (e) {
      // Un efecto visual nunca debe detener el combate.
      console.warn('Efecto fallido:', anim, e);
    }
  }

  private async dibujar(anim: Animacion, yo: Punto, el: Punto, tipo: string): Promise<void> {
    const dir = Math.sign(el.x - yo.x) || 1;
    const boca = { x: yo.x + 18 * dir, y: yo.y - 6 };
    switch (anim) {
      case 'zarpazo':
        await this.garras(el, tipo);
        break;
      case 'proyectil':
        await this.rafaga(PARTICULA_TIPO[tipo] ?? 'chispa', boca, el, 6);
        await this.estallido(PARTICULA_TIPO[tipo] ?? 'chispa', el, 6, 18, 260);
        break;
      case 'impacto':
        await this.estallido('chispa', el, 8, 22, 300);
        break;
      case 'llamarada':
        await this.anillo('chispa', yo, 10, 6, 34, 260);
        await this.rafaga('llama', boca, el, 16, { dispersion: 12, dur: 300, escala: 1.5 });
        await Promise.all([this.estallido('llama', el, 12, 30, 420, 1.5), this.subir('llama', el, 6, 420)]);
        break;
      case 'anillo_fuego':
        await this.anillo('llama', yo, 10, 30, 20, 520);
        break;
      case 'grito':
        for (let k = 0; k < 3; k++) {
          void this.anillo('chispa', boca, 8, 4, 30, 320);
          await this.espera(110);
        }
        await this.espera(220);
        break;
      case 'dentellada': {
        // Dos hileras de "dientes" de agua que se cierran sobre el rival.
        const dientes = [-12, -4, 4, 12].flatMap((dx) => [
          this.volar('gota', { x: el.x + dx, y: el.y - 30 }, { x: el.x + dx, y: el.y - 2 }, 150, { escala: 1.4 }),
          this.volar('gota', { x: el.x + dx, y: el.y + 26 }, { x: el.x + dx, y: el.y + 2 }, 150, { escala: 1.4 }),
        ]);
        await Promise.all(dientes);
        await this.estallido('gota', el, 10, 26, 320);
        break;
      }
      case 'burbujas':
        await Promise.all([this.anillo('burbuja', yo, 8, 34, 24, 520), this.subir('burbuja', yo, 4, 520)]);
        break;
      case 'corriente':
        await Promise.all(
          Array.from({ length: 9 }, async (_, k) => {
            await this.espera(k * 45);
            const y = yo.y - 22 + k * 5.5;
            const i = this.img('gota', yo.x - 34 * dir, y).setAngle(dir > 0 ? -90 : 90);
            await this.tw({ targets: i, x: yo.x + 34 * dir, alpha: 0.2, duration: 220 });
            i.destroy();
          }),
        );
        break;
      case 'ola': {
        const olas = [0, 1, 2].map(async (k) => {
          await this.espera(k * 110);
          const i = this.img('ola', yo.x + 10 * dir, el.y + 18 - k * 6, 1.6 + k * 0.5).setFlipX(dir < 0);
          await this.tw({ targets: i, x: el.x + 26 * dir, y: el.y + 4 - k * 6, duration: 420, ease: 'Sine.easeIn' });
          await this.tw({ targets: i, alpha: 0, y: i.y + 8, duration: 140 });
          i.destroy();
        });
        await Promise.all(olas);
        await Promise.all([this.estallido('gota', el, 14, 34, 420, 1.3), this.subir('gota', el, 6, 380)]);
        break;
      }
      case 'corteza':
        await this.anillo('corteza', yo, 8, 40, 18, 420);
        break;
      case 'sol': {
        const rayos = Array.from({ length: 7 }, async (_, k) => {
          await this.espera(k * 60);
          await this.volar('chispa', { x: yo.x + al(-26, 26), y: yo.y - 60 }, { x: yo.x + al(-10, 10), y: yo.y }, 320);
        });
        await Promise.all(rayos);
        await this.subir('brillo', yo, 6, 420);
        break;
      }
      case 'hojas':
        await this.rafaga('hoja', yo, el, 18, { dispersion: 14, dur: 420, arco: 34, gira: true, escala: 1.3 });
        await this.garras(el, 'brote');
        break;
      case 'mirada':
        await this.estallido('chispa', { x: yo.x + 6 * dir, y: yo.y - 12 }, 6, 12, 200);
        await this.rafaga('llama', boca, el, 5, { dispersion: 3, dur: 200 });
        await this.subir('llama', el, 5, 420);
        break;
      case 'arrullo':
        await this.rafaga('nota', boca, el, 5, { dispersion: 10, dur: 620, arco: 22 });
        await this.subir('zeta', { x: el.x, y: el.y - 16 }, 3, 520, 10);
        break;
      case 'polen':
        await Promise.all(
          Array.from({ length: 14 }, async (_, k) => {
            await this.espera(k * 40);
            const x = el.x + al(-24, 24);
            const i = this.img('espora', x, el.y - 44);
            await this.tw({ targets: i, y: el.y + al(-6, 18), x: x + al(-8, 8), duration: 520, ease: 'Sine.easeIn' });
            await this.tw({ targets: i, alpha: 0, duration: 120 });
            i.destroy();
          }),
        );
        break;
      case 'raices': {
        const raices = [-18, -9, 0, 9, 18].map(async (dx, k) => {
          await this.espera(k * 50);
          const g = this.graf().setPosition(el.x + dx, el.y + 28);
          const alto = 30 + (k % 2) * 10;
          for (let y = 0; y < alto; y += 2) g.fillStyle(y > alto - 8 ? 0x68b040 : y % 6 === 0 ? 0xa87848 : 0x805830, 1).fillRect(-2 + Math.round(Math.sin(y / 4) * 2), -y - 2, 4, 2);
          g.scaleY = 0;
          await this.tw({ targets: g, scaleY: 1, duration: 180, ease: 'Back.easeOut' });
          await this.tw({ targets: g, scaleY: 0, duration: 160, delay: 260 });
          g.destroy();
        });
        await Promise.all(raices);
        break;
      }
      case 'rayo': {
        const g = this.graf();
        let x = el.x + al(-10, 10);
        for (let y = el.y - 80; y < el.y; y += 4) {
          x += al(-5, 5) + (el.x - x) * 0.15;
          g.fillStyle(0xffe070, 1).fillRect(Math.round(x) - 2, y, 5, 4);
          g.fillStyle(0xffffff, 1).fillRect(Math.round(x), y, 2, 4);
        }
        for (let k = 0; k < 3; k++) {
          g.setVisible(true);
          await this.espera(55);
          g.setVisible(false);
          await this.espera(40);
        }
        g.destroy();
        await this.estallido('chispa', el, 10, 26, 300);
        break;
      }
      case 'brillo':
        await this.subir('brillo', yo, 6, 420);
        break;
    }
  }

  /** Pequeño efecto que acompaña a un estado (al aplicarse, al hacer daño o al impedir actuar). */
  async estado(estado: EstadoId, en: Punto): Promise<void> {
    if (estado === 'quemadura') await this.subir('llama', en, 5, 380);
    else if (estado === 'veneno') await this.subir('espora', en, 6, 420);
    else if (estado === 'sueno') await this.subir('zeta', { x: en.x + 8, y: en.y - 18 }, 3, 520, 8);
    else await this.estallido('chispa', en, 6, 16, 260);
  }

  async curar(en: Punto): Promise<void> {
    await this.subir('brillo', en, 6, 420);
  }
}
