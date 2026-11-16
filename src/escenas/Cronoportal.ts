import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { abandonar, crono, criaFamilia, empezar, era, eraGrieta, grietaDisponible, puedeRevivir, revivir } from '../core/modos/crono';
import { Entrada, type AccionEntrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { animar, crearAnimaciones } from '../ui/animaciones';
import { miniatura, textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { partir, Texto } from '../ui/texto';
import { Puntero } from '../ui/puntero';

type Fila = { tipo: 'era'; n: number } | { tipo: 'grieta'; n: number } | { tipo: 'seguir' } | { tipo: 'abandonar' } | { tipo: 'lab' };

/**
 * Sala del Cronoportal (D231): el portal, las 5 eras (cerradas hasta vencer la anterior), la Grieta del día,
 * la expedición en curso y el Laboratorio del Tiempo, donde los fósiles reviven a las crías prehistóricas.
 */
export class Cronoportal extends Phaser.Scene {
  private sel = 0;
  private lab = false;
  private aviso = '';
  private puntero!: Puntero;

  constructor() {
    super('Cronoportal');
  }

  init(d: { sel?: number; lab?: boolean; aviso?: string }): void {
    this.sel = d?.sel ?? 0;
    this.lab = !!d?.lab;
    this.aviso = d?.aviso ?? '';
  }

  private filas(): Fila[] {
    const cr = crono(juego.estado);
    const f: Fila[] = [];
    if (cr.expedicion) f.push({ tipo: 'seguir' }, { tipo: 'abandonar' });
    for (let i = 1; i <= DATOS.economia.crono.eras.length; i++) f.push({ tipo: 'era', n: i });
    if (grietaDisponible(juego.estado, Date.now()) && !cr.expedicion) f.push({ tipo: 'grieta', n: eraGrieta(juego.estado, Date.now()) });
    f.push({ tipo: 'lab' });
    return f;
  }

  create(): void {
    prepararCamara(this);
    musica.tocar('menu');
    crearAnimaciones(this);
    this.puntero = new Puntero(this);
    if (this.textures.exists('crono_sala')) this.add.image(0, 0, 'crono_sala').setOrigin(0, 0).setScale(0.25);
    else this.add.graphics().fillStyle(0x2a2440, 1).fillRect(0, 0, 240, 160);
    const portal = this.add.sprite(184, 60, 'crono_portal').setScale(1);
    if (this.anims.exists('crono_portal')) portal.play('crono_portal');
    if (this.lab) this.dibujarLab();
    else this.dibujarSala();
    Entrada.escuchar((a) => this.tecla(a));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  // ------------------------------------------------------------ sala

  private dibujarSala(): void {
    const cr = crono(juego.estado);
    const g = this.add.graphics();
    ventana(g, 4, 4, 140, 152);
    new Texto(this, 10, 8, 128, 12, '#257179', 'izq', { tam: 9, peso: 600 }).poner(t('crono.titulo'));
    const filas = this.filas();
    this.sel = Math.min(this.sel, filas.length - 1);
    filas.forEach((f, i) => {
      const y = 24 + i * 13;
      const activa = i === this.sel;
      let texto = '';
      let color: string = C.tinta;
      if (f.tipo === 'era') {
        const abierta = f.n <= cr.eraMax;
        texto = `${f.n}. ${t(`crono.era${f.n}`)}${cr.vencidas.includes(f.n) ? ' ✓' : ''}`;
        if (!abierta) {
          texto = `${f.n}. ${t('crono.cerrada')}`;
          color = C.apagado;
        }
      } else if (f.tipo === 'grieta') {
        texto = t('crono.grieta', { e: t(`crono.era${f.n}`) });
        color = '#8a3fb8';
      } else if (f.tipo === 'seguir') {
        texto = t('crono.seguir', { e: t(`crono.era${cr.expedicion!.era}`) });
        color = '#2f7a48';
      } else if (f.tipo === 'abandonar') texto = t('crono.abandonar');
      else texto = t('crono.lab');
      if (activa) {
        g.fillStyle(0xfde9c8, 1).fillRoundedRect(8, y - 1, 132, 12, 3);
        g.fillStyle(n(C.resalte), 1).fillTriangle(10, y + 2, 10, y + 8, 13, y + 5);
      }
      new Texto(this, 16, y, 124, 11, activa ? C.resalte : color, 'izq', { tam: 7, peso: activa ? 600 : 500 }).poner(texto);
      this.puntero.zona(8, y - 1, 132, 12, () => (i === this.sel ? this.tecla('a') : this.mover(i)));
    });

    // Detalle de lo marcado.
    const f = filas[this.sel]!;
    ventana(g, 148, 96, 88, 60);
    const det = new Texto(this, 152, 99, 80, 56, C.tinta, 'izq', { tam: 6 });
    if (f.tipo === 'era' || f.tipo === 'grieta') {
      const e = era(DATOS, f.n);
      const lineas = [t('crono.niveles', { a: e.nivel[0], b: e.nivel[1] }), ...partir(t(`crono.regla.${e.regla}`), 78, 6)];
      det.poner(lineas.slice(0, 6).join('\n'));
    } else if (f.tipo === 'lab') {
      det.poner(partir(t('crono.labDesc', { a: cr.ambar }), 78, 6).join('\n'));
    } else if (f.tipo === 'seguir' || f.tipo === 'abandonar') {
      const b = cr.expedicion!.botin;
      det.poner(partir(t('crono.botin', { m: b.monedas, f: b.fosiles, a: b.ambar }), 78, 6).join('\n'));
    }
    new Texto(this, 4, 146, 140, 10, this.aviso ? C.resalte : C.tintaSuave, 'centro', { tam: 6 }).poner(this.aviso || t('crono.ayuda'));
  }

  private mover(i: number): void {
    sonido.tocar('cursor');
    this.scene.restart({ sel: i, lab: this.lab });
  }

  private tecla(a: AccionEntrada): void {
    if (this.lab) return this.teclaLab(a);
    const filas = this.filas();
    if (a === 'arriba' || a === 'abajo') return this.mover((this.sel + (a === 'abajo' ? 1 : filas.length - 1)) % filas.length);
    if (a === 'b') {
      sonido.tocar('cancelar');
      return void this.scene.start('Menu', { submenu: 'combates' });
    }
    if (a !== 'a') return;
    const f = filas[this.sel]!;
    const cr = crono(juego.estado);
    if (f.tipo === 'lab') {
      sonido.tocar('aceptar');
      return void this.scene.restart({ lab: true, sel: 0 });
    }
    if (f.tipo === 'seguir') {
      sonido.tocar('aceptar');
      return void this.scene.start('CronoMapa', {});
    }
    if (f.tipo === 'abandonar') {
      abandonar(juego.estado);
      juego.guardar();
      sonido.tocar('cancelar');
      return void this.scene.restart({ sel: 0, aviso: t('crono.abandonado') });
    }
    if (cr.expedicion) {
      sonido.tocar('negado');
      return void this.scene.restart({ sel: this.sel, aviso: t('crono.yaViaje') });
    }
    if (f.n > cr.eraMax || !juego.estado.equipo.length) {
      sonido.tocar('negado');
      return void this.scene.restart({ sel: this.sel, aviso: t(juego.estado.equipo.length ? 'crono.cerradaAviso' : 'crono.sinEquipo') });
    }
    if (!empezar(DATOS, juego.estado, f.n, (Date.now() ^ (Math.random() * 1e9)) >>> 0, f.tipo === 'grieta')) return void sonido.tocar('negado');
    juego.guardar();
    void this.viajar();
  }

  /** Transición de viaje: el portal se abre y la espiral de tiempo llena la pantalla. */
  private async viajar(): Promise<void> {
    Entrada.escuchar(null);
    sonido.tocar('especial');
    this.cameras.main.flash(250, 200, 230, 255);
    await animar(this, 'crono_viaje', 120, 80, { profundidad: 100 });
    this.scene.start('CronoMapa', { llegada: true });
  }

  // ------------------------------------------------------------ laboratorio

  private familias(): string[] {
    return DATOS.economia.crono.eras.map((e) => e.familia);
  }

  private dibujarLab(): void {
    const cr = crono(juego.estado);
    const g = this.add.graphics();
    ventana(g, 4, 4, 232, 152);
    new Texto(this, 10, 8, 220, 12, '#257179', 'izq', { tam: 9, peso: 600 }).poner(t('crono.lab'));
    new Texto(this, 10, 20, 220, 10, C.tintaSuave, 'izq', { tam: 6.2 }).poner(t('crono.labSub', { n: DATOS.economia.crono.fragmentos, a: cr.ambar }));
    if (this.textures.exists('cr_ambar')) this.add.image(224, 24, 'cr_ambar');
    this.familias().forEach((fam, i) => {
      const x = 28 + i * 46;
      const y = 36;
      const activa = i === this.sel;
      g.fillStyle(activa ? 0xfde9c8 : 0xe8ecf4, 1).fillRoundedRect(x - 21, y, 42, 76, 4);
      if (activa) g.lineStyle(1, n(C.resalte), 1).strokeRoundedRect(x - 21, y, 42, 76, 4);
      const cria = criaFamilia(DATOS, fam);
      const tiene = juego.estado.criaturas.some((c) => DATOS.criaturas.get(c.especie)?.familia === fam);
      miniatura(this.add.image(x, y + 20, textura(cria, tiene ? 'frente' : 'silueta')), cria, 30, 0.5);
      if (this.textures.exists(`cr_fosil_${fam}`)) this.add.image(x - 7, y + 44, `cr_fosil_${fam}`);
      new Texto(this, x + 3, y + 39, 22, 10, C.tinta, 'izq', { tam: 6.6, peso: 600 }).poner(`${cr.fosiles[fam] ?? 0}`);
      new Texto(this, x - 21, y + 54, 42, 9, C.tintaSuave, 'centro', { tam: 5.4 }).poner(tiene ? DATOS.criaturas.get(cria)!.nombre : t(`crono.era${i + 1}`));
      const listo = puedeRevivir(DATOS, juego.estado, fam);
      new Texto(this, x - 21, y + 64, 42, 9, tiene ? '#2f7a48' : listo ? C.resalte : C.apagado, 'centro', { tam: 5.4, peso: 600 }).poner(t(tiene ? 'crono.labTiene' : listo ? 'crono.labListo' : 'crono.labFalta'));
      this.puntero.zona(x - 21, y, 42, 76, () => (i === this.sel ? this.teclaLab('a') : (sonido.tocar('cursor'), this.scene.restart({ lab: true, sel: i }))));
    });
    new Texto(this, 10, 118, 220, 24, this.aviso ? C.resalte : C.tinta, 'izq', { tam: 6.4 }).poner(partir(this.aviso || t('crono.labAyuda'), 218, 6.4).join('\n'));
    new Texto(this, 4, 146, 232, 10, C.tintaSuave, 'centro', { tam: 6 }).poner(t('crono.labTeclas'));
  }

  private teclaLab(a: AccionEntrada): void {
    const total = this.familias().length;
    if (a === 'izquierda' || a === 'derecha') {
      sonido.tocar('cursor');
      return void this.scene.restart({ lab: true, sel: (this.sel + (a === 'derecha' ? 1 : total - 1)) % total });
    }
    if (a === 'b') {
      sonido.tocar('cancelar');
      return void this.scene.restart({ lab: false, sel: 0 });
    }
    if (a !== 'a') return;
    const fam = this.familias()[this.sel]!;
    if (!puedeRevivir(DATOS, juego.estado, fam)) {
      sonido.tocar('negado');
      return;
    }
    Entrada.escuchar(null);
    const c = revivir(DATOS, juego.estado, fam)!;
    juego.guardar();
    sonido.tocar('tesoro');
    const x = 28 + this.sel * 46;
    const clave = this.anims.exists(`crono_revivir_${fam}`) ? `crono_revivir_${fam}` : 'crono_revivir';
    void animar(this, clave as 'crono_revivir', x, 58, { profundidad: 50, quedar: 900 }).then(() => {
      this.cameras.main.flash(250, 255, 240, 200);
      sonido.tocar('victoria');
      this.time.delayedCall(900, () => this.scene.restart({ lab: true, sel: this.sel, aviso: t('crono.revivida', { n: DATOS.criaturas.get(c.especie)!.nombre }) }));
    });
  }
}
