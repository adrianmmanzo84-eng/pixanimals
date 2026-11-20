import { z } from 'zod';
import practicaJson from '../../data/practica.json';
import type { Datos } from '../datos';
import type { EstadoJuego } from '../../esquemas/esquemas';
import { Rng } from '../rng';
import { crearCombatiente, type Combatiente } from '../combate/motor';
import { formaParaNivel } from '../combate/rival';
import { regionAbierta } from './historia';

/**
 * Zonas de práctica (D270): rivales salvajes de un rango de niveles fijo, para subir de nivel peleando.
 * Cada zona sigue a una región de la historia: la Pradera y el Bosque están abiertas desde el inicio y las
 * demás se abren al llegar a su región. Solo dan experiencia y unas pocas monedas (sin carta premio).
 */
export const ZonaPracticaZ = z.object({
  id: z.string(),
  fondo: z.string(),
  tipo: z.string().nullable(),
  nivel: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
  ia: z.enum(['novata', 'tactica', 'experta']),
  monedas: z.number().int().min(0),
  region: z.number().int().min(0).nullable(),
});
export type ZonaPractica = z.infer<typeof ZonaPracticaZ>;

export const ZONAS: ZonaPractica[] = z.object({ zonas: z.array(ZonaPracticaZ) }).parse(practicaJson).zonas;

/** ¿Se puede entrar a esta zona? Sin región, o con la región ya abierta en la historia (partidas viejas: todas). */
export function zonaAbierta(datos: Datos, estado: EstadoJuego, i: number): boolean {
  const z = ZONAS[i];
  if (!z) return false;
  if (z.region === null || !estado.historia || estado.historia.libre) return true;
  return regionAbierta(datos, estado, z.region);
}

export type Dificultad = 'facil' | 'pareja' | 'dificil';

/** Cómo se ve la zona para tu equipo: por debajo, a la par o por encima de su nivel medio. */
export function dificultadZona(z: ZonaPractica, nivelMedio: number): Dificultad {
  if (nivelMedio >= z.nivel[1] + 2) return 'facil';
  if (nivelMedio >= z.nivel[0] - 1) return 'pareja';
  return 'dificil';
}

/** Rivales salvajes de la zona: del tipo de la región, evolucionados según su nivel, con niveles dentro del rango. */
export function equipoPractica(datos: Datos, indice: number, cuantos: number, rng: Rng): Combatiente[] {
  const z = ZONAS[indice]!;
  const iniciales = [...datos.criaturas.values()].filter((c) => c.etapa === 1 && !c.origen && !c.jefe && (!z.tipo || c.tipo === z.tipo));
  const bolsa = [...iniciales];
  const n = Math.min(3, Math.max(1, cuantos));
  const res: Combatiente[] = [];
  for (let k = 0; k < n; k++) {
    const fuente = bolsa.length ? bolsa : iniciales;
    const especie = fuente.splice(Math.floor(rng.sig() * fuente.length), 1)[0]!;
    const nivel = rng.entero(z.nivel[0], z.nivel[1]);
    res.push(crearCombatiente(datos, formaParaNivel(datos, especie.id, nivel), nivel));
  }
  return res;
}
