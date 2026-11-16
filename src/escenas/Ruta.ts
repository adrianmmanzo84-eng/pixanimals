import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { equipoDe } from '../core/estado/juego';
import { estaciones, vencidas, type ModoRuta } from '../core/modos/rutas';
import { entrenadorCobrado, entrenadorDelDia } from '../core/modos/entrenador';
import { jefeDeLaSemana, semanalCobrado, tipoDeLaSemana } from '../core/modos/semanal';
import { Entrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { miniatura, textura } from '../ui/criaturas';
import { C, COLOR_TIPO, n, prepararCamara, ventana } from '../ui/estilo';
import { Texto } from '../ui/texto';

/** Dónde está cada estación en el mapa (la última es el jefe). Sin arte se usan las del manifiesto del autor. */
const NODOS_BASE = [
  { x: 26, y: 104 },
  { x: 76, y: 70 },
  { x: 132, y: 98 },
  { x: 196, y: 52 },
];
/** Centro real de cada plazoleta pintada en los mapas del autor (medido sobre la imagen; D240). */
const NODOS_ARTE: Record<ModoRuta, { x: number; y: number }[]> = {
  entrenador: [
    { x: 23.75, y: 104.25 },
    { x: 72.75, y: 71.75 },
    { x: 136, y: 92.75 },
    { x: 195.5, y: 52.25 },
  ],
  semanal: [
    { x: 26, y: 102 },
    { x: 78.5, y: 71.25 },
    { x: 134.75, y: 95.5 },
    { x: 198.75, y: 53 },
  ],
};
let NODOS = NODOS_BASE;

/**
 * Camino del Entrenador del día o del Jefe de la semana (D221), como un mapa de Super Mario World:
 * estaciones previas y el jefe al final. ◀ ▶ recorren el camino; A pelea en la estación marcada (si ya llegaste).
 * Arte opcional: ruta_entrenador / ruta_semanal (960×640, el mapa) y los íconos ruta_nodo, ruta_vencido, ruta_jefe (64×64, se ven a 16 px).
 */
export class Ruta extends Phaser.Scene {
  private modo: ModoRuta = 'entrenador';
  private avanzo = false;
  private sel = 0;

  constructor() {
    super('Ruta');
  }

  init(d: { modo?: ModoRuta; avanzo?: boolean; sel?: number }): void {
    this.modo = d?.modo ?? 'entrenador';
    this.avanzo = !!d?.avanzo;
    this.sel = d?.sel ?? -1;
  }

  create(): void {
    prepararCamara(this);
    musica.tocar('menu');
    const estado = juego.estado;
    const mios = equipoDe(estado);
    const ahora = Date.now();
    const lista = estaciones(DATOS, this.modo, ahora, mios);
    const v = Math.min(vencidas(estado, this.modo, ahora), lista.length - 1);
    if (this.sel < 0) this.sel = v;
    const tipo = this.modo === 'entrenador' ? entrenadorDelDia(DATOS, ahora).tipo : tipoDeLaSemana(DATOS, ahora);
    const colorTipo = COLOR_TIPO[tipo] ?? 0x888888;

    this.dibujarMapa(colorTipo);
    const g = this.add.graphics();
    const arte = this.textures.exists(`ruta_${this.modo}`);
    NODOS = arte ? NODOS_ARTE[this.modo] : NODOS_BASE;
    // Camino punteado entre estaciones (más claro lo recorrido); el mapa del autor ya trae el camino dibujado.
    for (let i = 0; i < (arte ? 0 : NODOS.length - 1); i++) {
      const a = NODOS[i]!;
      const b = NODOS[i + 1]!;
      const pasos = 9;
      for (let k = 1; k < pasos; k++) {
        const x = a.x + ((b.x - a.x) * k) / pasos;
        const y = a.y + ((b.y - a.y) * k) / pasos - Math.sin((Math.PI * k) / pasos) * 8;
        g.fillStyle(i < v ? 0xfff1c8 : 0x8a7a5a, 1).fillCircle(x, y, 1.6);
      }
    }
    // Estaciones.
    lista.forEach((e, i) => {
      const p = NODOS[i]!;
      const vencida = i < v || (e.jefe && this.jefeVencido());
      const abierta = i <= v;
      const clave = e.jefe ? 'ruta_jefe' : vencida ? 'ruta_vencido' : 'ruta_nodo';
      if (this.textures.exists(clave)) this.add.image(p.x, p.y, clave).setScale(0.25);
      else {
        const r = e.jefe ? 8 : 6;
        g.fillStyle(0x1a1c2c, 0.35).fillEllipse(p.x, p.y + r - 1, r * 2.4, r);
        g.fillStyle(vencida ? 0x3fbf6a : abierta ? 0xf5c542 : 0x6a6a7a, 1).fillCircle(p.x, p.y, r);
        g.lineStyle(1.2, 0x1a1c2c, 1).strokeCircle(p.x, p.y, r);
        if (e.jefe) g.fillStyle(0xc0304a, 1).fillCircle(p.x, p.y, r - 3);
      }
      if (vencida && !this.textures.exists('ruta_vencido')) new Texto(this, p.x - 6, p.y - 5, 12, 10, '#ffffff', 'centro', { tam: 7, peso: 600, borde: '#1a1c2c' }).poner('✓');
      if (i === this.sel) g.lineStyle(1.4, n(C.resalte), 1).strokeCircle(p.x, p.y, (e.jefe ? 8 : 6) + 3);
      this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        const wx = ptr.x / 4;
        const wy = ptr.y / 4;
        if (Phaser.Math.Distance.Between(wx, wy, p.x, p.y) < 10) this.elegir(i, lista.length);
      });
    });
    // El jefe espera sobre su estación.
    const jefe = lista[lista.length - 1]!.equipo[0]!;
    const nj = NODOS[NODOS.length - 1]!;
    const vistoJefe = estado.vistas.includes(jefe) || this.modo === 'semanal';
    miniatura(this.add.image(nj.x, nj.y - 20, textura(jefe, vistoJefe ? 'frente' : 'silueta')), jefe, 24, 0.4);

    // Tu criatura en la estación que toca.
    const lider = mios[0];
    if (lider) {
      const desde = NODOS[this.avanzo ? Math.max(0, v - 1) : v]!;
      const marca = this.add.sprite(desde.x, desde.y - 9, textura(lider.especie, 'icono'), 0).setScale(0.5);
      this.time.addEvent({ delay: 300, loop: true, callback: () => marca.setFrame(marca.frame.name === '0' ? 1 : 0) });
      if (this.avanzo && v > 0) {
        const hasta = NODOS[v]!;
        sonido.tocar('sube');
        this.tweens.add({ targets: marca, x: hasta.x, duration: 700, ease: 'Sine.easeInOut', delay: 300 });
        this.tweens.add({ targets: marca, y: { from: desde.y - 9, to: hasta.y - 9 }, duration: 700, ease: 'Sine.easeInOut', delay: 300 });
      }
    }

    this.dibujarPanel(lista, v);
    Entrada.escuchar((a) => {
      if (a === 'izquierda' || a === 'derecha') {
        const sig = Phaser.Math.Clamp(this.sel + (a === 'derecha' ? 1 : -1), 0, lista.length - 1);
        if (sig === this.sel) return;
        sonido.tocar('cursor');
        this.scene.restart({ modo: this.modo, sel: sig });
      } else if (a === 'a') this.elegir(this.sel, lista.length);
      else if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.start('Menu', { submenu: 'combates' });
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private jefeVencido(): boolean {
    const ahora = Date.now();
    return this.modo === 'entrenador' ? entrenadorCobrado(juego.estado, ahora) : semanalCobrado(juego.estado, ahora);
  }

  private elegir(i: number, total: number): void {
    const v = vencidas(juego.estado, this.modo, Date.now());
    if (i !== this.sel) {
      sonido.tocar('cursor');
      return void this.scene.restart({ modo: this.modo, sel: i });
    }
    if (i > v || !equipoDe(juego.estado).length) return void sonido.tocar('negado');
    sonido.tocar('aceptar');
    this.scene.start('Combate', { ia: i === total - 1 ? 'experta' : 'tactica', modo: this.modo, estacion: i });
  }

  private dibujarMapa(colorTipo: number): void {
    const clave = `ruta_${this.modo}`;
    if (this.textures.exists(clave)) {
      this.add.image(0, 0, clave).setOrigin(0, 0).setScale(0.25);
      return;
    }
    // Mapa provisorio por código: pasto (Entrenador) o tierra teñida del tipo de la semana, con arbolitos y agua.
    const g = this.add.graphics();
    const base = this.modo === 'entrenador' ? 0x5aa64a : Phaser.Display.Color.IntegerToColor(colorTipo).darken(35).color;
    g.fillStyle(base, 1).fillRect(0, 0, 240, 160);
    const rnd = new Phaser.Math.RandomDataGenerator([this.modo]);
    g.fillStyle(0x3d86c6, 1).fillEllipse(170, 128, 90, 26);
    g.fillStyle(0x7ab6e6, 0.6).fillEllipse(166, 125, 60, 10);
    for (let i = 0; i < 26; i++) {
      const x = rnd.between(4, 236);
      const y = rnd.between(14, 122);
      if (NODOS.some((p) => Math.abs(p.x - x) < 16 && Math.abs(p.y - y) < 14)) continue;
      g.fillStyle(0x1a1c2c, 0.25).fillEllipse(x, y + 5, 9, 3);
      g.fillStyle(this.modo === 'entrenador' ? 0x2f7a3a : 0x3a2f2a, 1).fillCircle(x, y, 4).fillCircle(x - 3, y + 2, 3).fillCircle(x + 3, y + 2, 3);
    }
  }

  private dibujarPanel(lista: ReturnType<typeof estaciones>, v: number): void {
    const estado = juego.estado;
    const e = lista[this.sel]!;
    const g = this.add.graphics();
    ventana(g, 4, 122, 232, 36);
    const ahora = Date.now();
    const titulo = e.jefe
      ? this.modo === 'entrenador'
        ? t('des.entrenador', { n: entrenadorDelDia(DATOS, ahora).nombre })
        : DATOS.criaturas.get(jefeDeLaSemana(DATOS, ahora))!.nombre
      : t(`ruta.estacion.${this.modo}`, { n: this.sel + 1 });
    new Texto(this, 10, 125, 120, 10, '#257179', 'izq', { tam: 7.6, peso: 600 }).poner(titulo);
    new Texto(this, 10, 135, 120, 10, C.tinta, 'izq', { tam: 6.2 }).poner(t('ruta.nivel', { n: e.nivel }));
    let premio: string;
    if (this.sel < v || (e.jefe && this.jefeVencido())) premio = t('ruta.vencida');
    else if (this.sel > v) premio = t('ruta.bloqueada');
    else if (!e.jefe) premio = t('des.premio', { n: e.monedas });
    else if (this.modo === 'entrenador') {
      const ent = entrenadorDelDia(DATOS, ahora);
      premio = t('des.premioSobre', { n: DATOS.economia.entrenador.monedas, s: DATOS.sobres.sobres.find((s) => s.id === ent.sobre)?.nombre ?? '' });
    } else {
      const pr = DATOS.economia.semanal.premio;
      premio = t('des.premioSobre', { n: pr.monedas ?? 0, s: DATOS.sobres.sobres.find((s) => s.id === pr.sobre)?.nombre ?? '' });
    }
    new Texto(this, 10, 145, 130, 10, this.sel > v ? C.tintaSuave : C.resalte, 'izq', { tam: 6.2, peso: 600 }).poner(premio);
    e.equipo.forEach((id, i) => {
      const x = 152 + i * 28;
      g.fillStyle(0xe8ecf4, 1).fillRoundedRect(x - 13, 126, 26, 28, 3);
      const visto = estado.vistas.includes(id);
      miniatura(this.add.image(x, 140, textura(id, visto ? 'frente' : 'silueta')), id, 22, 0.35);
    });
    new Texto(this, 4, 4, 232, 10, '#ffffff', 'centro', { tam: 6.4, borde: '#1a1c2c' }).poner(t('ruta.ayuda'));
  }
}
