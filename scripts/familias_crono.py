"""
Agrega las 5 familias del Cronoportal (39 a 43, entrega pixanimals-crono-mina-v1) a los datos y sprites.
Mismo proceso que scripts/familias_mina.py: datos (origen "crono"), ataques propios, pasivas, textos en inglés y
sprites desde las láminas en alta resolución (fuentes/familia_NN_x.png); íconos de 32 px del autor.

Uso: python3 scripts/familias_crono.py <carpeta de la entrega>   (idempotente)
"""
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import importar_arte as ia  # noqa: E402
import recorte_fuente as rf  # noqa: E402
from familias_mina import H, est, eta, final, defi, apoyo, escudo, stats, TOTALES, NIVELES  # noqa: E402

RAIZ = os.path.join(os.path.dirname(__file__), '..')
DATA = os.path.join(RAIZ, 'src', 'data')

FAMILIAS = [
    {
        'num': 39, 'familia': 'anomalo', 'tipo': 'marea', 'era': 1,
        'nombres': ['Anomalopix', 'Anomalopixel', 'Anomalomegapix', 'Anomalogigapix'],
        'proporcion': [1.0, 1.2, 0.95, 0.85, 0.95, 1.1],
        'pasiva': ('garras_cambricas', 'Garras Cámbricas', 'oleaje'),
        'desc': [
            ('Cría del primer océano. Sus ojos sobre tallos lo miran todo con curiosidad.', 'A hatchling of the first ocean. Its stalk eyes watch everything with curiosity.'),
            ('Ondula sus aletas laterales y caza pececitos con sus dos ganchos.', 'It ripples its side flaps and hunts small fish with its two hooks.'),
            ('El cazador más temido del mar antiguo. Sus ganchos espinosos no sueltan.', 'The most feared hunter of the ancient sea. Its spiny hooks never let go.'),
            ('Guardián del primer océano. Sus aletas brillan como velas de ámbar.', 'Guardian of the first ocean. Its flaps shine like sails of amber.'),
        ],
        'hab': [
            H('garra_primitiva', 'Garra Primitiva', 'Primal Claw', 'marea', 'fisica', 'ofensiva', 40, 'zarpazo', [eta('def', -1, 'rival', 15)]),
            H('tenaza_abisal', 'Tenaza Abisal', 'Abyssal Pincer', 'marea', 'fisica', 'ofensiva', 55, 'dentellada', [eta('def', -1, 'rival', 20)]),
            escudo('caparazon_cambrico', 'Caparazón Cámbrico', 'Cambrian Shell', 'marea', 'corteza', 'veneno'),
            apoyo('ojos_compuestos', 'Ojos Compuestos', 'Compound Eyes', 'marea', 'brillo', [eta('atq', 1)]),
            apoyo('marea_cambrica', 'Marea Cámbrica', 'Cambrian Tide', 'marea', 'ola', [eta('atq', 1), eta('vel', 1)]),
            final('remolino_cambrico', 'Remolino Cámbrico', 'Cambrian Whirl', 'marea', 'fisica', 85, 'ola'),
            final('abismo_primigenio', 'Abismo Primigenio', 'Primeval Abyss', 'marea', 'fisica', 110, 'ola'),
            defi('primer_oceano', 'Primer Océano', 'First Ocean', 'marea', 'ola'),
        ],
    },
    {
        'num': 40, 'familia': 'meganeura', 'tipo': 'rayo', 'era': 2,
        'nombres': ['Meganeupix', 'Meganeupixel', 'Meganeumegapix', 'Meganeugigapix'],
        'proporcion': [0.9, 0.85, 0.85, 1.2, 0.95, 1.25],
        'pasiva': ('alas_estaticas', 'Alas Estáticas', 'oleaje'),
        'desc': [
            ('Ninfa del pantano. Sus brotes de alas chispean cuando está contenta.', 'A swamp nymph. Its wing buds spark when it is happy.'),
            ('Estrena sus cuatro alas y zumba entre los helechos gigantes.', 'It tries out its four wings and buzzes among the giant ferns.'),
            ('Una libélula enorme. Las nervaduras de sus alas guardan electricidad.', 'A huge dragonfly. The veins of its wings store electricity.'),
            ('Guardiana de las tormentas del bosque gigante. Sus alas son vitrales vivos.', 'Guardian of the giant forest storms. Its wings are living stained glass.'),
        ],
        'hab': [
            H('zumbido_voltaico', 'Zumbido Voltaico', 'Volt Buzz', 'rayo', 'especial', 'ofensiva', 40, 'rayo', [est('paralisis', 10)]),
            H('picada_relampago', 'Picada Relámpago', 'Lightning Dive', 'rayo', 'especial', 'ofensiva', 55, 'rayo', [est('paralisis', 20)]),
            escudo('alas_de_vitral', 'Alas de Vitral', 'Glass Wings', 'rayo', 'brillo', 'paralisis'),
            apoyo('vuelo_estatico', 'Vuelo Estático', 'Static Flight', 'rayo', 'brillo', [eta('vel', 1)]),
            apoyo('mil_facetas', 'Mil Facetas', 'Thousand Facets', 'rayo', 'brillo', [eta('ate', 1), eta('vel', 1)]),
            final('enjambre_electrico', 'Enjambre Eléctrico', 'Electric Swarm', 'rayo', 'especial', 85, 'rayo'),
            final('tormenta_pantanosa', 'Tormenta Pantanosa', 'Swamp Storm', 'rayo', 'especial', 110, 'rayo'),
            defi('rayo_primordial', 'Rayo Primordial', 'Primordial Bolt', 'rayo', 'rayo'),
        ],
    },
    {
        'num': 41, 'familia': 'estego', 'tipo': 'brote', 'era': 3,
        'nombres': ['Estegopix', 'Estegopixel', 'Estegomegapix', 'Estegogigapix'],
        'proporcion': [1.15, 1.1, 1.3, 0.75, 1.0, 0.7],
        'pasiva': ('lomo_frondoso', 'Lomo Frondoso', 'raices'),
        'desc': [
            ('En lugar de placas le brotan hojitas. Mueve la cola cuando come.', 'Little leaves sprout instead of plates. It wags its tail while eating.'),
            ('Sus placas son hojas grandes que siguen al sol durante el día.', 'Its plates are big leaves that follow the sun all day.'),
            ('Sus placas se endurecieron como hojas de otoño. Nadie se acerca a su cola.', 'Its plates hardened like autumn leaves. Nobody goes near its tail.'),
            ('Guardián de la manada jurásica. Lleva un bosque entero sobre el lomo.', 'Guardian of the Jurassic herd. It carries a whole forest on its back.'),
        ],
        'hab': [
            H('coletazo_de_puas', 'Coletazo de Púas', 'Spike Swipe', 'brote', 'fisica', 'ofensiva', 40, 'impacto', [eta('def', -1, 'rival', 15)]),
            H('puas_milenarias', 'Púas Milenarias', 'Ancient Spikes', 'brote', 'fisica', 'ofensiva', 55, 'impacto', [eta('def', -1, 'rival', 20)]),
            escudo('placas_de_hoja', 'Placas de Hoja', 'Leaf Plates', 'brote', 'hojas', 'veneno'),
            H('sol_del_jurasico', 'Sol del Jurásico', 'Jurassic Sun', 'brote', 'estado', 'soporte', 0, 'sol', [{'tipo': 'cura', 'porcentaje': 25}], prec=None, usos=8),
            H('bosque_jurasico', 'Bosque Jurásico', 'Jurassic Grove', 'brote', 'estado', 'soporte', 0, 'raices', [{'tipo': 'cura', 'porcentaje': 25}, eta('def', 1)], prec=None, usos=8),
            final('estampida_de_hojas', 'Estampida de Hojas', 'Leaf Stampede', 'brote', 'fisica', 85, 'hojas'),
            final('gran_estampida', 'Gran Estampida', 'Great Stampede', 'brote', 'fisica', 110, 'impacto'),
            defi('corazon_jurasico', 'Corazón Jurásico', 'Jurassic Heart', 'brote', 'hojas'),
        ],
    },
    {
        'num': 42, 'familia': 'ptero', 'tipo': 'cielo', 'era': 4,
        'nombres': ['Pteropix', 'Pteropixel', 'Pteromegapix', 'Pterogigapix'],
        'proporcion': [0.95, 1.2, 0.85, 0.9, 0.85, 1.25],
        'pasiva': ('viento_cretacico', 'Viento Cretácico', 'ultimo_rescoldo'),
        'desc': [
            ('Todavía no sabe volar, pero salta desde las rocas batiendo sus alitas.', "It can't fly yet, but it jumps off rocks flapping its little wings."),
            ('Planea sobre los acantilados buscando corrientes de aire tibio.', 'It glides over the cliffs looking for warm air currents.'),
            ('Gran planeador del atardecer. Su cresta corta el viento.', 'A great sunset glider. Its crest cuts through the wind.'),
            ('Guardián del último cielo. Cruza el atardecer con estela de cometa.', 'Guardian of the last sky. It crosses the sunset with a comet trail.'),
        ],
        'hab': [
            H('picotazo_cretacico', 'Picotazo Cretácico', 'Cretaceous Peck', 'cielo', 'fisica', 'ofensiva', 40, 'impacto', [eta('def', -1, 'rival', 15)]),
            H('cresta_cortante', 'Cresta Cortante', 'Crest Slash', 'cielo', 'fisica', 'ofensiva', 55, 'zarpazo', [eta('def', -1, 'rival', 20)]),
            escudo('alas_planeadoras', 'Alas Planeadoras', 'Gliding Wings', 'cielo', 'corriente', 'paralisis'),
            apoyo('corriente_termica', 'Corriente Térmica', 'Thermal Current', 'cielo', 'corriente', [eta('vel', 1)]),
            apoyo('vuelo_rasante', 'Vuelo Rasante', 'Skimming Flight', 'cielo', 'corriente', [eta('atq', 1), eta('vel', 1)]),
            final('picado_meteoro', 'Picado Meteoro', 'Meteor Dive', 'cielo', 'fisica', 85, 'llamarada'),
            final('lluvia_de_meteoros', 'Lluvia de Meteoros', 'Meteor Shower', 'cielo', 'fisica', 110, 'llamarada'),
            defi('ultimo_cielo', 'Último Cielo', 'Last Sky', 'cielo', 'llamarada'),
        ],
    },
    {
        'num': 43, 'familia': 'mamut', 'tipo': 'roca', 'era': 5,
        'nombres': ['Mamutpix', 'Mamutpixel', 'Mamutmegapix', 'Mamutgigapix'],
        'proporcion': [1.35, 1.15, 1.2, 0.7, 1.0, 0.6],
        'pasiva': ('pelaje_eterno', 'Pelaje Eterno', 'raices'),
        'desc': [
            ('Cría lanuda y redonda. Se enrosca la trompa para dormir.', 'A round woolly calf. It curls its trunk to sleep.'),
            ('La escarcha se le pega al pelaje y él ni se da cuenta.', "Frost sticks to its fur and it doesn't even notice."),
            ('Lleva roca y hielo enganchados al pelo. Su paso hace temblar la tundra.', 'It carries rock and ice tangled in its fur. Its steps shake the tundra.'),
            ('Guardián de la Edad de Hielo. Sus colmillos de hielo guardan ámbar.', 'Guardian of the Ice Age. Its ice tusks hold amber.'),
        ],
        'hab': [
            H('colmillazo', 'Colmillazo', 'Tusk Strike', 'roca', 'fisica', 'ofensiva', 40, 'impacto', [eta('def', -1, 'rival', 15)]),
            H('colmillos_de_hielo', 'Colmillos de Hielo', 'Ice Tusks', 'roca', 'fisica', 'ofensiva', 55, 'impacto', [eta('vel', -1, 'rival', 20)]),
            escudo('pelaje_glacial', 'Pelaje Glacial', 'Glacial Fur', 'roca', 'corteza', 'paralisis'),
            apoyo('bramido_helado', 'Bramido Helado', 'Frozen Bellow', 'roca', 'grito', [eta('atq', -1, 'rival')]),
            apoyo('manada_glacial', 'Manada Glacial', 'Glacial Herd', 'roca', 'grito', [eta('atq', 1), eta('def', 1)]),
            final('alud_de_nieve', 'Alud de Nieve', 'Snow Slide', 'roca', 'fisica', 85, 'impacto'),
            final('glaciacion', 'Glaciación', 'Glaciation', 'roca', 'fisica', 110, 'impacto'),
            defi('era_de_hielo', 'Era de Hielo', 'Ice Age', 'roca', 'impacto'),
        ],
    },
]


