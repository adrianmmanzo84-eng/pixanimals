# Balance

Los números vigentes están en `src/data/balance.json`, `habilidades.json` y `criaturas.json`. Este documento explica la forma de las cuentas y qué dijo la simulación.

## Fórmulas (código: `src/core/combate/formulas.ts`)

```
PS            = 20 + base × nivel / 12
otros stats   = 5 + base × nivel / 25
daño          = potencia × (Ataque / Defensa) × (0,042 + 0,0088 × nivel)
                × mismo tipo (1,5) × tipo (1,25 ventaja · 0,85 desventaja)
                × azar (0,85 a 1,00) × crítico (1,5) × otros        mínimo 1
crítico       = 5 %, más 8 % si eres más veloz que el rival; ignora las mejoras de defensa
nivel de stat = ±50 % por nivel, tope ±2
```

`otros` reúne las pasivas (Último Rescoldo ×1,3 · Oleaje ×1,3), la quemadura (×0,75 al daño físico) y la guardia.

## Stats base de etapa 1 (total 300)

| Criatura | PS | Atq | Def | AtE | DfE | Vel | Rol |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lumbrito | 50 | 52 | 42 | 60 | 46 | 50 | El más veloz; se potencia y remata |
| Aletín | 50 | 45 | 50 | 56 | 50 | 49 | Especial equilibrado; bloquea con su escudo |
| Brotín | 60 | 50 | 52 | 40 | 56 | 42 | Resistente; se cura y envenena |

Hay 4 etapas por familia; evolucionan en los niveles 16, 28 y 40. Brasa y Marea usan las proporciones de la etapa 1, escaladas a 380, 450 y 520 de total. Brote tiene algo menos de PS y defensas desde la etapa 2 (ver «Fase 3: etapas evolucionadas»).

## Estados

| Estado | Efecto | Duración |
| --- | --- | --- |
| Quemadura (QUE) | Pierde 1/12 de PS por turno; daño físico −25 %. Brasa es inmune | 4 turnos |
| Veneno (VEN) | Pierde 1/10 de PS por turno | 5 turnos |
| Parálisis (PAR) | Velocidad −50 %; 25 % de perder el turno | 4 turnos |
| Sueño (SUE) | No actúa | 1 a 3 turnos |

## Resultado frente a los criterios de la Fase 0

| Criterio de la Fase 0 | Resultado | ¿Cumple? |
| --- | --- | --- |
| Pruebas automáticas en verde | 23 de 23 | Sí |
| Con ventaja de tipo se gana 60–70 % | 65–95 % según el cruce (Brasa sobre Brote 65–71 %, Brote sobre Marea 84–87 %, Marea sobre Brasa 93–95 %) | **No** |
| Espejo cerca de 50 % | 49–51 % | Sí |
| Duración media 6–12 turnos | 5,8 a 8,6; Brote contra Brote, 20 | Casi: un cruce queda fuera |
| Ningún cruce supera 20 turnos de media | Brote contra Brote: 19,9 a 20,4 | En el límite |
| Ninguna habilidad por debajo del 8 % de uso | Rugido Solar 7 %; el resto, 8 % o más | Casi |
| (nuevo) La IA Experta vence a la Táctica en espejo | 54–94 % | Sí: las habilidades que no son de ataque valen la pena |

### Por qué no se cumple el 60–70 %

En un 1 contra 1 entre dos jugadores igual de buenos, cualquier ventaja pequeña se repite todos los turnos y decide casi siempre. Para llegar a 60–70 % el multiplicador tendría que ser cercano a ×1,08, y la ventaja de tipo dejaría de sentirse. El objetivo estaba mal planteado para el 1 contra 1.

Lo que sí se midió con ×1,25 / ×0,85: una criatura en desventaja compensa con unos 2 niveles de diferencia, y con ×1,5 / ×0,67 necesitaba 4 o más. La respuesta real a la desventaja de tipo llega en la Fase 2 con los equipos de 3: cambiar de criatura.

### Puntos débiles conocidos

- **Aletín contra Lumbrito (93–95 %)** es el cruce más desparejo. Aletín bloquea el movimiento final con su escudo y Lumbrito no tiene respuesta.
- **Brote contra Brote** dura unos 20 turnos y suele terminar por Cansancio.
- **Rugido Solar** se usa poco: Lumbrito suele ganar más potenciándose y usando Zarpazo Ardiente.

