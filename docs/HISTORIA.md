# Modo Historia — diseño (borrador para aprobar)

Estado: **solo diseño, sin código**. Versión del juego al escribirlo: 0.39.1.

## 1. Premisa
El **Eclipse** apaga los píxeles del mundo Pixel: los colores se vuelven grises y los Pixanimals que toca se transforman en sus formas **Nox**. Cada región guarda un **Píxel Maestro** que protege su color; un Guardián lo custodia y el Eclipse ya lo está cercando. El jugador recorre las 6 regiones, devuelve el color a cada una y al final llega al origen del Eclipse.

Tono: aventura amable, apta para todas las edades. Diálogos de 2 o 3 líneas.

## 2. Reglas que ya están decididas
- **No se capturan Pixanimals.** Las cartas se ganan **venciendo a un jefe**, o en sobres y premios. La historia solo otorga cartas por jefes y por premios de capítulo.
- Los jugadores **nuevos** tienen los modos bloqueados hasta que la historia los abre. Las partidas guardadas existentes lo conservan todo.
- La historia **nunca se bloquea con compras**: sobres y monedas solo aceleran.

## 3. Las 6 regiones (salen de los Guardianes que ya existen)
Cada región tiene un tipo, un Guardián ya hecho y 2 jefes de ese tipo ya hechos (los semanales).

| # | Región | Tipo | Jefes de la región | Guardián (jefe final de la región) | Fondo de combate |
|---|---|---|---|---|---|
| 1 | Bosque | brote | Zarzabal, Micérvido | Raíz Primordial | `bosque` (existe) |
| 2 | Volcán | brasa | Caldrak, Ferrandra | Bastión Ceniza | `volcan` (existe) |
| 3 | Arrecife | marea | Talasor, Borealmo | Custodio Mareas | `costa` (existe) |
| 4 | Desierto | rayo | Fulgarok, Najasol | Vigía del Sol Sepulto | **falta** |
| 5 | Cumbre helada | cielo | Tempestario, Ciclóptero | Centinela del Último Hielo | **falta** |
| 6 | Ruinas | sombra | Umbrafauce, Negralith | Custodio del Umbral | **falta** |
| Final | Origen del Eclipse | — | — | (la entrega el autor) | (lo entrega el autor) |

Los jefes de tipo **roca** (Astracorno, Geodrácnida) quedan para la Mina, que es el modo de roca.

## 4. Estructura de cada región (5 paradas, unos 10 a 15 min)
1. **Entrenador de la zona**: combate fácil con criaturas del tipo de la región.
2. **Entrenador de la zona**: combate algo más difícil.
3. **Parada de modo**: visita obligada a un modo o minijuego (ver tabla 5). Es la forma de desbloquearlos.
4. **Jefe de la región**: uno de los dos jefes del tipo. Al vencerlo se obtiene su carta.
5. **Guardián**: combate final. Da el **Píxel Maestro** (la insignia de la región) y un sobre.

Cada parada reutiliza `Ruta.ts` (mapa de estaciones) y el motor de combate actual; no se toca el motor.

## 5. Desbloqueos
| Cuándo | Se abre |
|---|---|
| Prólogo | Combate rápido, Equipo, Bolsa, Sobres |
| Región 1 | Bestiario y Álbum; Golpe justo |
| Región 2 | Mina (zona 1) y Tienda |
| Región 3 | Cronoportal (era 1) |
| Región 4 | Torre |
| Región 5 | Ruleta y Desafío del día |
| Región 6 | Jefe semanal y Entrenador del día |
| Final | Modo libre completo; la historia pasa a «Repetir regiones» |

Provisorio: el orden se ajusta tras probarlo.

## 6. Dificultad (provisoria, tope de nivel del juego: 50)
Región 1: niveles 5 a 12. 2: 12 a 18. 3: 18 a 24. 4: 24 a 30. 5: 30 a 38. 6: 38 a 45. Final: 50. IA: novata, táctica y experta según región. Se calibra con simulaciones del motor, como la Torre.

## 7. Prólogo (unos 5 minutos)
1. Texto corto: los colores se apagan.
2. Eliges tu primer Pixanimal (3 opciones de etapa 1).
3. Combate guiado contra una criatura Nox débil.
4. Golpe justo explicado en ese combate.
5. Abres tu primer sobre.
6. El Mapa del mundo se abre con la Región 1.
Reemplaza la guía actual (`guia.paso`).

## 8. Retención (qué se hace cuando acaba la historia)
- **Diario:** Desafío del día, Ruleta, Entrenador del día.
- **Semanal:** Jefe semanal.
- **Largo plazo:** Álbum, Torre, brillantes, formas Eclipse, repetir regiones en dificultad alta.
- **Futuro:** nuevas regiones (7, 8…), minijuegos, Pixanimals, escenarios e ítems se enganchan al mapa.

## 9. Lo que falta (a cargo del autor o a decidir)
| Pieza | Quién | Para qué |
|---|---|---|
| Fondo de combate Desierto | autor | Región 4 |
| Fondo de combate Cumbre helada | autor | Región 5 |
| Fondo de combate Ruinas | autor | Región 6 |
| Fondo Origen del Eclipse + criatura final | autor (ya anunciado) | Final |
| Mapa del mundo (6 regiones + final) | provisorio mío, dibujo del autor después | Pantalla de selección |
| Nombre y descripción de la criatura final | autor | Final |

Mientras no estén los fondos, las regiones 4 a 6 usan los existentes más parecidos (`pradera`, `volcan`, `bosque`).

## 10. Plan de construcción (por fases, cada una se prueba antes de seguir)
- **H1 Cimientos:** datos de la historia (JSON validado), estado guardado, pantalla Mapa del mundo, bloqueo de modos.
- **H2 Prólogo y Región 1.**
- **H3 Región 2** (con Mina). Pausa para que el autor pruebe.
- **H4 Regiones 3 a 6.**
- **H5 Final y créditos.**
Pruebas en cada fase: tests del estado y de los desbloqueos, simulación de dificultad, y capturas con Playwright del mapa y de un recorrido completo.
