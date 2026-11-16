import type Phaser from 'phaser';

declare const __VERSION__: string;
declare const __COMMIT__: string;

/** Versión del juego (definida al compilar; en el servidor de pruebas local puede faltar). */
export const VERSION = typeof __VERSION__ === 'string' ? __VERSION__ : 'dev';
const COMMIT = typeof __COMMIT__ === 'string' ? __COMMIT__ : '';

/**
 * Modo diagnóstico (D237): se abre con `?diag` en la dirección (se puede combinar: `?diag&prueba`).
 * Muestra un recuadro con la versión, la pantalla activa, los cuadros por segundo, los errores y las imágenes o
 * sonidos que no cargaron. «Copiar informe» deja todo en el portapapeles para pegarlo en un reporte. No cambia
 * nada de la partida.
 */
export function diagPedido(): boolean {
  return new URLSearchParams(location.search).has('diag');
}

type Linea = { hora: string; texto: string };
const errores: Linea[] = [];
const faltantes: string[] = [];
const recorrido: string[] = [];
let caja: HTMLDivElement | null = null;

const hora = () => new Date().toLocaleTimeString('es-AR', { hour12: false });

function anotar(texto: string): void {
  const t = texto.slice(0, 300);
  if (errores.some((e) => e.texto === t)) return;
  errores.push({ hora: hora(), texto: t });
  if (errores.length > 30) errores.shift();
}

/** Se llama antes de crear el juego para no perder errores del arranque. */
export function iniciarDiag(): void {
  if (!diagPedido()) return;
  window.addEventListener('error', (e) => anotar(`${e.message} (${(e.filename ?? '').split('/').pop()}:${e.lineno})`));
  window.addEventListener('unhandledrejection', (e) => anotar(`Promesa: ${String((e.reason as Error)?.stack ?? e.reason)}`));
  const original = console.error.bind(console);
  console.error = (...a: unknown[]) => {
    // Respeta el formato «%s» de la consola (Phaser lo usa en sus avisos).
    const partes = a.map((x) => (x instanceof Error ? x.message : String(x)));
    let msg = partes.shift() ?? '';
    msg = msg.replace(/%[sdo]/g, () => (partes.length ? partes.shift()! : ''));
    anotar([msg, ...partes].join(' '));
    original(...a);
  };
  const warn = console.warn.bind(console);
  console.warn = (...a: unknown[]) => {
    const s = a.map(String).join(' ');
    if (/texture|frame|missing|not found|falta/i.test(s)) anotar(`Aviso: ${s}`);
    warn(...a);
  };
}

/** Se llama con el juego creado: engancha las cargas fallidas y dibuja el recuadro. */
export function montarDiag(juego: Phaser.Game): void {
  if (!diagPedido()) return;
  Object.assign(window, { __pixGame: juego });
  // Archivos que no cargaron, en cualquier pantalla.
  const enganchar = () => {
    for (const s of juego.scene.getScenes(false)) {
      const cargador = s.load as Phaser.Loader.LoaderPlugin & { __diag?: boolean };
      if (!cargador || cargador.__diag) continue;
      cargador.__diag = true;
      cargador.on('loaderror', (f: Phaser.Loader.File) => {
        const n = `${f.type}: ${String(f.url ?? f.key)}`;
        if (!faltantes.includes(n)) faltantes.push(n);
      });
    }
  };
  juego.events.once('ready', enganchar);

  caja = document.createElement('div');
  caja.id = 'diag';
  caja.style.cssText =
    'position:fixed;left:8px;top:8px;z-index:9;max-width:min(420px,calc(100vw - 16px));max-height:45vh;overflow:auto;' +
    'background:rgba(16,20,44,.92);color:#e8ecf4;border:2px solid #41a6f6;border-radius:8px;padding:8px 10px;' +
    'font:12px/1.35 ui-monospace,monospace;user-select:text;-webkit-user-select:text;touch-action:auto';
  const cuerpo = document.createElement('div');
  const botones = document.createElement('div');
  botones.style.cssText = 'display:flex;gap:6px;margin-top:6px';
  const boton = (texto: string, f: () => void) => {
    const b = document.createElement('button');
    b.textContent = texto;
    b.style.cssText = 'font:600 12px system-ui;padding:4px 8px;border-radius:6px;border:1px solid #566c86;background:#29366f;color:#fff;cursor:pointer';
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      f();
      b.blur();
    });
    botones.append(b);
    return b;
  };
  const copiar = boton('Copiar informe', () => {
    const texto = informe(juego);
    void navigator.clipboard?.writeText(texto).then(
      () => ((copiar.textContent = '¡Copiado!'), setTimeout(() => (copiar.textContent = 'Copiar informe'), 1500)),
      () => window.prompt('Copia el informe:', texto),
    );
  });
  let chico = false;
  const plegar = boton('–', () => {
    chico = !chico;
    cuerpo.style.display = chico ? 'none' : '';
    plegar.textContent = chico ? '+' : '–';
  });
  boton('Borrar errores', () => {
    errores.length = 0;
    faltantes.length = 0;
  });
  caja.append(cuerpo, botones);
  document.body.append(caja);

  let ultimo = '';
  setInterval(() => {
    enganchar();
    const activas = escenasActivas(juego);
    const actual = activas.join(' + ');
    if (actual && actual !== ultimo) {
      recorrido.push(`${hora()} ${actual}`);
      if (recorrido.length > 12) recorrido.shift();
      ultimo = actual;
    }
    if (chico) return;
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
    const color = errores.length || faltantes.length ? '#ff8a80' : '#a7f070';
    cuerpo.innerHTML =
      `<b>PIXANIMALS v${VERSION}</b>${COMMIT ? ` · ${COMMIT}` : ''} · ${Math.round(juego.loop.actualFps)} fps<br>` +
      `Pantalla: <b>${esc(actual || '—')}</b><br>` +
      `<span style="color:${color}">Errores: ${errores.length} · Archivos que faltan: ${faltantes.length}</span>` +
      faltantes.map((f) => `<div style="color:#ffd76a">✗ ${esc(f)}</div>`).join('') +
      errores
        .slice(-6)
        .map((e) => `<div style="color:#ff8a80">${e.hora} ${esc(e.texto)}</div>`)
        .join('');
  }, 500);
}

function escenasActivas(juego: Phaser.Game): string[] {
  return juego.scene
    .getScenes(false)
    .filter((s) => s.sys.isActive() || s.sys.isPaused())
    .map((s) => s.sys.settings.key);
}

function informe(juego: Phaser.Game): string {
  return [
    `PIXANIMALS v${VERSION}${COMMIT ? ` (${COMMIT})` : ''}`,
    `Fecha: ${new Date().toISOString()}`,
    `Navegador: ${navigator.userAgent}`,
    `Ventana: ${innerWidth}×${innerHeight} · pantalla ${screen.width}×${screen.height} · densidad ${devicePixelRatio}`,
    `Pantalla actual: ${escenasActivas(juego).join(' + ') || '—'} · ${Math.round(juego.loop.actualFps)} fps`,
    `Recorrido: ${recorrido.join(' → ')}`,
    `Archivos que faltan (${faltantes.length}):`,
    ...faltantes.map((f) => `  ${f}`),
    `Errores (${errores.length}):`,
    ...errores.map((e) => `  ${e.hora} ${e.texto}`),
  ].join('\n');
}
