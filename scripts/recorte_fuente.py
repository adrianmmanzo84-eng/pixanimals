"""Recorta las criaturas de una lámina fuente del autor: fondo difuminado, 3 filas × 4 columnas
(fila 1 frente, fila 2 espalda, fila 3 íconos), sin posiciones fijas.

El fondo es liso y el pixel art tiene bordes nítidos: se marca lo que tiene borde, se rellenan los huecos,
se juntan las piezas a pocos píxeles entre sí (cada grupo es una criatura) y se ordenan en filas y columnas."""
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage


def mascara(img):
    g = img.astype(np.float32)
    gx = np.abs(cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3)).max(axis=2)
    gy = np.abs(cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)).max(axis=2)
    borde = (np.maximum(gx, gy) > 60).astype(np.uint8)
    borde = cv2.morphologyEx(borde, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    lleno = ndimage.binary_fill_holes(borde).astype(np.uint8)
    return cv2.morphologyEx(lleno, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))


def grupos(m):
    # Piezas a menos de ~6 px entre sí son la misma criatura (garras, cuernos, colas sueltas).
    cerca = cv2.dilate(m, np.ones((5, 13), np.uint8))  # más en horizontal: las filas están muy juntas
    n, lab, st, _ = cv2.connectedComponentsWithStats(cerca)
    lab = lab * m  # solo los píxeles reales
    areas = np.bincount(lab.ravel(), minlength=n)
    cajas = []
    for k in range(1, n):
        if areas[k] == 0:
            continue
        ys, xs = np.nonzero(lab == k)
        cajas.append({'k': [k], 'b': [xs.min(), ys.min(), xs.max() + 1, ys.max() + 1], 'area': int(areas[k])})
    # Si una criatura de la fila de arriba toca a la de abajo, el grupo queda muy alto: se corta por la fila más vacía.
    alto_max = m.shape[0] * 0.55
    nuevo = n
    for c in list(cajas):
        x0, y0, x1, y1 = c['b']
        if y1 - y0 <= alto_max:
            continue
        zona = lab[y0:y1, x0:x1] == c['k'][0]
        perfil = zona.sum(axis=1)
        a, b = int((y1 - y0) * 0.3), int((y1 - y0) * 0.7)
        corte = y0 + a + int(np.argmin(perfil[a:b]))
        abajo = (lab == c['k'][0]) & (np.arange(lab.shape[0])[:, None] >= corte)
        lab[abajo] = nuevo
        cajas.remove(c)
        for k, (ya, yb) in ((c['k'][0], (y0, corte)), (nuevo, (corte, y1))):
            ys, xs = np.nonzero(lab[ya:yb] == k)
            cajas.append({'k': [k], 'b': [xs.min(), ya + ys.min(), xs.max() + 1, ya + ys.max() + 1], 'area': len(xs)})
        nuevo += 1
    cajas = sorted(cajas, key=lambda c: -c['area'])[:12]
    return lab, cajas


def recortar(src):
    img = cv2.imread(src)
    m = mascara(img)
    lab, cajas = grupos(m)
    # Filas: por el centro vertical, cortando en los dos saltos más grandes.
    cajas.sort(key=lambda c: (c['b'][1] + c['b'][3]) / 2)
    centros = [(c['b'][1] + c['b'][3]) / 2 for c in cajas]
    saltos = sorted(range(1, len(centros)), key=lambda i: centros[i] - centros[i - 1])[-2:]
    cortes = sorted(saltos)
    filas = [cajas[:cortes[0]], cajas[cortes[0]:cortes[1]], cajas[cortes[1]:]]
    out = {}
    for r, vista in enumerate(['frente', 'espalda']):
        for c, g in enumerate(sorted(filas[r], key=lambda g: g['b'][0])):
            x0, y0, x1, y1 = g['b']
            sel = np.isin(lab[y0:y1, x0:x1], g['k']).astype(np.uint8) * 255
            rgba = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2RGBA)
            rgba[:, :, 3] = sel
            out[(c, vista)] = Image.fromarray(rgba)
    return out


if __name__ == '__main__':
    res = recortar(sys.argv[1])
    lam = Image.new('RGBA', (2000, 1000), (40, 120, 200, 255))
    for (c, v), im in res.items():
        lam.alpha_composite(im, (c * 500, 0 if v == 'frente' else 500))
    lam.save(sys.argv[2])
