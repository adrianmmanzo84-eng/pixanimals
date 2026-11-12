import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { Rng } from '../core/rng';
import { cobrarPremio, repartirPremios, type PremioTirado } from '../core/progresion/premio';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { COLOR_RAREZA, estrellas, textura } from '../ui/criaturas';
import { C, n, prepararCamara } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { iconoItem, iconoMoneda } from '../ui/iconos';
import { Texto } from '../ui/texto';

/** Tras ganar: varias cartas boca abajo; el jugador elige una y después se ven todas. */
export class Premio extends Phaser.Scene {
  private sel = 1;
  private premios: PremioTirado[] = [];
  private cartas: Phaser.GameObjects.Container[] = [];
  private cursor!: Phaser.GameObjects.Graphics;
  private alPulsar: ((a: AccionEntrada) => void) | null = null;

  constructor() {
    super('Premio');
  }

  init(): void {
    this.cartas = [];
    this.alPulsar = null;
  }

  private x(i: number): number {
    const total = this.premios.length;
    return 120 + (i - (total - 1) / 2) * 70;
  }

  create(): void {
    this.premios = repartirPremios(DATOS, new Rng((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0));
    this.sel = Math.floor(this.premios.length / 2);
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    this.add.graphics().fillStyle(0x141830, 0.86).fillRect(0, 0, 240, 160);
    new Texto(this, 0, 6, 240, 14, '#ffffff', 'centro', { tam: 11, peso: 600 }).poner(t('premio.titulo'));
    const pie = new Texto(this, 0, 146, 240, 10, '#ffffff', 'centro');
    this.cursor = this.add.graphics();
    Entrada.escuchar((a) => this.alPulsar?.(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));

    this.premios.forEach((_, i) => {
      const cont = this.add.container(this.x(i), 200);
      cont.add(this.add.image(0, 0, 'carta_dorso'));
      this.cartas.push(cont);
      this.tweens.add({ targets: cont, y: 80, duration: 280, delay: i * 90, ease: 'Back.easeOut' });
    });
    this.time.delayedCall(600, () => {
      pie.poner(t('premio.ayuda'));
      this.pintarCursor();
      this.alPulsar = (a) => {
        if (a === 'izquierda' || a === 'derecha') {
          const sig = this.sel + (a === 'derecha' ? 1 : -1);
          if (sig < 0 || sig >= this.premios.length) return;
          this.sel = sig;
          sonido.tocar('cursor');
          this.pintarCursor();
        } else if (a === 'a') {
          this.alPulsar = null;
          this.cursor.clear();
          void this.revelar(pie);
        }
      };
    });
  }

  /** La carta elegida sube un poco y lleva una flecha encima. */
  private pintarCursor(): void {
    this.cartas.forEach((c, i) => c.setY(i === this.sel ? 76 : 80));
    const x = this.x(this.sel);
    this.cursor.clear().fillStyle(n('#f5c542'), 1).fillTriangle(x - 4, 24, x + 4, 24, x, 29);
  }

  private tw(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((r) => this.tweens.add({ ...cfg, onComplete: () => r() }));
  }

  private async voltear(i: number, apagada: boolean): Promise<void> {
    const cont = this.cartas[i]!;
    await this.tw({ targets: cont, scaleX: 0, duration: 110 });
    cont.removeAll(true);
    this.cara(cont, this.premios[i]!, apagada);
    await this.tw({ targets: cont, scaleX: 1, duration: 130 });
  }

  /** Dibuja la cara de una carta según el premio. */
  private cara(cont: Phaser.GameObjects.Container, p: PremioTirado, apagada: boolean): void {
    const g = this.add.graphics();
    const color = p.tipo === 'criatura' ? n(COLOR_RAREZA[p.rareza]) : p.tipo === 'item' ? n(DATOS.items.get(p.item)!.color) : p.tipo === 'monedas' ? 0xf5c542 : 0x9a5ae0;
    g.fillStyle(0x10142c, 1).fillRoundedRect(-31, -46, 62, 92, 5);
    g.fillStyle(color, 1).fillRoundedRect(-29, -44, 58, 88, 4);
    g.fillStyle(n(C.papel), 1).fillRoundedRect(-26.5, -41.5, 53, 83, 3);
    cont.add(g);
    const linea = (y: number, texto: string) => cont.add(new Texto(this, -31, y, 62, 20, C.tinta, 'centro', { peso: 600 }).poner(texto).imagen);
    const icono = this.add.graphics();
    cont.add(icono);
    if (p.tipo === 'monedas' || p.tipo === 'esencia') {
      icono.setScale(3);
      iconoMoneda(icono, p.tipo, 0, -6);
      linea(6, t(`premio.${p.tipo}`, { n: p.cantidad }));
    } else if (p.tipo === 'item') {
      iconoItem(icono, DATOS.items.get(p.item)!, 0, -16, 2.2);
      linea(6, t('premio.item', { i: DATOS.items.get(p.item)!.nombre, n: p.cantidad }));
    } else {
      cont.add(this.add.image(0, -17, textura(p.especie, 'frente', p.brillante)).setScale(0.66));
      linea(6, DATOS.criaturas.get(p.especie)!.nombre);
      cont.add(new Texto(this, -31, 16, 62, 10, COLOR_RAREZA[p.rareza], 'centro', { tam: 6.6 }).poner(estrellas(p.rareza)).imagen);
    }
    if (apagada) {
      const velo = this.add.graphics().fillStyle(0x141830, 0.55).fillRoundedRect(-31, -46, 62, 92, 5);
      cont.add(velo);
    }
  }

  private async revelar(pie: Texto): Promise<void> {
    const elegido = this.premios[this.sel]!;
    sonido.tocar('aceptar');
    await this.voltear(this.sel, false);
    const carta = cobrarPremio(DATOS, juego.estado, elegido);
    juego.guardar();
    const buena = elegido.tipo === 'criatura' || (elegido.tipo === 'item' && (DATOS.items.get(elegido.item)!.precio?.monedas ?? 0) >= 100);
    sonido.tocar(buena ? 'victoria' : 'sube');
    if (buena) this.cameras.main.flash(180, 255, 240, 180);
    await this.tw({ targets: this.cartas[this.sel]!, scaleX: 1.08, scaleY: 1.08, duration: 120, yoyo: true });
    let texto = t('premio.tuya');
    if (carta) texto += ' ' + (carta.resultado === 'nueva' ? t('carta.nueva') : carta.resultado === 'mejora' ? t('carta.mejora') : t('carta.repetida', { n: carta.esencia }));
    pie.poner(texto);
    await new Promise<void>((r) => this.time.delayedCall(500, () => r()));
    // Las demás se dan vuelta, apagadas: lo que podría haber sido.
    for (let i = 0; i < this.premios.length; i++) if (i !== this.sel) await this.voltear(i, true);
    await new Promise<void>((r) => this.time.delayedCall(300, () => r()));
    pie.poner(`${texto}   ${t('premio.continuar')}`);
    this.alPulsar = (a) => {
      if (a !== 'a' && a !== 'b') return;
      sonido.tocar('aceptar');
      this.scene.start('Menu');
    };
  }
}
