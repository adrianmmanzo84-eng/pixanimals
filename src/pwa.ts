/**
 * PWA: registra el service worker (solo en el build publicado), pide almacenamiento persistente
 * para que el navegador no borre la partida, y maneja el botón «Instalar»:
 * - Android/Chrome/Edge: aparece cuando el navegador ofrece instalar y abre su diálogo.
 * - iPhone/iPad (Safari no tiene diálogo): explica cómo agregarlo a la pantalla de inicio.
 * - Ya instalado (abierto como app): el botón no aparece.
 */
interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function instalada(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function esIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

export function iniciarPWA(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => void navigator.serviceWorker.register('./sw.js').catch(() => undefined));
  }
  // Pedirlo no molesta al jugador: el navegador decide solo (suele concederlo a las apps instaladas o muy usadas).
  void navigator.storage?.persist?.().catch(() => false);

  const boton = document.getElementById('instalar') as HTMLButtonElement | null;
  if (!boton || instalada()) return;
  let evento: EventoInstalar | null = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    evento = e as EventoInstalar;
    boton.hidden = false;
    window.dispatchEvent(new Event('resize'));
  });
  window.addEventListener('appinstalled', () => {
    boton.hidden = true;
    window.dispatchEvent(new Event('resize'));
    evento = null;
  });
  if (esIOS()) {
    boton.hidden = false;
    window.dispatchEvent(new Event('resize'));
  }
  boton.addEventListener('click', () => {
    boton.blur();
    if (evento) {
      void evento.prompt();
      void evento.userChoice.then((r) => {
        if (r.outcome === 'accepted') boton.hidden = true;
        evento = null;
      });
    } else ayudaIOS();
  });
}

/** Instrucciones para iPhone/iPad: Compartir → «Agregar a inicio». */
function ayudaIOS(): void {
  const velo = document.getElementById('ayuda-instalar');
  if (!velo) return;
  velo.classList.add('abierto');
  const cerrar = () => velo.classList.remove('abierto');
  velo.querySelector('button')?.addEventListener('click', cerrar, { once: true });
  velo.addEventListener('click', (e) => e.target === velo && cerrar(), { once: true });
}
