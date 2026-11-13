import type { Criatura, Efecto, EstadoId, Habilidad, Item, StatId } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import type { Rng } from '../rng';
import { calcularDano, calcularStats, multEtapa, type Efectividad, type Stats } from './formulas';

/**
 * Motor de combate puro: no dibuja nada y no conoce Phaser.
 * Recibe las acciones de un turno y devuelve la lista de eventos que ocurrieron,
 * en orden. La escena los anima; las pruebas y la simulación los leen tal cual.
 *
 * Cada lado es un equipo de 1 a 3 criaturas con una activa. Cambiar de criatura gasta el turno.
 * Cuando la activa se queda sin energía, ese lado debe elegir reemplazo con `reemplazar()`
 * antes del turno siguiente; el combate termina cuando un equipo no tiene a nadie en pie.
 */

export type Lado = 0 | 1;

export interface HabilidadEnCombate {
  def: Habilidad;
  usos: number;
  /** Turnos que faltan para poder usarla de nuevo. */
  enfriamiento: number;
}

export interface Combatiente {
  especie: Criatura;
  nombre: string;
  nivel: number;
  brillante: boolean;
  stats: Stats;
  ps: number;
  habilidades: HabilidadEnCombate[];
  etapas: Record<StatId, number>;
  estado: { id: EstadoId; turnos: number } | null;
  guardia: Extract<Efecto, { tipo: 'guardia' }> | null;
  ultima: string | null;
  /** Pasiva Oleaje cargada: el próximo ataque pega más fuerte. */
  oleaje: boolean;
  /** Entró alguna vez al campo (para repartir experiencia). */
  participo: boolean;
  /** Ataque Definitivo que conoce, o null. */
  definitivo: Habilidad | null;
}

export interface Equipo {
  miembros: Combatiente[];
  activo: number;
}

export type Accion =
  | { tipo: 'habilidad'; indice: number }
  | { tipo: 'empujon' }
  | { tipo: 'cambio'; indice: number }
  | { tipo: 'item'; item: Item }
  /** Ataque Definitivo de la criatura activa. */
  | { tipo: 'definitivo' }
  /** Gasta el turno en cargar el Definitivo (los lados que lo necesitan, avisando al rival). */
  | { tipo: 'cargar' };

/** Por qué no se puede usar el Definitivo ahora. */
export type MotivoDefinitivo = 'no_tiene' | 'no_permitido' | 'usado' | 'turno' | 'sin_cargar';

/** Por qué no se puede usar un ítem ahora. */
export type MotivoItem = 'limite' | 'no_es_de_combate' | 'ps_llenos' | 'sin_estado' | 'usos_llenos';

export type MotivoBloqueo = 'usos' | 'enfriamiento' | 'turno' | 'repetir';

export type Evento =
  | { t: 'turno'; n: number }
  | { t: 'cambio'; lado: Lado; indice: number; forzado: boolean }
  | { t: 'usa'; lado: Lado; habilidad: Habilidad | null }
  | { t: 'falla'; lado: Lado }
  | { t: 'dano'; lado: Lado; cantidad: number; ps: number; critico: boolean; efectividad: Efectividad; reducido: boolean }
  | { t: 'bloqueado'; lado: Lado }
  | { t: 'guardia'; lado: Lado; modo: 'reduce' | 'bloquea' }
  | { t: 'pasiva'; lado: Lado; pasiva: string }
  | { t: 'estado_aplicado'; lado: Lado; estado: EstadoId }
  | { t: 'estado_dano'; lado: Lado; estado: EstadoId; cantidad: number; ps: number }
  | { t: 'estado_fin'; lado: Lado; estado: EstadoId }
  | { t: 'estado_impide'; lado: Lado; estado: EstadoId }
  | { t: 'sin_efecto'; lado: Lado }
  | { t: 'etapa'; lado: Lado; stat: StatId; delta: number }
  | { t: 'etapa_tope'; lado: Lado; stat: StatId; delta: number }
  | { t: 'cura'; lado: Lado; cantidad: number; ps: number; origen: 'habilidad' | 'pasiva' | 'item' }
  | { t: 'item'; lado: Lado; item: Item }
  | { t: 'usos'; lado: Lado; cantidad: number }
  | { t: 'cansancio'; lado: Lado; cantidad: number; ps: number }
  | { t: 'carga'; lado: Lado }
  | { t: 'definitivo'; lado: Lado }
  | { t: 'definitivo_bloqueado'; lado: Lado }
  | { t: 'debilitado'; lado: Lado }
  | { t: 'fin'; ganador: Lado | null };

