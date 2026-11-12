import { describe, expect, it } from 'vitest';
import { cargarDatos, DATOS } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { calcularDano, calcularStats, efectividad, multEtapa } from '../src/core/combate/formulas';
import { Batalla, crearCombatiente, type Accion, type Evento } from '../src/core/combate/motor';
import { elegirAccion, NIVELES_IA } from '../src/core/combate/ia';

const b = DATOS.balance;
const hab = (i: number): Accion => ({ tipo: 'habilidad', indice: i });
const nueva = (a: string, c: string, nivel = 15, semilla = 1, setPrueba = false) =>
  new Batalla(DATOS, [crearCombatiente(DATOS, a, nivel, { setPrueba }), crearCombatiente(DATOS, c, nivel, { setPrueba })], new Rng(semilla));
const tipos = (ev: Evento[]) => ev.map((e) => e.t);

describe('datos', () => {
  it('los JSON son válidos y sus referencias existen', () => {
    expect(cargarDatos().errores).toEqual([]);
  });
  it('cada criatura tiene 4 habilidades y exactamente un movimiento final', () => {
    for (const c of DATOS.criaturas.values()) {
      expect(c.habilidades).toHaveLength(4);
      expect(c.habilidades.filter((id) => DATOS.habilidades.get(id)!.rol === 'final')).toHaveLength(1);
    }
  });
});

describe('fórmulas', () => {
  it('stats por nivel', () => {
    const s = calcularStats(DATOS.criaturas.get('brotin')!, 30, b);
    expect(s.ps).toBe(b.stats.psBase + Math.floor((60 * 30) / b.stats.psDivisor));
    expect(s.def).toBe(b.stats.statBase + Math.floor((52 * 30) / b.stats.statDivisor));
  });
  it('tabla de tipos: Brasa > Brote > Marea > Brasa', () => {
    expect(efectividad('brasa', 'brote', DATOS.tipos)).toBe('ventaja');
    expect(efectividad('brote', 'marea', DATOS.tipos)).toBe('ventaja');
    expect(efectividad('marea', 'brasa', DATOS.tipos)).toBe('ventaja');
    expect(efectividad('brote', 'brasa', DATOS.tipos)).toBe('desventaja');
    expect(efectividad('brasa', 'brasa', DATOS.tipos)).toBe('neutro');
    expect(efectividad('neutro', 'marea', DATOS.tipos)).toBe('neutro');
  });
  it('niveles de stat: +1 = ×1,5 y −1 = ÷1,5', () => {
    expect(multEtapa(1, b)).toBeCloseTo(1 + b.etapas.paso);
    expect(multEtapa(-1, b)).toBeCloseTo(1 / (1 + b.etapas.paso));
    expect(multEtapa(0, b)).toBe(1);
  });
  it('daño: aplica mismo tipo, ventaja, crítico y mínimo 1', () => {
    const st = { ps: 100, atq: 50, def: 50, ate: 50, dfe: 50, vel: 50 };
    const cero = { atq: 0, def: 0, ate: 0, dfe: 0, vel: 0 };
    const base = {
      potencia: 50, categoria: 'fisica' as const, tipoHabilidad: 'neutro', nivel: 20, tipoAtacante: 'brasa', tipoDefensor: 'brote',
      statsAtacante: st, statsDefensor: st, etapasAtacante: cero, etapasDefensor: cero, azar: 1, critico: false, otros: 1,
    };
    const factor = b.dano.factorBase + b.dano.factorNivel * 20;
    expect(calcularDano(base, b, DATOS.tipos).dano).toBe(Math.floor(50 * factor));
    const conTipo = calcularDano({ ...base, tipoHabilidad: 'brasa' }, b, DATOS.tipos);
    expect(conTipo.efectividad).toBe('ventaja');
    expect(conTipo.dano).toBe(Math.floor(50 * factor * b.dano.mismoTipo * b.dano.ventaja));
    expect(calcularDano({ ...base, critico: true }, b, DATOS.tipos).dano).toBe(Math.floor(50 * factor * b.dano.criticoMult));
    expect(calcularDano({ ...base, potencia: 1, otros: 0.01 }, b, DATOS.tipos).dano).toBe(1);
  });
  it('un crítico ignora las mejoras de defensa del rival', () => {
    const st = { ps: 100, atq: 50, def: 50, ate: 50, dfe: 50, vel: 50 };
    const cero = { atq: 0, def: 0, ate: 0, dfe: 0, vel: 0 };
    const e = {
      potencia: 50, categoria: 'fisica' as const, tipoHabilidad: 'neutro', nivel: 20, tipoAtacante: 'brasa', tipoDefensor: 'brasa',
      statsAtacante: st, statsDefensor: st, etapasAtacante: cero, etapasDefensor: { ...cero, def: 2 }, azar: 1, otros: 1,
    };
    const normal = calcularDano({ ...e, critico: false }, b, DATOS.tipos).dano;
    const critico = calcularDano({ ...e, critico: true }, b, DATOS.tipos).dano;
    expect(critico / normal).toBeGreaterThan(b.dano.criticoMult * 1.5);
  });
});

