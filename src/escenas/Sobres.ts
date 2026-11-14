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
import { claveSobre, fondoCarta, hayArte, marcoCarta, pieza } from '../ui/arte';
import { C, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { Texto } from '../ui/texto';

function duracion(ms: number): string {
  const min = Math.ceil(ms / 60000);
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

/** Tienda y apertura de sobres. Las probabilidades y el pity se muestran siempre. */
/** Cada fila muestra el sobre a 16×22 (el dibujo 2×, píxeles parejos); caben 4 a la vista. */
const FILAS = 4;
const ALTO_FILA = 22;
const Y0 = 22;

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
  private recMon: Texto | null = null;
  private recEse: Texto | null = null;
  private cursor!: Phaser.GameObjects.Graphics;
  private alPulsar: ((a: AccionEntrada) => void) | null = null;
  private bienvenida = false;
  private scroll = 0;
  private fijarScroll = false;
  private colores!: Phaser.GameObjects.Graphics;
  private minis: Phaser.GameObjects.Image[] = [];
  private rebajas: Phaser.GameObjects.Image[] = [];
  private puntero: Puntero | null = null;

  constructor() {
    super('Sobres');
  }

  private abrirId = '';

  init(datos: { bienvenida?: boolean; abrir?: string }): void {
    // Viene de la ruleta (u otro premio) con un sobre ya ganado: se abre al entrar.
    this.abrirId = datos?.abrir ?? '';
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
    this.recMon = this.recEse = null;
    if (pieza(this, 'monedas', 160, 11, 8) && pieza(this, 'esencia', 202, 11, 8)) {
      this.recMon = new Texto(this, 166, 6, 34, 10, '#ffffff', 'izq', { borde: '#2b3a78' });
      this.recEse = new Texto(this, 208, 6, 30, 10, '#ffffff', 'izq', { borde: '#2b3a78' });
    }
    ventana(g, 4, 20, 122, 92);
    ventana(g, 130, 20, 106, 92);
    ventana(g, 4, 116, 232, 40);
    // Lista con desplazamiento: FILAS sobres a la vista.
    this.colores = this.add.graphics();
    this.minis = [];
    this.rebajas = [];
    for (let k = 0; k < FILAS; k++) {
      const y = Y0 + k * ALTO_FILA;
      // Miniatura del sobre (32×44 dibujados al doble: 16×22) y la estrella de descuento semanal.
      if (hayArte(this, 'sobre_basico_mini')) this.minis.push(this.add.image(15, y + 11, 'ui_sobre_basico_mini').setScale(0.5));
      const rebaja = pieza(this, 'descuento_semana', 113, y + 11, 9);
      if (rebaja) this.rebajas.push(rebaja.setVisible(false));
      this.nombres.push(new Texto(this, 26, y + 3, 84, 10));
      this.costos.push(new Texto(this, 26, y + 12, 84, 10, C.tinta, 'izq'));
    }
    new Texto(this, 136, 25, 96, 10, C.tintaSuave).poner(t('sobres.prob'));
    for (let i = 0; i < 8; i++) this.probs.push(new Texto(this, 136, 35 + i * 9.5, 96, 10));
    this.pie = new Texto(this, 10, 121, 220, 30);
    this.cursor = this.add.graphics();
    this.puntero = new Puntero(this);
    for (let k = 0; k < FILAS; k++)
      this.puntero.zona(6, Y0 + k * ALTO_FILA, 116, ALTO_FILA, () => {
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
    // Sobre ganado en otra pantalla (la ruleta): se abre en el momento.
    const idx = this.abrirId ? DATOS.sobres.sobres.findIndex((x) => x.id === this.abrirId) : -1;
    if (idx >= 0) {
      this.sel = idx;
      this.pintar();
      this.enLista('a');
    }
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
      void this.animar(cartas, colorSobre(def), def.nombre, def.id).then(() => this.scene.restart({}));
    }
  };

  private pintar(): void {
    const estado = juego.estado;
    const ahora = Date.now();
    const gratis = sobresGratis(DATOS, estado, ahora);
    const lista = DATOS.sobres.sobres;
    if (!this.fijarScroll) this.scroll = Math.max(0, Math.min(this.sel - Math.floor(FILAS / 2), lista.length - FILAS));
    this.fijarScroll = false;
    if (this.recMon && this.recEse) {
      this.recMon.poner(String(estado.monedas));
      this.recEse.poner(String(estado.esencia));
    } else this.recursos.poner(`${t('rec.monedas', { n: estado.monedas })} · ${t('rec.esencia', { n: estado.esencia })}`);
    this.colores.clear();
    this.colores.fillStyle(0xfde9c8, 1).fillRoundedRect(6, Y0 + (this.sel - this.scroll) * ALTO_FILA, 112, ALTO_FILA, 3);
    for (let k = 0; k < FILAS; k++) {
      const i = this.scroll + k;
      const s = lista[i];
      if (!s) {
        this.nombres[k]!.poner('');
        this.costos[k]!.poner('');
        this.minis[k]?.setVisible(false);
        this.rebajas[k]?.setVisible(false);
        continue;
      }
      const pago = costoDe(DATOS, estado, s.id, ahora);
      const color = i === this.sel ? C.resalte : pago.puede ? C.tinta : C.apagado;
      this.nombres[k]!.poner(s.nombre, color);
      const rebajado = !pago.gratis && pago.costo < s.costo;
      this.costos[k]!.poner(pago.gratis ? t('sobres.gratis', { n: gratis.disponibles }) : (rebajado && !this.rebajas[k] ? '★' : '') + String(pago.costo), color);
      this.rebajas[k]?.setVisible(rebajado);
      // Miniatura del sobre, o una muestra de su color si falta el dibujo.
      const mini = this.minis[k];
      if (mini && hayArte(this, `${claveSobre(s.id)}_mini`)) mini.setTexture(`ui_${claveSobre(s.id)}_mini`).setVisible(true);
      else this.colores.fillStyle(colorSobre(s), 1).fillRoundedRect(8, Y0 + k * ALTO_FILA + 3, 14, 16, 2);
    }
    if (this.scroll > 0) this.colores.fillStyle(n(C.tintaSuave), 1).fillTriangle(119, 24, 123, 24, 121, 21);
    if (this.scroll + FILAS < lista.length) this.colores.fillStyle(n(C.tintaSuave), 1).fillTriangle(119, 108, 123, 108, 121, 111);
    // La fila elegida lleva un marco dorado alrededor.
    const ys = Y0 + (this.sel - this.scroll) * ALTO_FILA;
    this.cursor.clear().lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(6, ys, 112, ALTO_FILA, 3);
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
  private async animar(cartas: Carta[], color: number, titulo: string, id: string): Promise<void> {
    this.add.graphics().fillStyle(0x141830, 0.86).fillRect(0, 0, 240, 160);
    const rotulo = new Texto(this, 0, 6, 240, 14, '#ffffff', 'centro', { tam: 11, peso: 600 }).poner(titulo);
    const pie = new Texto(this, 0, 146, 240, 10, '#ffffff', 'centro');

    // El sobre dibujado por el autor, a 5× en pantalla (88 px de alto → 110 del mundo); si falta, uno por código.
    const sobre: Phaser.GameObjects.Image | Phaser.GameObjects.Graphics =
      pieza(this, claveSobre(id), 120, 82, 110) ??
      this.add
        .graphics()
        .setPosition(120, 82)
        .fillStyle(0x10142c, 1)
        .fillRoundedRect(-40, -56, 80, 112, 7)
        .fillStyle(color, 1)
        .fillRoundedRect(-37, -53, 74, 106, 6)
        .fillStyle(0xffffff, 0.35)
        .fillRoundedRect(-37, -53, 74, 26, 6)
        .fillStyle(0xffffff, 0.9)
        .fillCircle(0, 6, 14)
        .fillStyle(color, 1)
        .fillCircle(0, 6, 8);
    sonido.tocar('estado');
    await this.tw({ targets: sobre, angle: { from: -7, to: 7 }, duration: 90, yoyo: true, repeat: 4 });
    sonido.tocar('final');
    this.cameras.main.flash(220, 255, 255, 255);
    await this.tw({ targets: sobre, scaleX: 1.35, scaleY: 1.35, alpha: 0, duration: 200 });
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
      this.avisoCarta(carta, buena);
      await this.tw({ targets: cont, scaleX: 1, duration: 130 });
      if (buena) await this.tw({ targets: cont, scaleX: 1.08, scaleY: 1.08, duration: 110, yoyo: true });
    }
    rotulo.poner(titulo);
    pie.poner(t('sobres.continuar'));
    await this.esperarA();
  }

  /**
   * Flash y sonido al dar vuelta una carta: toda carta destella (más fuerte cuanto más rara) y suena distinto
   * si es un ítem, una criatura nueva o repetida, o un hallazgo (Rara, Épica o brillante).
   */
  private avisoCarta(carta: Carta, buena: boolean): void {
    const cam = this.cameras.main;
    const repetida = carta.clase === 'criatura' && carta.resultado === 'repetida';
    if (buena) {
      sonido.tocar('tesoro');
      if (carta.rareza === 'epica') cam.flash(380, 255, 225, 140);
      else if (carta.clase === 'criatura' && carta.brillante) cam.flash(340, 255, 245, 190);
      else cam.flash(260, 150, 205, 255);
    } else if (carta.clase === 'item') {
      sonido.tocar('objeto');
      cam.flash(150, 255, 255, 255);
    } else if (repetida) {
      sonido.tocar('cursor');
      cam.flash(90, 255, 255, 255);
    } else {
      sonido.tocar('revela');
      cam.flash(170, 255, 255, 255);
    }
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
    const cara = fondoCarta(this, carta.rareza);
    cara.fillStyle(COLOR_TIPO[especie.tipo]!, 0.25).fillRoundedRect(-24, -39, 48, 44, 3);
    const sprite = miniatura(this.add.image(0, -17, textura(carta.especie, 'frente', carta.brillante)), carta.especie, 40, 0.75);
    cont.add(cara);
    const lineas = [
      new Texto(this, -31, 6, 62, 10, C.tinta, 'centro', { peso: 600 }).poner(especie.nombre),
      new Texto(this, -31, 15, 62, 10, COLOR_RAREZA[carta.rareza], 'centro', { tam: 5.8 }).poner(estrellas(carta.rareza)),
      new Texto(this, -31, 24, 62, 10, carta.resultado === 'repetida' ? C.tintaSuave : C.resalte, 'centro', { tam: 6.6 }).poner(
        carta.resultado === 'nueva' ? t('carta.nueva') : carta.resultado === 'mejora' ? t('carta.mejora') : t('carta.repetida', { n: carta.esencia }),
      ),
      new Texto(this, -31, 33, 62, 10, '#b07a00', 'centro', { tam: 6.6, peso: 600 }).poner(carta.brillante ? t('carta.brillante') : ''),
    ];
    cont.add([sprite, ...lineas.map((l) => l.imagen)]);
    marcoCarta(this, cont, carta.rareza, carta.brillante);
  }

  /** Carta de ítem: marco de su rareza, el icono grande, nombre y «a la Bolsa». */
  private caraItem(cont: Phaser.GameObjects.Container, id: string, rareza: Carta['rareza']): void {
    const it = DATOS.items.get(id)!;
    const cara = fondoCarta(this, rareza);
    cara.fillStyle(n(it.color), 0.22).fillRoundedRect(-24, -39, 48, 44, 3);
    cont.add(cara);
    iconoItem(cara, it, 0, -17, 2.4);
    const lineas = [
      new Texto(this, -31, 6, 62, 10, C.tinta, 'centro', { peso: 600, tam: it.nombre.length > 12 ? 6.4 : 7.4 }).poner(it.nombre),
      new Texto(this, -31, 15, 62, 10, COLOR_RAREZA[rareza], 'centro', { tam: 5.8 }).poner(estrellas(rareza)),
      new Texto(this, -31, 24, 62, 10, C.resalte, 'centro', { tam: 6.6 }).poner(t('carta.item', { n: cantidad(juego.estado, id) })),
    ];
    cont.add(lineas.map((l) => l.imagen));
    marcoCarta(this, cont, rareza, false);
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
