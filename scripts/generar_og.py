"""
Imagen para compartir el enlace (Open Graph, 1200×630): la portada, el logo y una fila de criaturas.
Usa el logo del autor (arte/originales/ui/marca/logo.png) si existe; si no, el nombre con la fuente Fredoka.
Salida: public/og.png. Uso: python3 scripts/generar_og.py
"""
import json
import os
import random
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.join(os.path.dirname(__file__), '..')
P = lambda *r: os.path.join(RAIZ, *r)
W, H = 1200, 630
FUENTE = P('node_modules', '@fontsource', 'fredoka', 'files', 'fredoka-latin-600-normal.woff')

img = Image.new('RGBA', (W, H), (26, 28, 44, 255))
portada = Image.open(P('public', 'fondos', 'portada.jpg')).convert('RGBA')
esc = max(W / portada.width, 460 / portada.height)
portada = portada.resize((int(portada.width * esc), int(portada.height * esc)), Image.LANCZOS)
img.alpha_composite(portada, ((W - portada.width) // 2, 0))
# Degradado hacia abajo para la fila de criaturas y el texto.
velo = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(velo)
for y in range(330, H):
    a = min(255, int((y - 330) / 140 * 255))
    d.line([(0, y), (W, y)], fill=(26, 28, 44, a))
img.alpha_composite(velo)

d = ImageDraw.Draw(img)
logo = P('arte', 'originales', 'ui', 'marca', 'logo.png')
if os.path.exists(logo):
    lg = Image.open(logo).convert('RGBA')
    esc = min(860 / lg.width, 260 / lg.height)
    # Pixel art: escala entera sin suavizar; ilustración: suavizada.
    if lg.width <= 240:
        esc = max(1, int(esc))
        lg = lg.resize((lg.width * esc, lg.height * esc), Image.NEAREST)
    else:
        lg = lg.resize((int(lg.width * esc), int(lg.height * esc)), Image.LANCZOS)
    img.alpha_composite(lg, ((W - lg.width) // 2, 200 - lg.height // 2))
else:
    f = ImageFont.truetype(FUENTE, 150)
    txt = 'PIXANIMALS'
    w = d.textlength(txt, font=f)
    d.text(((W - w) / 2, 110), txt, font=f, fill=(255, 210, 63), stroke_width=10, stroke_fill=(43, 58, 120))

# Fila de criaturas (pixel art ampliado sin suavizar).
datos = json.load(open(P('src', 'data', 'criaturas.json'), encoding='utf-8'))['criaturas']
random.seed(7)
etapa3 = [c for c in datos if c['etapa'] in (2, 3)]
elegidas = random.sample(etapa3, 6)
x = 60
for c in elegidas:
    s = Image.open(P('public', 'sprites', f"{c['sprites']}_frente.png")).convert('RGBA')
    s = s.crop(s.getbbox())
    k = max(1, min(170 // s.height, 170 // s.width))
    s = s.resize((s.width * k, s.height * k), Image.NEAREST)
    img.alpha_composite(s, (x + (170 - s.width) // 2, 560 - s.height))
    x += 185

f2 = ImageFont.truetype(FUENTE, 34)
lema = 'Colecciona · Entrena · Combate   ·   Gratis, sin compras ni registros'
w = d.textlength(lema, font=f2)
d.text(((W - w) / 2, 578), lema, font=f2, fill=(255, 255, 255), stroke_width=3, stroke_fill=(43, 58, 120))
img.convert('RGB').save(P('public', 'og.png'), optimize=True)
print('public/og.png')
