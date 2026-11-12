import type { EstadoJuego, MinijuegoId } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { criaturaDe } from '../estado/juego';
import { diaLocal } from '../items/items';
import { sumarEntrenamiento, puedeEvolucionar } from '../progresion/evolucion';
import { registrar } from '../progresion/misiones';

/**
 * Premios de los minijuegos. Las escenas juegan y entregan un puntaje entre 0 y 1;
 * aquí se convierte en Entrenamiento para la criatura elegida y monedas.
 * Solo las primeras `conPremioPorDia` partidas de cada minijuego dan premio.
 */

export interface ResultadoMinijuego {
  conPremio: boolean;
  entrenamiento: number;
  monedas: number;
  /** El puntaje superó el mejor anterior. */
  record: boolean;
  /** La criatura quedó lista para evolucionar con esta partida. */
  lista: boolean;
  /** Partidas con premio que quedan hoy, después de esta. */
  quedan: number;
}

function partidasHoy(estado: EstadoJuego, ahora: number): Record<string, number> {
  const hoy = diaLocal(ahora);
  if (estado.minijuegos.dia !== hoy) estado.minijuegos = { ...estado.minijuegos, dia: hoy, partidas: {} };
  return estado.minijuegos.partidas;
}

export function partidasConPremio(datos: Datos, estado: EstadoJuego, id: MinijuegoId, ahora: number): number {
  return Math.max(0, datos.economia.minijuegos.conPremioPorDia - (partidasHoy(estado, ahora)[id] ?? 0));
}

const escala = (r: { min: number; max: number }, p: number) => Math.round(r.min + (r.max - r.min) * p);

/**
 * Termina una partida. `puntaje` va de 0 (nada) a 1 (perfecta); `marcador` es el número que ve el jugador
 * (bayas atrapadas, largo de la secuencia…) y sirve para el récord.
 */
export function terminarMinijuego(datos: Datos, estado: EstadoJuego, id: MinijuegoId, especie: string, puntaje: number, marcador: number, ahora: number): ResultadoMinijuego {
  const p = Math.max(0, Math.min(1, puntaje));
  const partidas = partidasHoy(estado, ahora);
  const conPremio = (partidas[id] ?? 0) < datos.economia.minijuegos.conPremioPorDia;
  partidas[id] = (partidas[id] ?? 0) + 1;
  const record = marcador > (estado.minijuegos.records[id] ?? 0);
  if (record) estado.minijuegos.records[id] = marcador;
  registrar(datos, estado, 'minijuego', 1, ahora);
  if (record && marcador > 0) registrar(datos, estado, 'record', 1, ahora);

  let entrenamiento = 0;
  let monedas = 0;
  let lista = false;
  if (conPremio && p > 0) {
    const eco = datos.economia.minijuegos;
    monedas = escala(eco.monedas, p);
    estado.monedas += monedas;
    const c = criaturaDe(estado, especie);
    if (c) {
      const antes = puedeEvolucionar(datos, estado, c);
      entrenamiento = sumarEntrenamiento(datos, c, escala(eco.entrenamiento, p));
      lista = !antes && puedeEvolucionar(datos, estado, c);
    }
  }
  return { conPremio, entrenamiento, monedas, record, lista, quedan: partidasConPremio(datos, estado, id, ahora) };
}
