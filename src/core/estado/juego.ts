import type { CriaturaJugador, EstadoJuego, RarezaId } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import { crearCombatiente, type Combatiente } from '../combate/motor';

/** Todo el progreso del jugador. Es un objeto plano y serializable: se guarda tal cual. */
export function estadoNuevo(datos: Datos, ahora: number): EstadoJuego {
  return {
    version: 1,
    monedas: datos.economia.monedasIniciales,
    esencia: 0,
    criaturas: [],
    equipo: [],
    vistas: [],
    pity: { rara: 0, epica: 0 },
    gratis: { acumulados: 1, desde: ahora },
    bienvenida: false,
    estadisticas: { combates: 0, victorias: 0, sobres: 0 },
  };
}

export function criaturaDe(estado: EstadoJuego, especie: string): CriaturaJugador | undefined {
  return estado.criaturas.find((c) => c.especie === especie);
}

export function potencialDe(datos: Datos, rareza: RarezaId): number {
  return datos.sobres.rarezas.find((r) => r.id === rareza)!.potencial;
}

export function marcarVista(estado: EstadoJuego, especie: string): void {
  if (!estado.vistas.includes(especie)) estado.vistas.push(especie);
}

/** Criaturas del equipo, en orden. Limpia referencias a criaturas que ya no existan. */
export function equipoDe(estado: EstadoJuego): CriaturaJugador[] {
  return estado.equipo.flatMap((id) => {
    const c = criaturaDe(estado, id);
    return c ? [c] : [];
  });
}

/** Pone una criatura al frente del equipo (la agrega si hay sitio). */
export function ponerAlFrente(datos: Datos, estado: EstadoJuego, especie: string): void {
  if (!criaturaDe(estado, especie)) return;
  estado.equipo = [especie, ...estado.equipo.filter((e) => e !== especie)].slice(0, datos.economia.tamanoEquipo);
}

export function combatienteDe(datos: Datos, c: CriaturaJugador): Combatiente {
  return crearCombatiente(datos, c.especie, c.nivel, { potencial: potencialDe(datos, c.rareza), brillante: c.brillante });
}
