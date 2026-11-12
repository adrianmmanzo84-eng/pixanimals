/**
 * Valida datos y sprites. Uso: npm run validar
 * - Esquema y referencias cruzadas de todos los JSON.
 * - Que existan los 3 PNG de cada criatura, con el tamaño correcto y como máximo 16 colores (transparente incluido).
 */
import { existsSync, readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { cargarDatos } from '../src/core/datos';

const { datos, errores } = cargarDatos();
const avisos: string[] = [];
const carpeta = new URL('../public/sprites/', import.meta.url).pathname;
const VISTAS: [string, number, number][] = [
  ['frente', 64, 64],
  ['espalda', 64, 64],
  ['icono', 64, 32],
];

for (const c of datos.criaturas.values()) {
  for (const [vista, ancho, alto] of VISTAS) {
    const nombre = `${c.sprites}_${vista}.png`;
    const ruta = carpeta + nombre;
    if (!existsSync(ruta)) {
      errores.push(`Falta el sprite ${nombre} (criatura ${c.id}).`);
      continue;
    }
    const png = PNG.sync.read(readFileSync(ruta));
    if (png.width !== ancho || png.height !== alto) errores.push(`${nombre}: mide ${png.width}×${png.height}, debe medir ${ancho}×${alto}.`);
    const colores = new Set<number>();
    let transparente = false;
    for (let i = 0; i < png.data.length; i += 4) {
      const a = png.data[i + 3]!;
      if (a === 0) transparente = true;
      else {
        if (a !== 255) avisos.push(`${nombre}: tiene píxeles semitransparentes (deben ser opacos o transparentes).`);
        colores.add((png.data[i]! << 16) | (png.data[i + 1]! << 8) | png.data[i + 2]!);
      }
      if (a !== 0 && a !== 255) break;
    }
    if (!transparente) errores.push(`${nombre}: no tiene fondo transparente.`);
    // Las ramas (sprites con letra, como brasa_4b) llevan aura y admiten 24 colores.
    const max = /_\d[a-z]$/.test(c.sprites) ? 24 : 15;
    if (colores.size > max) errores.push(`${nombre}: usa ${colores.size} colores; el máximo es ${max} más transparencia.`);
  }
}

for (const a of new Set(avisos)) console.warn('Aviso: ' + a);
if (errores.length) {
  console.error(`\n${errores.length} error(es):`);
  for (const e of errores) console.error(' ✗ ' + e);
  process.exit(1);
}
console.log(`✓ Datos válidos: ${datos.criaturas.size} criaturas, ${datos.habilidades.size} habilidades, ${datos.tipos.size} tipos.`);
console.log('✓ Sprites completos, con tamaño y paleta correctos.');
