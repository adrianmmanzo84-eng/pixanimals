import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { abrirHuevo, cobrarMina, criaDe, equipoGuarida, huevosListos, Mina, vencerGuarida, zonaMaxima, type Bloque } from '../src/core/minijuegos/mina';
import type { Datos } from '../src/core/datos';

const M = DATOS.economia.mina;

/** Mina con las filas de abajo de la criatura ya puestas a mano. */
function minaCon(filas: Bloque[][], zona = 1, datos: Datos = DATOS): Mina {
  const m = new Mina(datos, zona, 123);
  filas.forEach((f, i) => f.forEach((b, x) => m.poner(x, m.filaInicial + 1 + i, b)));
  return m;
}
const fila = (b: Bloque, excepto: Record<number, Bloque> = {}): Bloque[] => Array.from({ length: M.columnas }, (_, x) => excepto[x] ?? b);

describe('Mina Pixel: generación', () => {
  it('la misma semilla da la misma mina; otra semilla, otra', () => {
    const a = new Mina(DATOS, 1, 7);
    const b = new Mina(DATOS, 1, 7);
    const c = new Mina(DATOS, 1, 8);
    const filas = (m: Mina) => Array.from({ length: 40 }, (_, y) => Array.from({ length: M.columnas }, (_, x) => m.celda(x, y + 1).b).join(','));
    expect(filas(a)).toEqual(filas(b));
    expect(filas(a)).not.toEqual(filas(c));
  });

  it('empieza en aire, las primeras filas no dañan y al fondo de la zona está la guarida', () => {
    const m = new Mina(DATOS, 1, 42);
    expect(m.celda(m.x, m.y).b).toBe('aire');
    for (let y = 1; y <= 2; y++) for (let x = 0; x < M.columnas; x++) expect(['pinchos', 'gas', 'lava', 'bomba', 'roca', 'irrompible']).not.toContain(m.celda(x, y).b);
    expect(m.celda(3, M.profundidadZona).b).toBe('guarida');
    expect(m.celda(-1, 5).b).toBe('irrompible');
  });

  it('nunca genera una fila entera imposible de cruzar', () => {
    for (let s = 0; s < 30; s++) {
      const m = new Mina(DATOS, 5, s);
      for (let y = m.filaInicial + 1; y < m.filaGuarida(5); y++) {
        const f = Array.from({ length: M.columnas }, (_, x) => m.celda(x, y).b);
        expect(f.some((b) => b !== 'irrompible' && b !== 'lava')).toBe(true);
      }
    }
  });

  it('el ascensor arranca más abajo en zonas profundas', () => {
    const m = new Mina(DATOS, 3, 1);
    expect(m.y).toBe(2 * M.profundidadZona);
    expect(m.zonaDe(m.y + 1)).toBe(3);
  });
});

