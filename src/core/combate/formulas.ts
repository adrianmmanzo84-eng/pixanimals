import type { Balance, Criatura, Habilidad, StatId, TipoDef } from '../../esquemas/esquemas';

/**
 * ÚNICO lugar donde viven las fórmulas del combate.
 * Todos los números salen de src/data/balance.json; aquí solo está la forma de la cuenta.
 */

export interface Stats {
  ps: number;
  atq: number;
  def: number;
  ate: number;
  dfe: number;
  vel: number;
}

export type Efectividad = 'ventaja' | 'desventaja' | 'neutro';

/**
 * PS = psBase + base×nivel/psDivisor · otros stats = statBase + base×nivel/statDivisor
 * `potencial` es el bonus porcentual por rareza del ejemplar (0, 4, 8 o 12).
 */
export function calcularStats(especie: Criatura, nivel: number, b: Balance, potencial = 0, extra: Partial<Record<keyof Stats, number>> = {}): Stats {
  // `extra`: bonus porcentual propio de cada stat (vitaminas), que se suma al potencial.
  const m = (k: keyof Stats) => 1 + (potencial + (extra[k] ?? 0)) / 100;
  const otro = (k: Exclude<keyof Stats, 'ps'>) => Math.floor((b.stats.statBase + Math.floor((especie.base[k] * nivel) / b.stats.statDivisor)) * m(k));
  return {
    ps: Math.floor((b.stats.psBase + Math.floor((especie.base.ps * nivel) / b.stats.psDivisor)) * m('ps')),
    atq: otro('atq'),
    def: otro('def'),
    ate: otro('ate'),
    dfe: otro('dfe'),
    vel: otro('vel'),
  };
}

/** Cada nivel de stat vale ±paso (25 %). +2 = ×1,5 · −2 = ÷1,5 */
export function multEtapa(etapa: number, b: Balance): number {
  return etapa >= 0 ? 1 + b.etapas.paso * etapa : 1 / (1 + b.etapas.paso * -etapa);
}

export function efectividad(tipoAtaque: string, tipoDefensor: string, tipos: Map<string, TipoDef>): Efectividad {
  if (tipos.get(tipoAtaque)?.vence.includes(tipoDefensor)) return 'ventaja';
  if (tipos.get(tipoDefensor)?.vence.includes(tipoAtaque)) return 'desventaja';
  return 'neutro';
}

export function multTipo(e: Efectividad, b: Balance): number {
  return e === 'ventaja' ? b.dano.ventaja : e === 'desventaja' ? b.dano.desventaja : 1;
}

export interface EntradaDano {
  potencia: number;
  categoria: Habilidad['categoria'];
  tipoHabilidad: string;
  nivel: number;
  tipoAtacante: string;
  tipoDefensor: string;
  /** Stats ya calculados para el nivel, sin etapas. */
  statsAtacante: Stats;
  statsDefensor: Stats;
  etapasAtacante: Record<StatId, number>;
  etapasDefensor: Record<StatId, number>;
  /** Valor de azar entre azarMin y azarMax. */
  azar: number;
  critico: boolean;
  /** Multiplicadores situacionales ya resueltos (pasivas, quemadura, guardia). */
  otros: number;
}

/**
 * daño = potencia × (Ataque / Defensa) × (factorBase + factorNivel × nivel)
 *        × mismoTipo × tipo × azar × crítico × otros      (mínimo 1)
 */
export function calcularDano(e: EntradaDano, b: Balance, tipos: Map<string, TipoDef>): { dano: number; efectividad: Efectividad } {
  const fisica = e.categoria === 'fisica';
  const ataque = (fisica ? e.statsAtacante.atq : e.statsAtacante.ate) * multEtapa(fisica ? e.etapasAtacante.atq : e.etapasAtacante.ate, b);
  // Un golpe crítico ignora las mejoras de defensa del rival.
  const etapaDef = fisica ? e.etapasDefensor.def : e.etapasDefensor.dfe;
  const defensa = (fisica ? e.statsDefensor.def : e.statsDefensor.dfe) * multEtapa(e.critico ? Math.min(0, etapaDef) : etapaDef, b);
  const ef = efectividad(e.tipoHabilidad, e.tipoDefensor, tipos);
  const bruto =
    e.potencia *
    (ataque / defensa) *
    (b.dano.factorBase + b.dano.factorNivel * e.nivel) *
    (e.tipoHabilidad === e.tipoAtacante ? b.dano.mismoTipo : 1) *
    multTipo(ef, b) *
    e.azar *
    (e.critico ? b.dano.criticoMult : 1) *
    e.otros;
  return { dano: Math.max(1, Math.floor(bruto)), efectividad: ef };
}
