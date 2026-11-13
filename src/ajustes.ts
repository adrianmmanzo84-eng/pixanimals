/**
 * Ajustes del dispositivo (no son parte de la partida): velocidad del combate, cámara y volúmenes.
 * Se guardan en localStorage aparte de la partida.
 */
export interface Ajustes {
  /** 1 o 2: el combate (animaciones y textos) va al doble de velocidad. */
  velocidad: 1 | 2;
  /** 0 (apagado) a 3. */
  musica: number;
  efectos: number;
  /** Cámara viva en combate (deriva, acercamientos y giro de perspectiva). Se puede apagar si marea. */
  camara: boolean;
}

const CLAVE = 'pixanimals.ajustes';
const oyentes = new Set<(a: Ajustes) => void>();

function leer(): Ajustes {
  const base: Ajustes = { velocidad: 1, musica: 2, efectos: 3, camara: true };
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Partial<Ajustes>;
    return {
      velocidad: g.velocidad === 2 ? 2 : 1,
      musica: typeof g.musica === 'number' ? Math.max(0, Math.min(3, g.musica)) : base.musica,
      efectos: typeof g.efectos === 'number' ? Math.max(0, Math.min(3, g.efectos)) : base.efectos,
      camara: g.camara !== false,
    };
  } catch {
    return base;
  }
}

export const ajustes: Ajustes = leer();

export function cambiarAjustes(cambio: Partial<Ajustes>): void {
  Object.assign(ajustes, cambio);
  try {
    localStorage.setItem(CLAVE, JSON.stringify(ajustes));
  } catch {
    /* sin almacenamiento: vale solo por esta sesión */
  }
  for (const f of oyentes) f(ajustes);
}

/** Avisa cada vez que cambian los ajustes. Devuelve la función para dejar de escuchar. */
export function alCambiarAjustes(f: (a: Ajustes) => void): () => void {
  oyentes.add(f);
  return () => oyentes.delete(f);
}
