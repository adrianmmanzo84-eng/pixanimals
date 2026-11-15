"""
Renombra las 165 criaturas jugables (D195): raíz del animal + «pix» (sufijo o prefijo, según la familia)
y una escalera de «resolución» por etapa: pix → pixel → megapix → gigapix. Las formas Eclipse llevan «Nox».
Solo cambia el campo `nombre`; los ids (y por lo tanto las partidas guardadas) no se tocan.
Uso: python3 scripts/renombrar.py
"""
import json, os, sys

RAIZ = os.path.join(os.path.dirname(__file__), '..')
P = os.path.join(RAIZ, 'src', 'data', 'criaturas.json')

# familia → (raíz del animal, estilo): 's' = raíz + pix (Leopix), 'p' = pix + raíz (Pixpulpo)
FAMILIAS = {
    'brasa': ('Leo', 's'),            # león
    'marea': ('tibu', 'p'),           # tiburón
    'brote': ('Oso', 's'),            # oso
    'mantarraya': ('Raya', 's'),
    'polilla': ('poli', 'p'),
    'ajolote': ('Ajolo', 's'),
    'caracol': ('Caraco', 's'),
    'colibri': ('coli', 'p'),
    'pangolin': ('Pango', 's'),
    'gecko': ('geco', 'p'),
    'cangrejo': ('Cangre', 's'),
    'liebre': ('liebre', 'p'),
    'pulpo': ('pulpo', 'p'),
    'fenec': ('Fene', 's'),
    'escarabajo': ('Escara', 's'),
    'puercoespin': ('espín', 'p'),
    'gallo': ('Gallo', 's'),
    'nutria': ('nutria', 'p'),
    'caballito': ('Cabali', 's'),
    'medusa': ('medusa', 'p'),
    'narval': ('Narva', 's'),
    'tapir': ('tapir', 'p'),
    'mantis': ('mantis', 'p'),
    'capibara': ('Capi', 's'),
    'fasmido': ('rama', 'p'),         # insecto palo
    'pavoreal': ('Pavo', 's'),
    'carpa': ('carpa', 'p'),
    'chinchilla': ('Chinchi', 's'),
    'golondrina': ('golon', 'p'),
    'buho': ('Buho', 's'),
    'murcielago': ('murci', 'p'),
    'topo': ('Topo', 's'),
    'mapache': ('mapache', 'p'),
}
ESCALERA = ['pix', 'pixel', 'megapix', 'gigapix']


def nombre(raiz: str, estilo: str, etapa: int, eclipse: bool) -> str:
    r = raiz.lower()
    if eclipse:
        base = f'{r}pix' if estilo == 's' else f'pix{r}'
        return 'Nox' + base
    w = ESCALERA[etapa - 1]
    s = f'{r}{w}' if estilo == 's' else f'{w}{r}'
    return s[0].upper() + s[1:]


datos = json.load(open(P, encoding='utf-8'))
usados = {}
for c in datos['criaturas']:
    raiz, estilo = FAMILIAS[c['familia']]
    nuevo = nombre(raiz, estilo, c['etapa'], c['id'].endswith('_eclipse'))
    assert len(nuevo) <= 16, nuevo
    assert nuevo not in usados, (nuevo, usados.get(nuevo), c['id'])
    usados[nuevo] = c['id']
    c['nombre'] = nuevo
open(P, 'w', encoding='utf-8').write(json.dumps(datos, ensure_ascii=False, indent=2) + '\n')
if '-v' in sys.argv:
    for n, i in usados.items():
        print(f'{i:22} {n}')
print(f'{len(usados)} criaturas renombradas')
