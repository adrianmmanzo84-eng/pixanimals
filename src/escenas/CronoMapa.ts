import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { avanzar, crono, era, eventoDe, excavar, fogata, mapaDe, nivelNodo, nodoActual, resolverEvento, siguientes, type Nodo } from '../core/modos/crono';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { marcaCriatura, miniatura, textura } from '../ui/criaturas';
import { C, prepararCamara, ventana } from '../ui/estilo';
import { partir, recortar, Texto } from '../ui/texto';
import { Puntero } from '../ui/puntero';
import { confeti } from '../ui/animaciones';

/** Zona del mapa donde van los nodos (el resto es el panel de abajo). */
const X0 = 32;
const X1 = 222;
const Y0 = 22;
const Y1 = 104;

/**
 * Mapa de la expedición del Cronoportal (D233): columnas de nodos conectados; se elige el siguiente entre los
 * que salen del actual. Combate y jefe abren el combate; excavación, fogata y evento se resuelven aquí.
 */
export class CronoMapa extends Phaser.Scene {
  private sel = 0;
  private aviso = '';
  private evento = false;
  private llegada = false;
  private puntero!: Puntero;

  constructor() {
    super('CronoMapa');
  }

  init(d: { sel?: number; aviso?: string; evento?: boolean; llegada?: boolean }): void {
    this.llegada = !!d?.llegada;
    this.sel = d?.sel ?? 0;
    this.aviso = d?.aviso ?? '';
    this.evento = !!d?.evento;
  }

  private pos(nodo: Nodo, mapaCols: number, cuantos: number): { x: number; y: number } {
    const x = X0 + ((X1 - X0) * nodo.col) / (mapaCols - 1);
    const y = cuantos === 1 ? (Y0 + Y1) / 2 : Y0 + ((Y1 - Y0) * (nodo.fila + 0.5)) / cuantos;
    return { x, y };
  }

