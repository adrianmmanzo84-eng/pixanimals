import { DATOS } from './core/datos';
import { AlmacenLocal, deserializar, serializar, type Almacen } from './core/estado/guardado';
import { elegirRecuperacion } from './core/estado/respaldo';
import { estadoNuevo } from './core/estado/juego';
import { CLAVE_ACTIVA, CLAVE_FECHAS, claveLocal, esRanura, leerFechas, TODAS, type Ranura } from './core/estado/ranuras';
import type { EstadoJuego } from './esquemas/esquemas';
import { borrarRespaldos, guardarRespaldo, leerRespaldos } from './respaldoIdb';
import { borrarNativo, guardarNativo, leerNativo } from './nativo';

/**
 * Partida en curso. Las escenas la leen y, tras cada cambio importante, llaman a guardar().
 * Hay 3 ranuras de guardado (D279); la partida en curso es la de la ranura activa.
 */
function leerTexto(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}
function escribirTexto(clave: string, valor: string): void {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* sin almacenamiento */
  }
}

function ranuraGuardada(): Ranura {
  const n = Number(leerTexto(CLAVE_ACTIVA));
  return esRanura(n) ? n : 1;
}

const almacenes = new Map<Ranura, Almacen>(TODAS.map((r) => [r, new AlmacenLocal(claveLocal(r))]));
const almacen = (r: Ranura): Almacen => almacenes.get(r)!;
let pendiente: ReturnType<typeof setTimeout> | null = null;

/**
 * Si hay un guardado que no se puede leer (dañado, o de una versión más nueva del juego), se aparta antes de
 * escribir nada encima (D247): así no se pierde y se puede revisar o recuperar a mano.
 */
function leerRanura(r: Ranura): EstadoJuego | null {
  const crudo = almacen(r).leer();
  const e = deserializar(crudo);
  if (crudo && !e) escribirTexto(`${claveLocal(r)}.ilegible`, crudo);
  return e;
}

function marcarFecha(r: Ranura, en: number): void {
  const f = leerFechas(leerTexto(CLAVE_FECHAS));
  f[r] = en;
  escribirTexto(CLAVE_FECHAS, JSON.stringify(f));
}

/** Lo guardado en una ranura (o en sus copias, si el guardado principal se perdió). */
export interface ContenidoRanura {
  estado: EstadoJuego;
  /** Último guardado (ms), si se conoce. */
  en: number | null;
}

const inicial = ranuraGuardada();

export const juego = {
  /** Ranura de guardado en uso. */
  ranura: inicial,
  estado: leerRanura(inicial) ?? estadoNuevo(DATOS, Date.now()),
  /** La partida se recuperó de la copia de seguridad al abrir (el menú lo avisa una vez). */
  recuperada: false,
  /** Modo prueba (?prueba): la partida vive solo en memoria y nunca se guarda. */
  prueba: false,
  guardar(): void {
    if (this.prueba) return;
    const texto = serializar(this.estado);
    const r = this.ranura;
    almacen(r).escribir(texto);
    marcarFecha(r, Date.now());
    // Copia en el segundo almacén, agrupando los guardados seguidos.
    if (pendiente) clearTimeout(pendiente);
    pendiente = setTimeout(() => {
      void guardarRespaldo(texto, Date.now(), r);
      // En la app de Android, además, en el almacén de la app (D245).
      guardarNativo(texto, Date.now(), r);
    }, 800);
  },
  reemplazar(estado: EstadoJuego): void {
    this.estado = estado;
    this.guardar();
  },
  /** Borra la partida de la ranura en uso y deja una nueva (sin guardar) en su lugar. */
  borrar(): void {
    this.borrarRanura(this.ranura);
    this.estado = estadoNuevo(DATOS, Date.now());
  },
  /** Borra una ranura (guardado, copias y almacén de la app). */
  borrarRanura(r: Ranura): void {
    if (r === this.ranura && pendiente) {
      clearTimeout(pendiente);
      pendiente = null;
    }
    almacen(r).borrar();
    void borrarRespaldos(r);
    borrarNativo(r);
    const f = leerFechas(leerTexto(CLAVE_FECHAS));
    delete f[r];
    escribirTexto(CLAVE_FECHAS, JSON.stringify(f));
  },
  /** Qué hay en cada ranura (para la pantalla «Elige tu partida»). Usa las copias si el guardado principal falta. */
  async ranuras(): Promise<Record<Ranura, ContenidoRanura | null>> {
    const fechas = leerFechas(leerTexto(CLAVE_FECHAS));
    const res = {} as Record<Ranura, ContenidoRanura | null>;
    for (const r of TODAS) {
      const e = leerRanura(r);
      if (e) {
        res[r] = { estado: e, en: fechas[r] ?? null };
        continue;
      }
      const nativo = await leerNativo(r);
      const rec = elegirRecuperacion(null, [...(await leerRespaldos(r)), ...(nativo ? [nativo] : [])]);
      res[r] = rec ? { estado: rec.estado, en: rec.desde.en } : null;
    }
    return res;
  },
  /**
   * Pasa a jugar en la ranura r: carga su partida (recuperándola de las copias si hace falta) o, si está vacía,
   * una partida nueva que empieza por el prólogo. Devuelve si había partida.
   */
  async usarRanura(r: Ranura): Promise<boolean> {
    if (pendiente) {
      // Lo pendiente de la ranura anterior se escribe ya, antes de cambiar.
      clearTimeout(pendiente);
      pendiente = null;
      if (!this.prueba) {
        const texto = serializar(this.estado);
        void guardarRespaldo(texto, Date.now(), this.ranura);
        guardarNativo(texto, Date.now(), this.ranura);
      }
    }
    this.ranura = r;
    escribirTexto(CLAVE_ACTIVA, String(r));
    this.recuperada = false;
    const e = leerRanura(r);
    if (e) {
      this.estado = e;
      return true;
    }
    this.estado = estadoNuevo(DATOS, Date.now());
    await this.recuperar();
    return this.recuperada;
  },
  /** Al abrir: si el guardado principal falta o está dañado, recupera la copia válida más reciente. */
  async recuperar(): Promise<void> {
    if (this.prueba) return;
    const r = this.ranura;
    const nativo = await leerNativo(r);
    const rec = elegirRecuperacion(almacen(r).leer(), [...(await leerRespaldos(r)), ...(nativo ? [nativo] : [])]);
    if (!rec) return;
    this.estado = rec.estado;
    this.recuperada = true;
    almacen(r).escribir(serializar(rec.estado));
  },
};
