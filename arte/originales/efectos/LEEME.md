# PIXANIMALS — efectos de ataques, versión 1

17 PNG originales con transparencia. Cada archivo es una imagen estática del efecto en su momento principal; no son tiras de animación. Generados con la herramienta de imágenes integrada.

Los originales están en alta resolución. Antes de integrarlos, convertir con el script del juego, conservando proporciones y centrando en un lienzo de 64×64 px; para llamarada, ola y hojas, usar 96×96 px. Estos son tamaños de destino, no las dimensiones actuales de los PNG. El mundo del juego sigue siendo 240×160 px. La reducción requiere revisar la lectura de partículas y bordes; las fuentes generadas incluyen halos y tonos adicionales, por lo que no constituyen todavía una paleta técnica cerrada de 8–12 colores.

## Archivos y ataques

| Archivo | Ataque |
|---|---|
| zarpazo.png | Zarpazo Ardiente |
| anillo_fuego.png | Pelaje Ígneo |
| grito.png | Grito de Manada |
| llamarada.png | Rugido Solar |
| mirada.png | Mirada Abrasadora |
| dentellada.png | Dentellada Marina |
| burbujas.png | Escudo de Burbujas |
| corriente.png | Corriente |
| ola.png | Tsunami |
| arrullo.png | Arrullo de Olas |
| zarpazo_brote.png | Zarpazo de Raíz: variante visual de zarpazo |
| corteza.png | Armadura de Corteza |
| sol.png | Baño de Sol |
| hojas.png | Furia del Bosque |
| polen.png | Polen Tóxico |
| raices.png | Abrazo de Raíces |
| empujon.png | Empujón genérico |

El código puede conservar animacion=zarpazo para ambas familias y seleccionar zarpazo_brote.png cuando el elemento sea Brote. No hace falta cambiar el identificador compartido.

La dirección general de proyectiles es de abajo a la izquierda hacia arriba a la derecha. Girar o reflejar según el atacante. Para efectos protectores, superponer la criatura en el centro vacío; si se necesita oclusión, separar arcos delanteros y traseros durante la preparación para el motor.

## Dirección visual usada

Efectos aislados para un juego de criaturas, formas de píxeles grandes, contornos escalonados y siluetas legibles. Brasa: rojo, naranja y amarillo; Marea: azul, cian y blanco; Brote: verde y marrón, con violeta para veneno. Los tres finales usan masas más amplias y una silueta más espectacular. Sin personajes, escenario ni interfaz.
