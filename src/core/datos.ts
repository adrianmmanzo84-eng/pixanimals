import tiposJson from '../data/tipos.json';
import balanceJson from '../data/balance.json';
import habilidadesJson from '../data/habilidades.json';
import criaturasJson from '../data/criaturas.json';
import jefesJson from '../data/jefes.json';
import sobresJson from '../data/sobres.json';
import economiaJson from '../data/economia.json';
import itemsJson from '../data/items.json';
import historiaJson from '../data/historia.json';
import { z } from 'zod';
import { HistoriaZ, type Historia, BalanceZ, CriaturaZ, EconomiaZ, HabilidadZ, ItemsZ, SobresZ, TiposZ, type Balance, type Criatura, type Economia, type Habilidad, type Item, type Items, type Sobres, type TipoDef } from '../esquemas/esquemas';

export interface Datos {
  tipos: Map<string, TipoDef>;
  balance: Balance;
  habilidades: Map<string, Habilidad>;
  /** Todas las criaturas: las del jugador y los jefes (los jefes llevan `jefe`). */
  criaturas: Map<string, Criatura>;
  /** Solo las que se pueden obtener (sin los jefes): colección, Bestiario, Álbum y sobres. */
  jugables: Criatura[];
  sobres: Sobres;
  economia: Economia;
  items: Map<string, Item>;
  /** Reglas generales de los ítems (límites de vitaminas, ofertas, máximo por combate). */
  reglasItems: Omit<Items, 'items'>;
  /** Modo Historia: regiones, final y desbloqueos. */
  historia: Historia;
}

