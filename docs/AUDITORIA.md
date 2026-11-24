# Auditoría previa al testeo — v0.48.0 (24 nov 2026)

Cómo se hizo:
- Chequeos automáticos: tipos, 274 tests, validación de datos y compilación. Todo pasa.
- Revisión del código: guardado, compras, entrada táctil y botón Atrás.
- Recorrido de las 21 pantallas en un teléfono horizontal simulado, en español e inglés, con una partida nueva de verdad: prólogo, elección de equipo, premio diario y primer combate de la historia.
- Simulación del ritmo de experiencia y de las probabilidades de ganar en la historia.

No apareció ningún error de JavaScript en ninguna pantalla, y no faltan textos en ningún idioma.

---

## Fallas — prioridad ALTA (corregir antes del testeo)

### A1. Tocar en «Monedas y Cristales» abre la compra sin haber elegido
**Verificado** en un teléfono simulado. En el teléfono, un toque elige la opción y 90 ms después la confirma como si fuera el botón A. Pasa en dos lugares:
- Tocar **«+ Comprar»** en la Tienda abre la pantalla de compras y, enseguida, la **puerta para adultos para comprar 1.200 monedas**, sin que el niño haya elegido nada.
- Tocar **cualquier fila** de la lista de compras abre directamente la puerta de ese producto. No hay forma de leer el detalle antes.

No se cobra nada sin la cuenta del adulto, pero se ve como una venta insistente. Es justo lo que miran las revisiones de Google para apps con niños.
**Arreglo:** en esa pantalla, tocar solo **elige**. Se compra con el botón rojo del precio, que hoy no responde al toque, o con A. Además, el toque sobre «+ Comprar» no debe convertirse en A en la pantalla siguiente.

### A2. Muro de nivel en la historia
La historia se calibró (D273) suponiendo que el equipo llega **al nivel de la región**. Pero la experiencia que da la propia historia no alcanza:

| Región | Rivales | Equipo que solo juega la historia llega con | Gana el 1.er jefe (simulado) |
|---|---|---|---|
| Bosque | Nv 7 | Nv 5 | 82 % |
| Volcán | Nv 14 | Nv 7 | **5 %** (al Nv 11: 18 %; al Nv 14: 85 %) |
| Arrecife | Nv 20 | Nv 10 | **0 %** (al Nv 15: 0 %) |
| Desierto | Nv 26 | Nv 13 | **0 %** |
| Cumbre Helada | Nv 33 | Nv 15 | **0 %** |
| Ruinas | Nv 40 | Nv 17 | **0 %** |

La caída es muy brusca: 3 niveles por debajo ya se pierde casi siempre. Para cerrar cada brecha hacen falta unos **10, 13, 16, 22 y 27 combates de práctica**, alrededor de 90 en total. Otros modos también dan experiencia, pero el juego no le dice al niño que tiene que entrenar. Tras perder solo aparece «DERROTA» y un consejo de tipos.
**Arreglo propuesto (elegir):**
1. En el mapa y en la parada, mostrar «Tu equipo: Nv 10 · recomendado Nv 14», con aviso de color.
2. Tras perder en la historia con el equipo bajo de nivel: «Tu equipo necesita entrenar: prueba las Zonas de práctica», con acceso directo.
3. Acortar el muro: más experiencia por parada de la historia o experiencia también para las criaturas que no pelearon. O recalibrar el `ajuste` para que con −3 niveles se gane cerca del 50 % (hoy se gana 0–18 %).

### A3. Botón Atrás de Android con un panel abierto
Con el panel Guardado, el de apodo o la puerta para adultos abiertos, el botón Atrás del teléfono actúa sobre la pantalla de **detrás**, que cambia o se cierra, y el panel queda encima. En la puerta para adultos, Atrás no hace nada y solo se sale con «Cancelar».
**Arreglo:** Atrás cierra el panel abierto (en la puerta para adultos, equivale a Cancelar).

---

## Fallas — prioridad MEDIA

