import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { deserializar, serializar } from '../src/core/estado/guardado';
import { acreditar, comprasHoy, desafioAdulto, MAX_POR_DIA, modoDePago, PRODUCTOS, productoDe, vetoDeCompra } from '../src/core/compras/compras';
import { Rng } from '../src/core/rng';

const HOY = Date.UTC(2026, 10, 20, 15);
const MANANA = HOY + 86_400_000;

describe('compras (D277)', () => {
  it('los productos son los de D246', () => {
    expect(PRODUCTOS.map((p) => p.id)).toEqual(['monedas_1200', 'monedas_6600', 'monedas_14400', 'cristales_300', 'cristales_1650', 'cristales_3600', 'bienvenida']);
    expect(productoDe('bienvenida')).toMatchObject({ monedas: 3000, cristales: 500, sobre: 'legendario', usd: '2,99', unico: true });
    for (const p of PRODUCTOS) expect(p.id).toMatch(/^[a-z0-9_]+$/);
    // El sobre del pack existe de verdad.
    expect(DATOS.sobres.sobres.some((s) => s.id === 'legendario')).toBe(true);
  });

  it('acredita monedas y cristales y deja el historial', () => {
    const e = estadoNuevo(DATOS, HOY);
    const m0 = e.monedas;
    expect(acreditar(e, 'monedas_1200', 'GPA.1', HOY)).toBe('ok');
    expect(acreditar(e, 'cristales_300', 'GPA.2', HOY)).toBe('ok');
    expect(e.monedas).toBe(m0 + 1200);
    expect(e.esencia).toBe(300);
    expect(e.compras!.historial.map((h) => h.id)).toEqual(['monedas_1200', 'cristales_300']);
    expect(comprasHoy(e, HOY)).toBe(2);
  });

  it('no acredita dos veces el mismo recibo', () => {
    const e = estadoNuevo(DATOS, HOY);
    expect(acreditar(e, 'monedas_6600', 'GPA.9', HOY)).toBe('ok');
    const m = e.monedas;
    expect(acreditar(e, 'monedas_6600', 'GPA.9', HOY)).toBe('repetida');
    expect(e.monedas).toBe(m);
    expect(comprasHoy(e, HOY)).toBe(1);
  });

  it('un producto desconocido no entrega nada', () => {
    const e = estadoNuevo(DATOS, HOY);
    expect(acreditar(e, 'oro_infinito', 'x', HOY)).toBe('desconocido');
    expect(vetoDeCompra(e, 'oro_infinito', HOY)).toBe('desconocido');
    expect(e.compras).toBeUndefined();
  });

  it('límite de 5 compras por día, y se renueva al día siguiente', () => {
    const e = estadoNuevo(DATOS, HOY);
    for (let i = 0; i < MAX_POR_DIA; i++) {
      expect(vetoDeCompra(e, 'monedas_1200', HOY)).toBeNull();
      acreditar(e, 'monedas_1200', `r${i}`, HOY);
    }
    expect(vetoDeCompra(e, 'monedas_1200', HOY)).toBe('limite');
    // Lo que ya se cobró se entrega aunque pase el límite.
    expect(acreditar(e, 'monedas_1200', 'tarde', HOY)).toBe('ok');
    expect(vetoDeCompra(e, 'monedas_1200', MANANA)).toBeNull();
    expect(comprasHoy(e, MANANA)).toBe(0);
  });

  it('el pack de bienvenida se entrega una sola vez, con su sobre', () => {
    const e = estadoNuevo(DATOS, HOY);
    expect(vetoDeCompra(e, 'bienvenida', HOY)).toBeNull();
    expect(acreditar(e, 'bienvenida', 'B1', HOY)).toBe('ok');
    expect(e.esencia).toBe(500);
    expect(e.sobresRegalo.legendario).toBe(1);
    expect(vetoDeCompra(e, 'bienvenida', HOY)).toBe('yaTienes');
    // Google lo informa otra vez con otro recibo (al reabrir): no se repite.
    expect(acreditar(e, 'bienvenida', 'B2', HOY)).toBe('repetida');
    expect(e.sobresRegalo.legendario).toBe(1);
    expect(e.esencia).toBe(500);
  });

  it('el historial y los recibos tienen tope', () => {
    const e = estadoNuevo(DATOS, HOY);
    for (let i = 0; i < 100; i++) acreditar(e, 'monedas_1200', `r${i}`, HOY);
    expect(e.compras!.recibos.length).toBe(60);
    expect(e.compras!.historial.length).toBe(60);
    expect(e.compras!.recibos.at(-1)).toBe('r99');
  });

  it('se guarda, se recupera, y las partidas viejas (sin compras) siguen valiendo', () => {
    const e = estadoNuevo(DATOS, HOY);
    expect(deserializar(serializar(e))).not.toBeNull();
    acreditar(e, 'cristales_1650', 'G', HOY);
    const vuelta = deserializar(serializar(e))!;
    expect(vuelta.compras!.historial[0]!.id).toBe('cristales_1650');
    expect(vuelta.esencia).toBe(1650);
  });

  it('la puerta para adultos da cuentas con resultado correcto y difíciles de adivinar', () => {
    const rng = new Rng(7);
    const vistas = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const d = desafioAdulto(rng);
      const [a, b, c] = d.texto.match(/\d+/g)!.map(Number) as [number, number, number];
      expect(d.respuesta).toBe(a * b + c);
      expect(d.respuesta).toBeGreaterThan(100);
      vistas.add(d.texto);
    }
    expect(vistas.size).toBeGreaterThan(50);
  });

  it('el modo de pago: Google Play solo en la app de tienda; en la web publicada no se vende', () => {
    const base = { nativo: false, depuracion: false, desarrollo: false, prueba: false };
    expect(modoDePago({ ...base, nativo: true })).toBe('play');
    expect(modoDePago({ ...base, nativo: true, depuracion: true })).toBe('simulada');
    expect(modoDePago(base)).toBe('ninguna');
    expect(modoDePago({ ...base, prueba: true })).toBe('simulada');
    expect(modoDePago({ ...base, desarrollo: true })).toBe('simulada');
    // Una web con depuración o prueba nunca usa Google Play.
    expect(modoDePago({ ...base, depuracion: true })).toBe('ninguna');
  });
});

