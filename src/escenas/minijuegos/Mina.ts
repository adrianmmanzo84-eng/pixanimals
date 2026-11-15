import { crearAnimMina } from '../../ui/animMina';
import Phaser from 'phaser';
import { DATOS } from '../../core/datos';
import { criaturaDe, nombreDe } from '../../core/estado/juego';
import type { ResultadoMinijuego } from '../../core/minijuegos/minijuegos';
import { cobrarMina, DUREZA, Mina, monstruoDe, vencerGuarida, type Bloque, type Direccion, type EventoMina } from '../../core/minijuegos/mina';
import { darXp } from '../../core/progresion/experiencia';
import type { AccionEntrada } from '../../entrada';
import { sonido } from '../../audio/sfx';
import { t } from '../../i18n/i18n';
import { juego } from '../../juego';
import { textura } from '../../ui/criaturas';
import { Texto } from '../../ui/texto';
import { MinijuegoBase, type DatosMinijuego } from './Base';

/** El mundo de la mina vive lejos de la interfaz (x ≥ X0) y lo mira otra cámara, con zoom 2. */
const X0 = 4000;
/** Lado de un bloque en el mundo: arte de 16 px ampliado ×2 (la criatura, de 32 px, ocupa un bloque). */
const TAM = 32;
const TIPOS: Bloque[] = ['tierra', 'piedra', 'dura', 'roca', 'irrompible', 'moneda', 'gema', 'baya', 'cofre', 'corazon', 'pinchos', 'gas', 'lava', 'bomba', 'guarida'];
const COLUMNAS_HOJA = 17;
/** Colores de las astillas al romper cada tipo. */
const ASTILLA: Partial<Record<Bloque, number>> = { tierra: 0x7a4f2e, piedra: 0x80848f, dura: 0x454a5e, roca: 0x80848f, moneda: 0xf2c040, gema: 0x5fe0d0, baya: 0xd8406a, cofre: 0x8a5a2e, corazon: 0xe0304a, pinchos: 0xe6e8f0, gas: 0x78a85a, bomba: 0x1a1a22 };
/** Colores de fondo (arriba y abajo) de cada zona mientras no llegue el arte del autor. */
const FONDO_ZONA = [
  [0x2a1c14, 0x1a120c],
  [0x14222e, 0x0c1620],
  [0x1e1630, 0x120c22],
  [0x2a1210, 0x180808],
  [0x120f22, 0x07060f],
];

/**
 * Mina Pixel: la escena dibuja y anima lo que decide `core/minijuegos/mina.ts`.
 * La interfaz (cabecera, marcador, HUD, resultado) queda en el mundo de 240×160 de siempre, con la cámara de zoom 4;
 * la mina se dibuja aparte y la sigue la cámara principal con zoom 2.
 */
export class MiniMina extends MinijuegoBase {
  protected readonly id = 'mina' as const;
  protected readonly arena = 'bosque' as const;
  protected override conFondo = false;
  private zonaInicio = 1;
  private mina!: Mina;
  private mundo!: Phaser.GameObjects.Container;
  private celdas = new Map<string, { img: Phaser.GameObjects.Image; grieta: Phaser.GameObjects.Image | null; frame: number }>();
  private ocupado = false;
  private cola: Direccion | null = null;
  private hud!: Phaser.GameObjects.Graphics;
  private hudTexto!: Texto;
  private cartel!: Texto;
  private cuadro = 0;

  constructor() {
    super('MiniMina');
  }

  override init(d: DatosMinijuego & { zona?: number }): void {
    super.init(d);
    this.zonaInicio = Math.max(1, d?.zona ?? 1);
    this.celdas = new Map();
    this.ocupado = false;
    this.cola = null;
  }

