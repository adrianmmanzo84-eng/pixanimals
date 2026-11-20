import { desafioAdulto } from '../core/compras/compras';
import { Rng } from '../core/rng';
import { t } from '../i18n/i18n';

/**
 * Puerta para adultos (D246): antes de cada compra, una cuenta que un niño de 7 años no resuelve de memoria.
 * Es HTML para que funcione el teclado numérico del teléfono. Devuelve true si se respondió bien.
 * Si la respuesta es incorrecta, no deja pasar y cambia la cuenta.
 */
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export function pedirAdulto(): Promise<boolean> {
  return new Promise((resolver) => {
    const panel = el('dialogo-adulto');
    const campo = el<HTMLInputElement>('adulto-campo');
    const aceptar = el<HTMLButtonElement>('adulto-aceptar');
    const cancelar = el<HTMLButtonElement>('adulto-cancelar');
    const error = el('adulto-error');
    const rng = new Rng((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
    let desafio = desafioAdulto(rng);
    el('adulto-titulo').textContent = t('compras.adulto.titulo');
    el('adulto-texto').textContent = t('compras.adulto.texto');
    aceptar.textContent = t('compras.adulto.aceptar');
    cancelar.textContent = t('compras.adulto.cancelar');
    campo.placeholder = t('compras.adulto.respuesta');
    const nueva = () => {
      desafio = desafioAdulto(rng);
      el('adulto-cuenta').textContent = `${desafio.texto} = ?`;
      campo.value = '';
    };
    nueva();
    error.textContent = '';
    panel.classList.add('abierto');
    setTimeout(() => campo.focus(), 50);
    const cerrar = (valor: boolean) => {
      panel.classList.remove('abierto');
      aceptar.onclick = cancelar.onclick = null;
      campo.onkeydown = null;
      campo.blur();
      resolver(valor);
    };
    const probar = () => {
      if (Number(campo.value.trim()) === desafio.respuesta && campo.value.trim() !== '') cerrar(true);
      else {
        error.textContent = t('compras.adulto.mal');
        nueva();
        campo.focus();
      }
    };
    aceptar.onclick = probar;
    cancelar.onclick = () => cerrar(false);
    campo.onkeydown = (e) => {
      if (e.key === 'Enter') probar();
      else if (e.key === 'Escape') cerrar(false);
    };
  });
}
