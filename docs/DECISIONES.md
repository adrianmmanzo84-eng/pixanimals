# Registro de decisiones

Cada entrada: qué se decidió, por qué y qué alternativa se descartó. Las más nuevas, abajo.

## Fase 0

| # | Decisión | Motivo / alternativa descartada |
| --- | --- | --- |
| D1 | TypeScript + Vite + Phaser 4 (versión fijada 4.2.1) | Phaser 3 obligaba a migrar después; Canvas puro obligaba a rehacer escenas, entrada y tweens |
| D2 | La fórmula de daño incluye un factor de nivel | Sin él, los combates se alargan al subir de nivel |
| D4 | Los sobres darán solo etapas 1; la rareza será el Potencial del individuo | La rareza por especie no funciona con 3 especies |
| D5 | Un solo estado a la vez, con duración fija | Estados permanentes frustran en sesiones cortas |
| D6 | Tope de nivel 50; evoluciones en 16 y 36 | Pedido del brief |
| D7 | Motor de combate sin dependencias gráficas y con azar por semilla | Permite pruebas y simulación masiva |
| D8 | Renombres para alejarse de la localización española de Pokémon: Bestiario; menú Atacar / Bolsa / Equipo / Retirarse; «Usos» en lugar de PP; «¡Ventaja de tipo!»; Grito de Manada, Dentellada Marina, Baño de Sol | Riesgo legal y de suspensión por redes de anuncios |

## Respuestas del autor (12-nov-2026)

| # | Decisión | Motivo |
| --- | --- | --- |
| D9 | Audiencia: preadolescentes, adolescentes y adultos. El juego se trata como apto para menores | Al incluir menores de 13, los anuncios serán no personalizados y no se recogen datos personales |
| D10 | Móvil en vertical: pantalla arriba, cruceta y botones A/B abajo | Se juega con una mano; el mando es HTML fuera del lienzo, así nunca tapa el juego |
| D11 | Código en el GitHub del autor | Pendiente: vincular la cuenta o indicar usuario/repositorio |

## Fase 1

| # | Decisión | Motivo / alternativa descartada |
| --- | --- | --- |
| D12 | Ventaja de tipo ×1,25 y desventaja ×0,85 (el GDD proponía ×1,5 y ×0,67) | La simulación mostró que con ×1,5/×0,67 el que tiene ventaja gana casi siempre; ver BALANCE.md |
| D13 | Factor de daño 0,042 + 0,0088 × nivel (el GDD proponía 0,2 + 0,012 × nivel) | Con el valor inicial los combates duraban 2 o 3 turnos. El nuevo mantiene la misma duración en cualquier nivel |
| D14 | Cada nivel de stat vale ±50 %, con tope de ±2 (antes ±25 %, tope ±3) | Con ±25 % potenciarse nunca compensaba perder un turno: atacar siempre era lo mejor |
| D15 | Regla nueva: el más veloz tiene +8 % de probabilidad de crítico (base 5 %) | Sin ella la Velocidad solo decidía quién pegaba primero, y Corriente no servía |
| D16 | Regla nueva: un crítico ignora las mejoras de defensa del rival | Evita que apilar defensa vuelva intocable a una criatura |
| D17 | Regla nueva: Cansancio. Desde el turno 20, ambos pierden 1/8 de PS por turno | Garantiza que ningún combate se eternice (Brote contra Brote llegaba a 100 turnos) |
| D18 | Stats base de etapa 1 reajustados; Brote pierde curación (Baño de Sol 25 % × 3 usos, Raíces 1/40, Furia del Bosque 80) | Con los valores del GDD Brotín ganaba a todos, incluso en desventaja de tipo |
| D19 | Lumbrito pasa a tener más Ataque Especial que Ataque | Así su movimiento final (especial) sigue valiendo la pena después de usar Grito de Manada |
| D20 | Las criaturas de tipo Brasa no pueden sufrir quemadura | Detalle de sabor simple y fácil de recordar |
| D21 | Disposición propia de la pantalla de combate: cada criatura tiene su panel justo encima | Evita copiar la disposición clásica del género y se lee mejor en pantallas chicas |
| D22 | Se muestran los PS exactos del rival | Más información = decisiones más estratégicas; se puede ocultar en dificultades altas más adelante |
| D23 | El placeholder de Lumbrito NO tiene llama en la cola; lleva la brasa en la frente y un mechón oscuro en la cola | Un animal anaranjado con llama en la punta de la cola recuerda demasiado a un personaje conocido de otra franquicia. Recomendación para el diseño final: llama en la melena o la frente, no en la cola |
| D24 | Fuente Tiny5 (licencia OFL), dibujada con caché de glifos umbralizados | Texto nítido sin suavizado y rápido en móviles de gama baja |
| D25 | Los nombres de criaturas y habilidades viven en los JSON de datos; los textos de interfaz, en `i18n/es.json` | Para traducir contenido se añadirá un mapa de nombres por idioma en la fase de localización |
| D26 | «Empujón»: ataque neutro de potencia 30 cuando no queda ninguna habilidad usable | Evita quedarse sin acciones |
| D27 | El texto de combate avanza solo tras 0,65 s; A o un toque lo aceleran | Sesiones cortas y juego con una mano |

