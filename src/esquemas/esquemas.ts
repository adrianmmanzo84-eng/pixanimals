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
  /** definitivo: elimina al rival de un golpe; no ocupa uno de los 4 lugares (ver criatura.definitivo). */
  rol: z.enum(['ofensiva', 'defensiva', 'soporte', 'estado', 'final', 'definitivo']),
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
  /** Ataque Definitivo que aprende (solo las etapas finales y las formas Eclipse). */
  definitivo: z.string().optional(),
  descripcion: z.string().max(90),
  /** Evoluciones posibles: a qué especie, desde qué nivel y, en las ramas, qué ítem hace falta. */
  evoluciona: z.array(z.object({ a: z.string(), nivel: z.number().int().min(2).max(100), item: z.string().optional() })).default([]),
  /** Prefijo de archivo: <sprites>_frente.png, <sprites>_espalda.png, <sprites>_icono.png */
  sprites: z.string().regex(/^[a-z]+_[0-9]+[a-z]?$/),
  /** Jefes: no se capturan, no salen en sobres y no están en el Bestiario ni en el Álbum. `semanal` o `guardian` (Torre). */
  jefe: z.enum(['semanal', 'guardian', 'final']).optional(),
  /** «mina»: familia exclusiva de la Mina Pixel (solo se obtiene del huevo de su monstruo; nunca en sobres ni premios). */
  origen: z.enum(['mina', 'crono']).optional(),
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
  /** Ataque Definitivo: se puede usar desde este turno, una vez por combate. */
  definitivo: z.object({ turnoMinimo: z.number().int().min(1) }),
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
  /** Reglas de las eras del Cronoportal (ver motor: aplicarRegla). */
  reglas: z.object({
    marea: z.object({ cada: z.number().int().min(2), mult: z.number().min(1) }),
    esporas: z.object({ prob: z.number().min(0).max(100) }),
    estampida: z.object({ cada: z.number().int().min(2), porcentaje: z.number().min(1).max(50) }),
    meteoro: z.object({ turno: z.number().int().min(2), porcentaje: z.number().min(1).max(90) }),
    frio: z.object({ inmunes: z.array(z.string()) }),
  }),
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
  sobres: z.array(
    z.object({
      id: z.string(),
      nombre: z.string(),
      costo: z.number().int(),
      tipo: z.string().nullable(),
      prob: ProbRarezasZ,
      /** % de cartas que son ítems (el resto, criaturas). 100: solo ítems. */
      probItem: z.number().min(0).max(100).default(35),
      /** % de las cartas de criatura que salen en su etapa 2 (el resto, etapa 1). */
      probEtapa2: z.number().min(0).max(100).default(20),
      /** Si está, los ítems salen solo de esta lista. */
      items: z.array(z.string()).optional(),
      /** Color del sobre (#rrggbb). */
      color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    }),
  ),
});
const PremioZ = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('monedas'), min: z.number().int().min(1), max: z.number().int().min(1), peso: z.number().positive() }),
  z.object({ tipo: z.literal('esencia'), min: z.number().int().min(1), max: z.number().int().min(1), peso: z.number().positive() }),
  z.object({ tipo: z.literal('item'), item: z.string(), cantidad: z.number().int().min(1), peso: z.number().positive() }),
  z.object({ tipo: z.literal('criatura'), peso: z.number().positive() }),
]);
const RangoZ = z.object({ min: z.number().int().min(0), max: z.number().int().min(0) });
export const MinijuegoIdZ = z.enum(['bayas', 'eco', 'golpe', 'mina']);
export const EventoMisionZ = z.enum(['victoria', 'combate', 'eficaz', 'minijuego', 'sobre', 'item', 'record']);
export const MisionZ = z.object({
  id: z.string().min(1),
  evento: EventoMisionZ,
  meta: z.number().int().min(1),
  premio: z.object({ tipo: z.enum(['monedas', 'esencia']), cantidad: z.number().int().min(1) }),
});

/** Premio de una meta: monedas, Esencia y/o un sobre de regalo. */
export const PremioMetaZ = z.object({ monedas: z.number().int().min(0).default(0), esencia: z.number().int().min(0).default(0), sobre: z.string().optional() });

/**
 * Modo Historia (D264). Lo que la historia abre: modos de combate, opciones del menú y minijuegos (`mj.<id>`).
 */
