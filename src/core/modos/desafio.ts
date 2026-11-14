import type { EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { Rng } from '../rng';
import { diaLocal } from '../items/items';
import { crearCombatiente, type Combatiente } from '../combate/motor';

/**
 * Desafío del día: la misma pelea para todo el mundo. Con la fecha como semilla salen un equipo prestado
 * de 3 criaturas, un rival de 3 y el azar del combate, así dos amigos pueden comparar cómo les fue.
 * Un intento por día (se cuenta al empezar, para que salir a la mitad no sirva para reintentar).
 * Al terminar, un texto con emojis para compartir sin revelar el rival.
 */

/** Día local del Desafío #1 (14/11/2026). */
const DIA_UNO = Math.floor(Date.UTC(2026, 10, 14) / 86_400_000);

export interface DesafioDelDia {
  dia: number;
  numero: number;
  /** Equipo prestado (igual para todos). */
  equipo: string[];
  rival: string[];
  nivel: number;
  /** Semilla del azar del combate y de la IA. */
  semilla: number;
}

export function numeroDesafio(ahora: number): number {
  return diaLocal(ahora) - DIA_UNO + 1;
}

export function desafioDelDia(datos: Datos, ahora: number): DesafioDelDia {
  const dia = diaLocal(ahora);
  const rng = new Rng(dia * 2654435761 + 97);
  // Formas de etapa 3: una por familia, todas jugables.
  const bolsa = datos.jugables.filter((c) => c.etapa === 3).map((c) => c.id);
  const sacar = () => bolsa.splice(rng.entero(0, bolsa.length - 1), 1)[0]!;
  const equipo = [sacar(), sacar(), sacar()];
  const rival = [sacar(), sacar(), sacar()];
  return { dia, numero: numeroDesafio(ahora), equipo, rival, nivel: datos.economia.desafio.nivel, semilla: (dia * 40503 + 7) >>> 0 };
}

export function equiposDesafio(datos: Datos, d: DesafioDelDia): [Combatiente[], Combatiente[]] {
  return [d.equipo.map((id) => crearCombatiente(datos, id, d.nivel)), d.rival.map((id) => crearCombatiente(datos, id, d.nivel))];
}

export function desafioJugado(estado: EstadoJuego, ahora: number): boolean {
  return estado.desafio.dia === diaLocal(ahora);
}

/** Al empezar: gasta el intento del día y lleva la racha (días seguidos jugando). Queda como derrota hasta que termine. */
export function empezarDesafio(estado: EstadoJuego, ahora: number): boolean {
  const dia = diaLocal(ahora);
  if (estado.desafio.dia === dia) return false;
  const d = estado.desafio;
  d.racha = d.dia === dia - 1 ? d.racha + 1 : 1;
  d.mejorRacha = Math.max(d.mejorRacha, d.racha);
  d.dia = dia;
  d.terminado = false;
  d.victoria = false;
  d.turnos = 0;
  d.vidas = [];
  return true;
}

export interface ResultadoDesafio {
  victoria: boolean;
  turnos: number;
  /** Fracción de PS que le quedó a cada criatura del equipo (0 = debilitada). */
  vidas: number[];
}

/** Al terminar: guarda el resultado y da el premio (una sola vez). */
export function terminarDesafio(datos: Datos, estado: EstadoJuego, ahora: number, r: ResultadoDesafio): { monedas: number; esencia: number } {
  const d = estado.desafio;
  if (d.dia !== diaLocal(ahora) || d.terminado) return { monedas: 0, esencia: 0 };
  d.terminado = true;
  d.victoria = r.victoria;
  d.turnos = r.turnos;
  d.vidas = r.vidas.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 100) / 100);
  const e = datos.economia.desafio;
  const monedas = r.victoria ? e.monedasVictoria : e.monedasDerrota;
  const esencia = r.victoria ? e.esenciaVictoria : 0;
  estado.monedas += monedas;
  estado.esencia += esencia;
  if (r.victoria) d.victorias++;
  return { monedas, esencia };
}

/** Cuadradito por criatura: verde con más de la mitad de PS, amarillo herida, rojo debilitada. */
export function cuadrito(vida: number): string {
  return vida > 0.5 ? '🟩' : vida > 0 ? '🟨' : '🟥';
}

/** Texto para compartir: número, resultado, una fila de cuadritos y la racha. No nombra al rival. */
export function textoCompartir(numero: number, r: ResultadoDesafio, racha: number, url: string): string {
  const linea = r.victoria ? `🏆 Victoria en ${r.turnos} turnos` : `💥 Derrota en ${r.turnos} turnos`;
  const filas = [`PIXANIMALS · Desafío #${numero}`, linea, r.vidas.map(cuadrito).join('')];
  if (racha > 1) filas.push(`🔥 Racha: ${racha} días`);
  filas.push(url);
  return filas.join('\n');
}
