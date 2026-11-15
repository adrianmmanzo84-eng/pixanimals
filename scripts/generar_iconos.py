"""
Íconos de la PWA a partir del sprite de Lumbrito (brasa_1_frente), ampliado sin suavizar.
Genera public/iconos/: icono-192.png, icono-512.png (esquinas redondeadas), maskable-512.png (a sangre,
criatura dentro de la zona segura), apple-touch-icon.png (180, a sangre) y favicon.png (48).
Uso: python3 scripts/generar_iconos.py
"""
import os
from PIL import Image, ImageDraw

RAIZ = os.path.join(os.path.dirname(__file__), '..')
SPRITE = os.path.join(RAIZ, 'public', 'sprites', 'brasa_1_frente.png')
DESTINO = os.path.join(RAIZ, 'public', 'iconos')
FONDO = (26, 28, 44, 255)      # #1a1c2c
DISCO = (41, 54, 111, 255)     # #29366f
ARO = (65, 166, 246, 255)      # #41a6f6

cria = Image.open(SPRITE).convert('RGBA')
cria = cria.crop(cria.getbbox())


def icono(lado: int, escala: int, redondeado: bool, disco: float) -> Image.Image:
    img = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if redondeado:
        d.rounded_rectangle([0, 0, lado - 1, lado - 1], radius=int(lado * 0.22), fill=FONDO)
    else:
        d.rectangle([0, 0, lado, lado], fill=FONDO)
    r = int(lado * disco / 2)
    c = lado // 2
    d.ellipse([c - r - max(2, lado // 96), c - r - max(2, lado // 96), c + r + max(2, lado // 96), c + r + max(2, lado // 96)], fill=ARO)
    d.ellipse([c - r, c - r, c + r, c + r], fill=DISCO)
    g = cria.resize((cria.width * escala, cria.height * escala), Image.NEAREST)
    img.alpha_composite(g, ((lado - g.width) // 2, (lado - g.height) // 2 + lado // 40))
    return img


os.makedirs(DESTINO, exist_ok=True)
icono(512, 9, True, 0.82).save(os.path.join(DESTINO, 'icono-512.png'))
icono(192, 4, True, 0.8).save(os.path.join(DESTINO, 'icono-192.png'))
icono(512, 7, False, 0.62).save(os.path.join(DESTINO, 'maskable-512.png'))
icono(180, 3, False, 0.74).save(os.path.join(DESTINO, 'apple-touch-icon.png'))
icono(48, 1, True, 0.9).save(os.path.join(DESTINO, 'favicon.png'))
print('íconos en public/iconos/')
