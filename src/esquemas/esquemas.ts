import { z } from 'zod';

/** Esquemas de todos los archivos de datos. Si un JSON no cumple, el juego no arranca y `npm run validar` falla. */

export const StatIdZ = z.enum(['atq', 'def', 'ate', 'dfe', 'vel']);
export const EstadoIdZ = z.enum(['quemadura', 'veneno', 'paralisis', 'sueno']);
const ObjetivoZ = z.enum(['rival', 'propio']);
const ProbZ = z.number().min(1).max(100);

export const EfectoZ = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('estado'), estado: EstadoIdZ, prob: ProbZ, objetivo: ObjetivoZ }),
  z.object({ tipo: z.literal('etapa'), stat: StatIdZ, delta: z.number().int().min(-3).max(3), prob: ProbZ, objetivo: ObjetivoZ }),
  z.object({ tipo: z.literal('cura'), porcentaje: z.number().min(1).max(100) }),
  z.object({
    tipo: z.literal('guardia'),
    modo: z.enum(['reduce', 'bloquea']),
    reduccion: z.number().min(0).max(1).optional(),
    contraEstado: z.object({ estado: EstadoIdZ, prob: ProbZ, soloFisico: z.boolean() }).optional(),
  }),
]);

/** Efectos visuales disponibles (implementados en src/ui/efectos.ts). */
export const AnimacionZ = z.enum([
  'zarpazo', 'proyectil', 'impacto', 'llamarada', 'anillo_fuego', 'grito', 'dentellada', 'burbujas', 'corriente', 'ola',
  'corteza', 'sol', 'hojas', 'mirada', 'arrullo', 'polen', 'raices', 'rayo', 'brillo',
]);

export const HabilidadZ = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1).max(19),
  tipo: z.string(),
  categoria: z.enum(['fisica', 'especial', 'estado']),
  rol: z.enum(['ofensiva', 'defensiva', 'soporte', 'estado', 'final']),
  potencia: z.number().int().min(0).max(200),
  /** null = no puede fallar (habilidades sobre uno mismo). */
  precision: z.number().min(1).max(100).nullable(),
  usos: z.number().int().min(1).max(40),
  prioridad: z.number().int().min(0).max(2).default(0),
  enfriamiento: z.number().int().min(0).max(10).default(0),
  noRepetir: z.boolean().default(false),
  efectos: z.array(EfectoZ).default([]),
  /** Efecto visual. Si falta, se elige uno según tipo y categoría. */
  animacion: AnimacionZ.optional(),
});

const BaseStatZ = z.number().int().min(1).max(255);
export const CriaturaZ = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1).max(16),
  tipo: z.string(),
  familia: z.string(),
  etapa: z.number().int().min(1).max(4),
  pasiva: z.string(),
  base: z.object({ ps: BaseStatZ, atq: BaseStatZ, def: BaseStatZ, ate: BaseStatZ, dfe: BaseStatZ, vel: BaseStatZ }),
  habilidades: z.array(z.string()).length(4),
  habilidadesPrueba: z.array(z.string()).length(4).optional(),
  descripcion: z.string().max(90),
  /** Evoluciones posibles: a qué especie, desde qué nivel y, en las ramas, qué ítem hace falta. */
  evoluciona: z.array(z.object({ a: z.string(), nivel: z.number().int().min(2).max(100), item: z.string().optional() })).default([]),
  /** Prefijo de archivo: <sprites>_frente.png, <sprites>_espalda.png, <sprites>_icono.png */
  sprites: z.string().regex(/^[a-z]+_[0-9][a-z]?$/),
});

export const TiposZ = z.object({
  tipos: z.array(z.object({ id: z.string(), nombre: z.string(), abrev: z.string().length(3), vence: z.array(z.string()) })),
});

