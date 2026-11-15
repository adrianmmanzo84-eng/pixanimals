import type { EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import type { Batalla } from '../combate/motor';
import { diaLocal } from '../items/items';

/**
 * Consuelo al perder (mejora 8): perder no debe sentirse como tiempo tirado, sobre todo para los chicos.
 * - Premio de valiente: un poco de Esencia, unas pocas veces por día.
 * - «¡Casi!»: cuánta vida le quedaba al rival, si fue poca.
 * - Un consejo de tipos contra la criatura rival que quedó en pie, y si tienes alguna de esos tipos.
 * No se usa en el Desafío del día (tiene su propio premio) ni al retirarse.
 */
export interface Consuelo {
  esencia: number;
  /** Fracción de vida que le quedaba al equipo rival (0 a 1), solo si fue menos de la mitad. */
  casi: number | null;
  /** Tipo de la criatura rival que ganó y los tipos que le ganan. */
  consejo: { rival: string; fuertes: string[]; tuya: string | null } | null;
}

export function darConsuelo(datos: Datos, estado: EstadoJuego, bat: Batalla, ahora: number): Consuelo {
  const eco = datos.economia.consuelo;
  const hoy = diaLocal(ahora);
  if (!estado.consuelo || estado.consuelo.dia !== hoy) estado.consuelo = { dia: hoy, veces: 0 };
  let esencia = 0;
  if (estado.consuelo.veces < eco.porDia) {
    estado.consuelo.veces++;
    esencia = eco.esencia;
    estado.esencia += esencia;
  }
  const rivales = bat.equipos[1].miembros;
  const vida = rivales.reduce((s, m) => s + Math.max(0, m.ps), 0) / rivales.reduce((s, m) => s + m.stats.ps, 0);
  const enPie = rivales.find((m) => m.ps > 0) ?? bat.act(1);
  const tipo = enPie.especie.tipo;
  const fuertes = [...datos.tipos.values()].filter((t) => t.vence.includes(tipo)).map((t) => t.id);
  const tuya = estado.criaturas.find((c) => fuertes.includes(datos.criaturas.get(c.especie)?.tipo ?? ''))?.especie ?? null;
  return { esencia, casi: vida < 0.5 ? vida : null, consejo: fuertes.length ? { rival: tipo, fuertes, tuya } : null };
}
