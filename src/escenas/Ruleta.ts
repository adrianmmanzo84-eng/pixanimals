import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { Rng } from '../core/rng';
import { faltaRuleta, girarRuleta, ruletaDisponible } from '../core/progresion/ruleta';
import type { PremioRuleta } from '../esquemas/esquemas';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { claveSobre, pieza } from '../ui/arte';
import { iconoItem, iconoMoneda } from '../ui/iconos';
import { Puntero, saltito } from '../ui/puntero';
import { Texto } from '../ui/texto';

const CX = 74;
const CY = 86;
const R = 56;

/** Texto corto de un premio de la ruleta («100 monedas», «Poción ×2», «300 monedas + Sobre Raro»). */
export function textoPremioRuleta(p: PremioRuleta): string {
  const partes: string[] = [];
  if (p.monedas) partes.push(t('rul.monedas', { n: p.monedas }));
  if (p.esencia) partes.push(t('rul.esencia', { n: p.esencia }));
  if (p.sobre) partes.push(DATOS.sobres.sobres.find((s) => s.id === p.sobre)!.nombre);
  if (p.item) partes.push(DATOS.items.get(p.item)!.nombre + (p.cantidad > 1 ? ` ×${p.cantidad}` : ''));
  return partes.join(' + ');
}

/** Etiqueta mínima para la casilla de la rueda. */
function etiqueta(p: PremioRuleta): string {
  if (p.monedas && p.sobre) return '¡JACKPOT!';
  if (p.monedas) return String(p.monedas);
  if (p.esencia) return String(p.esencia);
  if (p.item) return p.cantidad > 1 ? `×${p.cantidad}` : DATOS.items.get(p.item)!.efecto.tipo === 'xp' ? 'XP' : t('rul.item');
  return t('rul.sobre');
}

/**
 * Ruleta diaria: un giro gratis por día. La casilla sale en el núcleo (por peso) antes de girar;
 * la rueda gira varias vueltas y frena justo en ella. Nunca da criaturas.
 */
export class Ruleta extends Phaser.Scene {
  private rueda!: Phaser.GameObjects.Container;
  private estadoTxt!: Texto;
  private boton!: Texto;
  private botonG!: Phaser.GameObjects.Graphics;
  private girando = false;
  private terminado = false;

  constructor() {
    super('Ruleta');
  }

  init(): void {
    this.girando = false;
    this.terminado = false;
  }

  create(): void {
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    this.add.graphics().fillStyle(0x141830, 0.55).fillRect(0, 0, 240, 160);
    new Texto(this, 0, 3, 240, 14, '#ffffff', 'centro', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('rul.titulo'));

    this.dibujarRueda();
    // Aguja fija arriba.
    const aguja = this.add.graphics();
    aguja.fillStyle(0x1f2340, 1).fillTriangle(CX - 6, CY - R - 8, CX + 6, CY - R - 8, CX, CY - R + 5);
    aguja.fillStyle(0xf5c542, 1).fillTriangle(CX - 4, CY - R - 7, CX + 4, CY - R - 7, CX, CY - R + 2);

    // Panel derecho: estado, botón y premios posibles.
    const g = this.add.graphics();
    ventana(g, 138, 22, 98, 128);
    this.estadoTxt = new Texto(this, 141, 25, 92, 30, C.tinta, 'centro', { tam: 7, peso: 600 });
    this.botonG = this.add.graphics();
    this.boton = new Texto(this, 154, 58, 66, 14, '#ffffff', 'centro', { tam: 9, peso: 600 });
    new Texto(this, 141, 78, 92, 10, C.tintaSuave, 'centro', { tam: 6.4 }).poner(t('rul.puedes'));
    const lista = new Texto(this, 143, 88, 92, 60, C.tinta, 'izq', { tam: 5.6 });
    lista.poner(DATOS.economia.ruleta.segmentos.map((s) => '· ' + textoPremioRuleta(s.premio)).join('\n'));
    new Texto(this, 0, 150, 138, 10, '#ffffff', 'centro', { tam: 6.4, borde: '#2b3a78' }).poner(t('rul.ayuda'));

    // Tocar la rueda o el botón confirma como A (la pantalla emite el toque); las zonas dan la mano de clic.
    const puntero = new Puntero(this);
    puntero.zona(CX - R, CY - R, R * 2, R * 2, () => undefined);
    puntero.zona(154, 58, 66, 14, () => undefined);
    this.pintarEstado();
    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
    // El tiempo hasta el próximo giro se actualiza solo.
    this.time.addEvent({ delay: 30_000, loop: true, callback: () => !this.girando && this.pintarEstado() });
  }

