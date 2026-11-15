import { claveDia, clavesSobrantes, type Respaldo } from './core/estado/respaldo';

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

export async function leerRespaldos(): Promise<Respaldo[]> {
  return (await transaccion<Respaldo[]>('readonly', (t) => t.getAll())) ?? [];
}

/** Guarda la copia «actual» y, si es el primer guardado del día, la copia de hoy; borra las copias diarias viejas. */
export async function guardarRespaldo(texto: string, ahora = Date.now()): Promise<void> {
  const hoy = claveDia(ahora);
  const claves = ((await transaccion<IDBValidKey[]>('readonly', (t) => t.getAllKeys())) ?? []).map(String);
  await transaccion('readwrite', (t) => {
    t.put({ clave: 'actual', texto, en: ahora } satisfies Respaldo);
    if (!claves.includes(hoy)) t.put({ clave: hoy, texto, en: ahora } satisfies Respaldo);
    for (const c of clavesSobrantes([...claves, hoy])) t.delete(c);
  });
}

export async function borrarRespaldos(): Promise<void> {
  await transaccion('readwrite', (t) => t.clear());
}
