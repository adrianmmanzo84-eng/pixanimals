import { cargarAnimMina } from '../ui/animMina';
import { cargarAnimaciones } from '../ui/animaciones';
import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { cargarArteUI, prepararArteUI } from '../ui/arte';
import { prepararTexturasCriaturas } from '../ui/criaturas';
import { cargarEfectosIlustrados, crearTexturasEfectos } from '../ui/efectos';
import { FONDOS_ILUSTRADOS } from '../ui/fondos';
import { prepararCamara } from '../ui/estilo';
import { Texto } from '../ui/texto';
import { t } from '../i18n/i18n';

/** Fondos de minijuego a resolución exacta ya entregados (vacío: se usa el de combate ampliado). */
const FONDOS_MINIJUEGO: string[] = [];

export class Arranque extends Phaser.Scene {
  constructor() {
    super('Arranque');
  }

  preload(): void {
    this.pantallaDeCarga();
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
    // Cronoportal: escenarios de las eras, mapas, sala e íconos del mapa y los fósiles.
    for (let n = 1; n <= 5; n++) {
      this.load.image(`crono_era${n}`, `crono/era${n}.jpg`);
      this.load.image(`crono_mapa${n}`, `crono/mapa${n}.jpg`);
    }
    this.load.image('crono_sala', 'crono/sala.jpg');
    for (const c of ['ambar', 'fosil_anomalo', 'fosil_meganeura', 'fosil_estego', 'fosil_ptero', 'fosil_mamut', 'mapa_combate', 'mapa_evento', 'mapa_excavacion', 'mapa_fogata', 'mapa_jefe', 'mapa_visitado'])
      this.load.image(`cr_${c}`, `crono/iconos/${c}.png`);
    // Arte de la Torre y los caminos (D236): fondos 960×640 en JPG, pisos, cima y estaciones en PNG.
    for (const c of ['torre_fondo', 'ruta_entrenador', 'ruta_semanal']) this.load.image(c, `modos/${c}.jpg`);
    for (const c of ['torre_piso', 'torre_piso_jefe', 'torre_cima', 'ruta_nodo', 'ruta_vencido', 'ruta_jefe']) this.load.image(c, `modos/${c}.png`);
    // Fondos propios de minijuego (960×640): pradera, bosque, volcan.
    for (const a of FONDOS_MINIJUEGO) this.load.image(`mj_${a}`, `fondos/minijuego_${a}.png`);
    this.load.spritesheet('mina_bloques', 'mina/bloques.png', { frameWidth: 16, frameHeight: 16 });
    for (const c of DATOS.criaturas.values()) {
      this.load.image(`${c.sprites}_frente`, `sprites/${c.sprites}_frente.png`);
      this.load.image(`${c.sprites}_espalda`, `sprites/${c.sprites}_espalda.png`);
      this.load.spritesheet(`${c.sprites}_icono`, `sprites/${c.sprites}_icono.png`, { frameWidth: 32, frameHeight: 32 });
    }
  }

  /** Pantalla de carga (D239): nombre del juego, barra y porcentaje mientras bajan las imágenes y sonidos. */
  private pantallaDeCarga(): void {
    prepararCamara(this);
    new Texto(this, 0, 58, 240, 18, '#ffd76a', 'centro', { tam: 14, peso: 600, borde: '#2b3a78' }).poner('PIXANIMALS');
    const g = this.add.graphics();
    g.fillStyle(0x333c57, 1).fillRoundedRect(50, 84, 140, 8, 3);
    const barra = this.add.graphics();
    const txt = new Texto(this, 0, 96, 240, 10, '#c7cfdd', 'centro', { tam: 6.4 }).poner(t('arranque.cargando', { n: 0 }));
    this.load.on('progress', (v: number) => {
      barra.clear().fillStyle(0x41a6f6, 1).fillRoundedRect(51, 85, Math.max(4, 138 * v), 6, 2);
      txt.poner(t('arranque.cargando', { n: Math.floor(v * 100) }));
    });
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