## Ajuste visual tras la Fase 1 (pedido del autor, 12-nov-2026)

| # | Decisión | Motivo / alternativa descartada |
| --- | --- | --- |
| D28 | Estilo híbrido: fondos e interfaz suavizados con aire de dibujo animado; criaturas y efectos de ataque en pixel art | Pedido del autor. Reemplaza el objetivo inicial de fidelidad estricta a la portátil de 2003 |
| D29 | El juego se dibuja a 960×640 (mundo de 240×160 ampliado 4× con la cámara) | Permite letras y fondos suaves sin rehacer la disposición; los sprites se amplían sin suavizado |
| D30 | Fuente Fredoka (OFL) en lugar de Tiny5 | Letras redondeadas y suavizadas |
| D31 | Cada habilidad elige su efecto con el campo `animacion` de `habilidades.json`; si falta, se usa uno según tipo y categoría | Efectos nuevos sin tocar el combate. Hay 19 efectos, incluido `rayo` para el futuro tipo Chispa |
| D32 | Fondos pintados por código (pradera, costa, volcán, bosque); el escenario depende del tipo del rival | Son placeholders: se podrán reemplazar por ilustraciones propias |
| D33 | Nombre de trabajo: PIXANIMALS. Se descarta PIXERS | PIXERS es una marca registrada vigente de otra empresa, que incluye software. Antes de publicar conviene hacer una búsqueda formal de marcas para PIXANIMALS |
| D34 | D24 queda sin efecto (ya no hay caché de glifos umbralizados) | Consecuencia de D30 |

## Fase 2

| # | Decisión | Motivo / alternativa descartada |
| --- | --- | --- |
| D35 | Un solo ejemplar por especie. Una carta repetida mejora la rareza del tuyo si es mejor (conserva nivel y experiencia); si no, se convierte en Esencia | Evita una pantalla de «elige cuál conservar» en cada sobre. Descartado: varios ejemplares de la misma especie |
| D36 | Sobre de bienvenida con una criatura de cada familia | El jugador empieza con equipo de 3 y con los tres tipos |
| D37 | El Sobre Elemental son tres sobres (Brasa, Marea, Brote) | Más simple que un menú para elegir tipo |
| D38 | El pity se aplica a la primera carta del sobre | Regla fácil de explicar y de probar |
| D39 | Cambiar de criatura gasta el turno y ocurre antes de los ataques; al salir se pierden las mejoras | Hace del cambio una decisión con costo, no un botón gratis |
| D40 | El rival tiene tantas criaturas como tú, nivel promedio ±1 y nunca una etapa por encima de tu mejor criatura | Combates parejos mientras no exista la evolución (Fase 3) |
| D41 | Experiencia, niveles y monedas por combate entran en la Fase 2 (el GDD los dejaba implícitos) | Sin ellos no hay con qué comprar sobres ni progreso que guardar |
| D42 | Retirarse no da recompensa; perder da 5 monedas y la mitad de la experiencia | Perder no debe sentirse como tiempo tirado |
| D43 | Guardado automático en el navegador tras cada sobre, combate o cambio de equipo; código `PIX1-…` para exportar e importar | Preparado para cuentas en línea: basta otra implementación de `Almacen` |
| D44 | Variante brillante provisional: se gira el tono del sprite por código | Hasta tener paletas dibujadas a mano (Fase 7) |
| D45 | Se quita la pantalla de prueba de la Fase 1 (elegir criatura, nivel y «Prueba de estados») | La reemplaza el juego real. Las habilidades de prueba siguen en los datos y en los tests |
| D46 | Las etapas 2 y 3 tienen los mismos stats que la etapa 1, escalados a 400 y 520 | Mantiene el balance ya simulado; se revisará al implementar la evolución |

