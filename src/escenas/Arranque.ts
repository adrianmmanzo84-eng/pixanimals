import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { cargarArteUI, prepararArteUI } from '../ui/arte';
import { prepararTexturasCriaturas } from '../ui/criaturas';
import { cargarEfectosIlustrados, crearTexturasEfectos } from '../ui/efectos';
import { FONDOS_ILUSTRADOS } from '../ui/fondos';

/** Carga los sprites de todas las criaturas definidas en los datos. */
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
    this.scene.start('Menu');
  }
}
