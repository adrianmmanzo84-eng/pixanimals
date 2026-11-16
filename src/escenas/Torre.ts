import Phaser from 'phaser';
import { DATOS } from '../core/datos';
import { equipoDe } from '../core/estado/juego';
import { datosPiso, premioPiso } from '../core/modos/torre';
import { Entrada } from '../entrada';
import { sonido } from '../audio/sfx';
import { musica } from '../audio/musica';
import { t } from '../i18n/i18n';
import { juego } from '../juego';
import { miniatura, textura } from '../ui/criaturas';
import { C, n, prepararCamara, ventana } from '../ui/estilo';
import { Texto } from '../ui/texto';

/** Pisos por tramo de la torre que se ve (el último es el jefe de la cima). */
const TRAMO = 10;
const X0 = 15;
const ANCHO = 74;
const ALTO_PISO = 11;
const BASE_Y = 160;

/**
 * Torre de Desafíos como en los juegos de pelea (D220): una torre de 10 pisos con el jefe en la cima.
 * Tu criatura está en el piso que toca; al ganar vuelve aquí y sube. Al costado, el rival del piso y su premio.
 * Arte opcional: torre_fondo (960×640), torre_piso y torre_piso_jefe (296×44, se repite por piso), torre_cima (328×164).
 */
export class Torre extends Phaser.Scene {
  private subio = false;

  constructor() {
    super('Torre');
  }

  init(d: { subio?: boolean }): void {
    this.subio = !!d?.subio;
  }

  private yPiso(piso: number, desde: number): number {
    return BASE_Y - (piso - desde + 1) * ALTO_PISO;
  }

