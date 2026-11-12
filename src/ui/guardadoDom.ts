import { exportarCodigo, importarCodigo } from '../core/estado/guardado';
import { juego } from '../juego';
import { t } from '../i18n/i18n';

/** Panel de guardado: es HTML normal (no lienzo) para poder seleccionar, copiar y pegar el código. */
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let preparado = false;
let alCerrar: (() => void) | null = null;

export function abrirGuardado(cerrar: () => void): void {
  const panel = el('guardado');
  const codigo = el<HTMLTextAreaElement>('g-codigo');
  const estado = el('g-estado');
  const borrar = el<HTMLButtonElement>('g-borrar');
  alCerrar = cerrar;
  if (!preparado) {
    preparado = true;
    el('g-titulo').textContent = t('g.titulo');
    el('g-texto').textContent = t('g.auto');
    el('g-copiar').textContent = t('g.copiar');
    el('g-cargar').textContent = t('g.cargar');
    el('g-cerrar').textContent = t('g.cerrar');
    el('g-copiar').addEventListener('click', () => {
      codigo.select();
      navigator.clipboard.writeText(codigo.value).then(
        () => (estado.textContent = t('g.copiado')),
        () => (estado.textContent = t('g.noCopiado')),
      );
    });
    el('g-cargar').addEventListener('click', () => {
      const nuevo = importarCodigo(codigo.value);
      if (!nuevo) {
        estado.textContent = t('g.invalido');
        return;
      }
      juego.reemplazar(nuevo);
      estado.textContent = t('g.cargado');
    });
    borrar.addEventListener('click', () => {
      // Dos pulsaciones para borrar: no hay vuelta atrás.
      if (borrar.dataset.armado !== '1') {
        borrar.dataset.armado = '1';
        borrar.textContent = t('g.seguro');
        return;
      }
      juego.borrar();
      codigo.value = '';
      estado.textContent = t('g.borrado');
      borrar.dataset.armado = '';
      borrar.textContent = t('g.borrar');
    });
    el('g-cerrar').addEventListener('click', () => {
      panel.classList.remove('abierto');
      alCerrar?.();
    });
  }
  borrar.dataset.armado = '';
  borrar.textContent = t('g.borrar');
  estado.textContent = '';
  codigo.value = juego.estado.bienvenida ? exportarCodigo(juego.estado) : '';
  panel.classList.add('abierto');
}
