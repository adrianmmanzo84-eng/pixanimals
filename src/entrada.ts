/** Entrada unificada: teclado y mando táctil emiten las mismas seis acciones. */
export type AccionEntrada = 'arriba' | 'abajo' | 'izquierda' | 'derecha' | 'a' | 'b';

const TECLAS: Record<string, AccionEntrada> = {
  ArrowUp: 'arriba', ArrowDown: 'abajo', ArrowLeft: 'izquierda', ArrowRight: 'derecha',
  z: 'a', Z: 'a', Enter: 'a', ' ': 'a', a: 'a', A: 'a',
  x: 'b', X: 'b', Escape: 'b', Backspace: 'b', b: 'b', B: 'b',
};

type Oyente = (a: AccionEntrada) => void;
let oyente: Oyente | null = null;
const alPrimerGesto: (() => void)[] = [];
let huboGesto = false;

function emitir(a: AccionEntrada): void {
  if (!huboGesto) {
    huboGesto = true;
    alPrimerGesto.forEach((f) => f());
  }
  oyente?.(a);
}

export const Entrada = {
  /** Solo hay un oyente activo: la escena o el menú que tiene el foco. */
  escuchar(f: Oyente | null): void {
    oyente = f;
  },
  /** Se llama una vez, en el primer toque o tecla (los navegadores exigen un gesto para el audio). */
  alPrimerGesto(f: () => void): void {
    alPrimerGesto.push(f);
  },
  iniciar(): void {
    window.addEventListener('keydown', (e) => {
      // Si se está escribiendo en un campo de texto (panel de guardado), las teclas no son del juego.
      if (e.target instanceof HTMLElement && e.target.closest('#guardado')) return;
      const a = TECLAS[e.key];
      if (!a) return;
      e.preventDefault();
      if (!e.repeat || (a !== 'a' && a !== 'b')) emitir(a);
    });
    document.querySelectorAll<HTMLButtonElement>('#mando button').forEach((boton) => {
      boton.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        boton.classList.add('pulsado');
        emitir(boton.dataset.accion as AccionEntrada);
      });
      const soltar = () => boton.classList.remove('pulsado');
      boton.addEventListener('pointerup', soltar);
      boton.addEventListener('pointerleave', soltar);
      boton.addEventListener('pointercancel', soltar);
    });
    // Tocar la pantalla del juego equivale a A (avanzar texto).
    document.getElementById('pantalla')?.addEventListener('pointerdown', () => emitir('a'));
    const tactil = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    document.body.classList.toggle('tactil', tactil);
  },
};
