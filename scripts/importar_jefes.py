#!/usr/bin/env python3
"""
Importa los 20 jefes (14 semanales y 6 Guardianes).
Entrada: arte/originales/jefes/jefe_semana_NN.png y jefe_evento_NN.png (192x96: frente a la izquierda, espalda a la derecha).
Salida:  public/sprites/jefe_NN_{frente,espalda,icono}.png (semanales) y guardian_N_{...}.png (Guardianes).
Los dibujos ya vienen a 96x96, con hasta 24 colores y sin semitransparencias: se usan tal cual (sin reducir ni cuantizar).
El icono (64x32, dos cuadros; el segundo baja un píxel) se saca del frente con vecino más cercano.
"""
import os
import re
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, 'arte', 'originales', 'jefes')
DESTINO = os.path.join(RAIZ, 'public', 'sprites')


def icono(frente):
    caja = frente.getbbox()
    rec = frente.crop(caja)
    f = min(30 / rec.width, 30 / rec.height)
    peq = rec.resize((max(1, round(rec.width * f)), max(1, round(rec.height * f))), Image.NEAREST)
    hoja = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    for cuadro in (0, 1):
        hoja.alpha_composite(peq, (cuadro * 32 + (32 - peq.width) // 2, 31 - peq.height + cuadro))
    return hoja


def main():
    os.makedirs(DESTINO, exist_ok=True)
    n = 0
    for archivo in sorted(os.listdir(ORIGEN)):
        m = re.match(r'jefe_(semana|evento)_(\d+)\.png$', archivo)
        if not m:
            continue
        num = int(m.group(2))
        nombre = f'jefe_{num:02d}' if m.group(1) == 'semana' else f'guardian_{num}'
        hoja = Image.open(os.path.join(ORIGEN, archivo)).convert('RGBA')
        assert hoja.size == (192, 96), f'{archivo}: debe medir 192x96 y mide {hoja.size}'
        frente = hoja.crop((0, 0, 96, 96))
        espalda = hoja.crop((96, 0, 192, 96))
        frente.save(os.path.join(DESTINO, f'{nombre}_frente.png'))
        espalda.save(os.path.join(DESTINO, f'{nombre}_espalda.png'))
        icono(frente).save(os.path.join(DESTINO, f'{nombre}_icono.png'))
        n += 1
    print(f'✓ {n} jefes importados en public/sprites/')


main()