def ids_de(f):
    base = f['familia']
    return [f'{base}_{e}' for e in range(1, 5)]


def datos():
    cri = json.load(open(os.path.join(DATA, 'criaturas.json')))
    hab = json.load(open(os.path.join(DATA, 'habilidades.json')))
    bal = json.load(open(os.path.join(DATA, 'balance.json')))
    en_path = os.path.join(RAIZ, 'src', 'i18n', 'datos-en.json')
    en = json.load(open(en_path))
    nuevos = {i for f in FAMILIAS for i in ids_de(f)}
    cri['criaturas'] = [c for c in cri['criaturas'] if c['id'] not in nuevos]
    nuevas_hab = {h[0]['id'] for f in FAMILIAS for h in f['hab']}
    existentes = {h['id'] for h in hab['habilidades']} - nuevas_hab
    assert not (nuevas_hab & existentes)
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
        ids = ids_de(f)
        for e in range(4):
            c = {
                'id': ids[e], 'nombre': f['nombres'][e], 'tipo': f['tipo'], 'familia': f['familia'], 'etapa': e + 1,
                'pasiva': pid, 'base': stats(f['proporcion'], TOTALES[e]), 'habilidades': kit[e], 'habilidadesPrueba': kit[e],
                'descripcion': f['desc'][e][0], 'sprites': f'{f["familia"]}_{e + 1}',
                'evoluciona': [{'a': ids[e + 1], 'nivel': NIVELES[e]}] if e < 3 else [],
                'origen': 'crono',
            }
            if e == 3:
                c['definitivo'] = de
            cri['criaturas'].append(c)
            en['criaturas'][c['id']] = {'descripcion': f['desc'][e][1]}
    for ruta, obj in [('criaturas.json', cri), ('habilidades.json', hab), ('balance.json', bal)]:
        with open(os.path.join(DATA, ruta), 'w') as fh:
            json.dump(obj, fh, ensure_ascii=False, indent=2)
            fh.write('\n')
    with open(en_path, 'w') as fh:
        json.dump(en, fh, ensure_ascii=False, indent=1)
        fh.write('\n')


