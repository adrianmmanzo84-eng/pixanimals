import type { EstadoJuego, Premio } from '../../esquemas/esquemas';
import type { Datos } from '../datos';
import type { Rng } from '../rng';
import { agregar } from '../items/items';
import { recibir, tirarRareza, type Carta } from '../sobres/sobres';

/** Carta premio: al ganar, se reparten varias cartas boca abajo y el jugador se queda con una. */

export type PremioTirado =
  | { tipo: 'monedas'; cantidad: number }
  | { tipo: 'esencia'; cantidad: number }
  | { tipo: 'item'; item: string; cantidad: number }
  | { tipo: 'criatura'; especie: string; rareza: Carta['rareza']; brillante: boolean };

function tirarUno(datos: Datos, rng: Rng): PremioTirado {
  const ops = datos.economia.premio.opciones;
  let x = rng.sig() * ops.reduce((s, o) => s + o.peso, 0);
  let op: Premio = ops[ops.length - 1]!;
  for (const o of ops) {
    x -= o.peso;
    if (x < 0) {
      op = o;
      break;
    }
  }
  if (op.tipo === 'monedas' || op.tipo === 'esencia') return { tipo: op.tipo, cantidad: rng.entero(op.min, op.max) };
  if (op.tipo === 'item') return { tipo: 'item', item: op.item, cantidad: op.cantidad };
  // Criatura: una de etapa 1, con las probabilidades del sobre gratis.
  const basico = datos.sobres.sobres.find((s) => s.id === datos.sobres.gratis.sobre)!;
  const especie = rng.elegir([...datos.criaturas.values()].filter((c) => c.etapa === 1)).id;
  return { tipo: 'criatura', especie, rareza: tirarRareza(basico.prob, rng), brillante: rng.prob(100 / datos.sobres.brillanteUnoEn) };
}

/** Las cartas boca abajo. Se tiran todas de antemano para poder mostrar después las que no se eligieron. */
export function repartirPremios(datos: Datos, rng: Rng): PremioTirado[] {
  return Array.from({ length: datos.economia.premio.cartas }, () => tirarUno(datos, rng));
}

/** Entrega el premio elegido. Si es una criatura, devuelve la carta (nueva, mejora o repetida). */
export function cobrarPremio(datos: Datos, estado: EstadoJuego, p: PremioTirado): Carta | null {
  if (p.tipo === 'monedas') estado.monedas += p.cantidad;
  else if (p.tipo === 'esencia') estado.esencia += p.cantidad;
  else if (p.tipo === 'item') agregar(estado, p.item, p.cantidad);
  else return recibir(datos, estado, p.especie, p.rareza, p.brillante);
  return null;
}
