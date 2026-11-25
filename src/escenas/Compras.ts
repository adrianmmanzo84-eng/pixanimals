import Phaser from 'phaser';
import { Puntero, saltito } from '../ui/puntero';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { idioma, t } from '../i18n/i18n';
import { juego } from '../juego';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { iconoMoneda } from '../ui/iconos';
import { partir, Texto } from '../ui/texto';
import { comprasHoy, MAX_POR_DIA, PRODUCTOS, vetoDeCompra, type Producto } from '../core/compras/compras';
import { comprarProducto, recuperarPendientes, type ResultadoCompra } from '../compras/flujo';
import { pasarela } from '../compras/pasarela';
import { registro } from '../compras/registro';
import { pedirAdulto } from '../ui/adultoDom';

/** Cuántos íconos de moneda o gema se dibujan según el tamaño del paquete (para que se vea cuál es más grande). */
const GRADO: Record<string, number> = { monedas_1200: 1, monedas_6600: 3, monedas_14400: 5, cristales_300: 1, cristales_1650: 3, cristales_3600: 5 };

const formato = (v: number) => v.toLocaleString(idioma() === 'es' ? 'es-AR' : 'en-US');

/** Precios que informó Google Play (ya en la moneda del jugador). Si no responde, se muestra el de referencia en dólares. */
let preciosPlay: Record<string, string> | null = null;

export const nombreProducto = (p: Producto): string =>
  p.tipo === 'pack' ? t('compras.p.bienvenida') : t(p.tipo === 'monedas' ? 'compras.p.monedas' : 'compras.p.cristales', { n: formato(p.tipo === 'monedas' ? p.monedas : p.cristales) });

const precioDe = (p: Producto): string => preciosPlay?.[p.id] ?? t('compras.precio', { p: idioma() === 'es' ? p.usd : p.usd.replace(',', '.') });

/** Monedas y Cristales: compra con dinero real, opcional. Siempre pide la confirmación de un adulto. */
export class Compras extends Phaser.Scene {
  private sel = 0;
  private aviso = '';
  private ocupado = false;
  private salto = false;

  constructor() {
    super('Compras');
  }

  init(d: { sel?: number; aviso?: string; salto?: boolean }): void {
    this.sel = d?.sel ?? 0;
    this.aviso = d?.aviso ?? '';
    this.salto = !!d?.salto;
  }

