import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { equipoDe } from '../core/estado/juego';
import { datosPiso, premioPiso } from '../core/modos/torre';
import { entrenadorCobrado, entrenadorDelDia, equipoEntrenador, nivelEntrenador } from '../core/modos/entrenador';
import { Entrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { miniatura, textura } from '../ui/criaturas';
import { C, COLOR_TIPO, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { Texto } from '../ui/texto';

export interface DatosDesafio {
  modo: 'torre' | 'entrenador';
}

/** Antesala de la Torre o del Entrenador del día: quién es el rival, qué nivel tiene y qué premio da. */
export class Desafio extends Phaser.Scene {
  private modo: DatosDesafio['modo'] = 'torre';

  constructor() {
    super('Desafio');
  }

  init(d: DatosDesafio): void {
    this.modo = d?.modo ?? 'torre';
  }

  create(): void {
    prepararCamara(this);
    musica.tocar('menu');
    const estado = juego.estado;
    const mios = equipoDe(estado);
    const torre = this.modo === 'torre';
    this.add.image(0, 0, fondo(this, torre ? 'volcan' : 'bosque')).setOrigin(0, 0).setScale(0.25);
    this.add.graphics().fillStyle(0x141830, 0.45).fillRect(0, 0, 240, 160);
    const g = this.add.graphics();
    ventana(g, 10, 6, 220, 148);

    let titulo: string;
    let subtitulo: string;
    let especies: string[];
    let nivel: number;
    let premio: string;
    let ia: string;
    if (torre) {
      const p = datosPiso(DATOS, estado.torre.piso, mios.length);
      titulo = t(p.jefe ? 'des.torreJefe' : 'des.torre', { n: p.piso });
      subtitulo = t('des.mejor', { n: estado.torre.mejor });
      especies = p.especies;
      nivel = p.nivel;
      ia = p.ia;
      const pr = premioPiso(DATOS, p.piso);
      premio = p.piso > estado.torre.mejor ? (pr.sobre ? t('des.premioSobre', { n: pr.monedas, s: this.sobre(pr.sobre) }) : t('des.premio', { n: pr.monedas })) : t('des.sinPremio');
    } else {
      const e = entrenadorDelDia(DATOS, Date.now());
      titulo = t('des.entrenador', { n: e.nombre });
      subtitulo = t('des.tipo', { t: DATOS.tipos.get(e.tipo)!.nombre });
      especies = equipoEntrenador(DATOS, e, mios).map((c) => c.especie.id);
      nivel = nivelEntrenador(DATOS, mios);
      ia = 'experta';
      premio = entrenadorCobrado(estado, Date.now()) ? t('des.yaGanaste') : t('des.premioSobre', { n: DATOS.economia.entrenador.monedas, s: this.sobre(e.sobre) });
      g.fillStyle(COLOR_TIPO[e.tipo] ?? 0x888888, 1).fillRoundedRect(18, 30, 4, 10, 1);
    }

    new Texto(this, 18, 12, 204, 14, '#257179', 'izq', { tam: 10, peso: 600 }).poner(titulo);
    new Texto(this, 24, 30, 198, 10, C.tintaSuave).poner(subtitulo);
    especies.forEach((id, i) => {
      const x = 50 + i * 70;
      g.fillStyle(0xe8ecf4, 1).fillRoundedRect(x - 30, 44, 60, 56, 4);
      const visto = estado.vistas.includes(id);
      miniatura(this.add.image(x, 68, textura(id, visto ? 'frente' : 'silueta')), id, 40, 0.6);
      new Texto(this, x - 30, 90, 60, 10, C.tinta, 'centro').poner(visto ? DATOS.criaturas.get(id)!.nombre : '???');
    });
    new Texto(this, 18, 104, 204, 10, C.tinta).poner(t('des.nivel', { n: nivel, ia: t(`ia.${ia}`) }));
    new Texto(this, 18, 116, 204, 10, C.resalte, 'izq', { peso: 600 }).poner(premio);
    new Texto(this, 18, 138, 204, 10, C.tintaSuave, 'centro').poner(t('des.ayuda'));

    Entrada.escuchar((a) => {
      if (a === 'a') {
        if (!mios.length) return sonido.tocar('negado');
        sonido.tocar('aceptar');
        this.scene.start('Combate', torre ? { ia, modo: 'torre', piso: estado.torre.piso } : { ia, modo: 'entrenador' });
      } else if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.start('Menu', { submenu: 'combates' });
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private sobre(id: string): string {
    return DATOS.sobres.sobres.find((s) => s.id === id)?.nombre ?? id;
  }
}
