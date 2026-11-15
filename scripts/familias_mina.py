"""
Agrega las 5 familias exclusivas de la Mina (arte del autor, pixanimals-mina-v3) a los datos y sprites.

  - Datos: criaturas.json (origen "mina"), habilidades.json, pasivas (balance.json), datos-en.json,
    economia.json (monstruo de cada guarida = forma final de su familia).
  - Sprites: desde los PNG de 64x64 del autor, ampliados x6 y llevados al lienzo de 96x96 con el mismo
    proceso que las demás familias (scripts/importar_arte.py). Ícono: el del autor (32x32) en hoja de 2 cuadros.
  - Fondos, guaridas y huevos: copiados a public/mina/.

Uso: python3 scripts/familias_mina.py <carpeta pixanimals-mina-v3>   (idempotente)
"""
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import importar_arte as ia  # noqa: E402

RAIZ = os.path.join(os.path.dirname(__file__), '..')
DATA = os.path.join(RAIZ, 'src', 'data')


def H(id, nombre, en, tipo, cat, rol, pot, anim, efectos=(), prec=100, usos=20, **extra):
    h = {'id': id, 'animacion': anim, 'nombre': nombre, 'tipo': tipo, 'categoria': cat, 'rol': rol,
         'potencia': pot, 'precision': prec, 'usos': usos}
    h.update(extra)
    h['efectos'] = list(efectos)
    return h, en


def est(e, p):
    return {'tipo': 'estado', 'estado': e, 'prob': p, 'objetivo': 'rival'}


def eta(stat, d, obj='propio', p=100):
    return {'tipo': 'etapa', 'stat': stat, 'delta': d, 'prob': p, 'objetivo': obj}


def guardia(estado):
    return {'tipo': 'guardia', 'modo': 'reduce', 'reduccion': 0.6, 'contraEstado': {'estado': estado, 'prob': 30, 'soloFisico': True}}


def final(id, n, en, tipo, cat, pot, anim):
    return H(id, n, en, tipo, cat, 'final', pot, anim, prec=90, usos=5, enfriamiento=4)


def defi(id, n, en, tipo, anim):
    return H(id, n, en, tipo, 'especial', 'definitivo', 0, anim, prec=None, usos=1)


def apoyo(id, n, en, tipo, anim, efectos):
    return H(id, n, en, tipo, 'estado', 'soporte', 0, anim, efectos, prec=None, usos=12)


def escudo(id, n, en, tipo, anim, estado):
    return H(id, n, en, tipo, 'estado', 'defensiva', 0, anim, [guardia(estado)], prec=None, usos=10, prioridad=1)


