import { describe, expect, it } from 'vitest';
import { DATOS, type Datos } from '../src/core/datos';
import { Rng } from '../src/core/rng';
import { Batalla, crearCombatiente, type Accion } from '../src/core/combate/motor';
import { combatienteDe, criaturaDe, estadoNuevo, nuevaCriatura } from '../src/core/estado/juego';
import { deserializar } from '../src/core/estado/guardado';
import { abrirSobre, probConIncienso } from '../src/core/sobres/sobres';
import { agregar, cantidad, catalogo, comprar, diaLocal, ofertasDelDia, precioDe, usarItem } from '../src/core/items/items';
import { costoLlenar, evolucionar, infundirEsencia, opcionesEvolucion, puedeEvolucionar } from '../src/core/progresion/evolucion';
import { aplicarRecompensa } from '../src/core/progresion/experiencia';
import { cobrarPremio, repartirPremios } from '../src/core/progresion/premio';

const MIN = 60_000;
const hab = (i: number): Accion => ({ tipo: 'habilidad', indice: i });
const item = (id: string): Accion => ({ tipo: 'item', item: DATOS.items.get(id)! });
const conLumbrito = (nivel = 5) => {
  const e = estadoNuevo(DATOS, 0);
  e.bienvenida = true;
  e.criaturas.push(nuevaCriatura('lumbrito', nivel, 'comun', false));
  e.equipo.push('lumbrito');
  return e;
};

/** Copia de los datos con una rama de prueba: Leobrasa → «eclipsion» con la Piedra Eclipse. */
function datosConRama(): Datos {
  const criaturas = new Map(DATOS.criaturas);
  const leobrasa = criaturas.get('leobrasa')!;
  const ignileon = criaturas.get(leobrasa.evoluciona[0]!.a)!;
  criaturas.set('eclipsion', { ...ignileon, id: 'eclipsion', nombre: 'Eclipsión', evoluciona: [] });
  criaturas.set('leobrasa', { ...leobrasa, evoluciona: [...leobrasa.evoluciona, { a: 'eclipsion', nivel: 28, item: 'piedra_eclipse' }] });
  return { ...DATOS, criaturas };
}

describe('partidas guardadas', () => {
  it('una partida de la versión 1 se migra sin perder nada', () => {
    const v1 = {
      version: 1, monedas: 77, esencia: 12, equipo: ['lumbrito'], vistas: ['lumbrito'], bienvenida: true,
      criaturas: [{ especie: 'lumbrito', nivel: 9, xp: 3, rareza: 'rara', brillante: true }],
      pity: { rara: 2, epica: 5 }, gratis: { acumulados: 1, desde: 0 }, estadisticas: { combates: 4, victorias: 3, sobres: 2 },
    };
    const e = deserializar(JSON.stringify(v1))!;
    expect(e.version).toBe(3);
    expect(e.monedas).toBe(77);
    expect(e.inventario).toEqual({});
    expect(e.criaturas[0]).toMatchObject({ nivel: 9, rareza: 'rara', brillante: true, vitaminas: {}, entrenamiento: 0 });
  });
});

