import { ajustes } from '../ajustes';
/**
 * Efectos de sonido sintetizados con Web Audio (ondas cuadradas, triangulares y ruido).
 * No hay ningún archivo de audio: cada efecto es una lista de notas.
 */
type Nota = { onda: OscillatorType | 'ruido'; f: number; f2?: number; dur: number; vol?: number; t?: number };

const EFECTOS: Record<string, Nota[]> = {
  // Minijuegos: las 4 notas de Eco (do, mi, sol, do agudo), atrapar, fallar y la cuenta regresiva.
  // Cada flecha, una nota con cuerpo (triangular + cuadrada suave) para que se oiga sobre la música.
  ...Object.fromEntries(
    [523, 659, 784, 1047].map((f, i) => [`eco${i}`, [{ onda: 'triangle' as const, f, dur: 0.26, vol: 0.5 }, { onda: 'square' as const, f, dur: 0.12, vol: 0.14 }]]),
  ),
  // Salto de la criatura, chispa de un acierto perfecto, y el cierre de un minijuego ganado o perdido.
  salto: [{ onda: 'square', f: 320, f2: 960, dur: 0.12, vol: 0.22 }],
  chispa: [{ onda: 'square', f: 1568, dur: 0.05, vol: 0.18 }, { onda: 'square', f: 2093, dur: 0.09, vol: 0.18, t: 0.05 }],
  festejo: [
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ onda: 'square' as const, f: [784, 988, 1175, 1568, 1175, 1568, 2093][i]!, dur: i === 6 ? 0.32 : 0.08, t: i * 0.08, vol: 0.24 })),
    { onda: 'ruido' as const, f: 0, dur: 0.25, vol: 0.12, t: 0.1 },
    { onda: 'ruido' as const, f: 0, dur: 0.25, vol: 0.12, t: 0.42 },
  ],
  pierde: [0, 1, 2].map((i) => ({ onda: 'square' as const, f: [330, 294, 220][i]!, f2: i === 2 ? 150 : undefined, dur: i === 2 ? 0.45 : 0.16, t: i * 0.18, vol: 0.22 })),
  // Interfaz y combate (se habían perdido en la v0.15.1 por un error al editar; restaurados en la v0.25.0).
  atrapa: [{ onda: 'square', f: 880, f2: 1320, dur: 0.06, vol: 0.2 }],
  cuenta: [{ onda: 'square', f: 440, dur: 0.08, vol: 0.25 }],
  ya: [{ onda: 'square', f: 880, dur: 0.16, vol: 0.3 }],
  cursor: [{ onda: 'square', f: 880, dur: 0.04, vol: 0.25 }],
  tic: [{ onda: 'square', f: 1400, dur: 0.018, vol: 0.14 }],
  aceptar: [{ onda: 'square', f: 660, dur: 0.05 }, { onda: 'square', f: 990, dur: 0.07, t: 0.05 }],
  cancelar: [{ onda: 'square', f: 440, f2: 300, dur: 0.09 }],
  negado: [{ onda: 'square', f: 160, dur: 0.12 }],
  golpe: [{ onda: 'ruido', f: 0, dur: 0.12, vol: 0.5 }, { onda: 'square', f: 220, f2: 90, dur: 0.12 }],
  golpe_fuerte: [{ onda: 'ruido', f: 0, dur: 0.2, vol: 0.7 }, { onda: 'square', f: 330, f2: 60, dur: 0.22 }],
  golpe_debil: [{ onda: 'ruido', f: 0, dur: 0.07, vol: 0.3 }, { onda: 'triangle', f: 180, f2: 120, dur: 0.08 }],
  especial: [{ onda: 'square', f: 300, f2: 1200, dur: 0.18, vol: 0.3 }],
  final: [{ onda: 'square', f: 200, f2: 1600, dur: 0.35, vol: 0.35 }, { onda: 'ruido', f: 0, dur: 0.3, vol: 0.5, t: 0.3 }],
  sube: [{ onda: 'square', f: 440, dur: 0.06 }, { onda: 'square', f: 554, dur: 0.06, t: 0.06 }, { onda: 'square', f: 659, dur: 0.1, t: 0.12 }],
  baja: [{ onda: 'square', f: 659, dur: 0.06 }, { onda: 'square', f: 554, dur: 0.06, t: 0.06 }, { onda: 'square', f: 440, dur: 0.1, t: 0.12 }],
  cura: [{ onda: 'triangle', f: 523, dur: 0.08 }, { onda: 'triangle', f: 784, dur: 0.08, t: 0.08 }, { onda: 'triangle', f: 1047, dur: 0.14, t: 0.16 }],
  estado: [{ onda: 'square', f: 500, f2: 250, dur: 0.1 }, { onda: 'square', f: 500, f2: 250, dur: 0.1, t: 0.12 }],
  escudo: [{ onda: 'triangle', f: 700, f2: 1000, dur: 0.15 }],
  giro: [{ onda: 'ruido', f: 0, dur: 0.22, vol: 0.22 }, { onda: 'triangle', f: 260, f2: 620, dur: 0.2, vol: 0.12 }],
  falla: [{ onda: 'triangle', f: 400, f2: 200, dur: 0.15, vol: 0.3 }],
  // Mina Pixel: golpe de pico, bloque roto, botín, daño, roca que cae y explosión.
  pico: [{ onda: 'ruido', f: 0, dur: 0.05, vol: 0.35 }, { onda: 'square', f: 180, f2: 120, dur: 0.05, vol: 0.18 }],
  rompe: [{ onda: 'ruido', f: 0, dur: 0.12, vol: 0.45 }, { onda: 'triangle', f: 300, f2: 90, dur: 0.12, vol: 0.2 }],
  moneda: [{ onda: 'square', f: 1319, dur: 0.05, vol: 0.2 }, { onda: 'square', f: 1760, dur: 0.12, vol: 0.2, t: 0.05 }],
  gema: [{ onda: 'triangle', f: 1047, dur: 0.06, vol: 0.3 }, { onda: 'triangle', f: 1568, dur: 0.06, vol: 0.3, t: 0.06 }, { onda: 'triangle', f: 2093, dur: 0.14, vol: 0.3, t: 0.12 }],
  baya: [{ onda: 'triangle', f: 523, f2: 1047, dur: 0.16, vol: 0.3 }],
  dano: [{ onda: 'ruido', f: 0, dur: 0.15, vol: 0.5 }, { onda: 'square', f: 260, f2: 110, dur: 0.2, vol: 0.22 }],
  roca: [{ onda: 'ruido', f: 0, dur: 0.08, vol: 0.25 }],
  explota: [{ onda: 'ruido', f: 0, dur: 0.45, vol: 0.8 }, { onda: 'square', f: 140, f2: 40, dur: 0.4, vol: 0.3 }],
  zona: [{ onda: 'triangle', f: 392, dur: 0.12, vol: 0.3 }, { onda: 'triangle', f: 523, dur: 0.12, vol: 0.3, t: 0.12 }, { onda: 'triangle', f: 784, dur: 0.3, vol: 0.3, t: 0.24 }],
  // Al debilitarse: «puf», una nota que baja (se deshace en luz) y tres que suben (vuelve a su carta).
  debilitado: [
    { onda: 'ruido', f: 0, dur: 0.1, vol: 0.4 },
    { onda: 'square', f: 520, f2: 150, dur: 0.38, vol: 0.22, t: 0.06 },
    { onda: 'triangle', f: 660, dur: 0.09, vol: 0.28, t: 0.48 },
    { onda: 'triangle', f: 880, dur: 0.09, vol: 0.28, t: 0.57 },
    { onda: 'triangle', f: 1320, dur: 0.2, vol: 0.28, t: 0.66 },
  ],
  // Sobres: cada carta que se da vuelta suena distinto según lo que sea.
  revela: [{ onda: 'triangle', f: 660, f2: 1320, dur: 0.14, vol: 0.3 }, { onda: 'square', f: 1320, dur: 0.08, vol: 0.16, t: 0.1 }],
  objeto: [{ onda: 'square', f: 988, dur: 0.05, vol: 0.24 }, { onda: 'square', f: 1319, dur: 0.14, vol: 0.24, t: 0.05 }],
  tesoro: [
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ onda: 'square' as const, f: [523, 659, 784, 1047, 1319, 1568, 2093, 1568][i]!, dur: i === 7 ? 0.3 : 0.07, t: i * 0.07, vol: 0.26 })),
    { onda: 'ruido' as const, f: 0, dur: 0.4, vol: 0.1, t: 0.2 },
  ],
  victoria: [0, 1, 2, 3, 4, 5].map((i) => ({ onda: 'square' as const, f: [523, 659, 784, 1047, 784, 1047][i]!, dur: i === 5 ? 0.3 : 0.1, t: i * 0.1 })),
  derrota: [0, 1, 2, 3].map((i) => ({ onda: 'triangle' as const, f: [392, 330, 262, 196][i]!, dur: i === 3 ? 0.4 : 0.16, t: i * 0.16 })),
};