describe('Mina Pixel: cavar', () => {
  it('cada golpe cuesta energía; la piedra necesita dos y la tierra uno; al romper debajo, cae', () => {
    const m = minaCon([fila('piedra'), fila('tierra'), fila('tierra')]);
    const e0 = m.energia;
    expect(m.accion('abajo').map((e) => e.t)).toEqual(['golpe']);
    const ev = m.accion('abajo');
    expect(ev.map((e) => e.t)).toEqual(['romper', 'caer']);
    expect(m.profundidad).toBe(1);
    expect(m.energia).toBe(e0 - 2);
  });

  it('caminar por aire es gratis; los bordes y lo irrompible frenan', () => {
    const m = minaCon([fila('irrompible')]);
    const e0 = m.energia;
    m.accion('izq');
    expect(m.energia).toBe(e0);
    expect(m.accion('abajo')).toEqual([]);
    for (let i = 0; i < 20; i++) m.accion('izq');
    expect(m.x).toBe(0);
  });

  it('botín: monedas, experiencia, energía, vida e ítems', () => {
    const m = minaCon([fila('tierra', { 7: 'moneda' }), fila('tierra', { 7: 'gema' }), fila('tierra', { 7: 'baya' }), fila('tierra', { 7: 'corazon' }), fila('tierra', { 7: 'cofre' }), fila('tierra')]);
    m.vida = 3;
    m.energia = 10;
    for (let i = 0; i < 8; i++) m.accion('abajo');
    expect(m.monedas).toBeGreaterThanOrEqual(M.zonas[0]!.monedas);
    expect(m.xp).toBe(M.zonas[0]!.xp);
    expect(m.vida).toBe(4);
    expect(m.items).toHaveLength(1);
    expect(M.zonas[0]!.cofre.map((c) => c.item)).toContain(m.items[0]);
  });

  it('peligros: pinchos, gas, lava y bombas quitan vida', () => {
    const m = minaCon([fila('tierra', { 7: 'gas' }), fila('tierra', { 7: 'pinchos' }), fila('tierra')]);
    const v0 = m.vida;
    m.accion('abajo'); // gas: −1, y al caer queda parada sobre los pinchos: −1
    expect(m.vida).toBe(v0 - 2);
    m.accion('abajo'); // cavar los pinchos desde arriba no duele
    expect(m.vida).toBe(v0 - 2);
    const l = minaCon([fila('tierra')]);
    l.poner(8, l.y, 'lava');
    l.accion('der');
    expect(l.vida).toBe(M.vida - 2);
    expect(l.celda(8, l.y).b).toBe('piedra');
    const b = minaCon([fila('tierra', { 7: 'bomba' }), fila('piedra')]);
    const ev = b.accion('abajo');
    expect(ev.some((e) => e.t === 'explosion')).toBe(true);
    expect(b.vida).toBe(M.vida - 1);
    expect(b.celda(6, b.filaInicial + 2).b).toBe('aire'); // la explosión despejó 3×3
  });

  it('una roca sin apoyo cae y, si te pega, duele', () => {
    const m = minaCon([fila('tierra'), fila('tierra'), fila('tierra')]);
    m.accion('abajo');
    m.accion('abajo'); // dos filas abajo
    m.poner(7, m.y - 1, 'roca');
    const ev = m.gravedad();
    expect(ev.some((e) => e.t === 'dano' && e.causa === 'roca')).toBe(true);
    expect(m.vida).toBe(M.vida - 2);
  });

  it('se termina sin vida, sin energía (si no queda adónde caminar) o al llegar a la guarida', () => {
    const v = minaCon([fila('gas'), fila('gas'), fila('gas'), fila('gas'), fila('gas'), fila('gas')]);
    let fin = null;
    for (let i = 0; i < 10 && !v.terminada; i++) fin = v.accion('abajo').find((e) => e.t === 'fin');
    expect(fin).toEqual({ t: 'fin', causa: 'vida' });
    const e = minaCon([fila('piedra'), fila('piedra')]);
    for (let x = 0; x < M.columnas; x++) if (x !== 7) e.poner(x, e.filaInicial, 'irrompible');
    e.energia = 1;
    expect(e.accion('abajo').at(-1)).toEqual({ t: 'fin', causa: 'energia' });
    const g = new Mina(DATOS, 1, 5);
    for (let y = g.filaInicial + 1; y < g.filaGuarida(1); y++) g.poner(g.x, y, 'aire');
    g.poner(g.x, g.filaInicial + 1, 'tierra');
    const ev = g.accion('abajo');
    expect(ev.some((x) => x.t === 'guarida')).toBe(true);
    expect(g.causaFin).toBe('guarida');
    expect(g.puntaje()).toBe(1);
  });
});

