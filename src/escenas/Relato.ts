import Phaser from 'phaser';
import { Entrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { cargarArteHistoria, suavizarArteHistoria, texturaGris } from '../ui/arteHistoria';
import { claveRelato, cargarRelatos, suavizarRelatos } from '../ui/relatos';
import { C, prepararCamara, ventana } from '../ui/estilo';
import { Puntero } from '../ui/puntero';
import { partir, Texto } from '../ui/texto';

export interface DiapositivaRelato {
  /** Id de ilustración (`relato_…`) o `historia_final` (la revelación del Arquitecto). */
  img: string;
  texto: string;
  titulo?: string;
  /** Región apagada por el Eclipse: la imagen se ve gris y con el Eclipse encima. */
  gris?: boolean;
  musica?: 'menu' | 'victoria' | 'jefe';
}

export interface DatosRelato {
  diapositivas: DiapositivaRelato[];
  /** Escena a la que se pasa al terminar (con sus datos). */
  luego: { escena: string; datos?: object };
}

/**
 * Relato (D271): ilustraciones a pantalla completa con el cuadro de texto abajo. A / toque avanza, B vuelve
 * una; al terminar pasa a `luego`. Sirve para el prólogo, la llegada y la restauración de cada región y el final.
 */
export class Relato extends Phaser.Scene {
  private d!: DatosRelato;
  private i = 0;
  private cambiando = false;

  constructor() {
    super('Relato');
  }

  init(d: DatosRelato): void {
    this.d = d;
    this.i = 0;
    this.cambiando = false;
  }

  preload(): void {
    cargarArteHistoria(this);
    cargarRelatos(this, this.d.diapositivas.map((x) => x.img));
  }

  create(): void {
    prepararCamara(this);
    suavizarArteHistoria(this);
    suavizarRelatos(this);
    this.mostrar();
    const puntero = new Puntero(this);
    puntero.zona(0, 0, 240, 160, () => this.avanzar(1));
    Entrada.escuchar((a) => {
      if (a === 'a') this.avanzar(1);
      else if (a === 'b') this.avanzar(-1);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private avanzar(paso: number): void {
    if (this.cambiando) return;
    const n = this.i + paso;
    if (n < 0) return;
    sonido.tocar('cursor');
    if (n >= this.d.diapositivas.length) {
      this.cambiando = true;
      Entrada.escuchar(null);
      this.cameras.main.fadeOut(250, 12, 10, 24);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(this.d.luego.escena, this.d.luego.datos ?? {}));
      return;
    }
    this.i = n;
    this.cambiando = true;
    this.cameras.main.fadeOut(160, 12, 10, 24);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.children.removeAll(true);
      this.mostrar();
      this.cameras.main.fadeIn(220, 12, 10, 24);
      this.cambiando = false;
    });
  }

  private mostrar(): void {
    const s = this.d.diapositivas[this.i]!;
    if (s.musica) musica.tocar(s.musica);
    else if (this.i === 0) musica.tocar('menu');
    const clave = s.img === 'historia_final' ? 'historia_final' : claveRelato(s.img);
    if (!this.textures.exists(clave)) return;
    const base = s.gris ? texturaGris(this, clave) : clave;
    const fuente = this.textures.get(base).getSourceImage();
    this.add.image(0, 0, base).setOrigin(0, 0).setScale(240 / fuente.width);
    const g = this.add.graphics();
    if (s.gris) {
      // El Eclipse sobre el paisaje apagado: un disco negro con halo violeta arriba a la derecha.
      g.fillStyle(0x0c0a18, 0.18).fillRect(0, 0, 240, 117);
      for (const [r, a] of [[26, 0.07], [20, 0.12], [15, 0.2]] as const) g.fillStyle(0x7a4bd8, a).fillCircle(198, 26, r);
      g.fillStyle(0x05030c, 1).fillCircle(198, 26, 12);
    }
    // Cuadro de diálogo sobre la franja inferior (la ilustración deja libres los últimos ~170 px).
    ventana(g, 4, 118, 232, 38);
    const lineas = partir(s.texto, 214, 6.6);
    let y = 121;
    if (s.titulo) {
      new Texto(this, 10, 120, 220, 9, '#257179', 'izq', { tam: 7.4, peso: 600 }).poner(s.titulo);
      y = 129;
    }
    new Texto(this, 10, y, 220, 30, C.tinta, 'izq', { tam: 6.6 }).poner(lineas.join('\n'));
    const mas = new Texto(this, 218, 147, 14, 8, C.tintaSuave, 'der', { tam: 6.4 }).poner(this.i < this.d.diapositivas.length - 1 ? '▶' : '✔');
    this.tweens.add({ targets: mas.imagen, alpha: 0.25, duration: 520, yoyo: true, repeat: -1 });
  }
}