## Fase 2: equipos de 3 y cambio de criatura

Cambiar de criatura gasta el turno, ocurre antes de los ataques y borra las mejoras de quien sale (los estados y los usos se conservan). Es la respuesta a la ventaja de tipo que quedó pendiente en la Fase 1.

| Cruce 3 contra 3 (nivel 15) | Gana el primero | Turnos de media |
| --- | --- | --- |
| Experta (cambia) contra Experta | 49 % | 33 |
| Experta (cambia) contra Táctica (no cambia) | 82 % | 22 |
| Táctica contra Novata | 88 % | 28 |
| Experta contra Novata | 98 % | 31 |

- **Cambiar vale la pena:** la IA que cambia le gana 8 de cada 10 veces a la que solo ataca.
- **Punto débil nuevo:** los combates de 3 contra 3 duran entre 22 y 34 turnos, más de lo deseable para sesiones cortas. Opciones para la Fase 5: animaciones más rápidas, botón de velocidad ×2 o combates de 2 contra 2 en el modo rápido.
- El Cansancio ahora cuenta 20 turnos desde la última caída, no desde el inicio.

## Fase 2: sobres y economía

Valores en `src/data/sobres.json` y `src/data/economia.json`.

| Rareza | Bonus a stats | Sobre Básico y Elemental | Sobre Raro | Esencia si se repite |
| --- | --- | --- | --- | --- |
| ★ Común | +0 % | 70 % | 40 % | 10 |
| ★★ Poco común | +4 % | 22 % | 35 % | 25 |
| ★★★ Rara | +8 % | 7 % | 20 % | 60 |
| ★★★★ Épica | +12 % | 1 % | 5 % | 150 |

| Concepto | Valor |
| --- | --- |
| Cartas por sobre | 3 (solo etapas 1) |
| Sobre Básico / Elemental / Raro | 100 / 250 / 600 monedas |
| Sobre Básico gratis | 1 cada 4 horas, acumula hasta 2 |
| Variante brillante | 1 de cada 64 cartas |
| Pity | Rara garantizada tras 10 sobres sin Rara; Épica tras 40 sin Épica |
| Monedas iniciales | 200 |
| Victoria (Novata / Táctica / Experta) | 20 / 30 / 40 monedas |
| Derrota | 5 monedas y la mitad de la experiencia |
| Experiencia por rival derrotado | 12 + 5 × nivel del rival, repartida entre quienes participaron |
| Experiencia para subir del nivel n | 10 + 4n + n²/2 |

Con estos valores, un Sobre Básico cuesta entre 3 y 5 victorias. La Esencia se gasta en vitaminas y en la barra de Entrenamiento (Fase 3).

## Simulación completa

`npm run simular` (10.000 combates por cruce, IA Experta en ambos lados, mismo nivel).