export interface OpcionesCombatiente {
  setPrueba?: boolean;
  /** Bonus porcentual a todos los stats (rareza del ejemplar). */
  potencial?: number;
  /** Bonus porcentual por stat (vitaminas). */
  extra?: Partial<Record<keyof Stats, number>>;
  brillante?: boolean;
}

export function crearCombatiente(datos: Datos, idEspecie: string, nivel: number, opciones: OpcionesCombatiente = {}): Combatiente {
  const especie = datos.criaturas.get(idEspecie);
  if (!especie) throw new Error(`Criatura inexistente: ${idEspecie}`);
  const ids = opciones.setPrueba && especie.habilidadesPrueba ? especie.habilidadesPrueba : especie.habilidades;
  const stats = calcularStats(especie, nivel, datos.balance, opciones.potencial ?? 0, opciones.extra);
  return {
    especie,
    nombre: especie.nombre,
    nivel,
    brillante: opciones.brillante ?? false,
    stats,
    ps: stats.ps,
    habilidades: ids.map((id) => ({ def: datos.habilidades.get(id)!, usos: datos.habilidades.get(id)!.usos, enfriamiento: 0 })),
    etapas: { atq: 0, def: 0, ate: 0, dfe: 0, vel: 0 },
    estado: null,
    guardia: null,
    ultima: null,
    oleaje: false,
    participo: false,
    definitivo: especie.definitivo ? (datos.habilidades.get(especie.definitivo) ?? null) : null,
  };
}

export class Batalla {
  turno = 0;
  terminado = false;
  ganador: Lado | null = null;
  readonly equipos: [Equipo, Equipo];
  /** Lados que deben elegir reemplazo antes del próximo turno. */
  pendientes: Lado[] = [];
  /** Último turno en que cada lado cambió de criatura por decisión propia. */
  ultimoCambio: [number, number] = [-9, -9];
  private turnoUltimaCaida = 0;
  /** Ítems usados por cada lado en este combate. */
  itemsUsados: [number, number] = [0, 0];
  /**
   * Ataque Definitivo: qué lados pueden usarlo (por defecto ninguno; la escena lo habilita),
   * cuáles deben cargarlo un turno antes (avisa al otro lado), si ya lo cargaron y si ya lo usaron (una vez por combate).
   */
  definitivoPermitido: [boolean, boolean] = [false, false];
  definitivoConCarga: [boolean, boolean] = [false, false];
  definitivoCargado: [boolean, boolean] = [false, false];
  definitivoUsado: [boolean, boolean] = [false, false];

  constructor(
    readonly datos: Datos,
    lados: [Combatiente | Combatiente[], Combatiente | Combatiente[]],
    private readonly rng: Rng,
  ) {
    this.equipos = lados.map((l) => ({ miembros: Array.isArray(l) ? l : [l], activo: 0 })) as [Equipo, Equipo];
    for (const e of this.equipos) {
      if (e.miembros.length === 0) throw new Error('Un equipo no puede estar vacío.');
      e.miembros[0]!.participo = true;
    }
  }

  /** Las dos criaturas activas. */
  get lados(): [Combatiente, Combatiente] {
    return [this.act(0), this.act(1)];
  }

  act(lado: Lado): Combatiente {
    const e = this.equipos[lado];
    return e.miembros[e.activo]!;
  }

  /** Índices de las criaturas en pie que no están en el campo. */
  banca(lado: Lado): number[] {
    const e = this.equipos[lado];
    return e.miembros.flatMap((m, i) => (i !== e.activo && m.ps > 0 ? [i] : []));
  }

  /** null si la habilidad se puede usar ahora; si no, el motivo. */
  bloqueo(lado: Lado, indice: number): MotivoBloqueo | null {
    return this.bloqueoEn(lado, indice, this.turno + 1);
  }

