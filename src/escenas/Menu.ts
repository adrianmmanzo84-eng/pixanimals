import { abrirHuevo, huevosListos } from '../core/minijuegos/mina';
import Phaser from 'phaser';
import { expedicionLibre, faltaExpedicion, metasPorCobrar } from '../core/progresion/coleccion';
import { semanalCobrado, tipoDeLaSemana } from '../core/modos/semanal';
import { DATOS } from '../core/datos';
import { NIVELES_IA } from '../core/combate/ia';
import { equipoDe, nombreDe } from '../core/estado/juego';

/** La favorita saluda (salto y grito) la primera vez que se abre el menú en cada sesión. */
let saludoHecho = false;
import { recibir, sobresGratis } from '../core/sobres/sobres';
import { puedeEvolucionar } from '../core/progresion/evolucion';
import { cobrarDiario, diarioDisponible, premioDeHoy } from '../core/progresion/diario';
import { ruletaDisponible } from '../core/progresion/ruleta';
import { misionesPorCobrar } from '../core/progresion/misiones';
import { entrenadorCobrado } from '../core/modos/entrenador';
import { desafioJugado, numeroDesafio } from '../core/modos/desafio';
import { musica } from '../audio/musica';
import { esJefe, guardianDePiso } from '../core/modos/torre';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { fondo } from '../ui/fondos';
import { abrirGuardado } from '../ui/guardadoDom';
import { debeRecordarCopia } from '../core/estado/respaldo';
import { cobrarPaso, pasoActual, PASOS_GUIA, premioPaso } from '../core/progresion/guia';
import { cobrarRegalo, eventoDeHoy, regaloPendiente } from '../core/progresion/eventos';
import { marcarAviso, ultimaCopia, ultimoAviso } from '../ui/recordatorio';
import { Puntero } from '../ui/puntero';
import { partir, Texto } from '../ui/texto';
import { hayArte, pieza } from '../ui/arte';

const OPCIONES = [
  'menu.combatir', 'menu.minijuegos', 'menu.misiones', 'menu.expediciones', 'menu.sobres', 'menu.tienda',
  'menu.bolsaP', 'menu.equipoP', 'menu.coleccion', 'menu.bestiario', 'menu.ruleta', 'menu.guardado',
];
const DESTINOS = ['', 'Minijuegos', 'Misiones', 'Expediciones', 'Sobres', 'Tienda', 'BolsaEscena', 'Equipo', 'Coleccion', 'Bestiario', 'Ruleta', ''];
const GUARDADO = OPCIONES.length - 1;
/** Ícono de cada opción (arte del autor; la Ruleta se dibuja por código). */
const ICONOS = ['menu_combate', 'menu_minijuegos', 'menu_misiones', 'menu_expediciones', 'menu_sobres', 'menu_tienda', 'menu_bolsa', 'menu_equipo', 'menu_coleccion', 'menu_bestiario', 'menu_ruleta', 'menu_guardado'];
const ALTO_FILA = 10;
/** Dos columnas de hasta 6 opciones. */
const POR_COLUMNA = 6;
const COL_X = [40, 126];

