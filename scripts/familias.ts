/**
 * Balance entre familias: cada familia contra todas las demás, en la etapa 1 (nivel 12) y en la final (nivel 46),
 * más cada forma Eclipse contra su forma normal.
 * Uso: npm run familias            (400 combates por cruce)
 *      npm run familias -- 1000
 */
import { DATOS } from '../src/core/datos';
import { simularCruce } from './simular';

const N = Number(process.argv[2] ?? 400);
const familias = [...new Set([...DATOS.criaturas.values()].map((c) => c.familia))];
const deEtapa = (f: string, e: number) => [...DATOS.criaturas.values()].find((c) => c.familia === f && c.etapa === e && !c.sprites.endsWith('b'))!;
const vence = (a: string, b: string) => DATOS.tipos.get(a)!.vence.includes(b);

for (const [etapa, nivel] of [[1, 12], [4, 46]] as const) {
  console.log(`\n== Etapa ${etapa} (nivel ${nivel}) ==`);
  const total: Record<string, number[]> = {};
  const ventaja: number[] = [];
  const neutros: Record<string, number[]> = {};
  familias.forEach((fa, i) =>
    familias.slice(i + 1).forEach((fb, j) => {
      const a = deEtapa(fa, etapa);
      const b = deEtapa(fb, etapa);
      const r = simularCruce(a.id, b.id, nivel, N, 'experta', 100 + i * 31 + j);
      const pa = r.victoriasA + r.empates / 2;
      (total[fa] ??= []).push(pa);
      (total[fb] ??= []).push(100 - pa);
      if (vence(a.tipo, b.tipo)) ventaja.push(pa);
      else if (vence(b.tipo, a.tipo)) ventaja.push(100 - pa);
      else if (a.tipo !== b.tipo) {
        (neutros[fa] ??= []).push(pa);
        (neutros[fb] ??= []).push(100 - pa);
      }
    }),
  );
  const media = (v: number[]) => v.reduce((x, y) => x + y, 0) / v.length;
  for (const f of [...familias].sort((x, y) => media(total[y]!) - media(total[x]!)))
    console.log(`${deEtapa(f, etapa).nombre.padEnd(14)} ${deEtapa(f, etapa).tipo.padEnd(7)} todas ${media(total[f]!).toFixed(0).padStart(3)} %   sin ventaja de tipo ${media(neutros[f] ?? [50]).toFixed(0).padStart(3)} %`);
  console.log(`Con ventaja de tipo se gana el ${media(ventaja).toFixed(0)} % (mín ${Math.min(...ventaja).toFixed(0)}, máx ${Math.max(...ventaja).toFixed(0)}, ${ventaja.length} cruces)`);
}

console.log('\n== Eclipse contra su forma normal (nivel 46) ==');
for (const f of familias) {
  const normal = deEtapa(f, 4);
  const ec = [...DATOS.criaturas.values()].find((c) => c.familia === f && c.sprites.endsWith('_4b'))!;
  const r = simularCruce(ec.id, normal.id, 46, N, 'experta', 7);
  console.log(`${ec.nombre.padEnd(18)} ${r.victoriasA.toFixed(0).padStart(3)} %`);
}