- **M1. Expediciones sin salida para un jugador nuevo.** Está abierta desde el inicio, pero con 3 criaturas no hay nadie libre para mandar a explorar: el aviso dice que todas están en el equipo. Hay que explicar cómo conseguir más («abre un sobre») o abrirla al tener 4 criaturas.
- **M2. Textos cortados sin aviso.** Las descripciones de minijuegos se recortan a 2 líneas: a «Golpe Justo» le falta «Tienes 8 golpes», en español y en inglés. Otros 6 lugares cortan párrafos por cantidad de líneas: Expediciones, región, Cronomapa, Bestiario, Cronoportal y combate. Conviene un test que lo detecte o acortar esos textos.
- **M3. «B: volver» en español en la versión en inglés** (Bolsa vacía, `BolsaEscena.ts:62`).
- **M4. Memoria en sesiones largas.** Los efectos HD de cada ataque se cargan cuando hacen falta, pero **nunca se liberan**. Cada efecto de pantalla completa ocupa unos 2,5 MB en la memoria gráfica. Tras muchos combates distintos, un teléfono modesto puede ponerse lento o cerrarse. Hay que verificarlo en un teléfono real y liberar las texturas al salir del combate.
- **M5. Duración del combate.** El primer combate (jefe Nv 7 y un recluta) tomó unos 3,5 minutos apretando A sin parar, en emulación. Hay que medirlo en el teléfono. Si se confirma, se puede considerar velocidad ×2 por defecto o acortar las pausas de texto.

## Mejoras de experiencia — prioridad BAJA (pensando en un niño de 7 años)

- **Plurales con «(s)»:** «Racha: 1 día(s) seguido(s)», «Gana 1 combate(s)», «1 Sobre(s) Básico(s)». Mejor escribir la frase correcta según el número.
- **«Premios hoy: 5/5»** en Minijuegos parece «agotado» cuando en realidad significa que quedan 5. Mejor: «Quedan 5 premios hoy».
- **Abreviaturas difíciles:** PS · Atq · Def · AtE · DfE · Vel, «QUE» (quemado), «Entren.». Mejor con íconos o palabras completas.
- **Letra chica:** pistas y pies de pantalla a 5,4–6 px del juego, unos 12 px en el teléfono. Para un lector que recién empieza, conviene un mínimo de 6,5.
- **«Desafío del día #11»** el primer día de un jugador nuevo confunde. Mejor sin número o contando desde que empezó.
- **Premio diario:** las monedas son círculos simples, distintos del ícono de moneda del resto del juego.
- **Compras en PC:** pasar el mouse por la lista redibuja toda la pantalla; funciona, pero parpadea.
- **Mina Pixel:** el contador usa el emoji 🪙, que cada teléfono dibuja distinto (o no dibuja).
- **Peso:** 75 MB. `crono/crono_viaje.png` pesa 3 MB y en webp pesaría mucho menos. En la web el código es un solo archivo de 2,2 MB (en la app no importa).
- **Reloj del teléfono:** cambiar la fecha permite cobrar premios diarios. Es normal en juegos sin conexión; solo se anota.

## Lo que está bien
- Sin errores en consola en las 21 pantallas, en los dos idiomas. Los textos están completos en español e inglés y no hay placeholders distintos entre idiomas.
- Prólogo, elección de equipo, premio diario y primer combate funcionan con una partida nueva.
- Guardado triple (navegador, copia de seguridad y almacén de la app) con recuperación automática.
- Compras: límite diario, pack único, entrega única por recibo, historial y modo de prueba, todo probado. Los sobres muestran sus probabilidades.
- El menú guía al jugador nuevo hacia «Historia · Bosque · parada 1/4».

---

## Plan de testeo sugerido (después de corregir A1–A3 y M1–M3)

1. **Teléfono propio (APK `android-prueba`)**:
   - Partida nueva hasta terminar el Bosque, midiendo cuánto dura cada combate.
   - Botón Atrás en cada panel.
   - Compra simulada tocando con el dedo.
   - Sesión larga de 30 minutos o más de combates seguidos, para ver la memoria.
   - Minimizar en medio de un combate y de una compra.
2. **Niño de 7–9 años sin ayuda** (lo más valioso): mirar dónde se traba, qué no entiende y si pide ayuda para leer. No explicarle nada.
3. **Prueba cerrada en Google Play (12 testers, 14 días)**: compras reales con cuentas de prueba (sección 4.4 bis de `PUBLICACION.md`) y una ficha simple para que anoten problemas.
4. **Pendientes de antes**: aprobación de música y sonidos, alargar las canciones viejas de 4 compases, revisión legal del nombre y del origen del arte.