  /** Habilidades utilizables (o Empujón si no queda ninguna). No incluye los cambios. */
  accionesValidas(lado: Lado): Accion[] {
    const validas: Accion[] = [];
    this.act(lado).habilidades.forEach((_, i) => {
      if (this.bloqueo(lado, i) === null) validas.push({ tipo: 'habilidad', indice: i });
    });
    return validas.length ? validas : [{ tipo: 'empujon' }];
  }

  /** null si el Definitivo se puede usar en el próximo turno; si no, el motivo. */
  bloqueoDefinitivo(lado: Lado): MotivoDefinitivo | null {
    if (!this.act(lado).definitivo) return 'no_tiene';
    if (!this.definitivoPermitido[lado]) return 'no_permitido';
    if (this.definitivoUsado[lado]) return 'usado';
    if (this.turno + 1 < this.datos.balance.definitivo.turnoMinimo) return 'turno';
    if (this.definitivoConCarga[lado] && !this.definitivoCargado[lado]) return 'sin_cargar';
    return null;
  }

  /** ¿Puede cargar el Definitivo este turno? (lados con carga, antes de tenerlo listo) */
  puedeCargar(lado: Lado): boolean {
    const m = this.bloqueoDefinitivo(lado);
    return this.definitivoConCarga[lado] && (m === 'sin_cargar' || (m === 'turno' && this.turno + 2 >= this.datos.balance.definitivo.turnoMinimo && !this.definitivoCargado[lado]));
  }

  /** null si el ítem se puede usar ahora sobre la criatura activa; si no, el motivo. */
  bloqueoItem(lado: Lado, item: Item): MotivoItem | null {
    if (item.uso !== 'combate') return 'no_es_de_combate';
    if (this.itemsUsados[lado] >= this.datos.reglasItems.maxPorCombate) return 'limite';
    const c = this.act(lado);
    const e = item.efecto;
    if (e.tipo === 'cura' && c.ps >= c.stats.ps) return 'ps_llenos';
    if (e.tipo === 'antidoto' && !c.estado) return 'sin_estado';
    if (e.tipo === 'tonico' && c.habilidades.every((h) => h.usos >= h.def.usos)) return 'usos_llenos';
    return null;
  }

  velocidad(lado: Lado): number {
    const c = this.act(lado);
    const b = this.datos.balance;
    let v = c.stats.vel * multEtapa(c.etapas.vel, b);
    if (c.estado?.id === 'paralisis') v *= b.estados.paralisis.multVelocidad;
    return v;
  }

  /** Daño medio que haría una habilidad ahora mismo (sin crítico ni guardia). Lo usa la IA. */
  danoEsperado(lado: Lado, h: Habilidad): number {
    if (h.potencia <= 0) return 0;
    const b = this.datos.balance;
    const { dano } = this.calcular(lado, h.potencia, h.categoria, h.tipo, (b.dano.azarMin + b.dano.azarMax) / 2, false, false);
    return dano * ((h.precision ?? 100) / 100);
  }

  ejecutarTurno(a0: Accion, a1: Accion): Evento[] {
    if (this.terminado) return [];
    if (this.pendientes.length) throw new Error('Falta elegir reemplazo antes de jugar el turno.');
    const ev: Evento[] = [];
    const acciones: [Accion, Accion] = [a0, a1];
    this.turno++;
    ev.push({ t: 'turno', n: this.turno });
    this.act(0).guardia = null;
    this.act(1).guardia = null;

    const orden = this.ordenar(acciones);
    for (const lado of orden) {
      if (this.terminado) break;
      const a = acciones[lado];
      if (this.act(lado).ps <= 0) continue; // cayó antes de actuar
      if (a.tipo === 'cambio') {
        if (this.banca(lado).includes(a.indice)) {
          this.ultimoCambio[lado] = this.turno;
          this.hacerCambio(lado, a.indice, false, ev);
        }
      } else if (a.tipo === 'item') this.usarItem(lado, a.item, ev);
      else if (a.tipo === 'cargar') {
        if (this.puedeCargar(lado)) {
          this.definitivoCargado[lado] = true;
          ev.push({ t: 'carga', lado });
        } else this.actuar(lado, { tipo: 'empujon' }, ev);
      } else if (a.tipo === 'definitivo') this.actuarDefinitivo(lado, ev);
      else this.actuar(lado, a, ev);
    }
    if (!this.terminado) this.finDeTurno(orden, ev);
    if (!this.terminado && this.turno >= this.datos.balance.maxTurnos) this.terminar(null, ev);
    return ev;
  }

