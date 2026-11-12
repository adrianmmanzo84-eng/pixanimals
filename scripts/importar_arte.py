"""
Convierte las hojas de arte de arte/originales/ en los archivos que usa el juego.

  Criaturas: una hoja por familia (brasa.png, marea.png, brote.png) con fondo transparente,
             4 columnas (etapas 1 a 4) y 2 filas (arriba de frente, abajo de espaldas).
             Salida: public/sprites/<familia>_<etapa>_{frente,espalda,icono}.png
             64x64 (icono 64x32), 15 colores como máximo, sin semitransparencias.
  Fondos:    fondo_<id>.png (proporción 2:1, con las dos plataformas dibujadas).
             Salida: public/fondos/<id>.jpg de 960x448.

  Portada:   portada.png (ilustración apaisada). Salida: public/fondos/portada.jpg de 960 de ancho.
  Cartas:    carta_dorso.png (dorso de carta, vertical, fondo transparente).
             Salida: public/ui/carta_dorso.png de 62x92 (colores sin limitar: los íconos chicos se perdían), sin semitransparencias.

Uso: python3 scripts/importar_arte.py      (requiere Pillow y numpy)
"""
import os
import numpy as np
from PIL import Image

RAIZ = os.path.join(os.path.dirname(__file__), '..')
ORIG = os.path.join(RAIZ, 'arte', 'originales')
# Tamaño máximo (ancho o alto) de cada etapa dentro del lienzo de 64x64: crecer se tiene que notar.
TAMANOS = [40, 50, 58, 64]


def bandas(v, minimo, hueco):
    res, ini, vacio = [], None, 0
    for i, x in enumerate(v):
        if x >= minimo:
            if ini is None:
                ini = i
            vacio = 0
        elif ini is not None:
            vacio += 1
            if vacio > hueco:
                res.append((ini, i - vacio))
                ini = None
    if ini is not None:
        res.append((ini, len(v) - 1))
    return res


def celdas(img):
    """Devuelve [[frente x4], [espalda x4]] como recortes RGBA ajustados a cada criatura."""
    a = np.array(img)
    lleno = a[:, :, 3] > 128
    filas = [b for b in bandas(lleno.sum(axis=1), 4, 6) if b[1] - b[0] > 40]
    assert len(filas) == 2, f'se esperaban 2 filas y hay {len(filas)}'
    salida = []
    for y0, y1 in filas:
        cols = bandas(lleno[y0:y1 + 1].sum(axis=0), 2, 14)
        assert len(cols) == 4, f'se esperaban 4 columnas y hay {len(cols)}'
        fila = []
        for x0, x1 in cols:
            sub = lleno[y0:y1 + 1, x0:x1 + 1]
            ys = np.where(sub.any(axis=1))[0]
            fila.append(img.crop((x0, y0 + ys[0], x1 + 1, y0 + ys[-1] + 1)))
        salida.append(fila)
    return salida


def reducir(recorte, factor):
    """Reduce con promedio de área (alfa premultiplicado) y deja cada píxel opaco o transparente."""
    w = max(1, round(recorte.width * factor))
    h = max(1, round(recorte.height * factor))
    a = np.array(recorte).astype(np.float64)
    alfa = a[:, :, 3:4] / 255.0
    pre = Image.fromarray(np.concatenate([a[:, :, :3] * alfa, a[:, :, 3:4]], axis=2).astype(np.uint8), 'RGBA')
    r = np.array(pre.resize((w, h), Image.BOX)).astype(np.float64)
    al = r[:, :, 3:4] / 255.0
    rgb = np.where(al > 0, r[:, :, :3] / np.maximum(al, 1e-6), 0).clip(0, 255)
    return rgb.astype(np.uint8), (r[:, :, 3] >= 128)


def cuantizar(piezas, colores=15):
    """Misma paleta de 15 colores para el frente y la espalda de una criatura."""
    px = np.concatenate([rgb[mask] for rgb, mask in piezas])
    tira = Image.fromarray(px.reshape(1, -1, 3), 'RGB').quantize(colores, method=Image.MEDIANCUT, dither=Image.NONE)
    paleta = tira.convert('RGB')
    pal = np.array(tira.getpalette()[: colores * 3]).reshape(-1, 3)
    del paleta
    res = []
    for rgb, mask in piezas:
        d = ((rgb[:, :, None, :].astype(int) - pal[None, None, :, :]) ** 2).sum(axis=3)
        res.append((pal[d.argmin(axis=2)].astype(np.uint8), mask))
    return res


