import type { EstadoJuego, RarezaId, SobreDef } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import type { Rng } from '../rng';
import { criaturaDe, marcarVista, nuevaCriatura } from '../estado/juego';

/** Reglas de los sobres: tiradas de rareza, pity, sobre gratis y qué pasa con las repetidas. */

export const ORDEN_RAREZA: RarezaId[] = ['comun', 'poco_comun', 'rara', 'epica'];
const rango = (r: RarezaId) => ORDEN_RAREZA.indexOf(r);

export type ResultadoCarta = 'nueva' | 'mejora' | 'repetida';

export interface Carta {
  especie: string;
  rareza: RarezaId;
  brillante: boolean;
  resultado: ResultadoCarta;
  /** Esencia obtenida si la carta no se conserva. */
  esencia: number;
  /** La tuya pasa a ser brillante gracias a esta carta. */
  ganaBrillo: boolean;
}

const MS_HORA = 3_600_000;

/** Cuántos sobres gratis hay disponibles ahora y cuánto falta para el siguiente (ms; 0 si está al máximo). */
export function sobresGratis(datos: Datos, estado: EstadoJuego, ahora: number): { disponibles: number; faltaMs: number } {
  const { cadaHoras, maxAcumulados } = datos.sobres.gratis;
  const periodo = cadaHoras * MS_HORA;
  const ganados = Math.max(0, Math.floor((ahora - estado.gratis.desde) / periodo));
  const disponibles = Math.min(maxAcumulados, estado.gratis.acumulados + ganados);
  const faltaMs = disponibles >= maxAcumulados ? 0 : periodo - ((ahora - estado.gratis.desde) % periodo);
  return { disponibles, faltaMs };
}

export function tirarRareza(prob: SobreDef['prob'], rng: Rng): RarezaId {
  let x = rng.sig() * 100;
  for (const r of ORDEN_RAREZA) {
    x -= prob[r];
    if (x < 0) return r;
  }
  return 'comun';
}

/** Guarda una carta en la colección y dice qué pasó con ella. */
export function recibir(datos: Datos, estado: EstadoJuego, especie: string, rareza: RarezaId, brillante: boolean): Carta {
  const esenciaDe = (r: RarezaId) => datos.sobres.rarezas.find((x) => x.id === r)!.esencia;
  marcarVista(estado, especie);
  const mia = criaturaDe(estado, especie);
  if (!mia) {
    estado.criaturas.push(nuevaCriatura(especie, datos.sobres.nivelInicial, rareza, brillante));
    if (estado.equipo.length < datos.economia.tamanoEquipo) estado.equipo.push(especie);
    return { especie, rareza, brillante, resultado: 'nueva', esencia: 0, ganaBrillo: false };
  }
  const ganaBrillo = brillante && !mia.brillante;
  if (ganaBrillo) mia.brillante = true;
  if (rango(rareza) > rango(mia.rareza)) {
    // Mejora: la tuya sube de rareza conservando nivel y experiencia; la rareza vieja se vuelve Esencia.
    const esencia = esenciaDe(mia.rareza);
    mia.rareza = rareza;
    estado.esencia += esencia;
    return { especie, rareza, brillante, resultado: 'mejora', esencia, ganaBrillo };
  }
  const esencia = esenciaDe(rareza);
  estado.esencia += esencia;
  return { especie, rareza, brillante, resultado: 'repetida', esencia, ganaBrillo };
}

/** Con incienso activo, Rara y Épica se multiplican y la diferencia se le quita a Común (y si no alcanza, a Poco común). */
export function probConIncienso(prob: SobreDef['prob'], estado: EstadoJuego, ahora: number): SobreDef['prob'] {
  if (ahora >= estado.incienso.hasta || estado.incienso.mult <= 1) return prob;
  const rara = prob.rara * estado.incienso.mult;
  const epica = prob.epica * estado.incienso.mult;
  let resto = rara + epica - prob.rara - prob.epica;
  const comun = Math.max(0, prob.comun - resto);
  resto -= prob.comun - comun;
  const poco = Math.max(0, prob.poco_comun - resto);
  return { comun, poco_comun: poco, rara, epica };
}

export type MotivoSobre = 'inexistente' | 'monedas';

/** ¿Se puede abrir este sobre ahora? Devuelve cómo se pagaría. */
export function costoDe(datos: Datos, estado: EstadoJuego, idSobre: string, ahora: number): { gratis: boolean; costo: number; puede: boolean } {
  const def = datos.sobres.sobres.find((s) => s.id === idSobre);
  if (!def) return { gratis: false, costo: 0, puede: false };
  const gratis = datos.sobres.gratis.sobre === idSobre && sobresGratis(datos, estado, ahora).disponibles > 0;
  return { gratis, costo: gratis ? 0 : def.costo, puede: gratis || estado.monedas >= def.costo };
}

/** Abre un sobre: cobra (o gasta el gratis), tira las cartas, aplica el pity y actualiza la colección. */
export function abrirSobre(datos: Datos, estado: EstadoJuego, idSobre: string, rng: Rng, ahora: number): Carta[] | MotivoSobre {
  const def = datos.sobres.sobres.find((s) => s.id === idSobre);
  if (!def) return 'inexistente';
  const pago = costoDe(datos, estado, idSobre, ahora);
  if (!pago.puede) return 'monedas';
  if (pago.gratis) {
    const { disponibles } = sobresGratis(datos, estado, ahora);
    // Si estaba al máximo, el reloj del siguiente sobre arranca ahora.
    if (disponibles >= datos.sobres.gratis.maxAcumulados) estado.gratis.desde = ahora;
    else estado.gratis.desde += (disponibles - estado.gratis.acumulados) * datos.sobres.gratis.cadaHoras * MS_HORA;
    estado.gratis.acumulados = disponibles - 1;
  } else estado.monedas -= def.costo;

  const candidatas = [...datos.criaturas.values()].filter((c) => c.etapa === 1 && (!def.tipo || c.tipo === def.tipo));
  const prob = probConIncienso(def.prob, estado, ahora);
  const rarezas: RarezaId[] = Array.from({ length: datos.sobres.cartasPorSobre }, () => tirarRareza(prob, rng));
  // Pity: tras N sobres sin Rara (o sin Épica), la primera carta de este sobre la garantiza.
  if (estado.pity.epica >= datos.sobres.pity.epica) rarezas[0] = 'epica';
  else if (estado.pity.rara >= datos.sobres.pity.rara && rango(rarezas[0]!) < rango('rara')) rarezas[0] = 'rara';
  const mejor = Math.max(...rarezas.map(rango));
  estado.pity.rara = mejor >= rango('rara') ? 0 : estado.pity.rara + 1;
  estado.pity.epica = mejor >= rango('epica') ? 0 : estado.pity.epica + 1;
  estado.estadisticas.sobres++;

  return rarezas.map((rareza) => recibir(datos, estado, rng.elegir(candidatas).id, rareza, rng.prob(100 / datos.sobres.brillanteUnoEn)));
}

/** Sobre de bienvenida: las criaturas de `sobres.bienvenida` (una de cada familia original), para empezar con equipo completo. */
export function sobreBienvenida(datos: Datos, estado: EstadoJuego, rng: Rng): Carta[] {
  const basico = datos.sobres.sobres.find((s) => s.id === datos.sobres.gratis.sobre)!;
  estado.bienvenida = true;
  return datos.sobres.bienvenida.map((id) => recibir(datos, estado, id, tirarRareza(basico.prob, rng), false));
}
