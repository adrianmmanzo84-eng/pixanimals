# PIXANIMALS · Cronoportal y Mina

Entrega completa del documento adjunto. Abrir `catalogo.html` para recorrer el arte y reproducir las animaciones sin instalar nada. Los PNG para integrar están separados de las fuentes y las vistas previas.

## Contenido

- Cinco familias nuevas (39–43): Anomalocaris/Marea, Meganeura/Rayo, Stegosaurus/Brote, Pteranodon/Cielo y Mamut/Roca. Cada una tiene cuatro etapas, frente, espalda e ícono.
- Ochenta ataques de las familias 34–43: setenta efectos normales/finales, diez impactos definitivos y diez escenas definitivas. Veinte láminas de ataques además de las noventa piezas individuales.
- Once escenarios: cinco combates de eras a 960×455, cinco mapas a 960×640 y la sala del Cronoportal a 960×640. Incluidos los escenarios opcionales.
- Diecisiete animaciones nuevas, cinco variantes adicionales de resurrección con la cría correspondiente y ocho recursos de Mina reutilizados sin modificar, incluido el huevo quieto. Treinta entradas de animación/huevo en total.
- Trece íconos y doce medallas, con sus versiones bloqueadas.
- 379 PNG preparados para juego: 246 recursos principales y 133 fotogramas individuales. Las fuentes, referencias y vistas previas se entregan aparte y no forman parte de este conteo.

## Carpetas y uso

`criaturas/sprites/`: vistas individuales de 64×64, con nombres de familia, etapa (0–3) y vista. La dimensión mayor de la figura crece aproximadamente de 32 a 40, 50 y 62 px. `criaturas/iconos/`: versiones de 32×32. Cada familia comparte una paleta de hasta quince colores visibles.

`criaturas/laminas/`: presentación de las cuatro etapas con frente, espalda e ícono. `criaturas/compatibles_4x2/`: presentación alternativa con cuatro frentes arriba y cuatro espaldas abajo. Para integrar sin recortes, usar las piezas individuales y `familias.json`.

`ataques/piezas/`: efectos normales de 64×64, finales de 96×96, impactos definitivos de 128×128 y escenas definitivas de 240×160. Son piezas estáticas para animar con desplazamiento, escala, aparición y partículas en el juego. Las escenas definitivas ocupan toda la pantalla y tienen fondo opaco deliberadamente.

`ataques/laminas/`: `NN_ataques.png` mide 384×192, con cuatro columnas y dos filas de celdas de 96×96; los efectos de 64×64 están centrados dentro de su celda. La última celda queda vacía. `NN_definitivos.png` mide 480×160: impacto centrado dentro de la mitad izquierda de 240×160 y escena completa en la mitad derecha. `ataques.json` contiene los rectángulos exactos y la relación con cada ataque. `catalogo_ataques_completo.json` conserva los datos del documento.

`crono/animaciones/`, `fx/` y `mina/animaciones/`: tiras horizontales sin separación, todos los cuadros de una tira del mismo tamaño. `animaciones.json` indica archivo, cantidad de cuadros, tamaño de cada cuadro, duración por cuadro en milisegundos, repetición y rectángulos de recorte. `end_mode` recomienda ocultar, mantener el último cuadro o repetir. El catálogo repite también las secuencias de una sola ejecución para facilitar su revisión. Las cinco variantes `crono_revivir_<familia>` muestran la cría real correspondiente.

`fotogramas/`: los mismos cuadros exportados por separado. `iconos/` y `medallas/`: PNG listos para interfaz. `escenarios/`: fondos ilustrados, con el espacio de combate despejado y mapas de contraste suave.

## Integración y comprobaciones

Las piezas de pixel art usan bordes nítidos y transparencia binaria (0 o 255), sin suavizado. Ampliar con vecino más cercano y desactivar el filtrado de texturas. Los escenarios ilustrados tienen fondo opaco. `manifest.json` e `indice.csv` enumeran los PNG preparados y sus dimensiones; `control_calidad.json` registra las comprobaciones de tamaños, transparencias, paletas, correspondencia entre láminas y piezas, conteos y ausencia de faltantes. Los ocho recursos de Mina se conservaron idénticos a la entrega anterior.

El arte fue creado con el generador integrado de imágenes y preparado mediante recorte, ajuste de paleta y exportación. `fuentes/` conserva las 55 imágenes generadas; `referencias/` contiene las diez criaturas finales utilizadas para los definitivos. `prompts.json` reúne las indicaciones de generación y `pedido-original.md` conserva el documento recibido. Las fuentes originales no tienen necesariamente los tamaños ni las paletas finales: integrar los PNG de las carpetas de juego.

Esta entrega comprende los archivos de arte solicitados; la reproducción de efectos, reglas de combate y conexión con el código del juego se realizan al integrarlos.
