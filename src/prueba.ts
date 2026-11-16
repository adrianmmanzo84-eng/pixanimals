import { DATOS } from './core/datos';
import { estadoNuevo, nuevaCriatura } from './core/estado/juego';
import type { EstadoJuego } from './esquemas/esquemas';

/**
 * Modo prueba (D225): se abre con `?prueba` en la dirección (o `?prueba=especie1,especie2`).
 * Partida aparte, solo en memoria (no se guarda nada ni se toca la partida real), con un equipo de formas
 * finales al nivel 50 y el Ataque Definitivo disponible desde el turno 1.
 */
export function pedidoPrueba(): string[] | null {
  const p = new URLSearchParams(location.search);
  if (!p.has('prueba')) return null;
  return (p.get('prueba') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((id) => DATOS.criaturas.get(id)?.definitivo);
}

export function estadoPrueba(pedidas: string[]): EstadoJuego {
  const e = estadoNuevo(DATOS, Date.now());
  const finales = [...DATOS.criaturas.values()].filter((c) => c.etapa === 4 && c.definitivo && !c.jefe);
  const equipo = [...pedidas];
  while (equipo.length < 3) {
    const c = finales[Math.floor(Math.random() * finales.length)]!;
    if (!equipo.includes(c.id)) equipo.push(c.id);
  }
  e.criaturas = equipo.slice(0, 3).map((id) => nuevaCriatura(id, 50, 'epica', false));
  e.equipo = e.criaturas.map((c) => c.especie);
  e.registro = [...e.equipo];
  e.vistas = [...e.equipo];
  e.monedas = 5000;
  e.esencia = 500;
  // Sin guía de primeros pasos ni avisos que tapen la prueba.
  e.bienvenida = true;
  e.guia = { paso: 999 };
  DATOS.balance.definitivo.turnoMinimo = 1;
  return e;
}

/** Cartel fijo arriba de la pantalla: modo prueba y cómo salir. */
export function cartelPrueba(): void {
  const div = document.createElement('div');
  div.style.cssText =
    'position:fixed;left:50%;bottom:6px;transform:translateX(-50%);z-index:50;background:#c0304a;color:#fff;font:600 13px Fredoka,sans-serif;padding:5px 12px;border-radius:8px;box-shadow:0 2px 6px #0006';
  const salir = document.createElement('a');
  salir.href = location.pathname;
  salir.textContent = 'salir';
  salir.style.cssText = 'color:#ffe28a;margin-left:8px';
  div.append('MODO PRUEBA · nada se guarda · Definitivo desde el turno 1', salir);
  document.body.append(div);
}
