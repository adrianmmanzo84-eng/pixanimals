import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { NIVELES_IA } from '../core/combate/ia';
import { equipoDe } from '../core/estado/juego';
import { sobresGratis } from '../core/sobres/sobres';
import { puedeEvolucionar } from '../core/progresion/evolucion';
import { cobrarDiario, diarioDisponible, premioDeHoy } from '../core/progresion/diario';
import { misionesPorCobrar } from '../core/progresion/misiones';
import { entrenadorCobrado } from '../core/modos/entrenador';
import { musica } from '../audio/musica';
import { esJefe } from '../core/modos/torre';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { abrirGuardado } from '../ui/guardadoDom';
import { Texto } from '../ui/texto';

const OPCIONES = ['menu.combatir', 'menu.minijuegos', 'menu.misiones', 'menu.sobres', 'menu.tienda', 'menu.bolsaP', 'menu.equipoP', 'menu.bestiario', 'menu.guardado'];
const DESTINOS = ['', 'Minijuegos', 'Misiones', 'Sobres', 'Tienda', 'BolsaEscena', 'Equipo', 'Bestiario', ''];
const GUARDADO = OPCIONES.length - 1;
const ALTO_FILA = 11;
/** Dos columnas de hasta 5 opciones. */
const POR_COLUMNA = 5;
const COL_X = [40, 126];

/** Menú principal: desde aquí se entra a todo lo demás. */
export class Menu extends Phaser.Scene {
  private filas: Texto[] = [];
  private cursor!: Phaser.GameObjects.Graphics;
  private ayuda!: Texto;
  private sel = 0;
  private modo: 'principal' | 'combates' | 'dificultad' | 'diario' = 'principal';
  private submenu = false;

  constructor() {
    super('Menu');
  }

  /** `submenu: 'combates'` vuelve directo al submenú de combates (al terminar un combate). */
  init(d: { submenu?: string }): void {
    this.submenu = d?.submenu === 'combates';
  }

