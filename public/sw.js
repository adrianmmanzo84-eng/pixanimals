/*
 * Service worker de PIXANIMALS: el juego funciona sin conexión después de la primera carga.
 * - La página (navegación): primero la red, así cada versión nueva llega sola; sin red, la copia guardada.
 * - Todo lo demás del mismo sitio (código, imágenes, fuente): la copia guardada al instante y, por detrás,
 *   se actualiza desde la red. El juego carga todas sus imágenes al empezar, así que tras una partida queda entero.
 * - Los archivos con huella de versión (assets/nombre-HUELLA.js) reemplazan a su versión anterior en la caché.
 * La partida NO vive aquí: está en localStorage y no se toca.
 */
const CACHE = 'pixanimals-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

/** «assets/index-AbC123.js» → «assets/index-.js»: misma familia, otra versión. */
const familia = (ruta) => ruta.replace(/-[A-Za-z0-9_]{6,}(\.[a-z0-9]+)$/, '-$1');

async function guardar(cache, peticion, respuesta) {
  const url = new URL(peticion.url);
  if (url.pathname.includes('/assets/')) {
    const fam = familia(url.pathname);
    for (const vieja of await cache.keys()) {
      const p = new URL(vieja.url).pathname;
      if (p !== url.pathname && p.includes('/assets/') && familia(p) === fam) await cache.delete(vieja);
    }
  }
  await cache.put(peticion, respuesta);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const r = await fetch(req);
          if (r.ok) await cache.put('./', r.clone());
          return r;
        } catch {
          return (await cache.match('./')) ?? (await cache.match(req)) ?? Response.error();
        }
      })(),
    );
    return;
  }
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const guardada = await cache.match(req);
      const red = fetch(req)
        .then(async (r) => {
          if (r.ok) await guardar(cache, req, r.clone());
          return r;
        })
        .catch(() => null);
      if (guardada) {
        e.waitUntil(red);
        return guardada;
      }
      return (await red) ?? Response.error();
    })(),
  );
});
