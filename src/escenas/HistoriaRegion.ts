import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { equipoDe } from '../core/estado/juego';
import {
  confirmarDesafio, desafioCumplido, equipoBajo, nivelDelEquipo, marcarRelato, nivelParada, PARADAS, paradaVencida, regionAbierta, regionTerminada, relatoPendiente, siguienteParada, type Parada,
} from '../core/modos/historia';
import type { Region } from '../esquemas/esquemas';
import { Entrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { cargarArteHistoria, claveFondo, clavePixel, suavizarArteHistoria, texturaGris } from '../ui/arteHistoria';
import { fondo, type FondoId } from '../ui/fondos';
import { miniatura, textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { Puntero } from '../ui/puntero';
import { recortar, Texto } from '../ui/texto';
import { hayArte, pieza } from '../ui/arte';

/** Fondo de una región: los nuevos (Desierto, Cumbre, Ruinas…) son del Modo Historia; los demás, los de siempre. */
export function claveFondoRegion(escena: Phaser.Scene, id: string): string {
  return escena.textures.exists(claveFondo(id)) ? claveFondo(id) : fondo(escena, id as FondoId);
}

/**
 * Una región de la historia (D264): su paisaje (gris hasta vencer al Guardián) y sus 4 paradas en orden.
 * ▲ ▼ eligen la parada; A juega la que toca (combate, o el modo del desafío del entorno); B vuelve al mapa.
 */
export class HistoriaRegion extends Phaser.Scene {
  private indice = 0;
  private sel = 0;
  private aviso: string | null = null;

  constructor() {
    super('HistoriaRegion');
  }

  init(d: { region?: number; sel?: number; aviso?: string }): void {
    this.indice = d?.region ?? 0;
    this.sel = d?.sel ?? -1;
    this.aviso = d?.aviso ?? null;
  }

  preload(): void {
    cargarArteHistoria(this);
  }

  private get region(): Region {
    return DATOS.historia.regiones[this.indice]!;
  }

  create(): void {
    prepararCamara(this);
    suavizarArteHistoria(this);
    musica.tocar(`region_${this.region.id}`);
    const estado = juego.estado;
    const r = this.region;
    if (!regionAbierta(DATOS, estado, this.indice)) return void this.scene.start('Historia', { sel: this.indice });
    // Relatos (D271): al llegar, el santuario gris bajo el Eclipse; al vencer al Guardián, el color vuelve.
    const llegada = !regionTerminada(estado, r) && relatoPendiente(estado, `region:${r.id}`);
    const restaurada = regionTerminada(estado, r) && relatoPendiente(estado, `restaurada:${r.id}`);
    if (llegada || restaurada) {
      marcarRelato(estado, llegada ? `region:${r.id}` : `restaurada:${r.id}`);
      juego.guardar();
      return void this.scene.start('Relato', {
        diapositivas: [{
          img: `relato_${r.id}`,
          titulo: t(`hist.region.${r.id}`),
          texto: t(llegada ? `relato.llegada.${r.id}` : `relato.restaurada.${r.id}`),
          gris: llegada,
          musica: llegada ? 'eclipse' : 'victoria',
        }],
        luego: { escena: 'HistoriaRegion', datos: { region: this.indice, sel: this.sel < 0 ? undefined : this.sel, aviso: this.aviso ?? undefined } },
      });
    }
    // Al volver de un modo: si el desafío del entorno quedó cumplido, se confirma (y paga) acá.
    if (paradaVencida(estado, r, 1) && !estado.historia?.paradas.includes(`${r.id}:1`)) {
      const m = confirmarDesafio(DATOS, estado, this.indice);
      juego.guardar();
      sonido.tocar('sube');
      this.aviso = t('hist.desafio.hecho') + (m ? ` +${m}` : '');
    }
    const sig = siguienteParada(estado, r);
    if (this.sel < 0) this.sel = Math.min(sig, PARADAS - 1);
    const hecha = regionTerminada(estado, r);

    const clave = claveFondoRegion(this, r.fondo);
    this.add.image(0, 0, hecha ? clave : texturaGris(this, clave)).setOrigin(0, 0).setScale(240 / this.textures.get(clave).getSourceImage().width);
    const g = this.add.graphics();
    g.fillStyle(0x141830, 1).fillRect(0, 112, 240, 48);
    new Texto(this, 4, 3, 232, 12, '#ffffff', 'centro', { tam: 8.6, peso: 600, borde: '#1a1c2c' }).poner(t(`hist.region.${r.id}`));
    new Texto(this, 4, 14, 232, 10, '#ffffff', 'centro', { tam: 6, borde: '#1a1c2c' }).poner(hecha ? t('hist.region.restaurada') : t('hist.region.gris'));
    if (hecha && this.textures.exists(clavePixel(r.id))) this.add.image(224, 14, clavePixel(r.id)).setDisplaySize(18, 18);

    // Las 4 paradas en fila, como estaciones.
    const puntero = new Puntero(this);
    for (let i = 0; i < PARADAS; i++) {
      const x = 30 + i * 60;
      const y = 78;
      const vencida = paradaVencida(estado, r, i as Parada);
      const abierta = i <= sig;
      const elegida = i === this.sel;
      ventana(g, x - 26, y - 34, 52, 50, elegida ? 1 : 0.9);
      if (elegida) g.lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(x - 26, y - 34, 52, 50, 4);
      const jefe = this.jefeDe(i as Parada);
      if (jefe) {
        const visto = estado.jefes.includes(jefe) || abierta;
        miniatura(this.add.image(x, y - 13, textura(jefe, visto ? 'frente' : 'silueta')), jefe, 28, 0.5);
      } else this.iconoDesafio(x, y - 13);
      new Texto(this, x - 26, y + 5.5, 52, 9, elegida ? C.resalte : C.tinta, 'centro', { tam: 5.6, peso: 600 }).poner(t(`hist.parada.${i}`));
      const marca = vencida ? '✓' : abierta ? '▶' : '';
      if (marca) new Texto(this, x + 12, y - 33, 12, 10, vencida ? '#2f7a48' : C.resalte, 'centro', { tam: 7, peso: 600 }).poner(marca);
      else {
        g.fillStyle(0x6a6f80, 1).fillRoundedRect(x + 14, y - 29, 6, 4.4, 0.8);
        g.lineStyle(1, 0x6a6f80, 1).strokeCircle(x + 17, y - 29.6, 1.8);
      }
      puntero.zona(x - 26, y - 34, 52, 50, () => {
        if (this.sel !== i) this.scene.restart({ region: this.indice, sel: i });
      });
    }
    this.panel(sig);

    Entrada.escuchar((a) => {
      if (a === 'izquierda' || a === 'derecha' || a === 'arriba' || a === 'abajo') {
        const paso = a === 'derecha' || a === 'abajo' ? 1 : PARADAS - 1;
        sonido.tocar('cursor');
        this.scene.restart({ region: this.indice, sel: (this.sel + paso) % PARADAS });
      } else if (a === 'a') this.jugar(sig);
      else if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.start('Historia', { sel: this.indice });
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private jefeDe(p: Parada): string | null {
    const r = this.region;
    return p === 1 ? null : p === 3 ? r.guardian : r.jefes[p === 0 ? 0 : 1];
  }

  /** Ícono del desafío del entorno: el del modo que pide (arte del menú, si está). */
  private iconoDesafio(x: number, y: number): void {
    const d = this.region.desafio;
    const ico = d.tipo === 'torre' ? 'menu_combate' : d.tipo === 'crono' ? 'menu_expediciones' : 'menu_minijuegos';
    if (hayArte(this, ico)) pieza(this, ico, x, y, 22);
    else if (this.textures.exists('historia_prisma')) this.add.image(x, y, 'historia_prisma').setDisplaySize(26, 26);
  }

  private textoDesafio(): string {
    const d = this.region.desafio;
    if (d.tipo === 'minijuego') return t('hist.desafio.minijuego', { j: t(`mj.${d.id}`) });
    if (d.tipo === 'mina') return t('hist.desafio.mina', { n: d.zona });
    if (d.tipo === 'crono') return t('hist.desafio.crono', { e: t(`crono.era${d.era}`) });
    return t('hist.desafio.torre', { n: d.piso });
  }

  private panel(sig: number): void {
    const estado = juego.estado;
    const r = this.region;
    const p = this.sel as Parada;
    const g = this.add.graphics();
    ventana(g, 4, 114, 232, 43);
    const jefe = this.jefeDe(p);
    const titulo = jefe ? DATOS.criaturas.get(jefe)!.nombre : t('hist.parada.1');
    new Texto(this, 10, 117, 220, 10, '#257179', 'izq', { tam: 7.4, peso: 600 }).poner(titulo);
    let linea: string;
    if (jefe) linea = t(`hist.${r.id}.${p}`);
    else linea = this.textoDesafio() + (desafioCumplido(estado, r.desafio) && sig >= 1 ? ' ✓' : '');
    new Texto(this, 10, 127, 220, 18, C.tinta, 'izq', { tam: 6.2 }).poner(recortar(linea, 220, 6.2));
    let estadoTxt: string;
    if (paradaVencida(estado, r, p)) estadoTxt = t('hist.parada.vencida');
    else if (p > sig) estadoTxt = t('hist.parada.cerrada');
    else if (jefe && equipoBajo(nivelDelEquipo(equipoDe(estado)), nivelParada(r, p))) estadoTxt = t('hist.parada.bajo', { e: nivelDelEquipo(equipoDe(estado)), n: nivelParada(r, p) });
    else if (jefe) estadoTxt = t('hist.parada.combate', { n: nivelParada(r, p), m: DATOS.historia.monedasParada[p] }) + (p === 3 ? t('hist.parada.pixel') : '');
    else estadoTxt = t('hist.parada.ir');
    new Texto(this, 10, 145, 220, 10, this.aviso ? '#2f7a48' : p > sig ? C.tintaSuave : C.resalte, 'izq', { tam: 6.2, peso: 600 }).poner(this.aviso ?? estadoTxt);
  }

  private jugar(sig: number): void {
    const estado = juego.estado;
    const p = this.sel as Parada;
    if (p > sig || paradaVencida(estado, this.region, p) || !equipoDe(estado).length) return void sonido.tocar('negado');
    sonido.tocar('aceptar');
    if (p !== 1) {
      this.scene.start('Combate', { ia: this.region.ia, modo: 'historia', region: this.indice, parada: p });
      return;
    }
    // Desafío del entorno: se va al modo; al volver, esta pantalla lo confirma.
    const d = this.region.desafio;
    if (d.tipo === 'torre') this.scene.start('Torre');
    else if (d.tipo === 'crono') this.scene.start(estado.crono?.expedicion ? 'CronoMapa' : 'Cronoportal');
    else this.scene.start('Minijuegos', {});
  }
}
