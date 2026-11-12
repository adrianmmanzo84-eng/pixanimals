/**
 * Simulación masiva de combates IA contra IA para detectar criaturas rotas.
 * Uso: npm run simular            (10.000 combates por cruce, IA experta, niveles 5/15/30)
 *      npm run simular -- 2000 tactica
 */
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente } from '../src/core/combate/motor';
import { elegirAccion, elegirReemplazo, type NivelIA } from '../src/core/combate/ia';

const N = Number(process.argv[2] ?? 10000);
const ia = (process.argv[3] ?? 'experta') as NivelIA;
const niveles = [5, 15, 30];
const especies = [...DATOS.criaturas.values()].filter((c) => c.etapa === 1).map((c) => c.id);

export interface ResultadoCruce {
  a: string;
  b: string;
  nivel: number;
  victoriasA: number;
  empates: number;
  turnosMedios: number;
  turnosMax: number;
  usoA: Record<string, number>;
}

export function simularCruce(a: string, b: string, nivel: number, n: number, nivelIA: NivelIA, semilla: number, nivelIAB: NivelIA = nivelIA): ResultadoCruce {
  const rng = new Rng(semilla);
  let victoriasA = 0;
  let empates = 0;
  let turnos = 0;
  let turnosMax = 0;
  const usoA: Record<string, number> = {};
  let acciones = 0;
  for (let i = 0; i < n; i++) {
    const bat = new Batalla(DATOS, [crearCombatiente(DATOS, a, nivel), crearCombatiente(DATOS, b, nivel)], rng);
    while (!bat.terminado) {
      const x = elegirAccion(bat, 0, nivelIA, rng);
      const y = elegirAccion(bat, 1, nivelIAB, rng);
      const id = x.tipo === 'habilidad' ? bat.lados[0].habilidades[x.indice]!.def.nombre : 'Empujón';
      usoA[id] = (usoA[id] ?? 0) + 1;
      acciones++;
      bat.ejecutarTurno(x, y);
    }
    if (bat.ganador === 0) victoriasA++;
    else if (bat.ganador === null) empates++;
    turnos += bat.turno;
    turnosMax = Math.max(turnosMax, bat.turno);
  }
  for (const k of Object.keys(usoA)) usoA[k] = (usoA[k]! / acciones) * 100;
  return { a, b, nivel, victoriasA: (victoriasA / n) * 100, empates: (empates / n) * 100, turnosMedios: turnos / n, turnosMax, usoA };
}

/** 3 contra 3: el lado A juega con `iaA` y el B con `iaB`; el orden inicial de cada equipo es aleatorio. */
export function simularEquipos(nivel: number, n: number, iaA: NivelIA, iaB: NivelIA, semilla: number) {
  const rng = new Rng(semilla);
  let victoriasA = 0;
  let turnos = 0;
  let turnosMax = 0;
  let cambios = 0;
  const barajar = () => [...especies].sort(() => rng.sig() - 0.5).map((id) => crearCombatiente(DATOS, id, nivel));
  for (let i = 0; i < n; i++) {
    const bat = new Batalla(DATOS, [barajar(), barajar()], rng);
    while (!bat.terminado) {
      const x = elegirAccion(bat, 0, iaA, rng);
      if (x.tipo === 'cambio') cambios++;
      bat.ejecutarTurno(x, elegirAccion(bat, 1, iaB, rng));
      for (const l of [...bat.pendientes]) bat.reemplazar(l, elegirReemplazo(bat, l, l === 0 ? iaA : iaB, rng));
    }
    if (bat.ganador === 0) victoriasA++;
    turnos += bat.turno;
    turnosMax = Math.max(turnosMax, bat.turno);
  }
  return { victoriasA: (victoriasA / n) * 100, turnosMedios: turnos / n, turnosMax, cambiosPorCombate: cambios / n };
}

function main(): void {
  console.log(`Simulación: ${N} combates por cruce · IA ${ia}\n`);
  for (const nivel of niveles) {
    console.log(`=== Nivel ${nivel} ===`);
    console.log('Cruce                      | Gana A | Empate | Turnos medios | Máx');
    for (const a of especies)
      for (const b of especies) {
        const r = simularCruce(a, b, nivel, N, ia, 12345 + nivel);
        const nombre = `${a} vs ${b}`.padEnd(26);
        console.log(`${nombre} | ${r.victoriasA.toFixed(1).padStart(5)}% | ${r.empates.toFixed(1).padStart(5)}% | ${r.turnosMedios.toFixed(1).padStart(13)} | ${r.turnosMax}`);
      }
    console.log('\nUso de habilidades (espejo):');
    for (const a of especies) {
      const r = simularCruce(a, a, nivel, Math.min(N, 3000), ia, 999);
      console.log(`  ${a}: ` + Object.entries(r.usoA).map(([k, v]) => `${k} ${v.toFixed(0)}%`).join(' · '));
    }
    console.log('\nIA Experta contra IA Táctica (espejo, % de victorias de la Experta):');
    console.log('  ' + especies.map((a) => `${a} ${simularCruce(a, a, nivel, Math.min(N, 3000), 'experta', 321, 'tactica').victoriasA.toFixed(0)}%`).join(' · '));
    console.log('\nEquipos de 3 contra 3 (orden inicial al azar):');
    for (const [a, b] of [['experta', 'experta'], ['experta', 'tactica'], ['tactica', 'novata'], ['experta', 'novata']] as [NivelIA, NivelIA][]) {
      const r = simularEquipos(nivel, Math.min(N, 5000), a, b, 4242);
      console.log(`  ${a} vs ${b}: gana A ${r.victoriasA.toFixed(1)}% · ${r.turnosMedios.toFixed(1)} turnos de media (máx. ${r.turnosMax}) · ${r.cambiosPorCombate.toFixed(1)} cambios de A por combate`);
    }
    console.log('');
  }
}

if (process.argv[1]?.includes('simular')) main();