export const ModoHistoriaZ = z.enum([
  'historia', 'rapido', 'desafio', 'torre', 'entrenador', 'semanal', 'crono',
  'minijuegos', 'misiones', 'expediciones', 'sobres', 'tienda', 'bolsa', 'equipo', 'coleccion', 'bestiario', 'ruleta', 'guardado',
  'mj.bayas', 'mj.eco', 'mj.golpe', 'mj.mina',
]);
export type ModoHistoria = z.infer<typeof ModoHistoriaZ>;
const NivelIAZ = z.enum(['novata', 'tactica', 'experta']);
const PuntoMapaZ = z.tuple([z.number(), z.number()]);
/** Desafío del entorno: se cumple mirando la partida (como los Primeros pasos). */
export const DesafioHistoriaZ = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('minijuego'), id: z.enum(['bayas', 'eco', 'golpe', 'mina']) }),
  z.object({ tipo: z.literal('mina'), zona: z.number().int().min(1) }),
  z.object({ tipo: z.literal('crono'), era: z.number().int().min(1) }),
  z.object({ tipo: z.literal('torre'), piso: z.number().int().min(1) }),
]);
export type DesafioHistoria = z.infer<typeof DesafioHistoriaZ>;
export const RegionZ = z.object({
  id: z.string(),
  tipo: z.string(),
  fondo: z.string(),
  color: z.string(),
  marcador: PuntoMapaZ,
  /** Jefe A (parada 1) y Jefe B, el Jefe Regional (parada 3). */
  jefes: z.tuple([z.string(), z.string()]),
  guardian: z.string(),
  nivel: z.number().int().min(1),
  ia: NivelIAZ,
  desafio: DesafioHistoriaZ,
  /** Lo que se abre al terminar la región (al entrar ya se abre lo que pide su desafío). */
  abre: z.array(ModoHistoriaZ),
  premio: PremioMetaZ,
});
export type Region = z.infer<typeof RegionZ>;
export const HistoriaZ = z.object({
  inicio: z.array(ModoHistoriaZ),
  regiones: z.array(RegionZ).min(1),
  final: z.object({ jefe: z.string(), fondo: z.string(), nivel: z.number().int(), ia: NivelIAZ, marcador: PuntoMapaZ, premio: PremioMetaZ }),
  /** Monedas de cada parada la primera vez (Jefe A, desafío, Jefe B, Guardián). */
  monedasParada: z.tuple([z.number().int(), z.number().int(), z.number().int(), z.number().int()]),
});
export type Historia = z.infer<typeof HistoriaZ>;
export type PremioMeta = z.infer<typeof PremioMetaZ>;

/** Premio de la ruleta: lo mismo que una meta, más un ítem opcional (con cantidad). Sin criaturas. */
export const PremioRuletaZ = PremioMetaZ.extend({ item: z.string().optional(), cantidad: z.number().int().min(1).default(1) });
export type PremioRuleta = z.infer<typeof PremioRuletaZ>;