# Proporciones de stats (ps, atq, def, ate, dfe, vel) por familia; los totales de etapa son algo mayores
# que los de las familias comunes (300/380/450/520) porque solo se consiguen venciendo a un monstruo.
TOTALES = [310, 392, 465, 540]
FAMILIAS = [
    {
        'familia': 'terin', 'tipo': 'brote', 'zona': 1, 'origen_arte': '34_brote_terin',
        'ids': ['terin', 'teribrote', 'verdigarra', 'verdicron'],
        'nombres': ['Terizpix', 'Terizpixel', 'Terizmegapix', 'Terizgigapix'],
        'proporcion': [1.05, 1.2, 1.05, 0.8, 1.0, 0.9],
        'pasiva': ('garras_ancestrales', 'Garras Ancestrales', 'raices'),
        'desc': [
            ('Cría de garras largas. Peina la tierra en busca de raíces dulces.', 'A long-clawed hatchling. It combs the soil for sweet roots.'),
            ('Le brotan hojas en el lomo. Duerme de pie, oculta entre helechos.', 'Leaves sprout on its back. It sleeps standing up among the ferns.'),
            ('Sus garras cortan raíces gruesas como si fueran pasto.', 'Its claws slice through thick roots as if they were grass.'),
            ('Guardián inmortal de la vida subterránea. Donde pisa, crece un bosque.', 'Undying guardian of underground life. A forest grows wherever it steps.'),
        ],
        'hab': [
            H('zarpa_de_helecho', 'Zarpa de Helecho', 'Fern Claw', 'brote', 'fisica', 'ofensiva', 40, 'zarpazo', [eta('def', -1, 'rival', 15)]),
            H('garras_guadana', 'Garras Guadaña', 'Scythe Claws', 'brote', 'fisica', 'ofensiva', 55, 'zarpazo', [eta('def', -1, 'rival', 20)]),
            escudo('follaje_jurasico', 'Follaje Jurásico', 'Jurassic Foliage', 'brote', 'hojas', 'veneno'),
            H('savia_antigua', 'Savia Antigua', 'Ancient Sap', 'brote', 'estado', 'soporte', 0, 'raices', [{'tipo': 'cura', 'porcentaje': 25}], prec=None, usos=8),
            H('brote_eterno', 'Brote Eterno', 'Eternal Sprout', 'brote', 'estado', 'soporte', 0, 'polen', [{'tipo': 'cura', 'porcentaje': 25}, eta('atq', 1)], prec=None, usos=8),
            final('siega_prehistorica', 'Siega Prehistórica', 'Primal Harvest', 'brote', 'fisica', 85, 'hojas'),
            final('siega_milenaria', 'Siega Milenaria', 'Millennial Reap', 'brote', 'fisica', 110, 'hojas'),
            defi('raiz_del_mundo', 'Raíz del Mundo', 'World Root', 'brote', 'raices'),
        ],
    },
    {
        'familia': 'plesin', 'tipo': 'marea', 'zona': 2, 'origen_arte': '35_marea_plesin',
        'ids': ['plesin', 'ondaples', 'plesiomar', 'nereidon'],
        'nombres': ['Plesiopix', 'Plesiopixel', 'Plesiomegapix', 'Plesiogigapix'],
        'proporcion': [1.2, 0.8, 0.95, 1.15, 1.1, 0.8],
        'pasiva': ('marea_antigua', 'Marea Antigua', 'oleaje'),
        'desc': [
            ('Nada en los charcos de las grutas. Su cuello se estira al curiosear.', 'It swims in cave pools. Its neck stretches whenever it is curious.'),
            ('Mueve las aletas como remos. Canta para llamar a las corrientes.', 'It paddles its flippers like oars. It sings to call the currents.'),
            ('Recorre lagos subterráneos que ningún mapa conoce.', 'It roams underground lakes that no map has ever charted.'),
            ('Deidad inmortal de las aguas profundas. Las mareas obedecen su canto.', 'Undying deity of the deep waters. The tides obey its song.'),
        ],
        'hab': [
            H('onda_abisal', 'Onda Abisal', 'Abyssal Wave', 'marea', 'especial', 'ofensiva', 40, 'ola', [eta('vel', -1, 'rival', 15)]),
            H('oleaje_antiguo', 'Oleaje Antiguo', 'Ancient Swell', 'marea', 'especial', 'ofensiva', 55, 'ola', [eta('vel', -1, 'rival', 20)]),
            escudo('burbuja_fosil', 'Burbuja Fósil', 'Fossil Bubble', 'marea', 'burbujas', 'sueno'),
            apoyo('canto_profundo', 'Canto Profundo', 'Deep Song', 'marea', 'arrullo', [eta('ate', 1)]),
            apoyo('canto_de_nereida', 'Canto de Nereida', 'Nereid Song', 'marea', 'arrullo', [eta('ate', 1), eta('dfe', 1)]),
            final('maremoto_jurasico', 'Maremoto Jurásico', 'Jurassic Surge', 'marea', 'especial', 85, 'ola'),
            final('diluvio_eterno', 'Diluvio Eterno', 'Eternal Deluge', 'marea', 'especial', 110, 'ola'),
            defi('mar_primordial', 'Mar Primordial', 'Primal Sea', 'marea', 'ola'),
        ],
    },
    {
        'familia': 'triclin', 'tipo': 'rayo', 'zona': 3, 'origen_arte': '36_rayo_triclin',
        'ids': ['triclin', 'tricorayo', 'voltaceratops', 'triceraion'],
        'nombres': ['Tricepix', 'Tricepixel', 'Tricemegapix', 'Tricegigapix'],
        'proporcion': [1.1, 1.1, 1.3, 0.85, 0.95, 0.7],
        'pasiva': ('gola_conductora', 'Gola Conductora', 'ultimo_rescoldo'),
        'desc': [
            ('Su gola chispea cuando se asusta. Embiste cristales para jugar.', 'Its frill sparks when startled. It headbutts crystals for fun.'),
            ('Guarda electricidad en los cuernos y la suelta al embestir.', 'It stores electricity in its horns and releases it when it charges.'),
            ('Su gola de cristal atrae los rayos de toda la gruta.', 'Its crystal frill draws in every lightning bolt in the cave.'),
            ('Guardián eterno de los cristales. Un solo paso suyo hace tronar la tierra.', 'Eternal guardian of the crystals. A single step makes the ground thunder.'),
        ],
        'hab': [
            H('cuerno_voltio', 'Cuerno Voltio', 'Volt Horn', 'rayo', 'fisica', 'ofensiva', 40, 'rayo', [est('paralisis', 10)]),
            H('tricuerno_electrico', 'Tricuerno Eléctrico', 'Tri-Horn Shock', 'rayo', 'fisica', 'ofensiva', 55, 'rayo', [est('paralisis', 20)]),
            escudo('gola_escudo', 'Gola Escudo', 'Frill Shield', 'rayo', 'corteza', 'paralisis'),
            apoyo('carga_cristal', 'Carga Cristal', 'Crystal Charge', 'rayo', 'brillo', [eta('def', 1)]),
            apoyo('gola_tormenta', 'Gola Tormenta', 'Storm Frill', 'rayo', 'brillo', [eta('def', 1), eta('atq', 1)]),
            final('estampida_voltaica', 'Estampida Voltaica', 'Volt Stampede', 'rayo', 'fisica', 85, 'impacto'),
            final('embestida_eterna', 'Embestida Eterna', 'Eternal Charge', 'rayo', 'fisica', 110, 'impacto'),
            defi('trueno_del_cretacico', 'Trueno Cretácico', 'Cretaceous Thunder', 'rayo', 'rayo'),
        ],
    },
    {
        'familia': 'tirin', 'tipo': 'brasa', 'zona': 4, 'origen_arte': '37_brasa_tirin',
        'ids': ['tirin', 'tirascua', 'rexbrasa', 'ignirrex'],
        'nombres': ['Rexpix', 'Rexpixel', 'Rexmegapix', 'Rexgigapix'],
        'proporcion': [1.15, 1.35, 1.0, 0.8, 0.85, 0.85],
        'pasiva': ('rugido_fosil', 'Rugido Fósil', 'ultimo_rescoldo'),
        'desc': [
            ('Muerde todo lo que encuentra. Sus dientes ya están tibios al nacer.', 'It bites everything it finds. Its teeth are already warm at birth.'),
            ('Su cola deja brasas al barrer el suelo de la caverna.', 'Its tail leaves embers behind as it sweeps the cave floor.'),
            ('Ruge dentro de los volcanes para despertar al magma.', 'It roars inside volcanoes to wake the magma.'),
            ('Deidad ancestral del fuego. Su rugido abrió los ríos de lava.', 'Ancient deity of fire. Its roar carved the rivers of lava.'),
        ],
        'hab': [
            H('dentellada_volcanica', 'Mordida Volcánica', 'Volcanic Bite', 'brasa', 'fisica', 'ofensiva', 40, 'dentellada', [est('quemadura', 10)]),
            H('mandibula_de_magma', 'Mandíbula de Magma', 'Magma Jaws', 'brasa', 'fisica', 'ofensiva', 55, 'dentellada', [est('quemadura', 20)]),
            escudo('piel_de_basalto', 'Piel de Basalto', 'Basalt Hide', 'brasa', 'corteza', 'quemadura'),
            apoyo('rugido_tirano', 'Rugido Tirano', 'Tyrant Roar', 'brasa', 'grito', [eta('atq', -1, 'rival')]),
            apoyo('rugido_cretacico', 'Rugido Cretácico', 'Cretaceous Roar', 'brasa', 'grito', [eta('atq', -1, 'rival'), eta('atq', 1)]),
            final('erupcion_rex', 'Erupción Rex', 'Rex Eruption', 'brasa', 'fisica', 85, 'llamarada'),
            final('cataclismo_igneo', 'Cataclismo Ígneo', 'Igneous Cataclysm', 'brasa', 'fisica', 110, 'anillo_fuego'),
            defi('meteoro_final', 'Meteoro Final', 'Final Meteor', 'brasa', 'llamarada'),
        ],
    },
    {
        'familia': 'dimlin', 'tipo': 'sombra', 'zona': 5, 'origen_arte': '38_sombra_dimlin',
        'ids': ['dimlin', 'veloscuro', 'dimetombra', 'noxmetrodon'],
        'nombres': ['Dimepix', 'Dimepixel', 'Dimemegapix', 'Dimegigapix'],
        'proporcion': [1.0, 0.85, 0.9, 1.2, 1.0, 1.05],
        'pasiva': ('vela_umbria', 'Vela Umbría', 'raices'),
        'desc': [
            ('Se calienta bajo los hongos que brillan. Su vela cambia de color.', 'It warms itself under glowing mushrooms. Its sail changes color.'),
            ('Desaparece en la oscuridad apagando el brillo de su vela.', 'It vanishes into the dark by dimming the glow of its sail.'),
            ('Las marcas de su vela forman mapas del abismo.', 'The markings on its sail form maps of the abyss.'),
            ('Deidad inmortal de Sombra. Su vela guarda un cielo de estrellas.', 'Undying deity of Shadow. Its sail holds a sky full of stars.'),
        ],
        'hab': [
            H('mirada_permica', 'Mirada Pérmica', 'Permian Gaze', 'sombra', 'especial', 'ofensiva', 40, 'mirada', [est('sueno', 10)]),
            H('ojo_del_abismo', 'Ojo del Abismo', 'Abyss Eye', 'sombra', 'especial', 'ofensiva', 55, 'mirada', [est('sueno', 15)]),
            escudo('velo_fosil', 'Velo Fósil', 'Fossil Veil', 'sombra', 'corriente', 'veneno'),
            apoyo('vela_sombria', 'Vela Sombría', 'Shadow Sail', 'sombra', 'brillo', [eta('ate', 1)]),
            apoyo('vela_estelar', 'Vela Estelar', 'Star Sail', 'sombra', 'brillo', [eta('ate', 1), eta('vel', 1)]),
            final('pulso_permico', 'Pulso Pérmico', 'Permian Pulse', 'sombra', 'especial', 85, 'corriente'),
            final('noche_primigenia', 'Noche Primigenia', 'Primeval Night', 'sombra', 'especial', 110, 'mirada'),
            defi('eclipse_fosil', 'Eclipse Fósil', 'Fossil Eclipse', 'sombra', 'mirada'),
        ],
    },
]

