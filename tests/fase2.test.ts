import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente, type Accion, type Evento } from '../src/core/combate/motor';
import { elegirAccion, elegirReemplazo, NIVELES_IA } from '../src/core/combate/ia';
import { generarRival } from '../src/core/combate/rival';
import { criaturaDe, estadoNuevo, nuevaCriatura, ponerAlFrente } from '../src/core/estado/juego';
import { deserializar, exportarCodigo, importarCodigo, serializar } from '../src/core/estado/guardado';
import { abrirSobre, costoDe, precioSobre, sobreBienvenida, sobresGratis, type Carta } from '../src/core/sobres/sobres';
import { aplicarRecompensa, darXp, xpParaSubir } from '../src/core/progresion/experiencia';

const HORA = 3_600_000;
const hab = (i: number): Accion => ({ tipo: 'habilidad', indice: i });
const trio = (nivel = 10) => ['lumbrito', 'aletin', 'brotin'].map((id) => crearCombatiente(DATOS, id, nivel));
const tipos = (ev: Evento[]) => ev.map((e) => e.t);

describe('datos de la fase 2', () => {
  it('65 criaturas: 13 familias × 4 etapas + 13 Eclipse, con totales 300 / 380 / 450 / 520 (Brote, algo menos desde la etapa 2)', () => {
    expect(DATOS.criaturas.size).toBe(65);
    expect(new Set([...DATOS.criaturas.values()].map((c) => c.familia)).size).toBe(13);
    for (const c of DATOS.criaturas.values()) {
      const total = Object.values(c.base).reduce((a, b) => a + b, 0);
      const meta = [300, 380, 450, 520][c.etapa - 1]!;
      // La familia Brote cambia total por curación y resistencia (ver docs/BALANCE.md).
      if (c.familia === 'brote' && c.etapa > 1) expect(total).toBeGreaterThan(meta - 60);
      else expect(total).toBe(meta);
      expect(total).toBeLessThanOrEqual(meta);
    }
  });
  it('las cadenas de evolución suben de etapa dentro de la misma familia', () => {
    for (const c of DATOS.criaturas.values()) {
      for (const ev of c.evoluciona) {
        const sig = DATOS.criaturas.get(ev.a)!;
        expect(sig.familia).toBe(c.familia);
        expect(sig.etapa).toBe(c.etapa + 1);
      }
    }
  });
});

