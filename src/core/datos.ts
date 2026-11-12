import tiposJson from '../data/tipos.json';
import balanceJson from '../data/balance.json';
import habilidadesJson from '../data/habilidades.json';
import criaturasJson from '../data/criaturas.json';
import sobresJson from '../data/sobres.json';
import economiaJson from '../data/economia.json';
import itemsJson from '../data/items.json';
import { z } from 'zod';
import { BalanceZ, CriaturaZ, EconomiaZ, HabilidadZ, ItemsZ, SobresZ, TiposZ, type Balance, type Criatura, type Economia, type Habilidad, type Item, type Items, type Sobres, type TipoDef } from '../esquemas/esquemas';

export interface Datos {
  tipos: Map<string, TipoDef>;
  balance: Balance;
  habilidades: Map<string, Habilidad>;
  criaturas: Map<string, Criatura>;
  sobres: Sobres;
  economia: Economia;
  items: Map<string, Item>;
  /** Reglas generales de los ítems (límites de vitaminas, ofertas, máximo por combate). */
  reglasItems: Omit<Items, 'items'>;
}

/** Valida todos los JSON y las referencias cruzadas. Devuelve los datos y la lista de errores. */
export function cargarDatos(): { datos: Datos; errores: string[] } {
  const errores: string[] = [];
  const tipos = TiposZ.parse(tiposJson).tipos;
  const balance = BalanceZ.parse(balanceJson);
  const habilidades = z.object({ habilidades: z.array(HabilidadZ) }).parse(habilidadesJson).habilidades;
  const criaturas = z.object({ criaturas: z.array(CriaturaZ) }).parse(criaturasJson).criaturas;
  const sobres = SobresZ.parse(sobresJson);
  const economia = EconomiaZ.parse(economiaJson);
  const { items, ...reglasItems } = ItemsZ.parse(itemsJson);
  const mItems = new Map(items.map((i) => [i.id, i]));
  if (mItems.size !== items.length) errores.push('Hay ids de ítem repetidos.');

  const mTipos = new Map(tipos.map((t) => [t.id, t]));
  const mHab = new Map(habilidades.map((h) => [h.id, h]));
  const mCri = new Map(criaturas.map((c) => [c.id, c]));

  if (mHab.size !== habilidades.length) errores.push('Hay ids de habilidad repetidos.');
  if (mCri.size !== criaturas.length) errores.push('Hay ids de criatura repetidos.');
  for (const t of tipos) for (const v of t.vence) if (!mTipos.has(v)) errores.push(`Tipo ${t.id}: vence a un tipo inexistente (${v}).`);
  for (const h of habilidades) {
    if (!mTipos.has(h.tipo)) errores.push(`Habilidad ${h.id}: tipo inexistente (${h.tipo}).`);
    if (h.categoria !== 'estado' && h.potencia === 0) errores.push(`Habilidad ${h.id}: es de daño pero su potencia es 0.`);
    if (h.rol === 'final' && h.enfriamiento === 0) errores.push(`Habilidad ${h.id}: un movimiento final necesita enfriamiento.`);
  }
  for (const c of criaturas) {
    if (!mTipos.has(c.tipo)) errores.push(`Criatura ${c.id}: tipo inexistente (${c.tipo}).`);
    if (!(c.pasiva in balance.pasivas) && !(c.pasiva in balance.pasivasAlias)) errores.push(`Criatura ${c.id}: pasiva inexistente (${c.pasiva}).`);
    for (const id of [...c.habilidades, ...(c.habilidadesPrueba ?? [])])
      if (!mHab.has(id)) errores.push(`Criatura ${c.id}: habilidad inexistente (${id}).`);
    for (const ev of c.evoluciona) {
      if (!mCri.has(ev.a)) errores.push(`Criatura ${c.id}: evoluciona a una criatura inexistente (${ev.a}).`);
      if (ev.item && mItems.get(ev.item)?.uso !== 'evolucion') errores.push(`Criatura ${c.id}: la evolución a ${ev.a} pide un ítem que no es una piedra (${ev.item}).`);
    }
    if (c.evoluciona.filter((e) => !e.item).length > 1) errores.push(`Criatura ${c.id}: solo puede haber una evolución sin ítem.`);
  }
  for (const s of sobres.sobres) {
    const suma = s.prob.comun + s.prob.poco_comun + s.prob.rara + s.prob.epica;
    if (Math.abs(suma - 100) > 0.001) errores.push(`Sobre ${s.id}: las probabilidades suman ${suma}, deben sumar 100.`);
    if (s.tipo && !criaturas.some((c) => c.etapa === 1 && c.tipo === s.tipo)) errores.push(`Sobre ${s.id}: no hay criaturas de etapa 1 del tipo ${s.tipo}.`);
  }
  for (const p of economia.premio.opciones) {
    if (p.tipo === 'item' && !mItems.has(p.item)) errores.push(`Premio: ítem inexistente (${p.item}).`);
    if ((p.tipo === 'monedas' || p.tipo === 'esencia') && p.min > p.max) errores.push(`Premio de ${p.tipo}: min mayor que max.`);
  }
  for (const id of sobres.bienvenida) if (mCri.get(id)?.etapa !== 1) errores.push(`Sobre de bienvenida: ${id} no es una criatura de etapa 1.`);
  if (!sobres.sobres.some((s) => s.id === economia.diario.sobreUltimoDia)) errores.push(`Premio diario: el sobre ${economia.diario.sobreUltimoDia} no existe.`);
  if (new Set(economia.misiones.lista.map((m) => m.id)).size !== economia.misiones.lista.length) errores.push('Hay ids de misión repetidos.');
  if (economia.misiones.lista.length < economia.misiones.porDia) errores.push('Hay menos misiones que misiones por día.');
  if (!sobres.sobres.some((s) => s.id === sobres.gratis.sobre)) errores.push(`El sobre gratis (${sobres.gratis.sobre}) no existe.`);
  return { datos: { tipos: mTipos, balance, habilidades: mHab, criaturas: mCri, sobres, economia, items: mItems, reglasItems }, errores };
}

const cargado = cargarDatos();
if (cargado.errores.length) throw new Error('Datos inválidos:\n' + cargado.errores.join('\n'));
export const DATOS: Datos = cargado.datos;
