"""
Bloques de la Mina Pixel en pixel art de 16×16, uno por tipo y por zona (cada zona tiene su paleta).
Salida: public/mina/bloques.png — una fila por zona (5) y una columna por tipo, en este orden:
  tierra, piedra, dura, roca, irrompible, moneda, gema, baya, cofre, corazon, pinchos, gas, lava, bomba, guarida,
  grieta1, grieta2 (las dos últimas son grietas transparentes que se superponen al golpear).
Uso: python3 scripts/generar_bloques.py   (la escena carga la hoja con frames de 16×16)
"""
import os
import random
from PIL import Image

RAIZ = os.path.join(os.path.dirname(__file__), '..')
TIPOS = ['tierra', 'piedra', 'dura', 'roca', 'irrompible', 'moneda', 'gema', 'baya', 'cofre', 'corazon',
         'pinchos', 'gas', 'lava', 'bomba', 'guarida', 'grieta1', 'grieta2']
T = 16


def hx(c):
    c = c.lstrip('#')
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


# Por zona: tierra (oscuro, medio, claro, detalle), piedra (osc, med, claro), dura (osc, med, claro), acento, gema
ZONAS = [
    dict(t=['#4a2e1a', '#7a4f2e', '#a06a3e', '#3f8a3a'], p=['#565a66', '#80848f', '#a9adb7'], d=['#2c2f3d', '#454a5e', '#666c86'], a='#6fcf5a', g='#5fe0d0'),
    dict(t=['#3a3a34', '#5c5a4c', '#7c7862', '#3f7f8f'], p=['#3e5468', '#5f7d96', '#86a6bd'], d=['#22313f', '#344a5c', '#4f6a80'], a='#5fd0ff', g='#7fb0ff'),
    dict(t=['#3e3448', '#5e5070', '#7e6e94', '#9a7ad0'], p=['#5a5278', '#7e76a6', '#a59ccc'], d=['#2a2140', '#3f3360', '#5b4a86'], a='#f2e05a', g='#6ff0ff'),
    dict(t=['#2e2422', '#4c3c38', '#6a544e', '#ff8a3a'], p=['#3e2a2a', '#5c3e3c', '#7e5652'], d=['#1e1414', '#30201f', '#4a302e'], a='#ff9a3a', g='#ff5a5a'),
    dict(t=['#221f30', '#363150', '#4c466c', '#b46fe0'], p=['#2e2a46', '#4a4466', '#68608c'], d=['#141222', '#221f36', '#352f52'], a='#c47aff', g='#e070ff'),
]


def nuevo():
    return Image.new('RGBA', (T, T), (0, 0, 0, 0))


def base(colores, rnd, motas=26, bisel=True):
    """Bloque relleno con motas y bisel (arriba-izquierda claro, abajo-derecha oscuro)."""
    osc, med, cla = colores[:3]
    im = Image.new('RGBA', (T, T), hx(med))
    px = im.load()
    for _ in range(motas):
        x, y = rnd.randrange(1, T - 1), rnd.randrange(1, T - 1)
        px[x, y] = hx(osc if rnd.random() < 0.55 else cla)
        if rnd.random() < 0.35 and x + 1 < T - 1:
            px[x + 1, y] = px[x, y]
    if bisel:
        for i in range(T):
            px[i, 0] = hx(cla)
            px[0, i] = hx(cla)
            px[i, T - 1] = hx(osc)
            px[T - 1, i] = hx(osc)
    return im


def dibujar(im, puntos, color):
    px = im.load()
    for x, y in puntos:
        if 0 <= x < T and 0 <= y < T:
            px[x, y] = hx(color) if isinstance(color, str) else color


def mapa(im, filas, paleta, ox=0, oy=0):
    """Dibuja una figura a partir de filas de texto ('.' = nada, otra letra = color de la paleta)."""
    px = im.load()
    for y, f in enumerate(filas):
        for x, ch in enumerate(f):
            if ch != '.' and 0 <= x + ox < T and 0 <= y + oy < T:
                px[x + ox, y + oy] = hx(paleta[ch])


def tierra(z, rnd):
    im = base(z['t'], rnd, 34)
    # raíces o vetas del color de detalle
    for _ in range(2):
        x, y = rnd.randrange(2, 13), rnd.randrange(2, 13)
        dibujar(im, [(x, y), (x + 1, y + 1), (x + 1, y + 2)], z['t'][3])
    return im