describe('compras con varias ranuras de guardado (D279)', () => {
  it('un recibo entregado en una ranura no se entrega en otra', async () => {
    const { registroVacio } = await import('../src/core/compras/compras');
    const reg = registroVacio();
    const a = estadoNuevo(DATOS, HOY);
    const b = estadoNuevo(DATOS, HOY);
    expect(acreditar(a, 'monedas_1200', 'GPA.7', HOY, reg, 1)).toBe('ok');
    const m = b.monedas;
    expect(acreditar(b, 'monedas_1200', 'GPA.7', HOY, reg, 2)).toBe('repetida');
    expect(b.monedas).toBe(m);
  });

  it('el pack de bienvenida queda en la ranura donde se compró y no se copia a las otras', async () => {
    const { registroVacio } = await import('../src/core/compras/compras');
    const reg = registroVacio();
    const a = estadoNuevo(DATOS, HOY);
    const b = estadoNuevo(DATOS, HOY);
    expect(acreditar(a, 'bienvenida', 'B1', HOY, reg, 1)).toBe('ok');
    expect(reg.bienvenida).toBe(1);
    expect(vetoDeCompra(b, 'bienvenida', HOY, reg)).toBe('yaTienes');
    // Google lo vuelve a informar al abrir la app jugando en la ranura 2: no se entrega ahí.
    expect(acreditar(b, 'bienvenida', 'B1', HOY, reg, 2)).toBe('repetida');
    expect(acreditar(b, 'bienvenida', 'B2', HOY, reg, 2)).toBe('repetida');
    expect(b.sobresRegalo.legendario ?? 0).toBe(0);
  });
});
