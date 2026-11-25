import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { resumir, TODAS, type Ranura } from '../core/estado/ranuras';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { idioma, t } from '../i18n/i18n';
import { juego, type ContenidoRanura } from '../juego';
import { miniatura, textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { iconoMoneda } from '../ui/iconos';
import { Puntero } from '../ui/puntero';
import { partir, Texto } from '../ui/texto';

type Contenido = Record<Ranura, ContenidoRanura | null>;

/**
 * «Elige tu partida» (D279): tres ranuras de guardado. Una con partida se continúa; una vacía empieza una
 * partida nueva desde el prólogo. Borrar pide dos pasos: el botón Borrar y luego «Sí, borrar» (por defecto «No»).
 */
export class Ranuras extends Phaser.Scene {
  private contenido!: Contenido;
  private sel: number = 0;
  /** Foco: la tarjeta, su botón Borrar, o la confirmación de borrado (0 = No, 1 = Sí). */
  private foco: 'tarjeta' | 'borrar' | 'confirmar' = 'tarjeta';
  private siBorrar = 0;
  private aviso = '';
  private yendo = false;

  constructor() {
    super('Ranuras');
  }

  init(d: { contenido: Contenido; sel?: number; foco?: Ranuras['foco']; siBorrar?: number; aviso?: string }): void {
    this.contenido = d.contenido;
    this.sel = d.sel ?? Math.max(0, TODAS.indexOf(juego.ranura));
    this.foco = d.foco ?? 'tarjeta';
    this.siBorrar = d.siBorrar ?? 0;
    this.aviso = d.aviso ?? '';
    this.yendo = false;
  }

  create(): void {
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    new Texto(this, 0, 3, 240, 14, '#ffffff', 'centro', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('ran.titulo'));
    const g = this.add.graphics();
    const puntero = new Puntero(this);

    TODAS.forEach((r, i) => {
      const x = 6 + i * 77;
      const elegida = i === this.sel;
      const c = this.contenido[r];
      ventana(g, x, 21, 74, 104);
      if (elegida && this.foco === 'tarjeta') g.lineStyle(2, n(C.resalte), 1).strokeRoundedRect(x + 1, 22, 72, 102, 4);
      new Texto(this, x, 25, 74, 10, elegida ? C.resalte : C.tinta, 'centro', { peso: 600, tam: 7 }).poner(t('ran.partida', { n: r }));
      if (c) this.tarjetaLlena(g, x, c);
      else this.tarjetaVacia(g, x);
      puntero.zona(x, 21, 74, 104, () => this.elegir(i, 'tarjeta'));
      // Botón Borrar (solo con partida).
      if (c) {
        const enBorrar = elegida && this.foco === 'borrar';
        g.fillStyle(enBorrar ? n(C.resalte) : 0x5a6988, 1).fillRoundedRect(x + 17, 128, 40, 10, 3);
        new Texto(this, x + 17, 128.5, 40, 9, C.papel, 'centro', { tam: 6, peso: 600 }).poner(t('ran.borrar'));
        puntero.zona(x + 17, 127, 40, 12, () => this.elegir(i, 'borrar'));
      }
    });

    new Texto(this, 0, 141, 240, 9, this.aviso ? C.resalte : '#ffffff', 'centro', { tam: 6, peso: 600, borde: '#2b3a78' }).poner(this.aviso || t('ran.ayuda'));

    if (this.foco === 'confirmar') this.confirmacion(puntero);

    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
    this.cameras.main.fadeIn(200, 26, 28, 44);
  }

  private tarjetaLlena(g: Phaser.GameObjects.Graphics, x: number, c: ContenidoRanura): void {
    const res = resumir(DATOS, c.estado);
    // El equipo, en fila.
    res.equipo.forEach((esp, k) => {
      if (!DATOS.criaturas.get(esp)) return;
      const brillante = c.estado.criaturas.find((m) => m.especie === esp)?.brillante ?? false;
      miniatura(this.add.image(x + 15 + k * 22, 48, textura(esp, 'frente', brillante)), esp, 22, 0.5);
    });
    const historia =
      res.region === null
        ? t('ran.sinHistoria')
        : res.region === 'completa'
          ? t('ran.completa')
          : res.region === 'libre'
            ? t('ran.libre')
            : res.region === 'final'
              ? t('ran.final')
              : t(`hist.region.${res.region}`);
    const lineas = [
      [t('ran.nivel', { n: res.nivel }), C.tinta],
      [historia, '#257179'],
      [res.criaturas === 1 ? t('ran.criatura') : t('ran.criaturas', { n: res.criaturas }), C.tintaSuave],
    ] as const;
    lineas.forEach(([txt, color], k) => new Texto(this, x + 3, 64 + k * 10, 68, 10, color, 'centro', { tam: 6.2, peso: k < 2 ? 600 : 500 }).poner(txt));
    iconoMoneda(g, 'monedas', x + 14, 99.5);
    new Texto(this, x + 19, 95, 50, 10, C.tintaSuave, 'izq', { tam: 6.2 }).poner(res.monedas.toLocaleString(idioma() === 'es' ? 'es-AR' : 'en-US'));
    if (c.en) {
      const f = new Date(c.en).toLocaleDateString(idioma() === 'es' ? 'es-AR' : 'en-US', { day: 'numeric', month: 'short' });
      new Texto(this, x + 3, 108, 68, 10, C.tintaSuave, 'centro', { tam: 5.6 }).poner(t('ran.fecha', { f }));
    }
  }

  private tarjetaVacia(g: Phaser.GameObjects.Graphics, x: number): void {
    g.fillStyle(0xdfe6f1, 1).fillCircle(x + 37, 56, 13);
    g.fillStyle(n(C.resalte), 1).fillRect(x + 35.5, 49, 3, 14).fillRect(x + 30, 54.5, 14, 3);
    new Texto(this, x + 3, 76, 68, 10, C.tinta, 'centro', { tam: 7, peso: 600 }).poner(t('ran.nueva'));
    new Texto(this, x + 5, 87, 64, 22, C.tintaSuave, 'centro', { tam: 5.8 }).poner(partir(t('ran.nuevaSub'), 62, 5.8).join('\n'));
  }

  /** Cartel de confirmación del borrado («No» elegido por defecto). */
  private confirmacion(puntero: Puntero): void {
    const r = TODAS[this.sel]!;
    const capa = this.add.graphics().setDepth(10);
    capa.fillStyle(0x1a1c2c, 0.7).fillRect(0, 0, 240, 160);
    ventana(capa, 30, 36, 180, 86);
    const d = { tam: 6.4 };
    new Texto(this, 30, 42, 180, 12, C.resalte, 'centro', { tam: 8.4, peso: 600 }).poner(t('ran.confirma.titulo', { n: r })).imagen.setDepth(11);
    new Texto(this, 40, 57, 160, 34, C.tinta, 'centro', d).poner(partir(t('ran.confirma.texto'), 156, d.tam).join('\n')).imagen.setDepth(11);
    [t('ran.confirma.no'), t('ran.confirma.si')].forEach((txt, k) => {
      const bx = 42 + k * 82;
      const elegido = k === this.siBorrar;
      capa.fillStyle(elegido ? (k === 1 ? n(C.resalte) : 0x3a7bd5) : 0xc9d3e3, 1).fillRoundedRect(bx, 98, 74, 14, 4);
      new Texto(this, bx, 100, 74, 10, elegido ? C.papel : C.tinta, 'centro', { tam: 6.8, peso: 600 }).poner(txt).imagen.setDepth(11);
      const z = this.add.zone(bx, 98, 74, 14).setOrigin(0, 0).setDepth(12).setInteractive({ useHandCursor: true });
      z.on('pointerover', () => this.siBorrar !== k && this.scene.restart(this.datos({ siBorrar: k })));
      z.on('pointerdown', () => this.siBorrar !== k && this.scene.restart(this.datos({ siBorrar: k })));
    });
    void puntero;
  }

  private datos(cambio: Partial<{ contenido: Contenido; sel: number; foco: Ranuras['foco']; siBorrar: number; aviso: string }>): object {
    return { contenido: this.contenido, sel: this.sel, foco: this.foco, siBorrar: this.siBorrar, aviso: '', ...cambio };
  }

  private elegir(i: number, foco: 'tarjeta' | 'borrar'): void {
    if (this.foco === 'confirmar' || this.yendo) return;
    if (i === this.sel && foco === this.foco) return;
    sonido.tocar('cursor');
    this.scene.restart(this.datos({ sel: i, foco }));
  }

  private alPulsar(a: AccionEntrada): void {
    if (this.yendo) return;
    const r = TODAS[this.sel]!;
    const lleno = !!this.contenido[r];
    if (this.foco === 'confirmar') {
      if (a === 'izquierda' || a === 'derecha') {
        sonido.tocar('cursor');
        this.scene.restart(this.datos({ siBorrar: 1 - this.siBorrar }));
      } else if (a === 'b' || (a === 'a' && this.siBorrar === 0)) {
        sonido.tocar('cancelar');
        this.scene.restart(this.datos({ foco: 'borrar', siBorrar: 0 }));
      } else if (a === 'a') {
        sonido.tocar('aceptar');
        juego.borrarRanura(r);
        this.scene.restart(this.datos({ contenido: { ...this.contenido, [r]: null }, foco: 'tarjeta', siBorrar: 0, aviso: t('ran.borrada', { n: r }) }));
      }
      return;
    }
    if (a === 'izquierda' || a === 'derecha') {
      sonido.tocar('cursor');
      const sel = (this.sel + (a === 'derecha' ? 1 : TODAS.length - 1)) % TODAS.length;
      this.scene.restart(this.datos({ sel, foco: 'tarjeta' }));
    } else if (a === 'abajo' && lleno && this.foco === 'tarjeta') {
      sonido.tocar('cursor');
      this.scene.restart(this.datos({ foco: 'borrar' }));
    } else if (a === 'arriba' && this.foco === 'borrar') {
      sonido.tocar('cursor');
      this.scene.restart(this.datos({ foco: 'tarjeta' }));
    } else if (a === 'a' && this.foco === 'borrar') {
      sonido.tocar('aceptar');
      this.scene.restart(this.datos({ foco: 'confirmar', siBorrar: 0 }));
    } else if (a === 'a') {
      void this.jugar(r);
    } else if (a === 'b') {
      if (this.foco === 'borrar') {
        sonido.tocar('cancelar');
        this.scene.restart(this.datos({ foco: 'tarjeta' }));
      } else {
        sonido.tocar('cancelar');
        this.scene.start('Titulo');
      }
    }
  }

  private async jugar(r: Ranura): Promise<void> {
    this.yendo = true;
    sonido.tocar('aceptar');
    await juego.usarRanura(r);
    this.cameras.main.fadeOut(260, 26, 28, 44);
    // El menú lleva al prólogo si la partida es nueva.
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Menu'));
  }
}
