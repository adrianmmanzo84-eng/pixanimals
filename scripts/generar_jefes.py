#!/usr/bin/env python3
"""
Genera src/data/jefes.json: los 14 jefes semanales y los 6 Guardianes, como criaturas especiales.
Stats: se reparten por «perfil» (pesos por stat) hasta un total de partida (semanales 560, Guardianes 600-660;
las formas finales normales y los Eclipse suman 520). Habilidades: se eligen de las que ya existen de su tipo.
OJO: los stats finales salen de `npx tsx scripts/ajustar-jefes.ts 30` (ajusta reparto y total a una meta de victorias). Si se vuelve a
correr este generador hay que volver a ajustar y copiar las bases a src/data/jefes.json.
Uso: python3 scripts/generar_jefes.py   (después, npm run validar)
"""
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
hab = json.load(open(os.path.join(RAIZ, 'src/data/habilidades.json')))['habilidades']

PASIVA = {  # por tipo: (primera, segunda)
    'brasa': ('ultimo_rescoldo', 'fragua_viva'), 'marea': ('oleaje', 'hielo_artico'), 'brote': ('raices', 'furia_espinosa'),
    'rayo': ('carga_estatica', 'pelaje_estatico'), 'roca': ('piedra_viva', 'geoda_viva'),
    'cielo': ('viento_a_favor', 'vuelo_rasante'), 'sombra': ('luna_nueva', 'tinta'),
}

# (sprites, id, nombre, tipo, categoria, perfil ps/atq/def/ate/dfe/vel, total, indice de kit, descripcion)
SEMANALES = [
    ('jefe_01', 'caldrak', 'Caldrak', 'brasa', 'fisica', (1.2, 1.3, 1.3, .9, .9, .7), 560, 0, 'Cocodrilo de caldera. Sus escamas de basalto guardan ríos de lava.'),
    ('jefe_02', 'ferrandra', 'Ferrandra', 'brasa', 'especial', (1.1, .8, 1.0, 1.3, 1.0, .9), 560, 1, 'Salamandra de fragua. Su cola enciende el aire como un fuelle.'),
    ('jefe_03', 'talasor', 'Talasor', 'marea', 'especial', (.9, .7, .8, 1.4, .9, 1.3), 560, 0, 'Morena abisal. Nada en espiral y muerde desde la oscuridad.'),
    ('jefe_04', 'borealmo', 'Borealmo', 'marea', 'especial', (1.3, .9, 1.2, 1.2, 1.1, .9), 560, 1, 'Morsa glacial. Lenta como un iceberg y igual de difícil de mover.'),
    ('jefe_05', 'zarzabal', 'Zarzabal', 'brote', 'fisica', (1.1, 1.4, 1.1, .9, .8, 1.0), 560, 0, 'Jabalí de zarzas. Embiste sin frenar entre espinas y raíces.'),
    ('jefe_06', 'micervido', 'Micérvido', 'brote', 'especial', (1.1, .6, .9, 1.2, 1.3, .9), 560, 1, 'Ciervo de micelio. Esporas luminosas brotan de su cornamenta.'),
    ('jefe_07', 'fulgarok', 'Fulgarok', 'rayo', 'fisica', (1.2, 1.4, 1.0, .9, .8, .8), 560, 0, 'Bisonte de tormenta. Cada pisada deja un trueno atrás.'),
    ('jefe_08', 'najasol', 'Najasol', 'rayo', 'especial', (.8, .7, .7, 1.4, .9, 1.5), 560, 1, 'Cobra prisma. Descompone la luz en rayos que no se pueden esquivar.'),
    ('jefe_09', 'astracorno', 'Astracorno', 'roca', 'fisica', (1.0, 1.2, 1.4, .9, 1.0, .8), 560, 0, 'Íbice meteórico. Sus cuernos son restos de una estrella caída.'),
    ('jefe_10', 'geodracnida', 'Geodrácnida', 'roca', 'fisica', (.9, 1.2, 1.2, 1.0, 1.0, .7), 560, 1, 'Araña de geoda. Teje redes de cristal dentro de su cueva.'),
    ('jefe_11', 'tempestario', 'Tempestario', 'cielo', 'especial', (.9, .6, .8, 1.3, 1.0, 1.4), 560, 0, 'Albatros de tormenta. Vuela sobre el ojo del huracán sin inmutarse.'),
    ('jefe_12', 'cicloptero', 'Ciclóptero', 'cielo', 'fisica', (.9, 1.3, .7, .9, .8, 1.5), 560, 1, 'Pterosaurio de ciclón. Un solo aleteo arma un remolino.'),
    ('jefe_13', 'umbrafauce', 'Umbrafauce', 'sombra', 'fisica', (.9, 1.4, .8, .9, .8, 1.5), 560, 0, 'Pantera de colmillos de sable. Ataca desde la sombra, nunca de frente.'),
    ('jefe_14', 'negralith', 'Negralith', 'sombra', 'fisica', (1.0, 1.3, 1.3, .9, .8, .7), 560, 1, 'Escorpión del vacío. Su aguijón apaga todo lo que toca.'),
]
GUARDIANES = [
    ('guardian_1', 'bastion_de_ceniza', 'Bastión Ceniza', 'brasa', 'fisica', (1.3, .9, 1.5, .9, 1.2, .8), 600, 2, 'Guardián del volcán. Tortuga de basalto: nada atraviesa su caparazón.'),
    ('guardian_2', 'custodio_de_las_mareas', 'Custodio Mareas', 'marea', 'especial', (1.2, .5, 1.1, 1.3, 1.4, .7), 610, 2, 'Guardián del arrecife. Nautilo ancestral que manda sobre las mareas.'),
    ('guardian_3', 'raiz_primordial', 'Raíz Primordial', 'brote', 'fisica', (1.4, 1.2, 1.2, .9, 1.0, .8), 620, 2, 'Guardián del bosque. Elefante cubierto de raíces más viejas que los árboles.'),
    ('guardian_4', 'vigia_del_sol_sepulto', 'Vigía del Sol', 'rayo', 'especial', (1.0, 1.2, .9, 1.2, .9, 1.3), 630, 2, 'Guardián del desierto. Chacal solar que custodia el sol enterrado.'),
    ('guardian_5', 'centinela_del_ultimo_hielo', 'Centinela Hielo', 'cielo', 'fisica', (1.3, 1.5, 1.2, .9, .9, .7), 640, 2, 'Guardián de la cumbre. Gorila glacial que vigila el último hielo.'),
    ('guardian_6', 'custodio_del_umbral', 'Custodio Umbral', 'sombra', 'especial', (1.0, .7, .9, 1.5, 1.2, 1.3), 660, 2, 'Guardián de las ruinas. Garza ancestral frente a la puerta que no se abre.'),
]


