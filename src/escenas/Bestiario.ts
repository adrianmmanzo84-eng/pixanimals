import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { criaturaDe } from '../core/estado/juego';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { COLOR_RAREZA, estrellas, textura } from '../ui/criaturas';
import { C, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { partir, Texto } from '../ui/texto';

/** Bestiario: una fila por familia y una columna por etapa (4 etapas). Lo no visto es un signo de pregunta; lo visto, una silueta. */
export class Bestiario extends Phaser.Scene {
  private sel = 0;
  private marco!: Phaser.GameObjects.Graphics;
  private tipoFondo!: Phaser.GameObjects.Graphics;
  private nombre!: Texto;
  private tipo!: Texto;
  private situacion!: Texto;
  private detalle!: Texto;
  private descripcion!: Texto;
  private especies = [...DATOS.criaturas.values()];

  constructor() {
    super('Bestiario');
  }

  create(): void {
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    const estado = juego.estado;
    ventana(g, 4, 4, 124, 124);
    ventana(g, 132, 4, 104, 124);
    ventana(g, 4, 132, 232, 24);

    this.especies.forEach((c, i) => {
      const x = 8 + (i % 4) * 29 + 14;
      const y = 22 + Math.floor(i / 4) * 29 + 14;
      g.fillStyle(n(C.papelSombra), 1).fillRoundedRect(x - 13, y - 13, 26, 26, 3);
      const mia = criaturaDe(estado, c.id);
      if (mia) this.add.image(x, y - 4, textura(c.id, 'frente', mia.brillante)).setScale(0.4);
      else if (estado.vistas.includes(c.id)) this.add.image(x, y - 4, textura(c.id, 'silueta')).setScale(0.4);
      else new Texto(this, x - 13, y - 7, 26, 14, C.apagado, 'centro', { tam: 11, peso: 600 }).poner('?');
    });
    this.marco = this.add.graphics();
    this.nombre = new Texto(this, 136, 10, 96, 12, C.tinta, 'centro', { tam: 8.6, peso: 600 });
    this.tipoFondo = this.add.graphics();
    this.tipo = new Texto(this, 136, 23, 96, 10, C.papel, 'centro');
    this.situacion = new Texto(this, 138, 38, 92, 10, C.resalte);
    this.detalle = new Texto(this, 138, 49, 92, 20);
    this.descripcion = new Texto(this, 138, 72, 92, 54, C.tintaSuave);

    const capturadas = this.especies.filter((c) => criaturaDe(estado, c.id)).length;
    new Texto(this, 10, 139, 220, 10).poner(t('best.vistas', { v: estado.vistas.length, c: capturadas, t: this.especies.length }));
    new Texto(this, 10, 139, 220, 10, C.tintaSuave, 'der').poner(t('best.ayuda'));

    this.pintar();
    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private alPulsar(a: AccionEntrada): void {
    const col = this.sel % 4;
    const fila = Math.floor(this.sel / 4);
    const filas = Math.ceil(this.especies.length / 4);
    if (a === 'izquierda') this.sel = fila * 4 + ((col + 3) % 4);
    else if (a === 'derecha') this.sel = fila * 4 + ((col + 1) % 4);
    else if (a === 'arriba') this.sel = ((fila + filas - 1) % filas) * 4 + col;
    else if (a === 'abajo') this.sel = ((fila + 1) % filas) * 4 + col;
    else if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Menu');
      return;
    } else return;
    sonido.tocar('cursor');
    this.pintar();
  }

  private pintar(): void {
    const estado = juego.estado;
    const c = this.especies[this.sel]!;
    const mia = criaturaDe(estado, c.id);
    const vista = estado.vistas.includes(c.id);
    const x = 8 + (this.sel % 4) * 29;
    const y = 22 + Math.floor(this.sel / 4) * 29;
    this.marco.clear().lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(x, y, 28, 28, 4);
    this.tipoFondo.clear();
    if (!mia && !vista) {
      this.nombre.poner(t('best.desconocida'));
      this.tipo.poner('');
      this.situacion.poner(t('best.noVista'), C.tintaSuave);
      this.detalle.poner('');
      this.descripcion.poner('');
      return;
    }
    this.nombre.poner(c.nombre);
    this.tipoFondo.fillStyle(COLOR_TIPO[c.tipo] ?? 0x5b6a8c, 1).fillRoundedRect(162, 22, 44, 10, 3);
    this.tipo.poner(DATOS.tipos.get(c.tipo)!.nombre.toUpperCase());
    this.situacion.poner(t(mia ? 'best.capturada' : 'best.vista'), mia ? '#2f7a48' : C.tintaSuave);
    this.detalle.poner(mia ? `${t('best.nivel', { n: mia.nivel })}${mia.brillante ? ' · ✦' : ''}\n${estrellas(mia.rareza)}` : '', mia ? COLOR_RAREZA[mia.rareza] : C.tinta);
    this.descripcion.poner(partir(c.descripcion, 92).slice(0, 6).join('\n'));
  }
}