/** Valida todos los JSON y las referencias cruzadas. Devuelve los datos y la lista de errores. */
export function cargarDatos(): { datos: Datos; errores: string[] } {
  const errores: string[] = [];
  const tipos = TiposZ.parse(tiposJson).tipos;
  const balance = BalanceZ.parse(balanceJson);
  const habilidades = z.object({ habilidades: z.array(HabilidadZ) }).parse(habilidadesJson).habilidades;
  const jugables = z.object({ criaturas: z.array(CriaturaZ) }).parse(criaturasJson).criaturas;
  const jefes = z.object({ criaturas: z.array(CriaturaZ) }).parse(jefesJson).criaturas;
  for (const j of jefes) if (!j.jefe) errores.push(`Jefe ${j.id}: le falta la marca "jefe".`);
  for (const c of jugables) if (c.jefe) errores.push(`Criatura ${c.id}: solo los jefes llevan la marca "jefe".`);
  const criaturas = [...jugables, ...jefes];
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
    if (h.categoria !== 'estado' && h.potencia === 0 && h.rol !== 'definitivo') errores.push(`Habilidad ${h.id}: es de daño pero su potencia es 0.`);
    if (h.rol === 'final' && h.enfriamiento === 0) errores.push(`Habilidad ${h.id}: un movimiento final necesita enfriamiento.`);
  }
  for (const c of criaturas) {
    if (!mTipos.has(c.tipo)) errores.push(`Criatura ${c.id}: tipo inexistente (${c.tipo}).`);
    if (!(c.pasiva in balance.pasivas) && !(c.pasiva in balance.pasivasAlias)) errores.push(`Criatura ${c.id}: pasiva inexistente (${c.pasiva}).`);
    if (c.definitivo && mHab.get(c.definitivo)?.rol !== 'definitivo') errores.push(`${c.id}: su Definitivo ${c.definitivo} no existe o no es un Definitivo.`);
    for (const id of [...c.habilidades, ...(c.habilidadesPrueba ?? [])])
      if (mHab.get(id)?.rol === 'definitivo') errores.push(`${c.id}: el Definitivo ${id} no va entre sus 4 habilidades.`);
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
    if (s.tipo && s.probEtapa2 > 0 && !criaturas.some((c) => c.etapa === 2 && c.tipo === s.tipo)) errores.push(`Sobre ${s.id}: no hay criaturas de etapa 2 del tipo ${s.tipo}.`);
    for (const id of s.items ?? []) if (!mItems.get(id)?.rareza) errores.push(`Sobre ${s.id}: el ítem ${id} no existe o no tiene rareza (no sale en sobres).`);
    if (s.probItem > 0 && !items.some((i) => i.rareza && (!s.items || s.items.includes(i.id)))) errores.push(`Sobre ${s.id}: da ítems pero ninguno puede salir.`);
  }
  for (const p of economia.premio.opciones) {
    if (p.tipo === 'item' && !mItems.has(p.item)) errores.push(`Premio: ítem inexistente (${p.item}).`);
    if ((p.tipo === 'monedas' || p.tipo === 'esencia') && p.min > p.max) errores.push(`Premio de ${p.tipo}: min mayor que max.`);
  }
  for (const id of sobres.bienvenida) if (mCri.get(id)?.etapa !== 1) errores.push(`Sobre de bienvenida: ${id} no es una criatura de etapa 1.`);
  for (const s of [economia.torre.sobreJefe, economia.torre.sobreGrande]) if (!sobres.sobres.some((x) => x.id === s)) errores.push(`Torre: el sobre ${s} no existe.`);
  if (!sobres.sobres.some((s) => s.id === economia.diario.sobreUltimoDia)) errores.push(`Premio diario: el sobre ${economia.diario.sobreUltimoDia} no existe.`);
  if (new Set(economia.misiones.lista.map((m) => m.id)).size !== economia.misiones.lista.length) errores.push('Hay ids de misión repetidos.');
  if (economia.misiones.lista.length < economia.misiones.porDia) errores.push('Hay menos misiones que misiones por día.');
  if (!sobres.sobres.some((s) => s.id === sobres.gratis.sobre)) errores.push(`El sobre gratis (${sobres.gratis.sobre}) no existe.`);
  // Sobres de las metas, medallas, expediciones y semana temática.
  const premiosMeta = [
    economia.album.familia,
    economia.album.eclipse,
    economia.album.tipo,
    ...economia.album.coleccion.map((c) => c.premio),
    ...economia.premiosMedalla,
    economia.semanal.premio,
  ];
  for (const p of premiosMeta) if (p.sobre && !sobres.sobres.some((s) => s.id === p.sobre)) errores.push(`Premio de meta: el sobre ${p.sobre} no existe.`);
  for (const [i, seg] of economia.ruleta.segmentos.entries()) {
    const p = seg.premio;
    if (p.sobre && !sobres.sobres.some((x) => x.id === p.sobre)) errores.push(`Ruleta, casilla ${i + 1}: el sobre ${p.sobre} no existe.`);
    if (p.item && !mItems.has(p.item)) errores.push(`Ruleta, casilla ${i + 1}: el ítem ${p.item} no existe.`);
    if (!p.monedas && !p.esencia && !p.sobre && !p.item) errores.push(`Ruleta, casilla ${i + 1}: no da nada.`);
  }
  for (const d of economia.expediciones.duraciones) if (!sobres.sobres.some((s) => s.id === d.sobre)) errores.push(`Expedición de ${d.horas} h: el sobre ${d.sobre} no existe.`);
  for (const c of criaturas) if (c.id.endsWith('_eclipse') !== (c.etapa === 4 && c.evoluciona.length === 0 && criaturas.some((o) => o.evoluciona.some((e) => e.a === c.id && e.item)))) errores.push(`${c.id}: las formas Eclipse deben terminar en _eclipse (y solo ellas).`);
  // Jefes: cada tipo tiene al menos un jefe semanal, y los pisos de los Guardianes apuntan a Guardianes que existen y no se repiten.
  for (const tipo of tipos.filter((t) => t.id !== 'neutro')) if (!jefes.some((j) => j.jefe === 'semanal' && j.tipo === tipo.id)) errores.push(`No hay jefe semanal del tipo ${tipo.id}.`);
  const usados = new Set<string>();
  for (const [piso, id] of Object.entries(economia.torre.guardianes)) {
    if (mCri.get(id)?.jefe !== 'guardian') errores.push(`Torre: el piso ${piso} apunta a ${id}, que no es un Guardián.`);
    if (usados.has(id)) errores.push(`Torre: el Guardián ${id} está en más de un piso.`);
    usados.add(id);
    if (Number(piso) % economia.torre.jefeCada !== 0) errores.push(`Torre: el piso ${piso} del Guardián ${id} no es un piso de jefe.`);
  }
  // Cronoportal: cada era apunta a una familia prehistórica (origen «crono») con sus 4 etapas.
  economia.crono.eras.forEach((e, i) => {
    const fam = [...mCri.values()].filter((c) => c.familia === e.familia);
    if (fam.length !== 4 || fam.some((c) => c.origen !== 'crono')) errores.push(`Cronoportal, era ${i + 1}: la familia ${e.familia} debe tener 4 etapas con origen "crono".`);
  });
  // Mina Pixel: los ítems de los cofres existen; el monstruo (si hay) es una forma final de una familia exclusiva.
  economia.mina.zonas.forEach((z, i) => {
    for (const c of z.cofre) if (!mItems.has(c.item)) errores.push(`Mina, zona ${i + 1}: el cofre da un ítem que no existe (${c.item}).`);
    if (z.monstruo) {
      const m = mCri.get(z.monstruo);
      if (!m) errores.push(`Mina, zona ${i + 1}: el monstruo ${z.monstruo} no existe.`);
      else if (m.origen !== 'mina') errores.push(`Mina, zona ${i + 1}: el monstruo ${z.monstruo} debe ser de una familia exclusiva (origen "mina").`);
    }
  });
  // Modo Historia: jefes, Guardianes, fondos y sobres existen; cada región de un tipo y sin jefes repetidos.
  const historia = HistoriaZ.parse(historiaJson);
  const vistos = new Set<string>();
  for (const r of historia.regiones) {
    if (!mTipos.has(r.tipo)) errores.push(`Historia, ${r.id}: tipo inexistente (${r.tipo}).`);
    for (const j of r.jefes) if (mCri.get(j)?.jefe !== 'semanal' || mCri.get(j)!.tipo !== r.tipo) errores.push(`Historia, ${r.id}: ${j} no es un jefe semanal de tipo ${r.tipo}.`);
    if (mCri.get(r.guardian)?.jefe !== 'guardian') errores.push(`Historia, ${r.id}: ${r.guardian} no es un Guardián.`);
    for (const id of [...r.jefes, r.guardian]) {
      if (vistos.has(id)) errores.push(`Historia: ${id} está en más de una región.`);
      vistos.add(id);
    }
    if (r.premio.sobre && !sobres.sobres.some((x) => x.id === r.premio.sobre)) errores.push(`Historia, ${r.id}: el sobre ${r.premio.sobre} no existe.`);
  }
  if (mCri.get(historia.final.jefe)?.jefe !== 'final') errores.push(`Historia: el jefe final ${historia.final.jefe} no existe o no es "final".`);
  if (historia.final.premio.sobre && !sobres.sobres.some((x) => x.id === historia.final.premio.sobre)) errores.push(`Historia: el sobre final ${historia.final.premio.sobre} no existe.`);
  return { datos: { tipos: mTipos, balance, habilidades: mHab, criaturas: mCri, jugables, sobres, economia, items: mItems, reglasItems, historia }, errores };
}

const cargado = cargarDatos();
if (cargado.errores.length) throw new Error('Datos inválidos:\n' + cargado.errores.join('\n'));
export const DATOS: Datos = cargado.datos;
