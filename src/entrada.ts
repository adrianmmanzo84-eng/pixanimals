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
/** Acciones que están apretadas ahora (para minijuegos que se mueven mientras mantienes la flecha). */
const apretadas = new Set<AccionEntrada>();

/** El primer gesto (toque o tecla) habilita el audio y la pantalla completa: debe correr dentro del gesto. */
function gesto(): void {
  if (huboGesto) return;
  huboGesto = true;
  alPrimerGesto.forEach((f) => f());
}

function emitir(a: AccionEntrada): void {
  gesto();
  oyente?.(a);
}

/** Dirección analógica del stick (x, y entre -1 y 1; 0,0 sin tocar). Para quien quiera moverse en 360°. */
const vector = { x: 0, y: 0 };

/**
 * Stick de 360° del celular (D249). En los menús emite la dirección principal al moverlo y la repite si se
 * mantiene (como dejar apretada una flecha); para los minijuegos marca como apretadas las direcciones del
 * ángulo (con diagonales) y deja el vector analógico.
 */
function iniciarStick(): void {
  const base = document.getElementById('stick');
  const perilla = document.getElementById('perilla');
  if (!base || !perilla) return;
  const MUERTA = 0.24; // zona muerta (fracción del radio)
  const PRIMERA = 500; // ms antes de empezar a repetir
  const REPETIR = 220; // ms entre repeticiones
  /** Medio ancho del sector de cada eje: 75° deja diagonales de 60° (antes 45°, costaban). */
  const SECTOR = (Math.PI * 5) / 12;
  let dedo: number | null = null;
  let estado = '';
  let reloj: ReturnType<typeof setTimeout> | null = null;
  const parar = () => {
    if (reloj) clearTimeout(reloj);
    reloj = null;
  };
  /** Repite las direcciones del estado; en diagonal alterna las dos (así se avanza en diagonal). */
  const repetir = (dirs: AccionEntrada[], i: number, espera: number) => {
    reloj = setTimeout(() => {
      emitir(dirs[i % dirs.length]!);
      repetir(dirs, i + 1, REPETIR);
    }, espera);
  };
  const DIRS: AccionEntrada[] = ['arriba', 'abajo', 'izquierda', 'derecha'];
  const mover = (e: PointerEvent) => {
    const r = base.getBoundingClientRect();
    const radio = r.width / 2;
    let dx = (e.clientX - (r.left + radio)) / radio;
    let dy = (e.clientY - (r.top + radio)) / radio;
    const largo = Math.hypot(dx, dy);
    if (largo > 1) {
      dx /= largo;
      dy /= largo;
    }
    perilla.style.transform = `translate(${dx * radio * 0.62}px, ${dy * radio * 0.62}px)`;
    const fuerza = Math.min(1, largo);
    vector.x = fuerza > MUERTA ? dx : 0;
    vector.y = fuerza > MUERTA ? dy : 0;
    for (const d of DIRS) apretadas.delete(d);
    const dirs: AccionEntrada[] = [];
    if (fuerza > MUERTA) {
      const ang = Math.atan2(dy, dx);
      const cerca = (a: number) => Math.abs(Math.atan2(Math.sin(ang - a), Math.cos(ang - a))) < SECTOR;
      // Primero el eje dominante: es el que se emite al entrar en la diagonal.
      const vertical: AccionEntrada | null = cerca(Math.PI / 2) ? 'abajo' : cerca(-Math.PI / 2) ? 'arriba' : null;
      const horizontal: AccionEntrada | null = cerca(0) ? 'derecha' : cerca(Math.PI) ? 'izquierda' : null;
      const domina = Math.abs(dx) > Math.abs(dy) ? [horizontal, vertical] : [vertical, horizontal];
      for (const d of domina) if (d) dirs.push(d);
      for (const d of dirs) apretadas.add(d);
    }
    const clave = [...dirs].sort().join('+');
    if (clave === estado) return;
    const antes = estado.split('+').filter(Boolean) as AccionEntrada[];
    estado = clave;
    parar();
    if (!dirs.length) return;
    // Al pasar de un eje a la diagonal que lo contiene, se emite el otro (no se repite el que ya iba).
    const nuevo = dirs.find((d) => !antes.includes(d)) ?? dirs[0]!;
    emitir(nuevo);
    const orden = dirs.length > 1 ? [dirs.find((d) => d !== nuevo)!, nuevo] : dirs;
    repetir(orden, 0, PRIMERA);
  };
  const soltar = (e: PointerEvent) => {
    if (e.pointerId !== dedo) return;
    dedo = null;
    estado = '';
    parar();
    vector.x = vector.y = 0;
    for (const d of DIRS) apretadas.delete(d);
    perilla.style.transform = '';
    base.classList.remove('activo');
  };
  base.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (dedo !== null) return;
    dedo = e.pointerId;
    base.setPointerCapture(e.pointerId);
    base.classList.add('activo');
    mover(e);
  });
  base.addEventListener('pointermove', (e) => {
    if (e.pointerId === dedo) mover(e);
  });
  base.addEventListener('pointerup', soltar);
  base.addEventListener('pointercancel', soltar);
  base.addEventListener('lostpointercapture', soltar);
}

