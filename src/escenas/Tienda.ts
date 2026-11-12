import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { cantidad, catalogo, comprar, diaLocal, ofertasDelDia, precioDe } from '../core/items/items';
import type { Item } from '../esquemas/esquemas';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { iconoItem, iconoMoneda } from '../ui/iconos';
import { partir, Texto } from '../ui/texto';

const FILAS = 9;

/** Tienda: compra de a uno con monedas o Esencia. Las ofertas del día van primero. */
export class Tienda extends Phaser.Scene {
  private sel = 0;
  private scroll = 0;
  private aviso = '';
  private items: Item[] = [];

  constructor() {
    super('Tienda');
  }

  init(d: { sel?: number; aviso?: string }): void {
    this.sel = d?.sel ?? 0;
    this.aviso = d?.aviso ?? '';
  }

  create(): void {
    const dia = diaLocal(Date.now());
    const ofertas = ofertasDelDia(DATOS, dia);
    const todos = catalogo(DATOS);
    this.items = [...todos.filter((i) => ofertas.includes(i.id)), ...todos.filter((i) => !ofertas.includes(i.id))];
    this.sel = Math.min(this.sel, this.items.length - 1);
    // La lista se desplaza para que la fila elegida quede cerca del centro.
    this.scroll = Math.max(0, Math.min(this.sel - Math.floor(FILAS / 2), this.items.length - FILAS));

    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    const estado = juego.estado;
    new Texto(this, 6, 3, 100, 14, '#ffffff', 'izq', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('tienda.titulo'));
    // Recursos arriba a la derecha, con sus iconos.
    iconoMoneda(g, 'monedas', 150, 10);
    new Texto(this, 155, 5, 34, 10, '#ffffff', 'izq', { borde: '#2b3a78' }).poner(String(estado.monedas));
    iconoMoneda(g, 'esencia', 196, 10);
    new Texto(this, 201, 5, 34, 10, '#ffffff', 'izq', { borde: '#2b3a78' }).poner(String(estado.esencia));

    ventana(g, 4, 20, 140, 100);
    ventana(g, 148, 20, 88, 100);
    ventana(g, 4, 124, 232, 32);

    this.items.slice(this.scroll, this.scroll + FILAS).forEach((it, k) => {
      const i = this.scroll + k;
      const y = 25 + k * 10.5;
      const p = precioDe(DATOS, it, dia)!;
      if (i === this.sel) g.fillStyle(0xfde9c8, 1).fillRoundedRect(8, y - 1, 132, 10, 2);
      iconoItem(g, it, 15, y + 4, 0.7);
      new Texto(this, 22, y, 80, 10, i === this.sel ? C.resalte : C.tinta).poner(it.nombre);
      new Texto(this, 98, y, 32, 10, p.oferta ? C.resalte : C.tinta, 'der', { peso: p.oferta ? 600 : 500 }).poner(String(p.valor));
      iconoMoneda(g, p.moneda, 135, y + 4.5);
    });
    // Indicadores de que hay más arriba o abajo.
    if (this.scroll > 0) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(70, 22, 74, 22, 72, 20);
    if (this.scroll + FILAS < this.items.length) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(70, 117, 74, 117, 72, 119);

    const it = this.items[this.sel]!;
    const p = precioDe(DATOS, it, dia)!;
    iconoItem(g, it, 192, 36, 1.8);
    new Texto(this, 150, 48, 84, 10, C.tinta, 'centro', { peso: 600 }).poner(it.nombre);
    new Texto(this, 150, 57, 84, 10, C.tintaSuave, 'centro').poner(t('tienda.tienes', { n: cantidad(estado, it.id) }));
    new Texto(this, 152, 67, 82, 40).poner(partir(it.descripcion, 80).join('\n'));
    if (p.oferta) {
      g.fillStyle(n(C.resalte), 1).fillRoundedRect(158, 106, 68, 10, 3);
      new Texto(this, 158, 106, 68, 10, C.papel, 'centro', { peso: 600, tam: 6.6 }).poner(t('tienda.oferta', { n: DATOS.reglasItems.ofertas.descuento }));
    }

    new Texto(this, 10, 128, 220, 10, this.aviso ? C.resalte : C.tintaSuave).poner(this.aviso || t('tienda.ofertasHoy'));
    new Texto(this, 10, 140, 220, 10, C.tintaSuave).poner(t('tienda.ayuda'));

    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private alPulsar(a: AccionEntrada): void {
    const total = this.items.length;
    if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Menu');
    } else if (a === 'arriba' || a === 'abajo') {
      sonido.tocar('cursor');
      this.scene.restart({ sel: (this.sel + (a === 'abajo' ? 1 : total - 1)) % total });
    } else if (a === 'a') {
      const it = this.items[this.sel]!;
      const r = comprar(DATOS, juego.estado, it.id, Date.now());
      if (r === true) {
        juego.guardar();
        sonido.tocar('sube');
        this.scene.restart({ sel: this.sel, aviso: t('tienda.comprado', { i: it.nombre }) });
      } else {
        sonido.tocar('negado');
        this.scene.restart({ sel: this.sel, aviso: t(r === 'esencia' ? 'tienda.esencia' : 'tienda.monedas') });
      }
    }
  }
}
