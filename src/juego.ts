import { DATOS } from './core/datos';
import { AlmacenLocal, deserializar, serializar, type Almacen } from './core/estado/guardado';
import { estadoNuevo } from './core/estado/juego';
import type { EstadoJuego } from './esquemas/esquemas';

/** Partida en curso. Las escenas la leen y, tras cada cambio importante, llaman a guardar(). */
const almacen: Almacen = new AlmacenLocal();

export const juego = {
  estado: deserializar(almacen.leer()) ?? estadoNuevo(DATOS, Date.now()),
  guardar(): void {
    almacen.escribir(serializar(this.estado));
  },
  reemplazar(estado: EstadoJuego): void {
    this.estado = estado;
    this.guardar();
  },
  borrar(): void {
    almacen.borrar();
    this.estado = estadoNuevo(DATOS, Date.now());
  },
};