  private grados(): number {
    return 360 / DATOS.economia.ruleta.segmentos.length;
  }

  /** Casillas de colores con su ícono y su etiqueta; la casilla i queda centrada en el ángulo −90 + i·paso. */
  private dibujarRueda(): void {
    const segs = DATOS.economia.ruleta.segmentos;
    const paso = this.grados();
    this.rueda = this.add.container(CX, CY);
    const g = this.add.graphics();
    g.fillStyle(0x1f2340, 1).fillCircle(0, 0, R + 3);
    this.rueda.add(g);
    segs.forEach((s, i) => {
      const medio = -90 + i * paso;
      const a0 = Phaser.Math.DegToRad(medio - paso / 2);
      const a1 = Phaser.Math.DegToRad(medio + paso / 2);
      g.fillStyle(n(s.color), 1).slice(0, 0, R, a0, a1, false).fillPath();
      // Media luna más clara cerca del borde: da volumen.
      g.fillStyle(0xffffff, 0.14).slice(0, 0, R, a0, a1, false).fillPath();
      g.fillStyle(n(s.color), 1).slice(0, 0, R - 5, a0, a1, false).fillPath();
      g.lineStyle(1, 0x1f2340, 1).lineBetween(0, 0, Math.cos(a0) * R, Math.sin(a0) * R);
      const rad = Phaser.Math.DegToRad(medio);
      const ix = Math.cos(rad) * (R - 15);
      const iy = Math.sin(rad) * (R - 15);
      // Ícono del premio, en un círculo claro para que se lea sobre cualquier color.
      const ico = this.add.graphics();
      ico.fillStyle(0xfdf6e3, 0.92).fillCircle(0, 0, 8);
      const p = s.premio;
      ico.setPosition(ix, iy).setRotation(rad + Math.PI / 2);
      this.rueda.add(ico);
      // Arte del autor; si falta, el dibujo por código.
      const giro = rad + Math.PI / 2;
      const clave = p.sobre ? claveSobre(p.sobre) : p.item ? `item_${p.item}` : p.esencia ? 'esencia' : 'monedas';
      const arte = pieza(this, clave, ix, iy, p.sobre ? 14 : 16, this.rueda);
      if (arte) {
        arte.setRotation(giro);
        if (p.sobre && p.monedas) {
          const mon = pieza(this, 'monedas', ix + Math.cos(rad) * 4 - Math.sin(rad) * 5, iy + Math.sin(rad) * 4 + Math.cos(rad) * 5, 8, this.rueda);
          mon?.setRotation(giro);
        }
      } else if (p.sobre) {
        const sobre = DATOS.sobres.sobres.find((x) => x.id === p.sobre)!;
        ico.fillStyle(0x1f2340, 1).fillRoundedRect(-4.5, -6, 9, 12, 1.5);
        ico.fillStyle(n(sobre.color ?? '#5aa9f0'), 1).fillRoundedRect(-3.6, -5.1, 7.2, 10.2, 1);
        ico.fillStyle(0xffffff, 0.8).fillRect(-1.5, -1, 3, 2);
      } else if (p.item) iconoItem(ico, DATOS.items.get(p.item)!, 0, 0, 1);
      else iconoMoneda(ico, p.esencia ? 'esencia' : 'monedas', 0, 0);
      const txt = new Texto(this, 0, 0, 34, 9, '#ffffff', 'centro', { tam: s.especial ? 5.4 : 6.6, peso: 600, borde: '#1f2340' }).poner(etiqueta(p));
      txt.imagen.setOrigin(0.5, 0.5).setPosition(Math.cos(rad) * (R - 31), Math.sin(rad) * (R - 31)).setRotation(rad + Math.PI / 2);
      this.rueda.add(txt.imagen);
    });
    // Centro.
    const hub = this.add.graphics();
    hub.fillStyle(0x1f2340, 1).fillCircle(0, 0, 9);
    hub.fillStyle(0xf5c542, 1).fillCircle(0, 0, 7);
    hub.fillStyle(0xffffff, 0.6).fillCircle(-2, -2, 2.4);
    this.rueda.add(hub);
  }

