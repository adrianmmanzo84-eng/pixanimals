import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { equipoDe } from '../core/estado/juego';
import { finalAbierto, marcarRelato, PARADAS, pixelesMaestros, regionAbierta, regionTerminada, siguienteParada } from '../core/modos/historia';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { cargarArteHistoria, clavePixel, suavizarArteHistoria } from '../ui/arteHistoria';
import { miniatura, textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { Puntero } from '../ui/puntero';
import { Texto } from '../ui/texto';

/**
 * Mapa del mundo del Modo Historia (D264): las seis regiones y, en el centro, el Origen del Eclipse.
 * ◀ ▶ (o ▲ ▼) recorren las regiones en orden; A entra a la elegida; B vuelve al menú.
 * Las regiones restauradas muestran su Píxel Maestro; las que faltan, un candado.
 * `fin`: escena final, tras vencer al Arquitecto.
 */
export class Historia extends Phaser.Scene {
  /** La presentación se muestra una vez por sesión, mientras no hayas vencido a nadie. */
  private sel = 0;
  private fin = false;
  private aviso: ((a: AccionEntrada) => void) | null = null;

  constructor() {
    super('Historia');
  }

  init(d: { sel?: number; fin?: boolean }): void {
    this.fin = !!d?.fin;
    const estado = juego.estado;
    const regiones = DATOS.historia.regiones;
    // Sin elección: la región que toca (o el final si ya están todas).
    const actual = regiones.findIndex((r) => !regionTerminada(estado, r));
    this.sel = d?.sel ?? (actual < 0 ? regiones.length : actual);
    this.aviso = null;
  }

  preload(): void {
    cargarArteHistoria(this);
  }

  create(): void {
    prepararCamara(this);
    suavizarArteHistoria(this);
    if (this.fin) return this.escenaFinal();
    musica.tocar('mapa');
    const estado = juego.estado;
    const regiones = DATOS.historia.regiones;
    if (this.textures.exists('historia_mapa')) this.add.image(0, 0, 'historia_mapa').setOrigin(0, 0).setScale(0.25);
    else this.add.graphics().fillStyle(0x2a3a5a, 1).fillRect(0, 0, 240, 160);
    const g = this.add.graphics();
    const puntero = new Puntero(this);
    const total = regiones.length + 1;

    regiones.forEach((r, i) => {
      const x = r.marcador[0] / 4;
      const y = r.marcador[1] / 4;
      const hecha = regionTerminada(estado, r);
      const abierta = regionAbierta(DATOS, estado, i);
      if (hecha && this.textures.exists(clavePixel(r.id))) this.add.image(x, y, clavePixel(r.id)).setDisplaySize(15, 15);
      else {
        const color = Phaser.Display.Color.HexStringToColor(r.color).color;
        g.fillStyle(0x141830, 0.45).fillEllipse(x, y + 5, 14, 4);
        g.fillStyle(abierta ? color : 0x6a6f80, 1).fillCircle(x, y, 5.5);
        g.lineStyle(1.2, 0x141830, 1).strokeCircle(x, y, 5.5);
        if (!abierta) this.candado(g, x, y);
      }
      if (i === this.sel) g.lineStyle(1.4, n(C.resalte), 1).strokeCircle(x, y, 9);
      puntero.zona(x - 9, y - 9, 18, 18, () => this.mover(i));
    });
    // El Origen del Eclipse, en el centro: se abre con los seis Píxeles Maestros.
    const f = DATOS.historia.final;
    const fx = f.marcador[0] / 4;
    const fy = f.marcador[1] / 4;
    const abiertoFinal = finalAbierto(DATOS, estado);
    g.fillStyle(0x0c0a18, 1).fillCircle(fx, fy, 6.5);
    g.lineStyle(1.4, abiertoFinal ? 0xf2c14e : 0x6a6f80, 1).strokeCircle(fx, fy, 6.5);
    if (!abiertoFinal) this.candado(g, fx, fy);
    if (this.sel === regiones.length) g.lineStyle(1.4, n(C.resalte), 1).strokeCircle(fx, fy, 10);
    puntero.zona(fx - 10, fy - 10, 20, 20, () => this.mover(regiones.length));

    // Tu criatura líder sobre la región elegida.
    const lider = equipoDe(estado)[0];
    if (lider) {
      const p = this.sel < regiones.length ? regiones[this.sel]!.marcador : f.marcador;
      const marca = this.add.sprite(p[0] / 4, p[1] / 4 - 12, textura(lider.especie, 'icono'), 0).setScale(0.5);
      this.time.addEvent({ delay: 300, loop: true, callback: () => marca.setFrame(marca.frame.name === '0' ? 1 : 0) });
    }

    new Texto(this, 4, 3, 232, 10, '#ffffff', 'centro', { tam: 6.4, borde: '#1a1c2c' }).poner(t('hist.mapa.ayuda', { n: pixelesMaestros(DATOS, estado), m: regiones.length }));
    this.panel(total);

    Entrada.escuchar((a) => {
      if (this.aviso) return this.aviso(a);
      if (a === 'izquierda' || a === 'arriba') this.mover((this.sel + total - 1) % total);
      else if (a === 'derecha' || a === 'abajo') this.mover((this.sel + 1) % total);
      else if (a === 'a') this.entrar();
      else if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.start('Menu', {});
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private candado(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0xf4f4f4, 1).fillRoundedRect(x - 2.6, y - 1, 5.2, 4, 0.8);
    g.lineStyle(1, 0xf4f4f4, 1).strokeCircle(x, y - 1.6, 1.7);
  }

  private mover(i: number): void {
    if (i === this.sel) return;
    sonido.tocar('cursor');
    this.scene.restart({ sel: i });
  }

  private entrar(): void {
    const estado = juego.estado;
    const regiones = DATOS.historia.regiones;
    if (!equipoDe(estado).length) return void sonido.tocar('negado');
    if (this.sel === regiones.length) {
      if (!finalAbierto(DATOS, estado)) return void sonido.tocar('negado');
      sonido.tocar('aceptar');
      // Antes del combate final, el Arquitecto se revela y habla.
      this.scene.start('Relato', {
        diapositivas: [{ img: 'historia_final', titulo: t('hist.final.titulo'), texto: t('hist.final.antes'), musica: 'eclipse' }],
        luego: { escena: 'Combate', datos: { ia: DATOS.historia.final.ia, modo: 'historia', final: true } },
      });
      return;
    }
    if (!regionAbierta(DATOS, estado, this.sel)) return void sonido.tocar('negado');
    sonido.tocar('aceptar');
    this.scene.start('HistoriaRegion', { region: this.sel });
  }

  private panel(total: number): void {
    const estado = juego.estado;
    const regiones = DATOS.historia.regiones;
    const g = this.add.graphics();
    ventana(g, 4, 124, 232, 33);
    let titulo: string;
    let linea: string;
    let detalle: string;
    if (this.sel < regiones.length) {
      const r = regiones[this.sel]!;
      titulo = `${t(`hist.region.${r.id}`)} · ${DATOS.tipos.get(r.tipo)!.nombre}`;
      const sig = siguienteParada(estado, r);
      linea = regionTerminada(estado, r) ? t('hist.mapa.restaurada') : regionAbierta(DATOS, estado, this.sel) ? t('hist.mapa.paradas', { n: sig, m: PARADAS }) : t('hist.mapa.cerrada', { r: t(`hist.region.${regiones[this.sel - 1]!.id}`) });
      detalle = t('hist.mapa.nivel', { n: r.nivel });
      miniatura(this.add.image(214, 140, textura(r.guardian, estado.jefes.includes(r.guardian) ? 'frente' : 'silueta')), r.guardian, 26, 0.4);
    } else {
      const f = DATOS.historia.final;
      titulo = t('hist.region.origen');
      linea = estado.historia?.final ? t('hist.mapa.restaurada') : finalAbierto(DATOS, estado) ? t('hist.mapa.finalListo') : t('hist.mapa.finalCerrado', { n: pixelesMaestros(DATOS, estado), m: regiones.length });
      detalle = t('hist.mapa.nivel', { n: f.nivel });
      miniatura(this.add.image(214, 140, textura(f.jefe, estado.jefes.includes(f.jefe) ? 'frente' : 'silueta')), f.jefe, 26, 0.4);
    }
    new Texto(this, 10, 127, 190, 10, '#257179', 'izq', { tam: 7.6, peso: 600 }).poner(titulo);
    new Texto(this, 10, 137, 190, 10, C.tinta, 'izq', { tam: 6.4 }).poner(linea);
    new Texto(this, 10, 146, 190, 10, C.tintaSuave, 'izq', { tam: 6 }).poner(detalle);
    void total;
  }

  /** Cartel de texto (presentación, palabras del Arquitecto). A o B lo cierran. */
  /** Final (D271): el mundo recupera el color y, una sola vez, se presentan las brechas del Arquitecto. */
  private escenaFinal(): void {
    const estado = juego.estado;
    const diapositivas = [{ img: 'relato_final', texto: t('hist.final.texto'), musica: 'final' as string }];
    if (!estado.historia?.vistos?.includes('brechas')) {
      marcarRelato(estado, 'brechas');
      juego.guardar();
      diapositivas.push({ img: 'relato_brechas', texto: t('relato.brechas'), musica: 'prologo' });
    }
    this.scene.start('Relato', { diapositivas, luego: { escena: 'Menu', datos: {} } });
  }
}
