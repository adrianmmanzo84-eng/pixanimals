import type { EstadoJuego } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { Rng } from '../rng';
import { agregar } from '../items/items';
import { crearCombatiente, type Combatiente } from '../combate/motor';

/**
 * Mina Pixel: la criatura cava hacia abajo, bloque a bloque, en una cuadrícula de `columnas` de ancho.
 * Se mueve a izquierda y derecha y cava hacia abajo (nunca hacia arriba). Tiene Vida (corazones) y Energía
 * (cada golpe de pico cuesta 1). En el camino: monedas, gemas de experiencia, bayas (energía), cofres (ítems),
 * corazones; y peligros: pinchos, rocas que caen, gas, lava, bombas, bloques irrompibles.
 * Cada zona mide `profundidadZona` filas; al fondo está la guarida de su monstruo.
 * Las filas se generan a pedido con una semilla: la misma semilla da la misma mina.
 * Aquí está solo la lógica; la escena `MiniMina` dibuja y anima los eventos que devuelve.
 */

export type Bloque =
  | 'aire'
  | 'tierra'
  | 'piedra'
  | 'dura'
  | 'roca'
  | 'irrompible'
  | 'moneda'
  | 'gema'
  | 'baya'
  | 'cofre'
  | 'corazon'
  | 'pinchos'
  | 'gas'
  | 'lava'
  | 'bomba'
  | 'guarida';

/** Golpes de pico para romper cada bloque (0 = no se puede cavar). */
export const DUREZA: Record<Bloque, number> = {
  aire: 0, tierra: 1, piedra: 2, dura: 3, roca: 2, irrompible: 0, moneda: 1, gema: 2, baya: 1,
  cofre: 2, corazon: 1, pinchos: 1, gas: 1, lava: 0, bomba: 1, guarida: 0,
};

export interface Celda {
  b: Bloque;
  /** Golpes que le faltan para romperse. */
  resto: number;
}

export type EventoMina =
  | { t: 'mover'; x: number; y: number }
  | { t: 'caer'; x: number; y: number }
  | { t: 'golpe'; x: number; y: number; resto: number }
  | { t: 'romper'; x: number; y: number; b: Bloque }
  | { t: 'botin'; x: number; y: number; tipo: 'monedas' | 'xp' | 'energia' | 'vida' | 'item'; n: number; item?: string }
  | { t: 'dano'; n: number; causa: 'pinchos' | 'roca' | 'gas' | 'lava' | 'bomba' }
  | { t: 'roca'; x: number; desde: number; hasta: number }
  | { t: 'explosion'; x: number; y: number }
  | { t: 'enfriar'; x: number; y: number }
  | { t: 'zona'; zona: number }
  | { t: 'guarida'; zona: number }
  | { t: 'fin'; causa: 'vida' | 'energia' | 'guarida' };

export type Direccion = 'izq' | 'der' | 'abajo';

export class Mina {
  readonly columnas: number;
  readonly zonaInicial: number;
  /** Fila donde empieza la mina (la de la zona inicial: (zona − 1) × profundidad). */
  readonly filaInicial: number;
  x: number;
  y: number;
  vida: number;
  energia: number;
  readonly energiaMax: number;
  monedas = 0;
  xp = 0;
  items: string[] = [];
  terminada = false;
  causaFin: 'vida' | 'energia' | 'guarida' | null = null;
  private filas = new Map<number, Celda[]>();

  constructor(
    private readonly datos: Datos,
    zona: number,
    private readonly semilla: number,
  ) {
    const m = datos.economia.mina;
    this.columnas = m.columnas;
    this.zonaInicial = zona;
    this.filaInicial = (zona - 1) * m.profundidadZona;
    this.x = Math.floor(this.columnas / 2);
    this.y = this.filaInicial;
    this.vida = m.vida;
    // Las zonas hondas tienen bloques más duros: se arranca con más energía.
    this.energiaMax = m.energia + m.energiaPorZona * (zona - 1);
    this.energia = this.energiaMax;
  }