export const BalanceZ = z.object({
  nivelMax: z.number().int(),
  stats: z.object({ psBase: z.number(), psDivisor: z.number(), statBase: z.number(), statDivisor: z.number() }),
  dano: z.object({
    factorBase: z.number(), factorNivel: z.number(), mismoTipo: z.number(), ventaja: z.number(), desventaja: z.number(),
    azarMin: z.number(), azarMax: z.number(), criticoProb: z.number(), criticoBonusVeloz: z.number(), criticoMult: z.number(),
    /** Multiplicador de daño en combates de equipo (más de una criatura por lado), para que no se hagan largos. */
    equipos: z.number().min(1),
  }),
  etapas: z.object({ paso: z.number(), max: z.number().int() }),
  final: z.object({ turnoMinimo: z.number().int() }),
  estados: z.object({
    quemadura: z.object({ turnos: z.number().int(), danoDivisor: z.number(), multFisico: z.number(), inmunes: z.array(z.string()) }),
    veneno: z.object({ turnos: z.number().int(), danoDivisor: z.number(), inmunes: z.array(z.string()) }),
    paralisis: z.object({ turnos: z.number().int(), multVelocidad: z.number(), probPerderTurno: z.number(), inmunes: z.array(z.string()) }),
    sueno: z.object({ turnosMin: z.number().int(), turnosMax: z.number().int(), inmunes: z.array(z.string()) }),
  }),
  pasivas: z.object({
    ultimo_rescoldo: z.object({ nombre: z.string(), umbralPs: z.number(), mult: z.number() }),
    oleaje: z.object({ nombre: z.string(), mult: z.number() }),
    raices: z.object({ nombre: z.string(), curaDivisor: z.number() }),
  }),
  /** Pasivas con nombre y mensaje propios que funcionan igual que una de las tres de arriba. */
  pasivasAlias: z.record(z.string(), z.object({ nombre: z.string(), mecanica: z.enum(['ultimo_rescoldo', 'oleaje', 'raices']) })),
  empujon: z.object({ potencia: z.number() }),
  cansancio: z.object({ desdeTurno: z.number().int(), danoDivisor: z.number() }),
  maxTurnos: z.number().int(),
});

export const RarezaIdZ = z.enum(['comun', 'poco_comun', 'rara', 'epica']);
const ProbRarezasZ = z.object({ comun: z.number(), poco_comun: z.number(), rara: z.number(), epica: z.number() });
export const SobresZ = z.object({
  cartasPorSobre: z.number().int().min(1),
  brillanteUnoEn: z.number().int().min(1),
  nivelInicial: z.number().int().min(1),
  rarezas: z.array(z.object({ id: RarezaIdZ, nombre: z.string(), estrellas: z.number().int(), potencial: z.number(), esencia: z.number().int() })).length(4),
  pity: z.object({ rara: z.number().int(), epica: z.number().int() }),
  /** Criaturas del sobre de bienvenida. */
  bienvenida: z.array(z.string()).min(1),
  gratis: z.object({ sobre: z.string(), cadaHoras: z.number(), maxAcumulados: z.number().int() }),
  sobres: z.array(z.object({ id: z.string(), nombre: z.string(), costo: z.number().int(), tipo: z.string().nullable(), prob: ProbRarezasZ })),
});
const PremioZ = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('monedas'), min: z.number().int().min(1), max: z.number().int().min(1), peso: z.number().positive() }),
  z.object({ tipo: z.literal('esencia'), min: z.number().int().min(1), max: z.number().int().min(1), peso: z.number().positive() }),
  z.object({ tipo: z.literal('item'), item: z.string(), cantidad: z.number().int().min(1), peso: z.number().positive() }),
  z.object({ tipo: z.literal('criatura'), peso: z.number().positive() }),
]);
const RangoZ = z.object({ min: z.number().int().min(0), max: z.number().int().min(0) });
export const MinijuegoIdZ = z.enum(['bayas', 'eco', 'golpe']);
export const EventoMisionZ = z.enum(['victoria', 'combate', 'eficaz', 'minijuego', 'sobre', 'item', 'record']);
export const MisionZ = z.object({
  id: z.string().min(1),
  evento: EventoMisionZ,
  meta: z.number().int().min(1),
  premio: z.object({ tipo: z.enum(['monedas', 'esencia']), cantidad: z.number().int().min(1) }),
});