describe('Mina Pixel: progreso', () => {
  it('cobra el botín solo si la partida es con premio', () => {
    const e = estadoNuevo(DATOS, 0);
    const m = new Mina(DATOS, 1, 1);
    m.monedas = 30;
    m.items = ['pocion'];
    const m0 = e.monedas;
    expect(cobrarMina(DATOS, e, m, false).monedas).toBe(0);
    expect(e.monedas).toBe(m0);
    cobrarMina(DATOS, e, m, true);
    expect(e.monedas).toBe(m0 + 30);
    expect(e.inventario.pocion).toBe(1);
  });

  it('cada guarida tiene la forma final de una familia exclusiva (Brote, Marea, Rayo, Brasa, Sombra)', () => {
    const tipos = M.zonas.map((z) => DATOS.criaturas.get(z.monstruo!)!);
    expect(tipos.map((c) => c.tipo)).toEqual(['brote', 'marea', 'rayo', 'brasa', 'sombra']);
    for (const c of tipos) {
      expect(c.etapa).toBe(4);
      expect(c.origen).toBe('mina');
      expect(c.definitivo).toBeTruthy();
    }
    expect(M.zonas.map((z) => criaDe(DATOS, z.monstruo!))).toEqual(['terin', 'plesin', 'triclin', 'tirin', 'dimlin']);
  });

  it('vencer una guarida abre el ascensor; sin monstruo da monedas', () => {
    const sinMonstruo: Datos = { ...DATOS, economia: { ...DATOS.economia, mina: { ...M, zonas: M.zonas.map((z) => ({ ...z, monstruo: null })) } } };
    const e = estadoNuevo(sinMonstruo, 0);
    expect(zonaMaxima(sinMonstruo, e)).toBe(1);
    const r = vencerGuarida(sinMonstruo, e, 1, 0);
    expect(r.huevo).toBeNull();
    expect(r.monedas).toBe(M.premioGuarida);
    expect(zonaMaxima(sinMonstruo, e)).toBe(2);
    vencerGuarida(sinMonstruo, e, 5, 0);
    expect(zonaMaxima(sinMonstruo, e)).toBe(5);
  });

  it('la primera victoria da un huevo con la cría, que eclosiona a las horas; después, monedas', () => {
    const e = estadoNuevo(DATOS, 0);
    const r = vencerGuarida(DATOS, e, 4, 1000);
    expect(r.huevo).toBe('tirin');
    expect(huevosListos(e, 1000)).toHaveLength(0);
    expect(huevosListos(e, 1000 + M.eclosionHoras * 3_600_000)).toHaveLength(1);
    const otra = vencerGuarida(DATOS, e, 4, 2000); // un huevo por familia
    expect(otra.huevo).toBeNull();
    expect(otra.monedas).toBe(M.premioGuarida * 4);
    expect(abrirHuevo(e, 1000)).toBeNull();
    expect(abrirHuevo(e, 1000 + M.eclosionHoras * 3_600_000)).toBe('tirin');
    expect(e.mina.huevos).toHaveLength(0);
  });

  it('la guarida: el monstruo sale primero, más fuerte, con su familia detrás', () => {
    const sinMonstruo: Datos = { ...DATOS, economia: { ...DATOS.economia, mina: { ...M, zonas: M.zonas.map((z) => ({ ...z, monstruo: null })) } } };
    expect(equipoGuarida(sinMonstruo, 2, 3)).toEqual([]);
    const eq = equipoGuarida(DATOS, 2, 3);
    expect(eq.map((c) => c.especie.id)).toEqual(['nereidon', 'plesiomar', 'ondaples']);
    expect(eq[0]!.nivel).toBe(M.zonas[1]!.nivel + 2);
    expect(equipoGuarida(DATOS, 2, 1)).toHaveLength(1);
  });

  it('las familias exclusivas no aparecen como rivales, en la Torre ni en el Desafío', async () => {
    const { generarRival } = await import('../src/core/combate/rival');
    const { Rng } = await import('../src/core/rng');
    const { nuevaCriatura } = await import('../src/core/estado/juego');
    const equipo = ['lumbrito', 'aletin', 'brotin'].map((id) => nuevaCriatura(id, 30, 'comun', false));
    for (let s = 0; s < 300; s++) for (const c of generarRival(DATOS, equipo, new Rng(s))) expect(c.especie.origen).toBeUndefined();
  });

  it('las familias exclusivas de la mina nunca salen en sobres', async () => {
    const { abrirSobre } = await import('../src/core/sobres/sobres');
    const { Rng } = await import('../src/core/rng');
    const lumbrito = DATOS.criaturas.get('lumbrito')!;
    (lumbrito as { origen?: string }).origen = 'mina';
    try {
      const e = estadoNuevo(DATOS, 0);
      e.monedas = 1e6;
      for (let i = 0; i < 200; i++) {
        const cartas = abrirSobre(DATOS, e, 'brasa', new Rng(i), 0);
        if (Array.isArray(cartas)) for (const c of cartas) if (c.clase === 'criatura') expect(c.especie).not.toBe('lumbrito');
      }
    } finally {
      delete (lumbrito as { origen?: string }).origen;
    }
  });
});
