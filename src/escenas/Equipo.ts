import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { calcularStats } from '../core/combate/formulas';
import { equipoDe, ponerAlFrente, potencialDe } from '../core/estado/juego';
import { xpParaSubir } from '../core/progresion/experiencia';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { COLOR_RAREZA, estrellas, textura } from '../ui/criaturas';
import { C, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { Texto } from '../ui/texto';

/** Equipo: orden de combate, nivel, experiencia y stats de cada criatura. La primera es la que sale al campo. */
export class Equipo extends Phaser.Scene {
  private sel = 0;

  constructor() {
    super('Equipo');
  }

  create(): void {
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    const equipo = equipoDe(juego.estado);
    this.sel = Math.min(this.sel, Math.max(0, equipo.length - 1));
    ventana(g, 4, 4, 232, 116);
    ventana(g, 4, 124, 232, 32);

    equipo.forEach((c, i) => {
      const especie = DATOS.criaturas.get(c.especie)!;
      const y = 10 + i * 36;
      const activa = i === this.sel;
      g.fillStyle(activa ? 0xfde9c8 : n(C.papelSombra), 1).fillRoundedRect(10, y, 220, 33, 4);
      if (activa) g.lineStyle(1.2, n(C.resalte), 1).strokeRoundedRect(10, y, 220, 33, 4);
      this.add.image(28, y + 16, textura(c.especie, 'frente', c.brillante)).setScale(0.48);
      new Texto(this, 48, y + 3, 80, 10, C.tinta, 'izq', { peso: 600 }).poner(especie.nombre + (c.brillante ? ' ✦' : ''));
      g.fillStyle(COLOR_TIPO[especie.tipo] ?? 0x5b6a8c, 1).fillRoundedRect(48, y + 13, 30, 8, 3);
      new Texto(this, 48, y + 13, 30, 9, C.papel, 'centro', { tam: 6 }).poner(DATOS.tipos.get(especie.tipo)!.nombre.toUpperCase());
      new Texto(this, 82, y + 13, 70, 10, COLOR_RAREZA[c.rareza], 'izq', { tam: 6.6 }).poner(estrellas(c.rareza));
      new Texto(this, 150, y + 3, 74, 10, C.tinta, 'der').poner(t('nv', { n: c.nivel }) + (i === 0 ? ` · ${t('eq.frente')}` : ''));
      // Barra de experiencia, con el número al lado.
      const max = c.nivel >= DATOS.balance.nivelMax;
      const meta = xpParaSubir(DATOS, c.nivel);
      g.fillStyle(C.barraFondo, 1).fillRoundedRect(48, y + 25, 100, 4, 2);
      g.fillStyle(0x5aa9f0, 1).fillRoundedRect(48, y + 25, Math.max(2, 100 * (max ? 1 : c.xp / meta)), 4, 2);
      new Texto(this, 150, y + 21, 74, 10, C.tintaSuave, 'der', { tam: 6.6 }).poner(max ? t('eq.max') : t('eq.xp', { a: Math.floor(c.xp), b: meta }));
    });

    const elegida = equipo[this.sel];
    if (elegida) {
      const s = calcularStats(DATOS.criaturas.get(elegida.especie)!, elegida.nivel, DATOS.balance, potencialDe(DATOS, elegida.rareza));
      new Texto(this, 10, 129, 220, 10).poner(t('eq.stats', { ...s }));
    } else new Texto(this, 10, 129, 220, 10, C.tintaSuave).poner(t('menu.sinEquipo'));
    new Texto(this, 10, 140, 220, 10, C.tintaSuave).poner(t('eq.ayuda'));

    Entrada.escuchar((a) => this.alPulsar(a, equipo.length));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private alPulsar(a: AccionEntrada, total: number): void {
    if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Menu');
      return;
    }
    if (!total) return;
    if (a === 'arriba' || a === 'abajo') {
      this.sel = (this.sel + (a === 'abajo' ? 1 : total - 1)) % total;
      sonido.tocar('cursor');
    } else if (a === 'a') {
      ponerAlFrente(DATOS, juego.estado, juego.estado.equipo[this.sel]!);
      juego.guardar();
      this.sel = 0;
      sonido.tocar('aceptar');
    } else return;
    this.scene.restart();
  }
}
