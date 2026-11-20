import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { equipoDe } from '../core/estado/juego';
import { dificultadZona, zonaAbierta, ZONAS } from '../core/modos/practica';
import { Entrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { cargarArteHistoria, suavizarArteHistoria } from '../ui/arteHistoria';
import { C, prepararCamara, ventana } from '../ui/estilo';
import { Puntero } from '../ui/puntero';
import { Texto } from '../ui/texto';
import { claveFondoRegion } from './HistoriaRegion';

const COLOR_DIF = { facil: '#2f7a48', pareja: '#9a6b00', dificil: '#b03a3a' } as const;

/**
 * Zonas de práctica (D270): rivales salvajes de niveles fijos para subir de nivel peleando. ▲ ▼ eligen la zona,
 * A pelea contra salvajes al azar de esa zona (se puede repetir sin límite), B vuelve. Sin carta premio.
 */
export class Practica extends Phaser.Scene {
  private sel = 0;

  constructor() {
    super('Practica');
  }

  init(d: { zona?: number }): void {
    this.sel = d?.zona ?? 0;
  }

  preload(): void {
    cargarArteHistoria(this);
  }

  create(): void {
    prepararCamara(this);
    suavizarArteHistoria(this);
    musica.tocar('menu');
    const estado = juego.estado;
    const mios = equipoDe(estado);
    const medio = mios.length ? Math.round(mios.reduce((s, c) => s + c.nivel, 0) / mios.length) : 1;
    const zona = ZONAS[this.sel]!;

    // Paisaje de la zona elegida (el de la pradera se pinta por código, como en el combate).
    const clave = claveFondoRegion(this, zona.fondo);
    this.add.image(0, 0, clave).setOrigin(0, 0).setScale(240 / this.textures.get(clave).getSourceImage().width);
    const g = this.add.graphics();
    g.fillStyle(0x141830, 0.35).fillRect(0, 0, 240, 160);
    new Texto(this, 0, 3, 240, 12, '#ffffff', 'centro', { tam: 9, peso: 600, borde: '#2b3a78' }).poner(t('practica.titulo'));
    new Texto(this, 0, 14, 240, 9, '#ffffff', 'centro', { tam: 6, borde: '#2b3a78' }).poner(t('practica.tuNivel', { n: medio }));

    ventana(g, 8, 25, 224, ZONAS.length * 11 + 6);
    const puntero = new Puntero(this);
    ZONAS.forEach((z, i) => {
      const y = 28 + i * 11;
      const abierta = zonaAbierta(DATOS, estado, i);
      const elegida = i === this.sel;
      const color = elegida ? C.resalte : abierta ? C.tinta : '#9aa0b4';
      if (elegida) g.fillStyle(0xffffff, 0.45).fillRoundedRect(11, y - 0.5, 218, 10.5, 2);
      new Texto(this, 18, y, 100, 10, color, 'izq', elegida ? { peso: 600 } : {}).poner(t(z.id === 'pradera' ? 'practica.pradera' : `hist.region.${z.id}`));
      new Texto(this, 108, y, 48, 10, color, 'izq').poner(t('practica.nv', { a: z.nivel[0], b: z.nivel[1] }));
      if (abierta) {
        const dif = dificultadZona(z, medio);
        new Texto(this, 160, y, 66, 10, COLOR_DIF[dif], 'der', { peso: 600 }).poner(t(`practica.${dif}`));
      } else {
        // Candado: la zona se abre al llegar a su región de la historia.
        g.fillStyle(0x6a6f80, 1).fillRoundedRect(218, y + 3, 6, 4.4, 0.8);
        g.lineStyle(1, 0x6a6f80, 1).strokeCircle(221, y + 2.6, 1.8);
      }
      puntero.zona(11, y - 0.5, 218, 10.5, () => {
        if (this.sel !== i) this.scene.restart({ zona: i });
        else this.entrar();
      });
    });

    // Detalle de la zona elegida.
    ventana(g, 8, 112, 224, 40);
    const abierta = zonaAbierta(DATOS, estado, this.sel);
    const info = zona.tipo ? t('practica.info', { t: DATOS.tipos.get(zona.tipo)!.nombre, a: zona.nivel[0], b: zona.nivel[1] }) : t('practica.infoTodos', { a: zona.nivel[0], b: zona.nivel[1] });
    new Texto(this, 14, 116, 212, 10, C.tinta, 'izq', { peso: 600 }).poner(info);
    new Texto(this, 14, 127, 212, 10, C.tintaSuave, 'izq', { tam: 6.4 }).poner(
      abierta ? t('practica.premio', { m: zona.monedas }) : t('practica.cerrada', { r: this.regionDe() }),
    );
    new Texto(this, 14, 140, 212, 10, C.tintaSuave, 'izq', { tam: 6.4 }).poner(t('practica.ayuda'));

    Entrada.escuchar((a) => {
      if (a === 'arriba' || a === 'abajo') {
        const paso = a === 'abajo' ? 1 : ZONAS.length - 1;
        sonido.tocar('cursor');
        this.scene.restart({ zona: (this.sel + paso) % ZONAS.length });
      } else if (a === 'a') this.entrar();
      else if (a === 'b') {
        sonido.tocar('cancelar');
        Entrada.escuchar(null);
        this.scene.start('Menu', { submenu: 'combates' });
      }
    });
  }

  /** Nombre de la región de la historia que abre la zona elegida. */
  private regionDe(): string {
    const z = ZONAS[this.sel]!;
    const r = z.region === null ? null : DATOS.historia.regiones[z.region];
    return r ? t(`hist.region.${r.id}`) : '';
  }

  private entrar(): void {
    if (!equipoDe(juego.estado).length) return void sonido.tocar('negado');
    if (!zonaAbierta(DATOS, juego.estado, this.sel)) return void sonido.tocar('negado');
    sonido.tocar('aceptar');
    Entrada.escuchar(null);
    this.scene.start('Combate', { ia: ZONAS[this.sel]!.ia, modo: 'practica', zonaPractica: this.sel });
  }
}
