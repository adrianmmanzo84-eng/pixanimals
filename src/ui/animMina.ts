import Phaser from 'phaser';

/** Animaciones de la Mina (arte del autor, `public/mina/`): tamaño de cuadro y duración de cada uno en ms. */
export const ANIM_MINA = {
  mina_pico: { cuadro: [16, 16], ms: [90, 65, 95], bucle: false },
  mina_explosion: { cuadro: [48, 48], ms: [45, 55, 65, 75, 85, 95], bucle: false },
  mina_gas: { cuadro: [16, 16], ms: [140, 140, 140, 140], bucle: true },
  mina_polvo: { cuadro: [16, 8], ms: [65, 75, 95], bucle: false },
  mina_destello: { cuadro: [8, 8], ms: [70, 80, 80, 100], bucle: false },
  mina_vapor: { cuadro: [16, 16], ms: [80, 95, 110, 130], bucle: false },
  huevo_eclosion: { cuadro: [32, 32], ms: [120, 120, 170, 260], bucle: false },
} as const;

export function cargarAnimMina(load: Phaser.Loader.LoaderPlugin): void {
  for (const [clave, a] of Object.entries(ANIM_MINA)) load.spritesheet(clave, `mina/${clave}.png`, { frameWidth: a.cuadro[0], frameHeight: a.cuadro[1] });
  load.image('huevo', 'mina/huevo.png');
}

/** Registra las animaciones (una sola vez por juego). */
export function crearAnimMina(escena: Phaser.Scene): void {
  for (const [clave, a] of Object.entries(ANIM_MINA)) {
    if (escena.anims.exists(clave) || !escena.textures.exists(clave)) continue;
    escena.anims.create({ key: clave, frames: a.ms.map((duration, frame) => ({ key: clave, frame, duration })), repeat: a.bucle ? -1 : 0 });
  }
}
