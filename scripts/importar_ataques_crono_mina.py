"""
Efectos de ataque de las familias 34 a 43 (entrega pixanimals-crono-mina-v1): las piezas ya vienen a tamaño final
(64, 96, impacto 128 y pantalla 240×160). Se recortan al contenido (salvo la pantalla) y se registran en
src/ui/efectos-ataques.json con el id de la habilidad, buscada por nombre en habilidades.json.

Uso: python3 scripts/importar_ataques_crono_mina.py   (las habilidades que todavía no existan se informan y se saltan)
"""
import json
import os
import unicodedata

from PIL import Image

RAIZ = os.path.join(os.path.dirname(__file__), '..')
ORIG = os.path.join(RAIZ, 'arte', 'originales', 'crono-mina-v1')
DESTINO = os.path.join(RAIZ, 'public', 'efectos', 'ataques')
LISTA = os.path.join(RAIZ, 'src', 'ui', 'efectos-ataques.json')


def clave(s):
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower().strip()


def main():
    habs = json.load(open(os.path.join(RAIZ, 'src', 'data', 'habilidades.json')))['habilidades']
    por_nombre = {}
    for h in habs:
        por_nombre.setdefault(clave(h['nombre']), h['id'])
    lista = json.load(open(LISTA))
    faltan = set()
    hechos = 0
    for a in json.load(open(os.path.join(ORIG, 'ataques.json'))):
        hid = por_nombre.get(clave(a['ataque']))
        if not hid:
            faltan.add(f"{a['familia']} {a['ataque']}")
            continue
        img = Image.open(os.path.join(ORIG, a['archivo'])).convert('RGBA')
        pieza = a.get('pieza')
        if pieza == 'pantalla':
            img.convert('RGB').save(os.path.join(DESTINO, f'{hid}_pantalla.png'))
            lista.setdefault(hid, {})['pantalla'] = [img.width, img.height]
        else:
            img = img.crop(img.getbbox())
            img.save(os.path.join(DESTINO, f'{hid}.png'))
            lista.setdefault(hid, {})['impacto'] = [img.width, img.height]
        hechos += 1
    lista = dict(sorted(lista.items()))
    with open(LISTA, 'w') as f:
        json.dump(lista, f, ensure_ascii=False, indent=1)
    print(f'{hechos} piezas integradas')
    for x in sorted(faltan):
        print('  sin habilidad todavía:', x)


if __name__ == '__main__':
    main()
