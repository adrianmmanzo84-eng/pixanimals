import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente, type Evento } from '../src/core/combate/motor';
import { elegirAccion } from '../src/core/combate/ia';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';

/**
 * Cada mensaje del combate tiene texto en los dos idiomas: nunca se ve una clave cruda como «c.curaPasiva.micelio».
 * Se juegan combates con todas las criaturas y jefes y se revisan las claves que armaría la pantalla de combate.
 */
const ALIAS = DATOS.balance.pasivasAlias as Record<string, { mecanica: string } | undefined>;

function claves(e: Evento, bat: Batalla): string[][] {
  switch (e.t) {
    case 'estado_aplicado':
      return [[`c.estado.${e.estado}`], [`estado.abrev.${e.estado}`]];
    case 'estado_dano':
      return [[`c.estado_dano.${e.estado}`]];
    case 'estado_fin':
      return [[`c.estado_fin.${e.estado}`]];
    case 'estado_impide':
      return [[`c.impide.${e.estado}`]];
    case 'guardia':
      return [[`c.guardia.${e.modo}`]];
    case 'pasiva':
      return [[`c.pasiva.${e.pasiva}`, `c.pasiva.${ALIAS[e.pasiva]?.mecanica ?? e.pasiva}`]];
    case 'cura': {
      const p = bat.act(e.lado).especie.pasiva;
      return e.origen === 'pasiva' ? [[`c.curaPasiva.${p}`, 'c.cura']] : [['c.cura']];
    }
    case 'etapa':
    case 'etapa_tope':
      return [[`stat.${e.stat}`]];
    default:
      return [];
  }
}

describe('textos del combate', () => {
  it('ningún evento deja una clave sin texto', () => {
    const especies = [...DATOS.criaturas.keys()];
    const faltan = new Set<string>();
    const vistos = new Set<string>();
    const rng = new Rng(7);
    for (const [i, a] of especies.entries()) {
      for (let k = 0; k < 2; k++) {
        const b = especies[(i * 7 + k * 31 + 3) % especies.length]!;
        const bat = new Batalla(DATOS, [crearCombatiente(DATOS, a, 40), crearCombatiente(DATOS, b, 40)], new Rng(i * 10 + k));
        for (let turno = 0; turno < 40 && !bat.terminado; turno++) {
          for (const e of bat.ejecutarTurno(elegirAccion(bat, 0, 'experta', rng), elegirAccion(bat, 1, 'experta', rng))) {
            vistos.add(e.t === 'cura' ? `cura_${e.origen}` : e.t);
            for (const opciones of claves(e, bat)) {
              for (const dic of [es, en] as Record<string, string>[]) if (!opciones.some((c) => c in dic)) faltan.add(opciones[0]!);
            }
          }
        }
      }
    }
    // Que el recorrido de verdad pase por los mensajes que importan.
    for (const t of ['pasiva', 'cura_pasiva', 'estado_aplicado', 'estado_dano', 'estado_fin', 'guardia', 'etapa']) expect(vistos).toContain(t);
    expect([...faltan].sort()).toEqual([]);
  });
});

describe('movimiento de los efectos de ataque (D267)', () => {
  it('cada ataque clasificado existe, hace daño y tiene dibujo propio', async () => {
    const mov = (await import('../src/ui/movimiento-ataques.json')).default as { rayo: string[]; proyectil: string[] };
    const efectos = (await import('../src/ui/efectos-ataques.json')).default as Record<string, unknown>;
    const ids = [...mov.rayo, ...mov.proyectil];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      const h = DATOS.habilidades.get(id);
      expect(h, id).toBeDefined();
      expect(h!.potencia, id).toBeGreaterThan(0);
      expect(efectos[id], id).toBeDefined();
    }
  });
});
