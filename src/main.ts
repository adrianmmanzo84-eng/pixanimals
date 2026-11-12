import Phaser from 'phaser';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import { Entrada } from './entrada';
import { sonido } from './audio/sfx';
import { Arranque } from './escenas/Arranque';
import { Menu } from './escenas/Menu';
import { Sobres } from './escenas/Sobres';
import { Bestiario } from './escenas/Bestiario';
import { Equipo } from './escenas/Equipo';
import { Combate } from './escenas/Combate';
import { Tienda } from './escenas/Tienda';
import { BolsaEscena } from './escenas/BolsaEscena';
import { Premio } from './escenas/Premio';
import { Minijuegos } from './escenas/Minijuegos';
import { Misiones } from './escenas/Misiones';
import { MiniBayas } from './escenas/minijuegos/Bayas';
import { MiniEco } from './escenas/minijuegos/Eco';
import { MiniGolpe } from './escenas/minijuegos/Golpe';
import { ESCALA } from './ui/texto';

/** El mundo del juego mide 240×160; se dibuja a 4× para que letras y fondos salgan suaves. */
const ANCHO = 240 * ESCALA;
const ALTO = 160 * ESCALA;

/** El lienzo ocupa todo el espacio disponible manteniendo la proporción 3:2. */
function ajustarEscala(canvas: HTMLCanvasElement): void {
  const tactil = document.body.classList.contains('tactil');
  const anchoDisp = window.innerWidth - 22;
  const altoDisp = window.innerHeight - (tactil ? 290 : 70);
  const ancho = Math.max(240, Math.min(anchoDisp, altoDisp * 1.5, ANCHO * 1.5));
  canvas.style.width = `${Math.floor(ancho)}px`;
  canvas.style.height = `${Math.floor(ancho / 1.5)}px`;
}

async function iniciar(): Promise<void> {
  Entrada.iniciar();
  Entrada.alPrimerGesto(() => sonido.activar());

  const boton = document.getElementById('silencio') as HTMLButtonElement;
  const pintar = () => {
    boton.textContent = sonido.silenciado ? 'Sonido: no' : 'Sonido: sí';
    boton.setAttribute('aria-pressed', String(sonido.silenciado));
  };
  pintar();
  boton.addEventListener('click', () => {
    sonido.activar();
    sonido.alternar();
    pintar();
    boton.blur();
  });

  // La fuente debe estar cargada antes de dibujar el primer texto.
  try {
    await Promise.all([document.fonts.load('500 30px Fredoka', 'Añ¡¿é'), document.fonts.load('600 30px Fredoka', 'Añ¡¿é')]);
  } catch {
    /* se usará la fuente del sistema */
  }

  const juego = new Phaser.Game({
    type: Phaser.AUTO,
    width: ANCHO,
    height: ALTO,
    parent: 'pantalla',
    backgroundColor: '#1a1c2c',
    antialias: true,
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.NONE },
    scene: [Arranque, Menu, Sobres, Bestiario, Equipo, Combate, Tienda, BolsaEscena, Premio, Minijuegos, MiniBayas, MiniEco, MiniGolpe, Misiones],
  });
  ajustarEscala(juego.canvas);
  // Solo en desarrollo: acceso desde la consola para pruebas visuales.
  if (import.meta.env.DEV) Object.assign(window, { __pixGame: juego });
  window.addEventListener('resize', () => ajustarEscala(juego.canvas));
}

void iniciar();
