import Phaser from 'phaser';
import { DATOS } from './core/datos';
import { guardarIdioma, idioma, t } from './i18n/i18n';
import { traducirDatos } from './i18n/datos';
import { juego as partida } from './juego';
import { cartelPrueba, estadoPrueba, pedidoPrueba } from './prueba';
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
import { Titulo } from './escenas/Titulo';
import { Minijuegos } from './escenas/Minijuegos';
import { Misiones } from './escenas/Misiones';
import { Ruleta } from './escenas/Ruleta';
import { MiniBayas } from './escenas/minijuegos/Bayas';
import { MiniEco } from './escenas/minijuegos/Eco';
import { MiniGolpe } from './escenas/minijuegos/Golpe';
import { MiniMina } from './escenas/minijuegos/Mina';
import { Ataques } from './escenas/Ataques';
import { Torre } from './escenas/Torre';
import { Ruta } from './escenas/Ruta';
import { Cronoportal } from './escenas/Cronoportal';
import { CronoMapa } from './escenas/CronoMapa';
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

/** Textos fijos de index.html (ayuda de teclas, botón Instalar, instrucciones de iPhone) en el idioma elegido. */
function textosDePagina(): void {
  document.documentElement.lang = idioma();
  const poner = (id: string, clave: string, html = false) => {
    const el = document.getElementById(id);
    if (el) el[html ? 'innerHTML' : 'textContent'] = t(clave);
  };
  poner('ayuda', 'pag.teclas');
  poner('instalar', 'pag.instalar');
  poner('ayuda-instalar-titulo', 'pag.ios.titulo');
  poner('ios-paso1', 'pag.ios.paso1', true);
  poner('ios-paso2', 'pag.ios.paso2', true);
  poner('ios-nota', 'pag.ios.nota');
  poner('ios-ok', 'pag.ios.ok');
  document.getElementById('instalar')?.setAttribute('title', t('pag.instalarTitulo'));
}

async function iniciar(): Promise<void> {
  // Idioma: nombres y descripciones de los datos, y los textos fijos de la página.
  traducirDatos(DATOS);
  textosDePagina();
  iniciarPWA();
  Entrada.iniciar();
  Entrada.alPrimerGesto(() => sonido.activar());

  // Barra de ajustes: velocidad del combate, cámara, volumen de música y de efectos (0 a 3) y silencio general.
  const boton = (id: string) => document.getElementById(id) as HTMLButtonElement;
  const nivel = (n: number) => (n === 0 ? t('bar.no') : '■'.repeat(n) + '□'.repeat(3 - n));
  const siNo = (v: boolean) => t(v ? 'bar.si' : 'bar.no');
  const pintar = () => {
    boton('idioma').textContent = idioma() === 'es' ? 'EN' : 'ES';
    boton('silencio').textContent = t('bar.sonido', { v: siNo(!sonido.silenciado) });
    boton('silencio').setAttribute('aria-pressed', String(sonido.silenciado));
    boton('velocidad').textContent = t('bar.velocidad', { v: ajustes.velocidad });
    boton('velocidad').setAttribute('aria-pressed', String(ajustes.velocidad === 2));
    boton('camara').textContent = t('bar.camara', { v: siNo(ajustes.camara) });
    boton('camara').setAttribute('aria-pressed', String(ajustes.camara));
    boton('golpe').textContent = t('bar.golpe', { v: t(ajustes.golpe === 'barra' ? 'bar.barra' : 'bar.auto') });
    boton('golpe').setAttribute('aria-pressed', String(ajustes.golpe === 'barra'));
    boton('vol-musica').textContent = t('bar.musica', { v: nivel(ajustes.musica) });
    boton('vol-efectos').textContent = t('bar.efectos', { v: nivel(ajustes.efectos) });
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
  // Cambiar de idioma recarga la página: los datos y todas las pantallas se vuelven a armar en el idioma nuevo.
  boton('idioma').addEventListener('click', () => {
    guardarIdioma(idioma() === 'es' ? 'en' : 'es');
    location.reload();
  });
  alClic('velocidad', () => cambiarAjustes({ velocidad: ajustes.velocidad === 2 ? 1 : 2 }));
  alClic('camara', () => cambiarAjustes({ camara: !ajustes.camara }));
  alClic('golpe', () => cambiarAjustes({ golpe: ajustes.golpe === 'barra' ? 'auto' : 'barra' }));
  alClic('vol-musica', () => cambiarAjustes({ musica: (ajustes.musica + 1) % 4 }));
  alClic('vol-efectos', () => {
    cambiarAjustes({ efectos: (ajustes.efectos + 1) % 4 });
    sonido.tocar('cursor');
  });

  // Modo prueba (?prueba): partida aparte en memoria, con formas finales y el Definitivo desde el turno 1.
  const pedidas = pedidoPrueba();
  if (pedidas) {
    partida.prueba = true;
    partida.estado = estadoPrueba(pedidas);
    cartelPrueba();
  }

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
    scene: [Arranque, Titulo, Menu, Sobres, Bestiario, Equipo, Combate, Tienda, BolsaEscena, Premio, Minijuegos, MiniBayas, MiniEco, MiniGolpe, MiniMina, Ataques, Torre, Ruta, Cronoportal, CronoMapa, Misiones, Desafio, Coleccion, Expediciones, Ruleta],
  });
  ajustarEscala(juego.canvas);
  // Solo en desarrollo: acceso desde la consola para pruebas visuales.
  if (import.meta.env.DEV) Object.assign(window, { __pixGame: juego });
  window.addEventListener('resize', () => ajustarEscala(juego.canvas));
}

void iniciar();
