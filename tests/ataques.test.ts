import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { nuevaCriatura, combatienteDe } from '../src/core/estado/juego';
import { aprendibles, aprender, ataquesDe, conocidos, descartarOferta, ESPACIO_FINAL, nuevosPara, ofertaPorNivel, opcionesPergamino, restablecer } from '../src/core/progresion/ataques';
import { darXp } from '../src/core/progresion/experiencia';

const especieDe = (id: string) => DATOS.criaturas.get(id)!;

describe('aprender ataques', () => {
  it('solo ataques del mismo tipo, de su etapa o menor, sin Finales, Definitivos ni exclusivos', () => {
    for (const e of DATOS.jugables) {
      for (const id of aprendibles(DATOS, e.id)) {
        const h = DATOS.habilidades.get(id)!;
        expect(h.tipo).toBe(e.tipo);
        expect(['ofensiva', 'defensiva', 'soporte']).toContain(h.rol);
        const fuentes = DATOS.jugables.filter((c) => c.habilidades.includes(id));
        // Lo usa alguna criatura de su etapa o menor que es común o de su propia familia.
        expect(fuentes.some((c) => c.etapa <= e.etapa && (c.familia === e.familia || (!c.origen && !c.id.endsWith('_eclipse'))))).toBe(true);
      }
    }
    // Una etapa 1 tiene menos opciones que su etapa 4.
    const base = DATOS.jugables.find((c) => c.etapa === 1 && !c.origen)!;
    const final = DATOS.jugables.find((c) => c.familia === base.familia && c.etapa === 4)!;
    expect(aprendibles(DATOS, base.id).length).toBeGreaterThan(3);
    expect(aprendibles(DATOS, final.id).length).toBeGreaterThan(aprendibles(DATOS, base.id).length);
  });

  it('los ataques exclusivos de la Mina no los aprenden las demás familias', () => {
    const exclusivos = new Set(DATOS.jugables.filter((c) => c.origen).flatMap((c) => c.habilidades));
    for (const e of DATOS.jugables.filter((c) => !c.origen)) for (const id of aprendibles(DATOS, e.id)) expect(exclusivos.has(id)).toBe(false);
  });

  it('se reemplaza cualquiera de los 3 primeros espacios; el Final no', () => {
    const c = nuevaCriatura('lumbrito', 10, 'comun', false);
    const orig = [...especieDe('lumbrito').habilidades];
    const nuevo = nuevosPara(DATOS, c)[0]!;
    expect(aprender(DATOS, c, nuevo, ESPACIO_FINAL)).toBe(false);
    expect(aprender(DATOS, c, nuevo, 2)).toBe(true); // un Apoyo reemplazado por lo que sea
    expect(ataquesDe(DATOS, c)).toEqual([orig[0], orig[1], nuevo, orig[3]]);
    expect(ataquesDe(DATOS, c).filter((id) => DATOS.habilidades.get(id)!.rol === 'final')).toHaveLength(1);
    expect(conocidos(DATOS, c)).toContain(nuevo);
    // Un ataque ajeno a su tipo no se puede.
    const ajeno = [...DATOS.habilidades.values()].find((h) => h.tipo !== especieDe('lumbrito').tipo && h.rol === 'ofensiva')!;
    expect(aprender(DATOS, c, ajeno.id, 0)).toBe(false);
  });

  it('poner un ataque que ya está en otro espacio los intercambia; restablecer conserva la memoria', () => {
    const c = nuevaCriatura('lumbrito', 10, 'comun', false);
    const orig = especieDe('lumbrito').habilidades;
    const nuevo = nuevosPara(DATOS, c)[0]!;
    aprender(DATOS, c, nuevo, 0);
    aprender(DATOS, c, nuevo, 1);
    expect(ataquesDe(DATOS, c).slice(0, 2)).toEqual([orig[1], nuevo]);
    restablecer(c);
    expect(ataquesDe(DATOS, c)).toEqual(orig);
    expect(conocidos(DATOS, c)).toContain(nuevo);
    aprender(DATOS, c, nuevo, 2); // de la memoria, gratis
    expect(ataquesDe(DATOS, c)[2]).toBe(nuevo);
  });

  it('cada 5 niveles ofrece un ataque nuevo que no conoce', () => {
    const c = nuevaCriatura('lumbrito', 3, 'comun', false);
    expect(ofertaPorNivel(DATOS, c, 3)).toBeNull();
    darXp(DATOS, c, 10_000);
    expect(c.nivel).toBeGreaterThanOrEqual(5);
    expect(c.ofertaAtaque).toBeTruthy();
    expect(nuevosPara(DATOS, c)).toContain(c.ofertaAtaque);
    const of = c.ofertaAtaque!;
    aprender(DATOS, c, of, 0);
    expect(c.ofertaAtaque).toBeUndefined();
    c.ofertaAtaque = 'x';
    descartarOferta(c);
    expect(c.ofertaAtaque).toBeUndefined();
  });

  it('el Pergamino ofrece 3 ataques distintos que no conoce, siempre los mismos con la misma semilla', () => {
    const c = nuevaCriatura('lumbrito', 10, 'comun', false);
    const a = opcionesPergamino(DATOS, c, 42);
    expect(a).toHaveLength(3);
    expect(new Set(a).size).toBe(3);
    for (const id of a) expect(nuevosPara(DATOS, c)).toContain(id);
    expect(opcionesPergamino(DATOS, c, 42)).toEqual(a);
    expect(DATOS.items.get('pergamino')!.efecto).toEqual({ tipo: 'tecnica', opciones: 3 });
  });

  it('el combate usa los ataques elegidos y conserva los elegidos al evolucionar', () => {
    const c = nuevaCriatura('lumbrito', 20, 'comun', false);
    const nuevo = nuevosPara(DATOS, c)[0]!;
    aprender(DATOS, c, nuevo, 1);
    expect(combatienteDe(DATOS, c).habilidades.map((h) => h.def.id)[1]).toBe(nuevo);
    const destino = especieDe('lumbrito').evoluciona[0]!.a;
    c.especie = destino;
    expect(ataquesDe(DATOS, c)[1]).toBe(nuevo);
    expect(ataquesDe(DATOS, c)[ESPACIO_FINAL]).toBe(especieDe(destino).habilidades[ESPACIO_FINAL]);
  });
});
