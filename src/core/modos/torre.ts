import type { EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { Rng } from '../rng';
import { crearCombatiente, type Combatiente } from '../combate/motor';
import { formaParaNivel } from '../combate/rival';
import type { NivelIA } from '../combate/ia';

/**
 * Torre de Desafíos: pisos con rivales cada vez más fuertes. Cada piso tiene siempre el mismo equipo
 * (sale de una semilla del piso). Perder no quita progreso: se reintenta el mismo piso.
 * El primer triunfo en cada piso da monedas; los jefes, además, un sobre.
 */

export interface PisoTorre {
  piso: number;
  nivel: number;
  jefe: boolean;
  ia: NivelIA;
  /** Especies del equipo rival, ya evolucionadas según el nivel. */
  especies: string[];
}

export function esJefe(datos: Datos, piso: number): boolean {
  return piso % datos.economia.torre.jefeCada === 0;
}

export function datosPiso(datos: Datos, piso: number, tamano: number): PisoTorre {
  const t = datos.economia.torre;
  const jefe = esJefe(datos, piso);
  const nivel = Math.min(datos.balance.nivelMax, Math.round(t.nivelBase + t.nivelPorPiso * piso) + (jefe ? t.nivelExtraJefe : 0));
  const ia = t.ia.find((x) => piso <= x.hasta)?.ia ?? 'experta';
  const rng = new Rng(piso * 1009 + 7);
  const bolsa = [...datos.criaturas.values()].filter((c) => c.etapa === 1).map((c) => c.id);
  const especies = Array.from({ length: tamano }, (_, i) => {
    const inicial = bolsa.splice(rng.entero(0, bolsa.length - 1), 1)[0]!;
    // Los jefes usan formas Eclipse cuando el nivel alcanza (la primera criatura del equipo).
    return formaParaNivel(datos, inicial, nivel, jefe && i === 0);
  });
  return { piso, nivel, jefe, ia: jefe && ia === 'novata' ? 'tactica' : ia, especies };
}

export function equipoPiso(datos: Datos, p: PisoTorre): Combatiente[] {
  return p.especies.map((e) => crearCombatiente(datos, e, p.nivel));
}

export interface PremioTorre {
  monedas: number;
  sobre: string | null;
  /** Primera vez que se supera este piso (si no, no hay premio). */
  nuevo: boolean;
}

/** Lo que da superar un piso por primera vez. */
export function premioPiso(datos: Datos, piso: number): { monedas: number; sobre: string | null } {
  const t = datos.economia.torre;
  const sobre = piso % t.cadaSobreGrande === 0 ? t.sobreGrande : esJefe(datos, piso) ? t.sobreJefe : null;
  return { monedas: t.monedasBase + t.monedasPorPiso * piso, sobre };
}

/** Registra el resultado de un piso. Al ganar, avanza al siguiente y cobra el premio si es la primera vez. */
export function resultadoTorre(datos: Datos, estado: EstadoJuego, piso: number, victoria: boolean): PremioTorre {
  if (!victoria) return { monedas: 0, sobre: null, nuevo: false };
  const nuevo = piso > estado.torre.mejor;
  estado.torre.piso = Math.max(estado.torre.piso, piso + 1);
  if (!nuevo) return { monedas: 0, sobre: null, nuevo };
  estado.torre.mejor = piso;
  const p = premioPiso(datos, piso);
  estado.monedas += p.monedas;
  if (p.sobre) estado.sobresRegalo[p.sobre] = (estado.sobresRegalo[p.sobre] ?? 0) + 1;
  return { ...p, nuevo };
}
