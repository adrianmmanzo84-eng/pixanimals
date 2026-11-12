# Guía de arte

## Lo más simple: una hoja por familia

Deja en `arte/originales/` una imagen PNG **con fondo transparente** por familia (`brasa.png`, `marea.png`, `brote.png`):

- 4 columnas: etapas 1, 2, 3 y 4, de izquierda a derecha.
- 2 filas: arriba de frente (mirando a la izquierda), abajo de espaldas (mirando a la derecha).
- Deja aire entre criaturas: no deben tocarse.

Después ejecuta:

```bash
python3 scripts/importar_arte.py && npm run validar
```

El script recorta cada criatura, la reduce al lienzo del juego, limita la paleta y crea los iconos. Necesita Python con Pillow y numpy.

## Qué genera (o qué entregar a mano)

| Archivo en `public/sprites/` | Tamaño | Contenido |
| --- | --- | --- |
| `familia_etapa_frente.png` | 64×64 px | De frente, mirando a la izquierda |
| `familia_etapa_espalda.png` | 64×64 px | De espaldas, mirando a la derecha |
| `familia_etapa_icono.png` | 64×32 px | Dos cuadros de 32×32, uno al lado del otro |

Reglas si dibujas directo a tamaño final: fondo transparente, cada píxel opaco o transparente, hasta 15 colores, la criatura apoyada en la base del lienzo y centrada. Tamaño máximo por etapa: 40, 50, 58 y 64 px.

## Fondos de combate

Deja en `arte/originales/` imágenes `fondo_<id>.png` de proporción 2:1 (por ejemplo 1774×887), con las dos plataformas dibujadas donde están hoy: la tuya abajo a la izquierda y la rival más arriba a la derecha. Los ids que usa el juego son `pradera`, `costa`, `volcan` y `bosque`. El mismo script las convierte a `public/fondos/<id>.jpg` (960×448).

Un fondo para un tipo nuevo necesita además una línea en `FONDO_POR_TIPO` (`src/ui/fondos.ts`).

## Portada y dorso de carta

- `portada.png`: ilustración apaisada (unos 2:1) para el menú principal. Se ajusta al ancho del juego; deja las criaturas lejos del centro, que lo tapa el menú.
- `carta_dorso.png`: dorso de carta vertical (2:3) con fondo transparente. Se reduce a 62×92.

Ambos se convierten con `python3 scripts/importar_arte.py`.

## Efectos de ataque

Un PNG por efecto en `arte/originales/efectos/`, con fondo transparente, del **momento principal** del efecto (una imagen fija, no una tira de animación). El nombre del archivo es el valor de `animacion` de la habilidad (`llamarada.png`, `ola.png`…). Dos casos especiales: `zarpazo_brote.png` es la versión del zarpazo para el elemento Brote, y `empujon.png` es el golpe básico sin habilidad.

Dibújalos en dirección **de abajo a la izquierda hacia arriba a la derecha** (de tu criatura hacia el rival); el juego los refleja o gira cuando ataca el rival. Excepción: la ola rompe hacia la izquierda.

Después ejecuta `python3 scripts/importar_efectos.py`. Recorta, reduce a 64 px de lado mayor (96 para los finales, 112 para el rayo de Mirada, 48–56 para grito, empujón y polen), deja 16 colores y genera `public/efectos/<nombre>.png`. La animación (aparecer, viajar, cerrarse, crecer, temblar) está en `src/ui/efectos.ts`. Un efecto sin imagen usa el dibujado por código. Las partículas pequeñas (chispas, gotas, zetas) siguen dibujadas por código.

## Nota de diseño

Evita rasgos que sean la «firma» de personajes de otras franquicias. La llama en la punta de la cola de la familia Brasa es el punto a vigilar antes de publicar.
