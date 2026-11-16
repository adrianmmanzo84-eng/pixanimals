# PIXANIMALS · Torre y rutas

Los nueve PNG de la carpeta principal tienen los nombres y medidas solicitados. Los fondos son ilustrados; las tres estaciones son pixel art de 64×64, hasta quince colores visibles y transparencia sin suavizado. La cima también tiene fondo transparente. Los pisos son rectángulos de piedra opacos para evitar huecos al apilarlos.

En los mapas, superponer las estaciones centradas en (104,416), (304,280), (528,392) y (784,208), en ese orden. Un PNG de 64×64 se dibuja en (x−32,y−32). El mapa semanal conserva despejada la franja inferior y150px desde y490 para el panel. Los mapas no llevan estaciones incrustadas, ni texto.

Los pisos miden 296×44 y tienen la misma fila de unión arriba y abajo, compartida entre normal y jefe. Repetirlos con un paso vertical de44px, sin espacios. La cima mide328×164; centrarla con un desplazamiento horizontal de−16px respecto al piso. La parte superior central es transparente para colocar al jefe. Los números se agregan por código en el centro libre de cada piso.

Abrir catalogo.html para ver todo junto. vistas_previas contiene ejemplos de montaje con las coordenadas reales, diez pisos consecutivos y una representación del panel tapando la zona correspondiente. Esos ejemplos no son piezas de juego.

manifest.json registra tamaños, posiciones y comprobación del empalme. fuentes conserva las imágenes originales. prompts.json contiene las indicaciones utilizadas con el generador integrado de imágenes. Los archivos preparados se recortaron y exportaron a sus medidas finales; conservar el filtrado de vecino más cercano para los tres nodos.
