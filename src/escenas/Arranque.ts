import { cargarAnimMina } from '../ui/animMina';
import { cargarAnimaciones } from '../ui/animaciones';
import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { cargarArteUI, prepararArteUI } from '../ui/arte';
import { prepararTexturasCriaturas } from '../ui/criaturas';
import { cargarEfectosIlustrados, crearTexturasEfectos } from '../ui/efectos';
import { FONDOS_ILUSTRADOS } from '../ui/fondos';

/** Carga los sprites de todas las criaturas definidas en los datos. */
/** Arte opcional de la Torre y los caminos ya entregado (se completa al integrarlo; así no hay pedidos 404). */
const ARTE_MODOS: string[] = [];
/** Fondos de minijuego a resolución exacta ya entregados (vacío: se usa el de combate ampliado). */
const FONDOS_MINIJUEGO: string[] = [];

export class Arranque extends Phaser.Scene {
  constructor() {
    super('Arranque');
  }

  preload(): void {
    for (const id of FONDOS_ILUSTRADOS) this.load.image(`fondoimg_${id}`, `fondos/${id}.jpg`);
    cargarEfectosIlustrados(this);
    cargarArteUI(this);
    this.load.image('fondoimg_portada', 'fondos/portada.jpg');
    this.load.image('carta_dorso', 'ui/carta_dorso.png');
    for (let z = 1; z <= 5; z++) {
      this.load.image(`mina_zona${z}`, `mina/zona${z}.jpg`);
      this.load.image(`mina_guarida${z}`, `mina/guarida${z}.jpg`);
    }
    for (const f of ['terin', 'plesin', 'triclin', 'tirin', 'dimlin']) this.load.image(`huevo_${f}`, `mina/huevo_${f}.png`);
    cargarAnimMina(this.load);
    cargarAnimaciones(this.load);
    // Arte opcional de la Torre y los caminos (si falta, se dibuja por código). Ver manifiesto en public/modos/.
    for (const c of ['torre_fondo', 'torre_piso', 'torre_piso_jefe', 'torre_cima', 'ruta_entrenador', 'ruta_semanal', 'ruta_nodo', 'ruta_vencido', 'ruta_jefe'])
      if (ARTE_MODOS.includes(c)) this.load.image(c, `modos/${c}.png`);
    // Fondos propios de minijuego (960×640): pradera, bosque, volcan.
    for (const a of FONDOS_MINIJUEGO) this.load.image(`mj_${a}`, `fondos/minijuego_${a}.png`);
    this.load.spritesheet('mina_bloques', 'mina/bloques.png', { frameWidth: 16, frameHeight: 16 });
    for (const c of DATOS.criaturas.values()) {
      this.load.image(`${c.sprites}_frente`, `sprites/${c.sprites}_frente.png`);
      this.load.image(`${c.sprites}_espalda`, `sprites/${c.sprites}_espalda.png`);
      this.load.spritesheet(`${c.sprites}_icono`, `sprites/${c.sprites}_icono.png`, { frameWidth: 32, frameHeight: 32 });
    }
  }

  create(): void {
    // Las criaturas y los efectos son pixel art: se amplían sin suavizado.
    prepararTexturasCriaturas(this);
    crearTexturasEfectos(this);
    prepararArteUI(this);
    if (this.textures.exists('carta_dorso')) this.textures.get('carta_dorso').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.scene.start('Titulo');
  }
}