class Sonido {
  ctx: AudioContext | null = null;
  private ruido: AudioBuffer | null = null;
  silenciado = false;
  volumen = 0.5;

  constructor() {
    try {
      this.silenciado = localStorage.getItem('silencio') === '1';
    } catch {
      /* sin almacenamiento: se queda con sonido */
    }
  }

  /** Avisa cuando el audio quedó habilitado (tras el primer gesto). */
  alActivar: (() => void) | null = null;

  /** Debe llamarse dentro de un gesto del usuario. */
  activar(): void {
    try {
      this.ctx ??= new AudioContext();
      void this.ctx.resume();
      this.alActivar?.();
    } catch {
      this.ctx = null;
    }
  }

  /** Avisa al cambiar el silencio (la música lo escucha). */
  alSilenciar: ((silenciado: boolean) => void) | null = null;

  alternar(): boolean {
    this.silenciado = !this.silenciado;
    this.alSilenciar?.(this.silenciado);
    try {
      localStorage.setItem('silencio', this.silenciado ? '1' : '0');
    } catch {
      /* nada */
    }
    return this.silenciado;
  }

  /**
   * El «grito» de una criatura: tres notas que suben y bajan, con un tono propio de cada especie
   * (sale de su id), así cada pixanimal suena un poco distinto al festejar.
   */
  grito(id: string, contento = true): void {
    let h = 7;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const base = 330 + (h % 9) * 55;
    const onda: OscillatorType = h % 2 ? 'square' : 'triangle';
    const notas: Nota[] = contento
      ? [
          { onda, f: base, f2: base * 1.5, dur: 0.08, vol: 0.26 },
          { onda, f: base * 1.5, f2: base * 2, dur: 0.08, vol: 0.26, t: 0.09 },
          { onda, f: base * 2, f2: base * 1.6, dur: 0.16, vol: 0.26, t: 0.18 },
        ]
      : [{ onda, f: base * 1.2, f2: base * 0.6, dur: 0.35, vol: 0.24 }];
    this.reproducir(notas);
  }