```
Simulación: 10000 combates por cruce · IA experta

=== Nivel 5 ===
Cruce                      | Gana A | Empate | Turnos medios | Máx
lumbrito vs lumbrito       |  50.4% |   0.0% |           6.7 | 14
lumbrito vs aletin         |   7.0% |   0.0% |           6.3 | 13
lumbrito vs brotin         |  70.8% |   0.0% |           8.6 | 17
aletin vs lumbrito         |  93.4% |   0.0% |           6.3 | 12
aletin vs aletin           |  49.5% |   0.0% |           8.1 | 15
aletin vs brotin           |  15.1% |   0.0% |           8.3 | 16
brotin vs lumbrito         |  28.8% |   0.0% |           8.6 | 17
brotin vs aletin           |  84.8% |   0.0% |           8.3 | 16
brotin vs brotin           |  49.4% |   0.0% |          20.4 | 29

Uso de habilidades (espejo):
  lumbrito: Zarpazo Ardiente 56% · Pelaje Ígneo 14% · Rugido Solar 7% · Grito de Manada 23%
  aletin: Dentellada Marina 58% · Tsunami 15% · Corriente 17% · Escudo de Burbujas 9%
  brotin: Zarpazo de Raíz 61% · Furia del Bosque 18% · Armadura de Corteza 8% · Baño de Sol 13%

IA Experta contra IA Táctica (espejo, % de victorias de la Experta):
  lumbrito 78% · aletin 54% · brotin 94%

Equipos de 3 contra 3 (orden inicial al azar):
  experta vs experta: gana A 50.7% · 34.1 turnos de media (máx. 54) · 3.7 cambios de A por combate
  experta vs tactica: gana A 84.0% · 22.0 turnos de media (máx. 36) · 1.5 cambios de A por combate
  tactica vs novata: gana A 87.2% · 28.4 turnos de media (máx. 58) · 0.0 cambios de A por combate
  experta vs novata: gana A 98.7% · 31.8 turnos de media (máx. 59) · 1.3 cambios de A por combate

=== Nivel 15 ===
Cruce                      | Gana A | Empate | Turnos medios | Máx
lumbrito vs lumbrito       |  50.4% |   0.0% |           6.5 | 13
lumbrito vs aletin         |   5.3% |   0.0% |           5.9 | 10
lumbrito vs brotin         |  67.3% |   0.0% |           8.5 | 17
aletin vs lumbrito         |  94.3% |   0.0% |           5.9 | 11
aletin vs aletin           |  50.0% |   0.0% |           8.0 | 15
aletin vs brotin           |  15.3% |   0.0% |           8.2 | 17
brotin vs lumbrito         |  31.9% |   0.0% |           8.5 | 17
brotin vs aletin           |  84.9% |   0.0% |           8.2 | 17
brotin vs brotin           |  49.3% |   0.0% |          20.0 | 28

Uso de habilidades (espejo):
  lumbrito: Zarpazo Ardiente 56% · Pelaje Ígneo 14% · Rugido Solar 7% · Grito de Manada 23%
  aletin: Dentellada Marina 58% · Tsunami 15% · Corriente 18% · Escudo de Burbujas 9%
  brotin: Zarpazo de Raíz 61% · Furia del Bosque 18% · Armadura de Corteza 9% · Baño de Sol 13%

IA Experta contra IA Táctica (espejo, % de victorias de la Experta):
  lumbrito 75% · aletin 58% · brotin 93%

Equipos de 3 contra 3 (orden inicial al azar):
  experta vs experta: gana A 48.6% · 33.4 turnos de media (máx. 48) · 3.5 cambios de A por combate
  experta vs tactica: gana A 82.4% · 21.8 turnos de media (máx. 34) · 1.4 cambios de A por combate
  tactica vs novata: gana A 88.1% · 27.7 turnos de media (máx. 57) · 0.0 cambios de A por combate
  experta vs novata: gana A 98.4% · 31.1 turnos de media (máx. 61) · 1.3 cambios de A por combate

=== Nivel 30 ===
Cruce                      | Gana A | Empate | Turnos medios | Máx
lumbrito vs lumbrito       |  49.7% |   0.0% |           6.5 | 14
lumbrito vs aletin         |   5.0% |   0.0% |           5.8 | 11
lumbrito vs brotin         |  65.8% |   0.0% |           8.4 | 16
aletin vs lumbrito         |  95.0% |   0.0% |           5.8 | 11
aletin vs aletin           |  50.5% |   0.0% |           7.8 | 17
aletin vs brotin           |  12.9% |   0.0% |           8.2 | 17
brotin vs lumbrito         |  35.2% |   0.0% |           8.5 | 17
brotin vs aletin           |  87.4% |   0.0% |           8.2 | 17
brotin vs brotin           |  50.3% |   0.0% |          19.9 | 28

Uso de habilidades (espejo):
  lumbrito: Zarpazo Ardiente 56% · Pelaje Ígneo 14% · Rugido Solar 7% · Grito de Manada 23%
  aletin: Dentellada Marina 57% · Tsunami 15% · Corriente 18% · Escudo de Burbujas 9%
  brotin: Zarpazo de Raíz 61% · Furia del Bosque 17% · Armadura de Corteza 9% · Baño de Sol 13%

IA Experta contra IA Táctica (espejo, % de victorias de la Experta):
  lumbrito 68% · aletin 59% · brotin 92%

Equipos de 3 contra 3 (orden inicial al azar):
  experta vs experta: gana A 50.3% · 33.5 turnos de media (máx. 51) · 3.5 cambios de A por combate
  experta vs tactica: gana A 80.4% · 21.7 turnos de media (máx. 34) · 1.4 cambios de A por combate
  tactica vs novata: gana A 88.6% · 27.7 turnos de media (máx. 57) · 0.0 cambios de A por combate
  experta vs novata: gana A 98.2% · 30.9 turnos de media (máx. 61) · 1.3 cambios de A por combate
```

## Fase 3: etapas evolucionadas

