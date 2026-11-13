import type { Rng } from '../rng';
import { efectividad } from './formulas';
import type { Accion, Batalla, HabilidadEnCombate, Lado } from './motor';

export type NivelIA = 'novata' | 'tactica' | 'experta';
export const NIVELES_IA: NivelIA[] = ['novata', 'tactica', 'experta'];

/**
 * Novata:  una habilidad válida al azar.
 * Táctica: el ataque de mayor daño esperado (tipo y precisión incluidos).
 * Experta: además se cura, se cubre del movimiento final, aplica estados y potenciadores con criterio,
 *          y cambia de criatura cuando está en desventaja de tipo.
 */
export function elegirAccion(b: Batalla, lado: Lado, nivel: NivelIA, rng: Rng): Accion {
  // Ataque Definitivo (solo si este lado lo tiene habilitado): cargarlo, avisando, y usarlo en cuanto está listo.
  if (b.bloqueoDefinitivo(lado) === null && (nivel !== 'novata' || rng.prob(50))) return { tipo: 'definitivo' };
  if (b.puedeCargar(lado) && rng.prob(70)) return { tipo: 'cargar' };
  const defensa = cubrirseDelDefinitivo(b, lado, nivel, rng);
  if (defensa) return defensa;

  const validas = b.accionesValidas(lado);
  if (validas[0]!.tipo === 'empujon') return validas[0]!;
  if (nivel === 'novata') return rng.elegir(validas);

  const yo = b.lados[lado];
  const ladoRival = (1 - lado) as Lado;
  const rival = b.lados[ladoRival];
  const opciones = validas.flatMap((a) => (a.tipo === 'habilidad' ? [{ a, h: yo.habilidades[a.indice]! }] : []));
  const dano = (h: HabilidadEnCombate) => b.danoEsperado(lado, h.def);
  const mejorAtaque = opciones.filter((o) => o.h.def.potencia > 0).sort((x, y) => dano(y.h) - dano(x.h))[0];

  if (nivel === 'tactica') return mejorAtaque?.a ?? rng.elegir(validas);

  // ---- Experta
  const fraccionPs = yo.ps / yo.stats.ps;
  const con = (pred: (h: HabilidadEnCombate) => boolean) => opciones.find((o) => pred(o.h));

  // 1. Si puede rematar, remata con lo más preciso que alcance.
  const remates = opciones
    .filter((o) => o.h.def.potencia > 0 && dano(o.h) / ((o.h.def.precision ?? 100) / 100) >= rival.ps)
    .sort((x, y) => (y.h.def.precision ?? 100) - (x.h.def.precision ?? 100));
  if (remates[0]) return remates[0].a;

  // 1b. En desventaja de tipo, cambiar por una compañera mejor plantada (no en turnos seguidos).
  const tipos = b.datos.tipos;
  if (efectividad(rival.especie.tipo, yo.especie.tipo, tipos) === 'ventaja' && b.turno - b.ultimoCambio[lado] >= 2 && rng.prob(60)) {
    const mejor = mejorReemplazo(b, lado);
    if (mejor && mejor.puntos > 0) return { tipo: 'cambio', indice: mejor.indice };
  }

  // 2. Curarse cuando está bajo.
  const cura = con((h) => h.def.efectos.some((e) => e.tipo === 'cura'));
  if (cura && fraccionPs < 0.45) return cura.a;

  // 3. Cubrirse si el rival tiene listo su movimiento final (no siempre, para no ser predecible).
  const guardia = con((h) => h.def.efectos.some((e) => e.tipo === 'guardia'));
  const finalRivalListo = rival.habilidades.some((h, i) => h.def.rol === 'final' && b.bloqueo(ladoRival, i) === null);
  if (guardia && finalRivalListo && yo.ultima !== guardia.h.def.id && rng.prob(40)) return guardia.a;

  // 4. Estados al inicio, si el rival está sano y limpio.
  const estado = con((h) => h.def.rol === 'estado');
  if (estado && !rival.estado && rival.ps / rival.stats.ps > 0.5 && rng.prob(70)) {
    const e = estado.h.def.efectos.find((x) => x.tipo === 'estado');
    if (e && e.tipo === 'estado' && !b.datos.balance.estados[e.estado].inmunes.includes(rival.especie.tipo)) return estado.a;
  }

  // 5. Potenciarse una o dos veces con la vida alta.
  const potenciador = con(
    (h) => (h.def.rol === 'soporte' || h.def.rol === 'defensiva') && h.def.efectos.some((e) => e.tipo === 'etapa' && e.objetivo === 'propio' && yo.etapas[e.stat] < 2 && (e.stat !== 'vel' || b.velocidad(lado) <= b.velocidad(ladoRival))),
  );
  if (potenciador && fraccionPs > 0.6 && rng.prob(b.turno < 2 ? 70 : 15)) return potenciador.a;

  // 6. No disparar siempre el movimiento final en cuanto está listo: el rival podría esperarlo.
  const ataques = opciones.filter((o) => o.h.def.potencia > 0).sort((x, y) => dano(y.h) - dano(x.h));
  if (ataques[0]?.h.def.rol === 'final' && ataques[1] && rng.prob(30)) return ataques[1].a;
  return mejorAtaque?.a ?? rng.elegir(validas);
}

/** Puntúa a cada criatura de la banca frente al rival activo: tipo a favor, tipo en contra y vida restante. */
function mejorReemplazo(b: Batalla, lado: Lado): { indice: number; puntos: number } | null {
  const rival = b.act((1 - lado) as Lado);
  const tipos = b.datos.tipos;
  let mejor: { indice: number; puntos: number } | null = null;
  for (const i of b.banca(lado)) {
    const m = b.equipos[lado].miembros[i]!;
    const ataque = efectividad(m.especie.tipo, rival.especie.tipo, tipos);
    const defensa = efectividad(rival.especie.tipo, m.especie.tipo, tipos);
    const puntos = (ataque === 'ventaja' ? 2 : ataque === 'desventaja' ? -1 : 0) + (defensa === 'ventaja' ? -2 : defensa === 'desventaja' ? 1 : 0) + m.ps / m.stats.ps - 0.5;
    if (!mejor || puntos > mejor.puntos) mejor = { indice: i, puntos };
  }
  return mejor;
}

/** Elige quién entra cuando la criatura activa cae. */
export function elegirReemplazo(b: Batalla, lado: Lado, nivel: NivelIA, rng: Rng): number {
  const banca = b.banca(lado);
  if (nivel === 'novata') return rng.elegir(banca);
  return mejorReemplazo(b, lado)?.indice ?? banca[0]!;
}

/**
 * Si el otro lado cargó su Definitivo (lo avisó), cubrirse casi siempre; si lo tiene listo sin avisar, a veces.
 * Solo con una habilidad de guardia que se pueda usar ahora.
 */
function cubrirseDelDefinitivo(b: Batalla, lado: Lado, nivel: NivelIA, rng: Rng): Accion | null {
  if (nivel === 'novata') return null;
  const otro = (1 - lado) as Lado;
  const avisado = b.definitivoCargado[otro];
  const listo = b.bloqueoDefinitivo(otro) === null;
  if (!avisado && !listo) return null;
  const prob = avisado ? (nivel === 'experta' ? 85 : 50) : nivel === 'experta' ? 25 : 0;
  if (!rng.prob(prob)) return null;
  const yo = b.lados[lado];
  const i = yo.habilidades.findIndex((h, k) => h.def.efectos.some((e) => e.tipo === 'guardia') && b.bloqueo(lado, k) === null);
  return i >= 0 ? { tipo: 'habilidad', indice: i } : null;
}