export const Entrada = {
  /** Solo hay un oyente activo: la escena o el menú que tiene el foco. */
  escuchar(f: Oyente | null): void {
    oyente = f;
  },
  /** Emite una acción desde fuera del teclado y del mando (botón Atrás de Android). */
  pulsar(a: AccionEntrada): void {
    emitir(a);
  },
  /** Dirección analógica del stick (0,0 si no se toca). */
  vector(): { x: number; y: number } {
    return { ...vector };
  },
  /** ¿Está apretada ahora esta acción? */
  apretada(a: AccionEntrada): boolean {
    return apretadas.has(a);
  },
  /** Se llama una vez, en el primer toque o tecla (los navegadores exigen un gesto para el audio). */
  alPrimerGesto(f: () => void): void {
    alPrimerGesto.push(f);
  },
  iniciar(): void {
    window.addEventListener('keydown', (e) => {
      // Si se está escribiendo en un campo de texto (panel de guardado), las teclas no son del juego.
      if (e.target instanceof HTMLElement && e.target.closest('#guardado, #dialogo-apodo')) return;
      const a = TECLAS[e.key];
      if (!a) return;
      e.preventDefault();
      apretadas.add(a);
      if (!e.repeat || (a !== 'a' && a !== 'b')) emitir(a);
    });
    window.addEventListener('keyup', (e) => {
      const a = TECLAS[e.key];
      if (a) apretadas.delete(a);
    });
    window.addEventListener('blur', () => apretadas.clear());
    document.querySelectorAll<HTMLButtonElement>('#mando button').forEach((boton) => {
      boton.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        boton.classList.add('pulsado');
        apretadas.add(boton.dataset.accion as AccionEntrada);
        emitir(boton.dataset.accion as AccionEntrada);
      });
      const soltar = () => {
        boton.classList.remove('pulsado');
        apretadas.delete(boton.dataset.accion as AccionEntrada);
      };
      boton.addEventListener('pointerup', soltar);
      boton.addEventListener('pointerleave', soltar);
      boton.addEventListener('pointercancel', soltar);
    });
    // Tocar la pantalla del juego equivale a A (avanzar texto).
    iniciarStick();
    // Se espera un instante (D241): primero el juego mueve la elección a la opción tocada y después se confirma.
    // Antes la confirmación llegaba primero y un toque abría la opción que estaba marcada, no la tocada.
    document.getElementById('pantalla')?.addEventListener('pointerdown', () => {
      gesto();
      window.setTimeout(() => emitir('a'), 90);
    });
    // `?movil` fuerza el diseño de teléfono en la PC (para verlo sin instalar la app, D248).
    const tactil = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || new URLSearchParams(location.search).has('movil');
    document.body.classList.toggle('tactil', tactil);
  },
};
