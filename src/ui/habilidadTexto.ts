import { DATOS } from '../core/datos';
import { t } from '../i18n/i18n';
import type { Habilidad } from '../esquemas/esquemas';

/** Describe los efectos de una habilidad a partir de sus datos (sin texto escrito a mano). */
export function describirHabilidad(h: Habilidad): string {
  const partes: string[] = [];
  for (const e of h.efectos) {
    if (e.tipo === 'estado') partes.push(t(e.prob >= 100 ? 'ef.estado.seguro' : 'ef.estado', { prob: e.prob, estado: t(`estado.${e.estado}`) }));
    else if (e.tipo === 'etapa') partes.push(t(e.objetivo === 'propio' ? 'ef.etapa.sube' : 'ef.etapa.baja', { prob: e.prob, stat: t(`stat.${e.stat}`) }));
    else if (e.tipo === 'cura') partes.push(t('ef.cura', { x: e.porcentaje }));
    else if (e.tipo === 'guardia') partes.push(t(`ef.guardia.${e.modo}`, { x: Math.round((e.reduccion ?? 0) * 100) }));
  }
  if (h.rol === 'final') partes.push(t('ef.final', { n: h.enfriamiento }));
  return partes.join(' · ');
}

/** Tipo, categoría, potencia y precisión en una línea. */
export function lineaHabilidad(h: Habilidad): string {
  let linea = `${DATOS.tipos.get(h.tipo)!.nombre} · ${t(`cat.${h.categoria}`)}`;
  if (h.potencia > 0) linea += ' · ' + t('info.potencia', { p: h.potencia, a: h.precision ?? 100 });
  else if (h.precision !== null) linea += ` · Prec. ${h.precision}`;
  return linea;
}
