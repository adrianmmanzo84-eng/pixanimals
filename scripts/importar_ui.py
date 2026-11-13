"""
Copia el arte de interfaz (arte/originales/ui/<carpeta>/<id>.png) a public/ui/<carpeta>/ y escribe
src/ui/arte-ui.json con la ruta de cada pieza. Comprueba alfa binario y tamaños.

Las claves son el nombre del archivo sin extensión (item_pocion, medalla_torre_2, sobre_raro, tipo_brasa…);
los sobres tienen además una miniatura a la mitad (sobre_raro_mini) para las listas;
en el juego se cargan como textura «ui_<clave>».
Uso: python3 scripts/importar_ui.py      (requiere Pillow y numpy)
"""
import json
import os
import shutil
import numpy as np
from PIL import Image

RAIZ = os.path.join(os.path.dirname(__file__), '..')
ORIG = os.path.join(RAIZ, 'arte', 'originales', 'ui')
DESTINO = os.path.join(RAIZ, 'public', 'ui')
LISTA = os.path.join(RAIZ, 'src', 'ui', 'arte-ui.json')

lista = {}
for carpeta in sorted(os.listdir(ORIG)):
    origen = os.path.join(ORIG, carpeta)
    if not os.path.isdir(origen):
        continue
    os.makedirs(os.path.join(DESTINO, carpeta), exist_ok=True)
    for archivo in sorted(os.listdir(origen)):
        if not archivo.endswith('.png'):
            continue
        img = Image.open(os.path.join(origen, archivo)).convert('RGBA')
        alfa = np.unique(np.array(img)[:, :, 3])
        assert set(alfa.tolist()) <= {0, 255}, f'{carpeta}/{archivo}: tiene semitransparencias'
        clave = archivo[:-4]
        assert clave not in lista, f'clave repetida: {clave}'
        shutil.copyfile(os.path.join(origen, archivo), os.path.join(DESTINO, carpeta, archivo))
        lista[clave] = {'ruta': f'ui/{carpeta}/{archivo}', 'tam': list(img.size)}
        if carpeta == 'sobres':
            # Miniatura a la mitad para las listas (se ve 1:1 en pantalla; reducir con vecino más cercano perdía líneas).
            a = np.array(img.resize((img.width // 2, img.height // 2), Image.BOX))
            a[:, :, 3] = np.where(a[:, :, 3] >= 128, 255, 0)
            mini = f'{clave}_mini.png'
            Image.fromarray(a, 'RGBA').save(os.path.join(DESTINO, carpeta, mini))
            lista[f'{clave}_mini'] = {'ruta': f'ui/{carpeta}/{mini}', 'tam': [img.width // 2, img.height // 2]}
with open(LISTA, 'w', encoding='utf-8') as fh:
    json.dump(lista, fh, ensure_ascii=False, indent=1)
print(f'{len(lista)} piezas de interfaz')
