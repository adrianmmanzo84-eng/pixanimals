"""
Convierte los efectos de ataque de arte/originales/efectos/ en los PNG que usa el juego.

Cada original es una imagen estática del momento principal del efecto (fondo transparente).
Se recorta al contenido, se reduce manteniendo la proporción hasta que su lado mayor mida
el tamaño indicado, se cuantiza a 16 colores y cada píxel queda opaco o transparente.
La animación (aparecer, viajar, cerrarse, crecer...) la hace el código en src/ui/efectos.ts.

Salida: public/efectos/<nombre>.png
Uso:    python3 scripts/importar_efectos.py      (requiere Pillow y numpy)
"""
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from importar_arte import reducir, cuantizar  # noqa: E402

RAIZ = os.path.join(os.path.dirname(__file__), '..')
ORIG = os.path.join(RAIZ, 'arte', 'originales', 'efectos')
DESTINO = os.path.join(RAIZ, 'public', 'efectos')

# Lado mayor en píxeles del mundo (240x160). Las criaturas miden de 40 a 64.
TAMANO_BASE = 64
TAMANOS = {
    'llamarada': 96, 'ola': 96, 'hojas': 96,   # ataques finales
    'mirada': 112,                             # rayo que cruza buena parte del campo
    'grito': 48, 'empujon': 48, 'polen': 56,
}


def convertir(nombre):
    img = Image.open(os.path.join(ORIG, nombre + '.png')).convert('RGBA')
    img = img.crop(img.getbbox())
    lado = TAMANOS.get(nombre, TAMANO_BASE)
    rgb, mask = reducir(img, lado / max(img.width, img.height))
    [(rgb, mask)] = cuantizar([(rgb, mask)], 16)
    out = np.zeros((*mask.shape, 4), np.uint8)
    out[:, :, :3] = rgb
    out[:, :, 3] = mask * 255
    out[out[:, :, 3] == 0] = 0
    Image.fromarray(out, 'RGBA').save(os.path.join(DESTINO, nombre + '.png'))
    return out.shape[1], out.shape[0]


if __name__ == '__main__':
    os.makedirs(DESTINO, exist_ok=True)
    for archivo in sorted(os.listdir(ORIG)):
        if archivo.endswith('.png'):
            w, h = convertir(archivo[:-4])
            print(f'✓ {archivo[:-4]}: {w}x{h}')