`npm run ajustar -- 3000` (1 contra 1, IA Experta, nivel típico de cada etapa). Objetivo: que cada etapa repita el perfil de la etapa 1.

| Etapa (nivel) | Brasa sobre Brote | Brote sobre Marea | Marea sobre Brasa | Totales Brasa / Marea / Brote |
| --- | --- | --- | --- | --- |
| 1 (12) | 66 % | 85 % | 94 % | 300 / 300 / 300 |
| 2 (22) | 66 % | 86 % | 91 % | 380 / 380 / 369 |
| 3 (34) | 64 % | 89 % | 89 % | 450 / 450 / 422 |
| 4 (46) | 67 % | 86 % | 88 % | 520 / 520 / 473 |

Antes del ajuste, con las proporciones de la etapa 1 en todas las etapas, Brasa le ganaba a Brote solo el 54 / 35 / 24 % en las etapas 2 / 3 / 4. En la etapa 1, el valor fijo de la fórmula (+5 en cada stat) suaviza las diferencias; con stats grandes, la resistencia y la curación de Brote pesan cada vez más.

Evolucionar vale la pena: a igual nivel, la etapa nueva le gana a la anterior de su familia el 73–100 % de las veces, y le gana a la etapa anterior de la familia que la vence por tipo el 34–71 %. Una evolución compensa más o menos una desventaja de tipo.

## Fase 3: ítems y premios

Valores en `src/data/items.json` y `src/data/economia.json`.

| Ítem | Efecto | Precio |
| --- | --- | --- |
| Caramelo chico / mediano / grande | 60 / 200 / 600 de experiencia | 40 / 120 / 320 monedas |
| Vitaminas (6, una por stat) | +3 % al stat para siempre; 5 por stat y 12 en total | 40 Esencia |
| Incienso | 30 min con Rara y Épica ×2 en los sobres | 150 monedas |
| Poción · Antídoto · Tónico · Carta Escudo | 50 % de PS · quita el estado · +5 usos por habilidad · la mitad de daño ese turno | 30 · 20 · 40 · 35 monedas |
| Piedra Eclipse | Etapa 3 → forma Eclipse a nivel 40 (se gasta) | 400 monedas |

- **Ofertas del día:** 3 ítems con −30 %.
- **Ítems por combate:** 2 como máximo; usar uno gasta el turno.
- **Entrenamiento:** barra de 100; +10 por victoria a cada participante; 1 Esencia por punto. Llenarla con Esencia cuesta 100, lo que dan unas 4 cartas Comunes repetidas.
- **Carta premio** (3 cartas por victoria; pesos): monedas 20–50 (40), Esencia 15–40 (22), Caramelo chico (15), Poción (8), Caramelo mediano (6), Tónico (4), Incienso (2), criatura de etapa 1 (3).

## Formas Eclipse

> Los stats y resultados de esta sección son de antes de las 13 familias; los vigentes están en «13 familias y 7 tipos».

Alternativa a la etapa 4: mismo total, más ataque y velocidad, menos defensa. Se consiguen desde la etapa 3 a nivel 40, con la barra de Entrenamiento llena y una Piedra Eclipse.

| Criatura | PS | Atq | Def | AtE | DfE | Vel | Total |
|---|---|---|---|---|---|---|---|
| Solarión Eclipse | 80 | 104 | 64 | 100 | 70 | 102 | 520 |
| Leviatán Eclipse | 82 | 80 | 72 | 114 | 72 | 100 | 520 |
| Titán Eclipse | 84 | 106 | 66 | 64 | 70 | 83 | 473 |

Victorias a nivel 46 (3000 combates, IA Experta):

| Cruce | Eclipse | Forma normal |
|---|---|---|
| Contra su propia forma normal | 58 / 48 / 61 % (Brasa / Marea / Brote) | — |
| Brasa contra Titán Ancestral (ventaja) | 67 % | 67 % |
| Marea contra Solarión (ventaja) | 93 % | 88 % |
| Brote contra Leviatán (ventaja) | 76 % | 86 % |
| Brasa contra Leviatán (desventaja) | 6 % | 12 % |
| Marea contra Titán Ancestral (desventaja) | 22 % | 14 % |
| Brote contra Solarión (desventaja) | 22 % | 33 % |

Titán Eclipse empezó con Velocidad 87 y le ganaba el 46 % a Solarión, su rival con ventaja; con 83 ya no lo adelanta y el triángulo se mantiene.

