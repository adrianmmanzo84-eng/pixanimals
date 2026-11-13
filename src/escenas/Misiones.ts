import Phaser from 'phaser';
import { Puntero, saltito } from '../ui/puntero';
import { DATOS } from '../core/datos';
import { cobrarMision, misionesDeHoy } from '../core/progresion/misiones';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { iconoMoneda } from '../ui/iconos';
import { Texto } from '../ui/texto';

/** Misiones del día: progreso, premio y botón para cobrar. Cambian a medianoche. */
export class Misiones extends Phaser.Scene {
  private sel = 0;
  private aviso = '';

  constructor() {
    super('Misiones');
  }

  private salto = false;

  init(d: { sel?: number; aviso?: string; salto?: boolean }): void {
    this.sel = d?.sel ?? 0;
    this.salto = !!d?.salto;
    this.aviso = d?.aviso ?? '';
  }

  create(): void {
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const estado = juego.estado;
    const lista = misionesDeHoy(DATOS, estado, Date.now());
    if (lista.length) this.sel = Math.min(this.sel, lista.length - 1);
    new Texto(this, 0, 3, 240, 14, '#ffffff', 'centro', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('mis.titulo'));
    const g = this.add.graphics();
    const puntero = new Puntero(this);
    lista.forEach((m, i) => {
      const y = 20 + i * 36;
      ventana(g, 8, y, 224, 32);
      if (i === this.sel) g.lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(8, y, 224, 32, 4);
      const nombre = new Texto(this, 16, y + 4, 150, 10, m.cobrada ? C.tintaSuave : C.tinta, 'izq', { peso: 600 }).poner(t(`mis.${m.def.evento}`, { n: m.def.meta }));
      if (i === this.sel && this.salto) saltito(this, nombre.imagen);
      puntero.zona(8, y, 224, 32, () => {
        if (i === this.sel) return;
        sonido.tocar('cursor');
        this.scene.restart({ sel: i, salto: true });
      });
      // Barra de progreso
      g.fillStyle(C.barraFondo, 1).fillRoundedRect(16, y + 19, 110, 4, 2);
      g.fillStyle(m.completa ? 0x3fbf6a : 0xf5a623, 1).fillRoundedRect(16, y + 19, Math.max(2, (110 * m.progreso) / m.def.meta), 4, 2);
      new Texto(this, 130, y + 16, 40, 10, C.tintaSuave).poner(`${m.progreso}/${m.def.meta}`);
      // Premio
      iconoMoneda(g, m.def.premio.tipo, 178, y + 9);
      new Texto(this, 186, y + 4, 40, 10, C.tinta, 'izq').poner(`+${m.def.premio.cantidad}`);
      const estadoTxt = m.cobrada ? t('mis.cobrada') : m.completa ? t('mis.cobrar') : t('mis.enCurso');
      new Texto(this, 160, y + 17, 66, 10, m.cobrada ? '#2f7a48' : m.completa ? C.resalte : C.tintaSuave, 'der', { peso: m.completa && !m.cobrada ? 600 : 500 }).poner(estadoTxt);
    });
    ventana(g, 8, 130, 224, 26);
    new Texto(this, 14, 134, 212, 10, C.tinta).poner(this.aviso || t('mis.racha', { n: estado.diario.racha }));
    new Texto(this, 14, 144, 212, 10, C.tintaSuave).poner(t('mis.ayuda'));
    Entrada.escuchar((a) => this.alPulsar(a, lista.length));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private alPulsar(a: AccionEntrada, total: number): void {
    if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Menu');
      return;
    }
    if ((a === 'arriba' || a === 'abajo') && total) {
      sonido.tocar('cursor');
      this.scene.restart({ sel: (this.sel + (a === 'abajo' ? 1 : total - 1)) % total, salto: true });
      return;
    }
    if (a !== 'a') return;
    const m = misionesDeHoy(DATOS, juego.estado, Date.now())[this.sel];
    if (!m) return;
    const premio = cobrarMision(DATOS, juego.estado, m.def.id);
    if (!premio) {
      sonido.tocar('negado');
      return;
    }
    juego.guardar();
    sonido.tocar('cura');
    this.scene.restart({ sel: this.sel, aviso: t('mis.cobrado', { n: premio.cantidad, r: t(premio.tipo === 'monedas' ? 'mis.monedas' : 'mis.esencia') }) });
  }
}