/** Evento de calendario: por fecha («MM-DD») o día de la semana (0 = domingo), con multiplicadores y un sobre de regalo opcional. */
export const EventoZ = z.object({
  id: z.string(),
  fechas: z.array(z.string().regex(/^\d{2}-\d{2}$/)).optional(),
  dias: z.array(z.number().int().min(0).max(6)).optional(),
  efectos: z.object({
    monedasCombate: z.number().min(1).max(5).optional(),
    xpCombate: z.number().min(1).max(5).optional(),
    entrenamientoMinijuego: z.number().min(1).max(5).optional(),
    monedasExpedicion: z.number().min(1).max(5).optional(),
    brillante: z.number().min(1).max(10).optional(),
  }),
  regalo: z.string().optional(),
});
export type EventoDef = z.infer<typeof EventoZ>;

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
    /** Guardianes: piso → id del jefe de evento que reemplaza al jefe normal de ese piso. */
    guardianes: z.record(z.string(), z.string()),
    /** IA por piso: hasta `hasta` (inclusive) se usa `ia`. */
    ia: z.array(z.object({ hasta: z.number().int().min(1), ia: z.enum(['novata', 'tactica', 'experta']) })).min(1),
  }),
  /** Rival con nombre y equipo temático que cambia cada día. */
  entrenador: z.object({
    monedas: z.number().int().min(0),
    nivelExtra: z.number().int().min(0),
    nombres: z.array(z.string().min(1)).min(1),
  }),
  /** Recompensas del Álbum (completar familias, tipos y la colección). */
  album: z.object({
    familia: PremioMetaZ,
    eclipse: PremioMetaZ,
    tipo: PremioMetaZ,
    coleccion: z.array(z.object({ meta: z.number().int().min(1), premio: PremioMetaZ })),
  }),
  /** Medallas: objetivos largos con 3 niveles (bronce, plata, oro). */
  medallas: z.array(
    z.object({
      id: z.enum(['victorias', 'especies', 'sobres', 'torre', 'brillantes', 'expediciones', 'fusiones', 'impecables', 'jefes', 'mina', 'crono']),
      metas: z.tuple([z.number().int().min(1), z.number().int().min(1), z.number().int().min(1)]),
    }),
  ),
  premiosMedalla: z.tuple([PremioMetaZ, PremioMetaZ, PremioMetaZ]),
  /** Expediciones: criaturas fuera del equipo exploran unas horas y vuelven con premios. */
  expediciones: z.object({
    lugares: z.number().int().min(1),
    duraciones: z.array(
      z.object({
        horas: z.number().int().min(1),
        monedas: z.number().int().min(0),
        xp: z.number().int().min(0),
        probItem: z.number().min(0).max(100),
        sobre: z.string(),
        probSobre: z.number().min(0).max(100),
      }),
    ),
  }),
  /** Fusión: cuántas copias repetidas hacen subir una rareza. */
  fusion: z.object({ copias: z.number().int().min(2) }),
  /** Semana temática: un tipo protagonista, su sobre más barato y un Jefe Eclipse. */
  /** Cronoportal: eras (familia, regla, niveles, tipos de los rivales), mapa y premios. */
  crono: z.object({
    eras: z.array(z.object({ familia: z.string(), regla: z.enum(['marea', 'esporas', 'estampida', 'meteoro', 'frio']), nivel: z.tuple([z.number().int(), z.number().int()]), tipos: z.array(z.string()).min(1) })).length(5),
    columnas: z.number().int().min(4).max(10),
    fragmentos: z.number().int().min(1),
    fogata: z.number().min(1).max(100),
    monedasCombate: z.number().int().min(0),
    monedasPorEra: z.number().int().min(0),
    excavacion: z.object({ fosiles: z.tuple([z.number().int(), z.number().int()]), monedas: z.number().int().min(0) }),
    premioJefe: z.object({ monedas: z.number().int(), porEra: z.number().int(), fosiles: z.number().int(), ambar: z.number().int() }),
  }),
  /** Caminos (Entrenador y Jefe de la semana): estaciones previas, niveles menos que el jefe y monedas de cada una. */
  rutas: z.object({ previas: z.number().int().min(1).max(5), nivelesMenos: z.array(z.number().int().min(0)), monedas: z.array(z.number().int().min(0)) }),
  semanal: z.object({ descuento: z.number().int().min(0).max(90), nivelExtra: z.number().int().min(0), premio: PremioMetaZ }),
  /** Mina Pixel (ver src/core/minijuegos/mina.ts): tamaño, recursos, y por zona los pesos de cada bloque, el botín y su monstruo. */
  mina: z.object({
    columnas: z.number().int().min(5),
    vida: z.number().int().min(1),
    energia: z.number().int().min(10),
    energiaPorZona: z.number().int().min(0),
    baya: z.number().int().min(1),
    profundidadZona: z.number().int().min(10),
    eclosionHoras: z.number().min(0),
    premioGuarida: z.number().int().min(0),
    zonas: z
      .array(
        z.object({
          /** Especie (forma final) del monstruo de la guarida; null mientras no exista. */
          monstruo: z.string().nullable(),
          nivel: z.number().int().min(1).max(100),
          /** Probabilidad (%) de una cueva de aire por fila. */
          cuevas: z.number().min(0).max(100),
          monedas: z.number().int().min(0),
          xp: z.number().int().min(0),
          bloques: z.record(z.enum(['tierra', 'piedra', 'dura', 'roca', 'irrompible', 'moneda', 'gema', 'baya', 'cofre', 'corazon', 'pinchos', 'gas', 'lava', 'bomba']), z.number().min(0)),
          cofre: z.array(z.object({ item: z.string(), peso: z.number().positive() })).min(1),
        }),
      )
      .min(1),
  }),
  /** Aprender ataques: cada cuántos niveles se ofrece uno nuevo. */
  ataques: z.object({ cadaNiveles: z.number().int().min(1) }),
  /** Consuelo al perder: Esencia del premio de valiente y cuántas veces por día. */
  consuelo: z.object({ esencia: z.number().int().min(0), porDia: z.number().int().min(0) }),
  /** Eventos de calendario (ver src/core/progresion/eventos.ts). */
  eventos: z.array(EventoZ),
  /** Primeros pasos: premio de cada paso de la guía. */
  guia: z.object({ combate: PremioMetaZ, sobre: PremioMetaZ, equipo: PremioMetaZ, minijuego: PremioMetaZ, torre: PremioMetaZ }),
  /** Desafío del día: nivel de los dos equipos y premio (victoria o derrota). */
  desafio: z.object({ nivel: z.number().int().min(1), monedasVictoria: z.number().int().min(0), esenciaVictoria: z.number().int().min(0), monedasDerrota: z.number().int().min(0) }),
  /** Ruleta diaria: un giro gratis por día. Cada casilla tiene un premio (nunca criaturas) y un peso. */
  ruleta: z.object({
    segmentos: z
      .array(z.object({ premio: PremioRuletaZ, peso: z.number().int().min(1), color: z.string(), especial: z.boolean().default(false) }))
      .min(4)
      .max(12),
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
  /** Revive a la primera criatura caída del equipo con este % de sus PS. */
  z.object({ tipo: z.literal('revivir'), porcentaje: z.number().min(1).max(100) }),
  /** Reloj de Arena: este turno actúas dos veces seguidas (dos ataques). */
  z.object({ tipo: z.literal('doble') }),
  /** Carta de poder: sube un stat de tu criatura activa (dura mientras siga en el campo). */
  z.object({ tipo: z.literal('etapa'), stat: z.enum(['atq', 'def', 'ate', 'dfe', 'vel']), cantidad: z.number().int().min(1).max(6) }),
  /** Encanto: un estado o una bajada de stat al rival activo. */
  z.object({
    tipo: z.literal('encanto'),
    estado: z.enum(['quemadura', 'veneno', 'paralisis', 'sueno']).optional(),
    stat: z.enum(['atq', 'def', 'ate', 'dfe', 'vel']).optional(),
    cantidad: z.number().int().min(1).max(6).optional(),
  }),
  /** Amuleto: se equipa (uno por criatura) y suma un % a un stat mientras lo lleva. */
  z.object({ tipo: z.literal('amuleto'), stat: StatVitaminaZ, porcentaje: z.number().min(1).max(30) }),
  /** Pergamino de Técnica: ofrece ataques nuevos para aprender (ver progresion/ataques.ts). */
  z.object({ tipo: z.literal('tecnica'), opciones: z.number().int().min(1).max(5) }),
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
  /** Rareza con la que sale en los sobres. Sin rareza: no sale en sobres. */
  rareza: RarezaIdZ.optional(),
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
  /** Apodo que le puso el jugador (solo en su partida; nunca se comparte). */
  apodo: z.string().max(12).optional(),
  /** La favorita del jugador (a lo sumo una). */
  favorita: z.boolean().optional(),
  /** Ataques elegidos para los espacios 0 a 2 (null = el original de su especie). El Final no se cambia. */
  ataques: z.array(z.string().nullable()).max(3).optional(),
  /** Memoria: ataques que aprendió alguna vez (se pueden volver a poner gratis). */
  aprendidos: z.array(z.string()).optional(),
  /** Ataque que quiere aprender por haber subido de nivel (pendiente de respuesta). */
  ofertaAtaque: z.string().optional(),
});
export const EstadoJuegoZ = z.object({
  version: z.literal(11),
  monedas: z.number().int().min(0),
  esencia: z.number().int().min(0),
  criaturas: z.array(CriaturaJugadorZ),
  equipo: z.array(z.string()),
  vistas: z.array(z.string()),
  pity: z.object({ rara: z.number().int().min(0), epica: z.number().int().min(0) }),
  gratis: z.object({ acumulados: z.number().int().min(0), desde: z.number() }),
  bienvenida: z.boolean(),
  estadisticas: z.object({
    combates: z.number().int(),
    victorias: z.number().int(),
    sobres: z.number().int(),
    /** Victorias de equipo (3 o más) sin perder ninguna criatura. */
    impecables: z.number().int().min(0),
    fusiones: z.number().int().min(0),
    expediciones: z.number().int().min(0),
  }),
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
  /** Cronoportal: eras abiertas y vencidas, fósiles por familia, ámbar y la expedición en curso. */
  crono: z
    .object({
      eraMax: z.number().int().min(1),
      vencidas: z.array(z.number().int()),
      fosiles: z.record(z.string(), z.number().int().min(0)),
      ambar: z.number().int().min(0),
      grietaDia: z.number().int().optional(),
      expedicion: z
        .object({
          era: z.number().int(),
          semilla: z.number(),
          actual: z.string().nullable(),
          visitados: z.array(z.string()),
          equipo: z.array(z.string()),
          vida: z.record(z.string(), z.number()),
          grieta: z.boolean(),
          resueltos: z.array(z.string()),
          botin: z.object({ monedas: z.number(), fosiles: z.number(), ambar: z.number() }),
        })
        .optional(),
    })
    .optional(),
  /**
   * Modo Historia (D264). Sin dato: partida anterior a la historia, con todo abierto. `libre`: todo abierto
   * (partidas viejas o historia terminada). `paradas`: «region:n» vencidas (n de 0 a 3). `final`: venció al Arquitecto.
   */
  historia: z
    .object({
      libre: z.boolean(),
      paradas: z.array(z.string()),
      final: z.boolean(),
    })
    .optional(),
  /** Caminos del Entrenador y del Jefe de la semana: estaciones previas vencidas en el día o semana (`ciclo`). */
  rutas: z
    .object({
      entrenador: z.object({ ciclo: z.number().int(), vencidas: z.number().int().min(0) }).optional(),
      semanal: z.object({ ciclo: z.number().int(), vencidas: z.number().int().min(0) }).optional(),
    })
    .optional(),
  /** Especies que alguna vez fueron tuyas (para el Álbum; evolucionar no las borra). */
  registro: z.array(z.string()),
  /** Copias repetidas guardadas por especie (3 se funden para subir una rareza). */
  copias: z.record(z.string(), z.number().int().min(0)),
  /** Metas del Álbum y Medallas ya cobradas (ids). */
  album: z.object({ cobrados: z.array(z.string()) }),
  medallas: z.object({ cobradas: z.array(z.string()) }),
  /** Expediciones en curso. */
  expediciones: z.array(z.object({ especie: z.string(), desde: z.number(), horas: z.number().int().min(1) })),
  /** Última semana en que se cobró el premio del Jefe de la semana. */
  semanal: z.object({ semanaCobrada: z.number().int() }),
  /** Último día en que se giró la ruleta diaria. */
  ruleta: z.object({ ultimoDia: z.number().int() }),
  /** Jefes (semanales y Guardianes) a los que ya les ganaste: cada uno es una insignia. */
  jefes: z.array(z.string()),
  /** Mina Pixel: hasta qué zona llega el ascensor y los huevos incubando (especie de la cría y cuándo eclosiona). */
  mina: z.object({
    zonaMax: z.number().int().min(1),
    huevos: z.array(z.object({ especie: z.string(), eclosiona: z.number() })),
    /** Guaridas vencidas alguna vez (zonas), para la medalla Minero. */
    guaridas: z.array(z.number().int()).optional(),
  }),
  /** Premios de valiente de hoy (opcional: las partidas viejas no lo tienen). */
  consuelo: z.object({ dia: z.number().int(), veces: z.number().int().min(0) }).optional(),
  /** Regalos de eventos ya cobrados («navidad-2026»). */
  eventos: z.object({ regalos: z.array(z.string()) }),
  /** Primeros pasos: índice del próximo paso por cobrar (5 = guía terminada). */
  guia: z.object({ paso: z.number().int().min(0) }),
  /** Desafío del día: último día jugado, su resultado, racha de días seguidos y victorias totales. */
  desafio: z.object({
    dia: z.number().int(),
    terminado: z.boolean(),
    victoria: z.boolean(),
    turnos: z.number().int().min(0),
    vidas: z.array(z.number().min(0).max(1)),
    racha: z.number().int().min(0),
    mejorRacha: z.number().int().min(0),
    victorias: z.number().int().min(0),
  }),
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