  /** Filas cavadas desde el inicio de esta vuelta. */
  get profundidad(): number {
    return this.y - this.filaInicial;
  }

  /** Metros desde la superficie (para mostrar). */
  get metros(): number {
    return this.y;
  }

  /** Zona de una fila: la 1 va de la fila 1 a la `profundidadZona` (su guarida), la 2 hasta el doble, etc. */
  zonaDe(fila: number): number {
    return Math.min(this.datos.economia.mina.zonas.length, Math.max(1, Math.ceil(fila / this.datos.economia.mina.profundidadZona)));
  }

  /** Fila de la guarida de una zona (el piso que no se puede cavar al final de la zona). */
  filaGuarida(zona: number): number {
    return zona * this.datos.economia.mina.profundidadZona;
  }

  celda(x: number, y: number): Celda {
    if (x < 0 || x >= this.columnas) return { b: 'irrompible', resto: 0 };
    return this.fila(y)[x]!;
  }

  /** Pone un bloque (lo usan las pruebas y la explosión de las bombas). */
  poner(x: number, y: number, b: Bloque): void {
    this.fila(y)[x] = { b, resto: DUREZA[b] };
  }

  private fila(y: number): Celda[] {
    let f = this.filas.get(y);
    if (!f) {
      f = this.generarFila(y);
      this.filas.set(y, f);
    }
    return f;
  }

  /** Genera una fila según la zona y qué tan adentro de ella está (los peligros crecen hacia el fondo). */
  private generarFila(y: number): Celda[] {
    const m = this.datos.economia.mina;
    const c = (b: Bloque): Celda => ({ b, resto: DUREZA[b] });
    // La fila de arranque de la vuelta es aire (ahí se para la criatura); las anteriores, también.
    if (y <= this.filaInicial) return Array.from({ length: this.columnas }, () => c('aire'));
    const zona = this.zonaDe(y);
    if (y === this.filaGuarida(zona)) return Array.from({ length: this.columnas }, () => c('guarida'));
    const z = m.zonas[zona - 1]!;
    const rng = new Rng((this.semilla ^ Math.imul(y + 1, 2654435761)) >>> 0);
    const dentro = ((y - 1) % m.profundidadZona) / m.profundidadZona; // 0 arriba de la zona, ~1 al fondo
    const pesos = Object.entries(z.bloques).map(([b, p]) => {
      const peligro = b === 'pinchos' || b === 'gas' || b === 'lava' || b === 'bomba' || b === 'roca' || b === 'dura';
      return [b as Bloque, peligro ? p * (0.6 + dentro * 0.9) : p] as const;
    });
    const total = pesos.reduce((s, [, p]) => s + p, 0);
    const tirar = (): Bloque => {
      let r = rng.sig() * total;
      for (const [b, p] of pesos) if ((r -= p) < 0) return b;
      return 'tierra';
    };
    // Las primeras filas de cada vuelta son amables (nada que dañe al empezar).
    const amable = y - this.filaInicial <= 2;
    const fila = Array.from({ length: this.columnas }, () => {
      let b = tirar();
      if (amable && (b === 'pinchos' || b === 'gas' || b === 'lava' || b === 'bomba' || b === 'roca' || b === 'irrompible')) b = 'tierra';
      return c(b);
    });
    // Pequeñas cuevas de aire para variar el camino.
    if (!amable && rng.prob(z.cuevas)) {
      const x0 = rng.entero(0, this.columnas - 3);
      for (let i = 0; i < rng.entero(2, 4); i++) if (x0 + i < this.columnas) fila[x0 + i] = c('aire');
    }
    // Nunca una fila entera irrompible: siempre queda al menos un paso.
    if (fila.every((x) => x.b === 'irrompible' || x.b === 'lava')) fila[rng.entero(0, this.columnas - 1)] = c('tierra');
    return fila;
  }

