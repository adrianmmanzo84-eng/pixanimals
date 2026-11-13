"""
Convierte las láminas de efectos por ataque (arte/originales/efectos_ataques/) en los PNG del juego.

Cada lámina reúne los efectos de una familia (2×2 o 4×2 los ataques; 2×2 los Definitivos:
impacto a la izquierda y composición de pantalla a la derecha). indice.csv dice qué pieza
va en qué fila y columna y su tamaño de destino.

Corte: las líneas de corte van por los valles de la proyección del alfa cerca de donde
caería la cuadrícula; cada mancha (componente conexo) va a la celda donde cae su centro,
así no se cortan los trazos que cruzan la línea. Luego se recorta al contenido, se reduce
(lado mayor = tamaño de destino; las de pantalla, al ancho 240) y se cuantiza.

Salida: public/efectos/ataques/<id>.png, <id>_pantalla.png y src/ui/efectos-ataques.json
Uso:    python3 scripts/importar_efectos_ataques.py      (requiere Pillow, numpy y scipy)
"""
import csv
import json
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(__file__))
from importar_arte import reducir, cuantizar  # noqa: E402

RAIZ = os.path.join(os.path.dirname(__file__), '..')
ORIG = os.path.join(RAIZ, 'arte', 'originales', 'efectos_ataques')
DESTINO = os.path.join(RAIZ, 'public', 'efectos', 'ataques')
LISTA = os.path.join(RAIZ, 'src', 'ui', 'efectos-ataques.json')
COLORES = {64: 16, 96: 20, 128: 24, 240: 32}


def valle(perfil, desde, hasta):
    seg = perfil[desde:hasta]
    m = seg.min()
    idx = np.where(seg <= m + max(1, m * 0.05))[0]
    return desde + int(idx[len(idx) // 2])


def cortes(alfa, n, eje, frac=0.18):
    perfil = alfa.sum(axis=eje)
    largo = len(perfil)
    r = [0]
    for k in range(1, n):
        c = largo * k / n
        d = int(largo * frac / n * 2)
        r.append(valle(perfil, int(c - d), int(c + d)))
    r.append(largo)
    return r


def cajas_lamina(alfa, ataques, ncol):
    ys = cortes(alfa, 2, 1)
    cajas = {}
    for f in range(2):
        banda = alfa[ys[f]:ys[f + 1]]
        if ataques:
            xs = cortes(banda, ncol, 0)
        else:
            # Definitivos: la composición de pantalla es más ancha; el corte cae entre el 28 % y el 55 %.
            perfil = banda.sum(axis=0)
            xs = [0, valle(perfil, int(len(perfil) * 0.28), int(len(perfil) * 0.55)), len(perfil)]
        for c in range(len(xs) - 1):
            cajas[(f + 1, c + 1)] = (ys[f], ys[f + 1], xs[c], xs[c + 1])
    return cajas


def piezas(img, cajas):
    arr = np.array(img)
    a = arr[:, :, 3] > 24
    lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=2))
    centros = ndimage.center_of_mass(a, lab, range(1, n + 1))
    tam = ndimage.sum(a, lab, range(1, n + 1))
    res = []
    for (y0, y1, x0, x1) in cajas:
        keep = np.zeros(n + 1, bool)
        for i, (cy, cx) in enumerate(centros):
            if y0 <= cy < y1 and x0 <= cx < x1 and tam[i] >= 6:
                keep[i + 1] = True
        m = keep[lab] & (arr[:, :, 3] > 0)
        out = arr.copy()
        out[~m] = 0
        ys, xs = np.where(m)
        res.append(Image.fromarray(out).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)))
    return res


def convertir(img, lado, colores):
    rgb, mask = reducir(img, lado / max(img.width, img.height) if lado != 240 else 240 / img.width)
    [(rgb, mask)] = cuantizar([(rgb, mask)], colores)
    out = np.zeros((*mask.shape, 4), np.uint8)
    out[:, :, :3] = rgb
    out[:, :, 3] = mask * 255
    out[out[:, :, 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


if __name__ == '__main__':
    os.makedirs(DESTINO, exist_ok=True)
    filas = list(csv.DictReader(open(os.path.join(ORIG, 'indice.csv'), encoding='utf-8-sig'), delimiter=';'))
    por_lamina = {}
    for f in filas:
        por_lamina.setdefault(os.path.basename(f['lamina']), []).append(f)
    lista = {}
    for lam, fs in sorted(por_lamina.items()):
        img = Image.open(os.path.join(ORIG, lam)).convert('RGBA')
        alfa = np.array(img)[:, :, 3].astype(float) / 255
        ataques = 'ataques' in lam
        cajas = cajas_lamina(alfa, ataques, max(int(f['columna']) for f in fs))
        for f, p in zip(fs, piezas(img, [cajas[(int(f['fila']), int(f['columna']))] for f in fs])):
            lado = int(f['ancho_destino'])
            res = convertir(p, lado, COLORES[lado])
            nombre = f['archivo_objetivo'][:-4]
            res.save(os.path.join(DESTINO, nombre + '.png'))
            ident = nombre.removesuffix('_pantalla')
            lista.setdefault(ident, {})
            lista[ident]['pantalla' if f['variante'] == 'pantalla' else 'impacto'] = [res.width, res.height]
        print(f'✓ {lam}: {len(fs)} piezas')
    with open(LISTA, 'w', encoding='utf-8') as fh:
        json.dump({k: lista[k] for k in sorted(lista)}, fh, ensure_ascii=False, indent=1)
    print(f'{len(lista)} ataques con efecto propio')