describe('equipos y cambio de criatura', () => {
  it('cambiar gasta el turno, ocurre antes de los ataques y borra las mejoras de quien sale', () => {
    const bat = new Batalla(DATOS, [trio(), trio()], new Rng(1));
    bat.ejecutarTurno(hab(2), hab(2)); // Grito de Manada: Ataque +1
    expect(bat.act(0).etapas.atq).toBe(1);
    const ev = bat.ejecutarTurno({ tipo: 'cambio', indice: 2 }, hab(0));
    expect(ev[1]).toMatchObject({ t: 'cambio', lado: 0, indice: 2, forzado: false });
    expect(bat.act(0).especie.id).toBe('brotin');
    expect(bat.equipos[0].miembros[0]!.etapas.atq).toBe(0);
    // El ataque del rival lo recibe la que entró.
    expect(ev.some((e) => e.t === 'dano' && e.lado === 0)).toBe(true);
    expect(bat.equipos[0].miembros[0]!.ps).toBe(bat.equipos[0].miembros[0]!.stats.ps);
    expect(bat.act(0).ps).toBeLessThan(bat.act(0).stats.ps);
  });
  it('al caer la activa hay que reemplazarla antes de seguir; el combate termina al caer la última', () => {
    const bat = new Batalla(DATOS, [trio(), trio()], new Rng(2));
    bat.act(1).ps = 1;
    const ev = bat.ejecutarTurno(hab(0), hab(0));
    expect(tipos(ev)).toContain('debilitado');
    expect(bat.terminado).toBe(false);
    expect(bat.pendientes).toEqual([1]);
    expect(() => bat.ejecutarTurno(hab(0), hab(0))).toThrow();
    expect(bat.reemplazar(1, 0)).toEqual([]); // la caída no puede volver
    expect(bat.reemplazar(1, 1)[0]).toMatchObject({ t: 'cambio', lado: 1, forzado: true });
    expect(bat.pendientes).toEqual([]);
    for (const m of bat.equipos[1].miembros) m.ps = Math.min(m.ps, 1);
    bat.equipos[1].miembros[2]!.ps = 0;
    bat.ejecutarTurno(hab(0), hab(1));
    if (!bat.terminado) bat.ejecutarTurno(hab(0), hab(0));
    expect(bat.terminado).toBe(true);
    expect(bat.ganador).toBe(0);
  });
  it('quien cae antes de actuar no actúa', () => {
    const bat = new Batalla(DATOS, [trio(), trio()], new Rng(3));
    bat.act(1).ps = 1; // Lumbrito rival: misma velocidad, pero el nuestro usa prioridad normal y pega primero o después
    const ev = bat.ejecutarTurno(hab(0), hab(0));
    const caida = ev.findIndex((e) => e.t === 'debilitado' && e.lado === 1);
    expect(ev.slice(caida).some((e) => e.t === 'usa' && e.lado === 1)).toBe(false);
  });
  it('3 contra 3 con IA siempre termina y deja un ganador', () => {
    const rng = new Rng(11);
    for (const ia of NIVELES_IA)
      for (let i = 0; i < 150; i++) {
        const bat = new Batalla(DATOS, [trio(15), trio(15)], new Rng(500 + i));
        let guardia = 0;
        while (!bat.terminado && guardia++ < 400) {
          bat.ejecutarTurno(elegirAccion(bat, 0, ia, rng), elegirAccion(bat, 1, ia, rng));
          for (const l of [...bat.pendientes]) bat.reemplazar(l, elegirReemplazo(bat, l, ia, rng));
        }
        expect(bat.terminado).toBe(true);
        expect(bat.ganador).not.toBeNull();
      }
  });
  it('el rival generado es parejo: mismo tamaño, nivel cercano y sin etapas superiores', () => {
    const rng = new Rng(4);
    const mio = [nuevaCriatura('lumbrito', 20, 'comun', false), nuevaCriatura('aletin', 22, 'comun', false)];
    for (let i = 0; i < 50; i++) {
      const rival = generarRival(DATOS, mio, rng);
      expect(rival).toHaveLength(2);
      for (const r of rival) {
        expect(Math.abs(r.nivel - 21)).toBeLessThanOrEqual(1);
        expect(r.especie.etapa).toBe(1);
      }
    }
  });
  it('el potencial por rareza sube los stats', () => {
    const comun = crearCombatiente(DATOS, 'aletin', 30);
    const epica = crearCombatiente(DATOS, 'aletin', 30, { potencial: 12 });
    expect(epica.stats.ps).toBe(Math.floor(comun.stats.ps * 1.12));
    expect(epica.stats.ate).toBeGreaterThan(comun.stats.ate);
  });
});