  private daniar(n: number, causa: Extract<EventoMina, { t: 'dano' }>['causa'], ev: EventoMina[]): void {
    this.vida = Math.max(0, this.vida - n);
    ev.push({ t: 'dano', n, causa });
  }

  /** Mover o cavar en una dirección. Devuelve lo que pasó, en orden, para animarlo. */
  accion(dir: Direccion): EventoMina[] {
    const ev: EventoMina[] = [];
    if (this.terminada) return ev;
    const tx = this.x + (dir === 'izq' ? -1 : dir === 'der' ? 1 : 0);
    const ty = this.y + (dir === 'abajo' ? 1 : 0);
    const cel = this.celda(tx, ty);
    if (cel.b === 'aire') {
      this.x = tx;
      this.y = ty;
      ev.push({ t: 'mover', x: tx, y: ty });
      this.caer(ev);
    } else if (cel.b === 'lava') {
      // Meterse en la lava quema, pero la enfría (queda piedra).
      this.daniar(2, 'lava', ev);
      this.poner(tx, ty, 'piedra');
      ev.push({ t: 'enfriar', x: tx, y: ty });
    } else if (DUREZA[cel.b] > 0) {
      if (this.energia <= 0) return this.revisarFin(ev);
      this.energia--;
      cel.resto--;
      if (cel.resto > 0) ev.push({ t: 'golpe', x: tx, y: ty, resto: cel.resto });
      else this.romper(tx, ty, ev);
    }
    return this.revisarFin(ev);
  }

