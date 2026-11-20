/**
 * Balance del modo historia (D273): % de victorias del JUGADOR en cada parada de combate y contra el Arquitecto.
 * El jugador lleva 3 iniciales (Poco comunes, sin vitaminas) evolucionados según su nivel, juega con IA «tactica»
 * (aproxima a una persona) y golpe justo ×1,1 («Bien», como el modo automático). Sin ítems.
 * Se mide con el equipo al nivel de la región (−3, ±0, +3), promediando todas las tríos posibles de iniciales.
 * Uso: npx tsx scripts/simular-historia.ts [N=12]
 */
import { DATOS } from '../src/core/datos';
import type { Combatiente } from '../src/core/combate/motor';
import type { NivelIA } from '../src/core/combate/ia';
import { equipoFinal, equipoParada, nivelParada, type Parada } from '../src/core/modos/historia';
import { tasaHistoria } from '../src/core/modos/simHistoria';
import type { CriaturaJugador } from '../src/esquemas/esquemas';

const N = Number(process.argv[2] ?? 12);
const tasa = (nivel: number, rivales: (m: CriaturaJugador[]) => Combatiente[], ia: NivelIA, semilla: number) => tasaHistoria(DATOS, nivel, rivales, ia, semilla, N);

const DELTAS = [-3, 0, 3];
const fmt = (x: number) => `${x.toFixed(0).padStart(3)}%`;
console.log(`Parada              nivel rival | jugador ${DELTAS.map((d) => (d >= 0 ? '+' : '') + d).join('   ')}`);
DATOS.historia.regiones.forEach((r, i) => {
  for (const n of [0, 2, 3] as Parada[]) {
    const lv = nivelParada(r, n);
    const fila = DELTAS.map((d, k) => tasa(r.nivel + d, (m) => equipoParada(DATOS, i, n, m), r.ia, 1000 + i * 50 + n * 7 + k));
    console.log(`${(r.id + ':' + n).padEnd(20)} ${String(lv).padStart(3)} ${r.ia.padEnd(7)} | ${fila.map(fmt).join(' ')}`);
  }
});
const r0 = DATOS.historia.regiones[0]!;
const ini = DATOS.sobres.nivelInicial;
console.log(`\nRecién salido del prólogo (nivel ${ini}): ` + ([0, 2, 3] as Parada[]).map((n) => `${r0.id}:${n} ${fmt(tasa(ini, (m) => equipoParada(DATOS, 0, n, m), r0.ia, 4000 + n))}`).join(' · ') + '\n');
const f = DATOS.historia.final;
const fila = DELTAS.map((d, k) => tasa(f.nivel + d, (m) => equipoFinal(DATOS, m), f.ia, 7000 + k));
console.log(`${'arquitecto'.padEnd(20)} ${String(f.nivel).padStart(3)} ${f.ia.padEnd(7)} | ${fila.map(fmt).join(' ')}`);
