import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { criaturaDe, nombreDe } from '../core/estado/juego';
import { quitar } from '../core/items/items';
import { aprender, ataquesDe, conocidos, descartarOferta, ESPACIO_FINAL, opcionesPergamino, restablecer } from '../core/progresion/ataques';
import type { CriaturaJugador, Habilidad } from '../esquemas/esquemas';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { miniatura, textura } from '../ui/criaturas';
import { C, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { describirHabilidad, lineaHabilidad } from '../ui/habilidadTexto';
import { partir, Texto } from '../ui/texto';
import { Puntero } from '../ui/puntero';

/** oferta: subió de nivel y quiere aprender uno · pergamino: elige 1 de 3 · gestionar: cambia entre los que ya sabe. */
type Modo = 'oferta' | 'pergamino' | 'gestionar';
interface Init {
  especie: string;
  modo: Modo;
  /** Dónde volver al terminar. */
  volver?: { escena: string; datos?: object };
  /** Estado interno al reiniciar la escena. */
  sel?: number;
  nuevo?: string | null;
  opciones?: string[];
  aviso?: string;
}

/**
 * Aprender y cambiar ataques (D217). El Final no se toca; los otros tres espacios aceptan cualquier ataque aprendible.
 */
export class Ataques extends Phaser.Scene {
  private d!: Init;
  private c!: CriaturaJugador;
  private puntero!: Puntero;

  constructor() {
    super('Ataques');
  }

  init(d: Init): void {
    this.d = { ...d };
  }

  /** Elegir entre las opciones del pergamino (antes de elegir el espacio). */
  private get eligiendo(): boolean {
    return this.d.modo === 'pergamino' && !this.d.nuevo;
  }

  create(): void {
    const c = criaturaDe(juego.estado, this.d.especie);
    if (!c) return void this.salir();
    this.c = c;
    if (this.d.modo === 'oferta' && this.d.nuevo === undefined) this.d.nuevo = c.ofertaAtaque ?? null;
    if (this.d.modo === 'pergamino' && !this.d.opciones) this.d.opciones = opcionesPergamino(DATOS, c, (Date.now() ^ (Math.random() * 1e9)) >>> 0, DATOS.items.get('pergamino')?.efecto.tipo === 'tecnica' ? (DATOS.items.get('pergamino')!.efecto as { opciones: number }).opciones : 3);
    this.d.sel ??= 0;
    this.puntero = new Puntero(this);

    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    ventana(g, 4, 4, 232, 152);
    miniatura(this.add.image(20, 18, textura(c.especie, 'frente', c.brillante)), c.especie, 22, 0.45);
    new Texto(this, 36, 8, 190, 10, C.tinta, 'izq', { peso: 600 }).poner(nombreDe(DATOS, c));
    new Texto(this, 36, 18, 190, 10, C.tintaSuave, 'izq', { tam: 6.6 }).poner(t(`atq.sub.${this.eligiendo ? 'elegir' : this.d.modo}`));

    let detalle: Habilidad | null = null;
    if (this.eligiendo) {
      const ops = this.d.opciones ?? [];
      if (!ops.length) new Texto(this, 14, 40, 212, 20, C.tintaSuave).poner(t('atq.sinOpciones'));
      ops.forEach((id, i) => {
        const h = DATOS.habilidades.get(id)!;
        if (i === this.d.sel) detalle = h;
        this.fila(g, 32 + i * 22, 20, h, t('atq.opcion', { n: i + 1 }), i === this.d.sel, false, () => this.mover(i));
      });
    } else {
      let y = 32;
      if (this.d.nuevo) {
        const h = DATOS.habilidades.get(this.d.nuevo)!;
        g.fillStyle(0xfff3c4, 1).fillRoundedRect(10, y, 220, 20, 4);
        g.lineStyle(1, 0xd9a520, 1).strokeRoundedRect(10, y, 220, 20, 4);
        new Texto(this, 14, y + 1, 40, 9, '#b07a00', 'izq', { tam: 6, peso: 600 }).poner(t('atq.nuevo'));
        new Texto(this, 14, y + 9, 120, 10, C.tinta, 'izq', { peso: 600 }).poner(h.nombre);
        new Texto(this, 120, y + 6, 106, 10, C.tintaSuave, 'der', { tam: 6 }).poner(lineaHabilidad(h));
        y += 24;
        new Texto(this, 10, y, 220, 9, C.tintaSuave, 'izq', { tam: 6 }).poner(t('atq.reemplazar'));
        y += 9;
      }
      const kit = ataquesDe(DATOS, c);
      kit.forEach((id, i) => {
        const h = DATOS.habilidades.get(id)!;
        const fijo = i === ESPACIO_FINAL;
        if (i === this.d.sel) detalle = h;
        const otras = this.d.modo === 'gestionar' && !fijo ? this.alternativas(i).length > 1 : false;
        const paso = this.d.nuevo ? 15 : 17;
        this.fila(g, y + i * paso, paso - 2, h, t(`atq.rol.${h.rol}`) + (fijo ? ' · ' + t('atq.fijo') : ''), i === this.d.sel, fijo, () => this.mover(i), otras);
      });
      if (this.d.modo === 'gestionar') {
        const yr = y + 4 * 17 + 1;
        const activa = this.d.sel === 4;
        new Texto(this, 14, yr, 200, 10, activa ? C.resalte : C.tinta, 'izq', activa ? { tam: 6.6, peso: 600 } : { tam: 6.6 }).poner(t('atq.restablecer'));
        if (activa) g.fillStyle(n(C.resalte), 1).fillTriangle(10, yr + 2, 10, yr + 7, 13, yr + 4.5);
        this.puntero.zona(10, yr - 1, 220, 10, () => this.mover(4));
      }
    }

    // Detalle: el ataque nuevo (si hay uno para aprender) o el marcado; y la ayuda.
    const h = (this.d.nuevo && !this.eligiendo ? DATOS.habilidades.get(this.d.nuevo)! : detalle) as Habilidad | null;
    if (h) {
      const texto = describirHabilidad(h) || t('atq.sinEfecto');
      new Texto(this, 10, 127, 220, 10, C.tinta, 'izq', { tam: 6.6 }).poner(lineaHabilidad(h));
      new Texto(this, 10, 135, 220, 10, C.tintaSuave, 'izq', { tam: 6.2 }).poner(partir(texto, 330, 6.2)[0]!);
    }
    new Texto(this, 10, 145, 220, 10, this.d.aviso ? C.resalte : C.tintaSuave, 'izq', { tam: 6.2 }).poner(this.d.aviso || t(`atq.ayuda.${this.eligiendo ? 'elegir' : this.d.modo}`));

    Entrada.escuchar((a) => this.tecla(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private fila(g: Phaser.GameObjects.Graphics, y: number, alto: number, h: Habilidad, etiqueta: string, activa: boolean, fijo: boolean, alTocar: () => void, flechas = false): void {
    g.fillStyle(activa ? 0xfde9c8 : n(C.papelSombra), fijo ? 0.55 : 1).fillRoundedRect(10, y, 220, alto, 3);
    if (activa) g.lineStyle(1, n(C.resalte), 1).strokeRoundedRect(10, y, 220, alto, 3);
    g.fillStyle(COLOR_TIPO[h.tipo] ?? 0x566c86, 1).fillRect(14, y + 3, 3, alto - 6);
    const dato = flechas && activa ? `◀ ${t('atq.cambiar')} ▶` : h.potencia > 0 ? t('info.potencia', { p: h.potencia, a: h.precision ?? 100 }) : t(`cat.${h.categoria}`);
    if (alto < 15) {
      // Fila compacta: nombre a la izquierda; rol y datos a la derecha.
      new Texto(this, 20, y + alto / 2 - 5, 110, 10, fijo ? C.apagado : C.tinta, 'izq', { peso: 600, tam: 7.2 }).poner(h.nombre);
      new Texto(this, 110, y + alto / 2 - 5, 114, 10, C.tintaSuave, 'der', { tam: 5.8 }).poner(`${etiqueta} · ${dato}`);
    } else {
      new Texto(this, 20, y + 1, 100, 8, C.tintaSuave, 'izq', { tam: 5.6 }).poner(etiqueta);
      new Texto(this, 20, y + alto - 10, 130, 10, fijo ? C.apagado : C.tinta, 'izq', { peso: 600, tam: 7.2 }).poner(h.nombre);
      new Texto(this, 120, y + alto / 2 - 5, 104, 10, C.tintaSuave, 'der', { tam: 5.8 }).poner(dato);
    }
    this.puntero.zona(10, y, 220, alto, alTocar);
  }

  /** Ataques que puede poner en un espacio (modo gestionar): el actual y los que sabe que no están en otro espacio. */
  private alternativas(espacio: number): string[] {
    const kit = ataquesDe(DATOS, this.c);
    const actual = kit[espacio]!;
    return [actual, ...conocidos(DATOS, this.c).filter((id) => !kit.includes(id))];
  }

  private filas(): number {
    if (this.eligiendo) return this.d.opciones?.length ?? 0;
    return this.d.modo === 'gestionar' ? 5 : 4;
  }

  private mover(i: number): void {
    // Solo marca: confirmar es A o el toque (D280); si no, pasar el mouse por la fila marcada la confirmaba.
    if (i === this.d.sel) return;
    sonido.tocar('cursor');
    this.scene.restart({ ...this.d, sel: i, aviso: '' });
  }

  private tecla(a: AccionEntrada): void {
    const total = this.filas();
    if (a === 'arriba' || a === 'abajo') {
      if (!total) return;
      sonido.tocar('cursor');
      this.scene.restart({ ...this.d, sel: ((this.d.sel ?? 0) + (a === 'abajo' ? 1 : total - 1)) % total, aviso: '' });
      return;
    }
    if (a === 'b') {
      sonido.tocar('cancelar');
      if (this.d.modo === 'pergamino' && this.d.nuevo) return void this.scene.restart({ ...this.d, nuevo: null, sel: 0, aviso: '' });
      if (this.d.modo === 'oferta' && this.d.nuevo) {
        descartarOferta(this.c);
        juego.guardar();
      }
      return this.salir();
    }
    const sel = this.d.sel ?? 0;
    if (this.d.modo === 'gestionar' && (a === 'izquierda' || a === 'derecha') && sel < ESPACIO_FINAL) {
      const alt = this.alternativas(sel);
      if (alt.length < 2) return void sonido.tocar('negado');
      const sig = alt[a === 'derecha' ? 1 : alt.length - 1]!;
      aprender(DATOS, this.c, sig, sel);
      juego.guardar();
      sonido.tocar('aceptar');
      return void this.scene.restart({ ...this.d, aviso: '' });
    }
    if (a !== 'a') return;
    if (this.eligiendo) {
      const id = this.d.opciones?.[sel];
      if (!id) return void sonido.tocar('negado');
      sonido.tocar('aceptar');
      return void this.scene.restart({ ...this.d, nuevo: id, sel: 0, aviso: '' });
    }
    if (this.d.modo === 'gestionar') {
      if (sel === 4) {
        restablecer(this.c);
        juego.guardar();
        sonido.tocar('aceptar');
        return void this.scene.restart({ ...this.d, aviso: t('atq.restablecido') });
      }
      if (sel === ESPACIO_FINAL) return void this.scene.restart({ ...this.d, aviso: t('atq.finalFijo') });
      return void this.tecla('derecha');
    }
    // oferta o pergamino con ataque elegido: se reemplaza el espacio marcado.
    if (sel === ESPACIO_FINAL) {
      sonido.tocar('negado');
      return void this.scene.restart({ ...this.d, aviso: t('atq.finalFijo') });
    }
    const nuevo = this.d.nuevo!;
    const viejo = DATOS.habilidades.get(ataquesDe(DATOS, this.c)[sel]!)!.nombre;
    if (!aprender(DATOS, this.c, nuevo, sel)) return void sonido.tocar('negado');
    if (this.d.modo === 'pergamino') quitar(juego.estado, 'pergamino');
    juego.guardar();
    sonido.tocar('victoria');
    this.cameras.main.flash(200, 255, 240, 200);
    this.salir(t('atq.aprendio', { n: nombreDe(DATOS, this.c), a: DATOS.habilidades.get(nuevo)!.nombre, v: viejo }));
  }

  private salir(aviso?: string): void {
    const v = this.d.volver ?? { escena: 'Equipo' };
    this.scene.start(v.escena, { ...(v.datos ?? {}), ...(aviso ? { aviso } : {}) });
  }
}
