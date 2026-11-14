/**
 * Ajusta los stats de los jefes para que ganen cerca de una meta (1 contra 1, nivel 50, IA experta) contra las formas finales normales.
 * Cada jefe tiene dos parámetros: «b» pasa puntos de lo ofensivo (atq, ate, vel) a lo que aguanta (ps, def, dfe) o al revés, y el total
 * (semanales hasta 640, Guardianes hasta 720). Metas: semanales 62 %; Guardianes 68, 72, 76, 80, 84 y 88 % por orden de piso.
 * Uso: npx tsx scripts/ajustar-jefes.ts [N=24]   → imprime JSON {id: base}; luego se copia a src/data/jefes.json
 */
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente } from '../src/core/combate/motor';
import { elegirAccion } from '../src/core/combate/ia';

const N = Number(process.argv[2] ?? 24);
const STATS = ['ps', 'atq', 'def', 'ate', 'dfe', 'vel'] as const;
const AGUANTE = new Set(['ps', 'def', 'dfe']);
const rivales = DATOS.jugables.filter((c) => c.etapa === 4).map((c) => c.id);
const jefes = [...DATOS.criaturas.values()].filter((c) => c.jefe);
const original = new Map(jefes.map((j) => [j.id, { ...j.base }]));
const guardianes = Object.entries(DATOS.economia.torre.guardianes).sort((a, b) => Number(a[0]) - Number(b[0])).map(([, id]) => id);

function aplicar(id: string, b: number, total: number): void {
  const o = original.get(id)!;
  const w = STATS.map((s) => o[s] * (AGUANTE.has(s) ? 1 + b : 1 - b));
  const suma = w.reduce((x, y) => x + y, 0);
  const v = w.map((x) => (x * total) / suma);
  const r = v.map(Math.floor);
  const orden = [...r.keys()].sort((i, j) => v[j]! - r[j]! - (v[i]! - r[i]!));
  for (const i of orden.slice(0, total - r.reduce((x, y) => x + y, 0))) r[i]!++;
  const base = DATOS.criaturas.get(id)!.base;
  STATS.forEach((s, i) => (base[s] = r[i]!));
}

function medir(id: string): number {
  const rng = new Rng(777);
  let gana = 0;
  let n = 0;
  for (const r of rivales) {
    for (let i = 0; i < N; i++, n++) {
      const bat = new Batalla(DATOS, [[crearCombatiente(DATOS, id, 50)], [crearCombatiente(DATOS, r, 50)]], rng);
      bat.definitivoPermitido = [true, true];
      while (!bat.terminado) bat.ejecutarTurno(elegirAccion(bat, 0, 'experta', rng), elegirAccion(bat, 1, 'experta', rng));
      if (bat.ganador === 0) gana++;
    }
  }
  return (gana / n) * 100;
}

const salida: Record<string, Record<string, number>> = {};
for (const j of jefes) {
  const meta = j.jefe === 'guardian' ? [68, 72, 76, 80, 84, 88][guardianes.indexOf(j.id)]! : 62;
  const tope = j.jefe === 'guardian' ? 720 : 640;
  const inicio = Object.values(original.get(j.id)!).reduce((x, y) => x + y, 0);
  // 1) El reparto: el b que más gana con el total de partida. 2) El total que acerca la victoria a la meta.
  let mejorB = 0;
  let mejor = -1;
  for (const b of [-0.3, -0.2, -0.1, 0, 0.1]) {
    aplicar(j.id, b, inicio);
    const m = medir(j.id);
    if (m > mejor) [mejorB, mejor] = [b, m];
  }
  let total = inicio;
  let m = mejor;
  aplicar(j.id, mejorB, total); // la rejilla dejó puesto el último b probado, no el mejor
  while (m < meta && total < tope) {
    total += 20;
    aplicar(j.id, mejorB, total);
    m = medir(j.id);
  }
  // Si ya pasaba la meta con el total de partida, se baja hasta quedar cerca (sin bajar de 520).
  while (m > meta + 6 && total > 520) {
    total -= 20;
    aplicar(j.id, mejorB, total);
    m = medir(j.id);
  }
  salida[j.id] = { ...DATOS.criaturas.get(j.id)!.base };
  console.error(`${j.nombre.padEnd(16)} b=${mejorB.toFixed(1)} total=${total} gana ${m.toFixed(0)} % (meta ${meta})`);
}
console.log(JSON.stringify(salida));
