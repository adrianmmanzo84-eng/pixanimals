import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { NIVELES_IA } from '../core/combate/ia';
import { equipoDe } from '../core/estado/juego';
import { sobresGratis } from '../core/sobres/sobres';
import { puedeEvolucionar } from '../core/progresion/evolucion';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { abrirGuardado } from '../ui/guardadoDom';
import { Texto } from '../ui/texto';

const OPCIONES = ['menu.combatir', 'menu.sobres', 'menu.tienda', 'menu.bolsaP', 'menu.equipoP', 'menu.bestiario', 'menu.guardado'];
const DESTINOS = ['', 'Sobres', 'Tienda', 'BolsaEscena', 'Equipo', 'Bestiario', ''];
const ALTO_FILA = 11;

/** Menú principal: desde aquí se entra a todo lo demás. */
export class Menu extends Phaser.Scene {
  private filas: Texto[] = [];
  private cursor!: Phaser.GameObjects.Graphics;
  private ayuda!: Texto;
  private sel = 0;
  private modo: 'principal' | 'dificultad' = 'principal';

  constructor() {
    super('Menu');
  }

  create(): void {
    const estado = juego.estado;
    // Primera vez: el sobre de bienvenida entrega el equipo inicial.
    if (!estado.bienvenida) {
      this.scene.start('Sobres', { bienvenida: true });
      return;
    }
    this.filas = [];
    this.modo = 'principal';
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

    ventana(g, 56, 29, 128, 83);
    for (let i = 0; i < OPCIONES.length; i++) this.filas.push(new Texto(this, 72, 33 + i * ALTO_FILA, 108, 10));
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
    this.ayuda = new Texto(this, 0, 104, 240, 10, '#ffffff', 'centro', { borde: '#2b3a78' }).visible(false);

    this.pintar();
    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private opciones(): string[] {
    if (this.modo === 'dificultad') return NIVELES_IA.map((ia) => t('menu.premio', { ia: t(`ia.${ia}`), n: DATOS.economia.recompensas[ia] }));
    const hayGratis = sobresGratis(DATOS, juego.estado, Date.now()).disponibles > 0;
    const hayEvolucion = juego.estado.criaturas.some((c) => puedeEvolucionar(DATOS, juego.estado, c));
    return OPCIONES.map((c) => t(c === 'menu.sobres' && hayGratis ? 'menu.sobres.gratis' : c === 'menu.equipoP' && hayEvolucion ? 'menu.equipoEvo' : c));
  }

  private pintar(): void {
    const ops = this.opciones();
    this.filas.forEach((f, i) => f.poner(ops[i] ?? '', i === this.sel ? C.resalte : C.tinta));
    const y = 34 + this.sel * ALTO_FILA;
    this.cursor.clear().fillStyle(n(C.resalte), 1).fillTriangle(63, y, 63, y + 6, 67, y + 3);
    this.ayuda.poner(t('menu.dificultad')).visible(false);
  }

  private alPulsar(a: AccionEntrada): void {
    const total = this.opciones().length;
    if (a === 'arriba' || a === 'abajo') {
      this.sel = (this.sel + (a === 'abajo' ? 1 : total - 1)) % total;
      sonido.tocar('cursor');
    } else if (a === 'b' && this.modo === 'dificultad') {
      this.modo = 'principal';
      this.sel = 0;
      sonido.tocar('cancelar');
    } else if (a === 'a') {
      if (this.modo === 'dificultad') {
        sonido.tocar('aceptar');
        this.scene.start('Combate', { ia: NIVELES_IA[this.sel] });
        return;
      }
      const destino = DESTINOS[this.sel]!;
      if (this.sel === 0) {
        if (!equipoDe(juego.estado).length) {
          sonido.tocar('negado');
          return;
        }
        this.modo = 'dificultad';
        this.sel = 1;
        sonido.tocar('aceptar');
      } else if (this.sel === OPCIONES.length - 1) {
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
