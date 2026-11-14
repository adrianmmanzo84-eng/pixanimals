/**
 * Mide cada jefe en 1 contra 1 (nivel 50, IA experta de los dos lados) contra las formas finales normales y las Eclipse.
 * Imprime el % de victorias del JEFE. Referencia: una Eclipse le gana ~58 % a su forma normal; un jefe semanal debería ganar ~65 %
 * y los Guardianes 70-85 % (en el juego, además, el jugador lleva un equipo y el jefe solo es el primero del suyo).
 * Uso: npx tsx scripts/simular-jefes.ts [N=40]
 */
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente } from '../src/core/combate/motor';
import { elegirAccion } from '../src/core/combate/ia';

const N = Number(process.argv[2] ?? 40);

function duelo(a: string, b: string, semilla: number): number {
  const rng = new Rng(semilla);
  let gana = 0;
  for (let i = 0; i < N; i++) {
    const bat = new Batalla(DATOS, [[crearCombatiente(DATOS, a, 50)], [crearCombatiente(DATOS, b, 50)]], rng);
    bat.definitivoPermitido = [true, true];
    while (!bat.terminado) bat.ejecutarTurno(elegirAccion(bat, 0, 'experta', rng), elegirAccion(bat, 1, 'experta', rng));
    if (bat.ganador === 0) gana++;
  }
  return (gana / N) * 100;
}

const rivales = DATOS.jugables.filter((c) => c.etapa === 4).map((c) => c.id);
for (const j of [...DATOS.criaturas.values()].filter((c) => c.jefe)) {
  const t = rivales.map((r, i) => duelo(j.id, r, 900 + i * 31));
  const prom = t.reduce((x, y) => x + y, 0) / t.length;
  console.log(`${j.jefe === 'guardian' ? 'G' : 'S'} ${j.nombre.padEnd(16)} ${j.tipo.padEnd(7)} gana ${prom.toFixed(0).padStart(3)} %  (peor ${Math.min(...t).toFixed(0)}, mejor ${Math.max(...t).toFixed(0)})`);
}