describe('sobres', () => {
  it('las rarezas salen con la frecuencia publicada', () => {
    const rng = new Rng(77);
    const cuenta: Record<string, number> = { comun: 0, poco_comun: 0, rara: 0, epica: 0 };
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const e = estadoNuevo(DATOS, 0);
      e.monedas = 1000;
      for (const c of abrirSobre(DATOS, e, 'raro', rng, 0) as { rareza: string }[]) cuenta[c.rareza]!++;
    }
    const prob = DATOS.sobres.sobres.find((s) => s.id === 'raro')!.prob;
    for (const r of Object.keys(cuenta)) expect((cuenta[r]! / (N * 3)) * 100).toBeCloseTo(prob[r as keyof typeof prob], 0);
  });
  it('pity: tras 10 sobres sin Rara, el siguiente la garantiza', () => {
    const e = estadoNuevo(DATOS, 0);
    e.monedas = 100000;
    e.pity.rara = DATOS.sobres.pity.rara;
    for (let s = 0; s < 200; s++) {
      e.pity.rara = DATOS.sobres.pity.rara;
      e.pity.epica = 0;
      const cartas = abrirSobre(DATOS, e, 'basico', new Rng(s), 0);
      expect(Array.isArray(cartas) && ['rara', 'epica'].includes(cartas[0]!.rareza)).toBe(true);
      expect(e.pity.rara).toBe(0);
    }
    e.pity.epica = DATOS.sobres.pity.epica;
    const cartas = abrirSobre(DATOS, e, 'basico', new Rng(1), 0);
    expect(Array.isArray(cartas) && cartas[0]!.rareza).toBe('epica');
  });
  it('el contador de pity sube cuando no sale nada bueno', () => {
    const e = estadoNuevo(DATOS, 0);
    e.monedas = 100000;
    let s = 0;
    for (; s < 500; s++) {
      const antes = e.pity.rara;
      const cartas = abrirSobre(DATOS, e, 'basico', new Rng(s), 0) as { rareza: string }[];
      if (cartas.every((c) => c.rareza === 'comun' || c.rareza === 'poco_comun')) {
        expect(e.pity.rara).toBe(antes + 1);
        break;
      }
    }
    expect(s).toBeLessThan(500);
  });
  it('cobra monedas, y sin monedas no abre', () => {
    const e = estadoNuevo(DATOS, 0);
    e.gratis.acumulados = 0;
    // El precio puede tener el descuento de la semana temática.
    e.monedas = precioSobre(DATOS, DATOS.sobres.sobres.find((x) => x.id === 'brasa')!, 0);
    expect(Array.isArray(abrirSobre(DATOS, e, 'brasa', new Rng(1), 0))).toBe(true);
    expect(e.monedas).toBe(0);
    expect(abrirSobre(DATOS, e, 'basico', new Rng(1), 0)).toBe('monedas');
    expect(e.estadisticas.sobres).toBe(1);
  });
  it('el Sobre Elemental solo da criaturas de su tipo, de etapa 1 o 2 (y también ítems)', () => {
    const e = estadoNuevo(DATOS, 0);
    e.monedas = 100000;
    const etapas = new Set<number>();
    let items = 0;
    for (let s = 0; s < 80; s++)
      for (const c of abrirSobre(DATOS, e, 'marea', new Rng(s), 0) as Carta[]) {
        if (c.clase === 'item') {
          items++;
          expect(DATOS.items.get(c.item)!.rareza).toBeTruthy();
          continue;
        }
        expect(DATOS.criaturas.get(c.especie)!.tipo).toBe('marea');
        etapas.add(DATOS.criaturas.get(c.especie)!.etapa);
      }
    expect([...etapas].sort()).toEqual([1, 2]);
    expect(items).toBeGreaterThan(0);
  });
  it('sobre gratis: 1 al empezar, otro cada 4 horas, máximo 2 acumulados', () => {
    const e = estadoNuevo(DATOS, 0);
    expect(sobresGratis(DATOS, e, 0).disponibles).toBe(1);
    expect(costoDe(DATOS, e, 'basico', 0)).toMatchObject({ gratis: true, costo: 0, puede: true });
    const monedas = e.monedas;
    abrirSobre(DATOS, e, 'basico', new Rng(1), 0);
    expect(e.monedas).toBe(monedas);
    expect(sobresGratis(DATOS, e, HORA).disponibles).toBe(0);
    expect(sobresGratis(DATOS, e, HORA).faltaMs).toBe(3 * HORA);
    expect(sobresGratis(DATOS, e, 4 * HORA).disponibles).toBe(1);
    expect(sobresGratis(DATOS, e, 100 * HORA).disponibles).toBe(2);
    abrirSobre(DATOS, e, 'basico', new Rng(2), 100 * HORA);
    expect(sobresGratis(DATOS, e, 100 * HORA).disponibles).toBe(1);
    expect(sobresGratis(DATOS, e, 103 * HORA).disponibles).toBe(1);
    expect(sobresGratis(DATOS, e, 104 * HORA).disponibles).toBe(2);
  });
  it('bienvenida: una de cada familia, todas nuevas y al equipo', () => {
    const e = estadoNuevo(DATOS, 0);
    const cartas = sobreBienvenida(DATOS, e, new Rng(5));
    expect(cartas.map((c) => c.especie).sort()).toEqual(['aletin', 'brotin', 'lumbrito']);
    expect(cartas.every((c) => c.resultado === 'nueva')).toBe(true);
    expect(e.equipo).toHaveLength(3);
    expect(e.bienvenida).toBe(true);
    expect(e.vistas).toHaveLength(3);
  });
  it('repetidas: una rareza mejor mejora la tuya; una igual o peor se vuelve Esencia', () => {
    // Solo criaturas de etapa 1 para este caso.
    const def = DATOS.sobres.sobres.find((x) => x.id === 'brasa')!;
    const antes = { probItem: def.probItem, probEtapa2: def.probEtapa2 };
    Object.assign(def, { probItem: 0, probEtapa2: 0 });
    const e = estadoNuevo(DATOS, 0);
    sobreBienvenida(DATOS, e, new Rng(5));
    e.monedas = 100000;
    const mia = criaturaDe(e, 'lumbrito')!;
    mia.rareza = 'comun';
    mia.nivel = 9;
    let vistoMejora = false;
    let vistoRepetida = false;
    for (let s = 0; s < 300 && !(vistoMejora && vistoRepetida); s++) {
      const esenciaAntes = e.esencia;
      const rarezaAntes = mia.rareza;
      const cartas = abrirSobre(DATOS, e, 'brasa', new Rng(s), 0) as { resultado: string; esencia: number }[];
      expect(e.esencia - esenciaAntes).toBe(cartas.reduce((x, c) => x + c.esencia, 0));
      if (cartas.some((c) => c.resultado === 'mejora')) {
        vistoMejora = true;
        expect(mia.rareza).not.toBe(rarezaAntes);
      }
      if (cartas.some((c) => c.resultado === 'repetida')) vistoRepetida = true;
      expect(cartas.some((c) => c.resultado === 'nueva')).toBe(false);
    }
    expect(vistoMejora && vistoRepetida).toBe(true);
    expect(mia.nivel).toBe(9);
    expect(e.criaturas.filter((c) => c.especie === 'aletin')).toHaveLength(1);
    Object.assign(def, antes);
  });
});

