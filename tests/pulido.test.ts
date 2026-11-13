import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { estadoNuevo } from '../src/core/estado/juego';
import { cartaInicial } from '../src/core/sobres/sobres';

describe('carta inicial', () => {
  it('da una sola criatura de etapa 1, Poco común, de cualquier familia', () => {
    const vistas = new Set<string>();
    for (let s = 1; s <= 300; s++) {
      const e = estadoNuevo(DATOS, 0);
      const c = cartaInicial(DATOS, e, new Rng(s));
      expect(e.bienvenida).toBe(true);
      expect(e.criaturas).toHaveLength(1);
      expect(e.equipo).toEqual([c.especie]);
      expect(DATOS.criaturas.get(c.especie)!.etapa).toBe(1);
      expect(c.rareza).toBe('poco_comun');
      vistas.add(c.especie);
    }
    const familias = [...DATOS.criaturas.values()].filter((c) => c.etapa === 1).length;
    expect(vistas.size).toBe(familias);
  });
});

import { Batalla, crearCombatiente, type Accion } from '../src/core/combate/motor';
import { abrirSobre, nivelDeLlegada, type Carta } from '../src/core/sobres/sobres';

const item = (id: string) => DATOS.items.get(id)!;
const nuevaBatalla = (n0 = 1) =>
  new Batalla(
    DATOS,
    [Array.from({ length: n0 }, (_, i) => crearCombatiente(DATOS, ['lumbrito', 'aletin', 'brotin'][i]!, 20)), [crearCombatiente(DATOS, 'aletin', 20)]],
    new Rng(3),
  );
const nada: Accion = { tipo: 'item', item: item('carta_muralla') };

describe('ítems nuevos en combate', () => {
  it('Carta Furia sube el Ataque 2 etapas; al tope se bloquea', () => {
    const b = nuevaBatalla();
    const ev = b.ejecutarTurno({ tipo: 'item', item: item('carta_furia') }, nada);
    expect(ev).toContainEqual({ t: 'etapa', lado: 0, stat: 'atq', delta: 2 });
    b.act(0).etapas.atq = DATOS.balance.etapas.max;
    expect(b.bloqueoItem(0, item('carta_furia'))).toBe('tope');
  });
  it('los encantos duermen o bajan stats al rival', () => {
    const b = nuevaBatalla();
    b.ejecutarTurno({ tipo: 'item', item: item('encanto_sueno') }, nada);
    expect(b.act(1).estado?.id).toBe('sueno');
    expect(b.bloqueoItem(0, item('encanto_veneno'))).toBe('rival_con_estado');
    const c = nuevaBatalla();
    const ev = c.ejecutarTurno({ tipo: 'item', item: item('encanto_lento') }, nada);
    expect(ev).toContainEqual({ t: 'etapa', lado: 1, stat: 'vel', delta: -2 });
  });
  it('Revivir levanta a la primera criatura caída con 50 % de PS', () => {
    const b = nuevaBatalla(2);
    expect(b.bloqueoItem(0, item('revivir'))).toBe('sin_caidas');
    b.equipos[0].miembros[1]!.ps = 0;
    const ev = b.ejecutarTurno({ tipo: 'item', item: item('revivir') }, nada);
    const m = b.equipos[0].miembros[1]!;
    expect(m.ps).toBe(Math.floor(m.stats.ps / 2));
    expect(ev.some((e) => e.t === 'revive')).toBe(true);
    expect(b.banca(0)).toContain(1);
  });
  it('Reloj de Arena: dos ataques seguidos y cuenta como un ítem', () => {
    const b = nuevaBatalla();
    const ev = b.ejecutarTurno({ tipo: 'doble', item: item('reloj_arena'), primera: { tipo: 'habilidad', indice: 0 }, segunda: { tipo: 'habilidad', indice: 0 } }, nada);
    expect(ev.filter((e) => e.t === 'usa' && e.lado === 0)).toHaveLength(2);
    expect(b.itemsUsados[0]).toBe(1);
  });
});

describe('sobres mixtos', () => {
  it('traen ítems y criaturas de etapa 1 y 2 en proporciones cercanas a las configuradas', () => {
    const e = estadoNuevo(DATOS, 0);
    e.monedas = 1e9;
    const def = DATOS.sobres.sobres.find((s) => s.id === 'basico')!;
    let items = 0;
    let criaturas = 0;
    let etapa2 = 0;
    for (let s = 0; s < 1500; s++)
      for (const c of abrirSobre(DATOS, e, 'basico', new Rng(s), 0) as Carta[]) {
        if (c.clase === 'item') items++;
        else {
          criaturas++;
          if (DATOS.criaturas.get(c.especie)!.etapa === 2) etapa2++;
        }
      }
    expect((items / (items + criaturas)) * 100).toBeCloseTo(def.probItem, -1);
    expect((etapa2 / criaturas) * 100).toBeCloseTo(def.probEtapa2, -1);
    // Las de etapa 2 llegan con el nivel en que evoluciona su etapa 1.
    const dos = e.criaturas.find((c) => DATOS.criaturas.get(c.especie)!.etapa === 2)!;
    expect(dos.nivel).toBe(nivelDeLlegada(DATOS, dos.especie));
    expect(dos.nivel).toBeGreaterThan(DATOS.sobres.nivelInicial);
  });
  it('el Sobre Botiquín solo da ítems de su lista', () => {
    const e = estadoNuevo(DATOS, 0);
    e.monedas = 1e9;
    const lista = DATOS.sobres.sobres.find((s) => s.id === 'botiquin')!.items!;
    for (let s = 0; s < 200; s++)
      for (const c of abrirSobre(DATOS, e, 'botiquin', new Rng(s), 0) as Carta[]) {
        expect(c.clase).toBe('item');
        if (c.clase === 'item') expect(lista).toContain(c.item);
      }
  });
});