NIVELES = [16, 28, 40]


def stats(prop, total):
    s = sum(prop)
    v = [round(p / s * total) for p in prop]
    v[0] += total - sum(v)
    return dict(zip(['ps', 'atq', 'def', 'ate', 'dfe', 'vel'], v))


def datos():
    cri = json.load(open(os.path.join(DATA, 'criaturas.json')))
    hab = json.load(open(os.path.join(DATA, 'habilidades.json')))
    bal = json.load(open(os.path.join(DATA, 'balance.json')))
    eco = json.load(open(os.path.join(DATA, 'economia.json')))
    en_path = os.path.join(RAIZ, 'src', 'i18n', 'datos-en.json')
    en = json.load(open(en_path))
    nuevos_ids = {i for f in FAMILIAS for i in f['ids']}
    cri['criaturas'] = [c for c in cri['criaturas'] if c['id'] not in nuevos_ids]
    nuevas_hab = {h[0]['id'] for f in FAMILIAS for h in f['hab']}
    hab['habilidades'] = [h for h in hab['habilidades'] if h['id'] not in nuevas_hab]
    for f in FAMILIAS:
        hs = [h for h, _ in f['hab']]
        for h, nombre_en in f['hab']:
            hab['habilidades'].append(h)
            en['habilidades'][h['id']] = {'nombre': nombre_en}
        of1, of2, esc, ap1, ap2, fi1, fi2, de = [h['id'] for h in hs]
        kit = [[of1, esc, ap1, fi1], [of2, esc, ap1, fi1], [of2, esc, ap2, fi1], [of2, esc, ap2, fi2]]
        pid, pnombre, mec = f['pasiva']
        bal['pasivasAlias'][pid] = {'nombre': pnombre, 'mecanica': mec}
        for e in range(4):
            c = {
                'id': f['ids'][e], 'nombre': f['nombres'][e], 'tipo': f['tipo'], 'familia': f['familia'], 'etapa': e + 1,
                'pasiva': pid, 'base': stats(f['proporcion'], TOTALES[e]), 'habilidades': kit[e], 'habilidadesPrueba': kit[e],
                'descripcion': f['desc'][e][0], 'sprites': f'{f["familia"]}_{e + 1}',
                'evoluciona': [{'a': f['ids'][e + 1], 'nivel': NIVELES[e]}] if e < 3 else [],
                'origen': 'mina',
            }
            if e == 3:
                c['definitivo'] = de
            cri['criaturas'].append(c)
            en['criaturas'][c['id']] = {'descripcion': f['desc'][e][1]}
        eco['mina']['zonas'][f['zona'] - 1]['monstruo'] = f['ids'][3]
    for ruta, obj in [('criaturas.json', cri), ('habilidades.json', hab), ('balance.json', bal), ('economia.json', eco)]:
        with open(os.path.join(DATA, ruta), 'w') as fh:
            json.dump(obj, fh, ensure_ascii=False, indent=2)
            fh.write('\n')
    with open(en_path, 'w') as fh:
        json.dump(en, fh, ensure_ascii=False, indent=1)
        fh.write('\n')