  override create(): void {
    crearAnimMina(this);
    super.create();
    // Dos cámaras: la principal (zoom 2) mira la mina; otra encima (zoom 4) mira la interfaz.
    const camMina = this.cameras.main;
    camMina.setZoom(2);
    camMina.ignore(this.children.list.filter((o) => o !== this.mundo));
    const camUI = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    camUI.setZoom(4).centerOn(120, 80);
    camUI.ignore(this.mundo);
    this.centrarCamara(true);
    // Las rocas sin apoyo caen solas, un paso cada tanto.
    this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        if (!this.jugando || this.ocupado) return;
        const ev = this.mina.gravedad();
        if (ev.length) void this.animar(ev);
      },
    });
    // Los tesoros a la vista brillan cada tanto.
    this.time.addEvent({ delay: 650, loop: true, callback: () => this.jugando && this.brilloTesoros() });
    // La criatura camina con su animación de dos cuadros.
    this.time.addEvent({ delay: 280, loop: true, callback: () => this.yo?.setFrame((this.cuadro ^= 1)) });
  }

  protected preparar(): void {
    this.mina = new Mina(DATOS, this.zonaInicio, (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
    this.mundo = this.add.container(0, 0);
    this.dibujarFondos();
    const p = this.pos(this.mina.x, this.mina.y);
    this.yo = this.add.sprite(p.x, p.y, textura(this.especie, 'icono'), 0);
    this.mundo.add(this.yo);
    this.sincronizar();
    // HUD bajo la cabecera: corazones, barra de energía, monedas y experiencia.
    this.hud = this.add.graphics();
    this.hudTexto = new Texto(this, 120, 20, 116, 10, '#ffffff', 'der', { tam: 6.6, peso: 600, borde: '#2b3a78' });
    this.cartel = new Texto(this, 0, 60, 240, 16, '#ffffff', 'centro', { tam: 10, peso: 600, borde: '#2b3a78' });
    this.pintarHud();
  }

  protected empezar(): void {
    this.info.poner('');
  }

  protected tecla(a: AccionEntrada): void {
    const dir: Direccion | null = a === 'izquierda' ? 'izq' : a === 'derecha' ? 'der' : a === 'abajo' || a === 'a' ? 'abajo' : null;
    if (!dir) return;
    if (this.ocupado) {
      this.cola = dir;
      return;
    }
    void this.ejecutar(dir);
  }

  private async ejecutar(dir: Direccion): Promise<void> {
    this.ocupado = true;
    if (dir !== 'abajo') this.yo?.setFlipX(dir === 'der');
    await this.animar(this.mina.accion(dir));
    this.ocupado = false;
    const sig = this.cola;
    this.cola = null;
    if (sig && this.jugando) void this.ejecutar(sig);
  }

  override update(tm: number, dt: number): void {
    super.update(tm, dt);
    this.centrarCamara(false);
  }

  /** La cámara sigue a la criatura y la deja en el tercio de arriba, para ver lo que hay debajo. */
  private centrarCamara(inmediato: boolean): void {
    if (!this.yo) return;
    const cam = this.cameras.main;
    const objetivo = this.yo.y + TAM * 1.6;
    const actual = cam.midPoint.y;
    cam.centerOn(X0 + (this.mina.columnas * TAM) / 2, inmediato ? objetivo : actual + (objetivo - actual) * 0.18);
  }

  private pos(x: number, y: number): { x: number; y: number } {
    return { x: X0 + x * TAM + TAM / 2, y: y * TAM + TAM / 2 };
  }

  private dibujarFondos(): void {
    const prof = DATOS.economia.mina.profundidadZona;
    const ancho = this.mina.columnas * TAM;
    // También la zona de arriba: se ve sobre el punto de partida al bajar en ascensor.
    for (let z = Math.max(1, this.zonaInicio - 1); z <= DATOS.economia.mina.zonas.length; z++) {
      const y0 = (z - 1) * prof * TAM;
      const alto = prof * TAM + TAM;
      const clave = `mina_zona${z}`;
      if (this.textures.exists(clave)) {
        // Arte del autor: 960 px de ancho → la mitad en el mundo (la cámara lo vuelve a duplicar).
        const ts = this.add.tileSprite(X0, y0, ancho, alto, clave).setOrigin(0, 0).setTileScale(0.5);
        this.mundo.add(ts);
        continue;
      }
      const g = this.add.graphics();
      const [arriba, abajo] = FONDO_ZONA[z - 1]!;
      const pasos = 16;
      for (let i = 0; i < pasos; i++) {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(arriba), Phaser.Display.Color.ValueToColor(abajo), pasos, i);
        g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).fillRect(X0, y0 + (alto * i) / pasos, ancho, alto / pasos + 1);
      }
      // Puntitos de minerales en el fondo (siempre iguales para cada zona).
      const rnd = new Phaser.Math.RandomDataGenerator([`zona${z}`]);
      for (let i = 0; i < 120; i++) g.fillStyle(0xffffff, rnd.realInRange(0.03, 0.09)).fillRect(X0 + rnd.between(0, ancho), y0 + rnd.between(0, alto), 2, 2);
      this.mundo.add(g);
    }
    // Superficie (zona 1): una franja de cielo y pasto.
    if (this.zonaInicio === 1) {
      const g = this.add.graphics();
      g.fillStyle(0x7ec8f0, 1).fillRect(X0, -TAM * 4, this.mina.columnas * TAM, TAM * 4 + TAM / 2);
      g.fillStyle(0x4caf50, 1).fillRect(X0, TAM - 6, this.mina.columnas * TAM, 6);
      this.mundo.add(g);
    }
  }

  /** Crea, cambia o borra las imágenes de los bloques cerca de la criatura. */
  private sincronizar(): void {
    const desde = this.mina.y - 6;
    const hasta = this.mina.y + 9;
    const vistas = new Set<string>();
    for (let y = Math.max(desde, this.mina.filaInicial); y <= hasta; y++) {
      for (let x = 0; x < this.mina.columnas; x++) {
        const clave = `${x},${y}`;
        const c = this.mina.celda(x, y);
        const actual = this.celdas.get(clave);
        if (c.b === 'aire') {
          if (actual) this.borrar(clave);
          continue;
        }
        vistas.add(clave);
        const zona = c.b === 'guarida' ? this.mina.zonaDe(y) : this.mina.zonaDe(y);
        const frame = (zona - 1) * COLUMNAS_HOJA + TIPOS.indexOf(c.b);
        const p = this.pos(x, y);
        let reg = actual;
        if (!reg) {
          const img = this.add.image(p.x, p.y, 'mina_bloques', frame).setScale(2);
          this.mundo.addAt(img, 1 + DATOS.economia.mina.zonas.length);
          if (c.b === 'lava') this.tweens.add({ targets: img, alpha: 0.82, duration: 500, yoyo: true, repeat: -1 });
          reg = { img, grieta: null, frame };
          this.celdas.set(clave, reg);
        } else if (reg.frame !== frame) {
          reg.img.setFrame(frame);
          reg.frame = frame;
          if (c.b === 'lava') this.tweens.add({ targets: reg.img, alpha: 0.82, duration: 500, yoyo: true, repeat: -1 });
          else {
            this.tweens.killTweensOf(reg.img);
            reg.img.setAlpha(1);
          }
        }
        // Grietas según los golpes que faltan.
        const dureza = DUREZA[c.b];
        const etapa = dureza > 1 && c.resto < dureza ? (c.resto <= dureza / 2 ? 2 : 1) : 0;
        if (etapa && !reg.grieta) {
          reg.grieta = this.add.image(p.x, p.y, 'mina_bloques', (zona - 1) * COLUMNAS_HOJA + 14 + etapa).setScale(2);
          this.mundo.add(reg.grieta);
        } else if (etapa && reg.grieta) reg.grieta.setFrame((zona - 1) * COLUMNAS_HOJA + 14 + etapa);
        else if (!etapa && reg.grieta) {
          reg.grieta.destroy();
          reg.grieta = null;
        }
      }
    }
    for (const clave of [...this.celdas.keys()]) if (!vistas.has(clave)) this.borrar(clave);
    if (this.yo) this.mundo.bringToTop(this.yo);
  }

  private borrar(clave: string): void {
    const r = this.celdas.get(clave);
    if (!r) return;
    this.tweens.killTweensOf(r.img);
    r.img.destroy();
    r.grieta?.destroy();
    this.celdas.delete(clave);
  }

  private mover(x: number, y: number, ms: number): Promise<void> {
    const p = this.pos(x, y);
    return new Promise((r) => this.tweens.add({ targets: this.yo, x: p.x, y: p.y, duration: ms, ease: 'Linear', onComplete: () => r() }));
  }

  private astillas(x: number, y: number, color: number, n = 8): void {
    const p = this.pos(x, y);
    for (let i = 0; i < n; i++) {
      const a = this.add.rectangle(p.x + Phaser.Math.Between(-10, 10), p.y + Phaser.Math.Between(-10, 10), 4, 4, color);
      this.mundo.add(a);
      this.tweens.add({ targets: a, x: a.x + Phaser.Math.Between(-24, 24), y: a.y + Phaser.Math.Between(-30, 10), alpha: 0, angle: 180, duration: 420, ease: 'Quad.easeOut', onComplete: () => a.destroy() });
    }
  }

  /** Reproduce una animación de la mina en coordenadas del mundo y la quita al terminar (las de bucle, a los `ms`). */
  private efecto(clave: string, wx: number, wy: number, op: { angulo?: number; origen?: [number, number]; ms?: number; escala?: number } = {}): Phaser.GameObjects.Sprite | null {
    if (!this.anims.exists(clave)) return null;
    const s = this.add.sprite(wx, wy, clave).setScale(op.escala ?? 2).setAngle(op.angulo ?? 0);
    if (op.origen) s.setOrigin(op.origen[0], op.origen[1]);
    this.mundo.add(s);
    s.play(clave);
    if (op.ms) this.tweens.add({ targets: s, alpha: 0, delay: op.ms - 250, duration: 250, onComplete: () => s.destroy() });
    else s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
    return s;
  }

  /** El pico golpea desde la criatura hacia el bloque: apunta hacia abajo y se gira para los costados. */
  private pico(x: number, y: number): void {
    if (!this.yo) return;
    const dx = x - this.mina.x;
    const angulo = dx > 0 ? -90 : dx < 0 ? 90 : 0;
    const ox = this.yo.x + dx * 8 + (dx === 0 ? 6 : 0);
    const oy = this.yo.y + (dx === 0 ? 4 : 6);
    const s = this.efecto('mina_pico', ox, oy, { angulo, origen: [5 / 16, 1 / 16] });
    if (s && dx < 0) s.setFlipX(true);
  }

  /** Polvo bajo los pies de una celda. */
  private polvo(x: number, y: number): void {
    const p = this.pos(x, y);
    this.efecto('mina_polvo', p.x, p.y + TAM / 2 - 8);
  }

  /** Cada tanto brilla un tesoro visible (moneda, gema o cofre). */
  private brilloTesoros(): void {
    const tesoros = [...this.celdas.keys()].filter((k) => {
      const [x, y] = k.split(',').map(Number) as [number, number];
      const b = this.mina.celda(x, y).b;
      return b === 'moneda' || b === 'gema' || b === 'cofre';
    });
    if (!tesoros.length) return;
    const [x, y] = Phaser.Utils.Array.GetRandom(tesoros).split(',').map(Number) as [number, number];
    const p = this.pos(x, y);
    this.efecto('mina_destello', p.x + Phaser.Math.Between(-9, 9), p.y + Phaser.Math.Between(-9, 9));
  }

  private flotante(x: number, y: number, texto: string, color: string): void {
    // El texto flotante va en la capa de interfaz: se calcula dónde cae la celda en la pantalla.
    const cam = this.cameras.main;
    const p = this.pos(x, y);
    const sx = (p.x - cam.worldView.x) * (cam.zoom / 4);
    const sy = (p.y - cam.worldView.y) * (cam.zoom / 4);
    const tx = new Texto(this, sx - 40, sy - 10, 80, 10, color, 'centro', { tam: 7, peso: 600, borde: '#1a1c2c' }).poner(texto);
    this.cameras.main.ignore(tx.imagen);
    this.tweens.add({ targets: tx.imagen, y: tx.imagen.y - 14, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => tx.imagen.destroy() });
  }

  private async animar(ev: EventoMina[]): Promise<void> {
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i]!;
      switch (e.t) {
        case 'mover':
          await this.mover(e.x, e.y, 90);
          break;
        case 'caer':
          this.sincronizar();
          await this.mover(e.x, e.y, 55);
          if (ev[i + 1]?.t !== 'caer') this.polvo(e.x, e.y);
          break;
        case 'golpe': {
          sonido.tocar('pico');
          this.pico(e.x, e.y);
          this.sincronizar();
          const r = this.celdas.get(`${e.x},${e.y}`);
          if (r) this.tweens.add({ targets: r.img, x: r.img.x + 2, duration: 30, yoyo: true, repeat: 1 });
          this.astillas(e.x, e.y, ASTILLA[this.mina.celda(e.x, e.y).b] ?? 0x888888, 3);
          await this.esperar(70);
          break;
        }
        case 'romper':
          sonido.tocar('rompe');
          this.astillas(e.x, e.y, ASTILLA[e.b] ?? 0x888888, 10);
          if (e.b === 'gas') {
            const p = this.pos(e.x, e.y);
            this.efecto('mina_gas', p.x, p.y, { ms: 1400 });
          }
          this.sincronizar();
          await this.esperar(40);
          break;
        case 'botin': {
          const sonidos = { monedas: 'moneda', xp: 'gema', energia: 'baya', vida: 'cura', item: 'objeto' } as const;
          sonido.tocar(sonidos[e.tipo]);
          const textos = {
            monedas: [`+${e.n}`, '#f5c542'],
            xp: [`+${e.n} XP`, '#7fe0ff'],
            energia: [`+${e.n} ⚡`, '#a7f070'],
            vida: ['+♥', '#ff7a8a'],
            item: [e.item ? DATOS.items.get(e.item)?.nombre ?? '' : '', '#ffffff'],
          } as const;
          const [txt, color] = textos[e.tipo];
          this.flotante(e.x, e.y, txt, color);
          const pb = this.pos(e.x, e.y);
          this.efecto('mina_destello', pb.x - 6, pb.y - 4);
          this.efecto('mina_destello', pb.x + 7, pb.y + 3);
          break;
        }
        case 'dano':
          sonido.tocar('dano');
          this.cameras.main.shake(140, 0.012);
          this.cameras.main.flash(120, 255, 60, 60);
          if (this.yo) this.tweens.add({ targets: this.yo, alpha: 0.3, duration: 80, yoyo: true, repeat: 2 });
          this.flotante(this.mina.x, this.mina.y, `−${e.n} ♥`, '#ff5a6a');
          break;
        case 'explosion':
          sonido.tocar('explota');
          this.cameras.main.shake(260, 0.02);
          this.cameras.main.flash(180, 255, 220, 120);
          {
            const p = this.pos(e.x, e.y);
            if (!this.efecto('mina_explosion', p.x, p.y)) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.astillas(e.x + dx, e.y + dy, 0xff9a3a, 5);
          }
          this.sincronizar();
          await this.esperar(160);
          break;
        case 'roca':
          sonido.tocar('roca');
          this.sincronizar();
          this.polvo(e.x, e.hasta);
          break;
        case 'enfriar':
          sonido.tocar('rompe');
          {
            const p = this.pos(e.x, e.y);
            if (!this.efecto('mina_vapor', p.x, p.y - 6)) this.astillas(e.x, e.y, 0xffd04a, 8);
          }
          this.sincronizar();
          break;
        case 'zona':
          sonido.tocar('zona');
          void this.mostrarCartel(t('mina.entraZona', { n: e.zona, z: t(`mina.zona${e.zona}`) }));
          break;
        case 'guarida':
          sonido.tocar('tesoro');
          await this.mostrarCartel(t('mina.guarida'));
          break;
        case 'fin':
          this.pintarHud();
          await this.esperar(350);
          this.finalizar(e.causa);
          return;
      }
    }
    this.sincronizar();
    this.pintarHud();
  }

  private async mostrarCartel(texto: string): Promise<void> {
    this.cartel.poner(texto);
    this.cartel.imagen.setAlpha(1);
    await this.esperar(1100);
    this.tweens.add({ targets: this.cartel.imagen, alpha: 0, duration: 300 });
  }

  private pintarHud(): void {
    const m = this.mina;
    const g = this.hud.clear();
    g.fillStyle(0x141830, 0.55).fillRoundedRect(2, 20, 236, 11, 3);
    // Corazones
    const max = DATOS.economia.mina.vida;
    for (let i = 0; i < max; i++) {
      const x = 6 + i * 9;
      g.fillStyle(i < m.vida ? 0xe0304a : 0x4a4a5a, 1);
      g.fillCircle(x + 2, 24, 2).fillCircle(x + 5, 24, 2).fillTriangle(x, 24.6, x + 7, 24.6, x + 3.5, 28.5);
    }
    // Energía
    const e = m.energia / DATOS.economia.mina.energia;
    g.fillStyle(0x2a2f45, 1).fillRoundedRect(54, 22.5, 60, 6, 2);
    g.fillStyle(e > 0.3 ? 0xa7f070 : 0xff8a3a, 1).fillRoundedRect(54, 22.5, Math.max(2, 60 * e), 6, 2);
    this.hudTexto.poner(`${m.monedas} 🪙  ${m.xp} XP  ${m.items.length} ✦`);
    this.marcador.poner(t('mina.metros', { n: m.metros }));
  }

  private finalizar(causa: 'vida' | 'energia' | 'guarida'): void {
    void this.terminar(this.mina.puntaje(), this.mina.metros, causa === 'guarida' ? t('mina.guarida') : `${t('mina.bajaste', { n: this.mina.profundidad })} · ${t(causa === 'vida' ? 'mina.finVida' : 'mina.finEnergia')}`);
  }

  /** Cobra el botín (si la partida es con premio) y arma las líneas del resultado; en la guarida, el ascensor o el monstruo. */
  protected override alTerminar(r: ResultadoMinijuego): string[] {
    const res = cobrarMina(DATOS, juego.estado, this.mina, r.conPremio);
    const lineas: string[] = [];
    const mia = criaturaDe(juego.estado, this.especie);
    if (r.conPremio) {
      if (mia && res.xp) darXp(DATOS, mia, res.xp);
      lineas.push(t('mina.botin', { m: res.monedas, x: res.xp, c: mia ? nombreDe(DATOS, mia) : '' }));
      if (res.items.length) lineas.push(t('mina.items', { i: res.items.map((i) => DATOS.items.get(i)?.nombre ?? i).join(', ') }));
    } else lineas.push(t('mina.sinBotin'));
    if (res.guarida) {
      const monstruo = monstruoDe(DATOS, res.guarida);
      if (monstruo) lineas.push(t('mina.monstruoEspera', { n: DATOS.criaturas.get(monstruo)!.nombre }));
      else {
        const v = vencerGuarida(DATOS, juego.estado, res.guarida, Date.now());
        lineas.push(t('mina.guaridaVacia', { n: res.guarida, m: v.monedas }));
        if (res.guarida < DATOS.economia.mina.zonas.length) lineas.push(t('mina.ascensor', { n: res.guarida + 1 }));
      }
    }
    return lineas;
  }

  protected override opcionFinal(): { texto: string; accion: () => void } {
    const z = this.mina.causaFin === 'guarida' ? this.mina.zonaDe(this.mina.y) : null;
    if (z && monstruoDe(DATOS, z)) return { texto: t('mina.enfrentar'), accion: () => this.scene.start('Combate', { ia: 'experta', modo: 'mina', zona: z }) };
    return { texto: t('mj.otra'), accion: () => this.scene.restart({ especie: this.especie, zona: this.zonaInicio }) };
  }
}
