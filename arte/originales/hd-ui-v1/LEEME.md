# PIXANIMALS · Piezas HD

28 PNG principales: 12 íconos del Cronoportal (64×64), 6 piezas de ruleta, 3 piezas de torre y 7 objetivos opcionales del Golpe justo (128×128). Los nombres anteriores se conservan en las carpetas crono/iconos, ruleta y torre. No se reemplazó ningún archivo de las entregas anteriores.

Se recuperó el detalle de las fuentes grandes originales antes de su reducción a las medidas pequeñas. Los íconos, fósiles, ámbar y ruleta mantienen el diseño y el estilo de pixel art; no son una ampliación de las exportaciones pequeñas. Los pisos y la cima conservan su acabado ilustrado y se exportaron desde la fuente grande. La cima incluye espacio transparente superior. Los pisos son opacos para cubrir sin huecos.

Ruleta: aro480×480, aguja64×80, centro96×96, marco del premio96×120 y dos botones264×56. Centro circular transparente de400px de diámetro. El hueco del marco se conserva transparente. Los botones llevan GIRAR; ruleta/sin_texto incluye dos variantes adicionales para escribirlo por código. La aguja apunta hacia abajo.

Torre: pisos1184×176 y cima1312×656. Apilar pisos con paso176px y centrar cima desplazando−64px en x respecto al piso. Las filas limítrofes coinciden tanto dentro de cada tipo como entre piso normal y jefe. No se incluyeron números en la piedra.

Golpe justo: golpe_tierra.png, golpe_piedra.png, golpe_piedra_dura.png, golpe_roca.png y golpe_metal.png. Las grietas golpe_grieta_1.png y golpe_grieta_2.png son capas transparentes del mismo tamaño: dibujar encima del bloque en las mismas coordenadas. Usar una grieta por estado, sin acumularlas. Los cinco bloques están centrados dentro de112×112px. Las grietas tienen distinta extensión para indicar daño leve y fuerte. Se crearon con el generador integrado de imágenes; prompts.json conserva todas las indicaciones.

Pixel art: transparencia binaria y hasta15colores visibles. Usar vecino más cercano si se escala. Torre: interpolación apropiada para ilustración. catalogo.html muestra los PNG y ejemplos de montaje; vistas_previas es solo para revisión. manifest.json lista medidas y rutas, control_calidad.json resume las comprobaciones y fuentes conserva los originales usados.
