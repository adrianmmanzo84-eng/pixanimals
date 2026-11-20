import Phaser from 'phaser';

/**
 * Ilustraciones del relato (D271): 960×640 sin texto; el cuarto de abajo (≈170 px) lo tapa el cuadro de diálogo.
 * Se cargan a pedido, al entrar a cada escena que las usa (no en el arranque).
 */
export const RELATOS = [
  'relato_01_mundo', 'relato_02_eclipse', 'relato_03_nox', 'relato_04_prisma', 'relato_05_eleccion',
  'relato_bosque', 'relato_volcan', 'relato_costa', 'relato_desierto', 'relato_cumbre_helada', 'relato_ruinas',
  'relato_final', 'relato_mina', 'relato_brechas',
] as const;

export const claveRelato = (id: string): string => `rel_${id}`;

export function cargarRelatos(escena: Phaser.Scene, ids: readonly string[]): void {
  for (const id of ids) if (id !== 'historia_final' && !escena.textures.exists(claveRelato(id))) escena.load.image(claveRelato(id), `relato/${id}.jpg`);
}

export function suavizarRelatos(escena: Phaser.Scene): void {
  for (const id of RELATOS) if (escena.textures.exists(claveRelato(id))) escena.textures.get(claveRelato(id)).setFilter(Phaser.Textures.FilterMode.LINEAR);
}
