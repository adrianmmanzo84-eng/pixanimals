/**
 * Herramienta de ajuste: prueba repartos de stats para las etapas 2 a 4 sin tocar los JSON.
 * Uso: AJUSTE='{"robledo":{"ps":70,...}}' npx tsx scripts/ajustar-etapas.ts 600
 */
import { DATOS } from '../src/core/datos';
import { simularCruce } from './simular';

const N = Number(process.argv[2] ?? 600);
const ajuste = JSON.parse(process.env.AJUSTE ?? '{}') as Record<string, Record<string, number>>;
for (const [id, base] of Object.entries(ajuste)) Object.assign(DATOS.criaturas.get(id)!.base, base);
const ETAPAS: [number, number, string, string, string][] = [
  [1, 12, 'lumbrito', 'aletin', 'brotin'],
  [2, 22, 'leobrasa', 'corsario', 'robledo'],
  [3, 34, 'ignileon', 'almirante', 'guardabosque'],
  [4, 46, 'solarion', 'leviatan', 'titan_ancestral'],
];
for (const [etapa, nivel, brasa, marea, brote] of ETAPAS) {
  const total = (id: string) => Object.values(DATOS.criaturas.get(id)!.base).reduce((a, b) => a + b, 0);
  const r1 = simularCruce(brasa, brote, nivel, N, 'experta', 1);
  const r2 = simularCruce(brote, marea, nivel, N, 'experta', 2);
  const r3 = simularCruce(marea, brasa, nivel, N, 'experta', 3);
  const r4 = simularCruce(brote, brote, nivel, Math.min(N, 300), 'experta', 4);
  console.log(
    `E${etapa} Nv${nivel}  Brasa>Brote ${r1.victoriasA.toFixed(0)}%  Brote>Marea ${r2.victoriasA.toFixed(0)}%  Marea>Brasa ${r3.victoriasA.toFixed(0)}%` +
      `  · turnos ${r1.turnosMedios.toFixed(1)}/${r2.turnosMedios.toFixed(1)}/${r3.turnosMedios.toFixed(1)} · Brote espejo ${r4.turnosMedios.toFixed(1)}t  [totales ${total(brasa)}/${total(marea)}/${total(brote)}]`,
  );
}
