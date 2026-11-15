import { describe, expect, it } from 'vitest';
import es from '../src/i18n/es.json';
import en from '../src/i18n/en.json';
import datosEn from '../src/i18n/datos-en.json';
import { DATOS } from '../src/core/datos';

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('Inglés', () => {
  it('tiene todas las claves del español, con las mismas variables', () => {
    const faltan = Object.keys(es).filter((k) => !(k in en));
    expect(faltan).toEqual([]);
    for (const [k, v] of Object.entries(es)) expect(vars((en as Record<string, string>)[k]!), k).toEqual(vars(v));
  });

  it('traduce todos los datos que se muestran', () => {
    for (const c of DATOS.criaturas.values()) expect(datosEn.criaturas[c.id as keyof typeof datosEn.criaturas], c.id).toBeDefined();
    for (const h of DATOS.habilidades.values()) expect(datosEn.habilidades[h.id as keyof typeof datosEn.habilidades], h.id).toBeDefined();
    for (const i of DATOS.items.values()) expect(datosEn.items[i.id as keyof typeof datosEn.items], i.id).toBeDefined();
    for (const s of DATOS.sobres.sobres) expect(datosEn.sobres[s.id as keyof typeof datosEn.sobres], s.id).toBeDefined();
    for (const t of DATOS.tipos.values()) expect(datosEn.tipos[t.id as keyof typeof datosEn.tipos]?.abrev, t.id).toHaveLength(3);
  });

  it('respeta los largos que caben en pantalla', () => {
    for (const v of Object.values(datosEn.criaturas) as { nombre?: string; descripcion: string }[]) {
      expect(v.descripcion.length).toBeLessThanOrEqual(90);
      if (v.nombre) expect(v.nombre.length).toBeLessThanOrEqual(16);
    }
    for (const v of Object.values(datosEn.habilidades)) expect(v.nombre.length).toBeLessThanOrEqual(20);
  });
});