describe('motor', () => {
  it('la misma semilla reproduce el mismo combate', () => {
    const correr = () => {
      const bat = nueva('lumbrito', 'brotin', 15, 42);
      const rng = new Rng(7);
      const log: Evento[] = [];
      while (!bat.terminado) log.push(...bat.ejecutarTurno(elegirAccion(bat, 0, 'experta', rng), elegirAccion(bat, 1, 'experta', rng)));
      return JSON.stringify(log);
    };
    expect(correr()).toBe(correr());
  });
  it('actúa primero el más veloz, salvo prioridad', () => {
    const bat = nueva('lumbrito', 'brotin');
    const ev = bat.ejecutarTurno(hab(0), hab(0));
    expect(ev.find((e) => e.t === 'usa')).toMatchObject({ lado: 0 });
    const bat2 = nueva('brotin', 'aletin');
    const ev2 = bat2.ejecutarTurno(hab(0), hab(1)); // Escudo de Burbujas tiene prioridad
    expect(ev2.find((e) => e.t === 'usa')).toMatchObject({ lado: 1 });
    expect(tipos(ev2)).toContain('bloqueado');
    expect(bat2.lados[1].ps).toBe(bat2.lados[1].stats.ps);
  });
  it('gasta usos y respeta turno mínimo y enfriamiento del movimiento final', () => {
    const bat = nueva('aletin', 'brotin', 30);
    expect(bat.bloqueo(0, 3)).toBe('turno');
    bat.ejecutarTurno(hab(0), hab(1));
    bat.ejecutarTurno(hab(0), hab(1));
    expect(bat.lados[0].habilidades[0]!.usos).toBe(18);
    expect(bat.bloqueo(0, 3)).toBeNull();
    bat.ejecutarTurno(hab(3), hab(1));
    for (let i = 0; i < 4; i++) {
      expect(bat.bloqueo(0, 3)).toBe('enfriamiento');
      bat.ejecutarTurno(hab(2), hab(1));
    }
    expect(bat.bloqueo(0, 3)).toBeNull();
  });
  it('no se puede repetir seguido una habilidad marcada noRepetir', () => {
    const bat = nueva('aletin', 'aletin');
    bat.ejecutarTurno(hab(1), hab(2));
    expect(bat.bloqueo(0, 1)).toBe('repetir');
    bat.ejecutarTurno(hab(2), hab(2));
    expect(bat.bloqueo(0, 1)).toBeNull();
  });
  it('los niveles de stat tienen tope', () => {
    const bat = nueva('brotin', 'brotin');
    let ev: Evento[] = [];
    for (let i = 0; i < b.etapas.max + 1; i++) ev = bat.ejecutarTurno(hab(1), hab(1));
    expect(bat.lados[0].etapas.def).toBe(b.etapas.max);
    expect(tipos(ev)).toContain('etapa_tope');
  });
  it('Empujón cuando no queda ninguna habilidad', () => {
    const bat = nueva('lumbrito', 'lumbrito');
    for (const h of bat.lados[0].habilidades) h.usos = 0;
    expect(bat.accionesValidas(0)).toEqual([{ tipo: 'empujon' }]);
    const ev = bat.ejecutarTurno({ tipo: 'empujon' }, hab(2));
    expect(ev.some((e) => e.t === 'usa' && e.lado === 0 && e.habilidad === null)).toBe(true);
  });
});

