import Phaser from 'phaser';
import { Puntero, saltito } from '../ui/puntero';
import { DATOS } from '../core/datos';
import { cobrarMeta, metasAlbum, metasMedallas, nivelMedalla, type Meta } from '../core/progresion/coleccion';
import type { PremioMeta } from '../esquemas/esquemas';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { Texto } from '../ui/texto';
import { textura } from '../ui/criaturas';
import { claveMedalla, claveTipo, pieza } from '../ui/arte';

type Pestana = 'album' | 'medallas';
const FILAS = 4;
const COLOR_MEDALLA = [0xcd7f32, 0xb8c0cc, 0xf5c542];

/** Texto de un premio: «+200 monedas · Sobre Raro» (corto: sin la palabra «Sobre»). */
export function textoPremio(p: PremioMeta, corto = false): string {
  const partes: string[] = [];
  if (p.monedas) partes.push(t('col.monedas', { n: p.monedas }));
  if (p.esencia) partes.push(t('col.esencia', { n: p.esencia }));
  if (p.sobre) {
    const nombre = DATOS.sobres.sobres.find((s) => s.id === p.sobre)?.nombre ?? p.sobre;
    partes.push(corto ? nombre.replace(/^Sobre /, '') : nombre);
  }
  return partes.join(' · ');
}

/**
 * Álbum y Medallas. El Álbum premia completar familias (las 4 etapas, aunque ya hayan evolucionado),
 * formas Eclipse, tipos enteros y la colección total. Las Medallas son objetivos largos en tres niveles.
 */
export class Coleccion extends Phaser.Scene {
  private pestana: Pestana = 'album';
  private sel = 0;
  private aviso = '';
  private salto = false;

  constructor() {
    super('Coleccion');
  }

  init(d: { pestana?: Pestana; sel?: number; aviso?: string; salto?: boolean }): void {
    this.pestana = d?.pestana ?? 'album';
    this.sel = d?.sel ?? 0;
    this.aviso = d?.aviso ?? '';
    this.salto = !!d?.salto;
  }

  private metas(): Meta[] {
    return this.pestana === 'album' ? metasAlbum(DATOS, juego.estado) : metasMedallas(DATOS, juego.estado);
  }

