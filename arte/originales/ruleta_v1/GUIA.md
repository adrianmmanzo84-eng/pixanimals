# PIXANIMALS · Ruleta diaria

Ocho piezas finales, en `ui/ruleta/`, con fondo transparente, contornos nítidos y luz desde arriba a la izquierda. Cada PNG tiene un máximo de 16 colores contando la transparencia, sin suavizado ni tramado.

| Archivo | Tamaño | Uso |
|---|---|---|
| `menu_ruleta.png` | 32×32 | Ícono para la casilla 11 del menú |
| `ruleta_aro.png` | 120×120 | Aro dorado con remaches violetas y abertura central transparente de 100 px |
| `ruleta_aguja.png` | 16×20 | Puntero fijo, con punta hacia abajo |
| `ruleta_centro.png` | 24×24 | Tapa del eje con huella de animal |
| `ruleta_boton_listo.png` | 66×14 | Botón dorado «GIRAR» |
| `ruleta_boton_espera.png` | 66×14 | Mismo botón y silueta, en gris |
| `ruleta_resalte.png` | 40×56 | Esquinas y destellos para marcar la casilla ganadora |
| `ruleta_casilla_gorda.png` | 24×30 | Marco dorado/violeta con corona para el premio de 300 monedas + Sobre Raro |

## Decisiones confirmadas

Las ocho casillas se siguen pintando por código, en ocho colores. Se conserva el fondo actual del menú con su velo oscuro. Se incluyen el resalte y el marco del premio gordo.

## Integración

Copiar `ui/ruleta/` a los recursos del juego. Dibujar primero las casillas de color, luego el aro y la tapa central; la aguja queda fija arriba. El centro geométrico del aro es `(59.5, 59.5)`; el de la tapa es `(11.5, 11.5)`. La aguja apunta hacia abajo y su punta está en la parte inferior del lienzo.

Los botones principales ya llevan la palabra «GIRAR» en letras de píxel. Si el juego escribe el texto por código, usar las versiones de `variantes_sin_texto/`, que tienen los mismos nombres y dimensiones. Elegir una sola versión para evitar texto duplicado. Ambos estados comparten exactamente la misma máscara de transparencia.

El resalte tiene el interior vacío; se puede superponer a la casilla ganadora y animar su opacidad desde el código. El marco del premio gordo también deja libre su ventana central para que el juego dibuje los íconos y cantidades del premio.

Usar escalado por vecino más cercano o desactivar el suavizado de texturas. El arte define los estados visuales; la disponibilidad del giro diario y las probabilidades siguen controladas por el juego.

## Archivos de revisión

- `catalogo.html`: galería de las piezas y montaje de referencia.
- `vistas_previas/piezas.png`: todas las piezas ampliadas para inspección.
- `vistas_previas/montaje_240x160.png`: montaje a resolución del mundo del juego; las casillas se dibujaron por código y el fondo oscuro es solo de revisión.
- `manifest.json`, `indice.csv` y `control_calidad.json`: nombres, medidas y controles de exportación.
- `fuentes/`: originales generados, conservados para futuras ediciones.
- `prompts.json`: instrucciones usadas con el generador de imágenes integrado. Los recortes, las transparencias, las paletas, la rotulación de los botones y las exportaciones se prepararon mediante el proceso autorizado.