export const EconomiaZ = z.object({
  monedasIniciales: z.number().int(),
  tamanoEquipo: z.number().int().min(1).max(6),
  recompensas: z.object({ novata: z.number().int(), tactica: z.number().int(), experta: z.number().int(), derrota: z.number().int() }),
  xp: z.object({ porVictoriaBase: z.number(), porNivelRival: z.number(), curvaBase: z.number(), curvaLineal: z.number(), curvaCuadratica: z.number() }),
  /** Barra de Entrenamiento: hay que llenarla para evolucionar. */
  entrenamiento: z.object({ max: z.number().int().min(1), porVictoria: z.number().int().min(0), esenciaPorPunto: z.number().min(0) }),
  /** Carta premio al ganar: se tira una de estas opciones por cada carta. */
  premio: z.object({ cartas: z.number().int().min(2).max(5), opciones: z.array(PremioZ).min(1) }),
  /** Premio por entrar cada día; el último día del ciclo regala además un sobre. */
  diario: z.object({ monedas: z.number().int().min(0), ciclo: z.number().int().min(1), sobreUltimoDia: z.string() }),
  /** Premio de cada partida de minijuego, según el puntaje (0 a 1). */
  minijuegos: z.object({
    conPremioPorDia: z.number().int().min(1),
    entrenamiento: RangoZ,
    monedas: RangoZ,
    lista: z.array(MinijuegoIdZ).min(1),
  }),
  misiones: z.object({ porDia: z.number().int().min(1), lista: z.array(MisionZ).min(1) }),
  /** Torre de Desafíos: nivel del rival = nivelBase + nivelPorPiso × piso; jefe cada `jefeCada` pisos. */
  torre: z.object({
    monedasBase: z.number().int().min(0),
    monedasPorPiso: z.number().int().min(0),
    nivelBase: z.number().int().min(1),
    nivelPorPiso: z.number().min(0),
    jefeCada: z.number().int().min(2),
    nivelExtraJefe: z.number().int().min(0),
    sobreJefe: z.string(),
    cadaSobreGrande: z.number().int().min(2),
    sobreGrande: z.string(),
    /** IA por piso: hasta `hasta` (inclusive) se usa `ia`. */
    ia: z.array(z.object({ hasta: z.number().int().min(1), ia: z.enum(['novata', 'tactica', 'experta']) })).min(1),
  }),
  /** Rival con nombre y equipo temático que cambia cada día. */
  entrenador: z.object({
    monedas: z.number().int().min(0),
    nivelExtra: z.number().int().min(0),
    nombres: z.array(z.string().min(1)).min(1),
  }),
});

export const StatVitaminaZ = z.enum(['ps', 'atq', 'def', 'ate', 'dfe', 'vel']);
const PrecioZ = z.object({ monedas: z.number().int().min(1).optional(), esencia: z.number().int().min(1).optional() }).refine((p) => !!p.monedas !== !!p.esencia, 'Un precio es en monedas o en Esencia (uno de los dos).');
export const EfectoItemZ = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('xp'), cantidad: z.number().int().min(1) }),
  z.object({ tipo: z.literal('vitamina'), stat: StatVitaminaZ, porcentaje: z.number().min(1).max(20) }),
  z.object({ tipo: z.literal('piedra') }),
  z.object({ tipo: z.literal('incienso'), minutos: z.number().int().min(1), mult: z.number().min(1) }),
  z.object({ tipo: z.literal('cura'), porcentaje: z.number().min(1).max(100) }),
  z.object({ tipo: z.literal('antidoto') }),
  z.object({ tipo: z.literal('tonico'), usos: z.number().int().min(1) }),
  z.object({ tipo: z.literal('escudo'), reduccion: z.number().min(0.05).max(1) }),
  /** Amuleto: se equipa (uno por criatura) y suma un % a un stat mientras lo lleva. */
  z.object({ tipo: z.literal('amuleto'), stat: StatVitaminaZ, porcentaje: z.number().min(1).max(30) }),
]);
export const ItemZ = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  nombre: z.string().min(1).max(18),
  descripcion: z.string().min(1).max(70),
  /** Dónde se usa: fuera del combate, dentro, o al evolucionar (piedras). */
  uso: z.enum(['fuera', 'combate', 'evolucion', 'equipo']),
  efecto: EfectoItemZ,
  /** null: no se vende (solo se consigue como premio). */
  precio: PrecioZ.nullable(),
  /** Icono de 16x16 (public/items/<id>.png). Si falta, se dibuja uno por código. */
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});
export const ItemsZ = z.object({
  items: z.array(ItemZ),
  vitaminas: z.object({ maxPorStat: z.number().int().min(1), maxTotal: z.number().int().min(1) }),
  ofertas: z.object({ cantidad: z.number().int().min(0), descuento: z.number().int().min(0).max(90) }),
  maxPorCombate: z.number().int().min(0),
});