  create(): void {
    prepararCamara(this);
    musica.tocar('menu');
    const estado = juego.estado;
    const mios = equipoDe(estado);
    const piso = estado.torre.piso;
    // Si recién subió y venció la cima, se muestra primero el tramo anterior y después se pasa al nuevo.
    const anterior = this.subio ? piso - 1 : piso;
    const desde = Math.floor((anterior - 1) / TRAMO) * TRAMO + 1;
    const hasta = desde + TRAMO - 1;

    this.dibujarFondo();
    const g = this.add.graphics();
    this.dibujarTorre(g, desde, hasta, piso);

    // Jefe de la cima: su dibujo sobre la torre (el Guardián, si ese piso tiene uno).
    const cima = datosPiso(DATOS, hasta, Math.max(1, mios.length));
    const jefeCima = cima.especies[0]!;
    const yCima = this.yPiso(hasta, desde) - 2;
    const visto = estado.vistas.includes(jefeCima) || !!cima.guardian;
    // Sobre la muralla de la cima (el arte deja libre el centro de arriba).
    const yJefe = this.textures.exists('torre_cima') ? yCima - 30 : yCima - 12;
    // Sombra en la muralla para que el jefe se vea parado arriba y no hundido en la cima.
    this.add.graphics().fillStyle(0x1a1c2c, 0.35).fillEllipse(X0 + ANCHO / 2, yJefe + 11, 22, 4);
    miniatura(this.add.image(X0 + ANCHO / 2, yJefe, textura(jefeCima, visto ? 'frente' : 'silueta')), jefeCima, 24, 0.45);
    new Texto(this, X0 - 6, Math.max(0, yJefe - 22), ANCHO + 12, 9, '#ffd76a', 'centro', { tam: 6, peso: 600, borde: '#1a1c2c' }).poner(cima.guardian ? t('torre.guardian') : t('torre.cima', { n: hasta }));

    // Tu criatura en su piso.
    const lider = mios[0];
    let marca: Phaser.GameObjects.Sprite | null = null;
    if (lider) {
      const pisoMarca = Math.min(anterior, hasta);
      marca = this.add.sprite(X0 - 8, this.yPiso(pisoMarca, desde) + ALTO_PISO - 6, textura(lider.especie, 'icono'), 0).setScale(0.5);
      this.time.addEvent({ delay: 300, loop: true, callback: () => marca?.setFrame(marca.frame.name === '0' ? 1 : 0) });
    }

    this.dibujarPanel(piso, mios.length);

    if (this.subio && marca) void this.animarSubida(marca, anterior, piso, desde, hasta);

    Entrada.escuchar((a) => {
      if (a === 'a') {
        if (!mios.length) return sonido.tocar('negado');
        sonido.tocar('aceptar');
        this.scene.start('Combate', { ia: datosPiso(DATOS, piso, mios.length).ia, modo: 'torre', piso });
      } else if (a === 'b') {
        sonido.tocar('cancelar');
        this.scene.start('Menu', { submenu: 'combates' });
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
  }

  private dibujarFondo(): void {
    if (this.textures.exists('torre_fondo')) {
      this.add.image(0, 0, 'torre_fondo').setOrigin(0, 0).setScale(0.25);
      return;
    }
    // Cielo de atardecer con estrellas y montañas lejanas (provisorio, por código).
    const g = this.add.graphics();
    const pasos = 16;
    for (let i = 0; i < pasos; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(0x1b1f45), Phaser.Display.Color.ValueToColor(0xd9775a), pasos, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).fillRect(0, (160 * i) / pasos, 240, 160 / pasos + 1);
    }
    const rnd = new Phaser.Math.RandomDataGenerator(['torre']);
    for (let i = 0; i < 40; i++) g.fillStyle(0xffffff, rnd.realInRange(0.3, 0.9)).fillRect(rnd.between(0, 240), rnd.between(0, 70), 1, 1);
    g.fillStyle(0x2a2440, 1).fillTriangle(-20, 160, 50, 110, 120, 160).fillTriangle(60, 160, 150, 100, 240, 160).fillTriangle(160, 160, 230, 118, 280, 160);
    g.fillStyle(0x3b5a3a, 1).fillRect(0, 150, 240, 10);
  }

  private dibujarTorre(g: Phaser.GameObjects.Graphics, desde: number, hasta: number, piso: number): void {
    const estado = juego.estado;
    const arte = this.textures.exists('torre_piso');
    for (let p = desde; p <= hasta; p++) {
      const y = this.yPiso(p, desde);
      const datos = datosPiso(DATOS, p, 1);
      const vencido = p <= estado.torre.mejor;
      const actual = p === piso;
      if (arte) {
        this.add.image(X0, y, datos.jefe && this.textures.exists('torre_piso_jefe') ? 'torre_piso_jefe' : 'torre_piso').setOrigin(0, 0).setDisplaySize(ANCHO, ALTO_PISO);
      } else {
        // Bloque de piedra con dos ventanas.
        g.fillStyle(p % 2 ? 0x8a8296 : 0x7a7286, 1).fillRect(X0, y, ANCHO, ALTO_PISO);
        g.fillStyle(0x5d566b, 1).fillRect(X0, y + ALTO_PISO - 1, ANCHO, 1);
        g.fillStyle(0x5d566b, 1).fillRect(X0 + 24, y, 1, ALTO_PISO - 1).fillRect(X0 + 50, y, 1, ALTO_PISO - 1);
      }
      if (!arte) {
        const luz = vencido ? 0xffd76a : actual ? 0xfff4c0 : 0x2a2838;
        g.fillStyle(luz, 1).fillRect(X0 + 8, y + 3, 5, 5).fillRect(X0 + ANCHO - 13, y + 3, 5, 5);
      }
      if (datos.jefe && !arte) g.fillStyle(0xc0304a, 1).fillRect(X0 + ANCHO, y + 1, 6, 5).fillTriangle(X0 + ANCHO + 6, y + 1, X0 + ANCHO + 6, y + 6, X0 + ANCHO + 9, y + 3.5);
      if (actual) g.lineStyle(1, n(C.resalte), 1).strokeRect(X0 - 0.5, y - 0.5, ANCHO + 1, ALTO_PISO);
      if (arte) new Texto(this, X0 + 26, y + 1, 22, 9, vencido ? '#ffd76a' : '#ffffff', 'centro', { tam: 6, peso: 600, borde: '#1a1c2c' }).poner(vencido ? `${p}✓` : String(p));
      else new Texto(this, X0 + 26, y + 1, 22, 9, vencido || actual ? '#1a1c2c' : '#e8e4f0', 'centro', { tam: 6, peso: 600 }).poner(String(p));
    }
    // Cima: almenas y bandera.
    const yTop = this.yPiso(hasta, desde);
    if (this.textures.exists('torre_cima')) {
      this.add.image(X0 + ANCHO / 2, yTop, 'torre_cima').setOrigin(0.5, 1).setDisplaySize(ANCHO + 8, (ANCHO + 8) / 2);
    } else {
      g.fillStyle(0x6a6276, 1);
      for (let i = 0; i < 6; i++) g.fillRect(X0 + i * 14, yTop - 4, 8, 4);
    }
    // Base de la torre (con arte, la torre apoya en el borde de abajo).
    if (!arte) g.fillStyle(0x4a4456, 1).fillRect(X0 - 4, BASE_Y - 4, ANCHO + 8, 4);
  }

  private dibujarPanel(piso: number, tam: number): void {
    const estado = juego.estado;
    const p = datosPiso(DATOS, piso, Math.max(1, tam));
    const g = this.add.graphics();
    ventana(g, 110, 8, 124, 144);
    new Texto(this, 116, 13, 112, 12, '#257179', 'izq', { tam: 7.4, peso: 600 }).poner(t(p.guardian ? 'des.torreGuardian' : p.jefe ? 'des.torreJefe' : 'des.torre', { n: piso }));
    new Texto(this, 116, 26, 112, 10, C.tintaSuave, 'izq', { tam: 6.6 }).poner(t('des.mejor', { n: estado.torre.mejor }));
    p.especies.forEach((id, i) => {
      const x = 132 + (i % 3) * 38;
      g.fillStyle(0xe8ecf4, 1).fillRoundedRect(x - 17, 38, 34, 38, 3);
      const visto = estado.vistas.includes(id);
      miniatura(this.add.image(x, 51, textura(id, visto ? 'frente' : 'silueta')), id, 24, 0.45);
      new Texto(this, x - 17, 66.5, 34, 9, C.tinta, 'centro', { tam: 5.4 }).poner(visto ? DATOS.criaturas.get(id)!.nombre : '???');
    });
    new Texto(this, 116, 82, 112, 10, C.tinta, 'izq', { tam: 6.6 }).poner(t('des.nivel', { n: p.nivel, ia: t(`ia.${p.ia}`) }));
    const pr = premioPiso(DATOS, piso);
    const sobre = pr.sobre ? DATOS.sobres.sobres.find((s) => s.id === pr.sobre)?.nombre ?? pr.sobre : '';
    const premio = piso > estado.torre.mejor ? (pr.sobre ? t('des.premioSobre', { n: pr.monedas, s: sobre }) : t('des.premio', { n: pr.monedas })) : t('des.sinPremio');
    new Texto(this, 116, 94, 112, 20, C.resalte, 'izq', { tam: 6.6, peso: 600 }).poner(premio);
    new Texto(this, 116, 136, 112, 10, C.tintaSuave, 'centro', { tam: 6.4 }).poner(t('torre.ayuda'));
  }

  /** La criatura sube un piso dando saltitos; si venció la cima, el tramo baja y aparece el siguiente. */
  private async animarSubida(marca: Phaser.GameObjects.Sprite, de: number, a: number, desde: number, hasta: number): Promise<void> {
    await new Promise<void>((r) => this.time.delayedCall(350, () => r()));
    sonido.tocar('sube');
    const yDestino = a > hasta ? this.yPiso(hasta, desde) - 30 : this.yPiso(a, desde) + ALTO_PISO - 6;
    await new Promise<void>((r) => this.tweens.add({ targets: marca, y: yDestino, duration: 520, ease: 'Back.easeOut', onComplete: () => r() }));
    if (a > hasta) {
      // Cima vencida: cartel y el tramo nuevo.
      sonido.tocar('victoria');
      const txt = new Texto(this, 0, 60, 240, 14, '#ffd76a', 'centro', { tam: 10, peso: 600, borde: '#1a1c2c' }).poner(t('torre.tramo', { n: hasta }));
      this.tweens.add({ targets: txt.imagen, alpha: { from: 0, to: 1 }, duration: 300 });
      await new Promise<void>((r) => this.time.delayedCall(1400, () => r()));
      this.scene.restart({ subio: false });
    }
    void de;
  }
}
