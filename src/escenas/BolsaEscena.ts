import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { criaturaDe } from '../core/estado/juego';
import { cantidad, usarItem, vitaminasLibres } from '../core/items/items';
import { xpParaSubir } from '../core/progresion/experiencia';
import type { Item } from '../esquemas/esquemas';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { iconoItem } from '../ui/iconos';
import { partir, Texto } from '../ui/texto';

const FILAS = 9;

/** Bolsa fuera del combate: caramelos, vitaminas e incienso. Los de combate y las piedras solo se muestran. */
export class BolsaEscena extends Phaser.Scene {
  private sel = 0;
  private aviso = '';
  private items: Item[] = [];
  /** Índice de criatura elegida (modo elegir) o null (modo lista). */
  private objetivo: number | null = null;

  constructor() {
    super('BolsaEscena');
  }

  init(d: { sel?: number; aviso?: string; objetivo?: number | null }): void {
    this.sel = d?.sel ?? 0;
    this.aviso = d?.aviso ?? '';
    this.objetivo = d?.objetivo ?? null;
  }

  create(): void {
    const estado = juego.estado;
    this.items = [...DATOS.items.values()].filter((i) => cantidad(estado, i.id) > 0);
    this.sel = Math.max(0, Math.min(this.sel, this.items.length - 1));
    const scroll = Math.max(0, Math.min(this.sel - Math.floor(FILAS / 2), this.items.length - FILAS));

    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    new Texto(this, 6, 3, 100, 14, '#ffffff', 'izq', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('bolsaP.titulo'));
    const faltan = Math.ceil((estado.incienso.hasta - Date.now()) / 60_000);
    if (faltan > 0) new Texto(this, 100, 6, 134, 10, '#ffffff', 'der', { borde: '#2b3a78' }).poner(t('bolsaP.incienso', { m: faltan }));
    ventana(g, 4, 20, 140, 100);
    ventana(g, 148, 20, 88, 100);
    ventana(g, 4, 124, 232, 32);

    if (!this.items.length) {
      new Texto(this, 10, 128, 220, 20).poner(partir(t('bolsaP.vacia'), 218).join('\n'));
      new Texto(this, 10, 146, 220, 10, C.tintaSuave).poner('B: volver');
    } else {
      this.items.slice(scroll, scroll + FILAS).forEach((it, k) => {
        const i = scroll + k;
        const y = 25 + k * 10.5;
        if (i === this.sel) g.fillStyle(0xfde9c8, 1).fillRoundedRect(8, y - 1, 132, 10, 2);
        iconoItem(g, it, 15, y + 4, 0.7);
        const usable = it.uso === 'fuera';
        new Texto(this, 22, y, 90, 10, i === this.sel ? C.resalte : usable ? C.tinta : C.tintaSuave).poner(it.nombre);
        new Texto(this, 108, y, 30, 10, C.tinta, 'der').poner(`×${cantidad(estado, it.id)}`);
      });
      if (scroll > 0) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(70, 22, 74, 22, 72, 20);
      if (scroll + FILAS < this.items.length) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(70, 117, 74, 117, 72, 119);

      const it = this.items[this.sel]!;
      iconoItem(g, it, 192, 36, 1.8);
      new Texto(this, 150, 48, 84, 10, C.tinta, 'centro', { peso: 600 }).poner(it.nombre);
      new Texto(this, 152, 59, 82, 40).poner(partir(it.descripcion, 80).join('\n'));
      if (it.uso !== 'fuera') new Texto(this, 152, 92, 82, 26, C.tintaSuave).poner(partir(t(it.uso === 'combate' ? 'bolsaP.enCombate' : it.uso === 'equipo' ? 'bolsaP.enEquipo' : 'bolsaP.alEvolucionar'), 80).join('\n'));
      this.pie(g, it);
    }
    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  /** Línea inferior: ayuda, aviso o, al elegir criatura, la criatura y cómo le afecta el ítem. */
  private pie(g: Phaser.GameObjects.Graphics, it: Item): void {
    const estado = juego.estado;
    if (this.objetivo === null) {
      new Texto(this, 10, 128, 220, 10, this.aviso ? C.resalte : C.tintaSuave).poner(this.aviso || ' ');
      new Texto(this, 10, 140, 220, 10, C.tintaSuave).poner(t('bolsaP.ayuda'));
      return;
    }
    const c = estado.criaturas[this.objetivo]!;
    const especie = DATOS.criaturas.get(c.especie)!;
    this.add.image(20, 138, textura(c.especie, 'icono'), 0);
    new Texto(this, 36, 127, 120, 10, C.tinta, 'izq', { peso: 600 }).poner(`◀ ${especie.nombre} ${t('nv', { n: c.nivel })} ▶`);
    let detalle = '';
    if (it.efecto.tipo === 'xp') detalle = t('bolsaP.xp', { nv: c.nivel, a: Math.floor(c.xp), b: xpParaSubir(DATOS, c.nivel) });
    else if (it.efecto.tipo === 'vitamina') {
      const r = DATOS.reglasItems.vitaminas;
      const total = Object.values(c.vitaminas).reduce((a, b) => a + (b ?? 0), 0);
      detalle = t('bolsaP.vitaminas', { stat: t(`stat.${it.efecto.stat}`), a: c.vitaminas[it.efecto.stat] ?? 0, b: r.maxPorStat, c: total, d: r.maxTotal });
      if (vitaminasLibres(DATOS, estado, c.especie, it.efecto.stat) <= 0) g.fillStyle(n(C.resalte), 1).fillCircle(32, 141, 1.5);
    }
    new Texto(this, 36, 137, 196, 10, C.tintaSuave).poner(detalle);
    new Texto(this, 36, 146, 196, 10, this.aviso ? C.resalte : C.tintaSuave, 'izq', { tam: 6.6 }).poner(this.aviso || t('bolsaP.elige'));
  }

  private alPulsar(a: AccionEntrada): void {
    const estado = juego.estado;
    const it = this.items[this.sel];
    if (this.objetivo !== null && it) {
      const total = estado.criaturas.length;
      if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.restart({ sel: this.sel });
      } else if (a === 'izquierda' || a === 'derecha') {
        sonido.tocar('cursor');
        this.scene.restart({ sel: this.sel, objetivo: (this.objetivo + (a === 'derecha' ? 1 : total - 1)) % total });
      } else if (a === 'a') this.usar(it, estado.criaturas[this.objetivo]!.especie);
      return;
    }
    if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Menu');
    } else if ((a === 'arriba' || a === 'abajo') && this.items.length) {
      sonido.tocar('cursor');
      this.scene.restart({ sel: (this.sel + (a === 'abajo' ? 1 : this.items.length - 1)) % this.items.length });
    } else if (a === 'a' && it) {
      if (it.uso !== 'fuera') {
        sonido.tocar('negado');
        return;
      }
      if (it.efecto.tipo === 'incienso') return this.usar(it);
      if (!estado.criaturas.length) {
        sonido.tocar('negado');
        this.scene.restart({ sel: this.sel, aviso: t('bolsaP.no.sin_criatura') });
        return;
      }
      sonido.tocar('aceptar');
      // Empieza por la criatura al frente del equipo.
      const frente = Math.max(0, estado.criaturas.findIndex((c) => c.especie === estado.equipo[0]));
      this.scene.restart({ sel: this.sel, objetivo: frente });
    }
  }

  private usar(it: Item, especie?: string): void {
    const r = usarItem(DATOS, juego.estado, it.id, Date.now(), especie);
    const nombre = especie ? DATOS.criaturas.get(especie)!.nombre : '';
    if (!r.ok) {
      sonido.tocar('negado');
      this.scene.restart({ sel: this.sel, objetivo: this.objetivo, aviso: t(`bolsaP.no.${r.motivo}`, { n: nombre }) });
      return;
    }
    juego.guardar();
    let aviso = '';
    if (r.tipo === 'xp') {
      const c = criaturaDe(juego.estado, especie!)!;
      aviso = r.niveles > 0 ? t('bolsaP.ok.xpNivel', { n: nombre, nv: c.nivel }) : t('bolsaP.ok.xp', { n: nombre });
      sonido.tocar(r.niveles > 0 ? 'victoria' : 'sube');
    } else if (r.tipo === 'vitamina') {
      aviso = t('bolsaP.ok.vitamina', { n: nombre, stat: it.efecto.tipo === 'vitamina' ? t(`stat.${it.efecto.stat}`) : '' });
      sonido.tocar('sube');
    } else {
      const h = new Date(r.hasta);
      aviso = t('bolsaP.ok.incienso', { h: `${h.getHours()}:${String(h.getMinutes()).padStart(2, '0')}` });
      sonido.tocar('estado');
    }
    // Si quedan unidades y había una criatura elegida, se sigue en ella para usar otro.
    const quedan = cantidad(juego.estado, it.id) > 0;
    this.scene.restart({ sel: this.sel, objetivo: quedan && especie ? this.objetivo : null, aviso });
  }
}