## Arte del autor (12-nov-2026)

| # | Decisión | Motivo / alternativa descartada |
| --- | --- | --- |
| D47 | Cada familia pasa a tener 4 etapas (el autor entregó 4 diseños por familia) | Stats base totales 300 / 380 / 450 / 520; evoluciones en los niveles 16, 28 y 40. D6 y D46 quedan reemplazadas |
| D48 | Nombres provisionales de la nueva etapa 3: Ignileón, Almirante y Guardabosque | Los finales conservan su nombre: Solarión, Leviatán y Titán Ancestral |
| D49 | Las hojas de arte se convierten con `scripts/importar_arte.py`: recorta cada criatura, la reduce a 64×64 con 15 colores y genera el icono | El arte original mide unos 250 a 560 px por criatura y no está en una cuadrícula de píxeles exacta |
| D50 | Tamaño dentro del lienzo por etapa: 40, 50, 58 y 64 px | Crecer se nota, y la etapa 1 sigue siendo legible |
| D51 | Fondos ilustrados del autor en `public/fondos/` (960×448, JPG). Las criaturas se colocan sobre las plataformas dibujadas | Los fondos pintados por código quedan solo como respaldo y para el menú |
| D52 | `npm run placeholders` ya no pisa sprites existentes | Protege el arte definitivo |
| D53 | D23 queda a criterio del autor: su Lumbrito lleva llama en la cola | Se avisó del parecido con un personaje de otra franquicia; el diseño es claramente un león con melena y gema |

## Efectos ilustrados (12-nov-2026)

| # | Decisión | Motivo / alternativa descartada |
| --- | --- | --- |
| D54 | Los 17 efectos del autor son imágenes fijas animadas por código (crecer, viajar, revelarse, cerrarse, temblar) | No hacen falta tiras de fotogramas; cada efecto se anima según su forma (la mandíbula se parte y se cierra, las raíces y el rayo de sol se revelan, la ola cruza el campo) |
| D55 | Tamaños: 64 px de lado mayor; 96 los tres finales; 112 el rayo de Mirada Abrasadora; 48–56 grito, empujón y polen | El rayo tiene que cruzar el campo sin ampliarse; los efectos chicos no deben tapar a la criatura de etapa 1 (40 px) |
| D56 | El rayo de Mirada se gira hacia el rival; el resto se refleja. Arrullo no se refleja | Las «Z» del sueño tienen que seguir leyéndose |
| D57 | El anillo de fuego y el escudo usan media imagen tenue detrás | Da la sensación de rodear a la criatura sin separar capas |
| D58 | Las partículas pequeñas (chispas, gotas, zetas, esporas) y los efectos de estado y curación siguen dibujados por código | Acompañan a las imágenes; si falta un PNG, el efecto por código lo reemplaza |
| D59 | Portada del autor en el menú principal, ajustada al ancho (960×455) y con el panel del equipo debajo | Recortarla a 3:2 cortaba las criaturas dibujadas en los bordes |
| D60 | Dorso de carta del autor (62×92, sin limitar colores) en la apertura de sobres; las caras pasan de 68 a 62 de ancho para coincidir | Con 24 colores se perdían la llama, la hoja y el cristal |

## Fase 3: ítems y evolución (12-nov-2026)