  private pintarEstado(): void {
    const libre = ruletaDisponible(juego.estado, Date.now());
    if (!this.terminado) this.estadoTxt.poner(libre ? t('rul.libre') : t('rul.vuelve', this.cuenta()), libre ? C.tinta : C.tintaSuave);
    const activo = (libre && !this.girando) || this.terminado;
    this.botonG.clear().fillStyle(0x1f2340, 1).fillRoundedRect(153, 57, 68, 16, 4);
    this.botonG.fillStyle(activo ? n(C.resalte) : 0x8a90a8, 1).fillRoundedRect(154, 58, 66, 14, 3.5);
    this.boton.poner(this.terminado ? t('rul.volver') : t('rul.girar'));
  }

  private cuenta(): { h: number; m: number } {
    const min = Math.ceil(faltaRuleta(Date.now()) / 60_000);
    return { h: Math.floor(min / 60), m: min % 60 };
  }

  private alPulsar(a: AccionEntrada): void {
    if (this.girando) return;
    if (a === 'b' || (a === 'a' && this.terminado)) {
      sonido.tocar('cancelar');
      this.scene.start('Menu', {});
      return;
    }
    if (a !== 'a') return;
    if (!ruletaDisponible(juego.estado, Date.now())) {
      sonido.tocar('negado');
      saltito(this, this.estadoTxt.imagen);
      return;
    }
    const i = girarRuleta(DATOS, juego.estado, new Rng((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0), Date.now());
    if (i === null) return;
    juego.guardar();
    this.girando = true;
    sonido.tocar('aceptar');
    this.pintarEstado();
    void this.girar(i);
  }

  /** Varias vueltas y frena en la casilla i, con un tic por cada casilla que pasa bajo la aguja. */
  private async girar(i: number): Promise<void> {
    const paso = this.grados();
    const desvio = (Math.random() - 0.5) * paso * 0.6;
    const destino = -(i * paso) - 360 * 5 + desvio;
    let ultima = 0;
    await new Promise<void>((r) =>
      this.tweens.add({
        targets: this.rueda,
        angle: destino,
        duration: 4200,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          const casilla = Math.floor((-this.rueda.angle + paso / 2) / paso);
          if (casilla !== ultima) {
            ultima = casilla;
            sonido.tocar('tic');
          }
        },
        onComplete: () => r(),
      }),
    );
    const seg = DATOS.economia.ruleta.segmentos[i]!;
    // Brillo sobre la casilla ganadora (arriba, bajo la aguja).
    const brillo = this.add.graphics();
    const a0 = Phaser.Math.DegToRad(-90 - paso / 2);
    const a1 = Phaser.Math.DegToRad(-90 + paso / 2);
    brillo.fillStyle(0xffffff, 1).slice(CX, CY, R, a0, a1, false).fillPath();
    brillo.setAlpha(0);
    this.tweens.add({ targets: brillo, alpha: 0.45, duration: 160, yoyo: true, repeat: 3 });
    sonido.tocar(seg.especial ? 'victoria' : 'sube');
    if (seg.especial) this.cameras.main.flash(260, 255, 236, 170);
    this.girando = false;
    this.terminado = true;
    this.estadoTxt.poner(t('rul.gano', { p: textoPremioRuleta(seg.premio).replace(' + ', ' +\n') }), C.resalte);
    saltito(this, this.estadoTxt.imagen);
    this.pintarEstado();
  }
}
