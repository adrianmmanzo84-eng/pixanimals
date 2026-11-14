import type { EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';

/**
 * Insignias de jefes: la primera vez que le ganas a cada jefe (semanal o Guardián) queda registrada.
 * Los jefes no se capturan: la insignia es su recuerdo, y cuentan para la medalla «Cazajefes».
 */
export function registrarJefe(datos: Datos, estado: EstadoJuego, id: string): boolean {
  if (!datos.criaturas.get(id)?.jefe || estado.jefes.includes(id)) return false;
  estado.jefes.push(id);
  return true;
}

/** Cuántos jefes hay en total y a cuántos les ganaste. */
export function progresoJefes(datos: Datos, estado: EstadoJuego): { vencidos: number; total: number } {
  const todos = [...datos.criaturas.values()].filter((c) => c.jefe);
  return { vencidos: todos.filter((c) => estado.jefes.includes(c.id)).length, total: todos.length };
}