  private romper(x: number, y: number, ev: EventoMina[]): void {
    const b = this.celda(x, y).b;
    this.poner(x, y, 'aire');
    ev.push({ t: 'romper', x, y, b });
    const z = this.datos.economia.mina.zonas[this.zonaDe(y) - 1]!;
    const rng = new Rng((this.semilla ^ Math.imul(x + 31 * y + 7, 0x9e3779b1)) >>> 0);
    switch (b) {
      case 'moneda': {
        const n = z.monedas + rng.entero(0, z.monedas);
        this.monedas += n;
        ev.push({ t: 'botin', x, y, tipo: 'monedas', n });
        break;
      }
      case 'gema':
        this.xp += z.xp;
        ev.push({ t: 'botin', x, y, tipo: 'xp', n: z.xp });
        break;
      case 'baya': {
        const n = Math.min(this.energiaMax - this.energia, this.datos.economia.mina.baya);
        this.energia += n;
        ev.push({ t: 'botin', x, y, tipo: 'energia', n });
        break;
      }
      case 'corazon':
        if (this.vida < this.datos.economia.mina.vida) this.vida++;
        ev.push({ t: 'botin', x, y, tipo: 'vida', n: 1 });
        break;
      case 'cofre': {
        const total = z.cofre.reduce((s, c) => s + c.peso, 0);
        let r = rng.sig() * total;
        const item = z.cofre.find((c) => (r -= c.peso) < 0)?.item ?? z.cofre[0]!.item;
        this.items.push(item);
        ev.push({ t: 'botin', x, y, tipo: 'item', n: 1, item });
        break;
      }
      case 'gas':
        this.daniar(1, 'gas', ev);
        break;
      case 'bomba':
        ev.push({ t: 'explosion', x, y });
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const cx = x + dx;
            const cy = y + dy;
            if (cx < 0 || cx >= this.columnas || cy <= this.filaInicial) continue;
            const b2 = this.celda(cx, cy).b;
            if (b2 !== 'irrompible' && b2 !== 'guarida' && b2 !== 'aire') this.poner(cx, cy, 'aire');
          }
        this.daniar(1, 'bomba', ev);
        break;
    }
    // Lo que se rompe debajo de la criatura la hace caer.
    this.caer(ev);
  }

  /** La criatura cae mientras haya aire debajo; caer sobre pinchos duele. Al tocar la guarida, termina la vuelta. */
  private caer(ev: EventoMina[]): void {
    const z0 = this.zonaDe(this.y);
    while (this.celda(this.x, this.y + 1).b === 'aire') {
      this.y++;
      ev.push({ t: 'caer', x: this.x, y: this.y });
    }
    const abajo = this.celda(this.x, this.y + 1).b;
    if (abajo === 'pinchos' && ev.some((e) => e.t === 'caer')) this.daniar(1, 'pinchos', ev);
    // Pararse sobre lava quema y la enfría (queda piedra).
    if (abajo === 'lava') {
      this.daniar(2, 'lava', ev);
      this.poner(this.x, this.y + 1, 'piedra');
      ev.push({ t: 'enfriar', x: this.x, y: this.y + 1 });
    }
    const z1 = this.zonaDe(this.y);
    if (z1 !== z0) {
      ev.push({ t: 'zona', zona: z1 });
    }
    if (abajo === 'guarida' && !this.terminada) {
      this.terminada = true;
      this.causaFin = 'guarida';
      ev.push({ t: 'guarida', zona: this.zonaDe(this.y) });
    }
  }

  /**
   * Gravedad de las rocas (la escena la llama cada tanto): una roca sin apoyo baja una fila por llamada.
   * Si cae sobre la criatura, la daña y se rompe.
   */
  gravedad(): EventoMina[] {
    const ev: EventoMina[] = [];
    if (this.terminada) return ev;
    for (let y = this.y + 12; y >= Math.max(this.filaInicial + 1, this.y - 12); y--) {
      for (let x = 0; x < this.columnas; x++) {
        if (this.celda(x, y).b !== 'roca' || this.celda(x, y + 1).b !== 'aire') continue;
        if (x === this.x && y + 1 === this.y) {
          this.poner(x, y, 'aire');
          ev.push({ t: 'roca', x, desde: y, hasta: y + 1 });
          this.daniar(2, 'roca', ev);
          continue;
        }
        this.poner(x, y, 'aire');
        this.poner(x, y + 1, 'roca');
        ev.push({ t: 'roca', x, desde: y, hasta: y + 1 });
      }
    }
    return this.revisarFin(ev);
  }

  private revisarFin(ev: EventoMina[]): EventoMina[] {
    if (this.terminada && this.causaFin === 'guarida') {
      if (!ev.some((e) => e.t === 'fin')) ev.push({ t: 'fin', causa: 'guarida' });
      return ev;
    }
    if (this.vida <= 0) this.causaFin = 'vida';
    else if (this.energia <= 0 && !this.puedeMoverseGratis()) this.causaFin = 'energia';
    if (this.causaFin) {
      this.terminada = true;
      ev.push({ t: 'fin', causa: this.causaFin });
    }
    return ev;
  }

  /** Sin energía todavía se puede caminar por aire o caer: solo termina si no queda ningún movimiento. */
  private puedeMoverseGratis(): boolean {
    return [this.celda(this.x - 1, this.y).b, this.celda(this.x + 1, this.y).b, this.celda(this.x, this.y + 1).b].includes('aire');
  }

  /** Puntaje para el premio del minijuego: la profundidad relativa a una zona. */
  puntaje(): number {
    if (this.causaFin === 'guarida') return 1;
    return Math.min(1, this.profundidad / this.datos.economia.mina.profundidadZona);
  }
}

// ------------------------------------------------------------------ progreso guardado

/** ¿Hasta qué zona llega el ascensor? (1 = solo la primera). */
export function zonaMaxima(datos: Datos, estado: EstadoJuego): number {
  return Math.min(datos.economia.mina.zonas.length, estado.mina.zonaMax);
}

export interface ResultadoMina {
  monedas: number;
  xp: number;
  items: string[];
  /** Zona cuya guarida se alcanzó (o null). */
  guarida: number | null;
}

/**
 * Cobra lo encontrado (si la partida es con premio) y registra la guarida alcanzada.
 * La experiencia va a la criatura que cavó; los ítems, a la Bolsa.
 */