describe('tienda', () => {
  it('compra con monedas o Esencia y rechaza si no alcanza', () => {
    const e = conLumbrito();
    e.monedas = 50;
    expect(comprar(DATOS, e, 'caramelo_s', 0)).toBe(true);
    expect(cantidad(e, 'caramelo_s')).toBe(1);
    expect(e.monedas).toBeLessThan(50);
    expect(comprar(DATOS, e, 'caramelo_l', 0)).toBe('monedas');
    expect(comprar(DATOS, e, 'vit_atq', 0)).toBe('esencia');
    e.esencia = 100;
    expect(comprar(DATOS, e, 'vit_atq', 0)).toBe(true);
  });
  it('las piedras solo se venden si alguna criatura las usa', () => {
    expect(catalogo(DATOS).some((i) => i.id === 'piedra_eclipse')).toBe(true);
    const sinRamas = new Map([...DATOS.criaturas].map(([id, c]) => [id, { ...c, evoluciona: c.evoluciona.filter((e) => !e.item) }]));
    const d = { ...DATOS, criaturas: sinRamas };
    expect(catalogo(d).some((i) => i.id === 'piedra_eclipse')).toBe(false);
    expect(comprar(d, conLumbrito(), 'piedra_eclipse', 0)).toBe('no_se_vende');
  });
  it('ofertas del día: fijas durante el día, distintas otro día, con descuento', () => {
    const hoy = ofertasDelDia(DATOS, 100);
    expect(hoy).toHaveLength(DATOS.reglasItems.ofertas.cantidad);
    expect(new Set(hoy).size).toBe(hoy.length);
    expect(ofertasDelDia(DATOS, 100)).toEqual(hoy);
    const dias = new Set(Array.from({ length: 10 }, (_, d) => ofertasDelDia(DATOS, d).join()));
    expect(dias.size).toBeGreaterThan(5);
    const p = precioDe(DATOS, DATOS.items.get(hoy[0]!)!, 100)!;
    expect(p.oferta).toBe(true);
    expect(p.valor).toBeLessThan(p.normal);
  });
  it('el día cambia a medianoche local', () => {
    const offset = 180; // UTC−3
    const medianoche = Date.UTC(2026, 10, 12, 3, 0);
    expect(diaLocal(medianoche - 1, offset)).toBe(diaLocal(medianoche, offset) - 1);
  });
});

describe('ítems fuera del combate', () => {
  it('los caramelos dan experiencia y se gastan', () => {
    const e = conLumbrito(5);
    agregar(e, 'caramelo_m');
    const r = usarItem(DATOS, e, 'caramelo_m', 0, 'lumbrito');
    expect(r).toMatchObject({ ok: true, tipo: 'xp' });
    expect(criaturaDe(e, 'lumbrito')!.nivel).toBeGreaterThan(5);
    expect(cantidad(e, 'caramelo_m')).toBe(0);
    expect(usarItem(DATOS, e, 'caramelo_m', 0, 'lumbrito')).toMatchObject({ ok: false, motivo: 'sin_items' });
  });
  it('las vitaminas suben el stat para siempre y respetan los límites', () => {
    const e = conLumbrito(20);
    const antes = combatienteDe(DATOS, criaturaDe(e, 'lumbrito')!).stats.atq;
    agregar(e, 'vit_atq', 10);
    for (let i = 0; i < DATOS.reglasItems.vitaminas.maxPorStat; i++) expect(usarItem(DATOS, e, 'vit_atq', 0, 'lumbrito').ok).toBe(true);
    expect(usarItem(DATOS, e, 'vit_atq', 0, 'lumbrito')).toMatchObject({ ok: false, motivo: 'tope_stat' });
    const despues = combatienteDe(DATOS, criaturaDe(e, 'lumbrito')!).stats.atq;
    expect(despues).toBeGreaterThan(antes);
    expect(despues / antes).toBeLessThan(1.2);
    // Tope total entre todos los stats.
    for (const id of ['vit_ps', 'vit_def', 'vit_ate', 'vit_dfe', 'vit_vel']) agregar(e, id, 5);
    let usadas = DATOS.reglasItems.vitaminas.maxPorStat;
    for (const id of ['vit_ps', 'vit_def', 'vit_ate', 'vit_dfe', 'vit_vel'])
      for (let i = 0; i < 5; i++) if (usarItem(DATOS, e, id, 0, 'lumbrito').ok) usadas++;
    expect(usadas).toBe(DATOS.reglasItems.vitaminas.maxTotal);
  });
  it('el incienso dura su tiempo, se acumula y mejora las rarezas sin romper la suma', () => {
    const e = conLumbrito();
    agregar(e, 'incienso', 2);
    usarItem(DATOS, e, 'incienso', 1000);
    expect(e.incienso.hasta).toBe(1000 + 30 * MIN);
    usarItem(DATOS, e, 'incienso', 2000);
    expect(e.incienso.hasta).toBe(1000 + 60 * MIN);
    const basico = DATOS.sobres.sobres[0]!.prob;
    const p = probConIncienso(basico, e, 5000);
    expect(p.rara).toBe(basico.rara * 2);
    expect(p.comun + p.poco_comun + p.rara + p.epica).toBeCloseTo(100);
    expect(probConIncienso(basico, e, e.incienso.hasta)).toEqual(basico);
  });
  it('con incienso salen más cartas altas (estadístico)', () => {
    const contar = (incienso: boolean) => {
      const e = conLumbrito();
      e.monedas = 1e9;
      if (incienso) e.incienso = { hasta: Infinity, mult: 2 };
      const rng = new Rng(9);
      let altas = 0;
      for (let i = 0; i < 1500; i++) {
        const cartas = abrirSobre(DATOS, e, 'basico', rng, 1e12 + i);
        if (Array.isArray(cartas)) altas += cartas.filter((c) => c.rareza === 'rara' || c.rareza === 'epica').length;
      }
      return altas;
    };
    expect(contar(true)).toBeGreaterThan(contar(false) * 1.5);
  });
});

