# PIXANIMALS · Ataques del Arquitecto

Seis PNG principales en efectos/ataques, con los nombres listos para integrar:

|Archivo|Medida|Uso|
|---|---|---|
|borron.png|232×232|Mancha gris de borrado, impacto sobre el rival|
|zarpa_del_vacio.png|232×232|Tres cortes violetas con núcleos negros opacos|
|lienzo_gris.png|232×232|Ola gris que viaja de izquierda a derecha|
|colapso_cromatico.png|360×348|Seis colores regionales que colapsan en gris y negro|
|lienzo_en_blanco.png|472×416|Portal del pecho que desata el borrado blanco|
|lienzo_en_blanco_pantalla.png|960×640|Composición del Definitivo, Eclipse y mundo borrándose|

Además, lienzo_en_blanco_destello.png es un PNG960×640 completamente blanco para el último momento del ataque. Es blanco a propósito: permite que la secuencia termine sin restos de figura ni paisaje.

Los cinco impactos tienen fondo transparente; las dos pantallas son opacas. Borrón y Lienzo Gris utilizan únicamente tonos grises. Los negros de Zarpa, Colapso y Lienzo en Blanco son opacos, no huecos transparentes. Colapso incluye verde Bosque, azul Costa, rojo Volcán, dorado Desierto, celeste Cumbre y violeta Ruinas.

Son ilustraciones estáticas del momento principal, no tiras de fotogramas. El juego puede animar traslación, escala, rotación y opacidad. La pérdida de color del rival necesita una transición de saturación en su sprite; el PNG por sí solo no modifica colores de otras texturas. Para el Definitivo: cargar durante el turno correspondiente, abrir el impacto sobre el pecho, pasar a la composición de pantalla y cerrar con el blanco puro. La carga de un turno, la espera de4turnos de Colapso, el daño y la protección siguen siendo reglas del juego, independientes de estos PNG.

Todas las medidas ya son a4×. Mantener su tamaño lógico de batalla en el mundo240×160: no multiplicar nuevamente por4 el tamaño en pantalla. El rival debe recibir Borrón y Zarpa centrados en el cuerpo; Lienzo Gris puede desplazarse de izquierda a derecha. manifest.json incluye el centro del núcleo negro de Colapso y Lienzo en Blanco como anclaje sugerido para posicionarlos correctamente, porque el destello puede ser asimétrico.

Abrir catalogo.html para revisar cada pieza sobre fondo claro u oscuro. vistas_previas/impactos.png compara la legibilidad en ambos fondos. fuentes contiene las seis imágenes originales de generación y prompts.json las indicaciones usadas con el generador integrado de imágenes. Se recortaron y exportaron las piezas preservando transparencia, detalleHD y tamaños exactos; los dos ataques grises se normalizaron a gris neutro. control_calidad.json registra medidas, transparencias, tres núcleos de Zarpa y presencia de los seis colores regionales.