def piedra(z, rnd):
    im = base(z['p'], rnd, 18)
    # grietas suaves de la piedra
    x, y = rnd.randrange(3, 8), rnd.randrange(3, 8)
    dibujar(im, [(x, y), (x + 1, y), (x + 2, y + 1), (x + 3, y + 1), (x + 4, y + 2)], z['p'][0])
    dibujar(im, [(x + 6, y + 6), (x + 7, y + 6), (x + 7, y + 7)], z['p'][0])
    return im


def dura(z, rnd):
    im = base(z['d'], rnd, 22)
    for _ in range(3):
        x, y = rnd.randrange(2, 13), rnd.randrange(2, 13)
        dibujar(im, [(x, y)], z['a'])
    return im


def roca(z, rnd):
    im = nuevo()
    o, m, c = z['p']
    mapa(im, [
        '.....oooooo.....',
        '...oommmmmmoo...',
        '..ommccmmmmmmo..',
        '.ommcccmmmmmmmo.',
        '.omccmmmmmmmmmo.',
        'ommcmmmmmmmmmmmo',
        'ommmmmmmmmmmmmmo',
        'ommmmmmmmmmmommo',
        'ommmmmmmmmmoommo',
        'ommmmmmmmmmmmmmo',
        'ommmmommmmmmmmmo',
        '.ommmoommmmmmmo.',
        '.ommmmmmmmmmmmo.',
        '..oommmmmmmmoo..',
        '...oooommoooo...',
        '.....oooooo.....',
    ], {'o': o, 'm': m, 'c': c})
    return im


def irrompible(z, rnd):
    im = Image.new('RGBA', (T, T), hx('#2a2a34'))
    px = im.load()
    for i in range(T):
        for j in range(T):
            if (i + j) % 4 == 0 or (i - j) % 4 == 0:
                px[i, j] = hx('#3c3c4a')
    for i in range(T):
        px[i, 0] = px[0, i] = hx('#5a5a6c')
        px[i, T - 1] = px[T - 1, i] = hx('#14141c')
    for x, y in [(2, 2), (13, 2), (2, 13), (13, 13)]:
        px[x, y] = hx('#9a9ab0')
        px[x + 1, y + 1] = hx('#14141c')
    return im


def con_simbolo(z, rnd, filas, paleta, fondo='t'):
    im = tierra(z, rnd) if fondo == 't' else piedra(z, rnd)
    mapa(im, filas, paleta, 3, 3)
    return im


MONEDA = ['..oooo....', '.oyyyyo...', 'oyywyyyo..', 'oywyyyyo..', 'oyyyyyyo..', 'oyyyyyyo..', '.oyyyyo...', '..oooo....']
GEMA = ['...o......', '..oco.....', '.occco....', 'occwcco...', '.occcco...', '..occo....', '...oo.....']
BAYA = ['....gg....', '...gg.....', '.rr.rr....', 'rwrrrrr...', 'rrrrrrr...', '.rrrrr....', '..rrr.....']
CORAZON = ['.rr.rr....', 'rwrrrrr...', 'rrrrrrr...', 'rrrrrrr...', '.rrrrr....', '..rrr.....', '...r......']


def cofre(z, rnd):
    im = base(z['t'] if z is ZONAS[0] or z is ZONAS[1] else z['p'], rnd, 10)
    mapa(im, [
        '.oooooooooooooo.',
        'ommmmmmmmmmmmmmo',
        'omccccccccccccmo',
        'ommmmmmmmmmmmmmo',
        'ooooooyyyyoooooo',
        'ommmmmyooymmmmmo',
        'ommmmmyyyymmmmmo',
        'omccccccccccccmo',
        'ommmmmmmmmmmmmmo',
        'ommmmmmmmmmmmmmo',
        '.oooooooooooooo.',
    ], {'o': '#3a2414', 'm': '#8a5a2e', 'c': '#b0783e', 'y': '#f2c040'}, 0, 3)
    return im