## 13 familias y 7 tipos

### Tabla de tipos

Con ventaja de tipo el daño se multiplica por 1,25; en contra, por 0,85. Cada tipo vence a 2 y pierde contra 2; se mantiene el triángulo original.

| Tipo | Vence a | Pierde contra |
|---|---|---|
| Brasa | Brote, Sombra | Marea, Cielo |
| Marea | Brasa, Roca | Brote, Rayo |
| Brote | Marea, Roca | Brasa, Cielo |
| Rayo | Marea, Cielo | Roca, Sombra |
| Roca | Rayo, Sombra | Marea, Brote |
| Cielo | Brasa, Brote | Rayo, Sombra |
| Sombra | Rayo, Cielo | Brasa, Roca |

### Familias (stats de etapa 1; las demás etapas escalan a 380 / 450 / 520)

Brote conserva su ajuste propio por etapa (D72). Cada Eclipse suma lo mismo que su etapa 4 pero pasa un 14 % de Defensa y Def. Especial y un 6 % de PS al ataque principal (55 %), la Velocidad (30 %) y el otro ataque.

| Línea · Eclipse | Tipo | Pasiva | PS | Atq | Def | AtE | DfE | Vel |
|---|---|---|---|---|---|---|---|---|
| Lumbrito → Leobrasa → Ignileón → Solarión · Solarión Eclipse | Brasa | Último Rescoldo | 64 | 48 | 50 | 54 | 38 | 46 |
| Aletín → Corsario → Almirante → Leviatán · Leviatán Eclipse | Marea | Oleaje | 56 | 35 | 66 | 62 | 48 | 33 |
| Brotín → Robledo → Guardabosque → Titán Ancestral · Titán Eclipse | Brote | Raíces | 60 | 50 | 52 | 40 | 56 | 42 |
| Mantín → Mantabrisa → Nimbomanta → Soberaya · Soberaya Eclipse | Cielo | Viento a Favor | 50 | 44 | 36 | 54 | 42 | 74 |
| Larvín → Capullón → Polinoche → Obsidia · Obsidia Eclipse | Sombra | Luna Nueva | 38 | 38 | 36 | 56 | 70 | 62 |
| Ajolín → Chispolote → Truenolote → Ajotrón · Ajotrón Eclipse | Rayo | Carga Estática | 52 | 44 | 30 | 52 | 60 | 62 |
| Caracolín → Pedrecol → Murallacol → Bastión · Bastión Eclipse | Roca | Piedra Viva | 50 | 48 | 78 | 34 | 60 | 30 |
| Colibrín → Picoespina → Espinaflor → Florarca · Florarca Eclipse | Brote | Furia Espinosa | 50 | 62 | 54 | 36 | 34 | 64 |
| Pangolito → Prismolín → Cuarzolín → Prismón · Prismón Eclipse | Roca | Piedra Viva | 44 | 62 | 54 | 36 | 50 | 54 |
| Gequito → Velogeco → Aurogeco → Auragón · Auragón Eclipse | Cielo | Viento a Favor | 46 | 64 | 60 | 34 | 38 | 58 |
| Ermitín → Pinzacho → Relicario → Relicón · Relicón Eclipse | Marea | Refugio | 62 | 60 | 76 | 28 | 34 | 40 |
| Orejín → Saltaluna → Medialuna → Astaluna · Astaluna Eclipse | Sombra | Luna Nueva | 48 | 68 | 48 | 38 | 42 | 56 |
| Pulpín → Tintapus → Abisopus → Regiopus · Regiopus Eclipse | Sombra | Tinta | 48 | 56 | 32 | 68 | 66 | 30 |

Las pasivas nuevas usan una de las 3 mecánicas: Carga Estática, Viento a Favor y Tinta funcionan como Oleaje; Luna Nueva y Furia Espinosa, como Último Rescoldo; Piedra Viva y Refugio, como Raíces.

### Cómo se ajustó

Con stats «a ojo», las familias resistentes ganaban el 94 % de sus cruces sin ventaja de tipo y las frágiles el 8 %. Los stats de las familias nuevas, y los de Brasa y Marea, salieron de una búsqueda automática por simulación (D88). La meta era que cada familia quedara cerca del 50 % contra rivales sin ventaja de tipo y que la ventaja de tipo diera al menos el 62 %, sin cambiar el estilo de cada familia. También cambiaron tres habilidades de apoyo que subían la Velocidad (D87): Corriente ahora sube la Def. Especial, Viento de Cola el Ataque Especial y Luna Creciente el Ataque. Si Corriente subía el Ataque Especial, Brote dejaba de ganarle a Marea.

