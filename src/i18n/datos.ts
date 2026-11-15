import type { Datos } from '../core/datos';
import datosEn from './datos-en.json';
import { idioma } from './i18n';

/**
 * Nombres y descripciones de los datos en otro idioma (los ids y los números no cambian).
 * Se aplica una vez al iniciar, antes de dibujar nada. Los nombres de las criaturas jugables
 * no se traducen: con el esquema «pix» funcionan en los dos idiomas. Los de los jefes, sí.
 */
type Parche = { nombre?: string; descripcion?: string; abrev?: string };
const TRADUCCIONES: Record<string, Record<string, Record<string, Parche>>> = { en: datosEn };

export function traducirDatos(datos: Datos): void {
  const tr = TRADUCCIONES[idioma()];
  if (!tr) return;
  const aplicar = <T extends object>(obj: T | undefined, p: Parche | undefined) => {
    if (obj && p) Object.assign(obj, p);
  };
  for (const c of datos.criaturas.values()) aplicar(c, tr.criaturas?.[c.id]);
  for (const h of datos.habilidades.values()) aplicar(h, tr.habilidades?.[h.id]);
  for (const i of datos.items.values()) aplicar(i, tr.items?.[i.id]);
  for (const s of datos.sobres.sobres) aplicar(s, tr.sobres?.[s.id]);
  for (const r of datos.sobres.rarezas) aplicar(r, tr.rarezas?.[r.id]);
  for (const t of datos.tipos.values()) aplicar(t, tr.tipos?.[t.id]);
}
