# PIXANIMALS — paquete de interfaz

124 recursos PNG individuales preparados para integrar. Se excluyeron los banners y piezas de jefes semanales según tu indicación. No se modificó el código del juego.

## Contenido

| Carpeta | Recursos | Tamaño |
|---|---:|---|
| items | 34 ítems, con sus ids exactos | 32×32 |
| medallas | 24 medallas ganadas y 8 siluetas bloqueadas | 32×32 |
| sobres | 8 tipos, 3 especiales, 2 dorsos de sobre y 1 semanal | 64×88 |
| recursos | Monedas, esencia y descuento semanal | 32×32 |
| album | 6 marcos, sello, candado y brillante | Marcos 64×88; íconos 32×32 |
| tipos | Brasa, Marea, Brote, Rayo, Roca, Cielo y Sombra | 32×32 |
| estados | Quemadura, veneno, parálisis, sueño, lentitud y debilidad | 32×32 |
| categorias | Físico, especial, apoyo y definitivo | 32×32 |
| expediciones | Playa, bosque, volcán y tiempo restante | Lugares 160×96; tiempo 32×32 |
| menu | Los 11 íconos del menú | 32×32 |

Los sobres suman 14 porque se incluyó el Sobre de la semana además de los 13 diseños enumerados. Las ocho medallas bloqueadas están incluidas. No se reemplazó carta_dorso.png: los archivos sobre_dorso_cerrado.png y sobre_dorso_abierto.png son dorsos del envoltorio.

## Características verificadas

- PNG RGBA con alfa binario: únicamente 0 o 255, sin bordes semitransparentes.
- Hasta 15 colores opacos por recurso, más transparencia: máximo 16 valores de color en total.
- Reducción por vecino más cercano, sin suavizado ni tramado.
- Contorno exterior oscuro y luz desde arriba a la izquierda.
- Los marcos de carta tienen el área central completamente transparente.
- Cada tema de medalla usa exactamente la misma silueta en bronce, plata, oro y bloqueada; solo cambian los colores y la visibilidad del emblema.
- Piedras de XP y pociones conservan tamaños progresivos.

## Rarezas de los ítems

Los marcos están integrados en cada item_<id>.png: común gris, poco común verde, rara azul y épica violeta. Su interior mantiene la transparencia. Los marcos de cartas del álbum son archivos separados.

## Integración

manifest.csv y manifest.json contienen id, ruta, categoría, rareza, dimensiones y cantidad de colores de cada recurso. Todos los nombres de ítems siguen item_<id>.png. Las medallas ganadas siguen medalla_<id>_1.png, _2.png y _3.png; las bloqueadas usan medalla_<id>_bloqueada.png.

Mantener vecino más cercano al ampliar y desactivar el filtrado de texturas para preservar los píxeles. Las piezas se pueden cargar directamente como PNG individuales; no necesitan recortarse de las láminas fuente.

catalogo.html permite revisar y descargar cada recurso. vistas_previas contiene cuatro hojas de consulta ampliadas, que no son recursos adicionales del juego. control_calidad.json registra las comprobaciones de la entrega. prompts.json documenta la dirección del arte generado; el procesamiento posterior fijó geometría, paletas y transparencia.