  /** Envía una criatura de la banca para reemplazar a la que cayó. */
  reemplazar(lado: Lado, indice: number): Evento[] {
    const ev: Evento[] = [];
    if (!this.pendientes.includes(lado) || !this.banca(lado).includes(indice)) return ev;
    this.pendientes = this.pendientes.filter((l) => l !== lado);
    this.hacerCambio(lado, indice, true, ev);
    return ev;
  }

  // ---------------------------------------------------------------- interno

  private bloqueoEn(lado: Lado, indice: number, turno: number): MotivoBloqueo | null {
    const c = this.act(lado);
    const h = c.habilidades[indice];
    if (!h || h.usos <= 0) return 'usos';
    if (h.enfriamiento > 0) return 'enfriamiento';
    if (h.def.rol === 'final' && turno < this.datos.balance.final.turnoMinimo) return 'turno';
    if (h.def.noRepetir && c.ultima === h.def.id) return 'repetir';
    return null;
  }

  /** Usar un ítem gasta el turno. Si dejó de tener efecto (p. ej. ya no hay estado), se gasta igual. */
  private usarItem(lado: Lado, item: Item, ev: Evento[]): void {
    const c = this.act(lado);
    this.itemsUsados[lado]++;
    ev.push({ t: 'item', lado, item });
    const e = item.efecto;
    if (e.tipo === 'cura') {
      const cantidad = Math.min(c.stats.ps - c.ps, Math.max(1, Math.floor((c.stats.ps * e.porcentaje) / 100)));
      if (cantidad <= 0) return void ev.push({ t: 'sin_efecto', lado });
      c.ps += cantidad;
      ev.push({ t: 'cura', lado, cantidad, ps: c.ps, origen: 'item' });
    } else if (e.tipo === 'antidoto') {
      if (!c.estado) return void ev.push({ t: 'sin_efecto', lado });
      const estado = c.estado.id;
      c.estado = null;
      ev.push({ t: 'estado_fin', lado, estado });
    } else if (e.tipo === 'tonico') {
      let total = 0;
      for (const h of c.habilidades) {
        const suma = Math.min(e.usos, h.def.usos - h.usos);
        h.usos += suma;
        total += suma;
      }
      ev.push(total > 0 ? { t: 'usos', lado, cantidad: total } : { t: 'sin_efecto', lado });
    } else if (e.tipo === 'escudo') {
      c.guardia = { tipo: 'guardia', modo: 'reduce', reduccion: e.reduccion };
      ev.push({ t: 'guardia', lado, modo: 'reduce' });
    }
  }

  private hacerCambio(lado: Lado, indice: number, forzado: boolean, ev: Evento[]): void {
    const sale = this.act(lado);
    // Al salir del campo se pierden las mejoras y la guardia; los estados y los usos se conservan.
    sale.etapas = { atq: 0, def: 0, ate: 0, dfe: 0, vel: 0 };
    sale.guardia = null;
    sale.oleaje = false;
    sale.ultima = null;
    // La carga del Definitivo es de la criatura que estaba en el campo.
    this.definitivoCargado[lado] = false;
    this.equipos[lado].activo = indice;
    this.act(lado).participo = true;
    ev.push({ t: 'cambio', lado, indice, forzado });
  }

  private prioridad(lado: Lado, a: Accion): number {
    if (a.tipo === 'cambio' || a.tipo === 'item') return 5;
    return a.tipo === 'habilidad' ? (this.act(lado).habilidades[a.indice]?.def.prioridad ?? 0) : 0;
  }

  private ordenar(acciones: [Accion, Accion]): [Lado, Lado] {
    const p0 = this.prioridad(0, acciones[0]);
    const p1 = this.prioridad(1, acciones[1]);
    if (p0 !== p1) return p0 > p1 ? [0, 1] : [1, 0];
    const v0 = this.velocidad(0);
    const v1 = this.velocidad(1);
    if (v0 !== v1) return v0 > v1 ? [0, 1] : [1, 0];
    return this.rng.prob(50) ? [0, 1] : [1, 0];
  }