  create(): void {
    prepararCamara(this);
    const ex = crono(juego.estado).expedicion;
    if (!ex) return void this.scene.start('Cronoportal', {});
    musica.tocar('torre');
    if (this.llegada) this.cameras.main.fadeIn(450, 0, 0, 0);
    this.puntero = new Puntero(this);
    const clave = `crono_mapa${ex.era}`;
    if (this.textures.exists(clave)) this.add.image(0, 0, clave).setOrigin(0, 0).setScale(0.25);
    const mapa = mapaDe(DATOS, ex.era, ex.semilla);
    const porCol = (c: number) => mapa.nodos.filter((x) => x.col === c).length;
    const P = (x: Nodo) => this.pos(x, mapa.columnas, porCol(x.col));
    const opciones = this.evento ? [] : siguientes(mapa, ex.actual);
    this.sel = Math.min(this.sel, Math.max(0, opciones.length - 1));

    // Caminos.
    const g = this.add.graphics();
    for (const a of mapa.nodos)
      for (const id of a.sig) {
        const b = mapa.nodos.find((x) => x.id === id)!;
        const pa = P(a);
        const pb = P(b);
        const hecho = ex.visitados.includes(a.id) && ex.visitados.includes(b.id);
        const abierto = a.id === ex.actual;
        const pasos = 7;
        for (let k = 1; k < pasos; k++) {
          g.fillStyle(hecho ? 0xfff1c8 : abierto ? 0xffd76a : 0x1a1c2c, hecho || abierto ? 1 : 0.45).fillCircle(pa.x + ((pb.x - pa.x) * k) / pasos, pa.y + ((pb.y - pa.y) * k) / pasos, 1.1);
        }
      }
    // Nodos.
    for (const x of mapa.nodos) {
      const p = P(x);
      const visitado = ex.visitados.includes(x.id);
      const elegible = opciones.some((o) => o.id === x.id);
      const marcado = elegible && opciones[this.sel]?.id === x.id;
      g.fillStyle(0x1a1c2c, 0.35).fillEllipse(p.x, p.y + 7, 14, 4);
      if (elegible) g.fillStyle(marcado ? 0xffd76a : 0xfff4c0, marcado ? 0.9 : 0.5).fillCircle(p.x, p.y, marcado ? 11 : 10);
      const icono = `cr_mapa_${x.tipo}`;
      if (this.textures.exists(icono)) this.add.image(p.x, p.y, icono).setAlpha(visitado && x.id !== ex.actual ? 0.55 : 1).setScale(x.tipo === 'jefe' ? 0.3125 : 0.25);
      else g.fillStyle(x.tipo === 'jefe' ? 0xc0304a : 0xf5c542, 1).fillCircle(p.x, p.y, 6);
      if (visitado && x.id !== ex.actual && this.textures.exists('cr_mapa_visitado')) this.add.image(p.x + 5, p.y + 5, 'cr_mapa_visitado').setScale(0.25);
      if (elegible) this.puntero.zona(p.x - 10, p.y - 10, 20, 20, () => (marcado ? undefined : this.mover(opciones.findIndex((o) => o.id === x.id))));
    }
    // Tu criatura en el nodo actual (o en la entrada, a la izquierda).
    const lider = ex.equipo.find((e) => (ex.vida[e] ?? 0) > 0) ?? ex.equipo[0]!;
    const act = nodoActual(DATOS, juego.estado);
    // Antes de empezar, en la entrada (a la izquierda de la primera columna); después, parada sobre su nodo (D251).
    const pa = act ? P(act) : { x: X0 - 17, y: (Y0 + Y1) / 2 + 6 };
    marcaCriatura(this, pa.x, pa.y - (act ? 12 : 6), lider, 15).setDepth(5);

    this.dibujarPanel(opciones);
    if (this.evento) this.dibujarEvento();
    Entrada.escuchar((a) => this.tecla(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private dibujarPanel(opciones: Nodo[]): void {
    const ex = crono(juego.estado).expedicion!;
    const g = this.add.graphics();
    ventana(g, 4, 4, 232, 14);
    new Texto(this, 8, 6, 160, 10, '#257179', 'izq', { tam: 6.8, peso: 600 }).poner(`${t(`crono.era${ex.era}`)} · ${t(`crono.reglaCorta.${era(DATOS, ex.era).regla}`)}${ex.grieta ? ' · ' + t('crono.grietaX2') : ''}`);
    new Texto(this, 150, 6, 82, 10, C.tintaSuave, 'der', { tam: 6.2 }).poner(t('crono.botinCorto', { m: ex.botin.monedas, f: ex.botin.fosiles, a: ex.botin.ambar }));
    ventana(g, 4, 112, 232, 44);
    // Equipo con su vida.
    ex.equipo.forEach((e, i) => {
      const x = 10 + i * 46;
      const v = ex.vida[e] ?? 0;
      miniatura(this.add.image(x + 8, 124, textura(e, 'frente')), e, 14, 0.3).setAlpha(v > 0 ? 1 : 0.35);
      g.fillStyle(0x2a2f45, 1).fillRect(x + 18, 122, 24, 4);
      g.fillStyle(v > 0.5 ? 0x3fbf6a : v > 0.2 ? 0xf5c542 : 0xe0504a, 1).fillRect(x + 18, 122, Math.round(24 * v), 4);
    });
    const o = opciones[this.sel];
    let info = '';
    if (this.aviso) info = this.aviso;
    else if (o) info = t(`crono.nodo.${o.tipo}`, { n: nivelNodo(DATOS, ex.era, o.col) });
    new Texto(this, 10, 133, 220, 14, this.aviso ? C.resalte : C.tinta, 'izq', { tam: 6.4 }).poner(recortar(info, 218, 6.4));
    new Texto(this, 4, 147, 232, 9, C.tintaSuave, 'centro', { tam: 5.8 }).poner(t('crono.mapaAyuda'));
  }

  private dibujarEvento(): void {
    const ev = eventoDe(juego.estado);
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0x141830, 0.6).fillRect(0, 0, 240, 160);
    ventana(g, 24, 26, 192, 84);
    const txt = (y: number, h: number, s: string, color: string = C.tinta, op = {}) => new Texto(this, 32, y, 176, h, color, 'izq', { tam: 6.6, ...op }).poner(s).imagen.setDepth(21);
    txt(30, 12, t(`crono.ev.${ev}.titulo`), '#257179', { tam: 8.4, peso: 600 });
    txt(43, 30, partir(t(`crono.ev.${ev}.texto`), 174, 6.6).join('\n'));
    for (const i of [0, 1] as const) {
      const y = 76 + i * 14;
      const activa = this.sel === i;
      if (activa) g.fillStyle(0xfde9c8, 1).fillRoundedRect(30, y - 1, 180, 12, 3);
      txt(y, 11, `${activa ? '▶ ' : '  '}${t(`crono.ev.${ev}.o${i}`)}`, activa ? C.resalte : C.tinta, { peso: activa ? 600 : 500 });
      this.puntero.zona(30, y - 1, 180, 12, () => (activa ? undefined : this.scene.restart({ evento: true, sel: i })));
    }
  }

  private mover(i: number): void {
    if (i === this.sel) return;
    sonido.tocar('cursor');
    this.scene.restart({ sel: i });
  }

  private tecla(a: AccionEntrada): void {
    const ex = crono(juego.estado).expedicion;
    if (!ex) return;
    if (this.evento) {
      if (a === 'arriba' || a === 'abajo') {
        sonido.tocar('cursor');
        return void this.scene.restart({ evento: true, sel: this.sel ? 0 : 1 });
      }
      if (a !== 'a') return;
      const r = resolverEvento(DATOS, juego.estado, this.sel as 0 | 1);
      juego.guardar();
      sonido.tocar(r.vida < 0 ? 'dano' : 'tesoro');
      return void this.scene.restart({ aviso: t(r.clave, { f: r.fosiles, a: r.ambar, m: r.monedas }) });
    }
    const mapa = mapaDe(DATOS, ex.era, ex.semilla);
    const opciones = siguientes(mapa, ex.actual);
    const izq = a === 'arriba' || a === 'izquierda';
    if (izq || a === 'abajo' || a === 'derecha') {
      if (opciones.length < 2) return;
      return this.mover((this.sel + (izq ? opciones.length - 1 : 1)) % opciones.length);
    }
    if (a === 'b') {
      sonido.tocar('cancelar');
      return void this.scene.start('Cronoportal', {});
    }
    if (a !== 'a') return;
    const o = opciones[this.sel];
    if (!o || !avanzar(DATOS, juego.estado, o.id)) return void sonido.tocar('negado');
    juego.guardar();
    sonido.tocar('aceptar');
    switch (o.tipo) {
      case 'combate':
      case 'jefe':
        this.scene.start('Combate', { ia: o.tipo === 'jefe' ? 'experta' : 'tactica', modo: 'crono' });
        return;
      case 'excavacion': {
        const r = excavar(DATOS, juego.estado);
        juego.guardar();
        sonido.tocar('tesoro');
        confeti(this, 120, 40, 10);
        this.time.delayedCall(300, () => this.scene.restart({ aviso: t('crono.excavo', { f: r.fosiles, m: r.monedas }) }));
        return;
      }
      case 'fogata':
        fogata(DATOS, juego.estado);
        juego.guardar();
        sonido.tocar('cura');
        this.scene.restart({ aviso: t('crono.fogataHecha') });
        return;
      case 'evento':
        this.scene.restart({ evento: true, sel: 0 });
        return;
    }
  }
}
