/** Generador con semilla (mulberry32). El mismo número de semilla reproduce el mismo combate. */
export class Rng {
  private s: number;
  constructor(semilla: number) {
    this.s = semilla >>> 0;
  }
  /** Número en [0, 1). */
  sig(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** Entero en [min, max], ambos incluidos. */
  entero(min: number, max: number): number {
    return min + Math.floor(this.sig() * (max - min + 1));
  }
  /** true con la probabilidad dada en porcentaje. */
  prob(pct: number): boolean {
    return this.sig() * 100 < pct;
  }
  elegir<T>(lista: readonly T[]): T {
    return lista[Math.floor(this.sig() * lista.length)]!;
  }
}
