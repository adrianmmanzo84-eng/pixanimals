import Phaser from 'phaser';
import { Puntero } from '../ui/puntero';
import { DATOS } from '../core/datos';
import { Rng } from '../core/rng';
import { bloqueoExpedicion, cobrarExpedicion, enviarExpedicion, faltaExpedicion } from '../core/progresion/coleccion';
import type { CriaturaJugador } from '../esquemas/esquemas';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { miniatura, textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { partir, Texto } from '../ui/texto';

type Modo = 'lugares' | 'criatura' | 'duracion';
const VISIBLES = 4;

function duracion(ms: number): string {
  const min = Math.ceil(ms / 60000);
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
}

/**
 * Expediciones: las criaturas que no están en el equipo salen a explorar 1, 4 u 8 horas
 * y vuelven con monedas, experiencia y, a veces, ítems o un sobre. Así toda la colección sirve.
 */
export class Expediciones extends Phaser.Scene {
  private modo: Modo = 'lugares';
  private sel = 0;
  private selCriatura = 0;
  private selDuracion = 1;
  private scroll = 0;
  private aviso = '';
  private capa!: Phaser.GameObjects.Container;
  private puntero!: Puntero;

  constructor() {
    super('Expediciones');
  }

  init(): void {
    this.modo = 'lugares';
    this.sel = 0;
    this.selCriatura = 0;
    this.selDuracion = 1;
    this.scroll = 0;
    this.aviso = '';
  }

  /** Criaturas que pueden salir: fuera del equipo y que no estén ya de viaje. */
  private disponibles(): CriaturaJugador[] {
    const e = juego.estado;
    return e.criaturas.filter((c) => !e.equipo.includes(c.especie) && !e.expediciones.some((x) => x.especie === c.especie));
  }

  create(): void {
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'pradera')).setOrigin(0, 0).setScale(0.25);
    this.add.graphics().fillStyle(0x141830, 0.35).fillRect(0, 0, 240, 160);
    new Texto(this, 0, 2, 240, 14, '#ffffff', 'centro', { tam: 11, peso: 600, borde: '#2b3a78' }).poner(t('exp.titulo'));
    this.capa = this.add.container(0, 0);
    this.puntero = new Puntero(this);
    this.pintar();
    // El reloj de cada expedición avanza solo.
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.modo === 'lugares' && this.pintar() });
    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private txt(x: number, y: number, w: number, h: number, color: string = C.tinta, al: 'izq' | 'der' | 'centro' = 'izq', op = {}): Texto {
    const tx = new Texto(this, x, y, w, h, color, al, op);
    this.capa.add(tx.imagen);
    return tx;
  }

  private pintar(): void {
    this.capa.removeAll(true);
    this.puntero.limpiar();
    const g = this.add.graphics();
    this.capa.add(g);
    const e = juego.estado;
    const ahora = Date.now();
    if (this.modo === 'lugares') {
      for (let i = 0; i < DATOS.economia.expediciones.lugares; i++) {
        const y = 19 + i * 33;
        ventana(g, 6, y, 228, 30);
        if (i === this.sel) g.lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(6, y, 228, 30, 4);
        const x = e.expediciones[i];
        if (!x) {
          this.txt(14, y + 10, 210, 10, C.tintaSuave).poner(t('exp.libre'));
        } else {
          const c = e.criaturas.find((cc) => cc.especie === x.especie);
          this.capa.add(miniatura(this.add.image(24, y + 15, textura(x.especie, 'frente', c?.brillante)), x.especie, 26, 0.5));
          this.txt(42, y + 3, 120, 10, C.tinta, 'izq', { peso: 600 }).poner(DATOS.criaturas.get(x.especie)!.nombre);
          const falta = faltaExpedicion(x, ahora);
          const total = x.horas * 3_600_000;
          g.fillStyle(C.barraFondo, 1).fillRoundedRect(42, y + 17, 120, 4, 2);
          g.fillStyle(falta ? 0x5aa9f0 : 0x3fbf6a, 1).fillRoundedRect(42, y + 17, Math.max(2, 120 * (1 - falta / total)), 4, 2);
          this.txt(150, y + 3, 76, 10, falta ? C.tintaSuave : C.resalte, 'der', { peso: falta ? 500 : 600 }).poner(
            falta ? t('exp.vuelve', { t: duracion(falta) }) : t('exp.volvio'),
          );
          this.txt(166, y + 15, 60, 10, C.tintaSuave, 'der').poner(t('exp.horas', { n: x.horas }));
        }
        this.puntero.zona(6, y, 228, 30, () => {
          if (i === this.sel) return;
          this.sel = i;
          sonido.tocar('cursor');
          this.pintar();
        });
      }
      ventana(g, 6, 120, 228, 37);
      this.txt(12, 123, 216, 20, this.aviso ? C.resalte : C.tinta, 'izq', { tam: 6.6 }).poner(partir(this.aviso || t('exp.explica'), 216, 6.6).slice(0, 2).join('\n'));
      this.txt(12, 145, 216, 10, C.tintaSuave).poner(t('exp.ayuda'));
      return;
    }
    if (this.modo === 'criatura') {
      const lista = this.disponibles();
      ventana(g, 6, 18, 228, 104);
      this.txt(12, 21, 216, 10, C.tinta, 'izq', { peso: 600 }).poner(t('exp.quien'));
      this.scroll = Math.max(0, Math.min(this.selCriatura - 1, lista.length - VISIBLES));
      lista.slice(this.scroll, this.scroll + VISIBLES).forEach((c, k) => {
        const i = this.scroll + k;
        const y = 33 + k * 22;
        const activa = i === this.selCriatura;
        g.fillStyle(activa ? 0xfde9c8 : n(C.papelSombra), 1).fillRoundedRect(12, y, 216, 20, 3);
        if (activa) g.lineStyle(1.2, n(C.resalte), 1).strokeRoundedRect(12, y, 216, 20, 3);
        this.capa.add(miniatura(this.add.image(24, y + 10, textura(c.especie, 'frente', c.brillante)), c.especie, 18, 0.36));
        this.txt(38, y + 5, 120, 10, C.tinta, 'izq', { peso: 600 }).poner(DATOS.criaturas.get(c.especie)!.nombre);
        this.txt(150, y + 5, 72, 10, C.tintaSuave, 'der').poner(t('nv', { n: c.nivel }));
        this.puntero.zona(12, y, 216, 20, () => {
          if (i === this.selCriatura) return;
          this.selCriatura = i;
          sonido.tocar('cursor');
          this.pintar();
        });
      });
      ventana(g, 6, 126, 228, 31);
      this.txt(12, 130, 216, 10, C.tinta).poner(lista.length ? t('exp.soloReserva') : t('exp.nadie'));
      this.txt(12, 143, 216, 10, C.tintaSuave).poner(t('exp.ayudaElegir'));
      return;
    }
    // Duración
    const c = this.disponibles()[this.selCriatura]!;
    const nombre = DATOS.criaturas.get(c.especie)!.nombre;
    ventana(g, 6, 18, 228, 104);
    this.txt(12, 21, 216, 10, C.tinta, 'izq', { peso: 600 }).poner(t('exp.cuanto', { n: nombre }));
    DATOS.economia.expediciones.duraciones.forEach((d, i) => {
      const y = 34 + i * 28;
      const activa = i === this.selDuracion;
      g.fillStyle(activa ? 0xfde9c8 : n(C.papelSombra), 1).fillRoundedRect(12, y, 216, 25, 3);
      if (activa) g.lineStyle(1.2, n(C.resalte), 1).strokeRoundedRect(12, y, 216, 25, 3);
      this.txt(18, y + 3, 80, 10, activa ? C.resalte : C.tinta, 'izq', { peso: 600 }).poner(t('exp.horas', { n: d.horas }));
      const monedas = Math.round(d.monedas * (1 + c.nivel / 50));
      this.txt(18, y + 13, 206, 10, C.tintaSuave, 'izq', { tam: 6.4 }).poner(
        t('exp.botin', { m: monedas, x: d.xp, i: d.probItem, s: d.probSobre, so: DATOS.sobres.sobres.find((s) => s.id === d.sobre)?.nombre ?? '' }),
      );
      this.puntero.zona(12, y, 216, 25, () => {
        if (i === this.selDuracion) return;
        this.selDuracion = i;
        sonido.tocar('cursor');
        this.pintar();
      });
    });
    ventana(g, 6, 126, 228, 31);
    this.txt(12, 130, 216, 10, C.tinta).poner(t('exp.confirma'));
    this.txt(12, 143, 216, 10, C.tintaSuave).poner(t('exp.ayudaElegir'));
  }

  private alPulsar(a: AccionEntrada): void {
    const e = juego.estado;
    const ahora = Date.now();
    if (this.modo === 'lugares') {
      const total = DATOS.economia.expediciones.lugares;
      if (a === 'arriba' || a === 'abajo') {
        this.sel = (this.sel + (a === 'abajo' ? 1 : total - 1)) % total;
        sonido.tocar('cursor');
        this.aviso = '';
        this.pintar();
      } else if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.start('Menu');
      } else if (a === 'a') {
        const x = e.expediciones[this.sel];
        if (!x) {
          if (!this.disponibles().length) {
            sonido.tocar('negado');
            this.aviso = t('exp.nadie');
            this.pintar();
            return;
          }
          sonido.tocar('aceptar');
          this.modo = 'criatura';
          this.selCriatura = 0;
          this.pintar();
          return;
        }
        const botin = cobrarExpedicion(DATOS, e, x.especie, new Rng((ahora ^ (Math.random() * 0x7fffffff)) >>> 0), ahora);
        if (!botin) {
          sonido.tocar('negado');
          return;
        }
        juego.guardar();
        sonido.tocar('victoria');
        const partes = [t('exp.cobro', { n: DATOS.criaturas.get(botin.especie)!.nombre, m: botin.monedas, x: botin.xp })];
        if (botin.item) partes.push(DATOS.items.get(botin.item)!.nombre);
        if (botin.sobre) partes.push(DATOS.sobres.sobres.find((s) => s.id === botin.sobre)!.nombre);
        this.aviso = partes.join(' · ');
        this.pintar();
      }
      return;
    }
    if (a === 'b') {
      sonido.tocar('cancelar');
      this.modo = this.modo === 'duracion' ? 'criatura' : 'lugares';
      this.pintar();
      return;
    }
    if (this.modo === 'criatura') {
      const lista = this.disponibles();
      if ((a === 'arriba' || a === 'abajo') && lista.length) {
        this.selCriatura = (this.selCriatura + (a === 'abajo' ? 1 : lista.length - 1)) % lista.length;
        sonido.tocar('cursor');
        this.pintar();
      } else if (a === 'a' && lista.length) {
        sonido.tocar('aceptar');
        this.modo = 'duracion';
        this.pintar();
      }
      return;
    }
    const duraciones = DATOS.economia.expediciones.duraciones;
    if (a === 'arriba' || a === 'abajo') {
      this.selDuracion = (this.selDuracion + (a === 'abajo' ? 1 : duraciones.length - 1)) % duraciones.length;
      sonido.tocar('cursor');
      this.pintar();
    } else if (a === 'a') {
      const c = this.disponibles()[this.selCriatura]!;
      const horas = duraciones[this.selDuracion]!.horas;
      if (bloqueoExpedicion(DATOS, e, c.especie, horas) !== null || !enviarExpedicion(DATOS, e, c.especie, horas, ahora)) {
        sonido.tocar('negado');
        return;
      }
      juego.guardar();
      sonido.tocar('sube');
      this.modo = 'lugares';
      this.sel = e.expediciones.length - 1;
      this.aviso = t('exp.enviada', { n: DATOS.criaturas.get(c.especie)!.nombre, h: horas });
      this.pintar();
    }
  }
}
