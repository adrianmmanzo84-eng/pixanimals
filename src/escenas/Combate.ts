import { equipoExpedicion, nodoActual, reglaDe, rivalesNodo, terminarCombate } from '../core/modos/crono';
import { animar, confeti, crearAnimaciones, type ClaveAnim } from '../ui/animaciones';
import { equipoEstacion, ganarEstacion, type ModoRuta } from '../core/modos/rutas';
import { describirHabilidad } from '../ui/habilidadTexto';
import Phaser from 'phaser';
import { claveCategoria, claveEstado, claveTipo, ESTADO_DE_STAT, hayArte, pieza } from '../ui/arte';
import { equipoSemanal, resultadoSemanal, tipoDeLaSemana } from '../core/modos/semanal';
import { Puntero } from '../ui/puntero';
import { DATOS } from '../core/datos';
import { Rng } from '../core/rng';
import { Batalla, type Accion, type Combatiente, type Evento, type Lado } from '../core/combate/motor';
import { elegirAccion, elegirReemplazo, type NivelIA } from '../core/combate/ia';
import { accionConDano, calificarGolpe, GOLPE, posicionGolpe } from '../core/combate/golpe';
import { generarRival } from '../core/combate/rival';
import { combatienteDe, criaturaDe, equipoDe, marcarVista, nombreDe } from '../core/estado/juego';
import { aplicarRecompensa, xpParaSubir } from '../core/progresion/experiencia';
import { registrar } from '../core/progresion/misiones';
import { datosPiso, equipoPiso, resultadoTorre } from '../core/modos/torre';
import { progresoJefes, registrarJefe } from '../core/modos/jefes';
import { entrenadorDelDia, equipoEntrenador, resultadoEntrenador } from '../core/modos/entrenador';
import { equipoGuarida, vencerGuarida } from '../core/minijuegos/mina';
import { desafioDelDia, empezarDesafio, equiposDesafio, terminarDesafio, textoCompartir } from '../core/modos/desafio';
import { compartirTexto, urlJuego } from '../ui/compartir';
import { darConsuelo } from '../core/progresion/consuelo';
import { musica } from '../audio/musica';
import { ajustes, alCambiarAjustes } from '../ajustes';
import type { Habilidad, Item } from '../esquemas/esquemas';
import { cantidad, quitar } from '../core/items/items';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { altoVisible, ponerCriatura, textura } from '../ui/criaturas';
import { cargarGrandes } from '../ui/hd';
import { C, COLOR_ESTADO, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { Efectos } from '../ui/efectos';
import { fondo, FONDO_POR_TIPO } from '../ui/fondos';
import { partir, Texto } from '../ui/texto';

export interface ConfigCombate {
  ia: NivelIA;
  /** rapido: rival parejo al azar; torre: el piso `piso`; entrenador: el Entrenador del día; semanal: el Jefe de la semana; desafio: el Desafío del día (equipo prestado, igual para todos). */
  modo?: 'rapido' | 'torre' | 'entrenador' | 'semanal' | 'desafio' | 'mina' | 'crono';
  piso?: number;
  /** mina: zona de la guarida cuyo monstruo se enfrenta. */
  zona?: number;
  /** entrenador o semanal: estación del camino (la última es el jefe). Sin dato: el jefe. */
  estacion?: number;
}

interface Panel {
  x: number;
  y: number;
  disp: Disposicion;
  nombre: Texto;
  nivel: Texto;
  ps: Texto;
  barra: Phaser.GameObjects.Graphics;
  puntos: Phaser.GameObjects.Graphics;
  estadoFondo: Phaser.GameObjects.Graphics;
  estado: Texto;
  /** Ícono del estado (arte del autor), a la izquierda de su abreviatura. */
  estadoIco: Phaser.GameObjects.Image | null;
  /** Bajas de Velocidad (Lentitud) y de Ataque (Debilidad), debajo del estado: ícono y cuántas etapas. */
  bajas: { stat: 'vel' | 'atq'; ico: Phaser.GameObjects.Image | null; txt: Texto }[];
  mostrado: number;
}

/**
 * Centro de la plataforma dibujada en cada fondo (medido sobre las ilustraciones, D255): ahí apoya los pies cada criatura.
 * [tú, rival]; las coordenadas son del mundo de 240×160. Los fondos de la Mina y del Cronoportal cambian de lugar.
 */
type Plataformas = readonly [{ x: number; y: number }, { x: number; y: number }];
const PLATAFORMAS_BASE: Plataformas = [{ x: 50, y: 104 }, { x: 186, y: 81 }];
const PLATAFORMAS: Record<string, Plataformas> = {
  mina_guarida1: [{ x: 56, y: 89 }, { x: 177, y: 66 }],
  mina_guarida2: [{ x: 56, y: 90 }, { x: 179, y: 65 }],
  mina_guarida3: [{ x: 59, y: 86 }, { x: 184, y: 61 }],
  mina_guarida4: [{ x: 57, y: 83 }, { x: 182, y: 60 }],
  mina_guarida5: [{ x: 59, y: 86 }, { x: 182, y: 65 }],
  crono_era1: [{ x: 53, y: 79 }, { x: 179, y: 53 }],
  crono_era2: [{ x: 53, y: 81 }, { x: 183, y: 51 }],
  crono_era3: [{ x: 53, y: 81 }, { x: 182, y: 55 }],
  crono_era4: [{ x: 50, y: 84 }, { x: 180, y: 46 }],
  crono_era5: [{ x: 52, y: 86 }, { x: 180, y: 54 }],
};
/** Los pies del dibujo quedan 31 px bajo el ancla del sprite (lienzo de 96, origen a 64 px, base a 1 px del borde). */
const PIES = 31;
/** Lienzo de los sprites (96×96). Se apoyan en la plataforma: la base queda 32 px bajo POS.y y crecen hacia arriba. */
const LIENZO = 96;
const ORIGEN_Y = (LIENZO - 32) / LIENZO;
/**
 * Carteles de nombre y vida. Disposición normal, en diagonal como el clásico: el del rival arriba a la izquierda y el
 * tuyo abajo a la derecha, así cada criatura tiene casi toda la altura libre (las etapas finales miden hasta 86 px).
 * `puntos`: dónde empieza la fila de puntos del equipo (y hacia dónde crece); `extras`: marcas de estado y de bajas.
 * Disposición «fila» (Mina y Cronoportal): las plataformas quedan arriba y el cartel del rival taparía a tu criatura,
 * así que los dos carteles van abajo, cada uno bajo su criatura, y sus marcas ocupan el hueco del centro.
 */
interface Disposicion {
  x: number;
  y: number;
  puntos: { x: number; y: number; paso: number };
  extras: { x: number; y: number };
}
const DISPOSICION_NORMAL: readonly [Disposicion, Disposicion] = [
  { x: 122, y: 82, puntos: { x: 116, y: 95, paso: -8 }, extras: { x: 70, y: 82 } },
  { x: 2, y: 2, puntos: { x: 124, y: 15, paso: 8 }, extras: { x: 144, y: 2 } },
];
const DISPOSICION_FILA: readonly [Disposicion, Disposicion] = [
  { x: 122, y: 88, puntos: { x: 126, y: 84, paso: 8 }, extras: { x: 172, y: 58 } },
  { x: 2, y: 88, puntos: { x: 112, y: 84, paso: -8 }, extras: { x: 102, y: 58 } },
];
const MENU = ['menu.atacar', 'menu.bolsa', 'menu.equipo', 'menu.retirarse'];

/**
 * Escena de combate. No contiene reglas: le pide un turno al motor y anima la lista de eventos.
 * Disposición propia: cada criatura tiene su panel justo encima (tú a la izquierda, rival a la derecha).
 */
export class Combate extends Phaser.Scene {
  private cfg!: ConfigCombate;
  private bat!: Batalla;
  private rngIA!: Rng;
  private vivo = true;
  private sprites!: [Phaser.GameObjects.Image, Phaser.GameObjects.Image];
  /** Centro de las plataformas del fondo de este combate: donde apoyan los pies [tú, rival]. */
  /** Disposición «fila» de los carteles (Mina y Cronoportal). */
  private fila = false;
  private pies: [{ x: number; y: number }, { x: number; y: number }] = [PLATAFORMAS_BASE[0], PLATAFORMAS_BASE[1]];
  private paneles!: [Panel, Panel];
  private capaPaneles!: Phaser.GameObjects.Container;
  private turnoTxt!: Texto;
  private fx!: Efectos;
  /** Todo lo que «filma» la cámara: fondo, criaturas y efectos. La interfaz queda fuera y no se mueve. */
  private mundo!: Phaser.GameObjects.Container;
  private capaFx!: Phaser.GameObjects.Container;
  /**
   * Desde dónde se mira el combate. 'jugador': tu criatura de espaldas abajo a la izquierda (lo clásico).
   * 'rival': la cámara gira y quien queda de espaldas es el rival, para ver su ataque desde atrás.
   */
  private vista: 'jugador' | 'rival' = 'jugador';
  /** Cámara simulada sobre `mundo`: acercamiento, punto que mira y giro (1 normal, 0 de canto). */
  private cam = { zoom: 1, fx: 120, fy: 80, giro: 1 };
  private reloj = 0;
  /** Temblor del escenario en píxeles del mundo; baja a 0 solo. */
  private sacudida = { px: 0 };
  /** Durante el Definitivo el velo cubre los bordes: el temblor puede ser más fuerte. */
  private temblorLibre = false;
  /** Desenfoque horizontal del mundo para el barrido de cámara (solo WebGL; si no hay, el barrido va sin él). */
  private desenfoque: { strength: number } = { strength: 0 };
  private filtroBlur: Phaser.Filters.Blur | null = null;

  private gVentanas!: Phaser.GameObjects.Graphics;
  private msg!: Texto;
  private opciones: Texto[] = [];
  private celdas: { nombre: Texto; usos: Texto }[] = [];
  private filasEquipo: Texto[] = [];
  private icoTipo: Phaser.GameObjects.Image | null = null;
  private icoCat: Phaser.GameObjects.Image | null = null;
  private info1!: Texto;
  private info2!: Texto;
  /** Fila del Ataque Definitivo en el menú de ataques. */
  private defTxt!: Texto;
  private cursor!: Phaser.GameObjects.Graphics;
  private alPulsar: ((a: AccionEntrada) => void) | null = null;
  /** El menú abierto recibe aquí la opción que señala el puntero (mouse o dedo). */
  private alApuntar: ((i: number) => void) | null = null;
  private puntero!: Puntero;
  private ultimoMenu = 0;
  private ultimaHabilidad = 0;

  constructor() {
    super('Combate');
  }

  init(cfg: ConfigCombate): void {
    this.cfg = cfg;
    this.vivo = true;
    this.opciones = [];
    this.celdas = [];
    this.filasEquipo = [];
    this.alPulsar = null;
    this.ultimoMenu = 0;
    this.ultimaHabilidad = 0;
    this.vista = 'jugador';
    this.cam = { zoom: 1, fx: 120, fy: 80, giro: 1 };
    this.reloj = 0;
    this.sacudida = { px: 0 };
    this.temblorLibre = false;
  }

  create(): void {
    const modo = this.cfg.modo ?? 'rapido';
    // El Desafío del día usa la semilla de la fecha: mismo azar para todos. Gasta el intento al empezar.
    const desafio = modo === 'desafio' ? desafioDelDia(DATOS, Date.now()) : null;
    if (desafio) {
      empezarDesafio(juego.estado, Date.now());
      juego.guardar();
    }
    const semilla = desafio ? desafio.semilla : (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
    const rng = new Rng(semilla);
    this.rngIA = new Rng(semilla ^ 0x9e3779b9);
    // Cronoportal: pelean las que siguen en pie en la expedición, con la vida que les quedó.
    const ex = modo === 'crono' ? juego.estado.crono?.expedicion : undefined;
    const nodoCrono = modo === 'crono' ? nodoActual(DATOS, juego.estado) : null;
    const mios = ex ? equipoExpedicion(juego.estado) : equipoDe(juego.estado);
    const prestados = desafio ? equiposDesafio(DATOS, desafio) : null;
    const rival = prestados
      ? prestados[1]
      : modo === 'torre'
        ? equipoPiso(DATOS, datosPiso(DATOS, this.cfg.piso ?? juego.estado.torre.piso, mios.length))
        : this.esPrevia()
          ? equipoEstacion(DATOS, modo as ModoRuta, Date.now(), mios, this.cfg.estacion!)
          : modo === 'entrenador'
          ? equipoEntrenador(DATOS, entrenadorDelDia(DATOS, Date.now()), mios)
          : modo === 'semanal'
            ? equipoSemanal(DATOS, Date.now(), mios)
            : modo === 'mina'
              ? equipoGuarida(DATOS, this.cfg.zona ?? 1, mios.length)
              : ex && nodoCrono
                ? rivalesNodo(DATOS, ex.era, nodoCrono, ex.semilla, mios.length)
                : generarRival(DATOS, mios, rng);
    this.rivalInicial = rival[0]!.especie.id;
    const propios = prestados ? prestados[0] : mios.map((c) => combatienteDe(DATOS, c));
    if (ex) for (const cb of propios) cb.ps = Math.max(1, Math.round(cb.stats.ps * (ex.vida[cb.especie.id] ?? 1)));
    this.bat = new Batalla(DATOS, [propios, rival], rng);
    if (ex) this.bat.regla = reglaDe(DATOS, ex.era);
    // Ataque Definitivo: siempre para ti; entre los rivales, solo jefes de la Torre y el Entrenador del día, que lo cargan avisando.
    const jefe = modo === 'torre' && datosPiso(DATOS, this.cfg.piso ?? 1, 1).jefe;
    this.bat.definitivoPermitido = [true, ((modo === 'entrenador' || modo === 'semanal') && !this.esPrevia()) || modo === 'mina' || jefe || nodoCrono?.tipo === 'jefe'];
    this.bat.definitivoConCarga = [false, true];
    // Cada modo tiene su música; el combate rápido alterna entre tres canciones.
    const pisoTorre = modo === 'torre' ? datosPiso(DATOS, this.cfg.piso ?? 1, 1) : null;
    musica.tocar(
      pisoTorre ? (pisoTorre.guardian ? 'guardian' : pisoTorre.jefe ? 'jefe' : 'torre') : modo === 'entrenador' ? 'entrenador' : modo === 'semanal' ? 'semanal' : modo === 'desafio' ? 'torre' : modo === 'mina' || nodoCrono?.tipo === 'jefe' ? 'jefe' : ['combate', 'combate2', 'combate3'][Math.floor(Math.random() * 3)]!,
    );
    this.verRival();

    prepararCamara(this);
    // Velocidad ×2: todo el combate (esperas, textos y animaciones) corre sobre el reloj de la escena.
    const velocidad = () => {
      this.time.timeScale = ajustes.velocidad;
      this.tweens.timeScale = ajustes.velocidad;
    };
    velocidad();
    const dejar = alCambiarAjustes(velocidad);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, dejar);
    const [yo, el] = this.bat.lados;
    // El escenario depende del tipo del primer rival; uno de cada cuatro combates ocurre en la pradera.
    const arena = rng.prob(25) ? 'pradera' : (FONDO_POR_TIPO[el.especie.tipo] ?? 'pradera');
    this.mundo = this.add.container(0, 0);
    // La guarida de la Mina usa su propio fondo (960×455, como los demás fondos de combate).
    const exCrono = modo === 'crono' ? juego.estado.crono?.expedicion : undefined;
    const guarida = modo === 'mina' ? `mina_guarida${this.cfg.zona ?? 1}` : exCrono ? `crono_era${exCrono.era}` : '';
    if (guarida && this.textures.exists(guarida)) this.mundo.add(this.add.image(0, 0, guarida).setOrigin(0, 0).setScale(240 / 960)); else this.mundo.add(this.add.image(0, 0, fondo(this, modo === 'mina' ? 'volcan' : arena)).setOrigin(0, 0).setScale(0.25));
    const clavePlat = guarida && this.textures.exists(guarida) ? guarida : '';
    const plat = PLATAFORMAS[clavePlat] ?? PLATAFORMAS_BASE;
    this.fila = !!clavePlat;
    this.pies = [plat[0], plat[1]];
    this.sprites = [
      this.add.image(plat[0].x - 120, plat[0].y - PIES * this.escalaDe(0), textura(yo.especie.id, 'espalda', yo.brillante)).setOrigin(0.5, ORIGEN_Y),
      this.add.image(plat[1].x + 120, plat[1].y - PIES * this.escalaDe(1), textura(el.especie.id, 'frente', el.brillante)).setOrigin(0.5, ORIGEN_Y),
    ];
    this.mundo.add(this.sprites);
    // Arte HD (D243): mientras cargan las grandes se ve el pixel art; al llegar se cambian sin mover nada.
    this.sprites.forEach((sp, i) => this.ponerSprite(sp, sp.texture.key, i as Lado));
    void cargarGrandes(this, this.bat.equipos.flatMap((e) => e.miembros.map((m) => m.especie.id))).then(() => {
      if (!this.vivo) return;
      this.sprites.forEach((sp, i) => sp.alpha > 0 && this.ponerSprite(sp, this.texturaDe(i as Lado, this.bat.act(i as Lado)), i as Lado));
    });
    this.capaFx = this.add.container(0, 0);
    this.mundo.add(this.capaFx);
    this.fx = new Efectos(this, this.capaFx, (ms, f) => this.temblor(ms, f));
    this.desenfoque = { strength: 0 };
    this.filtroBlur = null;
    if (this.mundo.enableFilters && this.mundo.enableFilters().filters) {
      this.filtroBlur = this.mundo.filters!.external.addBlur(1, 1, 0, 0, 0xffffff, 4);
      this.filtroBlur.active = false;
    }
    this.add.graphics().fillStyle(n(C.tinta), 1).fillRect(0, 110, 240, 50);
    const disp = clavePlat ? DISPOSICION_FILA : DISPOSICION_NORMAL;
    const antes = new Set(this.children.list);
    this.paneles = [this.crearPanel(disp[0]), this.crearPanel(disp[1])];
    // Los carteles se agrupan para poder ocultarlos enteros durante el turno (D257).
    this.capaPaneles = this.add.container(0, 0, this.children.list.filter((o) => !antes.has(o)));
    this.refrescarPanel(0);
    this.refrescarPanel(1);
    this.turnoTxt = new Texto(this, 4, 30, 116, 10, '#ffffff', 'izq', { borde: '#2b3a78' });

    this.gVentanas = this.add.graphics();
    this.msg = new Texto(this, 10, 118, 220, 30, C.tinta);
    MENU.forEach((clave, i) => {
      this.opciones.push(new Texto(this, 154 + (i % 2) * 40, 120 + Math.floor(i / 2) * 15, 40, 10, C.tinta).poner(t(clave)).visible(false));
    });
    for (let i = 0; i < 4; i++) {
      const x = 14 + (i % 2) * 110;
      const y = 116 + Math.floor(i / 2) * 9;
      this.celdas.push({ nombre: new Texto(this, x, y, 84, 10).visible(false), usos: new Texto(this, x + 80, y, 26, 10, C.tinta, 'der').visible(false) });
    }
    for (let i = 0; i < 3; i++) this.filasEquipo.push(new Texto(this, 18, 117 + i * 12, 212, 10).visible(false));
    this.info1 = new Texto(this, 10, 137, 220, 10, C.tintaSuave).visible(false);
    this.icoTipo = pieza(this, 'tipo_brasa', 13, 142, 8)?.setVisible(false) ?? null;
    this.icoCat = pieza(this, 'categoria_fisico', 22, 142, 8)?.setVisible(false) ?? null;
    this.info2 = new Texto(this, 10, 146, 220, 10, C.tinta).visible(false);
    this.defTxt = new Texto(this, 10, 134, 220, 10, '#b8860b', 'centro', { peso: 600 }).visible(false);
    this.cursor = this.add.graphics();
    this.puntero = new Puntero(this);

    Entrada.escuchar((a) => this.alPulsar?.(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.vivo = false;
      Entrada.escuchar(null);
    });
    void this.correr();
  }

  // ------------------------------------------------------------ flujo

  private async correr(): Promise<void> {
    this.modoMensaje();
    await Promise.all([
      this.tween({ targets: this.sprites[0], x: this.pos(0).x, duration: 550, ease: 'Cubic.easeOut' }),
      this.tween({ targets: this.sprites[1], x: this.pos(1).x, duration: 550, ease: 'Cubic.easeOut' }),
    ]);
    if (this.cfg.modo === 'desafio') await this.decir(t('c.desafio', { n: desafioDelDia(DATOS, Date.now()).numero }));
    if (this.esPrevia()) await this.decir(t(`c.estacion.${this.cfg.modo}`, { n: this.cfg.estacion! + 1 }));
    else if (this.cfg.modo === 'entrenador') await this.decir(t('c.entrenador', { n: entrenadorDelDia(DATOS, Date.now()).nombre }));
    else if (this.cfg.modo === 'semanal') await this.decir(t('c.semanal', { n: this.nom(1), t: DATOS.tipos.get(tipoDeLaSemana(DATOS, Date.now()))!.nombre }));
    if (this.cfg.modo === 'torre') {
      const p = datosPiso(DATOS, this.cfg.piso ?? 1, 1);
      await this.decir(t(p.jefe ? 'c.torreJefe' : 'c.torre', { n: p.piso }));
      if (p.guardian) await this.decir(t('c.guardian', { n: this.nom(1) }));
    }
    if (this.cfg.modo === 'crono' && this.bat.regla) {
      const ex = juego.estado.crono!.expedicion!;
      await this.decir(t(nodoActual(DATOS, juego.estado)?.tipo === 'jefe' ? 'c.cronoJefe' : 'c.crono', { e: t(`crono.era${ex.era}`) }));
      await this.decir(t(`crono.regla.${this.bat.regla}`));
    }
    if (this.bat.act(1).brillante) this.efectoSobre(1, 'fx_brillante');
    await this.decir(t('c.aparece', { n: this.nom(1) }));
    if (this.bat.act(0).brillante) this.efectoSobre(0, 'fx_brillante');
    await this.decir(t('c.adelante', { n: this.nom(0) }));

    while (this.vivo && !this.bat.terminado) {
      this.turnoTxt.poner(t('c.turno', { n: this.bat.turno + 1 }));
      await this.girar('jugador');
      const accion = await this.elegirAccion();
      if (!this.vivo) return;
      if (accion === 'retirada') {
        this.modoMensaje();
        await this.decir(t('c.retirada'));
        await this.resultado(true);
        return;
      }
      this.capaPaneles.setVisible(false);
      this.turnoTxt.visible(false);
      // Golpe justo: si el ataque hace daño, la barra decide cuánto más fuerte pega (solo para ti).
      const mult = accionConDano(this.bat, 0, accion) ? await this.golpeJusto() : 1;
      if (!this.vivo) return;
      const rival = elegirAccion(this.bat, 1, this.cfg.ia, this.rngIA);
      this.modoMensaje();
      this.bat.potenciador = [mult, 1];
      const eventos = this.bat.ejecutarTurno(accion, rival);
      this.bat.potenciador = [1, 1];
      await this.reproducir(eventos);
      this.capaPaneles.setVisible(true);
      this.turnoTxt.visible(true);
      // Quien perdió a su criatura activa elige reemplazo antes del turno siguiente.
      while (this.vivo && this.bat.pendientes.length) {
        const lado = this.bat.pendientes[0]!;
        if (lado === 0) await this.girar('jugador');
        const indice = lado === 0 ? await this.menuEquipo(true) : elegirReemplazo(this.bat, 1, this.cfg.ia, this.rngIA);
        if (!this.vivo || indice === null) return;
        this.modoMensaje();
        await this.reproducir(this.bat.reemplazar(lado, indice));
      }
    }
    if (this.vivo) await this.resultado(false);
  }

  private async reproducir(eventos: Evento[]): Promise<void> {
    let ultima: { lado: Lado; h: Habilidad | null } | null = null;
    // Nombres de quienes estaban en el campo al empezar, para anunciar los cambios.
    const enCampo: [string, string] = [this.sprites[0].getData('nombre') ?? '', this.sprites[1].getData('nombre') ?? ''];
    for (const e of eventos) {
      if (!this.vivo) return;
      switch (e.t) {
        case 'turno':
          break;
        case 'cambio':
          await this.animCambio(e.lado, e.forzado, enCampo[e.lado]);
          enCampo[e.lado] = this.bat.act(e.lado).nombre;
          if (this.bat.act(e.lado).brillante) this.efectoSobre(e.lado, 'fx_brillante');
          break;
        case 'usa':
          ultima = { lado: e.lado, h: e.habilidad };
          await this.girarHacia(e.lado);
          await this.decir(e.habilidad ? t('c.usa', { n: this.nom(e.lado), h: e.habilidad.nombre }) : t('c.empujon', { n: this.nom(e.lado) }));
          if (e.habilidad && e.habilidad.potencia === 0 && e.habilidad.rol !== 'definitivo') await this.animApoyo(e.lado, e.habilidad);
          break;
        case 'falla':
          sonido.tocar('falla');
          await this.decir(t('c.falla'));
          break;
        case 'carga':
          await this.girarHacia(e.lado);
          await this.animCarga(e.lado);
          break;
        case 'definitivo':
          await this.animDefinitivo(e.lado, ultima?.h ?? null);
          break;
        case 'definitivo_bloqueado':
          sonido.tocar('escudo');
          this.temblor(300, 0.012);
          await this.decir(t('c.definitivoBloqueado', { n: this.nom(e.lado) }));
          break;
        case 'regla':
          await this.animRegla(e);
          break;
        case 'dano': {
          const atacante = (1 - e.lado) as Lado;
          // El Definitivo ya tuvo su propia animación.
          if (ultima?.h?.rol !== 'definitivo') {
            this.enfocar(e.lado, ultima?.h?.rol === 'final' ? 1.16 : 1.1);
            await this.animAtaque(atacante, ultima?.h ?? null);
          }
          sonido.tocar(e.efectividad === 'ventaja' || e.critico ? 'golpe_fuerte' : e.efectividad === 'desventaja' || e.reducido ? 'golpe_debil' : 'golpe');
          if (ultima?.h?.rol === 'final') this.temblor(180, 0.01);
          if (e.critico) this.efectoSobre(e.lado, 'fx_critico');
          await this.animGolpe(e.lado);
          this.soltar();
          await this.animarPs(e.lado, e.ps);
          if (e.critico) await this.decir(t('c.critico'));
          if (e.efectividad === 'ventaja' && e.lado === 1) registrar(DATOS, juego.estado, 'eficaz');
          if (e.efectividad === 'ventaja') await this.decir(t('c.ventaja'));
          if (e.efectividad === 'desventaja') await this.decir(t('c.desventaja', { n: this.nom(e.lado) }));
          break;
        }
        case 'bloqueado':
          sonido.tocar('escudo');
          await this.decir(t('c.bloqueado', { n: this.nom(e.lado) }));
          break;
        case 'guardia':
          sonido.tocar('escudo');
          await this.decir(t(`c.guardia.${e.modo}`, { n: this.nom(e.lado) }));
          break;
        case 'pasiva':
          // Las pasivas con nombre propio (alias) usan el mensaje de su mecánica.
          const clave = (DATOS.balance.pasivasAlias as Record<string, { mecanica: string } | undefined>)[e.pasiva]?.mecanica ?? e.pasiva;
          await this.decir(t(`c.pasiva.${clave}`, { n: this.nom(e.lado) }));
          break;
        case 'estado_aplicado':
          sonido.tocar('estado');
          this.pintarEstado(e.lado);
          await this.fx.estado(e.estado, this.centro(e.lado));
          await this.decir(t(`c.estado.${e.estado}`, { n: this.nom(e.lado) }));
          break;
        case 'estado_dano':
          sonido.tocar('golpe_debil');
          await Promise.all([this.fx.estado(e.estado, this.centro(e.lado)), this.animGolpe(e.lado)]);
          await this.animarPs(e.lado, e.ps);
          await this.decir(t(`c.estado_dano.${e.estado}`, { n: this.nom(e.lado) }));
          break;
        case 'estado_fin':
          this.pintarEstado(e.lado);
          await this.decir(t(`c.estado_fin.${e.estado}`, { n: this.nom(e.lado) }));
          break;
        case 'estado_impide':
          void this.fx.estado(e.estado, this.centro(e.lado));
          await this.decir(t(`c.impide.${e.estado}`, { n: this.nom(e.lado) }));
          break;
        case 'sin_efecto':
          await this.decir(t('c.sin_efecto'));
          break;
        case 'etapa':
          sonido.tocar(e.delta > 0 ? 'sube' : 'baja');
          this.pintarEstado(e.lado);
          await this.decir(t(e.delta > 0 ? 'c.etapa.sube' : 'c.etapa.baja', { stat: t(`stat.${e.stat}`), n: this.nom(e.lado) }));
          break;
        case 'etapa_tope':
          await this.decir(t('c.etapa.tope', { stat: t(`stat.${e.stat}`), n: this.nom(e.lado) }));
          break;
        case 'cura':
          sonido.tocar('cura');
          await Promise.all([this.fx.curar(this.centro(e.lado)), this.animarPs(e.lado, e.ps)]);
          await this.decir(t(e.origen === 'pasiva' ? `c.curaPasiva.${this.bat.act(e.lado).especie.pasiva}` : 'c.cura', { n: this.nom(e.lado) }));
          break;
        case 'item':
          await this.girarHacia(e.lado);
          if (e.lado === 0) {
            sonido.tocar('aceptar');
            registrar(DATOS, juego.estado, 'item');
          }
          await this.decir(t('c.item', { i: e.item.nombre, n: this.nom(e.lado) }));
          break;
        case 'revive': {
          sonido.tocar('cura');
          this.pintarPuntos(e.lado);
          const m = this.bat.equipos[e.lado].miembros[e.indice]!;
          await this.decir(t('c.revive', { n: m.nombre, ps: e.ps }));
          break;
        }
        case 'usos':
          sonido.tocar('cura');
          await Promise.all([this.fx.curar(this.centro(e.lado)), this.decir(t('c.usos', { n: this.nom(e.lado) }))]);
          break;
        case 'cansancio':
          await this.animarPs(e.lado, e.ps);
          await this.decir(t('c.cansancio', { n: this.nom(e.lado) }));
          break;
        case 'debilitado':
          sonido.tocar('debilitado');
          await this.animDebilitado(e.lado);
          this.pintarPuntos(e.lado);
          await this.decir(t('c.debilitado', { n: this.nom(e.lado) }));
          break;
        case 'fin':
          break;
      }
    }
    // Los estados pueden haber cambiado sin evento propio (por ejemplo, al despertar).
    this.pintarEstado(0);
    this.pintarEstado(1);
  }

  /** Efecto visual y mensaje de la regla de la era (Cronoportal). */
  private async animRegla(e: Extract<Evento, { t: 'regla' }>): Promise<void> {
    const lado = e.lado;
    switch (e.regla) {
      case 'marea':
        sonido.tocar('giro');
        if (this.anims.exists('crono_marea') || this.textures.exists('crono_marea')) void animar(this, 'crono_marea', 120, 92, { contenedor: this.mundo, profundidad: 25, quedar: 900 });
        await this.decir(t('crono.c.marea'));
        break;
      case 'esporas':
        if (lado !== undefined) this.efectoSobre(lado, 'crono_esporas');
        await this.decir(t('crono.c.esporas', { n: this.nom(lado ?? 0) }));
        break;
      case 'estampida': {
        sonido.tocar('golpe_fuerte');
        crearAnimaciones(this);
        const m = this.add.sprite(-60, 84, 'crono_estampida').setDepth(25);
        this.mundo.add(m);
        m.play('crono_estampida');
        this.temblor(500, 0.012);
        this.tweens.add({ targets: m, x: 300, duration: 900, onComplete: () => m.destroy() });
        if (lado !== undefined) {
          await this.esperar(400);
          await this.animGolpe(lado);
          if (e.ps !== undefined) await this.animarPs(lado, e.ps);
        }
        await this.decir(t('crono.c.estampida', { n: this.nom(lado ?? 0) }));
        break;
      }
      case 'meteoro':
        if (e.turnos && e.turnos > 0) {
          await this.decir(t('crono.c.meteoroCuenta', { n: e.turnos }));
          break;
        }
        if (lado === undefined) {
          // Cae: el meteoro cruza y estalla en el centro.
          crearAnimaciones(this);
          const m = this.add.sprite(230, -10, 'crono_meteoro').setDepth(40);
          this.mundo.add(m);
          m.play('crono_meteoro');
          sonido.tocar('explota');
          await this.tween({ targets: m, x: 120, y: 70, duration: 600, ease: 'Quad.easeIn' });
          m.destroy();
          this.cameras.main.flash(300, 255, 200, 120);
          this.temblor(600, 0.02);
          void animar(this, 'crono_meteoro_impacto', 120, 66, { contenedor: this.mundo, profundidad: 40, escala: 1.5 });
          await this.decir(t('crono.c.meteoro'));
        } else if (e.ps !== undefined) await this.animarPs(lado, e.ps);
        break;
      case 'frio':
        if (lado !== undefined) this.efectoSobre(lado, 'crono_escarcha');
        await this.decir(t('crono.c.frio', { n: this.nom(lado ?? 0) }));
        break;
    }
  }

  /** Fin de un combate del Cronoportal: guarda la vida del equipo, cobra y vuelve al mapa (o al portal). */
  private async resultadoCrono(retirada: boolean): Promise<void> {
    const r = aplicarRecompensa(DATOS, juego.estado, this.bat, this.cfg.ia, retirada, 0);
    const vidas: Record<string, number> = {};
    for (const c of this.bat.equipos[0].miembros) vidas[c.especie.id] = c.ps / c.stats.ps;
    const res = terminarCombate(DATOS, juego.estado, r.victoria && !retirada, vidas);
    juego.guardar();
    musica.tocar(r.victoria ? 'victoria' : 'derrota');
    const lineas: string[] = [];
    if (res.monedas) lineas.push(t('fin.monedas', { n: res.monedas }));
    if (r.xpPorCriatura) lineas.push(t('fin.xp', { n: r.xpPorCriatura }));
    for (const s of r.subidas) lineas.push(t('fin.sube', { n: this.nomMia(s.especie), nv: s.nivel }));
    if (res.fin === 'jefe') {
      lineas.push(t('crono.fin.jefe', { f: res.fosiles, a: res.ambar }));
      if (res.eraNueva) lineas.push(t('crono.fin.eraNueva'));
    }
    if (res.fin === 'derrota') lineas.push(...partir(t('crono.fin.derrota'), 146));
    const alto = 34 + lineas.length * 9;
    const g = this.add.graphics();
    ventana(g, 44, 32, 152, alto);
    new Texto(this, 44, 38, 152, 12, r.victoria ? '#257179' : C.resalte, 'centro', { tam: 9.5, peso: 600 }).poner(t(retirada ? 'fin.retirada' : r.victoria ? 'fin.victoria' : 'fin.derrota'));
    new Texto(this, 44, 51, 152, lineas.length * 9 + 4, C.tinta, 'centro').poner(lineas.join('\n'));
    new Texto(this, 44, 53 + lineas.length * 9, 152, 10, C.tintaSuave, 'centro').poner(t('fin.continuar'));
    this.msg.poner('');
    if (r.subidas.length) this.efectoSobre(0, 'fx_subir_nivel');
    if (res.fin === 'jefe') confeti(this, 120, 26, 22);
    await this.esperar(400);
    this.alPulsar = (a) => {
      if (a !== 'a' && a !== 'b') return;
      sonido.tocar('aceptar');
      if (res.fin === 'sigue') this.scene.start('CronoMapa', {});
      else if (res.fin === 'jefe') this.scene.start('Premio', { volver: { escena: 'Cronoportal', datos: {} } });
      else this.scene.start('Cronoportal', {});
    };
  }

  /** Ganó una insignia de jefe en este combate (para su efecto en la ventana final). */
  private ganoInsignia = false;

  /** Reproduce un efecto del autor sobre el cuerpo de la criatura activa de un lado (sigue al escenario). */
  private efectoSobre(lado: Lado, clave: ClaveAnim): void {
    const s = this.sprites[lado];
    if (!s) return;
    const alto = altoVisible(this.bat.act(lado).especie.id);
    void animar(this, clave, s.x, s.y - alto / 2, { contenedor: this.mundo, profundidad: 30 });
  }

  /** Combate contra una estación previa del camino (no el jefe). */
  private esPrevia(): boolean {
    const m = this.cfg.modo;
    if ((m !== 'entrenador' && m !== 'semanal') || this.cfg.estacion === undefined) return false;
    return this.cfg.estacion < DATOS.economia.rutas.previas;
  }

  /** Reparte la recompensa, guarda la partida y muestra el resumen. */
  private async resultado(retirada: boolean): Promise<void> {
    const modo = this.cfg.modo ?? 'rapido';
    if (modo === 'desafio') return this.resultadoDesafio();
    if (modo === 'crono') return this.resultadoCrono(retirada);
    // Torre y Entrenador pagan su propio premio en lugar de las monedas por dificultad.
    const r = aplicarRecompensa(DATOS, juego.estado, this.bat, this.cfg.ia, retirada, modo === 'rapido' ? undefined : 0);
    const extra: string[] = [];
    const nombreSobre = (id: string) => DATOS.sobres.sobres.find((s) => s.id === id)?.nombre ?? id;
    if (modo === 'torre' && !retirada) {
      const p = resultadoTorre(DATOS, juego.estado, this.cfg.piso ?? 1, r.victoria);
      if (r.victoria) extra.push(p.nuevo ? t('fin.piso', { n: this.cfg.piso ?? 1, m: p.monedas }) : t('fin.pisoRepetido'));
      if (p.sobre) extra.push(t('fin.sobre', { s: nombreSobre(p.sobre) }));
      const guardian = r.victoria ? datosPiso(DATOS, this.cfg.piso ?? 1, 1).guardian : null;
      if (guardian) this.insignia(guardian, extra);
    }
    const previa = this.esPrevia();
    if (previa && !retirada && r.victoria) {
      const m = ganarEstacion(DATOS, juego.estado, modo as ModoRuta, Date.now(), this.cfg.estacion!, equipoDe(juego.estado));
      extra.push(m ? t('fin.estacion', { n: this.cfg.estacion! + 1, m }) : t('fin.estacionRepetida'));
    }
    if (modo === 'semanal' && !retirada && !previa) {
      const p = resultadoSemanal(DATOS, juego.estado, r.victoria, Date.now());
      if (p) extra.push(t('fin.semanal', { n: p.monedas ?? 0, s: p.sobre ? nombreSobre(p.sobre) : '' }));
      if (r.victoria) this.insignia(this.rivalInicial, extra);
    }
    if (modo === 'mina' && !retirada && r.victoria) {
      const p = vencerGuarida(DATOS, juego.estado, this.cfg.zona ?? 1, Date.now());
      if (p.huevo) extra.push(t('fin.huevo', { n: DATOS.criaturas.get(p.huevo)!.nombre, h: DATOS.economia.mina.eclosionHoras }));
      else extra.push(t('fin.guaridaMonedas', { n: p.monedas }));
      this.insignia(this.rivalInicial, extra);
    }
    if (modo === 'entrenador' && !retirada && !previa) {
      const p = resultadoEntrenador(DATOS, juego.estado, r.victoria, Date.now());
      if (p.monedas) extra.push(t('fin.entrenador', { n: p.monedas }));
      if (p.sobre) extra.push(t('fin.sobre', { s: nombreSobre(p.sobre) }));
    }
    // Perder no es tiempo tirado: premio de valiente, «¡casi!» y un consejo de tipos.
    if (!r.victoria && !retirada) {
      const cs = darConsuelo(DATOS, juego.estado, this.bat, Date.now());
      if (cs.esencia) extra.push(t('fin.valiente', { n: cs.esencia }));
      if (cs.casi !== null) extra.push(t('fin.casi', { n: Math.max(1, Math.round(cs.casi * 100)) }));
      if (cs.consejo) {
        const nombreTipo = (id: string) => DATOS.tipos.get(id)!.nombre;
        const fuertes = cs.consejo.fuertes.map(nombreTipo).join(t('fin.o'));
        extra.push(t('fin.consejo', { r: nombreTipo(cs.consejo.rival), f: fuertes }));
        if (cs.consejo.tuya) extra.push(t('fin.consejoTuya', { n: this.nomMia(cs.consejo.tuya) }));
      }
    }
    juego.guardar();
    musica.tocar(r.victoria ? 'victoria' : 'derrota');
    const lineas = [t('fin.turnos', { n: this.bat.turno }), ...extra].flatMap((l) => partir(l, 146));
    if (r.monedas) lineas.push(t('fin.monedas', { n: r.monedas }));
    if (r.xpPorCriatura) lineas.push(t('fin.xp', { n: r.xpPorCriatura }));
    for (const s of r.subidas) lineas.push(t('fin.sube', { n: this.nomMia(s.especie), nv: s.nivel }));
    if (r.entrenamiento) lineas.push(t('fin.entrenamiento', { n: r.entrenamiento }));
    for (const e of r.listas) lineas.push(t('fin.evoLista', { n: this.nomMia(e) }));
    const alto = 34 + lineas.length * 9;
    const g = this.add.graphics();
    ventana(g, 44, 32, 152, alto);
    new Texto(this, 44, 38, 152, 12, r.victoria ? '#257179' : C.resalte, 'centro', { tam: 9.5, peso: 600 }).poner(t(retirada ? 'fin.retirada' : r.victoria ? 'fin.victoria' : 'fin.derrota'));
    new Texto(this, 44, 51, 152, lineas.length * 9 + 4, C.tinta, 'centro').poner(lineas.join('\n'));
    new Texto(this, 44, 53 + lineas.length * 9, 152, 10, C.tintaSuave, 'centro').poner(t('fin.continuar'));
    this.msg.poner('');
    // Efectos del autor: subir de nivel sobre tu criatura e insignia de jefe sobre la ventana.
    if (r.subidas.length) {
      sonido.tocar('sube');
      this.efectoSobre(0, 'fx_subir_nivel');
    }
    if (this.ganoInsignia) void animar(this, 'fx_insignia', 120, 30, { profundidad: 60, quedar: 1600 });
    if (r.victoria) confeti(this, 120, 26, 18);
    await this.esperar(400);
    this.alPulsar = (a) => {
      if (a !== 'a' && a !== 'b') return;
      sonido.tocar('aceptar');
      // Al ganar se elige una carta premio. La Torre y los caminos vuelven a su mapa.
      const volver = modo === 'torre' ? { escena: 'Torre', datos: { subio: r.victoria } } : modo === 'entrenador' || modo === 'semanal' ? { escena: 'Ruta', datos: { modo, avanzo: r.victoria } } : null;
      if (r.victoria) this.scene.start('Premio', volver ? { volver } : { submenu: 'combates' });
      else if (volver) this.scene.start(volver.escena, volver.datos);
      else this.scene.start('Menu', { submenu: 'combates' });
    };
  }

  /**
   * Fin del Desafío del día: sin experiencia (el equipo es prestado), un premio chico y el botón Compartir,
   * que copia o comparte el resultado en emojis. Retirarse cuenta como derrota.
   */
  private async resultadoDesafio(): Promise<void> {
    const ahora = Date.now();
    const d = desafioDelDia(DATOS, ahora);
    const victoria = this.bat.ganador === 0;
    const vidas = this.bat.equipos[0].miembros.map((m) => m.ps / m.stats.ps);
    const r = { victoria, turnos: this.bat.turno, vidas };
    const premio = terminarDesafio(DATOS, juego.estado, ahora, r);
    // Cuenta para las misiones como cualquier combate (retirarse no).
    if (this.bat.terminado) registrar(DATOS, juego.estado, 'combate');
    if (victoria) registrar(DATOS, juego.estado, 'victoria');
    juego.guardar();
    musica.tocar(victoria ? 'victoria' : 'derrota');
    const texto = textoCompartir(d.numero, r, juego.estado.desafio.racha, urlJuego());
    // La segunda línea queda libre para los cuadritos de colores (dibujados abajo).
    const lineas = [t('fin.turnos', { n: this.bat.turno }), ' '];
    if (premio.monedas) lineas.push(t('fin.monedas', { n: premio.monedas }));
    if (premio.esencia) lineas.push(t('fin.esencia', { n: premio.esencia }));
    if (juego.estado.desafio.racha > 1) lineas.push(t('des.racha', { n: juego.estado.desafio.racha }));
    const alto = 58 + lineas.length * 9;
    const g = this.add.graphics();
    ventana(g, 40, 22, 160, alto);
    new Texto(this, 40, 31, 160, 12, victoria ? '#257179' : C.resalte, 'centro', { tam: 9.5, peso: 600 }).poner(t(victoria ? 'fin.victoria' : 'fin.derrota'));
    new Texto(this, 40, 44, 160, 9, C.tintaSuave, 'centro', { tam: 6.4 }).poner(t('des.desafio', { n: d.numero }));
    new Texto(this, 40, 54, 160, lineas.length * 9 + 4, C.tinta, 'centro').poner(lineas.join('\n'));
    const yCuad = 54 + 9 + 1;
    const gc = this.add.graphics();
    vidas.forEach((v, i) => {
      const x = 120 - (vidas.length * 10) / 2 + i * 10 + 1;
      gc.fillStyle(v > 0.5 ? 0x3fbf6a : v > 0 ? 0xf5c542 : 0xd0425a, 1).fillRoundedRect(x, yCuad, 8, 8, 1.5);
    });
    const aviso = new Texto(this, 40, 54 + lineas.length * 9 + 4, 160, 9, '#2f7a48', 'centro', { tam: 6.4 });
    new Texto(this, 40, 54 + lineas.length * 9 + 14, 160, 10, C.tintaSuave, 'centro').poner(t('des.compartirAyuda'));
    this.msg.poner('');
    await this.esperar(400);
    this.alPulsar = (a) => {
      if (a === 'a') {
        sonido.tocar('aceptar');
        void compartirTexto(texto).then((res) => aviso.poner(t(`des.${res}`)));
      } else if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.start('Menu', { submenu: 'combates' });
      }
    };
  }

  // ------------------------------------------------------------ menús

  private elegirAccion(): Promise<Accion | 'retirada'> {
    return new Promise((resolver) => {
      const menuPrincipal = () => {
        let sel = this.ultimoMenu;
        const pintar = () => {
          this.modoMenu(sel);
          this.msg.poner(partir(t('menu.pregunta', { n: this.nom(0) }), 124).join('\n'));
        };
        pintar();
        this.alApuntar = (i) => {
          if (i === sel) return;
          sel = i;
          sonido.tocar('cursor');
          pintar();
        };
        this.alPulsar = (a) => {
          if (a === 'izquierda' || a === 'derecha') sel ^= 1;
          else if (a === 'arriba' || a === 'abajo') sel ^= 2;
          else if (a === 'a') {
            this.ultimoMenu = sel;
            if (sel === 0) {
              sonido.tocar('aceptar');
              if (this.bat.accionesValidas(0)[0]!.tipo === 'empujon') {
                this.modoMensaje();
                this.alPulsar = null;
                void this.decir(t('menu.empujon', { n: this.nom(0) })).then(() => resolver({ tipo: 'empujon' }));
              } else menuHabilidades();
            } else if (sel === 2) {
              if (!this.bat.banca(0).length) {
                sonido.tocar('negado');
                this.msg.poner(partir(t('c.sinBanca'), 124).join('\n'));
                return;
              }
              sonido.tocar('aceptar');
              void this.menuEquipo(false).then((indice) => {
                if (indice === null) menuPrincipal();
                else resolver({ tipo: 'cambio', indice });
              });
            } else if (sel === 3) {
              sonido.tocar('cancelar');
              this.alPulsar = null;
              resolver('retirada');
            } else {
              if (!this.itemsDeCombate().length) {
                sonido.tocar('negado');
                this.msg.poner(partir(t('bolsa.vacia'), 124).join('\n'));
                return;
              }
              sonido.tocar('aceptar');
              menuBolsa();
            }
            return;
          } else return;
          sonido.tocar('cursor');
          pintar();
        };
      };
      /** `fin`: a quién entregar la habilidad elegida (el Reloj de Arena pide dos); sin `fin`, termina el turno. */
      const menuHabilidades = (fin?: (a: Accion) => void) => {
        let sel = this.ultimaHabilidad;
        // Si la última habilidad usada ya no está disponible, el cursor va a la primera que sí lo esté.
        if (this.bat.bloqueo(0, sel) !== null) sel = Math.max(0, [0, 1, 2, 3].findIndex((i) => this.bat.bloqueo(0, i) === null));
        this.modoHabilidades(sel);
        // Con Ataque Definitivo hay una quinta opción (4) debajo de la grilla.
        const conDef = !!this.bat.act(0).definitivo;
        this.alApuntar = (i) => {
          if (i === sel || (i === 4 && !conDef)) return;
          sel = i;
          sonido.tocar('cursor');
          this.modoHabilidades(sel);
        };
        this.alPulsar = (a) => {
          if (sel === 4) {
            if (a === 'arriba') sel = 2;
            else if (a === 'abajo') sel = 0;
          } else if (a === 'izquierda' || a === 'derecha') sel ^= 1;
          else if (conDef && a === 'abajo' && sel >= 2) sel = 4;
          else if (conDef && a === 'arriba' && sel < 2) sel = 4;
          else if (a === 'arriba' || a === 'abajo') sel ^= 2;
          if (a === 'b') {
            sonido.tocar('cancelar');
            menuPrincipal();
            return;
          } else if (a === 'a' && sel === 4) {
            if (fin || this.bat.bloqueoDefinitivo(0) !== null) {
              sonido.tocar('negado');
              return;
            }
            sonido.tocar('aceptar');
            this.alPulsar = null;
            resolver({ tipo: 'definitivo' });
            return;
          } else if (a === 'a') {
            if (this.bat.bloqueo(0, sel) !== null) {
              sonido.tocar('negado');
              return;
            }
            sonido.tocar('aceptar');
            this.ultimaHabilidad = sel;
            this.alPulsar = null;
            (fin ?? resolver)({ tipo: 'habilidad', indice: sel });
            return;
          }
          sonido.tocar('cursor');
          this.modoHabilidades(sel);
        };
      };
      const menuBolsa = () => {
        const items = this.itemsDeCombate();
        const usable = (i: Item) => this.bat.bloqueoItem(0, i) === null;
        // El cursor empieza en el primer ítem que se pueda usar ahora.
        let sel = Math.max(0, items.findIndex(usable));
        this.modoBolsa(items, sel);
        this.alApuntar = (i) => {
          if (i === sel || i >= items.length) return;
          sel = i;
          sonido.tocar('cursor');
          this.modoBolsa(items, sel);
        };
        this.alPulsar = (a) => {
          const total = items.length;
          if (a === 'izquierda' || a === 'derecha') {
            if ((sel ^ 1) >= total) return;
            sel ^= 1;
          } else if (a === 'arriba' || a === 'abajo') {
            // De a dos (una fila); al pasar el borde cambia de página.
            const filas = Math.ceil(total / 2);
            const fila = (Math.floor(sel / 2) + (a === 'abajo' ? 1 : filas - 1)) % filas;
            sel = Math.min(total - 1, fila * 2 + (sel % 2));
          } else if (a === 'b') {
            sonido.tocar('cancelar');
            menuPrincipal();
            return;
          } else if (a === 'a') {
            const item = items[sel]!;
            if (this.bat.bloqueoItem(0, item) !== null) {
              sonido.tocar('negado');
              return;
            }
            sonido.tocar('aceptar');
            this.alPulsar = null;
            if (item.efecto.tipo === 'doble') return void relojDeArena(item);
            // El ítem se gasta al elegirlo; la partida se guarda al final del combate.
            quitar(juego.estado, item.id);
            resolver({ tipo: 'item', item });
            return;
          } else return;
          sonido.tocar('cursor');
          this.modoBolsa(items, sel);
        };
      };
      /** Reloj de Arena: se eligen dos ataques seguidos. Con B se vuelve al menú sin gastarlo. */
      const relojDeArena = (item: Item) => {
        const listo = (primera: Accion, segunda: Accion) => {
          this.turnoTxt.poner(t('c.turno', { n: this.bat.turno + 1 }));
          quitar(juego.estado, item.id);
          resolver({ tipo: 'doble', item, primera, segunda });
        };
        if (this.bat.accionesValidas(0)[0]!.tipo === 'empujon') return listo({ tipo: 'empujon' }, { tipo: 'empujon' });
        this.turnoTxt.poner(t('c.reloj1'));
        menuHabilidades((primera) => {
          this.turnoTxt.poner(t('c.reloj2'));
          menuHabilidades((segunda) => listo(primera, segunda));
        });
      };
      menuPrincipal();
    });
  }

  /** Ítems de combate que tienes, en el orden de los datos (se muestran de a 4 por página). */
  private itemsDeCombate(): Item[] {
    return [...DATOS.items.values()].filter((i) => i.uso === 'combate' && cantidad(juego.estado, i.id) > 0);
  }

  private modoBolsa(items: Item[], sel: number): void {
    this.ocultarMenus();
    this.msg.visible(false);
    this.gVentanas.clear();
    ventana(this.gVentanas, 2, 112, 236, 46);
    this.gVentanas.fillStyle(n(C.papelSombra), 1).fillRect(8, 135, 224, 1);
    const pagina = Math.floor(sel / 4);
    const paginas = Math.ceil(items.length / 4);
    items.slice(pagina * 4, pagina * 4 + 4).forEach((it, k) => {
      const i = pagina * 4 + k;
      const n0 = cantidad(juego.estado, it.id);
      const bloqueado = this.bat.bloqueoItem(0, it) !== null;
      const color = bloqueado ? C.apagado : i === sel ? C.resalte : C.tinta;
      this.celdas[k]!.nombre.poner(it.nombre, color).visible(true);
      this.celdas[k]!.usos.poner(`×${n0}`, color).visible(true);
      this.zonaMenu(6 + (k % 2) * 110, 115 + Math.floor(k / 2) * 9, 110, 9, i);
    });
    const k = sel % 4;
    const x = 8 + (k % 2) * 110;
    const y = 117 + Math.floor(k / 2) * 9;
    this.cursor.fillStyle(n(C.resalte), 1).fillTriangle(x, y, x, y + 6, x + 4, y + 3);
    this.puntero.marcar(`b${sel}`, this.celdas[k]?.nombre.imagen);
    const it = items[sel]!;
    const motivo = this.bat.bloqueoItem(0, it);
    this.info1.imagen.setX(10);
    const restan = t('bolsa.restan', { n: this.bat.itemsUsados[0], max: DATOS.reglasItems.maxPorCombate });
    this.info1.poner(paginas > 1 ? `${restan} · ${t('bolsa.pagina', { p: pagina + 1, n: paginas })}` : restan).visible(true);
    this.info2
      .poner(motivo ? t(`bolsa.${motivo}`, { n: DATOS.reglasItems.maxPorCombate }) : it.descripcion, motivo ? C.resalte : C.tinta)
      .visible(true);
  }

  /** Lista del equipo para cambiar de criatura. Si es forzado (la activa cayó) no se puede cancelar. */
  private menuEquipo(forzado: boolean): Promise<number | null> {
    return new Promise((resolver) => {
      const equipo = this.bat.equipos[0];
      let sel = this.bat.banca(0)[0] ?? 0;
      const pintar = (aviso = '') => {
        this.ocultarMenus();
        this.msg.visible(false);
        this.gVentanas.clear();
        ventana(this.gVentanas, 2, 112, 236, 46);
        equipo.miembros.forEach((m, i) => {
          const enCampo = i === equipo.activo && m.ps > 0;
          const situacion = m.ps <= 0 ? t('c.sinEnergia') : enCampo ? t('c.enCombate') : m.estado ? t(`estado.abrev.${m.estado.id}`) : '';
          const color = m.ps <= 0 || enCampo ? C.apagado : i === sel ? C.resalte : C.tinta;
          this.filasEquipo[i]!.poner(`${m.nombre}   ${t('nv', { n: m.nivel })}   ${t('ps')} ${m.ps}/${m.stats.ps}   ${situacion}`, color).visible(true);
        });
        const y = 118 + sel * 12;
        this.cursor.fillStyle(n(C.resalte), 1).fillTriangle(9, y, 9, y + 6, 13, y + 3);
        equipo.miembros.forEach((_, i) => this.zonaMenu(6, 116 + i * 12, 228, 12, i));
        this.puntero.marcar(`e${sel}`, this.filasEquipo[sel]?.imagen);
        if (equipo.miembros.length < 3) this.filasEquipo[2]!.poner(aviso || (forzado ? t('c.elige') : ''), C.tintaSuave).visible(true);
      };
      pintar();
      this.alApuntar = (i) => {
        if (i === sel) return;
        sel = i;
        sonido.tocar('cursor');
        pintar();
      };
      this.alPulsar = (a) => {
        const total = equipo.miembros.length;
        if (a === 'arriba' || a === 'abajo') {
          sel = (sel + (a === 'abajo' ? 1 : total - 1)) % total;
          sonido.tocar('cursor');
          pintar();
        } else if (a === 'b' && !forzado) {
          sonido.tocar('cancelar');
          this.alPulsar = null;
          resolver(null);
        } else if (a === 'a') {
          if (!this.bat.banca(0).includes(sel)) {
            sonido.tocar('negado');
            return;
          }
          sonido.tocar('aceptar');
          this.alPulsar = null;
          resolver(sel);
        }
      };
    });
  }

  private ocultarMenus(): void {
    this.opciones.forEach((o) => o.visible(false));
    this.celdas.forEach((c) => {
      c.nombre.visible(false);
      c.usos.visible(false);
    });
    this.filasEquipo.forEach((f) => f.visible(false));
    this.info1.visible(false);
    this.info2.visible(false);
    this.defTxt.visible(false);
    this.info1.imagen.setY(137);
    this.info2.imagen.setY(146);
    this.icoTipo?.setVisible(false);
    this.icoCat?.setVisible(false);
    this.cursor.clear();
    this.puntero.limpiar();
    this.msg.visible(true);
  }

  /** Zona del puntero para la opción `i` del menú abierto. */
  private zonaMenu(x: number, y: number, w: number, h: number, i: number): void {
    this.puntero.zona(x, y, w, h, () => this.alApuntar?.(i));
  }

  private modoMensaje(): void {
    this.ocultarMenus();
    this.gVentanas.clear();
    ventana(this.gVentanas, 2, 112, 236, 46);
    this.msg.poner('');
  }

  private modoMenu(sel: number): void {
    this.ocultarMenus();
    this.gVentanas.clear();
    ventana(this.gVentanas, 2, 112, 138, 46);
    ventana(this.gVentanas, 142, 112, 96, 46);
    this.opciones.forEach((o, i) => o.poner(t(MENU[i]!), i === 2 && !this.bat.banca(0).length ? C.apagado : C.tinta).visible(true));
    const x = 148 + (sel % 2) * 40;
    const y = 121 + Math.floor(sel / 2) * 15;
    this.cursor.fillStyle(n(C.resalte), 1).fillTriangle(x, y, x, y + 6, x + 4, y + 3);
    for (let i = 0; i < 4; i++) this.zonaMenu(148 + (i % 2) * 40, 118 + Math.floor(i / 2) * 15, 40, 14, i);
    this.puntero.marcar(`m${sel}`, this.opciones[sel]?.imagen);
  }

  private modoHabilidades(sel: number): void {
    this.ocultarMenus();
    this.msg.visible(false);
    this.gVentanas.clear();
    ventana(this.gVentanas, 2, 112, 236, 46);
    this.gVentanas.fillStyle(n(C.papelSombra), 1).fillRect(8, 135, 224, 1);
    const yo = this.bat.act(0);
    yo.habilidades.forEach((h, i) => {
      const bloqueada = this.bat.bloqueo(0, i) !== null;
      const color = bloqueada ? C.apagado : i === sel ? C.resalte : C.tinta;
      this.celdas[i]!.nombre.poner(h.def.nombre, color).visible(true);
      this.celdas[i]!.usos.poner(`${h.usos}/${h.def.usos}`, color).visible(true);
    });
    // Ataque Definitivo: fila dorada bajo la grilla; la información baja un poco.
    const def = yo.definitivo;
    if (def) {
      const m = this.bat.bloqueoDefinitivo(0);
      const estado = m === null ? t('def.listo') : m === 'usado' ? t('def.usado') : m === 'turno' ? t('def.turno', { n: DATOS.balance.definitivo.turnoMinimo }) : '';
      this.defTxt.poner(`★ ${def.nombre} · ${estado}`, m === null ? (sel === 4 ? C.resalte : '#b8860b') : C.apagado).visible(true);
      this.gVentanas.fillStyle(n(C.papelSombra), 1).fillRect(8, 134, 224, 1);
      this.info1.imagen.setY(141);
      this.info2.imagen.setY(148.5);
    }
    const x = sel === 4 ? 60 : 8 + (sel % 2) * 110;
    const y = sel === 4 ? 136 : 117 + Math.floor(sel / 2) * 9;
    this.cursor.fillStyle(n(C.resalte), 1).fillTriangle(x, y, x, y + 6, x + 4, y + 3);
    for (let i = 0; i < 4; i++) this.zonaMenu(6 + (i % 2) * 110, 115 + Math.floor(i / 2) * 9, 110, 9, i);
    if (def) this.zonaMenu(10, 133, 220, 10, 4);
    this.puntero.marcar(`h${sel}`, sel === 4 ? this.defTxt.imagen : this.celdas[sel]?.nombre.imagen);
    if (sel === 4 && def) {
      this.info1.imagen.setX(10);
      this.info1.poner(t('def.info'), C.tinta).visible(true);
      return;
    }

    const h = yo.habilidades[sel]!;
    const tipo = DATOS.tipos.get(h.def.tipo)!;
    let linea1 = `${tipo.nombre} · ${t(`cat.${h.def.categoria}`)}`;
    if (h.def.potencia > 0) linea1 += ' · ' + t('info.potencia', { p: h.def.potencia, a: h.def.precision ?? 100 });
    else if (h.def.precision !== null) linea1 += ` · Prec. ${h.def.precision}`;
    // Tipo y categoría con sus íconos (o el cuadrito de color del tipo si falta el arte).
    const yIco = (def ? 141 : 137) + 4.8;
    if (this.icoTipo && this.icoCat && hayArte(this, claveTipo(h.def.tipo))) {
      this.icoTipo.setTexture(`ui_${claveTipo(h.def.tipo)}`).setPosition(13, yIco).setVisible(true);
      this.icoCat.setTexture(`ui_${claveCategoria(h.def.categoria)}`).setPosition(22, yIco).setVisible(true);
      this.info1.imagen.setX(28);
    } else {
      this.gVentanas.fillStyle(COLOR_TIPO[h.def.tipo] ?? 0x566c86, 1).fillRect(10, def ? 142.5 : 138, 5, 5);
      this.info1.imagen.setX(18);
    }
    this.info1.poner(linea1).visible(true);
    const motivo = this.bat.bloqueo(0, sel);
    const texto =
      motivo === 'enfriamiento'
        ? t('bloqueo.enfriamiento', { n: h.enfriamiento })
        : motivo === 'turno'
          ? t('bloqueo.turno', { n: DATOS.balance.final.turnoMinimo })
          : motivo
            ? t(`bloqueo.${motivo}`)
            : this.describir(h.def);
    this.info2.poner(texto, motivo ? C.resalte : C.tinta).visible(true);
  }

  private describir(h: Habilidad): string {
    return describirHabilidad(h);
  }

  // ------------------------------------------------------------ dibujo

  private crearPanel(d: Disposicion): Panel {
    const { x, y } = d;
    const g = this.add.graphics();
    ventana(g, x, y, 116, 26, 0.95);
    new Texto(this, x + 6, y + 14, 12, 10, C.resalte).poner(t('ps'));
    return {
      x,
      y,
      disp: d,
      nombre: new Texto(this, x + 6, y + 4, 80, 10),
      nivel: new Texto(this, x + 88, y + 4, 22, 10, C.tintaSuave, 'der'),
      ps: new Texto(this, x + 76, y + 14, 34, 10, C.tinta, 'der'),
      barra: this.add.graphics(),
      puntos: this.add.graphics(),
      estadoFondo: this.add.graphics(),
      // El estado va fuera del panel, después de los puntos del equipo, para no tapar nombres largos.
      estado: new Texto(this, d.extras.x, d.extras.y + 8, 20, 10, C.papel, 'centro'),
      estadoIco: pieza(this, 'estado_quemadura', d.extras.x + 5, d.extras.y + 11.5, 8)?.setVisible(false) ?? null,
      bajas: (['vel', 'atq'] as const).map((stat, i) => {
        const bx = d.extras.x + i * 15;
        return {
          stat,
          ico: pieza(this, claveEstado(ESTADO_DE_STAT[stat]!), bx + 3.5, d.extras.y + 22.5, 8)?.setVisible(false) ?? null,
          txt: new Texto(this, bx + 7.5, d.extras.y + 18, 9, 10, '#ffffff', 'izq', { tam: 5.8, peso: 600, borde: '#1f2340' }),
        };
      }),
      mostrado: 0,
    };
  }

  /** Vuelve a escribir el panel con la criatura que está ahora en el campo. */
  private refrescarPanel(lado: Lado): void {
    const c = this.bat.act(lado);
    const p = this.paneles[lado];
    p.nombre.poner(c.nombre + (c.brillante ? ' ✦' : ''));
    p.nivel.poner(t('nv', { n: c.nivel }));
    this.sprites[lado].setData('nombre', c.nombre);
    this.pintarPs(lado, c.ps);
    this.pintarEstado(lado);
    this.pintarPuntos(lado);
  }

  private pintarPs(lado: Lado, valor: number): void {
    const p = this.paneles[lado];
    const c = this.bat.act(lado);
    const max = c.stats.ps;
    const v = Math.max(0, Math.round(valor));
    const r = v / max;
    const ancho = v > 0 ? Math.max(1, Math.floor(56 * r)) : 0;
    p.barra.clear();
    p.barra.fillStyle(n(C.tinta), 1).fillRect(p.x + 18, p.y + 15, 58, 6);
    p.barra.fillStyle(C.barraFondo, 1).fillRect(p.x + 19, p.y + 16, 56, 4);
    p.barra.fillStyle(r > 0.5 ? C.psAlto : r > 0.2 ? C.psMedio : C.psBajo, 1).fillRect(p.x + 19, p.y + 16, ancho, 4);
    if (lado === 0) {
      // Barra fina de experiencia de tu criatura.
      // En el Desafío del día el equipo es prestado: sin barra de experiencia.
      const mia = this.cfg.modo === 'desafio' ? null : criaturaDe(juego.estado, c.especie.id);
      const frac = mia && mia.nivel < DATOS.balance.nivelMax ? mia.xp / xpParaSubir(DATOS, mia.nivel) : 1;
      p.barra.fillStyle(C.barraFondo, 1).fillRect(p.x + 19, p.y + 21.6, 56, 1.2);
      p.barra.fillStyle(0x5aa9f0, 1).fillRect(p.x + 19, p.y + 21.6, 56 * frac, 1.2);
    }
    p.ps.poner(`${v}/${max}`);
    p.mostrado = valor;
  }

  /** Un punto por criatura del equipo, al costado del panel que da al centro: relleno si sigue en pie, hueco si cayó, con aro si está en el campo. */
  private pintarPuntos(lado: Lado): void {
    const p = this.paneles[lado];
    const equipo = this.bat.equipos[lado];
    p.puntos.clear();
    equipo.miembros.forEach((m, i) => {
      const x = p.disp.puntos.x + i * p.disp.puntos.paso;
      const y = p.disp.puntos.y;
      p.puntos.fillStyle(n(C.marco), 1).fillCircle(x, y, i === equipo.activo ? 3.4 : 2.8);
      p.puntos.fillStyle(m.ps > 0 ? C.psAlto : n(C.papel), 1).fillCircle(x, y, 2);
    });
  }

  private pintarEstado(lado: Lado): void {
    const p = this.paneles[lado];
    const est = this.bat.act(lado).estado;
    p.estadoFondo.clear();
    // Bajas de stats (por ejemplo, de un Encanto): ícono y número de etapas; sin arte, una flecha con la sigla.
    const etapas = this.bat.act(lado).etapas;
    const bx = p.disp.extras.x;
    const ey = p.disp.extras.y;
    let k = 0;
    for (const b of p.bajas) {
      const n = etapas[b.stat];
      const baja = n < 0;
      const x0 = bx + k * 15;
      b.ico?.setVisible(baja).setPosition(x0 + 3.5, ey + 22.5);
      b.txt.imagen.setX(x0 + 7.5);
      b.txt.poner(baja ? (b.ico ? `${n}` : `${t(`stat.abrev.${b.stat}`)}${n}`) : '');
      if (baja) {
        p.estadoFondo.fillStyle(0x1f2340, 0.7).fillRoundedRect(x0 - 1, ey + 18, 15, 9, 2);
        k++;
      }
    }
    if (!est) {
      p.estado.poner('');
      p.estadoIco?.setVisible(false);
      return;
    }
    const x = p.disp.extras.x;
    // Con ícono, la píldora se alarga a la izquierda para que entre junto a la abreviatura.
    const ico = p.estadoIco && hayArte(this, claveEstado(est.id)) ? p.estadoIco : null;
    p.estadoFondo.fillStyle(COLOR_ESTADO[est.id] ?? 0x566c86, 1).fillRoundedRect(ico ? x - 1 : x, ey + 7, ico ? 28 : 20, 9, 2);
    ico?.setTexture(`ui_${claveEstado(est.id)}`).setVisible(true);
    p.estado.imagen.setX(ico ? x + 7 : x);
    p.estado.poner(t(`estado.abrev.${est.id}`));
  }

  /** Primera criatura del rival al empezar (en los modos de jefe, el jefe). */
  private rivalInicial = '';

  /** La primera victoria contra un jefe lo suma a tus insignias. */
  private insignia(id: string, extra: string[]): void {
    if (!registrarJefe(DATOS, juego.estado, id)) return;
    this.ganoInsignia = true;
    const p = progresoJefes(DATOS, juego.estado);
    extra.push(t('fin.insignia', { n: DATOS.criaturas.get(id)!.nombre, m: p.vencidos, t: p.total }));
  }

  /** Nombre de una criatura tuya por especie (su apodo, si tiene). */
  private nomMia(especie: string): string {
    const c = criaturaDe(juego.estado, especie);
    return c ? nombreDe(DATOS, c) : DATOS.criaturas.get(especie)!.nombre;
  }

  private nom(lado: Lado): string {
    const nombre = this.bat.act(lado).nombre;
    return lado === 0 ? nombre : t('rival', { n: nombre });
  }

  /** Anota en el Bestiario a la criatura rival que está en el campo. */
  private verRival(): void {
    marcarVista(juego.estado, this.bat.act(1).especie.id);
  }

  /** Centro del cuerpo visible de la criatura activa (los sprites se apoyan en la base de su lienzo). */
  private centro(lado: Lado): { x: number; y: number; base: number } {
    const p = this.pos(lado);
    return { x: p.x, y: p.y + 32 - altoVisible(this.bat.act(lado).especie.id) / 2, base: p.y + 32 };
  }

  /** Lugar en pantalla de cada lado: 0 = de espaldas abajo a la izquierda, 1 = de frente arriba a la derecha. */
  private hueco(lado: Lado): 0 | 1 {
    return this.vista === 'rival' ? ((1 - lado) as 0 | 1) : lado;
  }

  private pos(lado: Lado): { x: number; y: number } {
    const p = this.pies[this.hueco(lado)];
    // Si la criatura se achica, sus pies se acercan al ancla: se compensa para que siga pisando la plataforma.
    return { x: p.x, y: p.y - PIES * this.escalaDe(lado) };
  }

  /** Escala de combate de la criatura activa de un lado (1, o menos si no cabe entre la plataforma y el borde / el cartel rival). */
  private escalaDe(lado: Lado): number {
    const alto = altoVisible(this.bat.act(lado).especie.id);
    // Tu criatura (abajo a la izquierda) puede rozar apenas el cartel del rival, que llega hasta y 38.
    const libre = this.pies[this.hueco(lado)].y - (this.hueco(lado) === 0 && !this.fila ? 34 : 3);
    return Math.min(1, libre / alto);
  }

  /** Pone la criatura en el sprite de un lado (HD si está cargada) a tamaño de combate. */
  private ponerSprite(s: Phaser.GameObjects.Image, clave: string, lado: Lado): Phaser.GameObjects.Image {
    // Las más altas se achican lo justo para no salirse por arriba cuando la plataforma queda lejos (Mina, eras).
    return ponerCriatura(s, clave, this.escalaDe(lado));
  }

  private texturaDe(lado: Lado, c: Combatiente): string {
    return textura(c.especie.id, this.hueco(lado) === 0 ? 'espalda' : 'frente', c.brillante);
  }

  // ------------------------------------------------------------ cámara

  /**
   * Cada cuadro: la cámara deriva despacio, se acerca a lo que pasa y las criaturas respiran.
   * La cámara no es la de Phaser (movería también la interfaz): se transforma el contenedor `mundo`.
   */
  override update(_t: number, dt: number): void {
    if (!this.mundo) return;
    this.reloj += dt / 1000;
    const viva = ajustes.camara;
    const c = this.cam;
    const z = viva ? c.zoom : 1;
    // Deriva lenta, como cámara en mano; el punto que mira se limita para no ver los bordes del fondo.
    let fx = viva ? c.fx + Math.sin(this.reloj * 0.45) * 2.4 : 120;
    let fy = viva ? c.fy + Math.sin(this.reloj * 0.31 + 1.3) * 1.4 : 80;
    fx = Phaser.Math.Clamp(fx, 120 / z, 240 - 120 / z);
    fy = Phaser.Math.Clamp(fy, 80 / z, 160 - 80 / z);
    const sx = z * (viva ? c.giro : 1);
    this.mundo.setScale(sx, z);
    let mx = 120 - fx * sx;
    let my = 80 - fy * z;
    if (this.sacudida.px > 0.05) {
      const m = this.sacudida.px;
      mx += (Math.random() * 2 - 1) * m;
      my += (Math.random() * 2 - 1) * m * 0.75;
      // Sin franjas vacías: el escenario nunca se despega de los bordes (salvo con el velo del Definitivo).
      if (!this.temblorLibre) {
        mx = Phaser.Math.Clamp(mx, 240 - 240 * sx, 0);
        my = Phaser.Math.Clamp(my, 160 - 160 * z, 0);
      }
    }
    this.mundo.setPosition(mx, my);
    if (this.filtroBlur) {
      this.filtroBlur.strength = this.desenfoque.strength;
      this.filtroBlur.active = this.desenfoque.strength > 0.05;
    }
    // Vaivén suave: cada criatura flota apenas de arriba abajo y se mece de lado, a su ritmo, sin deformar el dibujo.
    // Se hace corriendo el punto de origen (solo cambia dónde se dibuja), así no interfiere con embestidas ni golpes.
    this.sprites.forEach((s, i) => {
      if (!s.width) return;
      const f = this.reloj * (i ? 1.5 : 1.7) + i * 1.9;
      const dy = Math.round(Math.sin(f) * 1.6 * 4) / 4;
      const dx = Math.round(Math.sin(f * 0.5 + 0.8) * 1.0 * 4) / 4;
      s.setOrigin(0.5 - dx / s.displayWidth, ORIGEN_Y + dy / s.displayHeight);
    });
  }

  /**
   * Temblor del escenario (la interfaz queda quieta). `fuerza` usa la escala de Phaser (0,01 ≈ 3 px).
   * Funciona aunque la cámara viva esté apagada: es parte del golpe, no del movimiento de cámara.
   */
  private temblor(ms: number, fuerza: number): void {
    const px = Math.min(this.temblorLibre ? 12 : 6, fuerza * 300);
    if (px < this.sacudida.px) return;
    this.tweens.killTweensOf(this.sacudida);
    this.sacudida.px = px;
    this.tweens.add({ targets: this.sacudida, px: 0, duration: ms, ease: 'Quad.easeIn' });
  }

  /** La cámara se arrima a la criatura que recibe el golpe (no espera: corre junto a la animación). */
  private enfocar(objetivo: Lado, zoom: number): void {
    if (!ajustes.camara) return;
    const a = this.centro((1 - objetivo) as Lado);
    const b = this.centro(objetivo);
    this.tweens.killTweensOf(this.cam);
    this.tweens.add({ targets: this.cam, zoom, fx: a.x * 0.3 + b.x * 0.7, fy: a.y * 0.3 + b.y * 0.7, duration: 260, ease: 'Sine.easeOut' });
  }

  /** Vuelve al plano general. */
  private soltar(): void {
    this.tweens.killTweensOf(this.cam);
    this.tweens.add({ targets: this.cam, zoom: 1, fx: 120, fy: 80, giro: 1, duration: 500, ease: 'Sine.easeInOut' });
  }

  /** Gira la cámara para que quien actúa quede de espaldas, mirando a su rival. */
  private girarHacia(lado: Lado): Promise<void> {
    return this.girar(lado === 0 ? 'jugador' : 'rival');
  }

  /**
   * Giro de perspectiva como un barrido de cámara: la cámara se acerca y barre hacia un costado
   * desenfocándose; en lo más borroso las criaturas cambian de lugar (y de cara: frente ↔ espalda)
   * y la cámara entra barriendo desde el otro costado hasta enfocar. Con la cámara apagada siempre
   * se mira desde tu lado.
   */
  private async girar(v: 'jugador' | 'rival'): Promise<void> {
    const quiere = ajustes.camara ? v : 'jugador';
    if (this.vista === quiere || !this.vivo) return;
    const animado = ajustes.camara;
    this.tweens.killTweensOf(this.cam);
    this.cam.giro = 1;
    // Hacia la vista del rival barre a la derecha; al volver, a la izquierda.
    const sentido = quiere === 'rival' ? 1 : -1;
    const Z = 1.32;
    const borde = 120 - 120 / Z;
    if (animado) {
      sonido.tocar('giro');
      await Promise.all([
        this.tween({ targets: this.cam, zoom: Z, fx: 120 + borde * sentido, fy: 80, duration: 160, ease: 'Quad.easeIn' }),
        this.tween({ targets: this.desenfoque, strength: 5, duration: 160, ease: 'Quad.easeIn' }),
      ]);
    }
    this.vista = quiere;
    for (const lado of [0, 1] as Lado[]) {
      const s = this.sprites[lado];
      const p = this.pos(lado);
      this.ponerSprite(s, this.texturaDe(lado, this.bat.act(lado)), lado).setPosition(p.x, s.alpha === 0 ? p.y + 30 : p.y);
    }
    // El de atrás (más cerca de la cámara) se dibuja encima.
    this.mundo.bringToTop(this.sprites[this.vista === 'rival' ? 1 : 0]);
    this.mundo.bringToTop(this.capaFx);
    if (animado) {
      this.cam.fx = 120 - borde * sentido;
      await Promise.all([
        this.tween({ targets: this.cam, zoom: 1, fx: 120, duration: 240, ease: 'Quad.easeOut' }),
        this.tween({ targets: this.desenfoque, strength: 0, duration: 240, ease: 'Quad.easeOut' }),
      ]);
    }
  }

  // ------------------------------------------------------------ animación

  /** Sale una criatura (si no había caído) y entra la nueva activa. */
  private async animCambio(lado: Lado, forzado: boolean, nombreSale: string): Promise<void> {
    const s = this.sprites[lado];
    const fuera = this.pos(lado).x + (this.hueco(lado) === 0 ? -120 : 120);
    if (!forzado) {
      await this.decir(lado === 0 ? t('c.vuelve', { n: nombreSale }) : t('c.rivalRetira', { n: nombreSale }));
      await this.tween({ targets: s, x: fuera, duration: 260, ease: 'Cubic.easeIn' });
    }
    const entra = this.bat.act(lado);
    this.ponerSprite(s, this.texturaDe(lado, entra), lado).setPosition(fuera, this.pos(lado).y).setAlpha(1);
    this.refrescarPanel(lado);
    if (lado === 1) this.verRival();
    sonido.tocar('aceptar');
    await this.tween({ targets: s, x: this.pos(lado).x, duration: 320, ease: 'Cubic.easeOut' });
    await this.decir(lado === 0 ? t('c.adelante', { n: entra.nombre }) : t('c.rivalEnvia', { n: entra.nombre }));
  }

  /** Ataque con daño: embestida si es físico y, después, el efecto propio de la habilidad. */
  private async animAtaque(lado: Lado, h: Habilidad | null): Promise<void> {
    const s = this.sprites[lado];
    const dir = this.hueco(lado) === 0 ? 1 : -1;
    const fisica = !h || h.categoria === 'fisica';
    if (h?.rol === 'final') {
      sonido.tocar('final');
      this.cameras.main.flash(160, 255, 255, 255);
    } else if (!fisica) sonido.tocar('especial');
    if (fisica) await this.tween({ targets: s, x: this.pos(lado).x + 16 * dir, y: this.pos(lado).y - 6 * dir, duration: 90, yoyo: true });
    if (h && (await this.fx.ataque(h, this.centro(lado), this.centro((1 - lado) as Lado)))) return;
    await this.fx.reproducir(h?.animacion ?? (fisica ? (h ? 'zarpazo' : 'impacto') : 'proyectil'), this.centro(lado), this.centro((1 - lado) as Lado), h?.tipo ?? 'neutro');
  }

  /** El rival carga su Definitivo: tiembla, brilla y avisa (así puedes cubrirte el turno siguiente). */
  private async animCarga(lado: Lado): Promise<void> {
    const s = this.sprites[lado];
    sonido.tocar('final');
    this.temblor(400, 0.006);
    const color = COLOR_TIPO[this.bat.act(lado).especie.tipo] ?? 0xffffff;
    s.setTint(color);
    await this.tween({ targets: s, y: s.y - 4, duration: 150, yoyo: true, repeat: 2, ease: 'Sine.easeOut' });
    s.clearTint();
    await this.decir(t('c.carga', { n: this.nom(lado) }));
  }

  /**
   * Ataque Definitivo: la pantalla se oscurece, el atacante brilla, su ataque final cruza dos veces,
   * estalla un círculo del color de su tipo con destello blanco y temblor fuerte. ~3 s (la mitad a ×2).
   * Cuando lleguen las ilustraciones de los Definitivos, se usarán aquí.
   */
  private async animDefinitivo(lado: Lado, h: Habilidad | null): Promise<void> {
    const yo = this.bat.act(lado);
    const color = COLOR_TIPO[yo.especie.tipo] ?? 0xffffff;
    await this.decir(t('c.definitivo', { n: this.nom(lado) }));
    const s = this.sprites[lado];
    // El velo va dentro del mundo, justo debajo del atacante: el resto del escenario (y el rival) se oscurece.
    const velo = this.add.graphics().fillStyle(0x05060f, 1).fillRect(-20, -20, 280, 200).setAlpha(0);
    this.mundo.bringToTop(s);
    this.mundo.addAt(velo, this.mundo.getIndex(s));
    this.mundo.bringToTop(this.capaFx);
    // Sin acercamiento: el Definitivo se ve en plano general y el golpe se siente con temblor fuerte.
    this.soltar();
    this.temblorLibre = true;
    await this.tween({ targets: velo, alpha: 0.85, duration: 350 });
    sonido.tocar('final');
    s.setTint(color);
    await this.tween({ targets: s, y: s.y - 8, duration: 240, yoyo: true, ease: 'Sine.easeOut' });
    s.clearTint();
    const desde = this.centro(lado);
    const hasta = this.centro((1 - lado) as Lado);
    sonido.tocar('golpe_fuerte');
    // Con dibujo propio: corte de pantalla y gran impacto. Si no, el ataque final dos veces y un estallido.
    if (h && (await this.fx.definitivo(h, desde, hasta, color))) {
      sonido.tocar('final');
    } else {
      const anim = h?.animacion ?? 'proyectil';
      await this.fx.reproducir(anim, desde, hasta, yo.especie.tipo);
      sonido.tocar('golpe_fuerte');
      await this.fx.reproducir(anim, desde, hasta, yo.especie.tipo);
      // Estallido
      const onda = this.add.graphics();
      this.capaFx.add(onda);
      const estado = { r: 4, a: 1 };
      sonido.tocar('final');
      this.cameras.main.flash(450, 255, 255, 255);
      this.temblor(800, 0.03);
      await this.tween({
        targets: estado,
        r: 190,
        a: 0,
        duration: 700,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          onda.clear();
          onda.fillStyle(color, estado.a * 0.7).fillCircle(hasta.x, hasta.y, estado.r);
          onda.fillStyle(0xffffff, estado.a).fillCircle(hasta.x, hasta.y, estado.r * 0.45);
        },
      });
      onda.destroy();
    }
    await this.tween({ targets: velo, alpha: 0, duration: 350 });
    this.temblorLibre = false;
    velo.destroy();
  }

  /**
   * Debilitado: destello blanco y pausa, la criatura se deshace en luz del color de su tipo desde los pies,
   * estalla un destello y su cartita sube girando (vuelve a su carta). ~1,3 s (la mitad a ×2).
   */
  private async animDebilitado(lado: Lado): Promise<void> {
    const s = this.sprites[lado];
    const c = this.bat.act(lado);
    const color = COLOR_TIPO[c.especie.tipo] ?? 0xffffff;
    const alto = altoVisible(c.especie.id);
    const centro = this.centro(lado);
    sonido.tocar('debilitado');
    s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.temblor(160, 0.008);
    await this.esperar(150);
    s.setTint(color);
    // Se borra de abajo hacia arriba (el lienzo es de 96 px y los pies están en su borde inferior).
    const prog = { t: 0 };
    let chispa = 0;
    await this.tween({
      targets: prog,
      t: 1,
      duration: 520,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        // En píxeles de la textura (96 en pixel art, 384 en HD).
        const k = s.height / LIENZO;
        const corte = s.height - alto * k * prog.t;
        s.setCrop(0, 0, s.width, Math.max(0, corte));
        if (prog.t - chispa > 0.06) {
          chispa = prog.t;
          this.fx.chispasDesde(s.x, s.y + (corte - s.height * ORIGEN_Y) * s.scaleY, Math.max(18, alto * 0.6), color, 6);
        }
      },
    });
    s.setAlpha(0).setCrop().clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    s.y = this.pos(lado).y + 30;
    await this.fx.debilitar(centro, color);
  }

  /** Habilidad sin daño: la criatura se hincha un instante y aparece su efecto. */
  private async animApoyo(lado: Lado, h: Habilidad): Promise<void> {
    const apuntaAlRival = h.efectos.some((e) => (e.tipo === 'estado' || e.tipo === 'etapa') && e.objetivo === 'rival');
    await Promise.all([
      this.tween({ targets: this.sprites[lado], y: this.sprites[lado].y - 5, duration: 120, yoyo: true, ease: 'Sine.easeOut' }),
      this.fx.ataque(h, this.centro(lado), this.centro((1 - lado) as Lado)).then(
        (hecho): Promise<void> | void => (hecho ? undefined : this.fx.reproducir(h.animacion ?? (apuntaAlRival ? 'proyectil' : 'brillo'), this.centro(lado), this.centro((1 - lado) as Lado), h.tipo)),
      ),
    ]);
  }

  private async animGolpe(lado: Lado): Promise<void> {
    const s = this.sprites[lado];
    for (let i = 0; i < 3 && this.vivo; i++) {
      s.setAlpha(0.15);
      s.x = this.pos(lado).x + (i % 2 ? -2 : 2);
      await this.esperar(55);
      s.setAlpha(1);
      await this.esperar(55);
    }
    s.x = this.pos(lado).x;
  }

  private animarPs(lado: Lado, hasta: number): Promise<void> {
    const p = this.paneles[lado];
    const desde = p.mostrado;
    const max = this.bat.act(lado).stats.ps;
    const obj = { v: desde };
    return this.tween({
      targets: obj,
      v: hasta,
      duration: Phaser.Math.Clamp((Math.abs(desde - hasta) / max) * 1100, 200, 700),
      onUpdate: () => this.pintarPs(lado, obj.v),
      onComplete: () => this.pintarPs(lado, hasta),
    });
  }

  // ------------------------------------------------------------ utilidades

  /** Escribe letra por letra. A o un toque completan el texto y luego lo avanzan. */
  /**
   * Golpe justo: una marca va y viene por una barra; A la frena. Centro dorado = «¡Perfecto!» (×1,25),
   * franja verde = «¡Bien!» (×1,1), afuera o sin pulsar = sin bonificación. Corre con el tiempo real,
   * así no se acelera con la velocidad ×2. En automático no aparece y cuenta como «Bien».
   */
  private golpeJusto(): Promise<number> {
    if (ajustes.golpe === 'auto') return Promise.resolve(GOLPE.auto);
    return new Promise((resolver) => {
      this.modoMensaje();
      this.msg.poner(t('c.golpe.ayuda'));
      const X0 = 50;
      const ANCHO = 140;
      const Y = 140;
      const g = this.add.graphics().setDepth(60);
      const desde: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
      let seg = 0;
      let listo = false;
      const pintar = (pos: number) => {
        g.clear();
        g.fillStyle(0x141830, 0.9).fillRoundedRect(X0 - 3, Y - 7, ANCHO + 6, 14, 4);
        g.fillStyle(C.barraFondo, 1).fillRect(X0, Y - 4, ANCHO, 8);
        const bien = ANCHO * GOLPE.bien.distancia;
        const perf = ANCHO * GOLPE.perfecto.distancia;
        g.fillStyle(0x3fbf6a, 1).fillRect(X0 + ANCHO / 2 - bien, Y - 4, bien * 2, 8);
        g.fillStyle(0xf5e070, 1).fillRect(X0 + ANCHO / 2 - perf, Y - 4, perf * 2, 8);
        g.fillStyle(0xffffff, 1).fillRect(Math.round(X0 + pos * ANCHO) - 1, Y - 8, 3, 16);
      };
      const terminar = (pos: number | null) => {
        if (listo) return;
        listo = true;
        this.events.off(Phaser.Scenes.Events.UPDATE, mover);
        this.alPulsar = null;
        const r = pos === null ? { nota: 'fallo' as const, mult: 1 } : calificarGolpe(pos);
        if (pos !== null) pintar(pos);
        this.msg.poner(t(`c.golpe.${r.nota}`), r.nota === 'perfecto' ? '#b8860b' : r.nota === 'bien' ? '#2f7a48' : C.tintaSuave);
        sonido.tocar(r.nota === 'perfecto' ? 'chispa' : r.nota === 'bien' ? 'atrapa' : 'falla');
        if (r.nota === 'perfecto') {
          this.cameras.main.flash(90, 255, 240, 160);
          this.efectoSobre(0, 'fx_golpe_justo');
        }
        // Pausa corta con reloj real para leer la nota.
        window.setTimeout(() => {
          g.destroy();
          resolver(r.mult);
        }, 520);
      };
      const mover = (_t: number, dt: number) => {
        if (!this.vivo) return terminar(null);
        seg += dt / 1000;
        if (seg >= GOLPE.cruce * GOLPE.cruces) return terminar(null);
        pintar(posicionGolpe(seg, desde));
      };
      pintar(desde);
      this.events.on(Phaser.Scenes.Events.UPDATE, mover);
      this.alPulsar = (a) => {
        if (a === 'a') terminar(posicionGolpe(seg, desde));
      };
    });
  }

  private decir(texto: string): Promise<void> {
    return new Promise((resolver) => {
      if (!this.vivo) return resolver();
      const completo = partir(texto, 220).slice(0, 3).join('\n');
      let i = 0;
      let terminado = false;
      let cerrado = false;
      const cerrar = () => {
        if (cerrado) return;
        cerrado = true;
        reloj.remove();
        this.alPulsar = null;
        resolver();
      };
      const completar = () => {
        terminado = true;
        this.msg.poner(completo);
        this.time.delayedCall(600, cerrar);
      };
      const reloj = this.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          if (terminado) return;
          i += 2;
          this.msg.poner(completo.slice(0, i));
          if (i >= completo.length) completar();
        },
      });
      this.alPulsar = (a) => {
        if (a !== 'a' && a !== 'b') return;
        if (!terminado) completar();
        else cerrar();
      };
    });
  }

  private esperar(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, () => r()));
  }

  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((r) => {
      const previo = cfg.onComplete as (() => void) | undefined;
      this.tweens.add({
        ...cfg,
        onComplete: () => {
          previo?.();
          r();
        },
      });
    });
  }
}
