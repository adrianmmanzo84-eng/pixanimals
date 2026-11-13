/**
 * Ajusta el reparto de stats de las familias que se indiquen para que cada una gane cerca del 50 %
 * contra las familias de referencia (las 13 originales), sin cambiar el total de cada etapa.
 * Un solo parámetro por familia: "b" pasa puntos de las ofensivas (atq, ate, vel) a las de aguante (ps, def, dfe) o al revés,
 * igual en las 4 etapas para que la línea conserve su perfil al evolucionar. La Eclipse se ajusta para ganarle a su forma normal cerca del 58 %.
 * Uso: npx tsx scripts/ajustar-familias.ts fenec,topo,...  [N]   → imprime JSON {id: base}
 */
import { DATOS } from '../src/core/datos';
import { simularCruce } from './simular';

const nuevas = (process.argv[2] ?? '').split(',').filter(Boolean);
const N = Number(process.argv[3] ?? 160);
// Margen del ajuste: más que esto desdibuja el perfil de la familia (un tanque no debe volverse atacante).
const LIMITE = Number(process.env.LIMITE ?? 0.16);
// La Eclipse puede moverse más: solo tiene que ganarle a su forma normal cerca del 58 %.
const LIMITE_ECLIPSE = Number(process.env.LIMITE_ECLIPSE ?? 0.35);
const todas = [...DATOS.criaturas.values()];
const familiasRef = [...new Set(todas.map((c) => c.familia))].filter((f) => !nuevas.includes(f));
const STATS = ['ps', 'atq', 'def', 'ate', 'dfe', 'vel'] as const;
const AGUANTE = new Set(['ps', 'def', 'dfe']);
const original = new Map(todas.map((c) => [c.id, { ...c.base }]));
const deEtapa = (f: string, e: number) => todas.find((c) => c.familia === f && c.etapa === e && !c.sprites.endsWith('b'))!;
const eclipse = (f: string) => todas.find((c) => c.familia === f && c.sprites.endsWith('_4b'))!;

function aplicar(id: string, b: number): void {
  const o = original.get(id)!;
  const total = Object.values(o).reduce((x, y) => x + y, 0);
  const w = STATS.map((s) => o[s] * (AGUANTE.has(s) ? 1 + b : 1 - b));
  const suma = w.reduce((x, y) => x + y, 0);
  const v = w.map((x) => (x * total) / suma);
  const r = v.map(Math.floor);
  const orden = [...r.keys()].sort((i, j) => v[j]! - r[j]! - (v[i]! - r[i]!));
  for (const i of orden.slice(0, total - r.reduce((x, y) => x + y, 0))) r[i]!++;
  const base = DATOS.criaturas.get(id)!.base;
  STATS.forEach((s, i) => (base[s] = r[i]!));
}

function contraRef(id: string, etapa: number, nivel: number): number {
  let t = 0;
  familiasRef.forEach((f, i) => (t += simularCruce(id, deEtapa(f, etapa).id, nivel, N, 'experta', 500 + i * 17).victoriasA));
  return t / familiasRef.length;
}

/** Bisección de b en [-limite, limite] para que medir(b) quede cerca de la meta (medir crece con b si sube = true). */
function buscar(medir: (b: number) => number, meta: number, limite = LIMITE): number {
  let lo = -limite;
  let hi = limite;
  const sube = medir(hi) > medir(lo);
  for (let k = 0; k < 7; k++) {
    const m = (lo + hi) / 2;
    if (medir(m) < meta === sube) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

const salida: Record<string, Record<string, number>> = {};
const NIVELES = [12, 22, 34, 46];
for (const f of nuevas) {
  const linea = [1, 2, 3, 4].map((e) => deEtapa(f, e).id);
  // Un solo valor para toda la línea: la familia mantiene su perfil al evolucionar.
  let mejor = 0;
  let costo = Infinity;
  for (let b = -LIMITE; b <= LIMITE + 1e-9; b += LIMITE / 4) {
    for (const id of linea) aplicar(id, b);
    const c = [0, 3].reduce((t, i) => t + (contraRef(linea[i]!, i + 1, NIVELES[i]!) - 50) ** 2, 0);
    if (c < costo) [mejor, costo] = [b, c];
  }
  for (const id of linea) aplicar(id, mejor);
  const ec = eclipse(f).id;
  const be = buscar((b) => (aplicar(ec, b), simularCruce(ec, linea[3]!, 46, N * 2, 'experta', 7).victoriasA), 58, LIMITE_ECLIPSE);
  aplicar(ec, be);
  for (const id of [...linea, ec]) salida[id] = { ...DATOS.criaturas.get(id)!.base };
  console.error(`${f} (b ${mejor.toFixed(2)}): ` + linea.map((id, i) => `${contraRef(id, i + 1, NIVELES[i]!).toFixed(0)} %`).join(' / ') + ` · Eclipse ${simularCruce(ec, linea[3]!, 46, N * 2, 'experta', 7).victoriasA.toFixed(0)} %`);
}
console.log(JSON.stringify(salida));