  create(): void {
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    const estado = juego.estado;
    new Texto(this, 6, 3, 130, 14, '#ffffff', 'izq', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('compras.titulo'));
    iconoMoneda(g, 'monedas', 150, 10);
    new Texto(this, 155, 5, 34, 10, '#ffffff', 'izq', { borde: '#2b3a78' }).poner(String(estado.monedas));
    iconoMoneda(g, 'esencia', 196, 10);
    new Texto(this, 201, 5, 34, 10, '#ffffff', 'izq', { borde: '#2b3a78' }).poner(String(estado.esencia));

    ventana(g, 4, 20, 140, 100);
    ventana(g, 148, 20, 88, 100);
    ventana(g, 4, 124, 232, 32);

    const puntero = new Puntero(this);
    PRODUCTOS.forEach((p, i) => {
      const y = 25 + i * 11.8;
      if (i === this.sel) g.fillStyle(0xfde9c8, 1).fillRoundedRect(8, y - 1, 132, 11, 2);
      this.iconoFila(g, p, 15, y + 4.5);
      const nombre = new Texto(this, 22, y, 74, 10, i === this.sel ? C.resalte : C.tinta, 'izq', { peso: i === this.sel ? 600 : 500 }).poner(nombreProducto(p));
      if (i === this.sel && this.salto) saltito(this, nombre.imagen);
      new Texto(this, 92, y, 46, 10, i === this.sel ? C.resalte : C.tinta, 'der', { peso: 600 }).poner(precioDe(p));
      // Tocar (o pasar el mouse) solo elige; nunca compra (D278).
      puntero.zona(8, y - 1, 132, 11.5, () => {
        if (i === this.sel || this.ocupado) return;
        sonido.tocar('cursor');
        this.scene.restart({ sel: i, salto: true, aviso: '' });
      });
    });

    // Detalle de lo elegido.
    const p = PRODUCTOS[this.sel]!;
    this.dibujarGrande(g, p, 192, 36);
    new Texto(this, 150, 49, 84, 10, C.tinta, 'centro', { peso: 600 }).poner(nombreProducto(p));
    const desc = t(`compras.d.${p.tipo}`, { m: formato(p.monedas), c: formato(p.cristales) });
    new Texto(this, 152, 59, 82, 44, C.tintaSuave, 'izq', { tam: 6 }).poner(partir(desc, 80, 6).join('\n'));
    // El botón del precio es lo único que compra con un toque (con el teclado o el botón A del mando: A).
    g.fillStyle(n(C.resalte), 1).fillRoundedRect(158, 106, 68, 10, 3);
    new Texto(this, 158, 106, 68, 10, C.papel, 'centro', { peso: 600, tam: 6.6 }).poner(precioDe(p));
    this.add
      .zone(156, 104, 72, 14)
      .setOrigin(0, 0)
      .setDepth(1001)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (!this.ocupado) void this.comprar(PRODUCTOS[this.sel]!);
      });

    // Pie: aviso del último intento o, si no hay, el estado de las compras (de prueba / no disponibles aquí).
    const hoy = comprasHoy(estado, Date.now());
    const linea1 = new Texto(this, 9, 126, 222, 9, this.aviso ? C.resalte : C.tintaSuave, 'izq', { tam: 5.8, peso: this.aviso ? 600 : 500 }).poner(this.aviso || t('compras.aviso'));
    void pasarela().then((pas) => {
      if (this.aviso || pas.modo === 'play') return;
      linea1.poner(t(pas.modo === 'simulada' ? 'compras.prueba' : 'compras.noDisponible'), pas.modo === 'simulada' ? C.resalte : C.tintaSuave);
    });
    new Texto(this, 9, 134, 222, 9, C.tintaSuave, 'izq', { tam: 5.6 }).poner(`${t('compras.hoy', { n: hoy, max: MAX_POR_DIA })} · ${t('compras.probs')}`);
    new Texto(this, 9, 142, 222, 9, C.tintaSuave, 'izq', { tam: 5.6 }).poner(t('compras.ayuda'));

    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));

    // Precios de Google Play y compras que hayan quedado sin entregar (una sola vez por apertura).
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    const pas = await pasarela();
    if (preciosPlay === null && pas.modo === 'play') {
      preciosPlay = await pas.precios();
      if (this.scene.isActive('Compras') && Object.keys(preciosPlay).length) this.scene.restart({ sel: this.sel, aviso: this.aviso });
      return;
    }
    const entregadas = await recuperarPendientes();
    if (entregadas.length && this.scene.isActive('Compras')) this.scene.restart({ sel: this.sel, aviso: t('compras.recuperada') });
  }

  private iconoFila(g: Phaser.GameObjects.Graphics, p: Producto, x: number, y: number): void {
    if (p.tipo === 'pack') this.regalo(g, x, y, 0.55);
    else iconoMoneda(g, p.tipo === 'monedas' ? 'monedas' : 'esencia', x, y);
  }

  /** Dibujo grande: más íconos cuanto más grande es el paquete. */
  private dibujarGrande(g: Phaser.GameObjects.Graphics, p: Producto, x: number, y: number): void {
    if (p.tipo === 'pack') {
      this.regalo(g, x, y + 1, 1.5);
      iconoMoneda(g, 'monedas', x - 17, y + 6);
      iconoMoneda(g, 'esencia', x + 17, y + 6);
      return;
    }
    const k = GRADO[p.id] ?? 1;
    const moneda = p.tipo === 'monedas' ? 'monedas' : 'esencia';
    // Pirámide: 1 → una; 3 → dos abajo y una arriba; 5 → tres abajo y dos arriba.
    const abajo = k === 1 ? [0] : k === 3 ? [-4.5, 4.5] : [-9, 0, 9];
    const arriba = k === 1 ? [] : k === 3 ? [0] : [-4.5, 4.5];
    abajo.forEach((dx) => iconoMoneda(g, moneda, x + dx, y + (k === 1 ? 2 : 5)));
    arriba.forEach((dx) => iconoMoneda(g, moneda, x + dx, y - 2));
  }

  /** Caja de regalo para el pack de bienvenida. */
  private regalo(g: Phaser.GameObjects.Graphics, x: number, y: number, k: number): void {
    g.fillStyle(0x7a2a3a, 1).fillRect(x - 5 * k, y - 3 * k, 10 * k, 8 * k);
    g.fillStyle(0xd0425a, 1).fillRect(x - 4.2 * k, y - 2.2 * k, 8.4 * k, 6.4 * k);
    g.fillStyle(0xf5c542, 1).fillRect(x - 0.9 * k, y - 3 * k, 1.8 * k, 8 * k);
    g.fillStyle(0xf5c542, 1).fillRect(x - 5 * k, y - 0.4 * k, 10 * k, 1.6 * k);
    g.fillStyle(0xf5c542, 1).fillCircle(x - 1.8 * k, y - 4 * k, 1.5 * k).fillCircle(x + 1.8 * k, y - 4 * k, 1.5 * k);
  }

  private alPulsar(a: AccionEntrada): void {
    if (this.ocupado) return;
    const total = PRODUCTOS.length;
    if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Tienda');
    } else if (a === 'arriba' || a === 'abajo') {
      sonido.tocar('cursor');
      this.scene.restart({ sel: (this.sel + (a === 'abajo' ? 1 : total - 1)) % total, salto: true });
    } else if (a === 'a') {
      // Un toque en cualquier parte de la pantalla no compra: hay que tocar el botón del precio (D278).
      if (Entrada.esToque()) return;
      void this.comprar(PRODUCTOS[this.sel]!);
    }
  }

  private async comprar(p: Producto): Promise<void> {
    this.ocupado = true;
    const mensaje = await this.intentar(p);
    this.ocupado = false;
    if (!this.scene.isActive('Compras')) return;
    sonido.tocar(mensaje.ok ? 'sube' : 'negado');
    this.scene.restart({ sel: this.sel, aviso: mensaje.texto });
  }

  private async intentar(p: Producto): Promise<{ ok: boolean; texto: string }> {
    const mal = (r: ResultadoCompra): { ok: boolean; texto: string } => ({
      ok: false,
      texto: r === 'limite' ? t('compras.limite', { n: MAX_POR_DIA }) : t(`compras.${r === 'noDisponible' ? 'noDisponible' : r}`),
    });
    if ((await pasarela()).modo === 'ninguna') return mal('noDisponible');
    // Se avisa del límite antes de molestar al adulto con la cuenta.
    const veto = vetoDeCompra(juego.estado, p.id, Date.now(), registro);
    if (veto === 'yaTienes' && registro.bienvenida !== null && registro.bienvenida !== juego.ranura) return { ok: false, texto: t('compras.yaTienesOtra', { n: registro.bienvenida }) };
    if (veto === 'limite' || veto === 'yaTienes') return mal(veto);
    if (!(await pedirAdulto())) return { ok: false, texto: '' };
    const r = await comprarProducto(p.id);
    if (r === 'ok') return { ok: true, texto: t('compras.ok', { p: nombreProducto(p) }) };
    return mal(r);
  }
}