def sprites(src):
    destino = os.path.join(RAIZ, 'public', 'sprites')
    for f in FAMILIAS:
        for e in range(4):
            base = f'{f["origen_arte"]}_{e}'
            vistas = []
            for v in ('frente', 'espalda'):
                img = Image.open(os.path.join(src, 'sprites', f'{base}_{v}.png')).convert('RGBA')
                img = img.crop(img.getbbox())
                vistas.append(img.resize((img.width * 6, img.height * 6), Image.NEAREST))
            nombre = f'{f["familia"]}_{e + 1}'
            ia.convertir(vistas[0], vistas[1], ia.TAMANOS[e], destino, nombre)
            # Ícono del autor, en la hoja de 2 cuadros del juego (el segundo baja un píxel).
            ico = Image.open(os.path.join(src, 'iconos', f'{base}_icono.png')).convert('RGBA')
            a = np.array(ico)
            a[a[:, :, 3] < 128] = 0
            a[a[:, :, 3] >= 128, 3] = 255
            ico = Image.fromarray(a, 'RGBA')
            hoja = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
            caja = ico.getbbox()
            pieza = ico.crop(caja)
            for cuadro in (0, 1):
                hoja.alpha_composite(pieza, (cuadro * 32 + (32 - pieza.width) // 2, max(0, 31 - pieza.height + cuadro)))
            hoja.save(os.path.join(destino, f'{nombre}_icono.png'))
        # Originales para poder reimportar.
        os.makedirs(os.path.join(RAIZ, 'arte', 'originales', 'mina'), exist_ok=True)
        shutil.copy(os.path.join(src, 'familias', f'{f["origen_arte"]}.png'), os.path.join(RAIZ, 'arte', 'originales', 'mina', f'{f["familia"]}.png'))
        print(f'✓ {f["familia"]}')


def escenarios(src):
    destino = os.path.join(RAIZ, 'public', 'mina')
    os.makedirs(destino, exist_ok=True)
    for z in range(1, 6):
        # Fondos de 960x1920: se guardan en JPG (opacos) para que pesen menos.
        Image.open(os.path.join(src, 'fondos', f'mina_zona{z}.png')).convert('RGB').save(os.path.join(destino, f'zona{z}.jpg'), quality=86)
        Image.open(os.path.join(src, 'guaridas', f'mina_guarida{z}.png')).convert('RGB').save(os.path.join(destino, f'guarida{z}.jpg'), quality=88)
    for f in FAMILIAS:
        shutil.copy(os.path.join(src, 'huevos', f'huevo_{f["familia"]}.png'), os.path.join(destino, f'huevo_{f["familia"]}.png'))
    print('✓ fondos, guaridas y huevos')


if __name__ == '__main__':
    src = sys.argv[1]
    datos()
    sprites(src)
    escenarios(src)