  create(): void {
    const estado = juego.estado;
    // Primera vez: el sobre de bienvenida entrega el equipo inicial.
    if (!estado.bienvenida) {
      this.scene.start('Sobres', { bienvenida: true });
      return;
    }
    musica.tocar('menu');
    this.filas = [];
    this.modo = this.submenu ? 'combates' : 'principal';
    this.sel = 0;
    prepararCamara(this);
    if (this.textures.exists('fondoimg_portada')) {
      // Ilustración de portada ajustada al ancho (sus criaturas están en los bordes); debajo, el panel del equipo.
      this.add.graphics().fillStyle(0x1a1c2c, 1).fillRect(0, 0, 240, 160);
      this.add.image(0, 0, 'fondoimg_portada').setOrigin(0, 0).setScale(0.25);
    } else this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    new Texto(this, 0, 2, 240, 16, '#ffffff', 'centro', { tam: 13, peso: 600, borde: '#2b3a78' }).poner(t('titulo'));
    new Texto(this, 0, 17, 240, 10, '#ffffff', 'centro', { borde: '#2b3a78' }).poner(
      `${t('rec.monedas', { n: estado.monedas })}   ·   ${t('rec.esencia', { n: estado.esencia })}`,
    );

    ventana(g, 26, 29, 188, 63);
    for (let i = 0; i < OPCIONES.length; i++) {
      const col = Math.floor(i / POR_COLUMNA);
      this.filas.push(new Texto(this, COL_X[col]! + 8, 33 + (i % POR_COLUMNA) * ALTO_FILA, 80, 10));
    }
    this.cursor = this.add.graphics();

    // Equipo actual, con icono animado de dos cuadros.
    ventana(g, 4, 114, 232, 42);
    const equipo = equipoDe(estado);
    equipo.forEach((c, i) => {
      const x = 10 + i * 76;
      const icono = this.add.sprite(x + 16, 135, textura(c.especie, 'icono'), 0);
      let cuadro = 0;
      this.time.addEvent({ delay: 420, loop: true, callback: () => icono.setFrame((cuadro ^= 1)) });
      new Texto(this, x + 33, 124, 44, 10).poner(DATOS.criaturas.get(c.especie)!.nombre);
      new Texto(this, x + 33, 134, 44, 10, C.tintaSuave).poner(t('nv', { n: c.nivel }) + (c.brillante ? ' ✦' : ''));
    });
    if (!equipo.length) new Texto(this, 10, 130, 220, 10, C.tintaSuave, 'centro').poner(t('menu.sinEquipo'));
    this.ayuda = new Texto(this, 0, 98, 240, 10, '#ffffff', 'centro', { borde: '#2b3a78' }).visible(false);

    this.pintar();
    if (diarioDisponible(estado, Date.now())) this.mostrarDiario();
    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private opciones(): string[] {
    if (this.modo === 'dificultad') return NIVELES_IA.map((ia) => t('menu.premio', { ia: t(`ia.${ia}`), n: DATOS.economia.recompensas[ia] }));
    if (this.modo === 'combates') {
      const piso = juego.estado.torre.piso;
      return [
        t('menu.rapido'),
        t(esJefe(DATOS, piso) ? 'menu.torreJefe' : 'menu.torre', { n: piso }),
        t(entrenadorCobrado(juego.estado, Date.now()) ? 'menu.entrenadorHecho' : 'menu.entrenador'),
      ];
    }
    const hayGratis = sobresGratis(DATOS, juego.estado, Date.now()).disponibles > 0;
    const hayEvolucion = juego.estado.criaturas.some((c) => puedeEvolucionar(DATOS, juego.estado, c));
    const porCobrar = misionesPorCobrar(DATOS, juego.estado);
    return OPCIONES.map((c) => {
      if (c === 'menu.sobres' && (hayGratis || Object.values(juego.estado.sobresRegalo).some((v) => v > 0))) return t('menu.sobres.gratis');
      if (c === 'menu.equipoP' && hayEvolucion) return t('menu.equipoEvo');
      if (c === 'menu.misiones' && porCobrar) return t('menu.misionesN', { n: porCobrar });
      return t(c);
    });
  }

  private pintar(): void {
    const ops = this.opciones();
    this.filas.forEach((f, i) => f.poner(ops[i] ?? '', i === this.sel ? C.resalte : C.tinta));
    const col = Math.floor(this.sel / POR_COLUMNA);
    const y = 34 + (this.sel % POR_COLUMNA) * ALTO_FILA;
    const x = COL_X[col]!;
    this.cursor.clear().fillStyle(n(C.resalte), 1).fillTriangle(x, y, x, y + 6, x + 4, y + 3);
    this.ayuda.poner(t('menu.dificultad')).visible(false);
  }

  /** Ventana del premio diario: los 7 días del ciclo, con el de hoy marcado. */
  private mostrarDiario(): void {
    const estado = juego.estado;
    const p = premioDeHoy(DATOS, estado, Date.now());
    const ciclo = DATOS.economia.diario.ciclo;
    this.modo = 'diario';
    const g = this.add.graphics();
    const velo = this.add.graphics().fillStyle(0x141830, 0.7).fillRect(0, 0, 240, 160);
    g.setDepth(10);
    velo.setDepth(9);
    ventana(g, 24, 30, 192, 92);
    const textos = [
      new Texto(this, 24, 35, 192, 12, '#257179', 'centro', { tam: 9.5, peso: 600 }).poner(t('diario.titulo')),
      new Texto(this, 24, 48, 192, 10, C.tintaSuave, 'centro').poner(t('diario.racha', { n: p.racha })),
    ];
    for (let d = 1; d <= ciclo; d++) {
      const x = 120 + (d - (ciclo + 1) / 2) * 24;
      const hoy = d === p.dia;
      const pasado = d < p.dia;
      g.fillStyle(hoy ? 0xfde9c8 : pasado ? 0xc8e6c9 : n(C.papelSombra), 1).fillRoundedRect(x - 10, 62, 20, 24, 3);
      if (hoy) g.lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(x - 10, 62, 20, 24, 3);
      if (d === ciclo) {
        // Sobre de regalo: una cartita.
        g.fillStyle(0x7a56b0, 1).fillRoundedRect(x - 5, 66, 10, 13, 2);
        g.fillStyle(0xf5c542, 1).fillRect(x - 2, 71, 4, 3);
      } else {
        g.fillStyle(0xf5c542, 1).fillCircle(x, 72, 4.5);
        g.fillStyle(0xe09a20, 1).fillRect(x - 0.6, 69.5, 1.2, 5);
      }
      textos.push(new Texto(this, x - 10, 77, 20, 9, pasado ? '#2f7a48' : C.tinta, 'centro', { tam: 6.6 }).poner(pasado ? '✓' : String(d)));
    }
    const premio = p.sobre ? t('diario.premioSobre', { n: p.monedas, s: DATOS.sobres.sobres.find((s) => s.id === p.sobre)!.nombre }) : t('diario.premio', { n: p.monedas });
    textos.push(new Texto(this, 24, 92, 192, 10, C.tinta, 'centro', { peso: 600 }).poner(premio));
    textos.push(new Texto(this, 24, 106, 192, 10, C.tintaSuave, 'centro').poner(t('diario.ayuda')));
    for (const tx of textos) tx.imagen.setDepth(11);
  }

  private alPulsar(a: AccionEntrada): void {
    if (this.modo === 'diario') {
      if (a !== 'a') return;
      cobrarDiario(DATOS, juego.estado, Date.now());
      juego.guardar();
      sonido.tocar('cura');
      this.scene.restart();
      return;
    }
    const total = this.opciones().length;
    if (a === 'arriba' || a === 'abajo') {
      if (this.modo !== 'principal') this.sel = (this.sel + (a === 'abajo' ? 1 : total - 1)) % total;
      else {
        // Dentro de la columna.
        const col = Math.floor(this.sel / POR_COLUMNA);
        const ini = col * POR_COLUMNA;
        const largo = Math.min(POR_COLUMNA, total - ini);
        this.sel = ini + ((this.sel - ini + (a === 'abajo' ? 1 : largo - 1)) % largo);
      }
      sonido.tocar('cursor');
    } else if ((a === 'izquierda' || a === 'derecha') && this.modo === 'principal') {
      const fila = this.sel % POR_COLUMNA;
      const col = this.sel < POR_COLUMNA ? 1 : 0;
      this.sel = Math.min(total - 1, col * POR_COLUMNA + fila);
      sonido.tocar('cursor');
    } else if (a === 'b' && this.modo === 'dificultad') {
      this.modo = 'combates';
      this.sel = 0;
      sonido.tocar('cancelar');
    } else if (a === 'b' && this.modo === 'combates') {
      this.modo = 'principal';
      this.sel = 0;
      sonido.tocar('cancelar');
    } else if (a === 'a') {
      if (this.modo === 'dificultad') {
        sonido.tocar('aceptar');
        this.scene.start('Combate', { ia: NIVELES_IA[this.sel], modo: 'rapido' });
        return;
      }
      if (this.modo === 'combates') {
        sonido.tocar('aceptar');
        if (this.sel === 0) {
          this.modo = 'dificultad';
          this.sel = 1;
        } else {
          this.scene.start('Desafio', { modo: this.sel === 1 ? 'torre' : 'entrenador' });
          return;
        }
        this.pintar();
        return;
      }
      const destino = DESTINOS[this.sel]!;
      if (this.sel === 0) {
        if (!equipoDe(juego.estado).length) {
          sonido.tocar('negado');
          return;
        }
        this.modo = 'combates';
        this.sel = 0;
        sonido.tocar('aceptar');
      } else if (this.sel === GUARDADO) {
        sonido.tocar('aceptar');
        Entrada.escuchar(null);
        abrirGuardado(() => this.scene.restart());
        return;
      } else {
        sonido.tocar('aceptar');
        // Siempre con datos explícitos: Phaser reutiliza los del arranque anterior si no se pasan.
        this.scene.start(destino, { bienvenida: false });
        return;
      }
    } else return;
    this.pintar();
  }
}
