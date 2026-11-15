/**
 * Simulación de balance de la Mina: un jugador automático sencillo (cava hacia abajo y esquiva irrompibles,
 * lava, pinchos, gas y bombas) juega 200 partidas por zona. Escribe en /tmp/sim/res.txt el % que llega a la
 * guarida, el % que pierde por vida y el daño por causa.
 * Uso: mkdir -p /tmp/sim && SIM='{"actual":{}}' npx vitest run scripts/sim/mina_sim.test.ts --dir scripts
 *      (SIM permite probar cambios: {"prueba":{"mina":{"energia":80},"zonas":[{"piedra":30}]}})
 */
import { it } from 'vitest';
import { DATOS as BASE } from '../../src/core/datos';
import { Mina, DUREZA } from '../../src/core/minijuegos/mina';

function jugar(DATOS: any, zona: number, semilla: number): { llego: boolean; metros: number; vida: number; causa: string | null } {
  const m = new Mina(DATOS, zona, semilla);
  const reg = (ev: any[]) => { for (const e of ev) if (e.t === 'dano') (globalThis as any).DANO[e.causa] = ((globalThis as any).DANO[e.causa] ?? 0) + e.n; };
  const acc = m.accion.bind(m); (m as any).accion = (d: any) => { const ev = acc(d); reg(ev); return ev; };
  const gr = m.gravedad.bind(m); (m as any).gravedad = () => { const ev = gr(); reg(ev); return ev; };
  let pasos = 0;
  while (!m.terminada && pasos < 3000) {
    pasos++;
    for (let i = 0; i < 6 && !m.terminada; i++) m.gravedad();
    if (m.terminada) break;
    const abajo = m.celda(m.x, m.y + 1).b;
    // Bot sencillo: cava hacia abajo; si abajo hay irrompible/lava/pinchos, se corre hacia el lado más barato.
    const malo = (b: string) => b === 'irrompible' || b === 'lava' || b === 'pinchos' || b === 'gas' || b === 'bomba';
    if (!malo(abajo)) { m.accion('abajo'); continue; }
    const costo = (dx: number) => { const b = m.celda(m.x + dx, m.y).b; const bb = m.celda(m.x + dx, m.y + 1).b; if (m.x + dx < 0 || m.x + dx >= m.columnas || b === 'irrompible' || b === 'lava') return 99; return (DUREZA[b as keyof typeof DUREZA] ?? 0) + (malo(bb) ? 5 : 0); };
    const izq = costo(-1), der = costo(1);
    if (izq >= 99 && der >= 99) { m.accion('abajo'); continue; }
    m.accion(izq <= der ? 'izq' : 'der');
  }
  return { llego: m.causaFin === 'guarida', metros: m.metros, vida: m.vida, causa: m.causaFin };
}

const CONFIGS: Record<string, any> = JSON.parse(process.env.SIM ?? '{"base":{}}');
it('simulación', () => {
  for (const [nombre, cfg] of Object.entries(CONFIGS)) {
    const mina = { ...BASE.economia.mina, ...cfg.mina, zonas: BASE.economia.mina.zonas.map((z: any, i: number) => ({ ...z, bloques: { ...z.bloques, ...(cfg.zonas?.[i] ?? {}) }, cuevas: cfg.cuevas?.[i] ?? z.cuevas })) };
    const DATOS = { ...BASE, economia: { ...BASE.economia, mina } };
    const fila: string[] = [];
    for (let z = 1; z <= 5; z++) {
      let ok = 0, vida = 0; (globalThis as any).DANO = {};
      const N = 200;
      for (let s = 0; s < N; s++) { const r = jugar(DATOS, z, s * 7919 + z); if (r.llego) ok++; if (r.causa === 'vida') vida++; }
      fila.push(`${Math.round((ok / N) * 100)}%(v${Math.round((vida / N) * 100)})${JSON.stringify((globalThis as any).DANO)}`);
    }
    require('fs').appendFileSync('/tmp/sim/res.txt', nombre + ' ' + fila.join(' ') + '\n');
  }
}, 600000);
