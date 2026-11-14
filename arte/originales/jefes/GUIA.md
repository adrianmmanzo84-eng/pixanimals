# PIXANIMALS · 14 jefes semanales y 6 guardianes

Veinte diseños especiales, con **frente a la izquierda y espalda a la derecha**. Fondo transparente, pixel art de bloques grandes y aura de partículas separadas. Los nombres de personaje son propuestas; los nombres de archivo son los solicitados.

## Archivos para usar

- En la carpeta principal están las **20 láminas de 1536×768**, apaisadas 2:1. Son ampliaciones exactas ×8 del pixel art final, sin suavizado.
- `juego_96/`: las mismas láminas en **192×96**, listas para importar como dos celdas de 96×96.
- `vistas_96/`: **40 PNG individuales de 96×96**, con sufijos `_frente` y `_espalda`.
- `fuentes/`: arte original generado en alta resolución, conservado para futuras ediciones.
- `catalogo.html`: galería local con enlaces a cada versión.
- `manifest.json` e `indice.csv`: relación entre personajes, nombres, tipos y archivos.
- `control_calidad.json`: tamaños, transparencia, cantidad de colores y huellas de los archivos finales.
- `prompts.json`: conceptos e instrucciones usados con el generador de imágenes integrado.

## Jefes semanales

| Archivo | Nombre propuesto | Tipo | Diseño |
|---|---|---|---|
| `jefe_semana_01.png` | Caldrak | Brasa | Cocodrilo de caldera |
| `jefe_semana_02.png` | Ferrandra | Brasa | Salamandra de fragua |
| `jefe_semana_03.png` | Talasor | Marea | Morena abisal |
| `jefe_semana_04.png` | Borealmo | Marea | Morsa glacial |
| `jefe_semana_05.png` | Zarzabal | Brote | Jabalí de zarzas |
| `jefe_semana_06.png` | Micérvido | Brote | Ciervo de micelio |
| `jefe_semana_07.png` | Fulgarok | Rayo | Bisonte de tormenta |
| `jefe_semana_08.png` | Najasol | Rayo | Cobra prisma |
| `jefe_semana_09.png` | Astracorno | Roca | Íbice meteórico |
| `jefe_semana_10.png` | Geodrácnida | Roca | Araña de geoda |
| `jefe_semana_11.png` | Tempestario | Cielo | Albatros de tormenta |
| `jefe_semana_12.png` | Ciclóptero | Cielo | Pterosaurio de ciclón |
| `jefe_semana_13.png` | Umbrafauce | Sombra | Pantera de colmillos de sable |
| `jefe_semana_14.png` | Negralith | Sombra | Escorpión del vacío |

## Guardianes de expedición o evento

| Archivo | Nombre propuesto | Territorio | Diseño |
|---|---|---|---|
| `jefe_evento_01.png` | Bastión de Ceniza | Volcán | Tortuga de basalto |
| `jefe_evento_02.png` | Custodio de las Mareas | Arrecife | Nautilo ancestral |
| `jefe_evento_03.png` | Raíz Primordial | Bosque | Elefante del bosque |
| `jefe_evento_04.png` | Vigía del Sol Sepulto | Desierto | Chacal solar |
| `jefe_evento_05.png` | Centinela del Último Hielo | Cumbre | Gorila glacial |
| `jefe_evento_06.png` | Custodio del Umbral | Ruinas | Garza ancestral |

## Integración de las vistas

En `juego_96/`, recortar el frente con `[0, 0, 96, 96]` y la espalda con `[96, 0, 96, 96]`. Mantener el filtrado de vecino más cercano o desactivar el suavizado de texturas. Ambas vistas usan la misma escala proporcional y una paleta compartida de hasta 24 colores opacos por criatura.

La transparencia final es binaria (0 o 255), sin bordes suavizados. Cada vista tiene un pequeño margen de seguridad para conservar todas las puntas y partículas. Las láminas están ampliadas desde la versión de 96 px para que los bloques sean uniformes.

Las vistas de espalda son dibujos específicos de la anatomía dorsal, no espejados del frente. Son poses estáticas de combate. Las muestras sobre fondo oscuro de `vistas_previas/` sirven solo para revisar: ese fondo no aparece en los PNG de los personajes.
