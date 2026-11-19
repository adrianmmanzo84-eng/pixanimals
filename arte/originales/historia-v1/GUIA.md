# PIXANIMALS · Origen del Eclipse

Entrega con25PNG preparados, además de las15fuentes seleccionadas y las vistas previas.

- fondos/: Desierto, Cumbre helada, Ruinas y Origen del Eclipse, cada uno960×455, con dos círculos ilustrados. Jugador abajo a la izquierda y rival más arriba a la derecha. posiciones_combate.json contiene centros orientativos para facilitar el montaje.
- arquitecto/: frente y espalda individuales384×384, más una lámina conjunta768×384. Comparten escala y apoyo inferior. El aura utiliza partículas sueltas; el fondo es transparente. No son dos criaturas diferentes.
- mapa/mapa_mundo.png:960×640, con Bosque verde, Costa azul, Volcán rojo, Desierto dorado, Cumbre helada celeste, Ruinas violeta y Origen del Eclipse central. regiones.json aporta colores y puntos sugeridos para marcadores. Sin nombres incrustados para permitir localización y señalética por código.
- medallas/: seis Píxeles Maestro de128×128, uno por región y color, con emblema común del píxel y detalle regional. Fondo transparente.
- objetos/: Prisma Restaurador y Cuarzo de Luz,128×128 transparentes. El prisma fue corregido después de la observación del usuario: eje vertical único para cristal, encastre y mango, brazos equilibrados y perspectiva frontal coherente. Solo la versión corregida está en esta entrega.
- final/origen_arquitecto.png: composición960×455 para la escena final, con El Arquitecto integrado al escenario y sin círculos de combate. Conserva espacio más despejado a la izquierda para el relato del juego.
- compatibles_32/: versiones de32×32 de los seis emblemas y los dos objetos, con transparencia binaria y hasta15colores visibles. Las versiones HD están en sus carpetas principales.

Abrir catalogo.html para revisar y descargar cada pieza. La leyenda del mapa aparece como una superposición opcional en la galería y no modifica el PNG. manifest.json registra medidas y archivos, control_calidad.json resume las verificaciones. fuentes/ conserva las imágenes originales seleccionadas y prompts.json las indicaciones usadas con el generador integrado de imágenes. Los recortes y exportaciones se hicieron con un script, preservando transparencia y tamaño final. Estas piezas no modifican el código del proyecto.