### Resultado (`npm run familias -- 1000`, IA Experta)

«Todas» es el promedio de victorias contra las otras 12 familias; «sin ventaja de tipo» cuenta solo los cruces en que ninguno de los dos tiene ventaja.

**Etapa 1 (nivel 12)**

```
Brotín         brote   todas  62 %   sin ventaja de tipo  56 %
Orejín         sombra  todas  57 %   sin ventaja de tipo  50 %
Aletín         marea   todas  55 %   sin ventaja de tipo  48 %
Gequito        cielo   todas  51 %   sin ventaja de tipo  51 %
Lumbrito       brasa   todas  50 %   sin ventaja de tipo  49 %
Mantín         cielo   todas  50 %   sin ventaja de tipo  60 %
Larvín         sombra  todas  50 %   sin ventaja de tipo  56 %
Ajolín         rayo    todas  49 %   sin ventaja de tipo  48 %
Pangolito      roca    todas  49 %   sin ventaja de tipo  45 %
Colibrín       brote   todas  46 %   sin ventaja de tipo  50 %
Ermitín        marea   todas  46 %   sin ventaja de tipo  49 %
Pulpín         sombra  todas  46 %   sin ventaja de tipo  49 %
Caracolín      roca    todas  40 %   sin ventaja de tipo  35 %
Con ventaja de tipo se gana el 86 % (mín 63, máx 100, 46 cruces)
```

**Etapa final (nivel 46)**

```
Leviatán       marea   todas  59 %   sin ventaja de tipo  55 %
Titán Ancestral brote   todas  59 %   sin ventaja de tipo  52 %
Prismón        roca    todas  54 %   sin ventaja de tipo  56 %
Astaluna       sombra  todas  54 %   sin ventaja de tipo  42 %
Bastión        roca    todas  54 %   sin ventaja de tipo  59 %
Solarión       brasa   todas  52 %   sin ventaja de tipo  50 %
Regiopus       sombra  todas  49 %   sin ventaja de tipo  57 %
Relicón        marea   todas  49 %   sin ventaja de tipo  55 %
Florarca       brote   todas  48 %   sin ventaja de tipo  55 %
Ajotrón        rayo    todas  44 %   sin ventaja de tipo  39 %
Auragón        cielo   todas  44 %   sin ventaja de tipo  31 %
Obsidia        sombra  todas  43 %   sin ventaja de tipo  52 %
Soberaya       cielo   todas  41 %   sin ventaja de tipo  44 %
Con ventaja de tipo se gana el 87 % (mín 61, máx 100, 46 cruces)
```

**Eclipse contra su forma normal (nivel 46)**

```
Solarión Eclipse    45 %
Leviatán Eclipse    65 %
Titán Eclipse       61 %
Soberaya Eclipse    56 %
Obsidia Eclipse     59 %
Ajotrón Eclipse     56 %
Bastión Eclipse     68 %
Florarca Eclipse    49 %
Prismón Eclipse     65 %
Auragón Eclipse     52 %
Relicón Eclipse     67 %
Astaluna Eclipse    61 %
Regiopus Eclipse    55 %
```

Triángulo original (`npm run ajustar`): Brasa > Brote 75–78 %, Brote > Marea 87–92 %, Marea > Brasa 94–96 % en las 4 etapas.

Puntos débiles: Caracolín es la familia más floja en la etapa 1 (35 % sin ventaja), pero en la final queda entre las fuertes; Auragón y Ajotrón quedan bajos en la etapa final (31 y 39 %). Bastión, Relicón, Leviatán y Prismón Eclipse le ganan el 65–68 % a su forma normal; Solarión Eclipse, el 45 %.

## Fase 4: minijuegos, premio diario y misiones

Valores en `src/data/economia.json`.

| Concepto | Valor |
|---|---|
| Partida de minijuego | 8 a 20 de Entrenamiento y 5 a 15 monedas, proporcional al puntaje |
| Partidas con premio | 5 por minijuego y por día |
| Premio diario | 50 monedas; el día 7 de la racha, además un Sobre Raro |
| Misiones | 3 por día; 25 a 60 monedas o 25 a 35 de Esencia cada una |

