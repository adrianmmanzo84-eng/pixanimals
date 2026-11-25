import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { Entrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { hayArte } from '../ui/arte';
import { textura } from '../ui/criaturas';
import { prepararCamara } from '../ui/estilo';
import { Texto } from '../ui/texto';
import { juego } from '../juego';
import { favoritaDe } from '../core/estado/juego';
import version from '../../package.json';

/** Caja del logo en el mundo de 240×160. */
const LOGO_ANCHO = 220;
const LOGO_ALTO = 74;

/**
 * Pantalla de título: la portada, el logo (el del autor si está en `arte/originales/ui/marca/logo.png`;
 * si no, el nombre dibujado por código), un desfile de criaturas, «Pulsa A para jugar» y la canción del título.
 * Aparece una vez al abrir el juego; cualquier tecla, toque o clic sigue al menú.
 */
export class Titulo extends Phaser.Scene {
  constructor() {
    super('Titulo');
  }

  create(): void {
    prepararCamara(this);
    musica.tocar('titulo');
    this.add.graphics().fillStyle(0x1a1c2c, 1).fillRect(0, 0, 240, 160);
    if (this.textures.exists('fondoimg_portada')) this.add.image(0, 0, 'fondoimg_portada').setOrigin(0, 0).setScale(0.25);
    // Velo de abajo hacia arriba para que el logo y el texto se lean sobre la ilustración.
    const velo = this.add.graphics();
    for (let i = 0; i < 16; i++) velo.fillStyle(0x1a1c2c, i / 16).fillRect(0, 84 + i * 2, 240, 2);
    velo.fillStyle(0x1a1c2c, 1).fillRect(0, 116, 240, 44);

    this.logo();
    this.desfile();

    const pulsa = new Texto(this, 0, 136, 240, 12, '#ffffff', 'centro', { tam: 8.6, peso: 600, borde: '#2b3a78' }).poner(t('titulo.pulsa'));
    this.tweens.add({ targets: pulsa.imagen, alpha: 0.25, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    new Texto(this, 4, 151, 56, 8, '#94b0c2', 'izq', { tam: 5.4 }).poner(`v${version.version}`);
    new Texto(this, 62, 151, 174, 8, '#94b0c2', 'der', { tam: 5.4 }).poner(t('titulo.sinCompras'));

    let listo = false;
    const seguir = () => {
      if (listo) return;
      listo = true;
      sonido.tocar('aceptar');
      // Con alguna partida guardada se elige cuál jugar (o una nueva, D279); si no hay ninguna, se empieza directo.
      const contenido = juego.prueba ? null : juego.ranuras();
      this.cameras.main.fadeOut(260, 26, 28, 44);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        if (!contenido) return void this.scene.start('Menu');
        void contenido.then((c) => this.scene.start(Object.values(c).some(Boolean) ? 'Ranuras' : 'Menu', { contenido: c }));
      });
    };
    // Medio segundo de gracia para que un toque al cargar no la salte sin verla.
    this.time.delayedCall(500, () => {
      Entrada.escuchar(() => seguir());
      this.input.on('pointerdown', seguir);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
    this.cameras.main.fadeIn(400, 26, 28, 44);
  }

  /** El logo del autor (pixel art a escala entera; una ilustración grande, suavizada) o el nombre por código. */
  private logo(): void {
    const cx = 120;
    const cy = 48;
    if (hayArte(this, 'logo')) {
      const img = this.add.image(cx, cy, 'ui_logo');
      const fit = Math.min(LOGO_ANCHO / img.width, LOGO_ALTO / img.height);
      if (img.width <= 240) img.setScale(Math.max(1, Math.floor(fit)) > fit ? fit : Math.max(1, Math.floor(fit)));
      else {
        this.textures.get('ui_logo').setFilter(Phaser.Textures.FilterMode.LINEAR);
        img.setScale(fit);
      }
      this.tweens.add({ targets: img, y: cy - 2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return;
    }
    const nombre = new Texto(this, 0, cy - 18, 240, 30, '#ffd23f', 'centro', { tam: 25, peso: 600, borde: '#2b3a78' }).poner('PIXANIMALS');
    new Texto(this, 0, cy + 12, 240, 10, '#ffffff', 'centro', { tam: 7, peso: 600, borde: '#2b3a78' }).poner(t('titulo.lema'));
    this.tweens.add({ targets: nombre.imagen, y: nombre.imagen.y - 2, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Criaturas al azar que cruzan caminando, una detrás de otra, en bucle. */
  private desfile(): void {
    const especies = DATOS.jugables.filter((c) => c.etapa <= 2 && !c.origen);
    // Tu favorita encabeza el desfile.
    const fav = favoritaDe(juego.estado);
    const azar = Phaser.Utils.Array.Shuffle([...especies]).filter((c) => c.id !== fav?.especie);
    const elegidas = [...(fav ? [DATOS.criaturas.get(fav.especie)!] : []), ...azar].slice(0, 6);
    elegidas.forEach((c, i) => {
      const s = this.add.sprite(-20 - i * 42, 124, textura(c.id, 'icono'), 0).setFlipX(true);
      let cuadro = 0;
      this.time.addEvent({ delay: 260, loop: true, callback: () => s.setFrame((cuadro ^= 1)) });
      this.tweens.add({ targets: s, x: 260 + (5 - i) * 42, duration: 9000, repeat: -1, ease: 'Linear' });
    });
  }
}
