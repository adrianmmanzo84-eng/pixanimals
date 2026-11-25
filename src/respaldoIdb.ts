import { claveDia, clavesSobrantes, type Respaldo } from './core/estado/respaldo';
import { claveDeRanura, prefijoRespaldo, type Ranura } from './core/estado/ranuras';

/**
 * Segundo almacén de la partida en IndexedDB (aparte de localStorage). Nunca lanza: si IndexedDB no está
 * disponible (modo privado, navegador viejo), todo queda en no-op y el juego sigue con el guardado normal.
 */
const BASE = 'pixanimals';
const TABLA = 'respaldos';

function abrir(): Promise<IDBDatabase | null> {
  return new Promise((resolver) => {
    try {
      const pedido = indexedDB.open(BASE, 1);
      pedido.onupgradeneeded = () => pedido.result.createObjectStore(TABLA, { keyPath: 'clave' });
      pedido.onsuccess = () => resolver(pedido.result);
      pedido.onerror = () => resolver(null);
      pedido.onblocked = () => resolver(null);
    } catch {
      resolver(null);
    }
  });
}

function transaccion<T>(modo: IDBTransactionMode, f: (t: IDBObjectStore) => IDBRequest<T> | void): Promise<T | null> {
  return abrir().then(
    (db) =>
      new Promise<T | null>((resolver) => {
        if (!db) return resolver(null);
        try {
          const tx = db.transaction(TABLA, modo);
          const pedido = f(tx.objectStore(TABLA));
          tx.oncomplete = () => {
            db.close();
            resolver(pedido ? (pedido.result as T) : null);
          };
          tx.onerror = tx.onabort = () => {
            db.close();
            resolver(null);
          };
        } catch {
          db.close();
          resolver(null);
        }
      }),
  );
}

/** Copias de una ranura (D279: la ranura 1 usa las claves de siempre; las otras, con prefijo «r2/», «r3/»). */
export async function leerRespaldos(ranura: Ranura = 1): Promise<Respaldo[]> {
  const todas = (await transaccion<Respaldo[]>('readonly', (t) => t.getAll())) ?? [];
  return todas.filter((r) => claveDeRanura(String(r.clave), ranura) !== null);
}

/** Guarda la copia «actual» y, si es el primer guardado del día, la copia de hoy; borra las copias diarias viejas. */
export async function guardarRespaldo(texto: string, ahora = Date.now(), ranura: Ranura = 1): Promise<void> {
  const p = prefijoRespaldo(ranura);
  const hoy = claveDia(ahora);
  const claves = ((await transaccion<IDBValidKey[]>('readonly', (t) => t.getAllKeys())) ?? [])
    .map((c) => claveDeRanura(String(c), ranura))
    .filter((c): c is string => c !== null);
  await transaccion('readwrite', (t) => {
    t.put({ clave: `${p}actual`, texto, en: ahora } satisfies Respaldo);
    if (!claves.includes(hoy)) t.put({ clave: `${p}${hoy}`, texto, en: ahora } satisfies Respaldo);
    for (const c of clavesSobrantes([...claves, hoy])) t.delete(`${p}${c}`);
  });
}

/** Borra las copias de una ranura (solo esa). */
export async function borrarRespaldos(ranura: Ranura = 1): Promise<void> {
  const claves = ((await transaccion<IDBValidKey[]>('readonly', (t) => t.getAllKeys())) ?? []).map(String);
  await transaccion('readwrite', (t) => {
    for (const c of claves) if (claveDeRanura(c, ranura) !== null) t.delete(c);
  });
}
