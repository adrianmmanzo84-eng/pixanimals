import { ajustes } from '../ajustes';
/**
 * Efectos de sonido sintetizados con Web Audio (ondas cuadradas, triangulares y ruido).
 * No hay ningún archivo de audio: cada efecto es una lista de notas.
 */
type Nota = { onda: OscillatorType | 'ruido'; f: number; f2?: number; dur: number; vol?: number; t?: number };

const EFECTOS: Record<string, Nota[]> = {
  // Minijuegos: las 4 notas de Eco (do, mi, sol, do agudo), atrapar, fallar y la cuenta regresiva.
  eco0: [{ onda: 'triangle', f: 523, dur: 0.22, vol: 0.35 }],
  eco1: [{ onda: 'triangle', f: 659, dur: 0.22, vol: 0.35 }],
  eco2: [{ onda: 'triangle', f: 784, dur: 0.22, vol: 0.35 }],
  eco3: [{ onda: 'triangle', f: 1047, dur: 0.22, vol: 0.35 }],
  atrapa: [{ onda: 'square', f: 880, f2: 1320, dur: 0.06, vol: 0.2 }],
  cuenta: [{ onda: 'square', f: 440, dur: 0.08, vol: 0.25 }],
  ya: [{ onda: 'square', f: 880, dur: 0.16, vol: 0.3 }],
  cursor: [{ onda: 'square', f: 880, dur: 0.04, vol: 0.25 }],
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
  falla: [{ onda: 'triangle', f: 400, f2: 200, dur: 0.15, vol: 0.3 }],
  debilitado: [{ onda: 'square', f: 400, f2: 60, dur: 0.5 }],
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

  tocar(nombre: keyof typeof EFECTOS | string): void {
    const ctx = this.ctx;
    const notas = EFECTOS[nombre];
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
