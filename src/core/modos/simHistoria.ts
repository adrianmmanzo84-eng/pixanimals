import type { Datos } from '../datos';
import { Rng } from '../rng';
import { Batalla, crearCombatiente, type Combatiente } from '../combate/motor';
import { elegirAccion, elegirReemplazo, type NivelIA } from '../combate/ia';
import { formaParaNivel } from '../combate/rival';
import { potencialDe } from '../estado/juego';
import { GOLPE } from '../combate/golpe';
import type { CriaturaJugador } from '../../esquemas/esquemas';

/**
 * Simulación de balance de la historia (D273), compartida por scripts y tests.
 * El jugador: 3 iniciales Poco comunes evolucionados según su nivel, IA «tactica», golpe justo ×1,1, sin ítems.
 * Devuelve el % de victorias del jugador promediando los 35 tríos posibles de iniciales.
 */
export function tasaHistoria(datos: Datos, nivel: number, rivales: (mios: CriaturaJugador[]) => Combatiente[], ia: NivelIA, semilla: number, n: number): number {
  const ini = datos.historia.iniciales;
  const pot = potencialDe(datos, 'poco_comun');
  const rng = new Rng(semilla);
  let g = 0, t = 0;
  for (let a = 0; a < ini.length; a++) for (let b = a + 1; b < ini.length; b++) for (let c = b + 1; c < ini.length; c++) {
    const trio = [ini[a]!, ini[b]!, ini[c]!];
    const fichas = trio.map((especie) => ({ especie }) as CriaturaJugador);
    for (let i = 0; i < n; i++) {
      const mios = trio.map((id) => crearCombatiente(datos, formaParaNivel(datos, id, nivel), nivel, { potencial: pot }));
      const bat = new Batalla(datos, [mios, rivales(fichas)], rng);
      bat.definitivoPermitido = [true, true];
      bat.definitivoConCarga = [false, true];
      for (let k = 0; !bat.terminado && k < 400; k++) {
        for (const l of [...bat.pendientes]) bat.reemplazar(l, elegirReemplazo(bat, l, l === 0 ? 'tactica' : ia, rng));
        if (bat.terminado) break;
        bat.potenciador = [GOLPE.auto, 1];
        bat.ejecutarTurno(elegirAccion(bat, 0, 'tactica', rng), elegirAccion(bat, 1, ia, rng));
      }
      if (bat.ganador === 0) g++;
      t++;
    }
  }
  return (g / t) * 100;
}
