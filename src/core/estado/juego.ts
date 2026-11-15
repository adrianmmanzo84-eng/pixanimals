import type { CriaturaJugador, EstadoJuego, RarezaId, StatVitamina } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { crearCombatiente, type Combatiente } from '../combate/motor';

/** Todo el progreso del jugador. Es un objeto plano y serializable: se guarda tal cual. */
export function estadoNuevo(datos: Datos, ahora: number): EstadoJuego {
  return {
    version: 9,
    monedas: datos.economia.monedasIniciales,
    esencia: 0,
    criaturas: [],
    equipo: [],
    vistas: [],
    pity: { rara: 0, epica: 0 },
    gratis: { acumulados: 1, desde: ahora },
    bienvenida: false,
    estadisticas: { combates: 0, victorias: 0, sobres: 0, impecables: 0, fusiones: 0, expediciones: 0 },
    inventario: {},
    incienso: { hasta: 0, mult: 1 },
    diario: { ultimoDia: -1, racha: 0 },
    minijuegos: { dia: -1, partidas: {}, records: {} },
    misiones: { dia: -1, lista: [] },
    sobresRegalo: {},
    torre: { piso: 1, mejor: 0 },
    entrenador: { diaCobrado: -1 },
    copias: {},
    registro: [],
    album: { cobrados: [] },
    medallas: { cobradas: [] },
    expediciones: [],
    semanal: { semanaCobrada: -1 },
    ruleta: { ultimoDia: -1 },
    jefes: [],
    guia: { paso: 0 },
    desafio: { dia: -1, terminado: false, victoria: false, turnos: 0, vidas: [], racha: 0, mejorRacha: 0, victorias: 0 },
  };
}

/** Un ejemplar recién obtenido. */
export function nuevaCriatura(especie: string, nivel: number, rareza: RarezaId, brillante: boolean): CriaturaJugador {
  return { especie, nivel, xp: 0, rareza, brillante, vitaminas: {}, entrenamiento: 0, amuleto: null };
}

export function criaturaDe(estado: EstadoJuego, especie: string): CriaturaJugador | undefined {
  return estado.criaturas.find((c) => c.especie === especie);
}

export function potencialDe(datos: Datos, rareza: RarezaId): number {
  return datos.sobres.rarezas.find((r) => r.id === rareza)!.potencial;
}

export function marcarVista(estado: EstadoJuego, especie: string): void {
  if (!estado.vistas.includes(especie)) estado.vistas.push(especie);
}

/** Criaturas del equipo, en orden. Limpia referencias a criaturas que ya no existan. */
export function equipoDe(estado: EstadoJuego): CriaturaJugador[] {
  return estado.equipo.flatMap((id) => {
    const c = criaturaDe(estado, id);
    return c ? [c] : [];
  });
}

/** Pone una criatura al frente del equipo (la agrega si hay sitio). */
export function ponerAlFrente(datos: Datos, estado: EstadoJuego, especie: string): void {
  if (!criaturaDe(estado, especie)) return;
  estado.equipo = [especie, ...estado.equipo.filter((e) => e !== especie)].slice(0, datos.economia.tamanoEquipo);
}

/** Bonus porcentual de vitaminas por stat. */
export function bonusVitaminas(datos: Datos, c: CriaturaJugador): Partial<Record<StatVitamina, number>> {
  const res: Partial<Record<StatVitamina, number>> = {};
  for (const [stat, dosis] of Object.entries(c.vitaminas) as [StatVitamina, number][]) {
    const item = [...datos.items.values()].find((i) => i.efecto.tipo === 'vitamina' && i.efecto.stat === stat);
    if (item?.efecto.tipo === 'vitamina') res[stat] = dosis * item.efecto.porcentaje;
  }
  return res;
}

/** % extra por stat: vitaminas más el amuleto equipado. */
export function bonusStats(datos: Datos, c: CriaturaJugador): Partial<Record<StatVitamina, number>> {
  const res = bonusVitaminas(datos, c);
  const am = c.amuleto ? datos.items.get(c.amuleto)?.efecto : undefined;
  if (am?.tipo === 'amuleto') res[am.stat] = (res[am.stat] ?? 0) + am.porcentaje;
  return res;
}

export function combatienteDe(datos: Datos, c: CriaturaJugador): Combatiente {
  const cb = crearCombatiente(datos, c.especie, c.nivel, { potencial: potencialDe(datos, c.rareza), extra: bonusStats(datos, c), brillante: c.brillante });
  return { ...cb, nombre: nombreDe(datos, c) };
}

/** Nombre que se muestra de una criatura tuya: su apodo, o el de su especie. */
export function nombreDe(datos: Datos, c: CriaturaJugador): string {
  return c.apodo || datos.criaturas.get(c.especie)!.nombre;
}

/** Apodo limpio: sin caracteres de control ni signos de etiqueta, espacios simples, hasta 12 letras. Vacío = sin apodo. */
export function limpiarApodo(texto: string): string {
  const limpio = texto.replace(/[\u0000-\u001f\u007f<>{}\\]/g, '').replace(/\s+/g, ' ').trim();
  return [...limpio].slice(0, 12).join('').trim();
}

/** Pone (o quita, si queda vacío) el apodo. Sigue a la criatura aunque evolucione. */
export function ponerApodo(estado: EstadoJuego, especie: string, texto: string): string {
  const c = criaturaDe(estado, especie);
  if (!c) return '';
  const apodo = limpiarApodo(texto);
  if (apodo) c.apodo = apodo;
  else delete c.apodo;
  return apodo;
}

/** Marca la favorita (solo una); si ya lo era, la desmarca. Devuelve si quedó marcada. */
export function alternarFavorita(estado: EstadoJuego, especie: string): boolean {
  const c = criaturaDe(estado, especie);
  if (!c) return false;
  const ahora = !c.favorita;
  for (const x of estado.criaturas) delete x.favorita;
  if (ahora) c.favorita = true;
  return ahora;
}

export function favoritaDe(estado: EstadoJuego): CriaturaJugador | null {
  return estado.criaturas.find((c) => c.favorita) ?? null;
}