/** Menú principal: desde aquí se entra a todo lo demás. */
export class Menu extends Phaser.Scene {
  private filas: Texto[] = [];
  /** Íconos del menú principal: solo se ven en él (los submenús no llevan íconos). */
  private iconos: Phaser.GameObjects.GameObject[] = [];
  private conIcono = false;
  private cursor!: Phaser.GameObjects.Graphics;
  private ayuda!: Texto;
  private sel = 0;
  private puntero: Puntero | null = null;
  private modo: 'principal' | 'combates' | 'dificultad' | 'diario' | 'aviso' = 'principal';
  /** Qué hacer con A o B mientras se muestra un aviso (partida recuperada, recordatorio de copia). */
  private alAviso: ((a: AccionEntrada) => void) | null = null;
  private submenu = false;
  /** Cartel de Primeros pasos (solo en el menú principal). */
  private cartelGuia: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('Menu');
  }

  /** `submenu: 'combates'` vuelve directo al submenú de combates (al terminar un combate). */
  init(d: { submenu?: string }): void {
    this.submenu = d?.submenu === 'combates';
  }

  create(): void {
    const estado = juego.estado;
    // Primera vez: el sobre de bienvenida entrega el equipo inicial.
    if (!estado.bienvenida) {
      this.scene.start('Sobres', { bienvenida: true });
      return;
    }
    musica.tocar('menu');
    this.filas = [];
    this.iconos = [];
    this.modo = this.submenu ? 'combates' : 'principal';
    this.sel = 0;
    prepararCamara(this);
    if (this.textures.exists('fondoimg_portada')) {
      // Ilustración de portada ajustada al ancho (sus criaturas están en los bordes); debajo, el panel del equipo.
      this.add.graphics().fillStyle(0x1a1c2c, 1).fillRect(0, 0, 240, 160);
      this.add.image(0, 0, 'fondoimg_portada').setOrigin(0, 0).setScale(0.25);
    } else this.add.image(0, 0, fondo(this, 'menu')).setOrigin(0, 0).setScale(0.25);
    const g = this.add.graphics();
    new Texto(this, 0, 2, 240, 16, '#ffffff', 'centro', { tam: 13, peso: 600, borde: '#2b3a78' }).poner(t('titulo'));
    // Recursos con sus íconos (o en texto si falta el arte).
    if (hayArte(this, 'monedas')) {
      pieza(this, 'monedas', 92, 22, 8);
      new Texto(this, 98, 17, 40, 10, '#ffffff', 'izq', { borde: '#2b3a78' }).poner(String(estado.monedas));
      pieza(this, 'esencia', 140, 22, 8);
      new Texto(this, 146, 17, 40, 10, '#ffffff', 'izq', { borde: '#2b3a78' }).poner(String(estado.esencia));
    } else
      new Texto(this, 0, 17, 240, 10, '#ffffff', 'centro', { borde: '#2b3a78' }).poner(
        `${t('rec.monedas', { n: estado.monedas })}   ·   ${t('rec.esencia', { n: estado.esencia })}`,
      );

    ventana(g, 26, 29, 188, 66);
    const gRueda = this.add.graphics();
    this.conIcono = hayArte(this, 'menu_combate');
    for (let i = 0; i < OPCIONES.length; i++) {
      const col = Math.floor(i / POR_COLUMNA);
      const yFila = 32 + (i % POR_COLUMNA) * ALTO_FILA;
      if (this.conIcono) {
        const ico = ICONOS[i] ? pieza(this, ICONOS[i]!, COL_X[col]! + 11, yFila + 4.6, 8) : null;
        if (ico) this.iconos.push(ico);
        else {
          ruedita(gRueda, COL_X[col]! + 11, yFila + 4.6);
          if (!this.iconos.includes(gRueda)) this.iconos.push(gRueda);
        }
      }
      // La primera columna sirve también a los submenús (sin íconos, con textos más largos): más ancha.
      this.filas.push(new Texto(this, COL_X[col]! + (this.conIcono ? 17 : 8), yFila, col === 0 ? 150 : this.conIcono ? 72 : 80, 10));
    }
    this.cursor = this.add.graphics();
    const puntero = new Puntero(this);
    this.puntero = puntero;
    this.filas.forEach((f, i) =>
      puntero.zona(COL_X[Math.floor(i / POR_COLUMNA)]!, f.imagen.y - 1, 88, ALTO_FILA, () => {
        if (this.modo === 'diario' || i >= this.opciones().length || i === this.sel) return;
        this.sel = i;
        sonido.tocar('cursor');
        this.pintar();
      }),
    );

    // Equipo actual, con icono animado de dos cuadros.
    ventana(g, 4, 114, 232, 42);
    const equipo = equipoDe(estado);
    equipo.forEach((c, i) => {
      const x = 10 + i * 76;
      const icono = this.add.sprite(x + 16, 135, textura(c.especie, 'icono'), 0);
      let cuadro = 0;
      this.time.addEvent({ delay: 420, loop: true, callback: () => icono.setFrame((cuadro ^= 1)) });
      // Los nombres largos (y los apodos de 12 letras) van con letra más chica para entrar en su lugar.
      const nombre = (c.favorita ? '★' : '') + nombreDe(DATOS, c);
      new Texto(this, x + 33, 124, 44, 10, C.tinta, 'izq', nombre.length > 9 ? { tam: nombre.length > 11 ? 5.4 : 6.2 } : {}).poner(nombre);
      if (c.favorita && !saludoHecho) {
        saludoHecho = true;
        this.time.delayedCall(450, () => {
          sonido.grito(c.especie);
          this.tweens.add({ targets: icono, y: 128, duration: 140, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
        });
      }
      new Texto(this, x + 33, 134, 44, 10, C.tintaSuave).poner(t('nv', { n: c.nivel }) + (c.brillante ? ' ✦' : ''));
    });
    if (!equipo.length) new Texto(this, 10, 130, 220, 10, C.tintaSuave, 'centro').poner(t('menu.sinEquipo'));
    this.ayuda = new Texto(this, 0, 98, 240, 10, '#ffffff', 'centro', { borde: '#2b3a78' }).visible(false);
    // Primeros pasos: el paso actual en un cartel y el cursor sobre la opción que lleva a cumplirlo.
    this.cartelGuia = null;
    const paso = pasoActual(estado);
    if (paso) {
      const g = this.add.graphics();
      ventana(g, 30, 98, 180, 16, 0.96);
      g.fillStyle(n(C.resalte), 1).fillRoundedRect(34, 101, 50, 10, 3);
      const n1 = PASOS_GUIA.indexOf(paso) + 1;
      this.cartelGuia = this.add.container(0, 0, [
        g,
        new Texto(this, 34, 101, 50, 10, '#ffffff', 'centro', { tam: 6, peso: 600 }).poner(t('guia.etiqueta', { n: n1, t: PASOS_GUIA.length })).imagen,
        new Texto(this, 88, 101, 120, 10, C.tinta, 'izq', { tam: 6.6, peso: 600 }).poner(t(`guia.${paso.id}`)).imagen,
      ]);
      if (this.modo === 'principal') this.sel = paso.opcion;
    } else {
      // Evento de calendario de hoy (si no hay guía, ocupa su lugar).
      const ev = eventoDeHoy(DATOS, Date.now());
      if (ev) {
        const g = this.add.graphics();
        ventana(g, 30, 98, 180, 16, 0.96);
        g.fillStyle(0x7a56b0, 1).fillRoundedRect(34, 101, 64, 10, 3);
        this.cartelGuia = this.add.container(0, 0, [
          g,
          new Texto(this, 34, 101, 64, 10, '#ffffff', 'centro', { tam: 5.8, peso: 600 }).poner(t(`evento.${ev.id}`)).imagen,
          new Texto(this, 102, 101, 106, 10, C.tinta, 'izq', { tam: 6, peso: 600 }).poner(t(`evento.${ev.id}.desc`)).imagen,
        ]);
      }
    }

    this.pintar();
    // Un solo aviso por vez: partida recuperada > premio diario > recordatorio de copia.
    if (juego.recuperada) {
      juego.recuperada = false;
      this.mostrarAviso(t('menu.recuperada.titulo'), t('menu.recuperada.texto'), t('menu.aviso.ayuda'), (a) => a === 'a' && this.scene.restart());
    } else if (this.modo === 'principal' && huevosListos(estado, Date.now()).length) {
      // Huevo de la Mina: nace la cría (rareza épica, la única forma de conseguir esa familia).
      const especie = abrirHuevo(estado, Date.now())!;
      recibir(DATOS, estado, especie, 'epica', false);
      juego.guardar();
      sonido.tocar('zona');
      this.mostrarAviso(t('menu.huevo.titulo'), t('menu.huevo.texto', { n: DATOS.criaturas.get(especie)!.nombre }), t('menu.aviso.ayuda'), (a) => (a === 'a' || a === 'b') && this.scene.restart());
    } else if (this.modo === 'principal' && pasoActual(estado)?.cumplido(estado)) this.mostrarPaso();
    else if (this.modo === 'principal' && regaloPendiente(DATOS, estado, Date.now())) this.mostrarRegalo();
    else if (diarioDisponible(estado, Date.now())) this.mostrarDiario();
    else if (this.modo === 'principal' && debeRecordarCopia(estado, ultimaCopia(), ultimoAviso(), Date.now())) {
      marcarAviso();
      this.mostrarAviso(t('menu.copia.titulo'), t('menu.copia.texto'), t('menu.copia.ayuda'), (a) => {
        if (a === 'a') {
          Entrada.escuchar(null);
          abrirGuardado(() => this.scene.restart());
        } else if (a === 'b') this.scene.restart();
      });
    }
    Entrada.escuchar((a) => this.alPulsar(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private opciones(): string[] {
    if (this.modo === 'dificultad') return NIVELES_IA.map((ia) => t('menu.premio', { ia: t(`ia.${ia}`), n: DATOS.economia.recompensas[ia] }));
    if (this.modo === 'combates') {
      const piso = juego.estado.torre.piso;
      return [
        t('menu.rapido'),
        t(desafioJugado(juego.estado, Date.now()) ? 'menu.desafioHecho' : 'menu.desafio', { n: numeroDesafio(Date.now()) }),
        t(guardianDePiso(DATOS, piso) ? 'menu.torreGuardian' : esJefe(DATOS, piso) ? 'menu.torreJefe' : 'menu.torre', { n: piso }),
        t(entrenadorCobrado(juego.estado, Date.now()) ? 'menu.entrenadorHecho' : 'menu.entrenador'),
        t(semanalCobrado(juego.estado, Date.now()) ? 'menu.semanalHecho' : 'menu.semanal', { t: DATOS.tipos.get(tipoDeLaSemana(DATOS, Date.now()))!.nombre }),
      ];
    }
    const hayGratis = sobresGratis(DATOS, juego.estado, Date.now()).disponibles > 0;
    const hayEvolucion = juego.estado.criaturas.some((c) => puedeEvolucionar(DATOS, juego.estado, c));
    const porCobrar = misionesPorCobrar(DATOS, juego.estado);
    const metas = metasPorCobrar(DATOS, juego.estado);
    const volvieron = juego.estado.expediciones.filter((x) => faltaExpedicion(x, Date.now()) === 0).length;
    return OPCIONES.map((c) => {
      if (c === 'menu.combatir' && !desafioJugado(juego.estado, Date.now()) && juego.estado.equipo.length) return t('menu.combatirHoy');
      if (c === 'menu.sobres' && (hayGratis || Object.values(juego.estado.sobresRegalo).some((v) => v > 0))) return t('menu.sobres.gratis');
      if (c === 'menu.equipoP' && hayEvolucion) return t('menu.equipoEvo');
      if (c === 'menu.misiones' && porCobrar) return t('menu.misionesN', { n: porCobrar });
      if (c === 'menu.coleccion' && metas) return t('menu.coleccionN', { n: metas });
      if (c === 'menu.expediciones' && volvieron) return t('menu.expedicionesN', { n: volvieron });
      if (c === 'menu.expediciones' && expedicionLibre(DATOS, juego.estado)) return t('menu.expedicionesLibre');
      if (c === 'menu.ruleta' && ruletaDisponible(juego.estado, Date.now())) return t('menu.ruletaHoy');
      return t(c);
    });
  }

  private pintar(): void {
    const ops = this.opciones();
    this.filas.forEach((f, i) => f.poner(ops[i] ?? '', i === this.sel ? C.resalte : C.tinta));
    // Los íconos son del menú principal: en Combate y en Dificultad no se ven, y el texto ocupa su lugar.
    const principal = this.modo === 'principal';
    this.iconos.forEach((o) => (o as Phaser.GameObjects.Image).setVisible(principal));
    this.filas.forEach((f, i) => {
      if (i < POR_COLUMNA) f.imagen.setX(COL_X[0]! + (principal && this.conIcono ? 17 : 8));
      else f.imagen.setVisible(principal);
    });
    const col = Math.floor(this.sel / POR_COLUMNA);
    const y = 33 + (this.sel % POR_COLUMNA) * ALTO_FILA;
    const x = COL_X[col]!;
    this.cursor.clear().fillStyle(n(C.resalte), 1).fillTriangle(x, y, x, y + 6, x + 4, y + 3);
    this.puntero?.marcar(`${this.modo}:${this.sel}`, this.filas[this.sel]?.imagen);
    this.ayuda.poner(t('menu.dificultad')).visible(false);
    this.cartelGuia?.setVisible(principal);
  }

  /** Paso de la guía cumplido: muestra el premio; A lo cobra y vuelve a abrir el menú (que muestra el siguiente). */
  private mostrarPaso(): void {
    const paso = pasoActual(juego.estado)!;
    const p = premioPaso(DATOS, paso);
    const partes: string[] = [];
    if (p.monedas) partes.push(t('fin.monedas', { n: p.monedas }));
    if (p.esencia) partes.push(t('fin.esencia', { n: p.esencia }));
    if (p.sobre) partes.push(DATOS.sobres.sobres.find((x) => x.id === p.sobre)?.nombre ?? p.sobre);
    const ultimo = PASOS_GUIA.indexOf(paso) === PASOS_GUIA.length - 1;
    const texto = `${t(`guia.${paso.id}`)} ✓\n${t('guia.premio', { p: partes.join(' · ') })}${ultimo ? `\n${t('guia.fin')}` : ''}`;
    sonido.tocar(ultimo ? 'tesoro' : 'sube');
    this.mostrarAviso(t(ultimo ? 'guia.tituloFin' : 'guia.titulo'), texto, t('menu.aviso.ayuda'), (a) => {
      if (a !== 'a') return;
      cobrarPaso(DATOS, juego.estado);
      juego.guardar();
      this.scene.restart();
    });
  }

  /** Regalo del evento de hoy (fechas especiales): un sobre que queda para abrir gratis en Sobres. */
  private mostrarRegalo(): void {
    const r = regaloPendiente(DATOS, juego.estado, Date.now())!;
    const sobre = DATOS.sobres.sobres.find((s) => s.id === r.sobre)?.nombre ?? r.sobre;
    sonido.tocar('tesoro');
    this.cameras.main.flash(220, 255, 236, 170);
    this.mostrarAviso(t(`evento.${r.evento.id}.titulo`), t('evento.regalo', { s: sobre, d: t(`evento.${r.evento.id}.desc`) }), t('evento.cobrar'), (a) => {
      if (a !== 'a') return;
      cobrarRegalo(DATOS, juego.estado, Date.now());
      juego.guardar();
      this.scene.restart();
    });
  }

  /** Cartel encima del menú con título, texto y ayuda; `alPulsar` decide qué hacen A y B. */
  private mostrarAviso(titulo: string, texto: string, ayuda: string, alPulsar: (a: AccionEntrada) => void): void {
    this.modo = 'aviso';
    this.alAviso = alPulsar;
    this.add.graphics().setDepth(9).fillStyle(0x141830, 0.7).fillRect(0, 0, 240, 160);
    const lineas = partir(texto, 176);
    const alto = 46 + lineas.length * 10;
    const g = this.add.graphics().setDepth(10);
    ventana(g, 24, 80 - alto / 2, 192, alto);
    const y0 = 80 - alto / 2;
    for (const tx of [
      new Texto(this, 24, y0 + 6, 192, 12, '#257179', 'centro', { tam: 9.5, peso: 600 }).poner(titulo),
      new Texto(this, 32, y0 + 21, 176, lineas.length * 10, C.tinta, 'centro').poner(lineas.join('\n')),
      new Texto(this, 24, y0 + alto - 15, 192, 10, C.tintaSuave, 'centro').poner(ayuda),
    ])
      tx.imagen.setDepth(11);
  }

  /** Ventana del premio diario: los 7 días del ciclo, con el de hoy marcado. */
  private mostrarDiario(): void {
    const estado = juego.estado;
    const p = premioDeHoy(DATOS, estado, Date.now());
    const ciclo = DATOS.economia.diario.ciclo;
    this.modo = 'diario';
    const g = this.add.graphics();
    const velo = this.add.graphics().fillStyle(0x141830, 0.7).fillRect(0, 0, 240, 160);
    g.setDepth(10);
    velo.setDepth(9);
    ventana(g, 24, 30, 192, 92);
    const textos = [
      new Texto(this, 24, 35, 192, 12, '#257179', 'centro', { tam: 9.5, peso: 600 }).poner(t('diario.titulo')),
      new Texto(this, 24, 48, 192, 10, C.tintaSuave, 'centro').poner(t('diario.racha', { n: p.racha })),
    ];
    for (let d = 1; d <= ciclo; d++) {
      const x = 120 + (d - (ciclo + 1) / 2) * 24;
      const hoy = d === p.dia;
      const pasado = d < p.dia;
      g.fillStyle(hoy ? 0xfde9c8 : pasado ? 0xc8e6c9 : n(C.papelSombra), 1).fillRoundedRect(x - 10, 62, 20, 24, 3);
      if (hoy) g.lineStyle(1.4, n(C.resalte), 1).strokeRoundedRect(x - 10, 62, 20, 24, 3);
      if (d === ciclo) {
        // Sobre de regalo: una cartita.
        g.fillStyle(0x7a56b0, 1).fillRoundedRect(x - 5, 66, 10, 13, 2);
        g.fillStyle(0xf5c542, 1).fillRect(x - 2, 71, 4, 3);
      } else {
        g.fillStyle(0xf5c542, 1).fillCircle(x, 72, 4.5);
        g.fillStyle(0xe09a20, 1).fillRect(x - 0.6, 69.5, 1.2, 5);
      }
      textos.push(new Texto(this, x - 10, 77, 20, 9, pasado ? '#2f7a48' : C.tinta, 'centro', { tam: 6.6 }).poner(pasado ? '✓' : String(d)));
    }
    const premio = p.sobre ? t('diario.premioSobre', { n: p.monedas, s: DATOS.sobres.sobres.find((s) => s.id === p.sobre)!.nombre }) : t('diario.premio', { n: p.monedas });
    textos.push(new Texto(this, 24, 92, 192, 10, C.tinta, 'centro', { peso: 600 }).poner(premio));
    textos.push(new Texto(this, 24, 106, 192, 10, C.tintaSuave, 'centro').poner(t('diario.ayuda')));
    for (const tx of textos) tx.imagen.setDepth(11);
  }

  private alPulsar(a: AccionEntrada): void {
    if (this.modo === 'aviso') {
      if (a === 'a' || a === 'b') sonido.tocar(a === 'a' ? 'aceptar' : 'cancelar');
      this.alAviso?.(a);
      return;
    }
    if (this.modo === 'diario') {
      if (a !== 'a') return;
      cobrarDiario(DATOS, juego.estado, Date.now());
      juego.guardar();
      sonido.tocar('cura');
      this.scene.restart();
      return;
    }
    const total = this.opciones().length;
    if (a === 'arriba' || a === 'abajo') {
      if (this.modo !== 'principal') this.sel = (this.sel + (a === 'abajo' ? 1 : total - 1)) % total;
      else {
        // Dentro de la columna.
        const col = Math.floor(this.sel / POR_COLUMNA);
        const ini = col * POR_COLUMNA;
        const largo = Math.min(POR_COLUMNA, total - ini);
        this.sel = ini + ((this.sel - ini + (a === 'abajo' ? 1 : largo - 1)) % largo);
      }
      sonido.tocar('cursor');
    } else if ((a === 'izquierda' || a === 'derecha') && this.modo === 'principal') {
      const fila = this.sel % POR_COLUMNA;
      const col = this.sel < POR_COLUMNA ? 1 : 0;
      this.sel = Math.min(total - 1, col * POR_COLUMNA + fila);
      sonido.tocar('cursor');
    } else if (a === 'b' && this.modo === 'dificultad') {
      this.modo = 'combates';
      this.sel = 0;
      sonido.tocar('cancelar');
    } else if (a === 'b' && this.modo === 'combates') {
      sonido.tocar('cancelar');
      // Al volver al menú principal se vuelve a abrir la escena: así aparecen el paso cumplido y el cartel de la guía.
      this.submenu = false;
      this.scene.restart({});
      return;
    } else if (a === 'a') {
      if (this.modo === 'dificultad') {
        sonido.tocar('aceptar');
        this.scene.start('Combate', { ia: NIVELES_IA[this.sel], modo: 'rapido' });
        return;
      }
      if (this.modo === 'combates') {
        sonido.tocar('aceptar');
        if (this.sel === 0) {
          this.modo = 'dificultad';
          this.sel = 1;
        } else {
          this.scene.start('Desafio', { modo: (['desafio', 'torre', 'entrenador', 'semanal'] as const)[this.sel - 1]! });
          return;
        }
        this.pintar();
        return;
      }
      const destino = DESTINOS[this.sel]!;
      if (this.sel === 0) {
        if (!equipoDe(juego.estado).length) {
          sonido.tocar('negado');
          return;
        }
        this.modo = 'combates';
        this.sel = 0;
        sonido.tocar('aceptar');
      } else if (this.sel === GUARDADO) {
        sonido.tocar('aceptar');
        Entrada.escuchar(null);
        abrirGuardado(() => this.scene.restart());
        return;
      } else {
        sonido.tocar('aceptar');
        // Siempre con datos explícitos: Phaser reutiliza los del arranque anterior si no se pasan.
        this.scene.start(destino, { bienvenida: false });
        return;
      }
    } else return;
    this.pintar();
  }
}

/** Ruedita de colores de 8 px para la opción Ruleta (no tiene dibujo propio). */
function ruedita(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  const colores = [0xf5c542, 0xe05a6a, 0x5aa9f0, 0x4caf7a];
  g.fillStyle(0x1f2340, 1).fillCircle(x, y, 3.8);
  colores.forEach((c, i) => g.fillStyle(c, 1).slice(x, y, 3.1, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2, false).fillPath());
  g.fillStyle(0xfdf6e3, 1).fillCircle(x, y, 0.9);
  g.fillStyle(0x1f2340, 1).fillTriangle(x - 1.2, y - 4.8, x + 1.2, y - 4.8, x, y - 2.8);
}