def sprites(src):
    destino = os.path.join(RAIZ, 'public', 'sprites')
    for f in FAMILIAS:
        fuente = rf.recortar(os.path.join(src, 'fuentes', f'familia_{f["num"]}_{f["familia"]}.png'))
        for e in range(4):
            nombre = f'{f["familia"]}_{e + 1}'
            ia.convertir(fuente[(e, 'frente')], fuente[(e, 'espalda')], ia.TAMANOS[e], destino, nombre)
            ico = Image.open(os.path.join(src, 'criaturas', 'iconos', f'{f["num"]}_{f["familia"]}_{e}.png')).convert('RGBA')
            a = np.array(ico)
            a[a[:, :, 3] < 128] = 0
            a[a[:, :, 3] >= 128, 3] = 255
            pieza = Image.fromarray(a, 'RGBA')
            pieza = pieza.crop(pieza.getbbox())
            hoja = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
            for cuadro in (0, 1):
                hoja.alpha_composite(pieza, (cuadro * 32 + (32 - pieza.width) // 2, max(0, 31 - pieza.height + cuadro)))
            hoja.save(os.path.join(destino, f'{nombre}_icono.png'))
        print(f'✓ {f["familia"]}')


if __name__ == '__main__':
    datos()
    sprites(sys.argv[1])
