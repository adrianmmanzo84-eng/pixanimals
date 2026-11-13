import type { EstadoJuego, PremioMeta } from '../../esquemas/esquemas';

/** Entrega un premio de meta: monedas, Esencia y/o un sobre de regalo (se abre gratis). */
export function darPremio(estado: EstadoJuego, p: PremioMeta): void {
  estado.monedas += p.monedas ?? 0;
  estado.esencia += p.esencia ?? 0;
  if (p.sobre) estado.sobresRegalo[p.sobre] = (estado.sobresRegalo[p.sobre] ?? 0) + 1;
}