def pinchos(z, rnd):
    im = base(z['d'], rnd, 12)
    for k in range(4):
        x0 = k * 4
        for h in range(6):
            for w in range(-((5 - h) // 2), (5 - h) // 2 + 1):
                x = x0 + 2 + w
                if 0 <= x < T:
                    im.putpixel((x, 1 + h), hx('#e6e8f0' if w <= 0 else '#9aa0b0'))
    return im


def gas(z, rnd):
    im = base(['#2e4a2a', '#4f7a3e', '#78a85a'], rnd, 20)
    for x, y in [(4, 4), (10, 6), (6, 10), (11, 11)]:
        dibujar(im, [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)], '#b4f070')
        dibujar(im, [(x, y)], '#e8ffc8')
    dibujar(im, [(2, 8), (3, 7), (4, 8), (5, 7), (8, 13), (9, 12), (10, 13)], '#1c3018')
    return im


def lava(z, rnd):
    im = Image.new('RGBA', (T, T), hx('#e0501a'))
    px = im.load()
    for y in range(T):
        for x in range(T):
            v = (x * 3 + y * 5 + rnd.randrange(0, 4)) % 9
            if v < 2:
                px[x, y] = hx('#ffd04a')
            elif v < 4:
                px[x, y] = hx('#ff8a2a')
            elif v == 8:
                px[x, y] = hx('#a8300e')
    return im


def bomba(z, rnd):
    im = base(z['p'], rnd, 10)
    mapa(im, [
        '.......y.',
        '......r..',
        '.....o...',
        '...kkkk..',
        '..kkkkkk.',
        '.kkwkkkkk',
        '.kwkkkkkk',
        '.kkkkkkkk',
        '.kkkkkkkk',
        '..kkkkkk.',
        '...kkkk..',
    ], {'k': '#1a1a22', 'w': '#6a6a80', 'o': '#8a6a3a', 'r': '#ff5a2a', 'y': '#ffe04a'}, 3, 2)
    return im


def guarida(z, rnd):
    im = Image.new('RGBA', (T, T), hx(z['d'][0]))
    px = im.load()
    for i in range(T):
        px[i, 0] = px[i, 8] = hx(z['d'][2])
        px[0, i] = px[8, i] = hx(z['d'][1])
    for x, y in [(4, 4), (12, 12), (4, 12), (12, 4)]:
        px[x, y] = hx(z['a'])
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            px[x + dx, y + dy] = hx(z['g'])
    return im


def grieta(etapa):
    im = nuevo()
    c = (20, 16, 24, 230)
    lineas = [(7, 2), (7, 3), (8, 4), (8, 5), (7, 6), (6, 7), (6, 8), (5, 9), (9, 6), (10, 7), (11, 7)]
    if etapa == 2:
        lineas += [(4, 3), (5, 4), (5, 5), (9, 9), (10, 10), (10, 11), (11, 12), (3, 10), (2, 11), (7, 10), (7, 11), (8, 12), (12, 4), (13, 3)]
    for p in lineas:
        im.putpixel(p, c)
    return im


hoja = Image.new('RGBA', (T * len(TIPOS), T * len(ZONAS)), (0, 0, 0, 0))
for zi, z in enumerate(ZONAS):
    rnd = random.Random(100 + zi)
    figuras = {
        'tierra': tierra(z, rnd), 'piedra': piedra(z, rnd), 'dura': dura(z, rnd), 'roca': roca(z, rnd),
        'irrompible': irrompible(z, rnd),
        'moneda': con_simbolo(z, rnd, MONEDA, {'o': '#8a5a10', 'y': '#f2c040', 'w': '#fff3b0'}),
        'gema': con_simbolo(z, rnd, GEMA, {'o': '#1a2a40', 'c': z['g'], 'w': '#ffffff'}, 'p'),
        'baya': con_simbolo(z, rnd, BAYA, {'g': '#3f9a3a', 'r': '#d8406a', 'w': '#ffc0d0'}),
        'cofre': cofre(z, rnd),
        'corazon': con_simbolo(z, rnd, CORAZON, {'r': '#e0304a', 'w': '#ffb0bc'}, 'p'),
        'pinchos': pinchos(z, rnd), 'gas': gas(z, rnd), 'lava': lava(z, rnd), 'bomba': bomba(z, rnd),
        'guarida': guarida(z, rnd), 'grieta1': grieta(1), 'grieta2': grieta(2),
    }
    for ti, nombre in enumerate(TIPOS):
        hoja.alpha_composite(figuras[nombre], (ti * T, zi * T))
hoja.save(os.path.join(RAIZ, 'public', 'mina', 'bloques.png'))
print('public/mina/bloques.png', hoja.size)
