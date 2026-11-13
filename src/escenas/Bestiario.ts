import Phaser from 'phaser';
import { familiaCompleta } from '../core/progresion/coleccion';
import { Puntero } from '../ui/puntero';
import { DATOS } from '../core/datos';
import type { Criatura } from '../esquemas/esquemas';
import { criaturaDe } from '../core/estado/juego';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { COLOR_RAREZA, estrellas, miniatura, textura } from '../ui/criaturas';
import { C, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { partir, Texto } from '../ui/texto';

const VISIBLES = 3;
type Fila = (Criatura | null)[];

/** Bestiario: una fila por familia y una columna por etapa. Lo no visto es un signo de pregunta; lo visto, una silueta. Con más de 3 familias, se desplaza. */
export class Bestiario extends Phaser.Scene {
  /** Fila y columna elegidas en la cuadrícula completa. */
  private fila = 0;
  private col = 0;
  private marco!: Phaser.GameObjects.Graphics;
  private tipoFondo!: Phaser.GameObjects.Graphics;
  private nombre!: Texto;
  private tipo!: Texto;
  private situacion!: Texto;
  private detalle!: Texto;
  private descripcion!: Texto;
  private filas: Fila[] = [];
  private scroll = 0;

  constructor() {
    super('Bestiario');
  }

  init(d: { fila?: number; col?: number }): void {
    this.fila = d?.fila ?? 0;
    this.col = d?.col ?? 0;
  }

  /**
   * Una fila por familia, con cada criatura en la columna de su etapa. Las ramas (las que se consiguen con una piedra)
   * van en la fila de abajo, debajo de la forma a la que reemplazan; las casillas sin criatura quedan vacías.
   */
  private armarFilas(): Fila[] {
    const ramas = new Set([...DATOS.criaturas.values()].flatMap((c) => c.evoluciona.filter((e) => e.item).map((e) => e.a)));
    const familias = new Map<string, Criatura[]>();
    for (const c of DATOS.criaturas.values()) familias.set(c.familia, [...(familias.get(c.familia) ?? []), c]);
    return [...familias.values()].flatMap((lista) => {
      const res: Fila[] = [];
      const orden = [...lista].sort((a, b) => Number(ramas.has(a.id)) - Number(ramas.has(b.id)) || a.etapa - b.etapa);
      for (const c of orden) {
        let k = ramas.has(c.id) ? 1 : 0;
        while (res[k]?.[c.etapa - 1]) k++;
        while (res.length <= k) res.push([null, null, null, null]);
        res[k]![c.etapa - 1] = c;
      }
      return res;
    });
  }

  /** Columna con criatura más cercana a `col` dentro de la fila. */
  private cercana(fila: Fila, col: number): number {
    const llenas = fila.flatMap((c, j) => (c ? [j] : []));
    return llenas.reduce((m, j) => (Math.abs(j - col) < Math.abs(m - col) ? j : m), llenas[0]!);
  }

  create(): void {
    this.filas = this.armarFilas();
    this.fila = Math.min(this.fila, this.filas.length - 1);
    this.col = this.cercana(this.filas[this.fila]!, this.col);
    this.scroll = Math.max(0, Math.min(this.fila - 1, this.filas.length - VISIBLES));
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    const estado = juego.estado;
    ventana(g, 4, 4, 124, 124);
    ventana(g, 132, 4, 104, 124);
    ventana(g, 4, 132, 232, 24);

    const puntero = new Puntero(this);
    // Marco dorado en las familias completas del Álbum.
    this.filas.slice(this.scroll, this.scroll + VISIBLES).forEach((fila, k) => {
      const c = fila.find((x) => x);
      if (c && familiaCompleta(DATOS, estado, c.familia)) g.lineStyle(1.2, 0xf5c542, 1).strokeRoundedRect(7, 21 + k * 29, 118, 30, 4);
    });
    this.filas.slice(this.scroll, this.scroll + VISIBLES).forEach((fila, k) =>
      fila.forEach((c, j) => {
        if (!c) return;
        const x = 8 + j * 29 + 14;
        const y = 22 + k * 29 + 14;
        // Con el puntero la cuadrícula no se desplaza: solo cambia la casilla elegida.
        puntero.zona(x - 14, y - 14, 28, 28, () => {
          if (this.fila === this.scroll + k && this.col === j) return;
          this.fila = this.scroll + k;
          this.col = j;
          sonido.tocar('cursor');
          this.pintar();
        });
        g.fillStyle(n(C.papelSombra), 1).fillRoundedRect(x - 13, y - 13, 26, 26, 3);
        const mia = criaturaDe(estado, c.id);
        if (mia) miniatura(this.add.image(x, y, textura(c.id, 'frente', mia.brillante)), c.id, 24, 0.5);
        else if (estado.vistas.includes(c.id)) miniatura(this.add.image(x, y, textura(c.id, 'silueta')), c.id, 24, 0.5);
        else new Texto(this, x - 13, y - 7, 26, 14, C.apagado, 'centro', { tam: 11, peso: 600 }).poner('?');
      }),
    );
    if (this.scroll > 0) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(64, 19, 68, 19, 66, 17);
    if (this.scroll + VISIBLES < this.filas.length) g.fillStyle(n(C.tintaSuave), 1).fillTriangle(64, 122, 68, 122, 66, 124);
    this.marco = this.add.graphics();
    this.nombre = new Texto(this, 136, 10, 96, 12, C.tinta, 'centro', { tam: 8.6, peso: 600 });
    this.tipoFondo = this.add.graphics();
    this.tipo = new Texto(this, 136, 23, 96, 10, C.papel, 'centro');
    this.situacion = new Texto(this, 138, 38, 92, 10, C.resalte);
    this.detalle = new Texto(this, 138, 49, 92, 20);
    this.descripcion = new Texto(this, 138, 72, 92, 54, C.tintaSuave);

    const total = DATOS.criaturas.size;
    const capturadas = [...DATOS.criaturas.keys()].filter((id) => criaturaDe(estado, id)).length;
    new Texto(this, 10, 139, 220, 10).poner(t('best.vistas', { v: estado.vistas.length, c: capturadas, t: total }));
    new Texto(this, 10, 139, 220, 10, C.tintaSuave, 'der').poner(t('best.ayuda'));

    this.pintar();
    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private alPulsar(a: AccionEntrada): void {
    const llenas = this.filas[this.fila]!.flatMap((c, j) => (c ? [j] : []));
    const i = llenas.indexOf(this.col);
    if (a === 'izquierda') this.col = llenas[(i + llenas.length - 1) % llenas.length]!;
    else if (a === 'derecha') this.col = llenas[(i + 1) % llenas.length]!;
    else if (a === 'arriba' || a === 'abajo') {
      const fila = (this.fila + (a === 'abajo' ? 1 : this.filas.length - 1)) % this.filas.length;
      sonido.tocar('cursor');
      // Cambiar de fila puede desplazar la cuadrícula: se redibuja la escena.
      this.scene.restart({ fila, col: this.cercana(this.filas[fila]!, this.col) });
      return;
    } else if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Menu');
      return;
    } else return;
    sonido.tocar('cursor');
    this.pintar();
  }

  private pintar(): void {
    const estado = juego.estado;
    const c = this.filas[this.fila]![this.col]!;
    const mia = criaturaDe(estado, c.id);
    const vista = estado.vistas.includes(c.id);
    const x = 8 + this.col * 29;
    const y = 22 + (this.fila - this.scroll) * 29;
    this.marco.clear().lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(x, y, 28, 28, 4);
    this.tipoFondo.clear();
    if (!mia && !vista) {
      this.nombre.poner(t('best.desconocida'));
      this.tipo.poner('');
      this.situacion.poner(t('best.noVista'), C.tintaSuave);
      this.detalle.poner('');
      this.descripcion.poner('');
      return;
    }
    this.nombre.poner(c.nombre);
    this.tipoFondo.fillStyle(COLOR_TIPO[c.tipo] ?? 0x5b6a8c, 1).fillRoundedRect(162, 22, 44, 10, 3);
    this.tipo.poner(DATOS.tipos.get(c.tipo)!.nombre.toUpperCase());
    this.situacion.poner(t(mia ? 'best.capturada' : 'best.vista'), mia ? '#2f7a48' : C.tintaSuave);
    this.detalle.poner(mia ? `${t('best.nivel', { n: mia.nivel })}${mia.brillante ? ' · ✦' : ''}\n${estrellas(mia.rareza)}` : '', mia ? COLOR_RAREZA[mia.rareza] : C.tinta);
    this.descripcion.poner(partir(c.descripcion, 92).slice(0, 6).join('\n'));
  }
}