  /** Mecánica de la pasiva de una criatura (las pasivas con alias funcionan como una de las tres básicas). */
  private mecanica(c: Combatiente): string {
    return this.datos.balance.pasivasAlias[c.especie.pasiva]?.mecanica ?? c.especie.pasiva;
  }

  private calcular(lado: Lado, potencia: number, categoria: Habilidad['categoria'], tipo: string, azar: number, critico: boolean, consumir: boolean) {
    const yo = this.act(lado);
    const rival = this.act((1 - lado) as Lado);
    const b = this.datos.balance;
    let otros = 1;
    // En combates de equipo se pega más fuerte, para que 3 contra 3 no se haga largo.
    if (this.equipos.some((e) => e.miembros.length > 1)) otros *= b.dano.equipos;
    if (this.mecanica(yo) === 'ultimo_rescoldo' && yo.ps / yo.stats.ps < b.pasivas.ultimo_rescoldo.umbralPs) otros *= b.pasivas.ultimo_rescoldo.mult;
    if (yo.oleaje) otros *= b.pasivas.oleaje.mult;
    if (yo.estado?.id === 'quemadura' && categoria === 'fisica') otros *= b.estados.quemadura.multFisico;
    if (consumir) yo.oleaje = false;
    return calcularDano(
      {
        potencia,
        categoria,
        tipoHabilidad: tipo,
        nivel: yo.nivel,
        tipoAtacante: yo.especie.tipo,
        tipoDefensor: rival.especie.tipo,
        statsAtacante: yo.stats,
        statsDefensor: rival.stats,
        etapasAtacante: yo.etapas,
        etapasDefensor: rival.etapas,
        azar,
        critico,
        otros,
      },
      b,
      this.datos.tipos,
    );
  }

  /** Tras una caída: o el combate termina, o ese lado queda pendiente de reemplazo. */
  private trasCaida(lado: Lado, ev: Evento[]): void {
    ev.push({ t: 'debilitado', lado });
    this.turnoUltimaCaida = this.turno;
    if (this.banca(lado).length === 0) this.terminar((1 - lado) as Lado, ev);
    else if (!this.pendientes.includes(lado)) this.pendientes.push(lado);
  }

  /** Impide actuar por sueño o parálisis (como en `actuar`). Devuelve true si la criatura no actúa. */
  private impedido(lado: Lado, ev: Evento[]): boolean {
    const yo = this.act(lado);
    const b = this.datos.balance;
    if (yo.estado?.id === 'sueno') {
      if (yo.estado.turnos > 0) {
        yo.estado.turnos--;
        ev.push({ t: 'estado_impide', lado, estado: 'sueno' });
        return true;
      }
      yo.estado = null;
      ev.push({ t: 'estado_fin', lado, estado: 'sueno' });
    }
    if (yo.estado?.id === 'paralisis' && this.rng.prob(b.estados.paralisis.probPerderTurno)) {
      ev.push({ t: 'estado_impide', lado, estado: 'paralisis' });
      return true;
    }
    return false;
  }

  /**
   * Ataque Definitivo: deja al rival sin energía, sin importar vida, nivel ni tipo.
   * Si el rival se cubrió este turno (cualquier guardia), lo resiste y el Definitivo se pierde.
   */
  private actuarDefinitivo(lado: Lado, ev: Evento[]): void {
    const yo = this.act(lado);
    const ladoRival = (1 - lado) as Lado;
    const rival = this.act(ladoRival);
    if (rival.ps <= 0) return;
    if (this.bloqueoDefinitivo(lado) !== null || !yo.definitivo) return this.actuar(lado, { tipo: 'empujon' }, ev);
    if (this.impedido(lado, ev)) return;
    this.definitivoUsado[lado] = true;
    this.definitivoCargado[lado] = false;
    yo.ultima = yo.definitivo.id;
    ev.push({ t: 'usa', lado, habilidad: yo.definitivo });
    if (rival.guardia) {
      ev.push({ t: 'definitivo_bloqueado', lado: ladoRival });
      return;
    }
    ev.push({ t: 'definitivo', lado });
    const cantidad = rival.ps;
    rival.ps = 0;
    ev.push({ t: 'dano', lado: ladoRival, cantidad, ps: 0, critico: false, efectividad: 'neutro', reducido: false });
    this.trasCaida(ladoRival, ev);
  }