  tocar(nombre: keyof typeof EFECTOS | string): void {
    const notas = EFECTOS[nombre];
    if (notas) this.reproducir(notas);
  }

  private reproducir(notas: Nota[]): void {
    const ctx = this.ctx;
    if (!ctx || this.silenciado || !notas || ajustes.efectos === 0) return;
    for (const n of notas) {
      const t0 = ctx.currentTime + (n.t ?? 0);
      const gan = ctx.createGain();
      const vol = (n.vol ?? 0.3) * this.volumen * (ajustes.efectos / 3);
      gan.gain.setValueAtTime(vol, t0);
      gan.gain.exponentialRampToValueAtTime(0.001, t0 + n.dur);
      gan.connect(ctx.destination);
      if (n.onda === 'ruido') {
        if (!this.ruido) {
          this.ruido = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
          const d = this.ruido.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        const src = ctx.createBufferSource();
        src.buffer = this.ruido;
        src.connect(gan);
        src.start(t0);
        src.stop(t0 + n.dur);
      } else {
        const osc = ctx.createOscillator();
        osc.type = n.onda;
        osc.frequency.setValueAtTime(n.f, t0);
        if (n.f2) osc.frequency.exponentialRampToValueAtTime(n.f2, t0 + n.dur);
        osc.connect(gan);
        osc.start(t0);
        osc.stop(t0 + n.dur);
      }
    }
  }
}

export const sonido = new Sonido();
