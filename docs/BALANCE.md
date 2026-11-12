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

Hay 4 etapas por familia. Las etapas 2, 3 y 4 usan las mismas proporciones que la etapa 1, escaladas a 380, 450 y 520 de total; evolucionan en los niveles 16, 28 y 40. Se simularán cuando exista la evolución (Fase 3).

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

Con estos valores, un Sobre Básico cuesta entre 3 y 5 victorias. La Esencia se acumula pero todavía no se gasta: su uso llega con los ítems y la evolución de la Fase 3.

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