| # | Decisión | Motivo / alternativa descartada |
| --- | --- | --- |
| D61 | La partida pasa a la versión 2 (Bolsa, incienso, vitaminas, Entrenamiento) y las de la versión 1 se migran solas | Nadie pierde su progreso |
| D62 | Evolucionar pide nivel mínimo y la barra de Entrenamiento llena (100). Hoy se llena con victorias (+10 a quien participó) o infundiendo Esencia (1 por punto); en la Fase 4 la llenarán los minijuegos | El brief pide «nivel + barra de Esencia de Entrenamiento». La Esencia de las repetidas por fin tiene uso |
| D63 | Sigue la regla de un ejemplar por especie: si ya tienes la especie destino, la evolución se bloquea con aviso | Mantener el modelo de colección simple. Alternativa futura: varios ejemplares con identificador propio |
| D64 | Las ramas se definen en `evoluciona` con un `item` (piedra). Una piedra solo se vende si alguna criatura la usa | El sistema quedó listo antes que el arte; desde D74 la Piedra Eclipse se vende |
| D65 | Vitaminas: +3 % por dosis, hasta 5 por stat y 12 en total; se pagan con Esencia | Bonus permanente pequeño: ayuda sin romper el balance |
| D66 | Incienso: 30 min con Rara y Épica ×2 (lo que suben se descuenta de Común); se acumula | El jugador ve las probabilidades ya ajustadas en la pantalla de sobres |
| D67 | Ítems de combate: usar uno gasta el turno, va antes que los ataques y hay un máximo de 2 por combate. El rival no usa ítems | Evita combates eternos a fuerza de pociones |
| D68 | Ofertas del día: 3 ítems con −30 %, iguales todo el día (se calculan desde la fecha local) | Rotación diaria del brief sin servidor |
| D69 | Carta premio tras cada victoria: 3 cartas boca abajo, se elige una y luego se ven todas. Monedas, Esencia, ítems o (3 %) una criatura de etapa 1 | Pedido del autor; mostrar las otras da el «casi» que motiva a volver |
| D70 | Los amuletos equipables pasan a la Fase 5 | Mantener el alcance de la Fase 3 |
| D71 | El menú Equipo pasa a «Mis criaturas»: toda la colección, con equipo y reserva, Entrenamiento y evolución | Con la evolución puede haber más criaturas que lugares en el equipo |
| D72 | La familia Brote pierde 5, 11 y 16 % de PS, Defensa y Def. Especial en las etapas 2, 3 y 4 (totales 369 / 422 / 473) | Con las proporciones de la etapa 1, Brote dominaba al crecer (Brasa le ganaba solo el 25 % en la etapa 4 pese a la ventaja de tipo). Moverlos al Ataque Especial daba un oso con AtE 116, poco creíble |
| D73 | El importador de arte acepta cualquier familia (de 1 a 4 etapas) y ramas (`familia_3b.png`); el Bestiario se ordena por familias y se desplaza | Para sumar las criaturas nuevas del autor sin tocar código |
| D74 | Formas Eclipse: una por familia, de etapa 4, alternativa a la forma final. Ignileón, Almirante y Guardabosque evolucionan a nivel 40 con la Piedra Eclipse (400 monedas) en Solarión Eclipse, Leviatán Eclipse o Titán Eclipse | El autor las diseñó como «forma alternativa de la etapa mítica». Los nombres son provisionales hasta que el autor elija otros |
| D75 | Cada Eclipse suma lo mismo que su etapa 4, con más ataque y velocidad y menos defensa; conserva tipo, pasiva y habilidades | Un cambio de estilo, no una mejora gratis: le gana entre el 45 y el 68 % a su forma normal (ver `docs/BALANCE.md`) |
| D76 | Las ramas admiten la hoja lado a lado (frente a la izquierda, espalda a la derecha) y 24 colores en lugar de 15 | Así vinieron las hojas Eclipse; el aura gasta paleta y con 15 colores se perdían la cara y los detalles |
| D77 | En el Bestiario, cada criatura ocupa la columna de su etapa y las ramas van debajo de la forma a la que reemplazan | Se ve de un vistazo qué forma es alternativa a cuál |
| D78 | Las 10 Eclipse de familias que todavía no están en el juego se guardan en `arte/originales/eclipse/` hasta que entren sus familias | No hay criaturas base para conectarlas |
| D79 | Las 10 familias nuevas del autor entran completas: 4 etapas + forma Eclipse cada una (65 criaturas en total). Nombres provisionales inventados; el autor los puede cambiar | El autor eligió «inventa los nombres» |
| D80 | 4 tipos nuevos: Rayo, Roca, Cielo y Sombra. Cada tipo vence a 2 y pierde contra 2, y se mantiene Brasa > Brote > Marea > Brasa (tabla en `docs/BALANCE.md`) | El autor eligió sumar 4 tipos. La tabla salió de probar todas las combinaciones posibles y quedarse con la que más sentido tiene (Roca vence al Rayo, el Cielo vence a la Brasa porque el viento la apaga…) |
| D81 | Familias por tipo: Cielo (mantarraya, gecko), Sombra (polilla, liebre, pulpo), Rayo (ajolote), Roca (caracol, pangolín), Marea (+ cangrejo), Brote (+ colibrí). Brasa sigue con una sola familia | Según el aspecto de cada diseño |
| D82 | Las pasivas nuevas reutilizan las 3 mecánicas con nombre y mensaje propios (`pasivasAlias`): Carga Estática, Viento a Favor y Tinta (como Oleaje); Luna Nueva y Furia Espinosa (como Último Rescoldo); Piedra Viva y Refugio (como Raíces) | Sin mecánicas nuevas que balancear; cada familia igual tiene su sabor |
| D83 | El sobre de bienvenida da solo Lumbrito, Aletín y Brotín (`sobres.bienvenida`); las otras familias salen en sobres y como rivales | Con 13 familias, dar una de cada una regalaba media colección |
| D84 | Las criaturas crecen en pantalla: lienzo de 96×96 y tamaños 36 / 48 / 62 / 80 px por etapa, 86 px las Eclipse. En combate se apoyan en su plataforma y crecen hacia arriba | Pedido del autor: las evoluciones más grandes, la última y la Eclipse bastante más. Todas comparten el mismo tamaño de píxel |
| D85 | El combate pasa a paneles en diagonal: el del rival arriba a la izquierda y el tuyo abajo a la derecha. Los puntos del equipo y el estado (quemado, dormido…) van al costado de cada panel | Con los dos paneles arriba no entraban criaturas de 80 px |
| D86 | Las miniaturas (cartas, Bestiario, Mis criaturas) centran la parte visible del sprite; la animación de evolución muestra el tamaño real de combate | Con el lienzo más grande, las criaturas chicas quedaban bajas; y al evolucionar se ve cuánto crece |
| D87 | Corriente (Marea), Viento de Cola (Cielo) y Luna Creciente (Sombra) suben Ataque o Ataque Especial en lugar de Velocidad | En este motor la velocidad solo decide quién pega primero; esas familias quedaban muy por debajo (Marea ganaba el 27 % de sus cruces) |
| D88 | Los stats de las familias nuevas (y los de Brasa y Marea) salieron de una búsqueda automática por simulación (`npm run familias`): cada familia cerca del 50 % contra rivales sin ventaja de tipo y la ventaja de tipo por encima del 60 %, sin perder su estilo (el caracol y el cangrejo, lentos; el colibrí y la liebre, veloces; el ataque principal, el más alto) | Con stats «a ojo», las resistentes ganaban el 94 % y las frágiles el 8 % |
| D89 | Fase 4: tres minijuegos propios — Lluvia de Bayas (reflejos, 30 s), Eco (memoria, secuencia que crece hasta 12) y Golpe Justo (precisión, 8 rondas) | El GDD pide «3 minijuegos» sin definirlos; cada uno prueba una habilidad distinta y se juega con flechas y A |
| D90 | Cada partida da de 8 a 20 de Entrenamiento a la criatura elegida y de 5 a 15 monedas, según el puntaje (0 a 1). Solo las primeras 5 partidas de cada minijuego por día dan premio | Valores del GDD. Una criatura en su etapa final solo gana monedas |
| D91 | Premio diario: 50 monedas; el día 7 de la racha, además, un Sobre Raro que queda guardado (`sobresRegalo`) para abrir gratis. Saltarse un día vuelve la racha a 1 | Valores del GDD. El sobre regalado se usa antes que el gratis por tiempo |
| D92 | Misiones diarias: 3 al día sacadas de una lista de 9 (`economia.json`), de eventos distintos y siempre las mismas para un mismo día. Se cobran a mano en la pantalla Misiones | Dan un objetivo a cada sesión sin obligar a nada |
| D93 | El menú pasa a dos columnas (9 opciones) y muestra el premio diario al entrar | Con Minijuegos y Misiones ya no entraba en una columna |
| D94 | La partida guardada pasa a la versión 3 (premio diario, minijuegos, misiones y sobres regalados), con migración automática desde la 2 | Ninguna partida se pierde |
| D95 | Lluvia de Bayas: A (o ↑) salta; aparecen piedras que ruedan por el suelo y hay que saltarlas. La criatura mira hacia donde camina y conserva la dirección al soltar | Pedido del autor; el salto necesitaba un motivo para usarse |
| D96 | «Combatir» abre un submenú: Combate rápido (el de siempre), Torre de Desafíos y Entrenador del día | Modos del GDD para la Fase 5 |
| D97 | Torre: nivel del rival 3 + 2×piso (+2 en jefes, tope 50); IA novata hasta el piso 3, táctica hasta el 10 y experta después (los jefes, al menos táctica). Cada piso tiene siempre el mismo equipo. Perder no quita progreso. Premio solo la primera vez: 30 + 5×piso monedas; jefe cada 5 pisos (Sobre Básico) y cada 10 un Sobre Raro. Los jefes altos usan una forma Eclipse | Valores de premio del GDD; la curva de nivel acompaña la de un jugador que progresa |
| D98 | Entrenador del día: nombre, tipo y equipo salen de la fecha (igual para todos ese día); nivel = tu criatura más fuerte del equipo + 2, IA experta. La primera victoria del día da 150 monedas y un Sobre Elemental del tipo del entrenador (o uno de los tres al azar si su tipo no tiene sobre) | Valores del GDD |
| D99 | Torre y Entrenador pagan su premio en lugar de las monedas por dificultad; la experiencia y el Entrenamiento se reparten igual | Que el premio del modo sea el protagonista |
| D100 | En combates de equipo el daño se multiplica por 1,25 (`balance.dano.equipos`); el 1 contra 1 no cambia | 3 contra 3 pasa de 20–29 a 16–24 turnos (mediana); las proporciones entre familias casi no cambian |
| D101 | Botón «Velocidad ×1/×2» (ajuste del dispositivo, no de la partida): acelera todo el combate escalando el reloj de la escena | Combates más ágiles sin tocar las reglas |
| D102 | Música chiptune original escrita como datos (`src/audio/canciones.ts`): 4 canales (2 cuadradas, triangular, ruido), temas de menú, combate, jefe/Torre y minijuegos, y jingles de victoria y derrota. Volumen de música y de efectos por separado (4 niveles) | GDD: «el audio completo llega en la Fase 5» |
| D103 | La barra de ajustes (velocidad, música, efectos, sonido) va arriba a la derecha | Abajo tapaba la ayuda de teclado |
| D104 | Amuletos: 6 (Vigor, Fuerza, Coraza, Mente, Calma, Pluma), +10 % a un stat cada uno, 300 monedas en la Tienda. Uno por criatura; se ponen y cambian desde Mis criaturas (acción «Amuleto», que rota entre los que tienes y al final lo quita). Sobreviven a la evolución | Pospuestos desde la Fase 3 (D70) |
| D105 | La partida pasa a la versión 4 (Torre, Entrenador del día, amuletos), con migración automática | Ninguna partida se pierde |
| D106 | Ataques por evolución: cada etapa cambia un ataque por una versión más fuerte (etapa 2 el ofensivo, 3 el apoyo, 4 el final) y la Eclipse tiene su propio final. Son 52 habilidades nuevas; las listas de habilidades pasan a ser por especie | Pedido del autor: que evolucionar también cambie los ataques. Listado y descripciones visuales en el doc «PIXANIMALS – Ataques y efectos» |
| D107 | Ataque Definitivo (26, uno por etapa final y otro por Eclipse): elimina al rival activo de un golpe. Una vez por combate, desde el turno 5; si el rival se cubre ese turno, lo resiste y se pierde. Va en una 5.ª fila del menú de ataques | Pedido del autor (ataque que elimine de un golpe); las reglas evitan que el primero que lo use gane siempre. Aprobadas por el autor |
| D108 | Entre los rivales solo lo usan los jefes de la Torre y el Entrenador del día, y lo cargan un turno antes avisando («¡X acumula una energía terrible!»). La IA experta se cubre el 85 % de las veces cuando ve el aviso y el 25 % cuando tu Definitivo está listo | Que siempre haya forma de defenderse |
| D109 | Animación provisoria del Definitivo: pantalla oscurecida, atacante iluminado, su ataque final dos veces, estallido del color del tipo, destello y temblor (~3 s; mitad a ×2) | Hasta que lleguen las ilustraciones |
| D110 | Balance de la etapa final rehecho: los apoyos de etapa 3 de las familias resistentes suben Ataque y Velocidad (no más defensa); la potencia del final de etapa 4 va de 90 a 110 según la familia; el final Eclipse tiene una potencia parecida, precisión 85 y otro efecto; stats de etapa 4 ajustados por simulación | Con los ataques nuevos, las resistentes ganaban hasta el 88 % y las de Cielo el 8 % |
| D111 | Cámara viva en combate: el escenario, las criaturas y los efectos van en un contenedor «mundo» que se mueve como cámara en mano (deriva lenta de ±2 px con un acercamiento de base ×1,04). Al golpear se acerca a quien recibe (×1,10; ×1,16 el ataque final; ×1,22 sobre el atacante en el Definitivo) y luego vuelve al plano general. La interfaz no se mueve | Pedido del autor: que el combate no sea tan estático |
| D112 | Las criaturas respiran: se estiran y aplastan un 3 % desde los pies y se mecen ±1°, cada una a su ritmo; se detiene mientras otra animación las mueve | Pedido del autor («algún tambaleo») |
| D113 | Giro de perspectiva: cuando actúa el rival, la cámara gira con un barrido (se acerca, barre hacia un costado con desenfoque horizontal, cambian de lugar en lo más borroso y entra barriendo desde el otro costado, ~0,4 s; al volver barre al revés) y queda el rival de espaldas abajo a la izquierda y tu criatura de frente arriba a la derecha; cuando actúas tú, o antes de tu menú, vuelve. Los paneles de PS no se mueven (cada uno sigue en su lugar), el fondo no se espeja | Idea del autor. Paneles fijos para que siempre sepas cuál es tu barra |
| D114 | Botón «Cámara: sí/no» en la barra de ajustes: apagada, no hay deriva, acercamientos ni giro (siempre se mira desde tu lado); la respiración sigue | Hay a quien el movimiento de cámara lo marea |
| D115 | Efectos propios por ataque: las 26 láminas del autor (118 ataques) se cortan con `scripts/importar_efectos_ataques.py` (cortes por valles del alfa y piezas por componente conexo, sin partir trazos) y se reducen a 64 (ofensivo, defensivo, apoyo), 96 (final), 128 (impacto Definitivo) y 240 de ancho (pantalla Definitivo), con 16–32 colores. Salen en `public/efectos/ataques/` y la lista en `src/ui/efectos-ataques.json` | Pedido del autor. Originales en `arte/originales/efectos_ataques/` |
| D116 | Cada efecto propio tiene prioridad sobre el compartido de su `animacion`. Cómo se mueve sale de la habilidad: apoyo/defensa aparece sobre quien la usa (o sobre el rival si lo afecta) y late; físico aparece de golpe sobre el rival; especial viaja chico desde la boca y se abre; final crece sobre el rival con temblor. Se reflejan cuando el ataque va hacia la izquierda. Sin giro (la rotación ensucia el píxel) | Las láminas son imágenes fijas del momento principal |
| D117 | Definitivo con dibujo: tras el velo y el brillo del atacante, la composición de pantalla cubre el escenario (~1,3 s con temblor), luego el impacto estalla grande sobre el rival con destello, temblor fuerte y onda del color del tipo | Reemplaza la animación provisoria de D109 |