describe('evolución', () => {
  it('pide nivel y barra llena; conserva el progreso y vacía la barra', () => {
    const e = conLumbrito(15);
    const c = criaturaDe(e, 'lumbrito')!;
    c.rareza = 'epica';
    c.vitaminas = { vel: 2 };
    expect(puedeEvolucionar(DATOS, e, c)).toBe(false);
    c.nivel = 16;
    expect(opcionesEvolucion(DATOS, e, c)[0]).toMatchObject({ cumpleNivel: true, cumpleEntrenamiento: false, puede: false });
    e.esencia = 1000;
    expect(costoLlenar(DATOS, c)).toBe(100);
    infundirEsencia(DATOS, e, 'lumbrito');
    expect(e.esencia).toBe(900);
    expect(puedeEvolucionar(DATOS, e, c)).toBe(true);
    expect(evolucionar(DATOS, e, 'lumbrito', 'leobrasa')).toBe(true);
    const leo = criaturaDe(e, 'leobrasa')!;
    expect(leo).toMatchObject({ nivel: 16, rareza: 'epica', vitaminas: { vel: 2 }, entrenamiento: 0 });
    expect(criaturaDe(e, 'lumbrito')).toBeUndefined();
    expect(e.equipo).toEqual(['leobrasa']);
    expect(e.vistas).toContain('leobrasa');
    expect(combatienteDe(DATOS, leo).stats.atq).toBeGreaterThan(crearCombatiente(DATOS, 'lumbrito', 16).stats.atq);
  });
  it('infundir Esencia llena lo que alcanza', () => {
    const e = conLumbrito(16);
    e.esencia = 30;
    expect(infundirEsencia(DATOS, e, 'lumbrito')).toBe(30);
    expect(e.esencia).toBe(0);
    expect(criaturaDe(e, 'lumbrito')!.entrenamiento).toBe(30);
  });
  it('se bloquea si ya tienes un ejemplar de la especie destino', () => {
    const e = conLumbrito(16);
    criaturaDe(e, 'lumbrito')!.entrenamiento = 100;
    e.criaturas.push(nuevaCriatura('leobrasa', 20, 'comun', false));
    expect(opcionesEvolucion(DATOS, e, criaturaDe(e, 'lumbrito')!)[0]!.yaLaTienes).toBe(true);
    expect(evolucionar(DATOS, e, 'lumbrito', 'leobrasa')).toBe(false);
  });
  it('rama con piedra: hace falta la piedra y se gasta', () => {
    const d = datosConRama();
    const e = estadoNuevo(d, 0);
    e.criaturas.push({ ...nuevaCriatura('leobrasa', 30, 'comun', false), entrenamiento: 100 });
    e.equipo = ['leobrasa'];
    const ops = opcionesEvolucion(d, e, criaturaDe(e, 'leobrasa')!);
    expect(ops.map((o) => [o.a, o.puede])).toEqual([[ops[0]!.a, true], ['eclipsion', false]]);
    expect(evolucionar(d, e, 'leobrasa', 'eclipsion')).toBe(false);
    agregar(e, 'piedra_eclipse');
    expect(catalogo(d).some((i) => i.id === 'piedra_eclipse')).toBe(true);
    expect(evolucionar(d, e, 'leobrasa', 'eclipsion')).toBe(true);
    expect(cantidad(e, 'piedra_eclipse')).toBe(0);
  });
  it('ganar suma Entrenamiento a quienes participaron y avisa cuando alguien queda listo', () => {
    const e = conLumbrito(16);
    criaturaDe(e, 'lumbrito')!.entrenamiento = 95;
    const bat = new Batalla(DATOS, [combatienteDe(DATOS, criaturaDe(e, 'lumbrito')!), crearCombatiente(DATOS, 'brotin', 2)], new Rng(1));
    for (let i = 0; i < 30 && !bat.terminado; i++) bat.ejecutarTurno(hab(0), hab(2));
    expect(bat.ganador).toBe(0);
    const r = aplicarRecompensa(DATOS, e, bat, 'novata');
    expect(r.entrenamiento).toBe(DATOS.economia.entrenamiento.porVictoria);
    expect(criaturaDe(e, 'lumbrito')!.entrenamiento).toBe(100);
    expect(r.listas).toEqual(['lumbrito']);
  });
});