  private actuar(lado: Lado, accion: Accion, ev: Evento[]): void {
    const yo = this.act(lado);
    const ladoRival = (1 - lado) as Lado;
    const rival = this.act(ladoRival);
    const b = this.datos.balance;
    if (rival.ps <= 0) return; // el rival ya cayó este turno: no hay a quién atacar
    if (this.impedido(lado, ev)) return;

    // Si la acción elegida ya no es válida, se convierte en Empujón.
    const hc = accion.tipo === 'habilidad' && this.bloqueoEn(lado, accion.indice, this.turno) === null ? yo.habilidades[accion.indice]! : null;
    const h = hc?.def ?? null;
    if (hc && h) {
      hc.usos--;
      // +1 porque el fin de este mismo turno ya descuenta uno.
      if (h.enfriamiento > 0) hc.enfriamiento = h.enfriamiento + 1;
      yo.ultima = h.id;
    } else {
      yo.ultima = null;
    }
    ev.push({ t: 'usa', lado, habilidad: h });

    const potencia = h ? h.potencia : b.empujon.potencia;
    const categoria = h ? h.categoria : 'fisica';
    const tipo = h ? h.tipo : 'neutro';
    const apuntaAlRival = potencia > 0 || (h?.efectos.some((e) => (e.tipo === 'estado' || e.tipo === 'etapa') && e.objetivo === 'rival') ?? false);

    if (h && h.precision !== null && !this.rng.prob(h.precision)) {
      ev.push({ t: 'falla', lado });
      return;
    }
    if (apuntaAlRival && rival.guardia?.modo === 'bloquea') {
      ev.push({ t: 'bloqueado', lado: ladoRival });
      return;
    }

    if (potencia > 0) {
      const azar = b.dano.azarMin + this.rng.sig() * (b.dano.azarMax - b.dano.azarMin);
      const critico = this.rng.prob(b.dano.criticoProb + (this.velocidad(lado) > this.velocidad(ladoRival) ? b.dano.criticoBonusVeloz : 0));
      const usabaPasiva = this.mecanica(yo) === 'ultimo_rescoldo' && yo.ps / yo.stats.ps < b.pasivas.ultimo_rescoldo.umbralPs;
      const res = this.calcular(lado, potencia, categoria, tipo, azar, critico, true);
      let dano = res.dano;
      const g = rival.guardia;
      const reducido = g?.modo === 'reduce';
      if (reducido) dano = Math.max(1, Math.floor(dano * (1 - (g.reduccion ?? 0))));
      dano = Math.min(dano, rival.ps);
      rival.ps -= dano;
      if (usabaPasiva) ev.push({ t: 'pasiva', lado, pasiva: yo.especie.pasiva });
      ev.push({ t: 'dano', lado: ladoRival, cantidad: dano, ps: rival.ps, critico, efectividad: res.efectividad, reducido });
      if (reducido && g.contraEstado && (!g.contraEstado.soloFisico || categoria === 'fisica') && this.rng.prob(g.contraEstado.prob)) {
        this.aplicarEstado(lado, g.contraEstado.estado, ev, false);
      }
      if (rival.ps <= 0) {
        this.trasCaida(ladoRival, ev);
        return;
      }
    }

    for (const e of h?.efectos ?? []) {
      const destino = e.tipo === 'estado' || e.tipo === 'etapa' ? (e.objetivo === 'rival' ? ladoRival : lado) : lado;
      const esPrincipal = potencia === 0;
      switch (e.tipo) {
        case 'estado':
          if (this.rng.prob(e.prob)) this.aplicarEstado(destino, e.estado, ev, esPrincipal);
          break;
        case 'etapa': {
          if (!this.rng.prob(e.prob)) break;
          const c = this.act(destino);
          const antes = c.etapas[e.stat];
          const despues = Math.max(-b.etapas.max, Math.min(b.etapas.max, antes + e.delta));
          if (despues === antes) {
            if (esPrincipal) ev.push({ t: 'etapa_tope', lado: destino, stat: e.stat, delta: e.delta });
          } else {
            c.etapas[e.stat] = despues;
            ev.push({ t: 'etapa', lado: destino, stat: e.stat, delta: despues - antes });
          }
          break;
        }
        case 'cura': {
          const cantidad = Math.min(yo.stats.ps - yo.ps, Math.floor((yo.stats.ps * e.porcentaje) / 100));
          if (cantidad <= 0) {
            ev.push({ t: 'sin_efecto', lado });
          } else {
            yo.ps += cantidad;
            ev.push({ t: 'cura', lado, cantidad, ps: yo.ps, origen: 'habilidad' });
          }
          break;
        }
        case 'guardia':
          yo.guardia = e;
          ev.push({ t: 'guardia', lado, modo: e.modo });
          break;
      }
    }

    if (h && h.rol === 'soporte' && this.mecanica(yo) === 'oleaje' && !yo.oleaje) {
      yo.oleaje = true;
      ev.push({ t: 'pasiva', lado, pasiva: yo.especie.pasiva });
    }
  }

