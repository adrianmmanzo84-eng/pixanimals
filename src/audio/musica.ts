import { ajustes, alCambiarAjustes } from '../ajustes';
import { CANCIONES, type Cancion } from './canciones';
import { sonido } from './sfx';

/**
 * Secuenciador de música: lee las canciones (datos) y programa notas en Web Audio con un poco de anticipación.
 * Comparte el AudioContext de los efectos; su volumen va aparte (ajustes.musica) y respeta el silencio general.
 */

type Canal = 'p1' | 'p2' | 'tri' | 'ruido';
interface Evento {
  paso: number;
  pasos: number;
  /** Frecuencia en Hz, o la percusión ('k', 's', 'h'). */
  nota: number | string;
}

const SEMITONO: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function frecuencia(nombre: string): number {
  const m = /^([A-G])(#?)(\d)$/.exec(nombre);
  if (!m) throw new Error(`Nota inválida: ${nombre}`);
  const semis = SEMITONO[m[1]!]! + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (semis / 12);
}

/** Convierte un canal escrito en eventos. Devuelve también el largo total en pasos. */
export function leerCanal(texto: string, ruido = false): { eventos: Evento[]; largo: number } {
  const eventos: Evento[] = [];
  let paso = 0;
  for (const tok of texto.split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const [nombre, n] = tok.split(':');
    const pasos = Number(n ?? 1);
    if (nombre !== '-') eventos.push({ paso, pasos, nota: ruido ? nombre! : frecuencia(nombre!) });
    paso += pasos;
  }
  return { eventos, largo: paso };
}

const VOLUMEN: Record<Canal, number> = { p1: 0.09, p2: 0.04, tri: 0.2, ruido: 0.12 };

class Musica {
  private actual: string | null = null;
  private pendiente: string | null = null;
  private salida: GainNode | null = null;
  private ruido: AudioBuffer | null = null;
  private reloj: ReturnType<typeof setInterval> | null = null;
  private pistas: { canal: Canal; eventos: Evento[] }[] = [];
  private largo = 0;
  private cancion: Cancion | null = null;
  private pasoSig = 0;
  private tiempoSig = 0;
  private nodos = new Set<AudioScheduledSourceNode>();

  constructor() {
    alCambiarAjustes(() => this.ajustarVolumen());
    sonido.alSilenciar = () => this.ajustarVolumen();
    sonido.alActivar = () => {
      if (this.pendiente && !this.reloj) this.empezar(this.pendiente);
    };
  }

  /** Toca una canción (si ya suena, no la reinicia). Antes del primer gesto, queda pendiente. */
  tocar(id: string): void {
    if (!CANCIONES[id]) return;
    if (this.actual === id && this.reloj) return;
    this.pendiente = id;
    if (sonido.ctx?.state === 'running') this.empezar(id);
  }

  parar(): void {
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = null;
    this.actual = null;
    for (const n of this.nodos) {
      try {
        n.stop();
      } catch {
        /* ya terminó */
      }
    }
    this.nodos.clear();
  }

  private volumen(): number {
    return sonido.silenciado ? 0 : (ajustes.musica / 3) * 0.7;
  }

  private ajustarVolumen(): void {
    const ctx = sonido.ctx;
    if (ctx && this.salida) this.salida.gain.setTargetAtTime(this.volumen(), ctx.currentTime, 0.05);
  }

  private empezar(id: string): void {
    const ctx = sonido.ctx;
    if (!ctx) return;
    this.parar();
    if (!this.salida) {
      this.salida = ctx.createGain();
      this.salida.connect(ctx.destination);
    }
    this.salida.gain.value = this.volumen();
    const c = CANCIONES[id]!;
    this.cancion = c;
    this.actual = id;
    this.pistas = (['p1', 'p2', 'tri', 'ruido'] as Canal[]).map((canal) => ({ canal, ...leerCanal(c[canal], canal === 'ruido') }));
    this.largo = Math.max(...(['p1', 'p2', 'tri', 'ruido'] as Canal[]).map((k) => leerCanal(c[k], k === 'ruido').largo));
    this.pasoSig = 0;
    this.tiempoSig = ctx.currentTime + 0.08;
    this.reloj = setInterval(() => this.programar(), 25);
    this.programar();
  }

  /** Programa los pasos que caen en los próximos 120 ms. */
  private programar(): void {
    const ctx = sonido.ctx;
    const c = this.cancion;
    if (!ctx || !c) return;
    const dur = 60 / c.bpm / 4;
    while (this.tiempoSig < ctx.currentTime + 0.12) {
      if (this.pasoSig >= this.largo) {
        if (!c.bucle) {
          this.parar();
          this.pendiente = null;
          return;
        }
        this.pasoSig = 0;
      }
      for (const p of this.pistas) for (const e of p.eventos) if (e.paso === this.pasoSig) this.nota(p.canal, e, this.tiempoSig, e.pasos * dur);
      this.pasoSig++;
      this.tiempoSig += dur;
    }
  }

  private nota(canal: Canal, e: Evento, t0: number, dur: number): void {
    const ctx = sonido.ctx!;
    const g = ctx.createGain();
    g.connect(this.salida!);
    const vol = VOLUMEN[canal];
    if (canal === 'ruido') {
      const tipo = e.nota as string;
      if (tipo === 'k') {
        // Bombo: triangular que cae de tono.
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(150, t0);
        o.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
        g.gain.setValueAtTime(vol * 2.2, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
        o.connect(g);
        o.start(t0);
        o.stop(t0 + 0.15);
        this.seguir(o);
        return;
      }
      if (!this.ruido) {
        this.ruido = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
        const d = this.ruido.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = this.ruido;
      const filtro = ctx.createBiquadFilter();
      filtro.type = tipo === 'h' ? 'highpass' : 'bandpass';
      filtro.frequency.value = tipo === 'h' ? 7000 : 1800;
      const largo = tipo === 'h' ? 0.03 : 0.1;
      g.gain.setValueAtTime(vol * (tipo === 'h' ? 0.6 : 1.3), t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + largo);
      src.connect(filtro).connect(g);
      src.start(t0);
      src.stop(t0 + largo + 0.01);
      this.seguir(src);
      return;
    }
    const o = ctx.createOscillator();
    o.type = canal === 'tri' ? 'triangle' : 'square';
    o.frequency.setValueAtTime(e.nota as number, t0);
    const fin = t0 + dur * 0.92;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.006);
    g.gain.setTargetAtTime(vol * 0.65, t0 + 0.02, 0.08);
    g.gain.setTargetAtTime(0, fin - 0.01, 0.015);
    o.connect(g);
    o.start(t0);
    o.stop(fin + 0.06);
    this.seguir(o);
  }

  private seguir(n: AudioScheduledSourceNode): void {
    this.nodos.add(n);
    n.onended = () => this.nodos.delete(n);
  }
}

export const musica = new Musica();
