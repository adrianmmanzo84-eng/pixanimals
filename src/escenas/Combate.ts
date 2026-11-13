import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { Rng } from '../core/rng';
import { Batalla, type Accion, type Combatiente, type Evento, type Lado } from '../core/combate/motor';
import { elegirAccion, elegirReemplazo, type NivelIA } from '../core/combate/ia';
import { generarRival } from '../core/combate/rival';
import { combatienteDe, criaturaDe, equipoDe, marcarVista } from '../core/estado/juego';
import { aplicarRecompensa, xpParaSubir } from '../core/progresion/experiencia';
import { registrar } from '../core/progresion/misiones';
import { datosPiso, equipoPiso, resultadoTorre } from '../core/modos/torre';
import { entrenadorDelDia, equipoEntrenador, resultadoEntrenador } from '../core/modos/entrenador';
import { musica } from '../audio/musica';
import { ajustes, alCambiarAjustes } from '../ajustes';
import type { Habilidad, Item } from '../esquemas/esquemas';
import { cantidad, quitar } from '../core/items/items';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { altoVisible, textura } from '../ui/criaturas';
import { C, COLOR_ESTADO, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { Efectos } from '../ui/efectos';
import { fondo, FONDO_POR_TIPO } from '../ui/fondos';
import { partir, Texto } from '../ui/texto';

export interface ConfigCombate {
  ia: NivelIA;
  /** rapido: rival parejo al azar; torre: el piso `piso`; entrenador: el Entrenador del día. */
  modo?: 'rapido' | 'torre' | 'entrenador';
  piso?: number;
}

interface Panel {
  x: number;
  y: number;
  nombre: Texto;
  nivel: Texto;
  ps: Texto;
  barra: Phaser.GameObjects.Graphics;
  puntos: Phaser.GameObjects.Graphics;
  estadoFondo: Phaser.GameObjects.Graphics;
  estado: Texto;
  mostrado: number;
}

/** Centro del lienzo de 64×64 de cada criatura; sus pies caen sobre las plataformas dibujadas en los fondos. */
const POS = [
  { x: 51, y: 77 },
  { x: 186, y: 53 },
] as const;
/** Lienzo de los sprites (96×96). Se apoyan en la plataforma: la base queda 32 px bajo POS.y y crecen hacia arriba. */
const LIENZO = 96;
const ORIGEN_Y = (LIENZO - 32) / LIENZO;
/**
 * Paneles en diagonal, como el clásico: el del rival arriba a la izquierda y el tuyo abajo a la derecha.
 * Así cada criatura tiene casi toda la altura libre (las etapas finales miden hasta 86 px).
 */
const PANEL = [
  { x: 122, y: 82 },
  { x: 2, y: 2 },
] as const;
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
  private paneles!: [Panel, Panel];
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
  private cam = { zoom: 1.04, fx: 120, fy: 80, giro: 1 };
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
  private info1!: Texto;
  private info2!: Texto;
  /** Fila del Ataque Definitivo en el menú de ataques. */
  private defTxt!: Texto;
  private cursor!: Phaser.GameObjects.Graphics;
  private alPulsar: ((a: AccionEntrada) => void) | null = null;
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
    this.cam = { zoom: 1.04, fx: 120, fy: 80, giro: 1 };
    this.reloj = 0;
    this.sacudida = { px: 0 };
    this.temblorLibre = false;
  }

  create(): void {
    const semilla = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
    const rng = new Rng(semilla);
    this.rngIA = new Rng(semilla ^ 0x9e3779b9);
    const mios = equipoDe(juego.estado);
    const modo = this.cfg.modo ?? 'rapido';
    const rival =
      modo === 'torre'
        ? equipoPiso(DATOS, datosPiso(DATOS, this.cfg.piso ?? juego.estado.torre.piso, mios.length))
        : modo === 'entrenador'
          ? equipoEntrenador(DATOS, entrenadorDelDia(DATOS, Date.now()), mios)
          : generarRival(DATOS, mios, rng);
    this.bat = new Batalla(DATOS, [mios.map((c) => combatienteDe(DATOS, c)), rival], rng);
    // Ataque Definitivo: siempre para ti; entre los rivales, solo jefes de la Torre y el Entrenador del día, que lo cargan avisando.
    const jefe = modo === 'torre' && datosPiso(DATOS, this.cfg.piso ?? 1, 1).jefe;
    this.bat.definitivoPermitido = [true, modo === 'entrenador' || jefe];
    this.bat.definitivoConCarga = [false, true];
    musica.tocar(modo === 'torre' && datosPiso(DATOS, this.cfg.piso ?? 1, 1).jefe ? 'jefe' : modo === 'rapido' ? 'combate' : 'jefe');
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
    this.mundo.add(this.add.image(0, 0, fondo(this, arena)).setOrigin(0, 0).setScale(0.25));
    this.sprites = [
      this.add.image(POS[0].x - 120, POS[0].y, textura(yo.especie.id, 'espalda', yo.brillante)).setOrigin(0.5, ORIGEN_Y),
      this.add.image(POS[1].x + 120, POS[1].y, textura(el.especie.id, 'frente', el.brillante)).setOrigin(0.5, ORIGEN_Y),
    ];
    this.mundo.add(this.sprites);
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
    this.paneles = [this.crearPanel(PANEL[0].x, PANEL[0].y), this.crearPanel(PANEL[1].x, PANEL[1].y)];
    this.refrescarPanel(0);
    this.refrescarPanel(1);
    this.turnoTxt = new Texto(this, 4, 30, 60, 10, '#ffffff', 'izq', { borde: '#2b3a78' });

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
    this.info2 = new Texto(this, 10, 146, 220, 10, C.tinta).visible(false);
    this.defTxt = new Texto(this, 10, 134, 220, 10, '#b8860b', 'centro', { peso: 600 }).visible(false);
    this.cursor = this.add.graphics();

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
    if (this.cfg.modo === 'entrenador') await this.decir(t('c.entrenador', { n: entrenadorDelDia(DATOS, Date.now()).nombre }));
    if (this.cfg.modo === 'torre') {
      const p = datosPiso(DATOS, this.cfg.piso ?? 1, 1);
      await this.decir(t(p.jefe ? 'c.torreJefe' : 'c.torre', { n: p.piso }));
    }
    await this.decir(t('c.aparece', { n: this.nom(1) }));
    await this.decir(t('c.adelante', { n: this.nom(0) }));

    while (this.vivo && !this.bat.terminado) {
      this.turnoTxt.poner(`Turno ${this.bat.turno + 1}`);
      await this.girar('jugador');
      const accion = await this.elegirAccion();
      if (!this.vivo) return;
      if (accion === 'retirada') {
        this.modoMensaje();
        await this.decir(t('c.retirada'));
        await this.resultado(true);
        return;
      }
      const rival = elegirAccion(this.bat, 1, this.cfg.ia, this.rngIA);
      this.modoMensaje();
      await this.reproducir(this.bat.ejecutarTurno(accion, rival));
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
        case 'dano': {
          const atacante = (1 - e.lado) as Lado;
          // El Definitivo ya tuvo su propia animación.
          if (ultima?.h?.rol !== 'definitivo') {
            this.enfocar(e.lado, ultima?.h?.rol === 'final' ? 1.16 : 1.1);
            await this.animAtaque(atacante, ultima?.h ?? null);
          }
          sonido.tocar(e.efectividad === 'ventaja' || e.critico ? 'golpe_fuerte' : e.efectividad === 'desventaja' || e.reducido ? 'golpe_debil' : 'golpe');
          if (ultima?.h?.rol === 'final') this.temblor(180, 0.01);
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
          await this.decir(t(`c.pasiva.${e.pasiva}`, { n: this.nom(e.lado) }));
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
          await this.tween({ targets: this.sprites[e.lado], y: this.pos(e.lado).y + 30, alpha: 0, duration: 450 });
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

  /** Reparte la recompensa, guarda la partida y muestra el resumen. */
  private async resultado(retirada: boolean): Promise<void> {
    const modo = this.cfg.modo ?? 'rapido';
    // Torre y Entrenador pagan su propio premio en lugar de las monedas por dificultad.
    const r = aplicarRecompensa(DATOS, juego.estado, this.bat, this.cfg.ia, retirada, modo === 'rapido' ? undefined : 0);
    const extra: string[] = [];
    const nombreSobre = (id: string) => DATOS.sobres.sobres.find((s) => s.id === id)?.nombre ?? id;
    if (modo === 'torre' && !retirada) {
      const p = resultadoTorre(DATOS, juego.estado, this.cfg.piso ?? 1, r.victoria);
      if (r.victoria) extra.push(p.nuevo ? t('fin.piso', { n: this.cfg.piso ?? 1, m: p.monedas }) : t('fin.pisoRepetido'));
      if (p.sobre) extra.push(t('fin.sobre', { s: nombreSobre(p.sobre) }));
    }
    if (modo === 'entrenador' && !retirada) {
      const p = resultadoEntrenador(DATOS, juego.estado, r.victoria, Date.now());
      if (p.monedas) extra.push(t('fin.entrenador', { n: p.monedas }));
      if (p.sobre) extra.push(t('fin.sobre', { s: nombreSobre(p.sobre) }));
    }
    juego.guardar();
    musica.tocar(r.victoria ? 'victoria' : 'derrota');
    const lineas = [t('fin.turnos', { n: this.bat.turno }), ...extra];
    if (r.monedas) lineas.push(t('fin.monedas', { n: r.monedas }));
    if (r.xpPorCriatura) lineas.push(t('fin.xp', { n: r.xpPorCriatura }));
    for (const s of r.subidas) lineas.push(t('fin.sube', { n: DATOS.criaturas.get(s.especie)!.nombre, nv: s.nivel }));
    if (r.entrenamiento) lineas.push(t('fin.entrenamiento', { n: r.entrenamiento }));
    for (const e of r.listas) lineas.push(t('fin.evoLista', { n: DATOS.criaturas.get(e)!.nombre }));
    const alto = 34 + lineas.length * 9;
    const g = this.add.graphics();
    ventana(g, 44, 32, 152, alto);
    new Texto(this, 44, 38, 152, 12, r.victoria ? '#257179' : C.resalte, 'centro', { tam: 9.5, peso: 600 }).poner(t(retirada ? 'fin.retirada' : r.victoria ? 'fin.victoria' : 'fin.derrota'));
    new Texto(this, 44, 51, 152, lineas.length * 9 + 4, C.tinta, 'centro').poner(lineas.join('\n'));
    new Texto(this, 44, 53 + lineas.length * 9, 152, 10, C.tintaSuave, 'centro').poner(t('fin.continuar'));
    this.msg.poner('');
    await this.esperar(400);
    this.alPulsar = (a) => {
      if (a !== 'a' && a !== 'b') return;
      sonido.tocar('aceptar');
      // Al ganar se elige una carta premio.
      this.scene.start(r.victoria ? 'Premio' : 'Menu', { submenu: 'combates' });
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
              if (!this.itemsDeCombate().some((i) => cantidad(juego.estado, i.id) > 0)) {
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
      const menuHabilidades = () => {
        let sel = this.ultimaHabilidad;
        // Si la última habilidad usada ya no está disponible, el cursor va a la primera que sí lo esté.
        if (this.bat.bloqueo(0, sel) !== null) sel = Math.max(0, [0, 1, 2, 3].findIndex((i) => this.bat.bloqueo(0, i) === null));
        this.modoHabilidades(sel);
        // Con Ataque Definitivo hay una quinta opción (4) debajo de la grilla.
        const conDef = !!this.bat.act(0).definitivo;
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
            if (this.bat.bloqueoDefinitivo(0) !== null) {
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
            resolver({ tipo: 'habilidad', indice: sel });
            return;
          }
          sonido.tocar('cursor');
          this.modoHabilidades(sel);
        };
      };
      const menuBolsa = () => {
        const items = this.itemsDeCombate();
        const usable = (i: Item) => cantidad(juego.estado, i.id) > 0 && this.bat.bloqueoItem(0, i) === null;
        // El cursor empieza en el primer ítem que se pueda usar ahora (o, si no hay, en el primero que tengas).
        let sel = items.findIndex(usable);
        if (sel < 0) sel = Math.max(0, items.findIndex((i) => cantidad(juego.estado, i.id) > 0));
        this.modoBolsa(items, sel);
        this.alPulsar = (a) => {
          if (a === 'izquierda' || a === 'derecha') sel = Math.min(items.length - 1, sel ^ 1);
          else if (a === 'arriba' || a === 'abajo') sel = Math.min(items.length - 1, sel ^ 2);
          else if (a === 'b') {
            sonido.tocar('cancelar');
            menuPrincipal();
            return;
          } else if (a === 'a') {
            const item = items[sel]!;
            if (cantidad(juego.estado, item.id) < 1 || this.bat.bloqueoItem(0, item) !== null) {
              sonido.tocar('negado');
              return;
            }
            sonido.tocar('aceptar');
            // El ítem se gasta al elegirlo; la partida se guarda al final del combate.
            quitar(juego.estado, item.id);
            this.alPulsar = null;
            resolver({ tipo: 'item', item });
            return;
          } else return;
          sonido.tocar('cursor');
          this.modoBolsa(items, sel);
        };
      };
      menuPrincipal();
    });
  }

  /** Ítems de combate en el orden de los datos (hasta 4, una celda cada uno). */
  private itemsDeCombate(): Item[] {
    return [...DATOS.items.values()].filter((i) => i.uso === 'combate').slice(0, 4);
  }

  private modoBolsa(items: Item[], sel: number): void {
    this.ocultarMenus();
    this.msg.visible(false);
    this.gVentanas.clear();
    ventana(this.gVentanas, 2, 112, 236, 46);
    this.gVentanas.fillStyle(n(C.papelSombra), 1).fillRect(8, 135, 224, 1);
    items.forEach((it, i) => {
      const n0 = cantidad(juego.estado, it.id);
      const bloqueado = n0 < 1 || this.bat.bloqueoItem(0, it) !== null;
      const color = bloqueado ? C.apagado : i === sel ? C.resalte : C.tinta;
      this.celdas[i]!.nombre.poner(it.nombre, color).visible(true);
      this.celdas[i]!.usos.poner(`×${n0}`, color).visible(true);
    });
    const x = 8 + (sel % 2) * 110;
    const y = 117 + Math.floor(sel / 2) * 9;
    this.cursor.fillStyle(n(C.resalte), 1).fillTriangle(x, y, x, y + 6, x + 4, y + 3);
    const it = items[sel]!;
    const motivo = cantidad(juego.estado, it.id) < 1 ? 'sin_unidades' : this.bat.bloqueoItem(0, it);
    this.info1.imagen.setX(10);
    this.info1.poner(t('bolsa.restan', { n: this.bat.itemsUsados[0], max: DATOS.reglasItems.maxPorCombate })).visible(true);
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
        if (equipo.miembros.length < 3) this.filasEquipo[2]!.poner(aviso || (forzado ? t('c.elige') : ''), C.tintaSuave).visible(true);
      };
      pintar();
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
    this.cursor.clear();
    this.msg.visible(true);
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
      this.info1.imagen.setY(143);
      this.info2.imagen.setY(151);
    }
    const x = sel === 4 ? 60 : 8 + (sel % 2) * 110;
    const y = sel === 4 ? 136 : 117 + Math.floor(sel / 2) * 9;
    this.cursor.fillStyle(n(C.resalte), 1).fillTriangle(x, y, x, y + 6, x + 4, y + 3);
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
    this.gVentanas.fillStyle(COLOR_TIPO[h.def.tipo] ?? 0x566c86, 1).fillRect(10, def ? 144 : 138, 5, 5);
    this.info1.imagen.setX(18);
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

  /** Describe los efectos de una habilidad a partir de sus datos (sin texto escrito a mano). */
  private describir(h: Habilidad): string {
    const partes: string[] = [];
    for (const e of h.efectos) {
      if (e.tipo === 'estado') partes.push(t(e.prob >= 100 ? 'ef.estado.seguro' : 'ef.estado', { prob: e.prob, estado: t(`estado.${e.estado}`) }));
      else if (e.tipo === 'etapa') partes.push(t(e.objetivo === 'propio' ? 'ef.etapa.sube' : 'ef.etapa.baja', { prob: e.prob, stat: t(`stat.${e.stat}`) }));
      else if (e.tipo === 'cura') partes.push(t('ef.cura', { x: e.porcentaje }));
      else if (e.tipo === 'guardia') partes.push(t(`ef.guardia.${e.modo}`, { x: Math.round((e.reduccion ?? 0) * 100) }));
    }
    if (h.rol === 'final') partes.push(t('ef.final', { n: h.enfriamiento }));
    return partes.join(' · ');
  }

  // ------------------------------------------------------------ dibujo

  private crearPanel(x: number, y: number): Panel {
    const g = this.add.graphics();
    ventana(g, x, y, 116, 26, 0.95);
    new Texto(this, x + 6, y + 14, 12, 10, C.resalte).poner(t('ps'));
    return {
      x,
      y,
      nombre: new Texto(this, x + 6, y + 4, 80, 10),
      nivel: new Texto(this, x + 88, y + 4, 22, 10, C.tintaSuave, 'der'),
      ps: new Texto(this, x + 76, y + 14, 34, 10, C.tinta, 'der'),
      barra: this.add.graphics(),
      puntos: this.add.graphics(),
      estadoFondo: this.add.graphics(),
      // El estado va fuera del panel, después de los puntos del equipo, para no tapar nombres largos.
      estado: new Texto(this, x === PANEL[0].x ? x - 52 : x + 142, y + 8, 20, 10, C.papel, 'centro'),
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
      const mia = criaturaDe(juego.estado, c.especie.id);
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
      const x = lado === 0 ? p.x - 6 - i * 8 : p.x + 122 + i * 8;
      const y = p.y + 13;
      p.puntos.fillStyle(n(C.marco), 1).fillCircle(x, y, i === equipo.activo ? 3.4 : 2.8);
      p.puntos.fillStyle(m.ps > 0 ? C.psAlto : n(C.papel), 1).fillCircle(x, y, 2);
    });
  }

  private pintarEstado(lado: Lado): void {
    const p = this.paneles[lado];
    const est = this.bat.act(lado).estado;
    p.estadoFondo.clear();
    if (!est) {
      p.estado.poner('');
      return;
    }
    p.estadoFondo.fillStyle(COLOR_ESTADO[est.id] ?? 0x566c86, 1).fillRoundedRect(p.x === PANEL[0].x ? p.x - 52 : p.x + 142, p.y + 7, 20, 9, 2);
    p.estado.poner(t(`estado.abrev.${est.id}`));
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
    return POS[this.hueco(lado)];
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
    // Respiración: se estiran y aplastan un poco desde los pies, cada una a su ritmo, y se mecen apenas.
    this.sprites.forEach((s, i) => {
      if (this.tweens.isTweening(s) || s.alpha === 0) return;
      const f = this.reloj * (i ? 2.1 : 2.4) + i * 1.7;
      const r = Math.sin(f);
      s.setScale(1 - 0.014 * r, 1 + 0.032 * r);
      s.setAngle(Math.sin(this.reloj * 0.9 + i * 2.2) * 1.1);
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
    this.tweens.add({ targets: this.cam, zoom: 1.04, fx: 120, fy: 80, giro: 1, duration: 500, ease: 'Sine.easeInOut' });
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
      s.setTexture(this.texturaDe(lado, this.bat.act(lado))).setPosition(p.x, s.alpha === 0 ? p.y + 30 : p.y);
    }
    // El de atrás (más cerca de la cámara) se dibuja encima.
    this.mundo.bringToTop(this.sprites[this.vista === 'rival' ? 1 : 0]);
    this.mundo.bringToTop(this.capaFx);
    if (animado) {
      this.cam.fx = 120 - borde * sentido;
      await Promise.all([
        this.tween({ targets: this.cam, zoom: 1.04, fx: 120, duration: 240, ease: 'Quad.easeOut' }),
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
    s.setTexture(this.texturaDe(lado, entra)).setPosition(fuera, this.pos(lado).y).setAlpha(1);
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
    await this.tween({ targets: s, scaleX: 1.08, scaleY: 1.08, duration: 180, yoyo: true, repeat: 2 });
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
    await this.tween({ targets: s, scaleX: 1.2, scaleY: 1.2, duration: 260, yoyo: true });
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

  /** Habilidad sin daño: la criatura se hincha un instante y aparece su efecto. */
  private async animApoyo(lado: Lado, h: Habilidad): Promise<void> {
    const apuntaAlRival = h.efectos.some((e) => (e.tipo === 'estado' || e.tipo === 'etapa') && e.objetivo === 'rival');
    await Promise.all([
      this.tween({ targets: this.sprites[lado], scaleX: 1.12, scaleY: 1.12, duration: 120, yoyo: true }),
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