  create(): void {
    prepararCamara(this);
    this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const metas = this.metas();
    this.sel = Math.max(0, Math.min(this.sel, metas.length - 1));
    const scroll = Math.max(0, Math.min(this.sel - 1, metas.length - FILAS));
    const g = this.add.graphics();
    const puntero = new Puntero(this);

    // Pestañas
    (['album', 'medallas'] as Pestana[]).forEach((p, i) => {
      const x = 40 + i * 92;
      const activa = p === this.pestana;
      g.fillStyle(activa ? n(C.resalte) : 0x2b3a78, 1).fillRoundedRect(x, 3, 70, 13, 4);
      new Texto(this, x, 4, 70, 12, '#ffffff', 'centro', { peso: 600 }).poner(t(`col.${p}`));
      puntero.zona(x, 3, 70, 13, () => {
        if (p === this.pestana) return;
        sonido.tocar('cursor');
        this.scene.restart({ pestana: p });
      });
    });

    metas.slice(scroll, scroll + FILAS).forEach((m, k) => {
      const i = scroll + k;
      const y = 19 + k * 27;
      ventana(g, 6, y, 228, 25);
      if (i === this.sel) g.lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(6, y, 228, 25, 4);
      let x0 = 12;
      if (this.pestana === 'medallas') {
        // Insignia dibujada: el nivel que se persigue si ya se cumplió, si no el último ganado, o la silueta bloqueada.
        const nivel = Number(m.valores.nivel);
        const base = m.id.replace(/_\d$/, '');
        const ganadas = nivelMedalla(juego.estado, base);
        const mostrar = m.completa || m.cobrada ? nivel + 1 : ganadas;
        if (!pieza(this, claveMedalla(base, mostrar), 19, y + 11, 16)) {
          g.fillStyle(0x1f2340, 1).fillCircle(19, y + 12.5, 7.5);
          g.fillStyle(COLOR_MEDALLA[nivel]!, m.completa || m.cobrada ? 1 : 0.35).fillCircle(19, y + 12.5, 6.2);
        }
        for (let s = 0; s < 3; s++) g.fillStyle(s < ganadas ? COLOR_MEDALLA[s]! : 0x39425e, 1).fillCircle(14 + s * 5, y + 22, 1.6);
        x0 = 30;
      } else if (this.iconoAlbum(m, 19, y + 12.5)) {
        if (m.cobrada) pieza(this, 'sello_completado', 25, y + 18, 10);
        x0 = 30;
      }
      const titulo = new Texto(this, x0, y + 2, 168 - x0, 10, m.cobrada ? C.tintaSuave : C.tinta, 'izq', { peso: 600 }).poner(
        this.pestana === 'medallas' ? `${t(m.texto, m.valores)} · ${t(`col.nivel${m.valores.nivel}`)}` : t(m.texto, m.valores),
      );
      if (i === this.sel && this.salto) saltito(this, titulo.imagen);
      g.fillStyle(C.barraFondo, 1).fillRoundedRect(x0, y + 15, 90, 4, 2);
      g.fillStyle(m.completa ? 0x3fbf6a : 0xf5a623, 1).fillRoundedRect(x0, y + 15, Math.max(2, (90 * m.progreso) / m.meta), 4, 2);
      new Texto(this, x0 + 93, y + 12, 34, 10, C.tintaSuave).poner(`${m.progreso}/${m.meta}`);
      // Arriba a la derecha el estado (si lo hay); abajo, el premio.
      const estado = m.cobrada ? t('col.cobrada') : m.completa ? t('col.cobrar') : '';
      new Texto(this, 170, y + 2, 58, 10, m.cobrada ? '#2f7a48' : C.resalte, 'der', { peso: 600 }).poner(estado);
      new Texto(this, 128, y + 13, 100, 10, C.tinta, 'der', { tam: 6 }).poner(textoPremio(m.premio, true));
      puntero.zona(6, y, 228, 25, () => {
        if (i === this.sel) return;
        sonido.tocar('cursor');
        this.scene.restart({ pestana: this.pestana, sel: i, salto: true });
      });
    });
    if (scroll > 0) g.fillStyle(0xffffff, 1).fillTriangle(116, 18, 124, 18, 120, 15);
    if (scroll + FILAS < metas.length) g.fillStyle(0xffffff, 1).fillTriangle(116, 128, 124, 128, 120, 131);

    ventana(g, 6, 133, 228, 24);
    const hechas = metas.filter((m) => m.cobrada).length;
    new Texto(this, 12, 136, 216, 10, this.aviso ? C.resalte : C.tinta).poner(this.aviso || t(`col.resumen.${this.pestana}`, { n: hechas, m: metas.length }));
    new Texto(this, 12, 146, 216, 10, C.tintaSuave).poner(t('col.ayuda'));
    Entrada.escuchar((a) => this.alPulsar(a, metas));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private alPulsar(a: AccionEntrada, metas: Meta[]): void {
    if (a === 'b') {
      sonido.tocar('cancelar');
      this.scene.start('Menu');
    } else if (a === 'izquierda' || a === 'derecha') {
      sonido.tocar('cursor');
      this.scene.restart({ pestana: this.pestana === 'album' ? 'medallas' : 'album' });
    } else if ((a === 'arriba' || a === 'abajo') && metas.length) {
      sonido.tocar('cursor');
      this.scene.restart({ pestana: this.pestana, sel: (this.sel + (a === 'abajo' ? 1 : metas.length - 1)) % metas.length, salto: true });
    } else if (a === 'a') {
      const m = metas[this.sel];
      if (!m) return;
      const premio = cobrarMeta(DATOS, juego.estado, m.id);
      if (!premio) {
        sonido.tocar('negado');
        return;
      }
      juego.guardar();
      sonido.tocar('victoria');
      this.cameras.main.flash(180, 255, 240, 180);
      this.scene.restart({ pestana: this.pestana, sel: this.sel, aviso: t('col.cobrado', { p: textoPremio(premio) }) });
    }
  }

  /** Ícono de una meta del Álbum: la criatura de la familia o Eclipse, el tipo o el ícono de colección. */
  private iconoAlbum(m: Meta, x: number, y: number): boolean {
    const [clase, ...resto] = m.id.split('_');
    const valor = resto.join('_');
    if (clase === 'tipo') return !!pieza(this, claveTipo(valor), x, y, 16);
    if (clase === 'coleccion') return !!pieza(this, 'menu_coleccion', x, y, 16);
    const especie =
      clase === 'familia'
        ? [...DATOS.criaturas.values()].find((c) => c.familia === valor && c.etapa === 4 && !c.id.endsWith('_eclipse'))
        : DATOS.criaturas.get(valor);
    if (!especie) return false;
    // Sin ninguna vista todavía: candado, para no adelantar cómo es.
    if (m.progreso === 0) return !!pieza(this, 'candado_no_descubierta', x, y, 16);
    this.add.image(x, y, textura(especie.id, 'icono'), 0).setScale(0.5);
    return true;
  }
}
