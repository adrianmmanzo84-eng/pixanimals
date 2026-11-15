import { t } from '../i18n/i18n';

/**
 * Ventana para escribir un apodo (HTML, para que funcione el teclado del teléfono).
 * Devuelve el texto escrito (vacío = quitar el apodo) o null si se canceló.
 */
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export function pedirApodo(nombreEspecie: string, actual: string): Promise<string | null> {
  return new Promise((resolver) => {
    const panel = el('dialogo-apodo');
    const campo = el<HTMLInputElement>('apodo-campo');
    const aceptar = el<HTMLButtonElement>('apodo-aceptar');
    const cancelar = el<HTMLButtonElement>('apodo-cancelar');
    el('apodo-titulo').textContent = t('apodo.titulo', { n: nombreEspecie });
    el('apodo-texto').textContent = t('apodo.texto');
    aceptar.textContent = t('apodo.aceptar');
    cancelar.textContent = t('apodo.cancelar');
    campo.value = actual;
    campo.placeholder = nombreEspecie;
    panel.classList.add('abierto');
    setTimeout(() => campo.focus(), 50);
    const cerrar = (valor: string | null) => {
      panel.classList.remove('abierto');
      aceptar.onclick = cancelar.onclick = null;
      campo.onkeydown = null;
      campo.blur();
      resolver(valor);
    };
    aceptar.onclick = () => cerrar(campo.value);
    cancelar.onclick = () => cerrar(null);
    campo.onkeydown = (e) => {
      if (e.key === 'Enter') cerrar(campo.value);
      else if (e.key === 'Escape') cerrar(null);
    };
  });
}
