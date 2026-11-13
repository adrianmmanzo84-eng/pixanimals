import Phaser from 'phaser';
import { tipoDeLaSemana } from '../core/modos/semanal';
import { Puntero } from '../ui/puntero';
import { iconoItem } from '../ui/iconos';
import type { SobreDef } from '../esquemas/esquemas';
import { cantidad } from '../core/items/items';
import { DATOS } from '../core/datos';
import { Rng } from '../core/rng';
import { abrirSobre, cartaInicial, costoDe, ORDEN_RAREZA, probConIncienso, sobresGratis, type Carta } from '../core/sobres/sobres';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { COLOR_RAREZA, estrellas, miniatura, textura } from '../ui/criaturas';
import { C, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { Texto } from '../ui/texto';

function duracion(ms: number): string {
  const min = Math.ceil(ms / 60000);
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

/** Tienda y apertura de sobres. Las probabilidades y el pity se muestran siempre. */
const FILAS = 8;

/** Color del sobre: el suyo, o el de su tipo. */
function colorSobre(s: SobreDef): number {
  return s.color ? n(s.color) : s.tipo ? (COLOR_TIPO[s.tipo] ?? 0x5aa9f0) : 0x5aa9f0;
}

export class Sobres extends Phaser.Scene {
  private sel = 0;
  private nombres: Texto[] = [];
  private costos: Texto[] = [];
  private probs: Texto[] = [];
  private pie!: Texto;
  private recursos!: Texto;
  private cursor!: Phaser.GameObjects.Graphics;
  private alPulsar: ((a: AccionEntrada) => void) | null = null;
  private bienvenida = false;
  private scroll = 0;
  private fijarScroll = false;
  private colores!: Phaser.GameObjects.Graphics;
  private puntero: Puntero | null = null;

  constructor() {
    super('Sobres');
  }

  init(datos: { bienvenida?: boolean }): void {
    // El sobre de bienvenida solo existe una vez por partida, se pida como se pida.
    this.bienvenida = !!datos?.bienvenida && !juego.estado.bienvenida;
    this.nombres = [];
    this.costos = [];
    this.probs = [];
    this.alPulsar = null;
  }

  create(): void {
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    Entrada.escuchar((a) => this.alPulsar?.(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));

    if (this.bienvenida) {
      void this.elegirInicial().then(() => this.scene.start('Menu'));
      return;
    }

    const g = this.add.graphics();
    new Texto(this, 6, 3, 100, 14, '#ffffff', 'izq', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('sobres.titulo'));
    this.recursos = new Texto(this, 100, 6, 134, 10, '#ffffff', 'der', { borde: '#2b3a78' });
    ventana(g, 4, 20, 122, 92);
    ventana(g, 130, 20, 106, 92);
    ventana(g, 4, 116, 232, 40);
    // Lista con desplazamiento: FILAS sobres a la vista.
    this.colores = this.add.graphics();
    for (let k = 0; k < FILAS; k++) {
      this.nombres.push(new Texto(this, 22, 25 + k * 11, 70, 10));
      this.costos.push(new Texto(this, 78, 25 + k * 11, 42, 10, C.tinta, 'der'));
    }
    new Texto(this, 136, 25, 96, 10, C.tintaSuave).poner(t('sobres.prob'));
    for (let i = 0; i < 8; i++) this.probs.push(new Texto(this, 136, 35 + i * 9.5, 96, 10));
    this.pie = new Texto(this, 10, 121, 220, 30);
    this.cursor = this.add.graphics();
    this.puntero = new Puntero(this);
    for (let k = 0; k < FILAS; k++)
      this.puntero.zona(8, 24 + k * 11, 116, 11, () => {
        const i = this.scroll + k;
        if (this.alPulsar !== this.enLista || i === this.sel || i >= DATOS.sobres.sobres.length) return;
        this.sel = i;
        this.fijarScroll = true;
        sonido.tocar('cursor');
        this.pintar();
      });
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.alPulsar === this.enLista && this.pintar() });
    this.alPulsar = this.enLista;
    this.pintar();
  }

  private readonly enLista = (a: AccionEntrada): void => {
    const total = DATOS.sobres.sobres.length;
    if (a === 'arriba' || a === 'abajo') {
      this.sel = (this.sel + (a === 'abajo' ? 1 : total - 1)) % total;
      sonido.tocar('cursor');
      this.pintar();
    } else if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Menu');
    } else if (a === 'a') {
      const def = DATOS.sobres.sobres[this.sel]!;
      const cartas = abrirSobre(DATOS, juego.estado, def.id, new Rng((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0), Date.now());
      if (!Array.isArray(cartas)) {
        sonido.tocar('negado');
        this.pie.poner(t('sobres.sinMonedas'), C.resalte);
        return;
      }
      juego.guardar();
      sonido.tocar('aceptar');
      this.alPulsar = null;
      void this.animar(cartas, colorSobre(def), def.nombre).then(() => this.scene.restart({}));
    }
  };

  private pintar(): void {
    const estado = juego.estado;
    const ahora = Date.now();
    const gratis = sobresGratis(DATOS, estado, ahora);
    const lista = DATOS.sobres.sobres;
    if (!this.fijarScroll) this.scroll = Math.max(0, Math.min(this.sel - Math.floor(FILAS / 2), lista.length - FILAS));
    this.fijarScroll = false;
    this.recursos.poner(`${t('rec.monedas', { n: estado.monedas })} · ${t('rec.esencia', { n: estado.esencia })}`);
    this.colores.clear();
    for (let k = 0; k < FILAS; k++) {
      const i = this.scroll + k;
      const s = lista[i];
      if (!s) {
        this.nombres[k]!.poner('');
        this.costos[k]!.poner('');
        continue;
      }
      const pago = costoDe(DATOS, estado, s.id, ahora);
      const color = i === this.sel ? C.resalte : pago.puede ? C.tinta : C.apagado;
      this.nombres[k]!.poner(s.nombre, color);
      this.costos[k]!.poner(pago.gratis ? t('sobres.gratis', { n: gratis.disponibles }) : (pago.costo < s.costo ? '★' : '') + String(pago.costo), color);
      // Muestra del color del sobre.
      this.colores.fillStyle(colorSobre(s), 1).fillRoundedRect(15, 26 + k * 11, 5, 7, 1);
    }
    if (this.scroll > 0) this.colores.fillStyle(n(C.tintaSuave), 1).fillTriangle(62, 23, 66, 23, 64, 21);
    if (this.scroll + FILAS < lista.length) this.colores.fillStyle(n(C.tintaSuave), 1).fillTriangle(62, 109, 66, 109, 64, 111);
    const y = 27 + (this.sel - this.scroll) * 11;
    this.cursor.clear().fillStyle(n(C.resalte), 1).fillTriangle(9, y, 9, y + 6, 13, y + 3);
    this.puntero?.marcar(this.sel, this.nombres[this.sel - this.scroll]?.imagen);

    const def = DATOS.sobres.sobres[this.sel]!;
    const prob = probConIncienso(def.prob, estado, ahora);
    const pct = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
    ORDEN_RAREZA.forEach((r, i) => this.probs[i]!.poner(`${estrellas(r)}  ${pct(prob[r])} %`, COLOR_RAREZA[r]));
    this.probs[4]!.poner(t('sobres.brillante', { n: DATOS.sobres.brillanteUnoEn }), C.tintaSuave);
    this.probs[5]!.poner(t('sobres.pity.rara', { n: Math.max(1, DATOS.sobres.pity.rara - estado.pity.rara + 1) }), C.tintaSuave);
    this.probs[6]!.poner(t('sobres.pity.epica', { n: Math.max(1, DATOS.sobres.pity.epica - estado.pity.epica + 1) }), C.tintaSuave);
    this.probs[7]!.poner(
      def.probItem >= 100 ? t('sobres.soloItems') : t('sobres.mezcla', { i: def.probItem, e: def.probEtapa2 }),
      '#257179',
    );

    const contenido = t('sobres.contenido', {
      extra: def.probItem >= 100 ? t('sobres.botiquin') : def.tipo ? t('sobres.soloTipo', { tipo: DATOS.tipos.get(def.tipo)!.nombre }) : t('sobres.cualquiera'),
    });
    const incienso = Math.ceil((estado.incienso.hasta - ahora) / 60_000);
    const reloj =
      incienso > 0
        ? t('sobres.incienso', { m: incienso })
        : gratis.disponibles > 0
          ? t('sobres.gratisListo', { n: gratis.disponibles })
          : t('sobres.proximo', { t: duracion(gratis.faltaMs) });
    const tipoSemana = tipoDeLaSemana(DATOS, ahora);
    const semana = t('sobres.semana', { t: DATOS.tipos.get(tipoSemana)!.nombre, d: DATOS.economia.semanal.descuento });
    this.pie.poner([contenido, def.tipo === tipoSemana ? semana : reloj, t('sobres.ayuda')].join('\n'), C.tinta);
  }

  private esperarA(): Promise<void> {
    return new Promise((r) => {
      this.alPulsar = (a) => {
        if (a !== 'a') return;
        this.alPulsar = null;
        r();
      };
    });
  }

  private tw(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((r) => this.tweens.add({ ...cfg, onComplete: () => r() }));
  }

  /** Animación de apertura: el sobre tiembla, se abre y las 3 cartas se revelan una por una. */
  private async animar(cartas: Carta[], color: number, titulo: string): Promise<void> {
    this.add.graphics().fillStyle(0x141830, 0.86).fillRect(0, 0, 240, 160);
    const rotulo = new Texto(this, 0, 6, 240, 14, '#ffffff', 'centro', { tam: 11, peso: 600 }).poner(titulo);
    const pie = new Texto(this, 0, 146, 240, 10, '#ffffff', 'centro');

    const sobre = this.add.graphics().setPosition(120, 82);
    sobre.fillStyle(0x10142c, 1).fillRoundedRect(-25, -35, 50, 70, 5);
    sobre.fillStyle(color, 1).fillRoundedRect(-23, -33, 46, 66, 4);
    sobre.fillStyle(0xffffff, 0.35).fillRoundedRect(-23, -33, 46, 16, 4);
    sobre.fillStyle(0xffffff, 0.9).fillCircle(0, 4, 9);
    sobre.fillStyle(color, 1).fillCircle(0, 4, 5);
    sonido.tocar('estado');
    await this.tw({ targets: sobre, angle: { from: -7, to: 7 }, duration: 90, yoyo: true, repeat: 4 });
    sonido.tocar('final');
    this.cameras.main.flash(220, 255, 255, 255);
    await this.tw({ targets: sobre, scaleX: 1.6, scaleY: 1.6, alpha: 0, duration: 200 });
    sobre.destroy();

    const mazo = cartas.map((_, i) => {
      const cont = this.add.container(46 + i * 74, 190);
      let dorso: Phaser.GameObjects.GameObject;
      if (this.textures.exists('carta_dorso')) dorso = this.add.image(0, 0, 'carta_dorso');
      else {
        const gr = this.add.graphics();
        gr.fillStyle(0x10142c, 1).fillRoundedRect(-31, -46, 62, 92, 5);
        gr.fillStyle(n(C.marco), 1).fillRoundedRect(-29, -44, 58, 88, 4);
        gr.fillStyle(n(C.marcoClaro), 1).fillRoundedRect(-23, -38, 46, 76, 3);
        gr.fillStyle(n(C.marco), 1).fillCircle(0, 0, 12);
        gr.fillStyle(0xffffff, 1).fillCircle(0, 0, 6);
        dorso = gr;
      }
      cont.add(dorso);
      return cont;
    });
    await Promise.all(mazo.map((c, i) => this.tw({ targets: c, y: 82, duration: 260, delay: i * 90, ease: 'Back.easeOut' })));

    for (let i = 0; i < cartas.length; i++) {
      pie.poner(t('sobres.revelar'));
      await this.esperarA();
      const carta = cartas[i]!;
      const cont = mazo[i]!;
      await this.tw({ targets: cont, scaleX: 0, duration: 110 });
      cont.removeAll(true);
      this.cara(cont, carta);
      const buena = carta.rareza === 'rara' || carta.rareza === 'epica' || (carta.clase === 'criatura' && carta.brillante);
      sonido.tocar(buena ? 'victoria' : carta.clase === 'criatura' && carta.resultado === 'repetida' ? 'cursor' : 'sube');
      if (buena) this.cameras.main.flash(180, 255, 240, 180);
      await this.tw({ targets: cont, scaleX: 1, duration: 130 });
      if (buena) await this.tw({ targets: cont, scaleX: 1.08, scaleY: 1.08, duration: 110, yoyo: true });
    }
    rotulo.poner(titulo);
    pie.poner(t('sobres.continuar'));
    await this.esperarA();
  }

  /** Dorso de carta (la ilustración, o uno dibujado si falta). */
  private dorso(): Phaser.GameObjects.GameObject {
    if (this.textures.exists('carta_dorso')) return this.add.image(0, 0, 'carta_dorso');
    const gr = this.add.graphics();
    gr.fillStyle(0x10142c, 1).fillRoundedRect(-31, -46, 62, 92, 5);
    gr.fillStyle(n(C.marco), 1).fillRoundedRect(-29, -44, 58, 88, 4);
    gr.fillStyle(n(C.marcoClaro), 1).fillRoundedRect(-23, -38, 46, 76, 3);
    gr.fillStyle(n(C.marco), 1).fillCircle(0, 0, 12);
    gr.fillStyle(0xffffff, 1).fillCircle(0, 0, 6);
    return gr;
  }

  /** Dibuja la cara de una carta (criatura o ítem) dentro del contenedor. */
  private cara(cont: Phaser.GameObjects.Container, carta: Carta): void {
    if (carta.clase === 'item') return this.caraItem(cont, carta.item, carta.rareza);
    const especie = DATOS.criaturas.get(carta.especie)!;
    const cara = this.add.graphics();
    cara.fillStyle(0x10142c, 1).fillRoundedRect(-31, -46, 62, 92, 5);
    cara.fillStyle(n(COLOR_RAREZA[carta.rareza]), 1).fillRoundedRect(-29, -44, 58, 88, 4);
    cara.fillStyle(n(C.papel), 1).fillRoundedRect(-26.5, -41.5, 53, 83, 3);
    cara.fillStyle(COLOR_TIPO[especie.tipo]!, 0.25).fillRoundedRect(-24, -39, 48, 44, 3);
    const sprite = miniatura(this.add.image(0, -17, textura(carta.especie, 'frente', carta.brillante)), carta.especie, 40, 0.75);
    const lineas = [
      new Texto(this, -31, 6, 62, 10, C.tinta, 'centro', { peso: 600 }).poner(especie.nombre),
      new Texto(this, -31, 15, 62, 10, COLOR_RAREZA[carta.rareza], 'centro', { tam: 5.8 }).poner(estrellas(carta.rareza)),
      new Texto(this, -31, 24, 62, 10, carta.resultado === 'repetida' ? C.tintaSuave : C.resalte, 'centro', { tam: 6.6 }).poner(
        carta.resultado === 'nueva' ? t('carta.nueva') : carta.resultado === 'mejora' ? t('carta.mejora') : t('carta.repetida', { n: carta.esencia }),
      ),
      new Texto(this, -31, 33, 62, 10, '#b07a00', 'centro', { tam: 6.6, peso: 600 }).poner(carta.brillante ? t('carta.brillante') : ''),
    ];
    cont.add([cara, sprite, ...lineas.map((l) => l.imagen)]);
  }

  /** Carta de ítem: marco de su rareza, el icono grande, nombre y «a la Bolsa». */
  private caraItem(cont: Phaser.GameObjects.Container, id: string, rareza: Carta['rareza']): void {
    const it = DATOS.items.get(id)!;
    const cara = this.add.graphics();
    cara.fillStyle(0x10142c, 1).fillRoundedRect(-31, -46, 62, 92, 5);
    cara.fillStyle(n(COLOR_RAREZA[rareza]), 1).fillRoundedRect(-29, -44, 58, 88, 4);
    cara.fillStyle(n(C.papel), 1).fillRoundedRect(-26.5, -41.5, 53, 83, 3);
    cara.fillStyle(n(it.color), 0.22).fillRoundedRect(-24, -39, 48, 44, 3);
    iconoItem(cara, it, 0, -17, 2.4);
    const lineas = [
      new Texto(this, -31, 6, 62, 10, C.tinta, 'centro', { peso: 600, tam: it.nombre.length > 12 ? 6.4 : 7.4 }).poner(it.nombre),
      new Texto(this, -31, 15, 62, 10, COLOR_RAREZA[rareza], 'centro', { tam: 5.8 }).poner(estrellas(rareza)),
      new Texto(this, -31, 24, 62, 10, C.resalte, 'centro', { tam: 6.6 }).poner(t('carta.item', { n: cantidad(juego.estado, id) })),
    ];
    cont.add([cara, ...lineas.map((l) => l.imagen)]);
  }

  /**
   * Comienzo de la partida: tres cartas boca abajo flotan esperando. Se elige una con ←/→ y A
   * (o tocándola); se da vuelta y revela un Pixanimal al azar. Las otras se desvanecen sin mostrarse.
   */
  private async elegirInicial(): Promise<void> {
    this.add.graphics().fillStyle(0x141830, 0.82).fillRect(0, 0, 240, 160);
    const rotulo = new Texto(this, 0, 6, 240, 14, '#ffffff', 'centro', { tam: 11, peso: 600 }).poner(t('inicio.titulo'));
    const pie = new Texto(this, 0, 143, 240, 12, '#ffffff', 'centro').poner(t('inicio.ayuda'));
    const XS = [46, 120, 194];
    const Y = 80;
    const brillos = XS.map((x) => this.add.graphics().setPosition(x, Y));
    const cartas = XS.map((x, i) => {
      const c = this.add.container(x, 200);
      c.add(this.dorso());
      c.setSize(62, 92).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => elegir(i));
      c.on('pointerdown', () => elegir(i));
      return c;
    });
    let sel = 1;
    let listo = false;
    const elegir = (i: number) => {
      if (!listo || sel === i) return;
      sel = i;
      sonido.tocar('cursor');
    };
    await Promise.all(cartas.map((c, i) => this.tw({ targets: c, y: Y, duration: 320, delay: i * 110, ease: 'Back.easeOut' })));
    listo = true;
    // Flotan a ritmos distintos; la elegida sube un poco más, crece y brilla.
    const reloj = { t: 0 };
    const flotar = this.tweens.add({
      targets: reloj,
      t: 1000,
      duration: 1_000_000,
      onUpdate: () => {
        const s = this.time.now / 1000;
        cartas.forEach((c, i) => {
          const elegida = i === sel && listo;
          const objetivo = elegida ? 1.08 : 1;
          c.y = Y + Math.sin(s * (1.6 + i * 0.27) + i * 2.1) * 3 - (elegida ? 5 : 0);
          c.setScale(c.scaleX + (objetivo - c.scaleX) * 0.2);
          const g = brillos[i]!;
          g.clear().setPosition(c.x, c.y);
          const pulso = 0.5 + 0.5 * Math.sin(s * 3 + i);
          if (elegida) {
            g.fillStyle(0xffe070, 0.12 + 0.12 * pulso).fillRoundedRect(-37, -52, 74, 104, 8);
            g.lineStyle(1.5, 0xffe070, 0.6 + 0.4 * pulso).strokeRoundedRect(-35, -50, 70, 100, 7);
          }
        });
      },
    });
    await new Promise<void>((r) => {
      this.alPulsar = (a) => {
        if (a === 'izquierda' || a === 'derecha') {
          sel = (sel + (a === 'derecha' ? 1 : 2)) % 3;
          sonido.tocar('cursor');
        } else if (a === 'a') {
          this.alPulsar = null;
          r();
        }
      };
    });
    listo = false;
    flotar.remove();
    brillos.forEach((g) => g.destroy());
    const carta = cartaInicial(DATOS, juego.estado, new Rng((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0));
    juego.guardar();
    sonido.tocar('aceptar');
    const elegida = cartas[sel]!;
    await Promise.all([
      ...cartas.filter((c) => c !== elegida).map((c) => this.tw({ targets: c, alpha: 0, y: c.y + 20, duration: 300 })),
      this.tw({ targets: elegida, x: 120, y: 78, scaleX: 1.15, scaleY: 1.15, duration: 380, ease: 'Cubic.easeOut' }),
    ]);
    pie.poner('');
    sonido.tocar('final');
    await this.tw({ targets: elegida, scaleX: 0, duration: 140 });
    elegida.removeAll(true);
    this.cara(elegida, carta);
    this.cameras.main.flash(220, 255, 255, 255);
    sonido.tocar('victoria');
    await this.tw({ targets: elegida, scaleX: 1.15, duration: 160 });
    rotulo.poner(t('inicio.tuyo', { n: DATOS.criaturas.get(carta.especie)!.nombre }));
    pie.poner(t('sobres.continuar'));
    await this.esperarA();
  }
}
