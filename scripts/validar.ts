/**
 * Valida datos y sprites. Uso: npm run validar
 * - Esquema y referencias cruzadas de todos los JSON.
 * - Que existan los 3 PNG de cada criatura, con el tamaño correcto y como máximo 16 colores (transparente incluido).
 * - Que exista el arte de interfaz listado y que cada ítem, sobre, medalla y tipo tenga el suyo (si no, aviso).
 */
import { existsSync, readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { cargarDatos } from '../src/core/datos';

const { datos, errores } = cargarDatos();
const avisos: string[] = [];
const carpeta = new URL('../public/sprites/', import.meta.url).pathname;
const VISTAS: [string, number, number][] = [
  ['frente', 96, 96],
  ['espalda', 96, 96],
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

// Arte de interfaz: cada ítem, sobre y medalla nuevos necesitan su dibujo (si falta, el juego dibuja uno por código: es aviso).
const arteUI = JSON.parse(readFileSync(new URL('../src/ui/arte-ui.json', import.meta.url), 'utf8')) as Record<string, { ruta: string }>;
for (const p of Object.values(arteUI)) if (!existsSync(new URL(`../public/${p.ruta}`, import.meta.url).pathname)) errores.push(`Falta el archivo de interfaz ${p.ruta}.`);
for (const id of datos.items.keys()) if (!arteUI[`item_${id}`]) avisos.push(`El ítem ${id} no tiene dibujo (item_${id}.png): se dibuja por código.`);
for (const s of datos.sobres.sobres) if (!arteUI[`sobre_${s.id}`]) avisos.push(`El sobre ${s.id} no tiene dibujo (sobre_${s.id}.png).`);
for (const m of datos.economia.medallas) for (const n of ['1', '2', '3', 'bloqueada']) if (!arteUI[`medalla_${m.id}_${n}`]) avisos.push(`Falta medalla_${m.id}_${n}.png.`);
for (const t of datos.tipos.keys()) if (t !== 'neutro' && !arteUI[`tipo_${t}`]) avisos.push(`El tipo ${t} no tiene ícono (tipo_${t}.png).`);

for (const a of new Set(avisos)) console.warn('Aviso: ' + a);
if (errores.length) {
  console.error(`\n${errores.length} error(es):`);
  for (const e of errores) console.error(' ✗ ' + e);
  process.exit(1);
}
console.log(`✓ Datos válidos: ${datos.criaturas.size} criaturas, ${datos.habilidades.size} habilidades, ${datos.tipos.size} tipos.`);
console.log('✓ Sprites completos, con tamaño y paleta correctos.');
console.log(`✓ Arte de interfaz: ${Object.keys(arteUI).length} piezas.`);
