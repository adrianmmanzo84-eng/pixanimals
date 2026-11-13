import Phaser from 'phaser';
import type { MinijuegoId } from '../../esquemas/esquemas';
import { DATOS } from '../../core/datos';
import { criaturaDe } from '../../core/estado/juego';
import { terminarMinijuego, type ResultadoMinijuego } from '../../core/minijuegos/minijuegos';
import { Entrada, type AccionEntrada } from '../../entrada';
import { sonido } from '../../audio/sfx';
import { musica } from '../../audio/musica';
import { t } from '../../i18n/i18n';
import { juego } from '../../juego';
import { C, prepararCamara, ventana } from '../../ui/estilo';
import { fondo, type FondoId } from '../../ui/fondos';
import { partir, Texto } from '../../ui/texto';

export interface DatosMinijuego {
  especie: string;
}

/**
 * Lo común a los tres minijuegos: fondo, cabecera con marcador, cuenta regresiva 3-2-1,
 * y al terminar, el premio (Entrenamiento y monedas) y la vuelta al menú de minijuegos.
 * Cada minijuego implementa `empezar`, `paso` (cada cuadro) y `tecla`.
 */
export abstract class MinijuegoBase extends Phaser.Scene {
  protected especie = '';
  protected jugando = false;
  protected marcador!: Texto;
  protected info!: Texto;
  private fin = false;

  protected abstract readonly id: MinijuegoId;
  protected abstract readonly arena: FondoId;
  /** Prepara la partida (se llama antes de la cuenta regresiva). */
  protected abstract preparar(): void;
  /** Arranca el juego al terminar la cuenta. */
  protected abstract empezar(): void;
  /** Cada cuadro mientras se juega (dt en segundos). */
  protected paso(_dt: number): void {}
  /** Una tecla mientras se juega. */
  protected abstract tecla(a: AccionEntrada): void;

  init(d: DatosMinijuego): void {
    this.especie = d?.especie ?? juego.estado.equipo[0] ?? '';
    this.jugando = false;
    this.fin = false;
  }

  create(): void {
    prepararCamara(this);
    musica.tocar('minijuego');
    // El paisaje cubre toda la pantalla (los de combate son más apaisados): se amplía y se centra.
    const img = this.add.image(120, 0, fondo(this, this.arena)).setOrigin(0.5, 0);
    img.setScale(Math.max(240 / img.width, 160 / img.height));
    this.oscurecer();
    const g = this.add.graphics();
    ventana(g, 2, 2, 236, 16, 0.95);
    new Texto(this, 8, 5, 120, 10, C.tinta, 'izq', { peso: 600 }).poner(t(`mj.${this.id}`));
    this.marcador = new Texto(this, 120, 5, 112, 10, C.resalte, 'der', { peso: 600 });
    this.info = new Texto(this, 0, 146, 240, 10, '#ffffff', 'centro', { borde: '#2b3a78' });
    this.preparar();
    Entrada.escuchar((a) => {
      if (this.jugando) this.tecla(a);
      else if (!this.fin && a === 'b') this.salir();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => Entrada.escuchar(null));
    void this.cuenta();
  }

  /** Velo sobre el fondo (los juegos que necesitan contraste lo hacen más oscuro). */
  protected oscurecer(): void {
    this.add.graphics().fillStyle(0x141830, 0.35).fillRect(0, 0, 240, 160);
  }

  override update(_t: number, dtMs: number): void {
    if (this.jugando) this.paso(Math.min(0.05, dtMs / 1000));
  }

  protected esperar(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, () => r()));
  }

  private async cuenta(): Promise<void> {
    const grande = new Texto(this, 0, 62, 240, 30, '#ffffff', 'centro', { tam: 24, peso: 600, borde: '#2b3a78' });
    this.info.poner(t(`mj.${this.id}.ayuda`));
    await this.esperar(900);
    for (const n of ['3', '2', '1']) {
      grande.poner(n);
      sonido.tocar('cuenta');
      await this.esperar(550);
    }
    grande.poner(t('mj.ya'));
    sonido.tocar('ya');
    this.jugando = true;
    this.empezar();
    await this.esperar(500);
    grande.poner('');
  }

  /** Termina la partida: `puntaje` de 0 a 1 y `valor` es el número que ve el jugador. */
  protected async terminar(puntaje: number, valor: number, textoValor: string): Promise<void> {
    if (this.fin) return;
    this.fin = true;
    this.jugando = false;
    this.info.poner('');
    const r = terminarMinijuego(DATOS, juego.estado, this.id, this.especie, puntaje, valor, Date.now());
    juego.guardar();
    musica.tocar(puntaje > 0 ? 'victoria' : 'derrota');
    await this.esperar(500);
    this.mostrarResultado(r, textoValor);
  }

  private mostrarResultado(r: ResultadoMinijuego, textoValor: string): void {
    const nombre = DATOS.criaturas.get(criaturaDe(juego.estado, this.especie)?.especie ?? this.especie)?.nombre ?? '';
    const lineas = [textoValor + (r.record ? `  ·  ${t('mj.record')}` : '')];
    if (!r.conPremio) lineas.push(t('mj.sinPremio', { n: DATOS.economia.minijuegos.conPremioPorDia }));
    else {
      if (r.entrenamiento > 0) lineas.push(t('mj.entrenamiento', { n: r.entrenamiento, c: nombre }));
      else if (r.monedas > 0) lineas.push(t('mj.etapaFinal', { c: nombre }));
      if (r.monedas > 0) lineas.push(t('rec.monedas', { n: `+${r.monedas}` }));
      if (r.lista) lineas.push(t('fin.evoLista', { n: nombre }));
      lineas.push(t('mj.quedan', { n: r.quedan }));
    }
    const todas = lineas.flatMap((l) => partir(l, 160));
    lineas.length = 0;
    lineas.push(...todas);
    const g = this.add.graphics();
    const alto = 30 + lineas.length * 10;
    ventana(g, 36, 40, 168, alto);
    new Texto(this, 36, 45, 168, 12, '#257179', 'centro', { tam: 9.5, peso: 600 }).poner(t('mj.fin'));
    new Texto(this, 36, 58, 168, lineas.length * 10, C.tinta, 'centro').poner(lineas.join('\n'));
    new Texto(this, 36, 60 + lineas.length * 10, 168, 10, C.tintaSuave, 'centro').poner(t('mj.otra'));
    Entrada.escuchar((a) => {
      if (a === 'a') {
        sonido.tocar('aceptar');
        this.scene.restart({ especie: this.especie });
      } else if (a === 'b') this.salir();
    });
  }

  protected salir(): void {
    sonido.tocar('cancelar');
    this.scene.start('Minijuegos', { juego: this.id, especie: this.especie });
  }
}
