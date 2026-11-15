import type { CriaturaJugador, EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { Rng } from '../rng';
import { diaLocal } from '../items/items';
import { crearCombatiente, type Combatiente } from '../combate/motor';
import { formaParaNivel } from '../combate/rival';
import { entrenadorDelDia, equipoEntrenador, nivelEntrenador } from './entrenador';
import { equipoSemanal, jefeDeLaSemana, nivelSemanal, semanaLocal } from './semanal';

/**
 * Caminos del Entrenador del día y del Jefe de la semana (D221): estaciones previas y el jefe al final,
 * como un mapa de Super Mario World. Se avanza en orden; lo vencido queda marcado durante el día (Entrenador)
 * o la semana (Jefe). Cada estación previa paga monedas la primera vez; la última es el combate de siempre.
 */
export type ModoRuta = 'entrenador' | 'semanal';

export interface Estacion {
  /** Especies del equipo rival (ya evolucionadas según el nivel). */
  equipo: string[];
  nivel: number;
  monedas: number;
  jefe: boolean;
}

/** Ciclo al que pertenece el progreso: el día (Entrenador) o la semana (Jefe). */
function ciclo(modo: ModoRuta, ahora: number): number {
  return modo === 'entrenador' ? diaLocal(ahora) : semanaLocal(ahora);
}

function previas(datos: Datos, modo: ModoRuta, ahora: number, mios: CriaturaJugador[], tipo: string, nivelJefe: number, etapaMin: number): Estacion[] {
  const r = datos.economia.rutas;
  const rng = new Rng(ciclo(modo, ahora) * 92821 + (modo === 'entrenador' ? 3 : 17));
  const bolsa = [...datos.criaturas.values()].filter((c) => c.etapa === 1 && !c.origen && c.tipo === tipo).map((c) => c.id);
  const res: Estacion[] = [];
  for (let i = 0; i < r.previas; i++) {
    const nivel = Math.max(1, nivelJefe - r.nivelesMenos[i]!);
    const tam = Math.min(i + 1, Math.max(1, mios.length));
    const equipo: string[] = [];
    const disponibles = [...bolsa];
    while (equipo.length < tam) {
      const pool = disponibles.length ? disponibles : bolsa;
      const id = pool.splice(rng.entero(0, pool.length - 1), 1)[0]!;
      let forma = formaParaNivel(datos, id, nivel);
      // Los guardias del Jefe de la semana van al menos en etapa 2.
      if (datos.criaturas.get(forma)!.etapa < etapaMin) forma = datos.criaturas.get(forma)!.evoluciona.find((e) => !e.item)?.a ?? forma;
      equipo.push(forma);
    }
    res.push({ equipo, nivel, monedas: r.monedas[i]!, jefe: false });
  }
  return res;
}

export function estaciones(datos: Datos, modo: ModoRuta, ahora: number, mios: CriaturaJugador[]): Estacion[] {
  if (modo === 'entrenador') {
    const e = entrenadorDelDia(datos, ahora);
    const nivel = nivelEntrenador(datos, mios);
    const jefe = equipoEntrenador(datos, e, mios).map((c) => c.especie.id);
    return [...previas(datos, modo, ahora, mios, e.tipo, nivel, 1), { equipo: jefe, nivel, monedas: 0, jefe: true }];
  }
  const nivel = nivelSemanal(datos, mios);
  const tipo = datos.criaturas.get(jefeDeLaSemana(datos, ahora))!.tipo;
  const jefe = equipoSemanal(datos, ahora, mios).map((c) => c.especie.id);
  return [...previas(datos, modo, ahora, mios, tipo, nivel, 2), { equipo: jefe, nivel, monedas: 0, jefe: true }];
}

/** Equipo rival de una estación (la última usa el armado del jefe, con su propio orden). */
export function equipoEstacion(datos: Datos, modo: ModoRuta, ahora: number, mios: CriaturaJugador[], i: number): Combatiente[] {
  const lista = estaciones(datos, modo, ahora, mios);
  const e = lista[Math.min(i, lista.length - 1)]!;
  return e.equipo.map((id) => crearCombatiente(datos, id, e.nivel));
}

/** Cuántas estaciones previas venciste en este ciclo (el jefe se registra con su premio de siempre). */
export function vencidas(estado: EstadoJuego, modo: ModoRuta, ahora: number): number {
  const r = estado.rutas?.[modo];
  return r && r.ciclo === ciclo(modo, ahora) ? r.vencidas : 0;
}

/** Al ganar una estación previa: avanza y paga sus monedas la primera vez. */
export function ganarEstacion(datos: Datos, estado: EstadoJuego, modo: ModoRuta, ahora: number, i: number, mios: CriaturaJugador[]): number {
  const v = vencidas(estado, modo, ahora);
  const lista = estaciones(datos, modo, ahora, mios);
  if (i !== v || i >= lista.length - 1) return 0;
  estado.rutas = { ...(estado.rutas ?? {}), [modo]: { ciclo: ciclo(modo, ahora), vencidas: v + 1 } };
  estado.monedas += lista[i]!.monedas;
  return lista[i]!.monedas;
}