describe('experiencia y recompensas', () => {
  it('curva de experiencia y subida de varios niveles de una vez', () => {
    expect(xpParaSubir(DATOS, 5)).toBe(42);
    const c = nuevaCriatura('lumbrito', 5, 'comun', false);
    expect(darXp(DATOS, c, 41)).toBe(0);
    expect(darXp(DATOS, c, 1)).toBe(1);
    expect(c).toMatchObject({ nivel: 6, xp: 0 });
    expect(darXp(DATOS, c, 1000)).toBeGreaterThan(3);
    c.nivel = DATOS.balance.nivelMax;
    expect(darXp(DATOS, c, 99999)).toBe(0);
  });
  it('victoria: monedas por dificultad y XP repartida entre quienes participaron', () => {
    const e = estadoNuevo(DATOS, 0);
    sobreBienvenida(DATOS, e, new Rng(5));
    const bat = new Batalla(DATOS, [trio(5), trio(5)], new Rng(1));
    for (const m of bat.equipos[1].miembros) m.ps = 0;
    bat.terminado = true;
    bat.ganador = 0;
    const monedas = e.monedas;
    const r = aplicarRecompensa(DATOS, e, bat, 'experta');
    expect(r.victoria).toBe(true);
    expect(e.monedas).toBe(monedas + DATOS.economia.recompensas.experta);
    expect(r.xpPorCriatura).toBe(3 * (12 + 5 * 5)); // solo participó la primera
    expect(criaturaDe(e, 'lumbrito')!.nivel).toBeGreaterThan(5);
    expect(criaturaDe(e, 'aletin')!.nivel).toBe(5);
    expect(e.estadisticas).toMatchObject({ combates: 1, victorias: 1 });
  });
  it('derrota: compensación pequeña; retirada: nada', () => {
    const e = estadoNuevo(DATOS, 0);
    sobreBienvenida(DATOS, e, new Rng(5));
    const bat = new Batalla(DATOS, [trio(5), trio(5)], new Rng(1));
    bat.terminado = true;
    bat.ganador = 1;
    const monedas = e.monedas;
    expect(aplicarRecompensa(DATOS, e, bat, 'novata').monedas).toBe(DATOS.economia.recompensas.derrota);
    expect(aplicarRecompensa(DATOS, e, bat, 'novata', true)).toMatchObject({ monedas: 0, xpPorCriatura: 0 });
    expect(e.monedas).toBe(monedas + DATOS.economia.recompensas.derrota);
  });
});

describe('guardado', () => {
  it('guardar y cargar devuelve la misma partida', () => {
    const e = estadoNuevo(DATOS, 123);
    sobreBienvenida(DATOS, e, new Rng(9));
    ponerAlFrente(DATOS, e, 'brotin');
    expect(e.equipo[0]).toBe('brotin');
    expect(deserializar(serializar(e))).toEqual(e);
    const codigo = exportarCodigo(e);
    expect(codigo.startsWith('PIX1-')).toBe(true);
    expect(importarCodigo(`  ${codigo}\n`)).toEqual(e);
  });
  it('un guardado dañado o ajeno se rechaza sin romper nada', () => {
    expect(deserializar(null)).toBeNull();
    expect(deserializar('{no es json')).toBeNull();
    expect(deserializar('{"version":1,"monedas":-5}')).toBeNull();
    expect(importarCodigo('hola')).toBeNull();
    expect(importarCodigo('PIX1-@@@')).toBeNull();
  });
});
