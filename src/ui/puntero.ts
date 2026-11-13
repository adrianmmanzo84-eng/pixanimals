import Phaser from 'phaser';

/**
 * Opciones de menú que responden al mouse y al dedo: al pasar por encima (o al tocarlas) se eligen,
 * y el toque o clic confirma como el botón A (lo emite la pantalla). La opción elegida da un saltito.
 */
export class Puntero {
  private zonas: Phaser.GameObjects.Zone[] = [];
  private ultimo: unknown = undefined;

  constructor(private readonly s: Phaser.Scene) {}

  /** Borra las zonas (para escenas que se vuelven a dibujar enteras). */
  limpiar(): void {
    this.zonas.forEach((z) => z.destroy());
    this.zonas = [];
  }

  /** Zona invisible que elige una opción. */
  zona(x: number, y: number, w: number, h: number, alPasar: () => void): Phaser.GameObjects.Zone {
    const z = this.s.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    z.on('pointerover', alPasar);
    z.on('pointerdown', alPasar);
    z.setDepth(1000);
    this.zonas.push(z);
    return z;
  }

  /** Saltito de la opción elegida, solo cuando cambia la elección (no en cada repintado). */
  marcar(clave: unknown, obj: Phaser.GameObjects.Image | Phaser.GameObjects.Container | Phaser.GameObjects.Graphics | undefined): void {
    if (clave === this.ultimo || !obj) return;
    this.ultimo = clave;
    saltito(this.s, obj);
  }
}

/** Pequeño salto hacia arriba con rebote. */
export function saltito(s: Phaser.Scene, obj: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject): void {
  const y0 = (obj.getData('y0') as number | undefined) ?? obj.y;
  obj.setData('y0', y0);
  s.tweens.killTweensOf(obj);
  obj.y = y0 - 1.6;
  s.tweens.add({ targets: obj, y: y0, duration: 200, ease: 'Back.easeOut' });
}
