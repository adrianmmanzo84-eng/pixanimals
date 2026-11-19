import Phaser from 'phaser';
import { registrarHD } from './hdLogico';

/**
 * Animaciones del autor (entrega crono-mina-v1): efectos de combate y menú (`public/fx/`) y del Cronoportal
 * (`public/crono/`). Tiras horizontales; `ms` es la duración de cada cuadro; `fin`: hide (desaparece al terminar),
 * hold (queda en el último cuadro) o loop (se repite).
 */
export const ANIM = {
  crono_portal: { ruta: 'crono/crono_portal.png', cuadro: [256, 256], ms: [130, 130, 130, 130], fin: 'loop' },
  crono_viaje: { ruta: 'crono/crono_viaje.png', cuadro: [960, 640], ms: [95, 100, 110, 120, 100, 110], fin: 'hide' },
  crono_marea: { ruta: 'crono/crono_marea.png', cuadro: [960, 160], ms: [85, 85, 85, 125], fin: 'hold' },
  crono_esporas: { ruta: 'crono/crono_esporas.png', cuadro: [64, 64], ms: [85, 85, 85, 125], fin: 'hide' },
  crono_estampida: { ruta: 'crono/crono_estampida.png', cuadro: [384, 192], ms: [130, 130], fin: 'loop' },
  crono_meteoro: { ruta: 'crono/crono_meteoro.png', cuadro: [96, 96], ms: [130, 130, 130], fin: 'loop' },
  crono_meteoro_impacto: { ruta: 'crono/crono_meteoro_impacto.png', cuadro: [384, 384], ms: [85, 85, 85, 85, 125], fin: 'hide' },
  crono_escarcha: { ruta: 'crono/crono_escarcha.png', cuadro: [128, 128], ms: [85, 85, 125], fin: 'hold' },
  crono_revivir: { ruta: 'crono/crono_revivir.png', cuadro: [192, 192], ms: [140, 150, 130, 130, 300], fin: 'hold' },
  fx_subir_nivel: { ruta: 'fx/fx_subir_nivel.png', cuadro: [192, 192], ms: [85, 85, 85, 85, 85, 125], fin: 'hide' },
  fx_evolucion: { ruta: 'fx/fx_evolucion.png', cuadro: [384, 384], ms: [90, 90, 100, 110, 140, 100, 90, 110], fin: 'hide' },
  fx_critico: { ruta: 'fx/fx_critico.png', cuadro: [128, 128], ms: [85, 85, 85, 125], fin: 'hide' },
  fx_golpe_justo: { ruta: 'fx/fx_golpe_justo.png', cuadro: [192, 192], ms: [85, 85, 85, 125], fin: 'hide' },
  fx_brillante: { ruta: 'fx/fx_brillante.png', cuadro: [128, 128], ms: [85, 85, 85, 85, 85, 125], fin: 'hide' },
  fx_sobre_rara: { ruta: 'fx/fx_sobre_rara.png', cuadro: [384, 384], ms: [85, 85, 85, 85, 85, 125], fin: 'hide' },
  fx_insignia: { ruta: 'fx/fx_insignia.png', cuadro: [192, 192], ms: [85, 85, 85, 85, 125], fin: 'hold' },
  fx_confeti: { ruta: 'fx/fx_confeti.png', cuadro: [32, 32], ms: [85, 85, 85, 125], fin: 'hide' },
  crono_revivir_anomalo: { ruta: 'crono/crono_revivir_anomalo.png', cuadro: [192, 192], ms: [140, 150, 130, 130, 300], fin: 'hold' },
  crono_revivir_meganeura: { ruta: 'crono/crono_revivir_meganeura.png', cuadro: [192, 192], ms: [140, 150, 130, 130, 300], fin: 'hold' },
  crono_revivir_estego: { ruta: 'crono/crono_revivir_estego.png', cuadro: [192, 192], ms: [140, 150, 130, 130, 300], fin: 'hold' },
  crono_revivir_ptero: { ruta: 'crono/crono_revivir_ptero.png', cuadro: [192, 192], ms: [140, 150, 130, 130, 300], fin: 'hold' },
  crono_revivir_mamut: { ruta: 'crono/crono_revivir_mamut.png', cuadro: [192, 192], ms: [140, 150, 130, 130, 300], fin: 'hold' },
} as const;
export type ClaveAnim = keyof typeof ANIM;

export function cargarAnimaciones(load: Phaser.Loader.LoaderPlugin): void {
  // HD (D261): las tiras llegan a 4× y se muestran con la escala de siempre.
  registrarHD(Object.keys(ANIM));
  for (const [clave, a] of Object.entries(ANIM)) load.spritesheet(clave, a.ruta, { frameWidth: a.cuadro[0], frameHeight: a.cuadro[1] });
}

/** Registra las animaciones (una sola vez por juego). */
export function crearAnimaciones(escena: Phaser.Scene): void {
  for (const [clave, a] of Object.entries(ANIM)) {
    if (escena.anims.exists(clave) || !escena.textures.exists(clave)) continue;
    escena.anims.create({ key: clave, frames: a.ms.map((duration, frame) => ({ key: clave, frame, duration })), repeat: a.fin === 'loop' ? -1 : 0 });
  }
}

/**
 * Reproduce una animación en (x, y). Las de tipo hide se borran al terminar; las hold quedan en el último cuadro
 * `quedar` ms y se desvanecen. `escala` en unidades del mundo (1 = un píxel del dibujo por píxel del mundo).
 */
export function animar(
  escena: Phaser.Scene,
  clave: ClaveAnim,
  x: number,
  y: number,
  op: { escala?: number; profundidad?: number; quedar?: number; contenedor?: Phaser.GameObjects.Container } = {},
): Promise<void> {
  crearAnimaciones(escena);
  return new Promise((listo) => {
    if (!escena.anims.exists(clave)) return listo();
    const s = escena.add.sprite(x, y, clave).setScale(op.escala ?? 1).setDepth(op.profundidad ?? 20);
    op.contenedor?.add(s);
    s.play(clave);
    if (ANIM[clave].fin === 'loop') return listo();
    s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      listo();
      if (ANIM[clave].fin === 'hold') escena.tweens.add({ targets: s, alpha: 0, delay: op.quedar ?? 400, duration: 250, onComplete: () => s.destroy() });
      else s.destroy();
    });
  });
}

/** Lluvia de confeti (n papelitos) que cae desde (x, y) y se desvanece. */
export function confeti(escena: Phaser.Scene, x: number, y: number, n = 16, profundidad = 70): void {
  crearAnimaciones(escena);
  if (!escena.anims.exists('fx_confeti')) return;
  for (let i = 0; i < n; i++) {
    const p = escena.add.sprite(x + Phaser.Math.Between(-60, 60), y + Phaser.Math.Between(-10, 6), 'fx_confeti').setDepth(profundidad);
    p.play({ key: 'fx_confeti', repeat: -1, startFrame: i % 4, frameRate: 10 });
    escena.tweens.add({
      targets: p,
      y: p.y + Phaser.Math.Between(50, 90),
      x: p.x + Phaser.Math.Between(-14, 14),
      angle: Phaser.Math.Between(-180, 180),
      alpha: { from: 1, to: 0 },
      duration: Phaser.Math.Between(900, 1500),
      delay: Phaser.Math.Between(0, 250),
      ease: 'Sine.easeIn',
      onComplete: () => p.destroy(),
    });
  }
}