  private aplicarEstado(lado: Lado, estado: EstadoId, ev: Evento[], avisarSiFalla: boolean): void {
    const c = this.act(lado);
    const b = this.datos.balance;
    if (c.ps <= 0) return;
    if (c.estado || b.estados[estado].inmunes.includes(c.especie.tipo)) {
      if (avisarSiFalla) ev.push({ t: 'sin_efecto', lado });
      return;
    }
    const turnos = estado === 'sueno' ? this.rng.entero(b.estados.sueno.turnosMin, b.estados.sueno.turnosMax) : b.estados[estado].turnos;
    c.estado = { id: estado, turnos };
    ev.push({ t: 'estado_aplicado', lado, estado });
  }

  private finDeTurno(orden: [Lado, Lado], ev: Evento[]): void {
    const b = this.datos.balance;
    for (const lado of orden) {
      const c = this.act(lado);
      if (this.terminado) return;
      if (c.ps <= 0) continue;

      const est = c.estado;
      if (est && (est.id === 'quemadura' || est.id === 'veneno')) {
        const cantidad = Math.min(c.ps, Math.max(1, Math.floor(c.stats.ps / b.estados[est.id].danoDivisor)));
        c.ps -= cantidad;
        ev.push({ t: 'estado_dano', lado, estado: est.id, cantidad, ps: c.ps });
        if (c.ps <= 0) {
          this.trasCaida(lado, ev);
          continue;
        }
      }
      if (this.mecanica(c) === 'raices' && c.ps < c.stats.ps) {
        const cantidad = Math.min(c.stats.ps - c.ps, Math.max(1, Math.floor(c.stats.ps / b.pasivas.raices.curaDivisor)));
        c.ps += cantidad;
        ev.push({ t: 'cura', lado, cantidad, ps: c.ps, origen: 'pasiva' });
      }
      if (est && est.id !== 'sueno') {
        est.turnos--;
        if (est.turnos <= 0) {
          c.estado = null;
          ev.push({ t: 'estado_fin', lado, estado: est.id });
        }
      }
      for (const h of c.habilidades) if (h.enfriamiento > 0) h.enfriamiento--;
    }
    // Cansancio: regla anti-bloqueo. Si pasan muchos turnos sin que nadie caiga, ambos pierden PS.
    if (!this.terminado && this.turno - this.turnoUltimaCaida >= b.cansancio.desdeTurno) {
      for (const lado of orden) {
        const c = this.act(lado);
        if (this.terminado) return;
        if (c.ps <= 0) continue;
        const cantidad = Math.min(c.ps, Math.max(1, Math.floor(c.stats.ps / b.cansancio.danoDivisor)));
        c.ps -= cantidad;
        ev.push({ t: 'cansancio', lado, cantidad, ps: c.ps });
        if (c.ps <= 0) this.trasCaida(lado, ev);
      }
    }
  }

  private terminar(ganador: Lado | null, ev: Evento[]): void {
    if (this.terminado) return;
    this.terminado = true;
    this.ganador = ganador;
    this.pendientes = [];
    ev.push({ t: 'fin', ganador });
  }
}
