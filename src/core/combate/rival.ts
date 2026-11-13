import type { CriaturaJugador } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import type { Rng } from '../rng';
import { crearCombatiente, type Combatiente } from './motor';

/**
 * Arma un equipo rival parejo: mismo número de criaturas, niveles cercanos al promedio del jugador
 * y nunca una etapa evolutiva por encima de la mejor del jugador.
 */
export function generarRival(datos: Datos, equipoJugador: CriaturaJugador[], rng: Rng): Combatiente[] {
  const promedio = Math.round(equipoJugador.reduce((s, c) => s + c.nivel, 0) / equipoJugador.length);
  const etapaMax = Math.max(...equipoJugador.map((c) => datos.criaturas.get(c.especie)!.etapa));
  const iniciales = [...datos.criaturas.values()].filter((c) => c.etapa === 1);
  // Familias sin repetir mientras alcancen, para que el rival también tenga variedad de tipos.
  const bolsa = [...iniciales];
  return equipoJugador.map(() => {
    const fuente = bolsa.length ? bolsa : iniciales;
    let especie = fuente.splice(Math.floor(rng.sig() * fuente.length), 1)[0] ?? rng.elegir(iniciales);
    const nivel = Math.max(1, Math.min(datos.balance.nivelMax, promedio + rng.entero(-1, 1)));
    // Sigue la línea principal (sin piedras) mientras el nivel y la etapa máxima lo permitan.
    for (;;) {
      const ev = especie.evoluciona.find((e) => !e.item);
      if (!ev || nivel < ev.nivel || datos.criaturas.get(ev.a)!.etapa > etapaMax) break;
      especie = datos.criaturas.get(ev.a)!;
    }
    return crearCombatiente(datos, especie.id, nivel);
  });
}

/**
 * Evoluciona una criatura inicial siguiendo su línea principal hasta donde permite el nivel.
 * Con `eclipse`, si llega a la etapa 3 y el nivel lo permite, toma la forma Eclipse en vez de la normal.
 */
export function formaParaNivel(datos: Datos, inicial: string, nivel: number, eclipse = false): string {
  let especie = datos.criaturas.get(inicial)!;
  for (;;) {
    const opciones = especie.evoluciona.filter((e) => nivel >= e.nivel && (eclipse || !e.item));
    const ev = (eclipse && opciones.find((e) => e.item)) || opciones.find((e) => !e.item);
    if (!ev) return especie.id;
    especie = datos.criaturas.get(ev.a)!;
  }
}