/** Partida guardada. Al cambiar su forma hay que subir `version` y migrar en guardado.ts. */
export const CriaturaJugadorZ = z.object({
  especie: z.string(),
  nivel: z.number().int().min(1),
  xp: z.number().min(0),
  rareza: RarezaIdZ,
  brillante: z.boolean(),
  /** Dosis de vitamina tomadas, por stat. */
  vitaminas: z.partialRecord(StatVitaminaZ, z.number().int().min(0)),
  /** Barra de Entrenamiento (0 a economia.entrenamiento.max). Se vacía al evolucionar. */
  entrenamiento: z.number().int().min(0),
  /** Amuleto equipado (id de ítem) o null. */
  amuleto: z.string().nullable(),
});
export const EstadoJuegoZ = z.object({
  version: z.literal(4),
  monedas: z.number().int().min(0),
  esencia: z.number().int().min(0),
  criaturas: z.array(CriaturaJugadorZ),
  equipo: z.array(z.string()),
  vistas: z.array(z.string()),
  pity: z.object({ rara: z.number().int().min(0), epica: z.number().int().min(0) }),
  gratis: z.object({ acumulados: z.number().int().min(0), desde: z.number() }),
  bienvenida: z.boolean(),
  estadisticas: z.object({ combates: z.number().int(), victorias: z.number().int(), sobres: z.number().int() }),
  /** Cantidad de cada ítem en la Bolsa. */
  inventario: z.record(z.string(), z.number().int().min(0)),
  /** Hasta cuándo (ms) dura el incienso activo, y con qué multiplicador. */
  incienso: z.object({ hasta: z.number(), mult: z.number() }),
  /** Racha de días seguidos con premio diario cobrado. */
  diario: z.object({ ultimoDia: z.number().int(), racha: z.number().int().min(0) }),
  /** Partidas de minijuego de hoy y mejor puntaje de cada uno. */
  minijuegos: z.object({ dia: z.number().int(), partidas: z.record(z.string(), z.number().int().min(0)), records: z.record(z.string(), z.number()) }),
  /** Misiones del día. */
  misiones: z.object({
    dia: z.number().int(),
    lista: z.array(z.object({ id: z.string(), progreso: z.number().int().min(0), cobrada: z.boolean() })),
  }),
  /** Sobres regalados que se abren gratis (id del sobre → cantidad). */
  sobresRegalo: z.record(z.string(), z.number().int().min(0)),
  /** Torre de Desafíos: próximo piso a jugar y el más alto superado. */
  torre: z.object({ piso: z.number().int().min(1), mejor: z.number().int().min(0) }),
  /** Último día en que se cobró el premio del Entrenador del día. */
  entrenador: z.object({ diaCobrado: z.number().int() }),
});

export type RarezaId = z.infer<typeof RarezaIdZ>;
export type Sobres = z.infer<typeof SobresZ>;
export type SobreDef = Sobres['sobres'][number];
export type Economia = z.infer<typeof EconomiaZ>;
export type CriaturaJugador = z.infer<typeof CriaturaJugadorZ>;
export type EstadoJuego = z.infer<typeof EstadoJuegoZ>;
export type StatId = z.infer<typeof StatIdZ>;
export type EstadoId = z.infer<typeof EstadoIdZ>;
export type Efecto = z.infer<typeof EfectoZ>;
export type Habilidad = z.infer<typeof HabilidadZ>;
export type Animacion = z.infer<typeof AnimacionZ>;
export type Criatura = z.infer<typeof CriaturaZ>;
export type Balance = z.infer<typeof BalanceZ>;
export type Item = z.infer<typeof ItemZ>;
export type EfectoItem = z.infer<typeof EfectoItemZ>;
export type Items = z.infer<typeof ItemsZ>;
export type StatVitamina = z.infer<typeof StatVitaminaZ>;
export type Premio = z.infer<typeof PremioZ>;
export type TipoDef = z.infer<typeof TiposZ>['tipos'][number];
export type MinijuegoId = z.infer<typeof MinijuegoIdZ>;
export type EventoMision = z.infer<typeof EventoMisionZ>;
export type Mision = z.infer<typeof MisionZ>;
