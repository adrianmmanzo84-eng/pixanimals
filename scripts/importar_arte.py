"""
Convierte las hojas de arte de arte/originales/ en los archivos que usa el juego.

  Criaturas: una hoja por familia (<familia>.png, por ejemplo brasa.png) con fondo transparente,
             de 1 a 4 columnas (etapas 1 a 4) y 2 filas (arriba de frente, abajo de espaldas).
             Ramas: <familia>_<etapa><letra>.png (por ejemplo brasa_4b.png), una sola criatura:
             de frente arriba y de espaldas abajo, o de frente a la izquierda y de espaldas a la derecha.
             Las ramas usan 24 colores: el aura gasta paleta y con 15 se perdían los detalles del cuerpo.
             Salida: public/sprites/<familia>_<etapa>[letra]_{frente,espalda,icono}.png
             96x96 (icono 64x32), 15 colores como máximo, sin semitransparencias.
  Fondos:    fondo_<id>.png (proporción 2:1, con las dos plataformas dibujadas).
             Salida: public/fondos/<id>.jpg de 960x448.

  Portada:   portada.png (ilustración apaisada). Salida: public/fondos/portada.jpg de 960 de ancho.
  Cartas:    carta_dorso.png (dorso de carta, vertical, fondo transparente).
             Salida: public/ui/carta_dorso.png de 62x92 (colores sin limitar: los íconos chicos se perdían), sin semitransparencias.

Uso: python3 scripts/importar_arte.py      (requiere Pillow y numpy)
"""
import os
import re
import numpy as np
from PIL import Image

RAIZ = os.path.join(os.path.dirname(__file__), '..')
ORIG = os.path.join(RAIZ, 'arte', 'originales')
# Tamaño máximo (ancho o alto) de cada etapa dentro del lienzo de 96x96: crecer se tiene que notar.
# Las ramas (formas Eclipse) son algo más grandes que su etapa: llevan aura.
LIENZO = 96
TAMANOS = [36, 48, 62, 80]
EXTRA_RAMA = 6


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
    """Devuelve [[frentes], [espaldas]] (una por columna) como recortes RGBA ajustados a cada criatura."""
    a = np.array(img)
    lleno = a[:, :, 3] > 128
    filas = [b for b in bandas(lleno.sum(axis=1), 4, 6) if b[1] - b[0] > 40]
    assert len(filas) == 2, f'se esperaban 2 filas y hay {len(filas)}'
    salida = []
    for y0, y1 in filas:
        cols = bandas(lleno[y0:y1 + 1].sum(axis=0), 2, 14)
        assert 1 <= len(cols) <= 4, f'se esperaban de 1 a 4 columnas y hay {len(cols)}'
        fila = []
        for x0, x1 in cols:
            sub = lleno[y0:y1 + 1, x0:x1 + 1]
            ys = np.where(sub.any(axis=1))[0]
            fila.append(img.crop((x0, y0 + ys[0], x1 + 1, y0 + ys[-1] + 1)))
        salida.append(fila)
    assert len(salida[0]) == len(salida[1]), 'la fila de frente y la de espalda tienen distinta cantidad de criaturas'
    return salida


def rama(img):
    """Frente y espalda de una sola criatura, en 2 filas o lado a lado. Ignora el polvo suelto del aura."""
    a = np.array(img)
    lleno = a[:, :, 3] > 200
    filas = [b for b in bandas(lleno.sum(axis=1), 4, 6) if b[1] - b[0] > 40]
    if len(filas) == 2:
        f, e = celdas(img)
        return f[0], e[0]
    cols = [b for b in bandas(lleno.sum(axis=0), 4, 20) if b[1] - b[0] > 40]
    assert len(cols) == 2, f'rama: se esperaban 2 vistas y hay {len(cols)}'
    vistas = []
    for x0, x1 in cols:
        sub = lleno[:, x0:x1 + 1]
        ys = np.where(sub.sum(axis=1) >= 2)[0]
        xs = np.where(sub.sum(axis=0) >= 2)[0]
        vistas.append(img.crop((x0 + xs[0], ys[0], x0 + xs[-1] + 1, ys[-1] + 1)))
    return vistas[0], vistas[1]


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


def lienzo(rgb, mask, ancho=LIENZO, alto=LIENZO):
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


NO_CRIATURAS = ('fondo_', 'portada', 'carta_dorso')


def convertir(frente, espalda, tamano, destino, nombre, colores=15):
    factor = tamano / max(frente.width, frente.height, espalda.width, espalda.height)
    f, e = cuantizar([reducir(frente, factor), reducir(espalda, factor)], colores)
    lf, le = lienzo(*f), lienzo(*e)
    Image.fromarray(lf, 'RGBA').save(os.path.join(destino, f'{nombre}_frente.png'))
    Image.fromarray(le, 'RGBA').save(os.path.join(destino, f'{nombre}_espalda.png'))
    icono(lf).save(os.path.join(destino, f'{nombre}_icono.png'))


def criaturas():
    """Toda hoja PNG de arte/originales/ que no sea fondo, portada ni dorso es una familia o una rama."""
    destino = os.path.join(RAIZ, 'public', 'sprites')
    os.makedirs(destino, exist_ok=True)
    for archivo in sorted(os.listdir(ORIG)):
        if not archivo.endswith('.png') or archivo.startswith(NO_CRIATURAS):
            continue
        base = archivo[:-4]
        img = Image.open(os.path.join(ORIG, archivo)).convert('RGBA')
        es_rama = re.fullmatch(r'([a-z]+)_([1-4])([a-z])', base)
        if es_rama:
            # Rama: una sola criatura; su tamaño es el de su etapa.
            convertir(*rama(img), TAMANOS[int(es_rama.group(2)) - 1] + EXTRA_RAMA, destino, base, colores=24)
            print(f'✓ rama {base}')
        elif re.fullmatch(r'[a-z]+', base):
            frentes, espaldas = celdas(img)
            for i in range(len(frentes)):
                convertir(frentes[i], espaldas[i], TAMANOS[i], destino, f'{base}_{i + 1}')
            print(f'✓ {base}: {len(frentes)} etapa(s)')
        else:
            print(f'· {archivo}: nombre no reconocido (usa familia.png o familia_4b.png); se omite')


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
