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
import { iniciarDiag, montarDiag } from './diag';
import { esNativo, iniciarNativo } from './nativo';

/** El mundo del juego mide 240×160; se dibuja a 4× para que letras y fondos salgan suaves. */
const ANCHO = 240 * ESCALA;
const ALTO = 160 * ESCALA;

/** El lienzo ocupa todo el espacio disponible manteniendo la proporción 3:2. */
function ajustarEscala(canvas: HTMLCanvasElement): void {
  const tactil = document.body.classList.contains('tactil');
  document.body.classList.toggle('vertical', tactil && window.innerHeight > window.innerWidth);
  const app = document.getElementById('app');
  let ancho: number;
  if (tactil) {
    // Celular o tableta (D241): el juego ocupa toda la altura; los controles flotan semitransparentes encima.
    if (app) app.style.paddingTop = '0px';
    // Se deja lugar a los costados para la cruz y A/B (3 botones de ancho), achicando el juego como mucho un 10 %.
    // Se cuenta también la franja que el teléfono reserva para la cámara frontal (márgenes seguros).
    const alto = window.innerHeight;
    const boton = Math.min(alto * 0.12, 48);
    const seguro = margenesSeguros();
    const margen = boton * 3 + alto * 0.012 + 10 + Math.max(seguro.izq, seguro.der);
    const lleno = Math.min(window.innerWidth, alto * 1.5);
    ancho = Math.min(lleno, Math.max(window.innerWidth - 2 * margen, lleno * 0.8));
  } else {
    // La barra de ajustes puede ocupar una o dos filas (según el ancho y el botón Instalar): el juego empieza debajo.
    const barra = document.getElementById('barra');
    const arriba = (barra?.offsetHeight ?? 36) + 16;
    if (app) app.style.paddingTop = `${arriba}px`;
    const anchoDisp = window.innerWidth - 22;
    const altoDisp = window.innerHeight - arriba - 58;
    ancho = Math.max(240, Math.min(anchoDisp, altoDisp * 1.5, ANCHO * 1.5));
  }
  canvas.style.width = `${Math.floor(ancho)}px`;
  canvas.style.height = `${Math.floor(ancho / 1.5)}px`;
}

/** Márgenes seguros del teléfono (cámara frontal, bordes curvos), en px. */
let sonda: HTMLDivElement | null = null;
function margenesSeguros(): { izq: number; der: number } {
  if (!sonda) {
    sonda = document.createElement('div');
    sonda.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)';
    document.body.append(sonda);
  }
  const cs = getComputedStyle(sonda);
  return { izq: parseFloat(cs.paddingLeft) || 0, der: parseFloat(cs.paddingRight) || 0 };
}

/** Celular: ajustes detrás del botón ⚙, pantalla completa horizontal y botón Atrás de Android como B (D241). */
function prepararCelular(): void {
  if (!document.body.classList.contains('tactil')) return;
  const boton = document.getElementById('ajustes-boton');
  boton?.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    document.body.classList.toggle('ajustes-abiertos');
  });
  // Tocar fuera del panel de ajustes lo cierra.
  document.addEventListener('pointerdown', (e) => {
    if (!document.body.classList.contains('ajustes-abiertos')) return;
    const t = e.target as HTMLElement;
    if (t.closest('#barra') || t.closest('#ajustes-boton')) return;
    document.body.classList.remove('ajustes-abiertos');
  });
  // En la app de Android la pantalla completa, el giro y el botón Atrás los maneja la app (nativo.ts).
  if (esNativo) return;
  // Pantalla completa y giro fijo al primer toque (el navegador solo lo permite tras un gesto).
  Entrada.alPrimerGesto(() => {
    const raiz = document.documentElement as HTMLElement & { requestFullscreen?: (o?: FullscreenOptions) => Promise<void> };
    if (!document.fullscreenElement && raiz.requestFullscreen)
      void raiz
        .requestFullscreen({ navigationUI: 'hide' })
        .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
        .catch(() => undefined);
  });
  // Botón Atrás del teléfono: en vez de salir del juego, funciona como B.
  history.pushState({ pix: 1 }, '');
  window.addEventListener('popstate', () => {
    if (document.body.classList.contains('ajustes-abiertos')) document.body.classList.remove('ajustes-abiertos');
    else Entrada.pulsar('b');
    history.pushState({ pix: 1 }, '');
  });
}

/** Textos fijos de index.html (ayuda de teclas, botón Instalar, instrucciones de iPhone) en el idioma elegido. */
function textosDePagina(): void {
  document.documentElement.lang = idioma();
  const poner = (id: string, clave: string, html = false) => {
    const el = document.getElementById(id);
    if (el) el[html ? 'innerHTML' : 'textContent'] = t(clave);
  };
  poner('ayuda', 'pag.teclas');
  poner('girar-texto', 'pag.girar');
  document.getElementById('ajustes-boton')?.setAttribute('aria-label', t('pag.ajustes'));
  poner('instalar', 'pag.instalar');
  poner('ayuda-instalar-titulo', 'pag.ios.titulo');
  poner('ios-paso1', 'pag.ios.paso1', true);
  poner('ios-paso2', 'pag.ios.paso2', true);
  poner('ios-nota', 'pag.ios.nota');
  poner('ios-ok', 'pag.ios.ok');
  document.getElementById('instalar')?.setAttribute('title', t('pag.instalarTitulo'));
}

async function iniciar(): Promise<void> {
  iniciarDiag();
  // Idioma: nombres y descripciones de los datos, y los textos fijos de la página.
  traducirDatos(DATOS);
  textosDePagina();
  iniciarPWA();
  Entrada.iniciar();
  prepararCelular();
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
  // App de Android: botón Atrás del teléfono.
  iniciarNativo(
    () => juego.scene.getScenes(true).map((e) => e.sys.settings.key),
    () => Entrada.pulsar('b'),
  );
  // Modo diagnóstico (?diag): versión, pantalla, errores y archivos faltantes en un recuadro.
  montarDiag(juego);
  window.addEventListener('resize', () => ajustarEscala(juego.canvas));
}

void iniciar();
