import type { CriaturaJugador, EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import type { NivelIA } from '../combate/ia';
import type { Batalla } from '../combate/motor';
import { criaturaDe } from '../estado/juego';
import { puedeEvolucionar, sumarEntrenamiento } from './evolucion';
import { registrar } from './misiones';

/** XP necesaria para pasar del nivel n al n+1: base + lineal×n + cuadrática×n². */
export function xpParaSubir(datos: Datos, nivel: number): number {
  const x = datos.economia.xp;
  return Math.floor(x.curvaBase + x.curvaLineal * nivel + x.curvaCuadratica * nivel * nivel);
}

/** Suma experiencia y sube los niveles que correspondan. Devuelve cuántos niveles subió. */
export function darXp(datos: Datos, c: CriaturaJugador, xp: number): number {
  let subidos = 0;
  c.xp += xp;
  while (c.nivel < datos.balance.nivelMax && c.xp >= xpParaSubir(datos, c.nivel)) {
    c.xp -= xpParaSubir(datos, c.nivel);
    c.nivel++;
    subidos++;
  }
  if (c.nivel >= datos.balance.nivelMax) c.xp = 0;
  return subidos;
}

export interface Recompensa {
  victoria: boolean;
  monedas: number;
  xpPorCriatura: number;
  subidas: { especie: string; nivel: number }[];
  /** Puntos de Entrenamiento que ganó cada participante (solo al ganar). */
  entrenamiento: number;
  /** Criaturas que ahora cumplen todo para evolucionar (y antes no). */
  listas: string[];
}

/**
 * Recompensa al terminar un combate (el jugador es el lado 0).
 * Victoria: monedas según la dificultad y XP por cada rival derrotado, repartida entre quienes participaron.
 * Derrota o retirada: una pequeña compensación en monedas y la mitad de la XP ganada hasta ese momento.
 */
/** `monedasVictoria`: si el modo paga su propio premio (Torre, Entrenador del día), las monedas por ganar se reemplazan por este valor. */
export function aplicarRecompensa(datos: Datos, estado: EstadoJuego, bat: Batalla, dificultad: NivelIA, retirada = false, monedasVictoria?: number): Recompensa {
  const eco = datos.economia;
  const victoria = !retirada && bat.ganador === 0;
  const caidos = bat.equipos[1].miembros.filter((m) => m.ps <= 0);
  const xpTotal = caidos.reduce((s, m) => s + eco.xp.porVictoriaBase + eco.xp.porNivelRival * m.nivel, 0) * (victoria ? 1 : 0.5);
  const participantes = bat.equipos[0].miembros.filter((m) => m.participo);
  const xpPorCriatura = retirada ? 0 : Math.floor(xpTotal / Math.max(1, participantes.length));
  const monedas = retirada ? 0 : victoria ? (monedasVictoria ?? eco.recompensas[dificultad]) : eco.recompensas.derrota;
  const subidas: Recompensa['subidas'] = [];
  const listas: string[] = [];
  const entrenamiento = victoria ? eco.entrenamiento.porVictoria : 0;
  for (const m of participantes) {
    const mia = criaturaDe(estado, m.especie.id);
    if (!mia) continue;
    const antes = puedeEvolucionar(datos, estado, mia);
    if (xpPorCriatura > 0 && darXp(datos, mia, xpPorCriatura) > 0) subidas.push({ especie: mia.especie, nivel: mia.nivel });
    sumarEntrenamiento(datos, mia, entrenamiento);
    if (!antes && puedeEvolucionar(datos, estado, mia)) listas.push(mia.especie);
  }
  estado.monedas += monedas;
  estado.estadisticas.combates++;
  if (victoria) estado.estadisticas.victorias++;
  if (!retirada) registrar(datos, estado, 'combate');
  if (victoria) registrar(datos, estado, 'victoria');
  return { victoria, monedas, xpPorCriatura, subidas, entrenamiento, listas };
}
