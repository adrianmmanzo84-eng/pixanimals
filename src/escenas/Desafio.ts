import Phaser from 'phaser';
import { equipoSemanal, nivelSemanal, semanalCobrado, tipoDeLaSemana } from '../core/modos/semanal';
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
import { partir, Texto } from '../ui/texto';
import { desafioDelDia, desafioJugado, textoCompartir } from '../core/modos/desafio';
import { compartirTexto, urlJuego } from '../ui/compartir';

export interface DatosDesafio {
  modo: 'torre' | 'entrenador' | 'semanal' | 'desafio';
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
    if (this.modo === 'desafio') return this.crearDesafio();
    const estado = juego.estado;
    const mios = equipoDe(estado);
    const torre = this.modo === 'torre';
    this.add.image(0, 0, fondo(this, torre || this.modo === 'semanal' ? 'volcan' : 'bosque')).setOrigin(0, 0).setScale(0.25);
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
      titulo = t(p.guardian ? 'des.torreGuardian' : p.jefe ? 'des.torreJefe' : 'des.torre', { n: p.piso });
      subtitulo = t('des.mejor', { n: estado.torre.mejor });
      especies = p.especies;
      nivel = p.nivel;
      ia = p.ia;
      const pr = premioPiso(DATOS, p.piso);
      premio = p.piso > estado.torre.mejor ? (pr.sobre ? t('des.premioSobre', { n: pr.monedas, s: this.sobre(pr.sobre) }) : t('des.premio', { n: pr.monedas })) : t('des.sinPremio');
    } else if (this.modo === 'semanal') {
      const ahora = Date.now();
      const tipo = tipoDeLaSemana(DATOS, ahora);
      titulo = t('des.semanal', { t: DATOS.tipos.get(tipo)!.nombre });
      subtitulo = t('des.semanalSub');
      especies = equipoSemanal(DATOS, ahora, mios).map((c) => c.especie.id);
      nivel = nivelSemanal(DATOS, mios);
      ia = 'experta';
      const pr = DATOS.economia.semanal.premio;
      premio = semanalCobrado(estado, ahora) ? t('des.yaGanasteSemana') : t('des.premioSobre', { n: pr.monedas ?? 0, s: this.sobre(pr.sobre ?? '') });
      g.fillStyle(COLOR_TIPO[tipo] ?? 0x888888, 1).fillRoundedRect(18, 30, 4, 10, 1);
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
        this.scene.start('Combate', torre ? { ia, modo: 'torre', piso: estado.torre.piso } : { ia, modo: this.modo });
      } else if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.start('Menu', { submenu: 'combates' });
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  /**
   * Antesala del Desafío del día: tu equipo prestado y el rival (iguales para todos), el premio y un solo intento.
   * Si ya jugaste hoy, muestra tu resultado y A lo comparte.
   */
  private crearDesafio(): void {
    const estado = juego.estado;
    const ahora = Date.now();
    const d = desafioDelDia(DATOS, ahora);
    const jugado = desafioJugado(estado, ahora);
    this.add.image(0, 0, fondo(this, 'costa')).setOrigin(0, 0).setScale(0.25);
    this.add.graphics().fillStyle(0x141830, 0.45).fillRect(0, 0, 240, 160);
    const g = this.add.graphics();
    ventana(g, 10, 6, 220, 148);
    new Texto(this, 18, 11, 204, 14, '#257179', 'izq', { tam: 10, peso: 600 }).poner(t('des.desafio', { n: d.numero }));
    new Texto(this, 18, 25, 204, 10, C.tintaSuave).poner(t('des.desafioSub'));
    const fila = (ids: string[], y: number, etiqueta: string) => {
      new Texto(this, 18, y, 60, 30, C.tinta, 'izq', { tam: 6.4, peso: 600 }).poner(partir(etiqueta, 56).join('\n'));
      ids.forEach((id, i) => {
        const x = 104 + i * 46;
        g.fillStyle(0xe8ecf4, 1).fillRoundedRect(x - 21, y - 3, 42, 36, 4);
        miniatura(this.add.image(x, y + 11, textura(id, 'frente')), id, 26, 0.45);
        new Texto(this, x - 22, y + 24, 44, 8, C.tinta, 'centro', { tam: 5.6 }).poner(DATOS.criaturas.get(id)!.nombre);
      });
    };
    fila(d.equipo, 40, t('des.tuEquipo'));
    fila(d.rival, 80, t('des.rivalDesafio'));
    new Texto(this, 18, 118, 204, 10, C.tinta).poner(t('des.nivel', { n: d.nivel, ia: t('ia.tactica') }));
    const e = DATOS.economia.desafio;
    const r = estado.desafio;
    const res = t(r.victoria ? 'des.resVictoria' : 'des.resDerrota', { n: r.turnos });
    new Texto(this, 18, 128, 204, 10, C.resalte, 'izq', { peso: 600 }).poner(
      jugado ? t('des.yaJugaste', { r: res }) : t('des.premioDesafio', { v: e.monedasVictoria, e: e.esenciaVictoria, d: e.monedasDerrota }),
    );
    const ayuda = new Texto(this, 18, 141, 204, 10, C.tintaSuave, 'centro').poner(t(jugado ? 'des.ayudaCompartir' : 'des.ayudaDesafio'));
    Entrada.escuchar((a) => {
      if (a === 'a' && !jugado) {
        sonido.tocar('aceptar');
        this.scene.start('Combate', { ia: 'tactica', modo: 'desafio' });
      } else if (a === 'a') {
        sonido.tocar('aceptar');
        const texto = textoCompartir(d.numero, { victoria: r.victoria, turnos: r.turnos, vidas: r.vidas }, r.racha, urlJuego());
        void compartirTexto(texto).then((x) => ayuda.poner(t(`des.${x}`), '#2f7a48'));
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
