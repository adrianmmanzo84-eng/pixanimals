import { describe, expect, it } from 'vitest';
import { DATOS } from '../src/core/datos';
import { estadoNuevo } from '../src/core/estado/juego';
import { deserializar, exportarCodigo, importarCodigo, migrar, serializar } from '../src/core/estado/guardado';
import { elegirRecuperacion } from '../src/core/estado/respaldo';
import { recibir } from '../src/core/sobres/sobres';
import { EstadoJuegoZ, type EstadoJuego } from '../src/esquemas/esquemas';

/** Etapa 2 de pruebas (guardado): partidas de cada versión, código de traspaso, recuperación y tamaño. */

const AHORA = Date.UTC(2026, 10, 16, 15);

/** Partida grande: todas las criaturas obtenibles, con apodos y progreso en casi todo. */
function partidaCompleta(): EstadoJuego {
  const e = estadoNuevo(DATOS, AHORA);
  const especies = [...DATOS.criaturas.values()].filter((c) => !c.jefe).map((c) => c.id);
  especies.forEach((id, i) => {
    recibir(DATOS, e, id, (['comun', 'poco_comun', 'rara', 'epica'] as const)[i % 4], i % 17 === 0, 1 + (i % 60));
    const c = e.criaturas.find((x) => x.especie === id);
    if (c && i % 9 === 0) c.apodo = 'Ñandú ✦' + (i % 100);
  });
  e.equipo = especies.slice(0, 3);
  e.monedas = 987654;
  e.esencia = 12345;
  e.vistas = especies;
  return EstadoJuegoZ.parse(e);
}

/** Campos que agregó cada versión (para fabricar partidas viejas a partir de una nueva). */
const AGREGADOS: Record<number, { raiz: string[]; criatura?: string[] }> = {
  2: { raiz: ['inventario', 'incienso'], criatura: ['vitaminas', 'entrenamiento'] },
  3: { raiz: ['diario', 'minijuegos', 'misiones', 'sobresRegalo'] },
  4: { raiz: ['torre', 'entrenador'], criatura: ['amuleto'] },
  5: { raiz: ['copias', 'registro', 'album', 'medallas', 'expediciones', 'semanal'] },
  6: { raiz: ['ruleta'] },
  7: { raiz: ['jefes'] },
  8: { raiz: ['desafio'] },
  9: { raiz: ['guia'] },
  10: { raiz: ['eventos'] },
  11: { raiz: ['mina'] },
};
/** Opcionales que llegaron sin cambiar de versión (no hacen falta en partidas viejas). */
const OPCIONALES = { raiz: ['crono', 'rutas'], criatura: ['ataques', 'aprendidos', 'ofertaAtaque'] };

function comoVersion(nueva: EstadoJuego, v: number): Record<string, unknown> {
  const o = JSON.parse(serializar(nueva)) as Record<string, unknown>;
  o.version = v;
  for (const k of OPCIONALES.raiz) delete o[k];
  const criaturas = o.criaturas as Record<string, unknown>[];
  for (const c of criaturas) for (const k of OPCIONALES.criatura) delete c[k];
  for (let n = v + 1; n <= 11; n++) {
    for (const k of AGREGADOS[n]!.raiz) delete o[k];
    for (const c of criaturas) for (const k of AGREGADOS[n]!.criatura ?? []) delete c[k];
  }
  return o;
}

