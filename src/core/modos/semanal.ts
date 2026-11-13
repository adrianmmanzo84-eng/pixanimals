import type { CriaturaJugador, EstadoJuego, PremioMeta } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { Rng } from '../rng';
import { crearCombatiente, type Combatiente } from '../combate/motor';
import { darPremio } from '../progresion/premios';

/**
 * Semana temática: cada semana (de lunes a domingo) un tipo es protagonista. Su sobre sale más barato
 * y aparece el Jefe de la semana, una forma Eclipse de ese tipo, con premio la primera victoria.
 */
// ---------------------------------------------------------------- Semana temática

const MS_DIA = 86_400_000;

/** Número de semana (empieza el lunes, hora local). */
export function semanaLocal(ahora: number, offsetMinutos = new Date(ahora).getTimezoneOffset()): number {
  const dia = Math.floor((ahora - offsetMinutos * 60_000) / MS_DIA);
  // El 1/1/1970 fue jueves: +3 hace que la semana empiece el lunes.
  return Math.floor((dia + 3) / 7);
}

/** Tipo protagonista de la semana: rota por los 7 tipos. */
export function tipoDeLaSemana(datos: Datos, ahora: number): string {
  const tipos = [...datos.tipos.values()].filter((t) => t.id !== 'neutro').map((t) => t.id);
  return tipos[semanaLocal(ahora) % tipos.length]!;
}

/** Jefe de la semana: una forma Eclipse del tipo protagonista (rota entre las familias de ese tipo). */
export function jefeDeLaSemana(datos: Datos, ahora: number): string {
  const tipo = tipoDeLaSemana(datos, ahora);
  const eclipses = [...datos.criaturas.values()].filter((c) => c.tipo === tipo && c.id.endsWith('_eclipse'));
  const lista = eclipses.length ? eclipses : [...datos.criaturas.values()].filter((c) => c.id.endsWith('_eclipse'));
  return lista[Math.floor(semanaLocal(ahora) / 7) % lista.length]!.id;
}

export function semanalCobrado(estado: EstadoJuego, ahora: number): boolean {
  return estado.semanal.semanaCobrada === semanaLocal(ahora);
}

/** Al ganarle al Jefe de la semana: la primera vez de la semana da su premio. */
export function resultadoSemanal(datos: Datos, estado: EstadoJuego, victoria: boolean, ahora: number): PremioMeta | null {
  if (!victoria || semanalCobrado(estado, ahora)) return null;
  estado.semanal.semanaCobrada = semanaLocal(ahora);
  darPremio(estado, datos.economia.semanal.premio);
  return datos.economia.semanal.premio;
}

/** Equipo del Jefe de la semana: la forma Eclipse al frente y, si tu equipo es más grande, finales del mismo tipo. */
export function equipoSemanal(datos: Datos, ahora: number, equipoJugador: CriaturaJugador[]): Combatiente[] {
  const nivel = nivelSemanal(datos, equipoJugador);
  const jefe = jefeDeLaSemana(datos, ahora);
  const tipo = datos.criaturas.get(jefe)!.tipo;
  const rng = new Rng(semanaLocal(ahora) * 7919 + 13);
  const acompanantes = [...datos.criaturas.values()].filter((c) => c.tipo === tipo && c.etapa === 3).map((c) => c.id);
  const otros = [...datos.criaturas.values()].filter((c) => c.etapa === 3 && !acompanantes.includes(c.id)).map((c) => c.id);
  const ids = [jefe];
  while (ids.length < Math.max(1, equipoJugador.length)) {
    const bolsa = acompanantes.length ? acompanantes : otros;
    ids.push(bolsa.splice(rng.entero(0, bolsa.length - 1), 1)[0]!);
  }
  return ids.map((id) => crearCombatiente(datos, id, nivel));
}

export function nivelSemanal(datos: Datos, equipo: CriaturaJugador[]): number {
  return Math.min(datos.balance.nivelMax, Math.max(1, ...equipo.map((c) => c.nivel)) + datos.economia.semanal.nivelExtra);
}
