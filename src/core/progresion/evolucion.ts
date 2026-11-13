import type { CriaturaJugador, EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { criaturaDe, marcarVista } from '../estado/juego';
import { cantidad, quitar } from '../items/items';

/**
 * Evolución: hace falta el nivel mínimo y la barra de Entrenamiento llena; las ramas piden además una piedra.
 * Se conservan nivel, experiencia, rareza, brillo y vitaminas; los stats se recalculan solos
 * porque dependen de la especie. La barra vuelve a cero.
 */

export interface OpcionEvolucion {
  a: string;
  nivel: number;
  item?: string;
  cumpleNivel: boolean;
  cumpleEntrenamiento: boolean;
  tieneItem: boolean;
  /** Ya tienes un ejemplar de esa especie (regla: uno por especie). */
  yaLaTienes: boolean;
  puede: boolean;
}

export function opcionesEvolucion(datos: Datos, estado: EstadoJuego, c: CriaturaJugador): OpcionEvolucion[] {
  const especie = datos.criaturas.get(c.especie)!;
  return especie.evoluciona.map((ev) => {
    const cumpleNivel = c.nivel >= ev.nivel;
    const cumpleEntrenamiento = c.entrenamiento >= datos.economia.entrenamiento.max;
    const tieneItem = !ev.item || cantidad(estado, ev.item) > 0;
    const yaLaTienes = !!criaturaDe(estado, ev.a);
    return { ...ev, cumpleNivel, cumpleEntrenamiento, tieneItem, yaLaTienes, puede: cumpleNivel && cumpleEntrenamiento && tieneItem && !yaLaTienes };
  });
}

export function puedeEvolucionar(datos: Datos, estado: EstadoJuego, c: CriaturaJugador): boolean {
  return opcionesEvolucion(datos, estado, c).some((o) => o.puede);
}

/** ¿Tiene sentido mostrar la barra? (si la especie todavía puede evolucionar) */
export function tieneEvolucion(datos: Datos, c: CriaturaJugador): boolean {
  return datos.criaturas.get(c.especie)!.evoluciona.length > 0;
}

export function evolucionar(datos: Datos, estado: EstadoJuego, especie: string, destino: string): boolean {
  const c = criaturaDe(estado, especie);
  if (!c) return false;
  const op = opcionesEvolucion(datos, estado, c).find((o) => o.a === destino);
  if (!op?.puede) return false;
  if (op.item) quitar(estado, op.item);
  c.especie = destino;
  c.entrenamiento = 0;
  estado.equipo = estado.equipo.map((e) => (e === especie ? destino : e));
  marcarVista(estado, destino);
  if (!estado.registro.includes(destino)) estado.registro.push(destino);
  return true;
}

/** Suma puntos a la barra (sin pasar del máximo). Devuelve los puntos realmente sumados. */
export function sumarEntrenamiento(datos: Datos, c: CriaturaJugador, puntos: number): number {
  if (!tieneEvolucion(datos, c)) return 0;
  const antes = c.entrenamiento;
  c.entrenamiento = Math.min(datos.economia.entrenamiento.max, antes + Math.max(0, Math.floor(puntos)));
  return c.entrenamiento - antes;
}

/** Cuánta Esencia cuesta llenar la barra desde donde está. */
export function costoLlenar(datos: Datos, c: CriaturaJugador): number {
  const e = datos.economia.entrenamiento;
  return Math.ceil((e.max - c.entrenamiento) * e.esenciaPorPunto);
}

/** Infunde Esencia en la barra: llena todo lo que alcance. Devuelve los puntos sumados. */
export function infundirEsencia(datos: Datos, estado: EstadoJuego, especie: string): number {
  const c = criaturaDe(estado, especie);
  if (!c || !tieneEvolucion(datos, c)) return 0;
  const porPunto = datos.economia.entrenamiento.esenciaPorPunto;
  const faltan = datos.economia.entrenamiento.max - c.entrenamiento;
  const puntos = porPunto > 0 ? Math.min(faltan, Math.floor(estado.esencia / porPunto)) : faltan;
  if (puntos <= 0) return 0;
  estado.esencia -= Math.ceil(puntos * porPunto);
  return sumarEntrenamiento(datos, c, puntos);
}
