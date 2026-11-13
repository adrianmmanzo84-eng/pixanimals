import Phaser from 'phaser';
import { Puntero } from '../ui/puntero';
import type { CriaturaJugador, MinijuegoId } from '../esquemas/esquemas';
import { DATOS } from '../core/datos';
import { equipoDe } from '../core/estado/juego';
import { partidasConPremio } from '../core/minijuegos/minijuegos';
import { puedeEvolucionar, tieneEvolucion } from '../core/progresion/evolucion';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { miniatura, textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { partir, Texto } from '../ui/texto';

const ESCENA: Record<MinijuegoId, string> = { bayas: 'MiniBayas', eco: 'MiniEco', golpe: 'MiniGolpe' };
const VISIBLES = 4;

/**
 * Minijuegos: primero se elige el juego (con premios que quedan hoy y récord) y después
 * la criatura que entrena. Las que todavía pueden evolucionar van primero.
 */
export class Minijuegos extends Phaser.Scene {
  private modo: 'juego' | 'criatura' = 'juego';
  private sel = 0;
  private selCriatura = 0;
  private scroll = 0;
  private especiePrevia = '';
  private capa!: Phaser.GameObjects.Container;

  constructor() {
    super('Minijuegos');
  }

  init(d: { juego?: MinijuegoId; especie?: string; modo?: 'juego' | 'criatura'; selCriatura?: number }): void {
    const lista = DATOS.economia.minijuegos.lista;
    this.sel = Math.max(0, lista.indexOf(d?.juego ?? lista[0]!));
    this.especiePrevia = d?.especie ?? '';
    this.modo = d?.modo ?? 'juego';
    this.selCriatura = d?.selCriatura ?? 0;
    this.scroll = 0;
  }

  /** Redibuja reiniciando la escena (así se liberan las texturas de los textos). */
  private redibujar(): void {
    this.scene.restart({ juego: DATOS.economia.minijuegos.lista[this.sel], especie: this.especiePrevia, modo: this.modo, selCriatura: this.selCriatura });
  }

  create(): void {
    prepararCamara(this);
    musica.tocar('minijuego');
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    new Texto(this, 0, 3, 240, 14, '#ffffff', 'centro', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('mj.titulo'));
    this.capa = this.add.container(0, 0);
    this.pintar();
    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  /** Colección ordenada: primero las que pueden entrenar (el equipo antes), después las de etapa final. */
  private criaturas(): CriaturaJugador[] {
    const estado = juego.estado;
    const equipo = equipoDe(estado);
    const resto = estado.criaturas.filter((c) => !equipo.includes(c));
    const todas = [...equipo, ...resto];
    return [...todas.filter((c) => tieneEvolucion(DATOS, c)), ...todas.filter((c) => !tieneEvolucion(DATOS, c))];
  }

  private puntero: Puntero | null = null;
  private fijarScroll = false;

  private pintar(): void {
    this.capa.removeAll(true);
    this.puntero ??= new Puntero(this);
    this.puntero.limpiar();
    const puntero = this.puntero;
    const g = this.add.graphics();
    this.capa.add(g);
    const txt = (x: number, y: number, w: number, h: number, color: string = C.tinta, al: 'izq' | 'der' | 'centro' = 'izq', op = {}) => {
      const tx = new Texto(this, x, y, w, h, color, al, op);
      this.capa.add(tx.imagen);
      return tx;
    };
    const ahora = Date.now();
    if (this.modo === 'juego') {
      DATOS.economia.minijuegos.lista.forEach((id, i) => {
        const y = 21 + i * 39;
        ventana(g, 8, y, 224, 36);
        if (i === this.sel) g.lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(8, y, 224, 36, 4);
        const nombre = txt(16, y + 4, 140, 10, i === this.sel ? C.resalte : C.tinta, 'izq', { peso: 600 }).poner(t(`mj.${id}`));
        if (i === this.sel) puntero.marcar(`j${i}`, nombre.imagen);
        puntero.zona(8, y, 224, 36, () => {
          if (i === this.sel) return;
          this.sel = i;
          sonido.tocar('cursor');
          this.pintar();
        });
        txt(16, y + 14, 156, 20, C.tintaSuave, 'izq', { tam: 6.6 }).poner(partir(t(`mj.${id}.desc`), 156, 6.6).join('\n'));
        const quedan = partidasConPremio(DATOS, juego.estado, id, ahora);
        txt(130, y + 4, 96, 10, quedan ? '#2f7a48' : C.tintaSuave, 'der').poner(t('mj.premiosHoy', { n: quedan, m: DATOS.economia.minijuegos.conPremioPorDia }));
        const rec = juego.estado.minijuegos.records[id];
        if (rec) txt(160, y + 16, 66, 10, C.tintaSuave, 'der').poner(t('mj.recordN', { n: rec }));
      });
      txt(0, 143, 240, 10, '#ffffff', 'centro', { borde: '#2b3a78' }).poner(t('mj.ayuda'));
      return;
    }
    // Elegir criatura
    const lista = this.criaturas();
    ventana(g, 8, 20, 224, 118);
    txt(14, 23, 212, 10, C.tinta, 'izq', { peso: 600 }).poner(t('mj.quien', { j: t(`mj.${DATOS.economia.minijuegos.lista[this.sel]}`) }));
    if (!this.fijarScroll) this.scroll = Math.max(0, Math.min(this.selCriatura - 1, lista.length - VISIBLES));
    this.fijarScroll = false;
    const emax = DATOS.economia.entrenamiento.max;
    lista.slice(this.scroll, this.scroll + VISIBLES).forEach((c, k) => {
      const i = this.scroll + k;
      const y = 35 + k * 25;
      const activa = i === this.selCriatura;
      g.fillStyle(activa ? 0xfde9c8 : n(C.papelSombra), 1).fillRoundedRect(14, y, 212, 23, 3);
      if (activa) g.lineStyle(1.2, n(C.resalte), 1).strokeRoundedRect(14, y, 212, 23, 3);
      this.capa.add(miniatura(this.add.image(28, y + 11, textura(c.especie, 'frente', c.brillante)), c.especie, 20, 0.4));
      const esp = DATOS.criaturas.get(c.especie)!;
      const nombre = txt(44, y + 2, 100, 10, C.tinta, 'izq', { peso: 600 }).poner(esp.nombre + (c.brillante ? ' ✦' : ''));
      if (activa) puntero.marcar(`c${c.especie}`, nombre.imagen);
      puntero.zona(14, y, 212, 23, () => {
        if (i === this.selCriatura) return;
        this.selCriatura = i;
        this.fijarScroll = true;
        sonido.tocar('cursor');
        this.pintar();
      });
      txt(150, y + 2, 72, 10, C.tintaSuave, 'der').poner(t('nv', { n: c.nivel }));
      if (tieneEvolucion(DATOS, c)) {
        g.fillStyle(C.barraFondo, 1).fillRoundedRect(44, y + 15, 110, 3, 1.5);
        g.fillStyle(0xf5a623, 1).fillRoundedRect(44, y + 15, Math.max(2, (110 * c.entrenamiento) / emax), 3, 1.5);
        txt(158, y + 12, 64, 10, puedeEvolucionar(DATOS, juego.estado, c) ? C.resalte : C.tintaSuave, 'der').poner(
          puedeEvolucionar(DATOS, juego.estado, c) ? t('mc.lista') : `${c.entrenamiento}/${emax}`,
        );
      } else txt(44, y + 12, 178, 10, C.tintaSuave).poner(t('mj.etapaFinalCorto'));
    });
    if (this.scroll > 0) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(118, 34, 122, 34, 120, 32);
    if (this.scroll + VISIBLES < lista.length) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(118, 136, 122, 136, 120, 138);
    txt(0, 142, 240, 10, '#ffffff', 'centro', { borde: '#2b3a78' }).poner(t('mj.ayudaCriatura'));
  }

  private alPulsar(a: AccionEntrada): void {
    if (this.modo === 'juego') {
      const total = DATOS.economia.minijuegos.lista.length;
      if (a === 'arriba' || a === 'abajo') {
        this.sel = (this.sel + (a === 'abajo' ? 1 : total - 1)) % total;
        sonido.tocar('cursor');
      } else if (a === 'a') {
        if (!juego.estado.criaturas.length) {
          sonido.tocar('negado');
          return;
        }
        this.modo = 'criatura';
        const lista = this.criaturas();
        this.selCriatura = Math.max(0, lista.findIndex((c) => c.especie === this.especiePrevia));
        sonido.tocar('aceptar');
      } else if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.start('Menu');
        return;
      } else return;
    } else {
      const lista = this.criaturas();
      if (a === 'arriba' || a === 'abajo') {
        this.selCriatura = (this.selCriatura + (a === 'abajo' ? 1 : lista.length - 1)) % lista.length;
        sonido.tocar('cursor');
      } else if (a === 'a') {
        sonido.tocar('aceptar');
        const id = DATOS.economia.minijuegos.lista[this.sel]!;
        this.scene.start(ESCENA[id], { especie: lista[this.selCriatura]!.especie });
        return;
      } else if (a === 'b') {
        this.modo = 'juego';
        sonido.tocar('cancelar');
      } else return;
    }
    this.redibujar();
  }
}
