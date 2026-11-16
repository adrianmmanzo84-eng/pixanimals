import { DATOS } from './core/datos';
import { AlmacenLocal, deserializar, serializar, type Almacen } from './core/estado/guardado';
import { elegirRecuperacion } from './core/estado/respaldo';
import { estadoNuevo } from './core/estado/juego';
import type { EstadoJuego } from './esquemas/esquemas';
import { borrarRespaldos, guardarRespaldo, leerRespaldos } from './respaldoIdb';
import { borrarNativo, guardarNativo, leerNativo } from './nativo';

/** Partida en curso. Las escenas la leen y, tras cada cambio importante, llaman a guardar(). */
const almacen: Almacen = new AlmacenLocal();
let pendiente: ReturnType<typeof setTimeout> | null = null;

export const juego = {
  estado: deserializar(almacen.leer()) ?? estadoNuevo(DATOS, Date.now()),
  /** La partida se recuperó de la copia de seguridad al abrir (el menú lo avisa una vez). */
  recuperada: false,
  /** Modo prueba (?prueba): la partida vive solo en memoria y nunca se guarda. */
  prueba: false,
  guardar(): void {
    if (this.prueba) return;
    const texto = serializar(this.estado);
    almacen.escribir(texto);
    // Copia en el segundo almacén, agrupando los guardados seguidos.
    if (pendiente) clearTimeout(pendiente);
    pendiente = setTimeout(() => {
      void guardarRespaldo(texto);
      // En la app de Android, además, en el almacén de la app (D245).
      guardarNativo(texto);
    }, 800);
  },
  reemplazar(estado: EstadoJuego): void {
    this.estado = estado;
    this.guardar();
  },
  borrar(): void {
    almacen.borrar();
    if (pendiente) clearTimeout(pendiente);
    void borrarRespaldos();
    borrarNativo();
    this.estado = estadoNuevo(DATOS, Date.now());
  },
  /** Al abrir: si el guardado principal falta o está dañado, recupera la copia válida más reciente. */
  async recuperar(): Promise<void> {
    if (this.prueba) return;
    const nativo = await leerNativo();
    const r = elegirRecuperacion(almacen.leer(), [...(await leerRespaldos()), ...(nativo ? [nativo] : [])]);
    if (!r) return;
    this.estado = r.estado;
    this.recuperada = true;
    almacen.escribir(serializar(r.estado));
  },
};
