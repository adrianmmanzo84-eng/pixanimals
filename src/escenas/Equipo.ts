import Phaser from 'phaser';
import { bloqueoFusion, enExpedicion, fusionar } from '../core/progresion/coleccion';
import { Puntero, saltito } from '../ui/puntero';
import { DATOS } from '../core/datos';
import { bonusStats, criaturaDe, potencialDe } from '../core/estado/juego';
import { cantidad, equiparAmuleto } from '../core/items/items';
import { calcularStats } from '../core/combate/formulas';
import { costoLlenar, evolucionar, infundirEsencia, opcionesEvolucion, puedeEvolucionar, tieneEvolucion, type OpcionEvolucion } from '../core/progresion/evolucion';
import { xpParaSubir } from '../core/progresion/experiencia';
import type { CriaturaJugador } from '../esquemas/esquemas';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { COLOR_RAREZA, estrellas, miniatura, textura } from '../ui/criaturas';
import { C, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { partir, Texto } from '../ui/texto';

type Accion = { id: 'frente' | 'sacar' | 'sumar' | 'entrenar' | 'amuleto' | 'fusionar' } | { id: 'evo'; op: OpcionEvolucion };

/**
 * Mis criaturas: toda la colección (primero el equipo, en orden), con experiencia, barra de Entrenamiento
 * y las acciones de cada una: poner al frente, entrar o salir del equipo, entrenar con Esencia y evolucionar.
 */
export class Equipo extends Phaser.Scene {
  private sel = 0;
  private aviso = '';
  private acciones: Accion[] | null = null;
  private accion = 0;
  private lista: CriaturaJugador[] = [];
  private ocupado = false;

  constructor() {
    super('Equipo');
  }

  private scrollFijo: number | undefined;
  private salto = false;
  private puntero!: Puntero;

  init(d: { sel?: number; aviso?: string; acciones?: boolean; accion?: number; scroll?: number; salto?: boolean }): void {
    this.sel = d?.sel ?? 0;
    this.scrollFijo = d?.scroll;
    this.salto = !!d?.salto;
    this.aviso = d?.aviso ?? '';
    this.acciones = null;
    this.accion = d?.accion ?? 0;
    this.ocupado = false;
    if (d?.acciones) this.acciones = [];
  }

  private ordenar(): CriaturaJugador[] {
    const e = juego.estado;
    const enEquipo = e.equipo.flatMap((id) => criaturaDe(e, id) ?? []);
    const orden = [...DATOS.criaturas.keys()];
    const resto = e.criaturas.filter((c) => !e.equipo.includes(c.especie)).sort((a, b) => orden.indexOf(a.especie) - orden.indexOf(b.especie));
    return [...enEquipo, ...resto];
  }

  create(): void {
    const estado = juego.estado;
    this.lista = this.ordenar();
    this.sel = Math.max(0, Math.min(this.sel, this.lista.length - 1));
    const elegida = this.lista[this.sel];
    if (this.acciones && elegida) this.acciones = this.armarAcciones(elegida);
    this.accion = Math.min(this.accion, Math.max(0, (this.acciones?.length ?? 1) - 1));
    const scroll = this.scrollFijo ?? Math.max(0, Math.min(this.sel - 1, this.lista.length - 3));
    this.puntero = new Puntero(this);

    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    ventana(g, 4, 4, 232, 116);
    ventana(g, 4, 124, 232, 32);

    this.lista.slice(scroll, scroll + 3).forEach((c, k) => {
      const i = scroll + k;
      const especie = DATOS.criaturas.get(c.especie)!;
      const y = 10 + k * 36;
      const activa = i === this.sel;
      g.fillStyle(activa ? 0xfde9c8 : n(C.papelSombra), 1).fillRoundedRect(10, y, 220, 33, 4);
      if (activa) g.lineStyle(1.2, n(C.resalte), 1).strokeRoundedRect(10, y, 220, 33, 4);
      miniatura(this.add.image(28, y + 16, textura(c.especie, 'frente', c.brillante)), c.especie, 30, 0.6);
      const nombre = new Texto(this, 48, y + 2, 80, 10, C.tinta, 'izq', { peso: 600 }).poner(especie.nombre + (c.brillante ? ' ✦' : ''));
      if (activa && this.salto && !this.acciones) saltito(this, nombre.imagen);
      if (!this.acciones)
        this.puntero.zona(10, y, 220, 33, () => {
          if (i === this.sel || this.ocupado) return;
          sonido.tocar('cursor');
          this.scene.restart({ sel: i, scroll, salto: true });
        });
      g.fillStyle(COLOR_TIPO[especie.tipo] ?? 0x5b6a8c, 1).fillRoundedRect(48, y + 12, 30, 8, 3);
      new Texto(this, 48, y + 12, 30, 9, C.papel, 'centro', { tam: 6 }).poner(DATOS.tipos.get(especie.tipo)!.nombre.toUpperCase());
      new Texto(this, 82, y + 12, 70, 10, COLOR_RAREZA[c.rareza], 'izq', { tam: 6.6 }).poner(estrellas(c.rareza));
      const puesto = estado.equipo.indexOf(c.especie);
      new Texto(this, 150, y + 2, 76, 10, puesto >= 0 ? C.tinta : C.tintaSuave, 'der').poner(
        `${t('nv', { n: c.nivel })} · ${puesto >= 0 ? t('mc.equipo', { n: puesto + 1 }) : enExpedicion(estado, c.especie) ? t('mc.expedicion') : t('mc.reserva')}`,
      );
      // Barra de experiencia.
      const max = c.nivel >= DATOS.balance.nivelMax;
      const meta = xpParaSubir(DATOS, c.nivel);
      g.fillStyle(C.barraFondo, 1).fillRoundedRect(48, y + 22, 96, 3, 1.5);
      g.fillStyle(0x5aa9f0, 1).fillRoundedRect(48, y + 22, Math.max(2, 96 * (max ? 1 : c.xp / meta)), 3, 1.5);
      new Texto(this, 146, y + 19, 80, 9, C.tintaSuave, 'der', { tam: 6 }).poner(max ? t('eq.max') : t('eq.xp', { a: Math.floor(c.xp), b: meta }));
      // Barra de Entrenamiento (solo si todavía puede evolucionar).
      if (tieneEvolucion(DATOS, c)) {
        const emax = DATOS.economia.entrenamiento.max;
        g.fillStyle(C.barraFondo, 1).fillRoundedRect(48, y + 28, 96, 3, 1.5);
        g.fillStyle(0xf5a623, 1).fillRoundedRect(48, y + 28, Math.max(2, (96 * c.entrenamiento) / emax), 3, 1.5);
        const lista = puedeEvolucionar(DATOS, estado, c);
        new Texto(this, 146, y + 25, 80, 9, lista ? C.resalte : C.tintaSuave, 'der', { tam: 6, peso: lista ? 600 : 500 }).poner(
          lista ? t('mc.lista') : t('mc.entrenamiento', { a: c.entrenamiento, b: emax }),
        );
      } else new Texto(this, 146, y + 25, 80, 9, C.tintaSuave, 'der', { tam: 6 }).poner(t('mc.ultima'));
    });
    if (scroll > 0) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(118, 7, 122, 7, 120, 5);
    if (scroll + 3 < this.lista.length) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(118, 117, 122, 117, 120, 119);

    if (!elegida) new Texto(this, 10, 128, 220, 10, C.tintaSuave).poner(t('menu.sinEquipo'));
    else if (this.acciones) this.pintarAcciones(g, elegida);
    else {
      const s = calcularStats(DATOS.criaturas.get(elegida.especie)!, elegida.nivel, DATOS.balance, potencialDe(DATOS, elegida.rareza), bonusStats(DATOS, elegida));
      new Texto(this, 10, 128, 220, 10).poner(t('eq.stats', { ...s }));
      const am = elegida.amuleto ? DATOS.items.get(elegida.amuleto)?.nombre : null;
      new Texto(this, 10, 140, 220, 10, this.aviso ? C.resalte : C.tintaSuave).poner(this.aviso || (am ? t('mc.ayudaAmuleto', { a: am }) : t('mc.ayuda')));
    }

    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private armarAcciones(c: CriaturaJugador): Accion[] {
    const enEquipo = juego.estado.equipo.includes(c.especie);
    const res: Accion[] = [];
    if (enEquipo && juego.estado.equipo[0] !== c.especie) res.push({ id: 'frente' });
    res.push({ id: enEquipo ? 'sacar' : 'sumar' });
    if (tieneEvolucion(DATOS, c)) res.push({ id: 'entrenar' });
    if (c.amuleto || this.amuletosEnBolsa().length) res.push({ id: 'amuleto' });
    if ((juego.estado.copias[c.especie] ?? 0) > 0) res.push({ id: 'fusionar' });
    for (const op of opcionesEvolucion(DATOS, juego.estado, c)) res.push({ id: 'evo', op });
    return res;
  }

  private amuletosEnBolsa(): string[] {
    return [...DATOS.items.values()].filter((i) => i.efecto.tipo === 'amuleto' && cantidad(juego.estado, i.id) > 0).map((i) => i.id);
  }

  /** Amuleto que se pone al pulsar: el siguiente de la Bolsa; después del último, ninguno. */
  private siguienteAmuleto(c: CriaturaJugador): string | null {
    const todos = [...DATOS.items.values()].filter((i) => i.efecto.tipo === 'amuleto').map((i) => i.id);
    const desde = c.amuleto ? todos.indexOf(c.amuleto) + 1 : 0;
    return todos.slice(desde).find((id) => cantidad(juego.estado, id) > 0) ?? null;
  }

  private etiqueta(a: Accion): string {
    if (a.id === 'evo') return t('mc.ac.evo', { n: DATOS.criaturas.get(a.op.a)!.nombre });
    return t(`mc.ac.${a.id}`);
  }

  /** Explica la acción elegida: qué hace, cuánto cuesta o qué le falta. */
  private descripcion(a: Accion, c: CriaturaJugador): { texto: string; puede: boolean } {
    const e = juego.estado;
    const max = DATOS.economia.tamanoEquipo;
    switch (a.id) {
      case 'frente':
        return { texto: t('mc.d.frente'), puede: true };
      case 'sacar':
        return e.equipo.length <= 1 ? { texto: t('mc.d.ultima'), puede: false } : { texto: t('mc.d.sacar'), puede: true };
      case 'sumar':
        if (enExpedicion(e, c.especie)) return { texto: t('mc.d.expedicion'), puede: false };
        return e.equipo.length >= max ? { texto: t('mc.d.lleno'), puede: false } : { texto: t('mc.d.sumar', { n: max }), puede: true };
      case 'fusionar': {
        const m = bloqueoFusion(DATOS, e, c.especie);
        const copias = e.copias[c.especie] ?? 0;
        const necesita = DATOS.economia.fusion.copias;
        if (m === 'maxima') return { texto: t('mc.d.fusionMax', { c: copias }), puede: false };
        if (m === 'pocas_copias') return { texto: t('mc.d.fusionPocas', { c: copias, n: necesita }), puede: false };
        return { texto: t('mc.d.fusion', { c: copias, n: necesita }), puede: true };
      }
      case 'amuleto': {
        const sig = this.siguienteAmuleto(c);
        const lleva = c.amuleto ? t('mc.d.lleva', { a: DATOS.items.get(c.amuleto)!.nombre }) : t('mc.d.sinAmuleto');
        return { texto: `${lleva} ${sig ? t('mc.d.poner', { a: DATOS.items.get(sig)!.nombre }) : t('mc.d.quitar')}`, puede: true };
      }
      case 'entrenar': {
        const costo = costoLlenar(DATOS, c);
        if (costo <= 0) return { texto: t('mc.d.entrenarLlena'), puede: false };
        if (e.esencia <= 0) return { texto: t('mc.d.entrenarSin'), puede: false };
        if (e.esencia < costo) {
          const p = Math.floor(e.esencia / DATOS.economia.entrenamiento.esenciaPorPunto);
          return { texto: t('mc.d.entrenarParcial', { t: e.esencia, p }), puede: p > 0 };
        }
        return { texto: t('mc.d.entrenar', { c: costo, t: e.esencia }), puede: true };
      }
      case 'evo': {
        const o = a.op;
        if (o.puede) return { texto: t('mc.d.evo.puede'), puede: true };
        if (o.yaLaTienes) return { texto: t('mc.d.evo.yaLaTienes', { n: DATOS.criaturas.get(o.a)!.nombre }), puede: false };
        const faltas = [];
        if (!o.cumpleNivel) faltas.push(t('mc.d.evo.nivel', { n: o.nivel }));
        if (!o.cumpleEntrenamiento) faltas.push(t('mc.d.evo.entrenamiento'));
        if (!o.tieneItem && o.item) faltas.push(t('mc.d.evo.item', { i: DATOS.items.get(o.item)!.nombre }));
        return { texto: faltas.join(' '), puede: false };
      }
    }
  }

  private pintarAcciones(g: Phaser.GameObjects.Graphics, c: CriaturaJugador): void {
    const acciones = this.acciones!;
    acciones.forEach((a, i) => {
      const x = 14 + (i % 3) * 74;
      const y = 127 + Math.floor(i / 3) * 9;
      const d = this.descripcion(a, c);
      const tx = new Texto(this, x, y, 70, 10, i === this.accion ? C.resalte : d.puede ? C.tinta : C.apagado).poner(this.etiqueta(a));
      if (i === this.accion && this.salto) saltito(this, tx.imagen);
      this.puntero.zona(x - 6, y - 1, 74, 9, () => {
        if (i === this.accion || this.ocupado) return;
        sonido.tocar('cursor');
        this.scene.restart({ sel: this.sel, acciones: true, accion: i, salto: true });
      });
      if (i === this.accion) g.fillStyle(n(C.resalte), 1).fillTriangle(x - 5, y + 2, x - 5, y + 8, x - 1, y + 5);
    });
    const d = this.descripcion(acciones[this.accion]!, c);
    const filas = Math.ceil(acciones.length / 3);
    const texto = this.aviso || d.texto;
    new Texto(this, 10, 127 + filas * 9, 222, 10, this.aviso ? C.resalte : C.tintaSuave, 'izq', { tam: 6.6 }).poner(partir(texto, 300, 6.6)[0]!);
  }

  private alPulsar(a: AccionEntrada): void {
    if (this.ocupado) return;
    const total = this.lista.length;
    if (this.acciones) return this.enAcciones(a);
    if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Menu');
    } else if ((a === 'arriba' || a === 'abajo') && total) {
      sonido.tocar('cursor');
      this.scene.restart({ sel: (this.sel + (a === 'abajo' ? 1 : total - 1)) % total, salto: true });
    } else if (a === 'a' && total) {
      sonido.tocar('aceptar');
      this.scene.restart({ sel: this.sel, acciones: true });
    }
  }

  private enAcciones(a: AccionEntrada): void {
    const acciones = this.acciones!;
    const c = this.lista[this.sel]!;
    if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.restart({ sel: this.sel });
      return;
    }
    if (a === 'izquierda' || a === 'derecha' || a === 'arriba' || a === 'abajo') {
      const paso = a === 'derecha' ? 1 : a === 'izquierda' ? -1 : a === 'abajo' ? 3 : -3;
      const sig = this.accion + paso;
      if (sig < 0 || sig >= acciones.length) return;
      sonido.tocar('cursor');
      this.scene.restart({ sel: this.sel, acciones: true, accion: sig, salto: true });
      return;
    }
    if (a !== 'a') return;
    const ac = acciones[this.accion]!;
    if (!this.descripcion(ac, c).puede) {
      sonido.tocar('negado');
      return;
    }
    const e = juego.estado;
    const volver = (aviso = '', sel = this.sel) => this.scene.restart({ sel, aviso });
    if (ac.id === 'frente') {
      e.equipo = [c.especie, ...e.equipo.filter((x) => x !== c.especie)];
      juego.guardar();
      sonido.tocar('aceptar');
      volver('', 0);
    } else if (ac.id === 'sacar') {
      e.equipo = e.equipo.filter((x) => x !== c.especie);
      juego.guardar();
      sonido.tocar('aceptar');
      volver('', e.equipo.length);
    } else if (ac.id === 'sumar') {
      e.equipo.push(c.especie);
      juego.guardar();
      sonido.tocar('aceptar');
      volver('', e.equipo.length - 1);
    } else if (ac.id === 'amuleto') {
      const sig = this.siguienteAmuleto(c);
      equiparAmuleto(DATOS, e, c.especie, sig);
      juego.guardar();
      sonido.tocar('aceptar');
      const nombre = DATOS.criaturas.get(c.especie)!.nombre;
      this.scene.restart({ sel: this.sel, acciones: true, accion: this.accion, aviso: sig ? t('mc.ok.amuleto', { n: nombre, a: DATOS.items.get(sig)!.nombre }) : t('mc.ok.sinAmuleto', { n: nombre }) });
    } else if (ac.id === 'fusionar') {
      const nueva = fusionar(DATOS, e, c.especie);
      juego.guardar();
      sonido.tocar('victoria');
      this.cameras.main.flash(200, 255, 240, 180);
      const nombre = DATOS.criaturas.get(c.especie)!.nombre;
      const rz = DATOS.sobres.rarezas.find((x) => x.id === nueva)!.nombre;
      this.scene.restart({ sel: this.sel, acciones: true, accion: this.accion, aviso: t('mc.ok.fusion', { n: nombre, r: rz }) });
    } else if (ac.id === 'entrenar') {
      const p = infundirEsencia(DATOS, e, c.especie);
      juego.guardar();
      sonido.tocar('sube');
      this.scene.restart({ sel: this.sel, acciones: true, accion: this.accion, aviso: t('mc.ok.entrenar', { n: DATOS.criaturas.get(c.especie)!.nombre, p }) });
    } else if (ac.id === 'evo') {
      sonido.tocar('aceptar');
      void this.animarEvolucion(c, ac.op.a);
    }
  }

  /** Animación nostálgica: la criatura parpadea entre su silueta y la de su evolución, cada vez más rápido. B la detiene. */
  private async animarEvolucion(c: CriaturaJugador, destino: string): Promise<void> {
    this.ocupado = true;
    const antes = DATOS.criaturas.get(c.especie)!;
    const despues = DATOS.criaturas.get(destino)!;
    let cancelada = false;
    let esperandoA: (() => void) | null = null;
    Entrada.escuchar((a) => {
      if (a === 'b' && !esperandoA) cancelada = true;
      if (a === 'a' && esperandoA) esperandoA();
    });
    const esperar = (ms: number) => new Promise<void>((r) => this.time.delayedCall(ms, () => r()));

    this.add.graphics().fillStyle(0x141830, 1).fillRect(0, 0, 240, 160);
    const brillo = this.add.graphics();
    // Tamaño real de combate, apoyada en la base: al evolucionar se nota cuánto crece.
    const sprite = this.add.image(120, 112, textura(c.especie, 'frente', c.brillante)).setOrigin(0.5, 1);
    const g = this.add.graphics();
    ventana(g, 4, 120, 232, 36);
    const msg = new Texto(this, 12, 126, 216, 20);
    const ayuda = new Texto(this, 12, 144, 216, 10, C.tintaSuave, 'der', { tam: 6.6 });
    msg.poner(t('evo.empieza', { n: antes.nombre }));
    sonido.tocar('estado');
    await esperar(1100);
    ayuda.poner(t('evo.cancelar'));

    // Parpadeo que acelera: de 420 ms a 50 ms entre cambios.
    let pausa = 420;
    let nueva = false;
    for (let k = 0; k < 26 && !cancelada; k++) {
      nueva = !nueva;
      sprite.setTexture(textura(nueva ? destino : c.especie, 'blanca'));
      brillo.clear().fillStyle(0xffffff, 0.08 + k * 0.012).fillCircle(120, 72, 24 + k);
      if (k % 3 === 0) sonido.tocar('cursor');
      await esperar(pausa);
      pausa = Math.max(50, pausa * 0.86);
    }
    ayuda.poner('');
    if (cancelada) {
      sprite.setTexture(textura(c.especie, 'frente', c.brillante));
      brillo.clear();
      sonido.tocar('cancelar');
      msg.poner(t('evo.cancelada', { n: antes.nombre }));
    } else {
      evolucionar(DATOS, juego.estado, c.especie, destino);
      juego.guardar();
      this.cameras.main.flash(500, 255, 255, 255);
      sprite.setTexture(textura(destino, 'frente', c.brillante));
      brillo.clear().fillStyle(0xfde9c8, 0.18).fillCircle(120, 72, 48);
      sonido.tocar('victoria');
      this.tweens.add({ targets: sprite, scale: 1.08, duration: 160, yoyo: true });
      msg.poner(partir(t('evo.lista', { n: antes.nombre, m: despues.nombre }), 214).join('\n'));
    }
    await esperar(500);
    ayuda.poner(t('premio.continuar'));
    await new Promise<void>((r) => (esperandoA = r));
    sonido.tocar('aceptar');
    this.scene.restart({ sel: this.sel });
  }
}
