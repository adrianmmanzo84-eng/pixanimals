import type { CriaturaJugador, EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { Rng } from '../rng';
import { diaLocal } from '../items/items';
import { crearCombatiente, type Combatiente } from '../combate/motor';
import { formaParaNivel } from '../combate/rival';

/**
 * Entrenador del día: un rival con nombre y un equipo de un tipo, igual para todos durante el día.
 * Su nivel es el de tu criatura más fuerte del equipo + `nivelExtra`. La primera victoria del día
 * da monedas y un Sobre Elemental (del tipo del entrenador si existe; si no, uno de los elementales al azar).
 */

export interface EntrenadorDelDia {
  dia: number;
  nombre: string;
  tipo: string;
  /** Criaturas iniciales del equipo; se evolucionan según el nivel al combatir. */
  iniciales: string[];
  sobre: string;
}

export function entrenadorDelDia(datos: Datos, ahora: number): EntrenadorDelDia {
  const dia = diaLocal(ahora);
  const rng = new Rng(dia * 48271 + 11);
  const nombre = rng.elegir(datos.economia.entrenador.nombres);
  const iniciales = [...datos.criaturas.values()].filter((c) => c.etapa === 1);
  const tipos = [...new Set(iniciales.map((c) => c.tipo))];
  const tipo = rng.elegir(tipos);
  const delTipo = iniciales.filter((c) => c.tipo === tipo).map((c) => c.id);
  const otros = iniciales.filter((c) => c.tipo !== tipo).map((c) => c.id);
  // Hasta 3: primero las del tipo del día (sin repetir) y se completa con otras.
  const equipo: string[] = [];
  while (equipo.length < 3 && delTipo.length) equipo.push(delTipo.splice(rng.entero(0, delTipo.length - 1), 1)[0]!);
  while (equipo.length < 3) equipo.push(otros.splice(rng.entero(0, otros.length - 1), 1)[0]!);
  const elementales = datos.sobres.sobres.filter((s) => s.tipo);
  const sobre = elementales.find((s) => s.tipo === tipo)?.id ?? rng.elegir(elementales).id;
  return { dia, nombre, tipo, iniciales: equipo, sobre };
}

export function nivelEntrenador(datos: Datos, equipo: CriaturaJugador[]): number {
  return Math.min(datos.balance.nivelMax, Math.max(1, ...equipo.map((c) => c.nivel)) + datos.economia.entrenador.nivelExtra);
}

/** Equipo del entrenador, del mismo tamaño que el del jugador. */
export function equipoEntrenador(datos: Datos, e: EntrenadorDelDia, equipoJugador: CriaturaJugador[]): Combatiente[] {
  const nivel = nivelEntrenador(datos, equipoJugador);
  return e.iniciales.slice(0, Math.max(1, equipoJugador.length)).map((id) => crearCombatiente(datos, formaParaNivel(datos, id, nivel), nivel));
}

export function entrenadorCobrado(estado: EstadoJuego, ahora: number): boolean {
  return estado.entrenador.diaCobrado === diaLocal(ahora);
}

/** Al ganarle: la primera vez del día da monedas y el sobre. */
export function resultadoEntrenador(datos: Datos, estado: EstadoJuego, victoria: boolean, ahora: number): { monedas: number; sobre: string | null } {
  if (!victoria || entrenadorCobrado(estado, ahora)) return { monedas: 0, sobre: null };
  const e = entrenadorDelDia(datos, ahora);
  estado.entrenador.diaCobrado = e.dia;
  estado.monedas += datos.economia.entrenador.monedas;
  estado.sobresRegalo[e.sobre] = (estado.sobresRegalo[e.sobre] ?? 0) + 1;
  return { monedas: datos.economia.entrenador.monedas, sobre: e.sobre };
}
