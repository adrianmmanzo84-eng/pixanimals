"""
Arte HD de las criaturas (D243): a partir de las mismas hojas de arte/originales/ que usa importar_arte.py,
genera versiones reducidas en suave (sin limitar colores ni pixelar) con el MISMO encuadre que los sprites de
96×96: igual tamaño relativo por etapa, centradas y apoyadas en la base del lienzo.

  public/hd/<sprites>_frente.webp   384×384 (×4 del lienzo de 96): combate y pantallas de detalle
  public/hd/<sprites>_espalda.webp  384×384
  public/hd/<sprites>_mini.webp     128×128: listas, tarjetas, menú
  src/ui/hd-lista.json              qué sprites tienen versión HD (el juego usa el pixel art para el resto)

Uso: python3 scripts/importar_hd.py [familia ...]   (sin argumentos: todas las familias de arte/originales)
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from importar_arte import EXTRA_RAMA, NO_CRIATURAS, ORIG, RAIZ, TAMANOS, celdas, rama  # noqa: E402

K = 4
LIENZO = 96 * K
MINI = 128
DESTINO = os.path.join(RAIZ, 'public', 'hd')
LISTA = os.path.join(RAIZ, 'src', 'ui', 'hd-lista.json')


def reducir_suave(recorte, factor):
    """Reducción de alta calidad con alfa premultiplicado (sin halos claros ni oscuros en los bordes)."""
    w = max(1, round(recorte.width * factor))
    h = max(1, round(recorte.height * factor))
    a = np.array(recorte).astype(np.float64)
    alfa = a[:, :, 3:4] / 255.0
    pre = Image.fromarray(np.concatenate([a[:, :, :3] * alfa, a[:, :, 3:4]], axis=2).round().astype(np.uint8), 'RGBA')
    r = np.array(pre.resize((w, h), Image.LANCZOS)).astype(np.float64)
    al = r[:, :, 3:4] / 255.0
    rgb = np.where(al > 0.004, r[:, :, :3] / np.maximum(al, 1e-6), 0).clip(0, 255)
    out = np.concatenate([rgb, r[:, :, 3:4]], axis=2).round().clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def en_lienzo(img, lado):
    """Igual que importar_arte.lienzo: centrada y apoyada en la base (margen de 1 px de 96, ×K)."""
    out = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    x0 = (lado - img.width) // 2
    y0 = lado - K - img.height
    out.alpha_composite(img, (x0, max(0, y0)))
    return out


def guardar(img, nombre):
    img.save(os.path.join(DESTINO, nombre), 'WEBP', quality=90, method=6)


def convertir(frente, espalda, tamano, nombre):
    factor = tamano * K / max(frente.width, frente.height, espalda.width, espalda.height)
    f = en_lienzo(reducir_suave(frente, factor), LIENZO)
    e = en_lienzo(reducir_suave(espalda, factor), LIENZO)
    guardar(f, f'{nombre}_frente.webp')
    guardar(e, f'{nombre}_espalda.webp')
    guardar(reducir_suave(f, MINI / LIENZO), f'{nombre}_mini.webp')


def main():
    os.makedirs(DESTINO, exist_ok=True)
    pedidas = set(sys.argv[1:])
    lista = set(json.load(open(LISTA))) if os.path.exists(LISTA) else set()
    for archivo in sorted(os.listdir(ORIG)):
        if not archivo.endswith('.png') or archivo.startswith(NO_CRIATURAS):
            continue
        base = archivo[:-4]
        familia = base.split('_')[0]
        if pedidas and familia not in pedidas:
            continue
        img = Image.open(os.path.join(ORIG, archivo)).convert('RGBA')
        es_rama = re.fullmatch(r'([a-z]+)_([1-4])([a-z])', base)
        if es_rama:
            convertir(*rama(img), TAMANOS[int(es_rama.group(2)) - 1] + EXTRA_RAMA, base)
            lista.add(base)
            print(f'✓ HD rama {base}')
        elif re.fullmatch(r'[a-z]+', base):
            frentes, espaldas = celdas(img)
            for i in range(len(frentes)):
                convertir(frentes[i], espaldas[i], TAMANOS[i], f'{base}_{i + 1}')
                lista.add(f'{base}_{i + 1}')
            print(f'✓ HD {base}: {len(frentes)} etapa(s)')
    with open(LISTA, 'w') as f:
        json.dump(sorted(lista), f, indent=1)
        f.write('\n')


if __name__ == '__main__':
    main()
