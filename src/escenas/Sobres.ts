import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { Rng } from '../core/rng';
import { abrirSobre, costoDe, ORDEN_RAREZA, probConIncienso, sobreBienvenida, sobresGratis, type Carta } from '../core/sobres/sobres';
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
      const cartas = sobreBienvenida(DATOS, juego.estado, new Rng(Date.now() >>> 0));
      juego.guardar();
      void this.animar(cartas, 0x5aa9f0, t('sobres.bienvenida')).then(() => this.scene.start('Menu'));
      return;
    }

    const g = this.add.graphics();
    new Texto(this, 6, 3, 100, 14, '#ffffff', 'izq', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('sobres.titulo'));
    this.recursos = new Texto(this, 100, 6, 134, 10, '#ffffff', 'der', { borde: '#2b3a78' });
    ventana(g, 4, 20, 122, 92);
    ventana(g, 130, 20, 106, 92);
    ventana(g, 4, 116, 232, 40);
    DATOS.sobres.sobres.forEach((_, i) => {
      this.nombres.push(new Texto(this, 18, 27 + i * 16, 70, 10));
      this.costos.push(new Texto(this, 78, 27 + i * 16, 42, 10, C.tinta, 'der'));
    });
    new Texto(this, 136, 25, 96, 10, C.tintaSuave).poner(t('sobres.prob'));
    for (let i = 0; i < 7; i++) this.probs.push(new Texto(this, 136, 36 + i * 10, 96, 10));
    this.pie = new Texto(this, 10, 121, 220, 30);
    this.cursor = this.add.graphics();
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
      void this.animar(cartas, def.tipo ? COLOR_TIPO[def.tipo]! : def.id === 'raro' ? 0x8a45c8 : 0x5aa9f0, def.nombre).then(() => this.scene.restart({}));
    }
  };

  private pintar(): void {
    const estado = juego.estado;
    const ahora = Date.now();
    const gratis = sobresGratis(DATOS, estado, ahora);
    this.recursos.poner(`${t('rec.monedas', { n: estado.monedas })} · ${t('rec.esencia', { n: estado.esencia })}`);
    DATOS.sobres.sobres.forEach((s, i) => {
      const pago = costoDe(DATOS, estado, s.id, ahora);
      const color = i === this.sel ? C.resalte : pago.puede ? C.tinta : C.apagado;
      this.nombres[i]!.poner(s.nombre, color);
      this.costos[i]!.poner(pago.gratis ? t('sobres.gratis', { n: gratis.disponibles }) : String(s.costo), color);
    });
    const y = 28 + this.sel * 16;
    this.cursor.clear().fillStyle(n(C.resalte), 1).fillTriangle(10, y, 10, y + 6, 14, y + 3);

    const def = DATOS.sobres.sobres[this.sel]!;
    const prob = probConIncienso(def.prob, estado, ahora);
    const pct = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
    ORDEN_RAREZA.forEach((r, i) => this.probs[i]!.poner(`${estrellas(r)}  ${pct(prob[r])} %`, COLOR_RAREZA[r]));
    this.probs[4]!.poner(t('sobres.brillante', { n: DATOS.sobres.brillanteUnoEn }), C.tintaSuave);
    this.probs[5]!.poner(t('sobres.pity.rara', { n: Math.max(1, DATOS.sobres.pity.rara - estado.pity.rara + 1) }), C.tintaSuave);
    this.probs[6]!.poner(t('sobres.pity.epica', { n: Math.max(1, DATOS.sobres.pity.epica - estado.pity.epica + 1) }), C.tintaSuave);

    const contenido = t('sobres.contenido', { extra: def.tipo ? t('sobres.soloTipo', { tipo: DATOS.tipos.get(def.tipo)!.nombre }) : t('sobres.cualquiera') });
    const incienso = Math.ceil((estado.incienso.hasta - ahora) / 60_000);
    const reloj =
      incienso > 0
        ? t('sobres.incienso', { m: incienso })
        : gratis.disponibles > 0
          ? t('sobres.gratisListo', { n: gratis.disponibles })
          : t('sobres.proximo', { t: duracion(gratis.faltaMs) });
    this.pie.poner([contenido, reloj, t('sobres.ayuda')].join('\n'), C.tinta);
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
      const especie = DATOS.criaturas.get(carta.especie)!;
      await this.tw({ targets: cont, scaleX: 0, duration: 110 });
      cont.removeAll(true);
      const cara = this.add.graphics();
      cara.fillStyle(0x10142c, 1).fillRoundedRect(-31, -46, 62, 92, 5);
      cara.fillStyle(n(COLOR_RAREZA[carta.rareza]), 1).fillRoundedRect(-29, -44, 58, 88, 4);
      cara.fillStyle(n(C.papel), 1).fillRoundedRect(-26.5, -41.5, 53, 83, 3);
      cara.fillStyle(COLOR_TIPO[especie.tipo]!, 0.25).fillRoundedRect(-24, -39, 48, 44, 3);
      const sprite = miniatura(this.add.image(0, -17, textura(carta.especie, 'frente', carta.brillante)), carta.especie, 40, 0.75);
      const lineas = [
        new Texto(this, -31, 6, 62, 10, C.tinta, 'centro', { peso: 600 }).poner(especie.nombre),
        new Texto(this, -31, 15, 62, 10, COLOR_RAREZA[carta.rareza], 'centro', { tam: 6.6 }).poner(estrellas(carta.rareza)),
        new Texto(this, -31, 24, 62, 10, carta.resultado === 'repetida' ? C.tintaSuave : C.resalte, 'centro', { tam: 6.6 }).poner(
          carta.resultado === 'nueva' ? t('carta.nueva') : carta.resultado === 'mejora' ? t('carta.mejora') : t('carta.repetida', { n: carta.esencia }),
        ),
        new Texto(this, -31, 33, 62, 10, '#b07a00', 'centro', { tam: 6.6, peso: 600 }).poner(carta.brillante ? t('carta.brillante') : ''),
      ];
      cont.add([cara, sprite, ...lineas.map((l) => l.imagen)]);
      const buena = carta.rareza === 'rara' || carta.rareza === 'epica' || carta.brillante;
      sonido.tocar(buena ? 'victoria' : carta.resultado === 'repetida' ? 'cursor' : 'sube');
      if (buena) this.cameras.main.flash(180, 255, 240, 180);
      await this.tw({ targets: cont, scaleX: 1, duration: 130 });
      if (buena) await this.tw({ targets: cont, scaleX: 1.08, scaleY: 1.08, duration: 110, yoyo: true });
    }
    rotulo.poner(titulo);
    pie.poner(t('sobres.continuar'));
    await this.esperarA();
  }
}