Puntaje (de 0 a 1) de cada minijuego:

| Minijuego | Cómo se juega | Puntaje 1 |
|---|---|---|
| Lluvia de Bayas | 30 s; baya +1, dorada +3, piedra −2 y aturde | 35 bayas |
| Eco | Secuencia que empieza en 3 y suma una por acierto; un error termina | 10 flechas (tope 12) |
| Golpe Justo | 8 rondas; centro 2 puntos, franja 1 | 16 puntos |

Ritmo: con 3 minijuegos × 5 partidas, un buen jugador suma hasta 300 de Entrenamiento por día (3 barras llenas), además de 10 por victoria. Una barra (100) son unas 6 partidas buenas, unos 5 minutos.

## Fase 5: modos, amuletos y ritmo de combate

| Concepto | Valor |
|---|---|
| Combate rápido | 20 / 30 / 40 monedas según la IA (sin cambios) |
| Torre: nivel del rival | 3 + 2×piso; jefes +2; tope 50 |
| Torre: IA | novata (pisos 1–3), táctica (4–10), experta (11+); jefes al menos táctica |
| Torre: premio (primera vez) | 30 + 5×piso monedas; jefe (cada 5): Sobre Básico; cada 10: Sobre Raro |
| Entrenador del día | nivel de tu mejor criatura del equipo + 2, IA experta; 150 monedas + Sobre Elemental, una vez por día |
| Amuletos | +10 % a un stat; 300 monedas; uno por criatura |
| Daño en equipos | ×1,25 |

Duración de 3 contra 3 (400 combates por nivel, IA experta contra táctica, equipos al azar):

| Nivel | Antes (mediana, p10–p90) | Con daño ×1,25 |
|---|---|---|
| 10 | 20 (15–26) | 16 (13–22) |
| 22 | 23 (18–31) | 19 (14–25) |
| 46 | 29 (22–39) | 24 (19–32) |

El 1 contra 1 sigue en 6,5–9 turnos de mediana, dentro de lo que pide el GDD (6 a 12).

## Ataques por evolución y Ataque Definitivo

| Etapa | Cambia | Valor |
|---|---|---|
| 2 | Ofensivo | potencia 45 → 55, con 15–25 % de efecto |
| 3 | Apoyo | +1 a dos stats, o cura 35 % |
| 4 | Final | potencia 90 a 110 según la familia |
| Eclipse | Final propio | potencia parecida a la normal, precisión 85, otro efecto |
| 4 y Eclipse | Ataque Definitivo | elimina al rival activo; 1 vez por combate, desde el turno 5; una guardia lo bloquea |

Stats de etapa 4 ajustados por simulación (Brote conserva los suyos). Resultado (`npm run familias -- 800`):

- Etapa final, sin ventaja de tipo: de 41 a 59 % por familia; con ventaja de tipo, de 55 a 100 % (media 84 %).
- Triángulo original en la etapa 4: Brasa > Brote 94 %, Brote > Marea 81 %, Marea > Brasa 92 %.
- Eclipse contra su forma normal: de 45 a 67 %.
- Duración (mediana): 1 contra 1, 5 a 7 turnos; 3 contra 3, 16 a 20.
- En 300 combates contra el jefe del piso 20 con Definitivos de los dos lados, un tercio de los Definitivos fue resistido con una guardia.

## 33 familias (tercera tanda)

20 familias nuevas, 4 por clase de los paquetes de arte, repartidas entre los 7 tipos (D133). Mismo molde de habilidades que las 13 anteriores (D135).

### Tipos por familia

| Tipo | Familias |
|---|---|
| Brasa | Brasa, Fénec, Escarabajo, Puercoespín, Gallo |
| Marea | Marea, Cangrejo, Nutria, Caballito, Medusa, Narval |
| Brote | Brote, Colibrí, Tapir, Mantis, Capibara, Fásmido |
| Rayo | Ajolote, Pavo real, Carpa farol, Chinchilla |
| Roca | Caracol, Pangolín, Topo, Mapache |
| Cielo | Mantarraya, Gecko, Golondrina, Búho |
| Sombra | Polilla, Liebre, Pulpo, Murciélago |

### Cómo se ajustó