export function cobrarMina(datos: Datos, estado: EstadoJuego, mina: Mina, conPremio: boolean): ResultadoMina {
  const guarida = mina.causaFin === 'guarida' ? mina.zonaDe(mina.y) : null;
  if (!conPremio) return { monedas: 0, xp: 0, items: [], guarida };
  estado.monedas += mina.monedas;
  for (const it of mina.items) agregar(estado, it);
  return { monedas: mina.monedas, xp: mina.xp, items: [...mina.items], guarida };
}

/** Monstruo de una zona (especie en su forma final) o null si todavía no tiene. */
export function monstruoDe(datos: Datos, zona: number): string | null {
  const id = datos.economia.mina.zonas[zona - 1]?.monstruo ?? null;
  return id && datos.criaturas.has(id) ? id : null;
}

/** Rival de la guarida: el monstruo solo, al nivel de su zona (es un jefe: lo acompañan tantos como criaturas lleves, hasta 3). */
export function equipoGuarida(datos: Datos, zona: number, cuantos: number): Combatiente[] {
  const id = monstruoDe(datos, zona);
  if (!id) return [];
  const nivel = datos.economia.mina.zonas[zona - 1]!.nivel;
  // El monstruo sale primero y uno o dos puntos más fuerte; detrás, sus formas intermedias para no pelear 1 contra 3.
  const fam = datos.criaturas.get(id)!.familia;
  const otros = [...datos.criaturas.values()].filter((c) => c.familia === fam && c.id !== id).sort((a, b) => b.etapa - a.etapa);
  const equipo = [crearCombatiente(datos, id, nivel + 2)];
  for (const c of otros.slice(0, Math.max(0, Math.min(3, cuantos) - 1))) equipo.push(crearCombatiente(datos, c.id, nivel));
  return equipo;
}

/** Abre un huevo listo: quita el huevo y devuelve la especie (la escena llama a `recibir`). */
export function abrirHuevo(estado: EstadoJuego, ahora: number): string | null {
  const i = estado.mina.huevos.findIndex((h) => h.eclosiona <= ahora);
  if (i < 0) return null;
  return estado.mina.huevos.splice(i, 1)[0]!.especie;
}

/** Forma base (etapa 1) de la familia de una especie. */
export function criaDe(datos: Datos, especie: string): string | null {
  const fam = datos.criaturas.get(especie)?.familia;
  return [...datos.criaturas.values()].find((c) => c.familia === fam && c.etapa === 1)?.id ?? null;
}

/**
 * Guarida vencida (o, si la zona aún no tiene monstruo, alcanzada): abre el ascensor a la zona siguiente.
 * Con monstruo, la primera victoria da un huevo con su cría; las siguientes, monedas.
 */
export function vencerGuarida(datos: Datos, estado: EstadoJuego, zona: number, ahora: number): { huevo: string | null; monedas: number } {
  const m = datos.economia.mina;
  estado.mina.zonaMax = Math.max(estado.mina.zonaMax, Math.min(m.zonas.length, zona + 1));
  estado.mina.guaridas = [...new Set([...(estado.mina.guaridas ?? []), zona])].sort((a, b) => a - b);
  const monstruo = monstruoDe(datos, zona);
  const cria = monstruo ? criaDe(datos, monstruo) : null;
  const yaTiene = cria && (estado.mina.huevos.some((h) => h.especie === cria) || estado.criaturas.some((c) => datos.criaturas.get(c.especie)?.familia === datos.criaturas.get(cria)?.familia));
  if (cria && !yaTiene) {
    estado.mina.huevos.push({ especie: cria, eclosiona: ahora + m.eclosionHoras * 3_600_000 });
    return { huevo: cria, monedas: 0 };
  }
  const monedas = m.premioGuarida * zona;
  estado.monedas += monedas;
  return { huevo: null, monedas };
}

/** Huevos listos para abrir (el menú los anuncia). */
export function huevosListos(estado: EstadoJuego, ahora: number): { especie: string; eclosiona: number }[] {
  return estado.mina.huevos.filter((h) => h.eclosiona <= ahora);
}