def lienzo(rgb, mask, ancho=64, alto=64):
    """Coloca la criatura centrada y apoyada en la base del lienzo."""
    h, w = mask.shape
    out = np.zeros((alto, ancho, 4), np.uint8)
    x0 = (ancho - w) // 2
    y0 = alto - 1 - h
    out[y0:y0 + h, x0:x0 + w, :3] = rgb
    out[y0:y0 + h, x0:x0 + w, 3] = mask * 255
    out[out[:, :, 3] == 0] = 0
    return out


def icono(frente):
    """Icono de 2 cuadros de 32x32: el segundo baja un píxel."""
    img = Image.fromarray(frente, 'RGBA')
    caja = img.getbbox()
    rec = img.crop(caja)
    f = min(30 / rec.width, 30 / rec.height)
    peq = rec.resize((max(1, round(rec.width * f)), max(1, round(rec.height * f))), Image.NEAREST)
    hoja = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    for cuadro in (0, 1):
        hoja.alpha_composite(peq, (cuadro * 32 + (32 - peq.width) // 2, 31 - peq.height + cuadro))
    return hoja


def criaturas():
    destino = os.path.join(RAIZ, 'public', 'sprites')
    os.makedirs(destino, exist_ok=True)
    for familia in ('brasa', 'marea', 'brote'):
        ruta = os.path.join(ORIG, f'{familia}.png')
        if not os.path.exists(ruta):
            continue
        frentes, espaldas = celdas(Image.open(ruta).convert('RGBA'))
        for i in range(4):
            factor = TAMANOS[i] / max(frentes[i].width, frentes[i].height, espaldas[i].width, espaldas[i].height)
            f, e = cuantizar([reducir(frentes[i], factor), reducir(espaldas[i], factor)])
            lf, le = lienzo(*f), lienzo(*e)
            Image.fromarray(lf, 'RGBA').save(os.path.join(destino, f'{familia}_{i + 1}_frente.png'))
            Image.fromarray(le, 'RGBA').save(os.path.join(destino, f'{familia}_{i + 1}_espalda.png'))
            icono(lf).save(os.path.join(destino, f'{familia}_{i + 1}_icono.png'))
        print(f'✓ {familia}: 4 etapas')


def fondos():
    destino = os.path.join(RAIZ, 'public', 'fondos')
    os.makedirs(destino, exist_ok=True)
    for nombre in sorted(os.listdir(ORIG)):
        if not nombre.startswith('fondo_'):
            continue
        img = Image.open(os.path.join(ORIG, nombre)).convert('RGB')
        # Se amplía un poco y se recorta para que las plataformas queden bajo las criaturas.
        f = 0.6 * 1774 / img.width
        img = img.resize((round(img.width * f), round(img.height * f)), Image.LANCZOS)
        x0 = (img.width - 960) // 2
        img.crop((x0, 10, x0 + 960, 458)).save(os.path.join(destino, nombre[6:-4] + '.jpg'), quality=86, optimize=True)
        print(f'✓ fondo {nombre[6:-4]}')


def portada():
    ruta = os.path.join(ORIG, 'portada.png')
    if not os.path.exists(ruta):
        return
    img = Image.open(ruta).convert('RGB')
    # Se ajusta al ancho: las criaturas dibujadas en los bordes tienen que verse enteras.
    img = img.resize((960, round(img.height * 960 / img.width)), Image.LANCZOS)
    img.save(os.path.join(RAIZ, 'public', 'fondos', 'portada.jpg'), quality=88, optimize=True)
    print(f'✓ portada 960x{img.height}')


def carta():
    ruta = os.path.join(ORIG, 'carta_dorso.png')
    if not os.path.exists(ruta):
        return
    img = Image.open(ruta).convert('RGBA')
    img = img.crop(img.getbbox())
    rgb, mask = reducir(img, 92 / img.height)
    out = np.zeros((*mask.shape, 4), np.uint8)
    out[:, :, :3] = rgb
    out[:, :, 3] = mask * 255
    out[out[:, :, 3] == 0] = 0
    destino = os.path.join(RAIZ, 'public', 'ui')
    os.makedirs(destino, exist_ok=True)
    Image.fromarray(out, 'RGBA').save(os.path.join(destino, 'carta_dorso.png'))
    print(f'✓ dorso de carta {out.shape[1]}x{out.shape[0]}')


if __name__ == '__main__':
    criaturas()
    fondos()
    portada()
    carta()
