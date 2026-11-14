import type { Accion, Batalla, Lado } from './motor';

/**
 * Golpe justo: al elegir un ataque que hace daño, una marca recorre una barra y el jugador
 * pulsa A cuando pasa por el centro. Según qué tan cerca quede, el ataque pega más fuerte.
 * Solo lo usa el jugador (la IA y las simulaciones pegan siempre ×1).
 */
export const GOLPE = {
  /** Distancia máxima al centro (en fracción de la barra, 0 a 0,5) para cada nota. */
  perfecto: { distancia: 0.05, mult: 1.25 },
  bien: { distancia: 0.15, mult: 1.1 },
  /** Con el golpe justo en automático, cada ataque cuenta como «Bien». */
  auto: 1.1,
  /** Segundos que tarda la marca en cruzar la barra de punta a punta (va y vuelve). */
  cruce: 1,
  /** Cruces antes de darlo por fallado si no se pulsa. */
  cruces: 3,
} as const;

export type NotaGolpe = 'perfecto' | 'bien' | 'fallo';

/** `pos` es dónde quedó la marca, de 0 (izquierda) a 1 (derecha). */
export function calificarGolpe(pos: number): { nota: NotaGolpe; mult: number } {
  const d = Math.abs(pos - 0.5);
  if (d <= GOLPE.perfecto.distancia) return { nota: 'perfecto', mult: GOLPE.perfecto.mult };
  if (d <= GOLPE.bien.distancia) return { nota: 'bien', mult: GOLPE.bien.mult };
  return { nota: 'fallo', mult: 1 };
}

/** Posición de la marca (0 a 1) a los `seg` segundos, yendo y viniendo; `desde` es el extremo de salida. */
export function posicionGolpe(seg: number, desde: 0 | 1): number {
  const f = (seg / GOLPE.cruce) % 2;
  const p = f <= 1 ? f : 2 - f;
  return desde === 0 ? p : 1 - p;
}

/** ¿La acción hace daño? Solo entonces aparece la barra (no en Definitivo, cambios, ítems ni ataques de apoyo). */
export function accionConDano(bat: Batalla, lado: Lado, a: Accion): boolean {
  if (a.tipo === 'empujon') return true;
  if (a.tipo === 'habilidad') return (bat.act(lado).habilidades[a.indice]?.def.potencia ?? 0) > 0;
  if (a.tipo === 'doble') return accionConDano(bat, lado, a.primera) || accionConDano(bat, lado, a.segunda);
  return false;
}