describe('Etapa 2 · guardado', () => {
  it('una partida nueva y una completa se guardan y se leen iguales', () => {
    for (const e of [estadoNuevo(DATOS, AHORA), partidaCompleta()]) expect(deserializar(serializar(e))).toEqual(e);
  });

  it('las partidas de cada versión anterior (1 a 10) se abren sin perder criaturas, niveles ni monedas', () => {
    const nueva = partidaCompleta();
    for (let v = 1; v <= 10; v++) {
      const vieja = comoVersion(nueva, v);
      const e = deserializar(JSON.stringify(vieja));
      expect(e, `versión ${v}`).not.toBeNull();
      expect(e!.version).toBe(11);
      expect(e!.monedas).toBe(nueva.monedas);
      expect(e!.esencia).toBe(nueva.esencia);
      expect(e!.criaturas.length).toBe(nueva.criaturas.length);
      expect(e!.criaturas.map((c) => [c.especie, c.nivel, c.rareza, c.brillante, c.apodo])).toEqual(nueva.criaturas.map((c) => [c.especie, c.nivel, c.rareza, c.brillante, c.apodo]));
      expect(e!.equipo).toEqual(nueva.equipo);
    }
  });

  it('migrar no cambia una partida que ya está en la versión actual', () => {
    const e = partidaCompleta();
    expect(migrar(JSON.parse(serializar(e)))).toEqual(JSON.parse(serializar(e)));
  });

  it('el código de traspaso ida y vuelta conserva todo (incluidos apodos con ñ y símbolos)', () => {
    const e = partidaCompleta();
    const codigo = exportarCodigo(e);
    expect(codigo.startsWith('PIX1-')).toBe(true);
    expect(importarCodigo(codigo)).toEqual(e);
    // Con espacios o saltos de línea al pegar.
    expect(importarCodigo(`  ${codigo}\n`)).toEqual(e);
  });

  it('un código inválido se rechaza sin romper nada', () => {
    const bueno = exportarCodigo(estadoNuevo(DATOS, AHORA));
    const malos = [
      '',
      'hola',
      bueno.slice(5), // sin prefijo
      bueno.slice(0, bueno.length - 40), // cortado al copiar
      'PIX1-%%%%',
      'PIX1-' + btoa('{"version": 11, "monedas": "muchas"}'),
      'PIX1-' + btoa('no es json'),
    ];
    for (const m of malos) expect(importarCodigo(m), m.slice(0, 20)).toBeNull();
  });

  it('un guardado dañado o de una versión futura no se acepta (el juego lo aparta antes de escribir)', () => {
    const e = partidaCompleta();
    const texto = serializar(e);
    expect(deserializar(texto.slice(0, texto.length / 2))).toBeNull();
    expect(deserializar(JSON.stringify({ ...JSON.parse(texto), version: 12 }))).toBeNull();
    expect(deserializar('null')).toBeNull();
  });

  it('con el guardado principal dañado, recupera la copia válida más nueva (incluida la de la app de Android)', () => {
    const vieja = estadoNuevo(DATOS, AHORA);
    vieja.monedas = 111;
    const nueva = estadoNuevo(DATOS, AHORA);
    nueva.monedas = 999;
    const r = elegirRecuperacion('{dañado', [
      { clave: 'dia-1', texto: serializar(vieja), en: AHORA - 86_400_000 },
      { clave: 'actual', texto: '{también dañada', en: AHORA },
      { clave: 'nativo', texto: serializar(nueva), en: AHORA - 1000 },
    ]);
    expect(r?.estado.monedas).toBe(999);
    expect(r?.desde.clave).toBe('nativo');
    // Si el principal sirve, no se toca.
    expect(elegirRecuperacion(serializar(vieja), [{ clave: 'nativo', texto: serializar(nueva), en: AHORA }])).toBeNull();
  });

  it('una partida completa entra holgada en el almacenamiento (menos de 300 KB) y su código se puede copiar', () => {
    const e = partidaCompleta();
    const bytes = new TextEncoder().encode(serializar(e)).length;
    console.log(`partida completa: ${e.criaturas.length} criaturas, ${(bytes / 1024).toFixed(1)} KB; código ${(exportarCodigo(e).length / 1024).toFixed(1)} KB`);
    expect(bytes).toBeLessThan(300_000);
    expect(exportarCodigo(e).length).toBeLessThan(420_000);
  });
});
