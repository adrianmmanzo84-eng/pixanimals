# Modo Historia — diseño (borrador para aprobar)

Estado: **solo diseño, sin código**. Versión del juego al escribirlo: 0.39.1.

## 1. Premisa (guion del autor: «La sombra del Eclipse»)
El Mundo Pixel está hecho de luz y color. Una sombra llamada **el Eclipse** absorbe el color de los paisajes. Al frente están los **Nox**, lugartenientes corruptos del Eclipse. Bajo su dominio, los Pixanimals comunes de cada región combaten presionados por los jefes: **no cambian de color ni se vuelven malvados**, por eso destacan sobre los paisajes grises.
El jugador es un **Restaurador** con el **Prisma Restaurador**, que no captura criaturas: disipa la influencia del Eclipse, libera a los reclutas y devuelve el color. Al reunir los 6 **Píxeles Maestros** se revela al **Arquitecto**, que quiere un lienzo en blanco silencioso e inmóvil.
Secundaria: la **Mina** y sus 2 jefes de roca (Astracorno, Geodrácnida), que dan el **Cuarzo de Luz**. Después de la historia, los 14 jefes semanales son brechas que abre el Arquitecto cada semana.
Tono: aventura amable, apta para todas las edades; tuteo; diálogos de 2 o 3 líneas.

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

## 4. Estructura de cada región (4 paradas, unos 10 min; decidido por el autor)
Los entrenadores se reemplazan por los jefes: cada región tiene solo 2 jefes de su tipo más el Guardián.
1. **Jefe A** (el más débil de los dos): comandante de zona. Al vencerlo se liberan sus reclutas.
2. **Desafío del entorno**: modo o minijuego obligado (ver sección 5); abre el camino al santuario.
3. **Jefe B (Jefe Regional)**: al vencerlo su vínculo con el Eclipse se rompe y entrega su **carta**.
4. **Guardián**: al purificarlo entrega el **Píxel Maestro** (la región recupera el color) y un **sobre**.

Las paradas 1 y 3 se presentan con diálogo corto del jefe; no hay entrenadores ni retratos.
Reutiliza `Ruta.ts` y el motor de combate sin cambios. Antes de vencer al Guardián el paisaje de la región se ve en gris (derivado por código del mismo fondo); los Pixanimals conservan su color.

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
Formatos: fondos 960×455 con dos círculos (tu Pixanimal a la izquierda y abajo, el rival a la derecha y arriba); mapa del mundo 960×640; íconos del tamaño de las medallas.
| Pieza | Quién | Para qué |
|---|---|---|
| Fondo de combate Desierto | autor | Región 4 |
| Fondo de combate Cumbre helada | autor | Región 5 |
| Fondo de combate Ruinas | autor | Región 6 |
| Fondo Origen del Eclipse + criatura final | autor (ya anunciado) | Final |
| Mapa del mundo (6 regiones, Mina y final) | provisorio mío, dibujo del autor después | Pantalla de selección |
| 6 íconos de Píxel Maestro | autor | Insignias de región |
| Arquitecto (frente y espalda HD, nombre, tipo, descripción) | autor | Final |
| Prisma Restaurador y Cuarzo de Luz (íconos) | autor, opcional | Interfaz y Mina |
| Nombre y descripción de la criatura final | autor | Final |

Mientras no estén los fondos, las regiones 4 a 6 usan los existentes más parecidos (`pradera`, `volcan`, `bosque`).

## 10. Plan de construcción (por fases, cada una se prueba antes de seguir)
- **H1 Cimientos:** datos de la historia (JSON validado), estado guardado, pantalla Mapa del mundo, bloqueo de modos.
- **H2 Prólogo y Región 1.**
- **H3 Región 2** (con Mina). Pausa para que el autor pruebe.
- **H4 Regiones 3 a 6.**
- **H5 Final y créditos.**
Pruebas en cada fase: tests del estado y de los desbloqueos, simulación de dificultad, y capturas con Playwright del mapa y de un recorrido completo.
