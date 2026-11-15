import Phaser from 'phaser';
import { juego as partida } from './juego';
import { iniciarPWA } from './pwa';
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
import { Coleccion } from './escenas/Coleccion';
import { Expediciones } from './escenas/Expediciones';
import { Desafio } from './escenas/Desafio';
import { ajustes, cambiarAjustes } from './ajustes';
import './audio/musica';
import { Minijuegos } from './escenas/Minijuegos';
import { Misiones } from './escenas/Misiones';
import { Ruleta } from './escenas/Ruleta';
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
  // La barra de ajustes puede ocupar una o dos filas (según el ancho y el botón Instalar): el juego empieza debajo.
  const barra = document.getElementById('barra');
  const app = document.getElementById('app');
  const arriba = (barra?.offsetHeight ?? 36) + 16;
  if (app) app.style.paddingTop = `${arriba}px`;
  const anchoDisp = window.innerWidth - 22;
  const altoDisp = window.innerHeight - arriba - (tactil ? 238 : 58);
  const ancho = Math.max(240, Math.min(anchoDisp, altoDisp * 1.5, ANCHO * 1.5));
  canvas.style.width = `${Math.floor(ancho)}px`;
  canvas.style.height = `${Math.floor(ancho / 1.5)}px`;
}

async function iniciar(): Promise<void> {
  iniciarPWA();
  Entrada.iniciar();
  Entrada.alPrimerGesto(() => sonido.activar());

  // Barra de ajustes: velocidad del combate, cámara, volumen de música y de efectos (0 a 3) y silencio general.
  const boton = (id: string) => document.getElementById(id) as HTMLButtonElement;
  const nivel = (n: number) => (n === 0 ? 'no' : '■'.repeat(n) + '□'.repeat(3 - n));
  const pintar = () => {
    boton('silencio').textContent = sonido.silenciado ? 'Sonido: no' : 'Sonido: sí';
    boton('silencio').setAttribute('aria-pressed', String(sonido.silenciado));
    boton('velocidad').textContent = `Velocidad ×${ajustes.velocidad}`;
    boton('velocidad').setAttribute('aria-pressed', String(ajustes.velocidad === 2));
    boton('camara').textContent = `Cámara: ${ajustes.camara ? 'sí' : 'no'}`;
    boton('camara').setAttribute('aria-pressed', String(ajustes.camara));
    boton('golpe').textContent = `Golpe: ${ajustes.golpe === 'barra' ? 'barra' : 'auto'}`;
    boton('golpe').setAttribute('aria-pressed', String(ajustes.golpe === 'barra'));
    boton('vol-musica').textContent = `Música ${nivel(ajustes.musica)}`;
    boton('vol-efectos').textContent = `Efectos ${nivel(ajustes.efectos)}`;
  };
  pintar();
  const alClic = (id: string, f: () => void) =>
    boton(id).addEventListener('click', () => {
      sonido.activar();
      f();
      pintar();
      boton(id).blur();
    });
  alClic('silencio', () => sonido.alternar());
  alClic('velocidad', () => cambiarAjustes({ velocidad: ajustes.velocidad === 2 ? 1 : 2 }));
  alClic('camara', () => cambiarAjustes({ camara: !ajustes.camara }));
  alClic('golpe', () => cambiarAjustes({ golpe: ajustes.golpe === 'barra' ? 'auto' : 'barra' }));
  alClic('vol-musica', () => cambiarAjustes({ musica: (ajustes.musica + 1) % 4 }));
  alClic('vol-efectos', () => {
    cambiarAjustes({ efectos: (ajustes.efectos + 1) % 4 });
    sonido.tocar('cursor');
  });

  // Antes de abrir cualquier pantalla: si el guardado se perdió o se dañó, se recupera de la copia.
  await partida.recuperar();

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
    scene: [Arranque, Menu, Sobres, Bestiario, Equipo, Combate, Tienda, BolsaEscena, Premio, Minijuegos, MiniBayas, MiniEco, MiniGolpe, Misiones, Desafio, Coleccion, Expediciones, Ruleta],
  });
  ajustarEscala(juego.canvas);
  // Solo en desarrollo: acceso desde la consola para pruebas visuales.
  if (import.meta.env.DEV) Object.assign(window, { __pixGame: juego });
  window.addEventListener('resize', () => ajustarEscala(juego.canvas));
}

void iniciar();