`npm run ajustar-familias -- <familias>` mueve un solo valor por familia (hasta 16 % de los stats entre ataque y aguante, igual en las 4 etapas) hasta que la etapa 1 y la 4 queden cerca del 50 % contra las 13 familias originales. La Eclipse se ajusta aparte, para ganarle a su forma normal cerca del 58 %. Las familias que seguían fuertes con el ajuste al tope se corrigieron en el kit (D136).

### Resultado (`npm run familias -- 300`, IA Experta, contra las 33 familias)

Stats de etapa 1 (PS / Atq / Def / AtE / DfE / Vel) y porcentaje de victorias en la etapa 1 (nivel 12) y en la final (nivel 46):

| Línea | Tipo | Pasiva | Etapa 1 | Gana E1 | Gana E4 |
|---|---|---|---|---|---|
| Fenequín → Vitreón | Brasa | Espejismo (ultimo_rescoldo) | 47 / 41 / 39 / 62 / 47 / 64 | 55 % | 48 % |
| Escarlito → Fundaris | Brasa | Fragua Viva (ultimo_rescoldo) | 45 / 75 / 48 / 43 / 42 / 47 | 52 % | 60 % |
| Carbunín → Carbunco | Brasa | Púas Ardientes (ultimo_rescoldo) | 45 / 74 / 54 / 44 / 40 / 43 | 54 % | 48 % |
| Chispollo → Cometón | Brasa | Canto del Alba (oleaje) | 45 / 63 / 39 / 43 / 42 / 68 | 54 % | 44 % |
| Nutrín → Nutrarca | Marea | Piedra Coralina (raices) | 46 / 68 / 42 / 47 / 42 / 55 | 45 % | 63 % |
| Hipín → Abisalio | Marea | Corriente Abisal (oleaje) | 36 / 36 / 34 / 79 / 45 / 70 | 59 % | 46 % |
| Medusín → Carillón | Marea | Campana Serena (raices) | 46 / 30 / 39 / 73 / 62 / 50 | 39 % | 45 % |
| Narvalín → Glacior | Marea | Hielo Ártico (ultimo_rescoldo) | 50 / 68 / 45 / 37 / 40 / 60 | 52 % | 52 % |
| Tapirín → Micelón | Brote | Micelio (raices) | 52 / 69 / 50 / 46 / 43 / 40 | 50 % | 57 % |
| Ninfín → Orquira | Brote | Pétalo Filoso (ultimo_rescoldo) | 42 / 68 / 42 / 41 / 39 / 68 | 49 % | 47 % |
| Capibín → Raigón | Brote | Calma Manglar (raices) | 66 / 50 / 54 / 50 / 56 / 24 | 46 % | 44 % |
| Ramitín → Bambuzal | Brote | Rama Quieta (oleaje) | 38 / 46 / 44 / 73 / 39 / 60 | 49 % | 54 % |
| Pavito → Heliavo | Rayo | Abanico Solar (ultimo_rescoldo) | 42 / 43 / 38 / 73 / 44 / 60 | 55 % | 53 % |
| Carpín → Faroluz | Rayo | Farol Interior (ultimo_rescoldo) | 39 / 31 / 35 / 77 / 44 / 74 | 59 % | 49 % |
| Chinchín → Prismora | Rayo | Pelaje Estático (oleaje) | 51 / 58 / 49 / 36 / 46 / 60 | 56 % | 52 % |
| Golondrín → Albalis | Cielo | Vuelo Rasante (oleaje) | 48 / 68 / 42 / 40 / 42 / 60 | 56 % | 55 % |
| Buhíto → Umbrus | Cielo | Ojos Nocturnos (ultimo_rescoldo) | 42 / 40 / 37 / 75 / 46 / 60 | 54 % | 54 % |
| Murcito → Véspero | Sombra | Eco Nocturno (oleaje) | 53 / 56 / 48 / 39 / 51 / 53 | 50 % | 53 % |
| Topín → Geodón | Roca | Geoda Viva (raices) | 52 / 77 / 51 / 38 / 44 / 38 | 50 % | 54 % |
| Mapachín → Onixor | Roca | Astucia (ultimo_rescoldo) | 52 / 60 / 57 / 34 / 49 / 48 | 53 % | 46 % |

Con ventaja de tipo se gana el 83 % de los cruces en la etapa 1 y el 81 % en la final. Las Eclipse nuevas le ganan a su forma normal entre el 50 % y el 64 %. Contra las 13 originales, las etapas 2 y 3 de las familias nuevas quedan entre el 40 % y el 65 %.