describe('estados', () => {
  /** Busca una semilla en la que la habilidad de estado acierte en el primer turno. */
  const conEstado = (atacante: string, indice: number, defensor: string) => {
    for (let s = 1; s < 200; s++) {
      const bat = nueva(atacante, defensor, 15, s, true);
      const ev = bat.ejecutarTurno(hab(indice), hab(0));
      if (ev.some((e) => e.t === 'estado_aplicado' && e.lado === 1)) return bat;
    }
    throw new Error('ninguna semilla aplicó el estado');
  };
  it('veneno: daña 1/10 por turno y dura lo indicado', () => {
    const bat = conEstado('brotin', 1, 'aletin');
    expect(bat.lados[1].estado?.id).toBe('veneno');
    let danos = 1; // el turno de aplicación ya hizo daño
    while (bat.lados[1].estado && !bat.terminado) {
      const ev = bat.ejecutarTurno(hab(1), hab(2));
      danos += ev.filter((e) => e.t === 'estado_dano' && e.lado === 1).length;
      for (const e of ev) if (e.t === 'estado_dano') expect(e.cantidad).toBe(Math.floor(bat.lados[1].stats.ps / b.estados.veneno.danoDivisor));
    }
    expect(danos).toBe(b.estados.veneno.turnos);
  });
  it('quemadura: Brasa es inmune y los demás pierden ataque físico', () => {
    const bat = nueva('lumbrito', 'lumbrito', 15, 3, true);
    const ev = bat.ejecutarTurno(hab(2), hab(1));
    expect(tipos(ev)).not.toContain('estado_aplicado');
    const bat2 = conEstado('lumbrito', 2, 'brotin');
    expect(bat2.lados[1].estado?.id).toBe('quemadura');
    const quemado = bat2.danoEsperado(1, DATOS.habilidades.get('zarpazo_de_raiz')!);
    bat2.lados[1].estado = null;
    expect(quemado).toBeLessThan(bat2.danoEsperado(1, DATOS.habilidades.get('zarpazo_de_raiz')!));
  });
  it('parálisis: reduce la velocidad a la mitad', () => {
    const bat = conEstado('brotin', 2, 'lumbrito');
    expect(bat.lados[1].estado?.id).toBe('paralisis');
    const lenta = bat.velocidad(1);
    bat.lados[1].estado = null;
    expect(lenta).toBeCloseTo(bat.velocidad(1) * b.estados.paralisis.multVelocidad);
  });
  it('sueño: impide actuar entre 1 y 3 turnos y luego despierta', () => {
    const bat = conEstado('aletin', 2, 'brotin');
    expect(bat.lados[1].estado?.id).toBe('sueno');
    let dormidos = 0;
    for (let i = 0; i < 5 && bat.lados[1].estado?.id === 'sueno'; i++) {
      const ev = bat.ejecutarTurno(hab(1), hab(0));
      if (ev.some((e) => e.t === 'estado_impide' && e.estado === 'sueno')) dormidos++;
    }
    expect(dormidos).toBeGreaterThanOrEqual(b.estados.sueno.turnosMin);
    expect(dormidos).toBeLessThanOrEqual(b.estados.sueno.turnosMax);
    expect(bat.lados[1].estado).toBeNull();
  });
  it('solo un estado a la vez', () => {
    const bat = conEstado('brotin', 1, 'aletin');
    const ev = bat.ejecutarTurno(hab(2), hab(2));
    expect(bat.lados[1].estado?.id).toBe('veneno');
    expect(ev.some((e) => e.t === 'estado_aplicado' && e.lado === 1)).toBe(false);
  });
});

describe('pasivas y reglas de cierre', () => {
  it('Raíces cura al final del turno', () => {
    const bat = nueva('brotin', 'aletin');
    bat.lados[0].ps = 10;
    const ev = bat.ejecutarTurno(hab(1), hab(2));
    expect(ev.some((e) => e.t === 'cura' && e.origen === 'pasiva' && e.lado === 0)).toBe(true);
  });
  it('Último Rescoldo sube el daño con poca vida', () => {
    const bat = nueva('lumbrito', 'aletin');
    const h = DATOS.habilidades.get('zarpazo_ardiente')!;
    const normal = bat.danoEsperado(0, h);
    bat.lados[0].ps = 1;
    expect(bat.danoEsperado(0, h)).toBeGreaterThan(normal * 1.2);
  });
  it('Oleaje se carga con una habilidad de soporte y se gasta al atacar', () => {
    const bat = nueva('aletin', 'aletin');
    bat.ejecutarTurno(hab(2), hab(2));
    expect(bat.lados[0].oleaje).toBe(true);
    bat.ejecutarTurno(hab(0), hab(2));
    expect(bat.lados[0].oleaje).toBe(false);
  });
  it('todo combate termina: el cansancio impide los bloqueos eternos', () => {
    const rng = new Rng(99);
    for (const ia of NIVELES_IA)
      for (let i = 0; i < 200; i++) {
        const bat = nueva('brotin', 'brotin', 30, 1000 + i);
        while (!bat.terminado) bat.ejecutarTurno(elegirAccion(bat, 0, ia, rng), elegirAccion(bat, 1, ia, rng));
        expect(bat.turno).toBeLessThan(b.cansancio.desdeTurno + b.cansancio.danoDivisor + 2);
        expect(bat.ganador).not.toBeNull();
      }
  });
  it('la IA siempre devuelve una acción válida', () => {
    const rng = new Rng(5);
    for (const ia of NIVELES_IA)
      for (const a of DATOS.criaturas.keys()) {
        const bat = nueva(a, 'aletin', 5, 77, true);
        while (!bat.terminado) {
          const x = elegirAccion(bat, 0, ia, rng);
          if (x.tipo === 'habilidad') expect(bat.bloqueo(0, x.indice)).toBeNull();
          bat.ejecutarTurno(x, elegirAccion(bat, 1, ia, rng));
        }
      }
  });
});
