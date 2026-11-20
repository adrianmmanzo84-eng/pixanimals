/**
 * Calibra `ajuste` de historia.json (D273): para cada parada busca el % de stats rival que deja al jugador
 * (3 iniciales al nivel de la región, IA táctica, golpe ×1,1) cerca del objetivo. Escribe el JSON.
 * Uso: npx tsx scripts/calibrar-historia.ts [N=6]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DATOS } from '../src/core/datos';
import type { Combatiente } from '../src/core/combate/motor';
import type { NivelIA } from '../src/core/combate/ia';
import { equipoFinal, equipoParada, type Parada } from '../src/core/modos/historia';
import { tasaHistoria } from '../src/core/modos/simHistoria';
import type { CriaturaJugador } from '../src/esquemas/esquemas';

/** % de victorias buscado con el equipo al nivel de la región: primer jefe, Jefe Regional, Guardián, Arquitecto. */
const OBJETIVO = { 0: 80, 2: 65, 3: 50, final: 45 } as const;

const N = Number(process.argv[2] ?? 6);
const tasa = (nivel: number, rivales: () => Combatiente[], ia: NivelIA, semilla: number) => tasaHistoria(DATOS, nivel, rivales, ia, semilla, N);
const FICHAS = [{}, {}, {}] as CriaturaJugador[];

/** Bisección sobre el ajuste (más ajuste = rival más fuerte = menos victorias). */
function buscar(medir: (aj: number) => number, objetivo: number): number {
  let lo = -60, hi = 30;
  while (hi - lo > 2) {
    const mid = Math.round((lo + hi) / 2);
    if (medir(mid) > objetivo) lo = mid; else hi = mid;
  }
  return Math.round((lo + hi) / 2);
}

const ruta = new URL('../src/data/historia.json', import.meta.url);
const json = JSON.parse(readFileSync(ruta, 'utf8'));
DATOS.historia.regiones.forEach((r, i) => {
  const aj: number[] = [];
  ([0, 2, 3] as Parada[]).forEach((n, k) => {
    const v = buscar((x) => {
      r.ajuste[k] = x;
      // El primer combate de la historia se gana recién salido del prólogo (iniciales a nivel 5).
      const nivel = i === 0 && n === 0 ? DATOS.sobres.nivelInicial : r.nivel;
      return tasa(nivel, () => equipoParada(DATOS, i, n, FICHAS), r.ia, 100 + i * 31 + n);
    }, OBJETIVO[n as 0 | 2 | 3]);
    r.ajuste[k] = v;
    aj.push(v);
  });
  json.regiones[i].ajuste = aj;
  console.log(r.id, aj.join(' '));
});
const f = DATOS.historia.final;
f.ajuste = buscar((x) => {
  f.ajuste = x;
  return tasa(f.nivel, () => equipoFinal(DATOS, FICHAS), f.ia, 999);
}, OBJETIVO.final);
json.final.ajuste = f.ajuste;
console.log('arquitecto', f.ajuste);
writeFileSync(ruta, JSON.stringify(json, null, 2) + '\n');