describe('ítems en combate', () => {
  const duelo = () => new Batalla(DATOS, [crearCombatiente(DATOS, 'lumbrito', 12), crearCombatiente(DATOS, 'aletin', 12)], new Rng(3));
  it('la poción cura, va antes que los ataques y gasta el turno', () => {
    const bat = duelo();
    bat.act(0).ps = 5;
    expect(bat.bloqueoItem(0, DATOS.items.get('pocion')!)).toBeNull();
    const ev = bat.ejecutarTurno(item('pocion'), hab(0));
    expect(ev[1]).toMatchObject({ t: 'item', lado: 0 });
    expect(ev.find((x) => x.t === 'cura')).toMatchObject({ lado: 0, origen: 'item' });
    expect(ev.filter((x) => x.t === 'usa').map((x) => (x as { lado: number }).lado)).toEqual([1]);
  });
  it('no se puede usar una poción con los PS llenos ni pasar el límite por combate', () => {
    const bat = duelo();
    expect(bat.bloqueoItem(0, DATOS.items.get('pocion')!)).toBe('ps_llenos');
    expect(bat.bloqueoItem(0, DATOS.items.get('caramelo_s')!)).toBe('no_es_de_combate');
    bat.act(0).estado = { id: 'veneno', turnos: 5 };
    bat.ejecutarTurno(item('antidoto'), hab(2));
    expect(bat.act(0).estado).toBeNull();
    bat.act(0).ps = 1;
    bat.ejecutarTurno(item('carta_escudo'), hab(2));
    expect(bat.bloqueoItem(0, DATOS.items.get('pocion')!)).toBe('limite');
  });
  it('el tónico recupera usos sin pasar del máximo', () => {
    const bat = duelo();
    bat.act(0).habilidades[0]!.usos = 1;
    const ev = bat.ejecutarTurno(item('tonico'), hab(2));
    expect(ev.find((x) => x.t === 'usos')).toMatchObject({ cantidad: 5 });
    expect(bat.act(0).habilidades[0]!.usos).toBe(6);
  });
  it('la carta escudo reduce el daño a la mitad ese turno', () => {
    const danos = (conEscudo: boolean) => {
      const bat = new Batalla(DATOS, [crearCombatiente(DATOS, 'brotin', 20), crearCombatiente(DATOS, 'lumbrito', 20)], new Rng(5));
      const ev = bat.ejecutarTurno(conEscudo ? item('carta_escudo') : hab(2), hab(0));
      return (ev.find((x) => x.t === 'dano') as { cantidad: number }).cantidad;
    };
    expect(danos(true)).toBeLessThan(danos(false) * 0.65);
  });
});

