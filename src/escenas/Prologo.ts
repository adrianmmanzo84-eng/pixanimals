import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { equipoInicial } from '../core/sobres/sobres';
import { Entrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { suavizarArteHistoria } from '../ui/arteHistoria';
import { C, prepararCamara, ventana } from '../ui/estilo';
import { marcaCriatura } from '../ui/criaturas';
import { Puntero } from '../ui/puntero';
import { Texto } from '../ui/texto';
import { cargarRelatos, claveRelato, suavizarRelatos } from '../ui/relatos';
import { juego } from '../juego';

/** Dónde se apoya cada compañero sobre los tres círculos de la ilustración (960×640 → mundo 240×160). */
const CIRCULOS: Array<[number, number]> = [[54, 80], [121, 80], [184, 80]];
const X0 = 18;
const PASO = 29;

/**
 * Elección del equipo (D271), última página del prólogo: sobre los tres círculos vacíos el jugador pone a tres de
 * los siete Pixanimals iniciales (uno por tipo). A elige o quita, ◀ ▶ recorren, y con tres elegidos aparece «Listo».
 */
export class Prologo extends Phaser.Scene {
  private elegidos: string[] = [];
  private cursor = 0;
  private fin = false;

  constructor() {
    super('Prologo');
  }

  init(): void {
    this.elegidos = [];
    this.cursor = 0;
    this.fin = false;
  }

  preload(): void {
    cargarRelatos(this, ['relato_05_eleccion']);
  }

  create(): void {
    prepararCamara(this);
    suavizarArteHistoria(this);
    suavizarRelatos(this);
    musica.tocar('prologo');
    this.pintar();
    Entrada.escuchar((a) => {
      if (this.fin) return;
      const total = DATOS.historia.iniciales.length + (this.elegidos.length === 3 ? 1 : 0);
      if (a === 'izquierda' || a === 'derecha') {
        sonido.tocar('cursor');
        this.cursor = (this.cursor + (a === 'derecha' ? 1 : total - 1)) % total;
        this.pintar();
      } else if (a === 'a') this.pulsar(this.cursor);
      else if (a === 'b') {
        sonido.tocar('cancelar');
        if (this.elegidos.length) {
          this.elegidos.pop();
          this.cursor = Math.min(this.cursor, DATOS.historia.iniciales.length - 1);
          this.pintar();
        }
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private pulsar(i: number): void {
    const ids = DATOS.historia.iniciales;
    if (i === ids.length) return void this.terminar();
    const id = ids[i]!;
    const ya = this.elegidos.indexOf(id);
    if (ya >= 0) this.elegidos.splice(ya, 1);
    else if (this.elegidos.length < 3) this.elegidos.push(id);
    else return void sonido.tocar('negado');
    sonido.tocar('aceptar');
    this.cursor = i;
    this.pintar();
  }

  private terminar(): void {
    if (this.elegidos.length !== 3 || this.fin) return;
    this.fin = true;
    sonido.tocar('aceptar');
    equipoInicial(DATOS, juego.estado, this.elegidos);
    juego.guardar();
    Entrada.escuchar(null);
    this.cameras.main.fadeOut(300, 12, 10, 24);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Menu', {}));
  }

  private pintar(): void {
    this.children.removeAll(true);
    const ids = DATOS.historia.iniciales;
    const clave = claveRelato('relato_05_eleccion');
    if (this.textures.exists(clave)) this.add.image(0, 0, clave).setOrigin(0, 0).setScale(240 / this.textures.get(clave).getSourceImage().width);
    // Los elegidos, parados sobre sus círculos en el orden en que se eligieron.
    this.elegidos.forEach((id, k) => {
      const [x, y] = CIRCULOS[k]!;
      marcaCriatura(this, x, y - 6, id, 38, 0.5);
    });
    const g = this.add.graphics();
    new Texto(this, 0, 4, 240, 12, '#ffffff', 'centro', { tam: 9, peso: 600, borde: '#2b3a78' }).poner(t('prologo.eleccion.titulo'));
    ventana(g, 4, 118, 232, 38);
    const puntero = new Puntero(this);
    ids.forEach((id, i) => {
      const x = X0 + i * PASO;
      const elegido = this.elegidos.includes(id);
      if (i === this.cursor) g.fillStyle(0xffffff, 0.8).fillRoundedRect(x - 12, 120, 26, 26, 3).lineStyle(1, 0xd2403c, 1).strokeRoundedRect(x - 12, 120, 26, 26, 3);
      const img = marcaCriatura(this, x, 133, id, 20, 0.34);
      if (elegido) img.setAlpha(0.35);
      if (elegido) {
        // Marca verde con el orden de elección, en la esquina para no tapar al Pixanimal.
        g.fillStyle(0x2f9a4c, 1).fillCircle(x + 9, 124, 3.6);
        new Texto(this, x + 5.4, 120.8, 7.2, 7, '#ffffff', 'centro', { tam: 5.6, peso: 600 }).poner(String(this.elegidos.indexOf(id) + 1));
      }
      puntero.zona(x - 12, 120, 26, 26, () => this.pulsar(i));
    });
    // «Listo»: aparece con los tres elegidos.
    if (this.elegidos.length === 3) {
      const x = X0 + ids.length * PASO;
      const sel = this.cursor === ids.length;
      g.fillStyle(sel ? 0x47c25b : 0x7fbf8c, 1).fillRoundedRect(x - 12, 122, 24, 22, 3);
      if (sel) g.lineStyle(1, 0xd2403c, 1).strokeRoundedRect(x - 12, 122, 24, 22, 3);
      new Texto(this, x - 12, 129, 24, 10, '#ffffff', 'centro', { tam: 7, peso: 600 }).poner(t('prologo.eleccion.listo'));
      puntero.zona(x - 12, 122, 24, 22, () => this.terminar());
    }
    const especie = this.cursor < ids.length ? DATOS.criaturas.get(ids[this.cursor]!) : null;
    const linea = especie ? `${especie.nombre} · ${DATOS.tipos.get(especie.tipo)!.nombre}` : t('prologo.eleccion.confirmar');
    new Texto(this, 8, 147, 224, 9, C.tinta, 'izq', { tam: 6.6, peso: 600 }).poner(`${linea}   (${this.elegidos.length}/3)`);
  }
}