def repartir(perfil, total):
    s = sum(perfil)
    v = [max(1, round(total * p / s)) for p in perfil]
    v[0] += total - sum(v)  # el redondeo se ajusta en PS
    return dict(zip(['ps', 'atq', 'def', 'ate', 'dfe', 'vel'], v))


def elegir(tipo, cat, k):
    de = [h for h in hab if h['tipo'] == tipo]
    pick = lambda lista, i: lista[i % len(lista)]
    ofensivas = sorted([h for h in de if h['rol'] == 'ofensiva' and h['categoria'] == cat] or [h for h in de if h['rol'] == 'ofensiva'], key=lambda h: -h['potencia'])[:4]
    finales = [h for h in de if h['rol'] == 'final' and h['categoria'] == cat and h['potencia'] >= 110] or [h for h in de if h['rol'] == 'final' and h['potencia'] >= 110]
    sops = [h for h in de if h['rol'] == 'soporte']
    defins = [h for h in de if h['rol'] == 'definitivo' and h['categoria'] == cat] or [h for h in de if h['rol'] == 'definitivo']
    return (
        # Dos ofensivas (las mejores de su categoría), un apoyo y un final de 110-115.
        [pick(ofensivas, 0)['id'], pick(ofensivas, 1)['id'], pick(sops, k + 1)['id'], pick(finales, k)['id']],
        pick(defins, k)['id'],
    )


def crear(lista, guardian):
    out = []
    for sprites, id_, nombre, tipo, cat, perfil, total, k, desc in lista:
        habs, definitivo = elegir(tipo, cat, k)
        out.append({
            'id': id_, 'nombre': nombre, 'tipo': tipo, 'familia': id_, 'etapa': 4, 'jefe': 'guardian' if guardian else 'semanal',
            'pasiva': PASIVA[tipo][k % 2], 'base': repartir(perfil, total), 'habilidades': habs, 'definitivo': definitivo,
            'descripcion': desc, 'evoluciona': [], 'sprites': sprites,
        })
    return out


jefes = crear(SEMANALES, False) + crear(GUARDIANES, True)
json.dump({'criaturas': jefes}, open(os.path.join(RAIZ, 'src/data/jefes.json'), 'w'), ensure_ascii=False, indent=2)
print(f'✓ {len(jefes)} jefes en src/data/jefes.json')
for j in jefes[:3] + jefes[-2:]:
    print(j['nombre'], j['base'], j['habilidades'], j['definitivo'])