describe('carta premio', () => {
  it('reparte las cartas configuradas y respeta los pesos (estadístico)', () => {
    const rng = new Rng(11);
    const cuenta: Record<string, number> = {};
    for (let i = 0; i < 3000; i++) for (const p of repartirPremios(DATOS, rng)) cuenta[p.tipo] = (cuenta[p.tipo] ?? 0) + 1;
    const total = Object.values(cuenta).reduce((a, b) => a + b, 0);
    expect(total).toBe(3000 * DATOS.economia.premio.cartas);
    const pesos = DATOS.economia.premio.opciones;
    const pesoTotal = pesos.reduce((s, o) => s + o.peso, 0);
    const esperado = (tipo: string) => pesos.filter((o) => o.tipo === tipo).reduce((s, o) => s + o.peso, 0) / pesoTotal;
    for (const tipo of ['monedas', 'esencia', 'item', 'criatura']) expect(cuenta[tipo]! / total).toBeCloseTo(esperado(tipo), 1);
  });
  it('cobrar entrega cada tipo de premio', () => {
    const e = conLumbrito();
    const m = e.monedas;
    cobrarPremio(DATOS, e, { tipo: 'monedas', cantidad: 30 });
    cobrarPremio(DATOS, e, { tipo: 'esencia', cantidad: 20 });
    cobrarPremio(DATOS, e, { tipo: 'item', item: 'pocion', cantidad: 1 });
    const carta = cobrarPremio(DATOS, e, { tipo: 'criatura', especie: 'aletin', rareza: 'comun', brillante: false });
    expect(e.monedas).toBe(m + 30);
    expect(e.esencia).toBe(20);
    expect(cantidad(e, 'pocion')).toBe(1);
    expect(carta?.resultado).toBe('nueva');
    expect(criaturaDe(e, 'aletin')).toBeDefined();
  });
});

describe('formas Eclipse', () => {
  it('cada familia tiene una Eclipse: sale de la etapa 3 a nivel 40 con la Piedra Eclipse y suma lo mismo que la etapa 4', () => {
    const eclipses = [...DATOS.criaturas.values()].filter((c) => c.sprites.endsWith('_4b'));
    expect(eclipses).toHaveLength(new Set([...DATOS.criaturas.values()].map((c) => c.familia)).size);
    for (const ec of eclipses) {
      const padre = [...DATOS.criaturas.values()].find((c) => c.evoluciona.some((e) => e.a === ec.id))!;
      expect(padre.etapa).toBe(3);
      const ev = padre.evoluciona.find((e) => e.a === ec.id)!;
      expect([ev.nivel, ev.item]).toEqual([40, 'piedra_eclipse']);
      const normal = DATOS.criaturas.get(padre.evoluciona.find((e) => !e.item)!.a)!;
      const suma = (c: typeof ec) => Object.values(c.base).reduce((a, b) => a + b, 0);
      expect(suma(ec)).toBe(suma(normal));
      expect([ec.tipo, ec.etapa, ec.evoluciona.length]).toEqual([normal.tipo, 4, 0]);
    }
  });
  it('Ignileón evoluciona a Solarión Eclipse gastando la piedra', () => {
    const e = estadoNuevo(DATOS, 0);
    e.criaturas.push({ ...nuevaCriatura('ignileon', 40, 'comun', false), entrenamiento: 100 });
    e.equipo = ['ignileon'];
    expect(evolucionar(DATOS, e, 'ignileon', 'solarion_eclipse')).toBe(false);
    agregar(e, 'piedra_eclipse');
    expect(evolucionar(DATOS, e, 'ignileon', 'solarion_eclipse')).toBe(true);
    expect(criaturaDe(e, 'solarion_eclipse')).toBeTruthy();
    expect(cantidad(e, 'piedra_eclipse')).toBe(0);
  });
});
