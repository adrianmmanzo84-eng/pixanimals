# Pedido de efectos: familias 14 a 33

Cada familia lleva dos láminas con el mismo formato que las 13 anteriores: `NN_ataques.png` (4×2: ofensivos, defensivos y apoyos de 64, finales de 96) y `NN_definitivos.png` (2×2: impacto de 128 a la izquierda y pantalla de 240×160 a la derecha). `indice.csv` ya tiene sus filas, y al llegar se importan con `python3 scripts/importar_efectos_ataques.py`. Mientras falten, esos ataques usan el efecto compartido de su `animacion`.

### 14. Fenequín → Vitreón
Paleta: vidrio solar ámbar y naranja, chispas de arena. Paleta Eclipse: obsidiana y ámbar fundido con vetas rojas. Láminas `14_ataques.png` y `14_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Chispa de Arena | Ofensivo | Fenequín | Especial, potencia 45; 10 % de quemar. | Proyectil en vuelo con estela, sobre el rival. |
| F1 C2 | Velo de Calor | Defensivo | Toda la línea | Reduce el daño 60 %. | Anillo de calor en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Orejas al Sol | Apoyo | Fenequín a Dunafén | Sube Ataque Especial. | Aura con flechas hacia arriba y destello solar en rayos, sobre quien lo usa. |
| F1 C4 | Rayo de Vidrio | Final | Fenequín a Vitrifén | Especial, potencia 85. | Destello solar en rayos, en grande sobre el rival. |
| F2 C1 | Destello Ardiente | Ofensivo | Dunafén a Vitreón y Eclipse | Especial, potencia 55; 20 % de quemar. | Llamarada, sobre el rival. |
| F2 C2 | Danza del Desierto | Apoyo | Vitrifén a Vitreón y Eclipse | Sube Ataque Especial; sube Velocidad. | Aura con flechas hacia arriba y anillo de calor, sobre quien lo usa. |
| F2 C3 | Lente Solar | Final | Vitreón | Especial, potencia 110. | Destello solar en rayos, en grande sobre el rival. |
| F2 C4 | Vidrio Fundido | Final | Vitreón Eclipse | Especial, potencia 115. | Llamarada, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Sol de Cristal | Vitreón | Gran estallido: destello solar en rayos | Vitreón desatando Sol de Cristal, a pantalla completa |
| 2 | Tormenta de Vidrio | Vitreón Eclipse | Gran estallido: llamarada (paleta Eclipse) | Vitreón Eclipse desatando Tormenta de Vidrio, a pantalla completa |

### 15. Escarlito → Fundaris
Paleta: metal al rojo vivo, chispas de forja y brasas. Paleta Eclipse: magma con humo negro. Láminas `15_ataques.png` y `15_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Cornada Tibia | Ofensivo | Escarlito | Físico, potencia 40; 15 % de bajar Defensa rival. | Estallido de impacto en estrella, sobre el rival. |
| F1 C2 | Caparazón Forjado | Defensivo | Toda la línea | Reduce el daño 60 %. | Placas de escudo en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Templar | Apoyo | Escarlito a Yunquero | Sube Ataque. | Aura con flechas hacia arriba y anillo de calor, sobre quien lo usa. |
| F1 C4 | Martillo de Forja | Final | Escarlito a Cornifragua | Físico, potencia 85. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C1 | Cornada Ígnea | Ofensivo | Yunquero a Fundaris y Eclipse | Físico, potencia 55; 20 % de quemar. | Estallido de impacto en estrella, sobre el rival. |
| F2 C2 | Fuelle | Apoyo | Cornifragua a Fundaris y Eclipse | Sube Ataque; sube Velocidad. | Aura con flechas hacia arriba y anillo de calor, sobre quien lo usa. |
| F2 C3 | Yunque Ardiente | Final | Fundaris | Físico, potencia 110. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C4 | Cuerno de Magma | Final | Fundaris Eclipse | Físico, potencia 115. | Estallido de impacto en estrella, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Gran Fundición | Fundaris | Gran estallido: llamarada | Fundaris desatando Gran Fundición, a pantalla completa |
| 2 | Forja del Ocaso | Fundaris Eclipse | Gran estallido: llamarada (paleta Eclipse) | Fundaris Eclipse desatando Forja del Ocaso, a pantalla completa |

### 16. Nutrín → Nutrarca
Paleta: coral rosado, agua turquesa y piedras redondas. Paleta Eclipse: coral carmesí y agua oscura. Láminas `16_ataques.png` y `16_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Coletazo Marino | Ofensivo | Nutrín | Físico, potencia 40; 15 % de bajar Ataque rival. | Tres cortes diagonales, sobre el rival. |
| F1 C2 | Escudo de Coral | Defensivo | Toda la línea | Bloquea el golpe. | Placas de escudo en escudo completo alrededor de quien lo usa. |
| F1 C3 | Partir Conchas | Apoyo | Nutrín a Coralutra | Sube Ataque. | Aura con flechas hacia arriba y racimo de burbujas, sobre quien lo usa. |
| F1 C4 | Ola Coralina | Final | Nutrín a Arrecifa | Físico, potencia 85. | Ola que rompe, en grande sobre el rival. |
| F2 C1 | Mordisco de Coral | Ofensivo | Coralutra a Nutrarca y Eclipse | Físico, potencia 55; 20 % de bajar Defensa rival. | Colmillos que se cierran, sobre el rival. |
| F2 C2 | Marea de Coral | Apoyo | Arrecifa a Nutrarca y Eclipse | Sube Ataque; sube Defensa. | Aura con flechas hacia arriba y espiral de viento o corriente, sobre quien lo usa. |
| F2 C3 | Arrecife Furioso | Final | Nutrarca | Físico, potencia 110. | Ola que rompe, en grande sobre el rival. |
| F2 C4 | Coral Carmesí | Final | Nutrarca Eclipse | Físico, potencia 115. | Colmillos que se cierran, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Gran Barrera | Nutrarca | Gran estallido: ola que rompe | Nutrarca desatando Gran Barrera, a pantalla completa |
| 2 | Arrecife Sombrío | Nutrarca Eclipse | Gran estallido: ola que rompe (paleta Eclipse) | Nutrarca Eclipse desatando Arrecife Sombrío, a pantalla completa |

### 17. Hipín → Abisalio
Paleta: agua azul profundo en espirales, brillo plateado. Paleta Eclipse: espirales violeta y azul marino. Láminas `17_ataques.png` y `17_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Burbujas Veloces | Ofensivo | Hipín | Especial, potencia 40; 15 % de bajar Velocidad rival. | Racimo de burbujas, sobre el rival. |
| F1 C2 | Remolino Protector | Defensivo | Toda la línea | Reduce el daño 60 %. | Espiral de viento o corriente en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Danza Espiral | Apoyo | Hipín a Hipalet | Sube Ataque Especial. | Aura con flechas hacia arriba y espiral de viento o corriente, sobre quien lo usa. |
| F1 C4 | Chorro Abisal | Final | Hipín a Crestamar | Especial, potencia 85. | Ola que rompe, en grande sobre el rival. |
| F2 C1 | Hidroespiral | Ofensivo | Hipalet a Abisalio y Eclipse | Especial, potencia 55; 20 % de bajar Defensa Especial rival. | Espiral de viento o corriente, sobre el rival. |
| F2 C2 | Corriente Plateada | Apoyo | Crestamar a Abisalio y Eclipse | Sube Ataque Especial; sube Velocidad. | Aura con flechas hacia arriba y espiral de viento o corriente, sobre quien lo usa. |
| F2 C3 | Torbellino Abisal | Final | Abisalio | Especial, potencia 110. | Ola que rompe, en grande sobre el rival. |
| F2 C4 | Espiral Violeta | Final | Abisalio Eclipse | Especial, potencia 115. | Espiral de viento o corriente, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Abismo Plateado | Abisalio | Gran estallido: ola que rompe | Abisalio desatando Abismo Plateado, a pantalla completa |
| 2 | Vórtice Eterno | Abisalio Eclipse | Gran estallido: ola que rompe (paleta Eclipse) | Abisalio Eclipse desatando Vórtice Eterno, a pantalla completa |

### 18. Tapirín → Micelón
Paleta: musgo verde, hongos de repisa naranjas y esporas. Paleta Eclipse: hongos violeta luminosos. Láminas `18_ataques.png` y `18_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Trompazo | Ofensivo | Tapirín | Físico, potencia 40; 15 % de bajar Defensa rival. | Estallido de impacto en estrella, sobre el rival. |
| F1 C2 | Manto de Musgo | Defensivo | Toda la línea | Reduce el daño 60 %. | Placas de escudo en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Esporas Vigorosas | Apoyo | Tapirín a Musgapir | Sube Ataque. | Aura con flechas hacia arriba y nube de esporas, sobre quien lo usa. |
| F1 C4 | Estampida Verde | Final | Tapirín a Hongotapir | Físico, potencia 85. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C1 | Trompa Fúngica | Ofensivo | Musgapir a Micelón y Eclipse | Físico, potencia 55; 20 % de envenenar. | Nube de esporas, sobre el rival. |
| F2 C2 | Red de Micelio | Apoyo | Hongotapir a Micelón y Eclipse | Cura 35 %. | Brillo de curación y raíces que brotan del suelo, sobre quien lo usa. |
| F2 C3 | Alud de Hongos | Final | Micelón | Físico, potencia 110. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C4 | Espora Sombría | Final | Micelón Eclipse | Físico, potencia 115. | Nube de esporas, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Bosque Fúngico | Micelón | Gran estallido: nube de esporas | Micelón desatando Bosque Fúngico, a pantalla completa |
| 2 | Micelio del Ocaso | Micelón Eclipse | Gran estallido: raíces que brotan del suelo (paleta Eclipse) | Micelón Eclipse desatando Micelio del Ocaso, a pantalla completa |

### 19. Ninfín → Orquira
Paleta: pétalos de orquídea rosa y crema con filos verdes. Paleta Eclipse: pétalos carmesí y filos negros. Láminas `19_ataques.png` y `19_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Tajo de Pétalo | Ofensivo | Ninfín | Físico, potencia 40; 15 % de bajar Defensa rival. | Tres cortes diagonales, sobre el rival. |
| F1 C2 | Camuflaje Floral | Defensivo | Toda la línea | Reduce el daño 60 %. | Remolino de hojas en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Afilar Guadañas | Apoyo | Ninfín a Orquimán | Sube Ataque. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F1 C4 | Guadaña Floral | Final | Ninfín a Orquimantis | Físico, potencia 85. | Tres cortes diagonales, en grande sobre el rival. |
| F2 C1 | Doble Tajo | Ofensivo | Orquimán a Orquira y Eclipse | Físico, potencia 55; 20 % de bajar Defensa rival. | Tres cortes diagonales, sobre el rival. |
| F2 C2 | Danza de Orquídea | Apoyo | Orquimantis a Orquira y Eclipse | Sube Ataque; sube Velocidad. | Aura con flechas hacia arriba y remolino de hojas, sobre quien lo usa. |
| F2 C3 | Ciclón de Guadañas | Final | Orquira | Físico, potencia 110. | Remolino de hojas, en grande sobre el rival. |
| F2 C4 | Guadaña Carmesí | Final | Orquira Eclipse | Físico, potencia 115. | Tres cortes diagonales, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Jardín de Cuchillas | Orquira | Gran estallido: remolino de hojas | Orquira desatando Jardín de Cuchillas, a pantalla completa |
| 2 | Floración Oscura | Orquira Eclipse | Gran estallido: remolino de hojas (paleta Eclipse) | Orquira Eclipse desatando Floración Oscura, a pantalla completa |

### 20. Chinchín → Prismora
Paleta: cristales de cuarzo blanco y oro, chispas estáticas. Paleta Eclipse: cuarzo violeta chisporroteante. Láminas `20_ataques.png` y `20_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Zarpa Estática | Ofensivo | Chinchín | Físico, potencia 45; 10 % de paralizar. | Tres cortes diagonales, sobre el rival. |
| F1 C2 | Pelaje Esponjoso | Defensivo | Toda la línea | Reduce el daño 60 %. | Destellos en estrella en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Frotar Pelaje | Apoyo | Chinchín a Prismilla | Sube Ataque. | Aura con flechas hacia arriba y rayo en zigzag, sobre quien lo usa. |
| F1 C4 | Salto Prisma | Final | Chinchín a Cuarzilla | Físico, potencia 85. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C1 | Cola de Cuarzo | Ofensivo | Prismilla a Prismora y Eclipse | Físico, potencia 55; 20 % de paralizar. | Tres cortes diagonales, sobre el rival. |
| F2 C2 | Brillo de Cuarzo | Apoyo | Cuarzilla a Prismora y Eclipse | Sube Ataque; sube Velocidad. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F2 C3 | Embestida Prisma | Final | Prismora | Físico, potencia 110. | Rayo en zigzag, en grande sobre el rival. |
| F2 C4 | Cuarzo Violeta | Final | Prismora Eclipse | Físico, potencia 115. | Rayo en zigzag, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Prisma Relámpago | Prismora | Gran estallido: rayo en zigzag | Prismora desatando Prisma Relámpago, a pantalla completa |
| 2 | Prisma del Ocaso | Prismora Eclipse | Gran estallido: rayo en zigzag (paleta Eclipse) | Prismora Eclipse desatando Prisma del Ocaso, a pantalla completa |

### 21. Golondrín → Albalis
Paleta: plumas blancas y doradas, viento celeste, luz de amanecer. Paleta Eclipse: estela azul noche con destellos. Láminas `21_ataques.png` y `21_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Ala Rápida | Ofensivo | Golondrín | Físico, potencia 40; 15 % de bajar Velocidad rival. | Tres cortes diagonales, sobre el rival. |
| F1 C2 | Vuelo Esquivo | Defensivo | Toda la línea | Reduce el daño 60 %. | Espiral de viento o corriente en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Aire de Alba | Apoyo | Golondrín a Albavuelo | Sube Ataque. | Aura con flechas hacia arriba y espiral de viento o corriente, sobre quien lo usa. |
| F1 C4 | Picado del Alba | Final | Golondrín a Rasalba | Físico, potencia 85. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C1 | Cola Tijera | Ofensivo | Albavuelo a Albalis y Eclipse | Físico, potencia 55; 20 % de bajar Defensa rival. | Tres cortes diagonales, sobre el rival. |
| F2 C2 | Corriente Alba | Apoyo | Rasalba a Albalis y Eclipse | Sube Ataque; sube Velocidad. | Aura con flechas hacia arriba y espiral de viento o corriente, sobre quien lo usa. |
| F2 C3 | Vendaval Alba | Final | Albalis | Físico, potencia 110. | Espiral de viento o corriente, en grande sobre el rival. |
| F2 C4 | Tijera del Ocaso | Final | Albalis Eclipse | Físico, potencia 115. | Tres cortes diagonales, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Amanecer Eterno | Albalis | Gran estallido: destello solar en rayos | Albalis desatando Amanecer Eterno, a pantalla completa |
| 2 | Alba Negra | Albalis Eclipse | Gran estallido: espiral de viento o corriente (paleta Eclipse) | Albalis Eclipse desatando Alba Negra, a pantalla completa |

### 22. Murcito → Véspero
Paleta: alas de terciopelo violeta y ondas de eco plateadas. Paleta Eclipse: negro y violeta intenso con ondas rojizas. Láminas `22_ataques.png` y `22_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Mordisco Sombrío | Ofensivo | Murcito | Físico, potencia 40; 15 % de bajar Defensa rival. | Colmillos que se cierran, sobre el rival. |
| F1 C2 | Envoltura de Alas | Defensivo | Toda la línea | Bloquea el golpe. | Espiral de viento o corriente en escudo completo alrededor de quien lo usa. |
| F1 C3 | Ecolocación | Apoyo | Murcito a Velurci | Sube Ataque. | Aura con flechas hacia arriba y ondas de sonido concéntricas, sobre quien lo usa. |
| F1 C4 | Picado Nocturno | Final | Murcito a Alanoche | Físico, potencia 85. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C1 | Colmillo Velado | Ofensivo | Velurci a Véspero y Eclipse | Físico, potencia 55; 20 % de bajar Defensa rival. | Colmillos que se cierran, sobre el rival. |
| F2 C2 | Vuelo Nocturno | Apoyo | Alanoche a Véspero y Eclipse | Sube Ataque; sube Velocidad. | Aura con flechas hacia arriba y espiral de viento o corriente, sobre quien lo usa. |
| F2 C3 | Alas de Medianoche | Final | Véspero | Físico, potencia 110. | Espiral de viento o corriente, en grande sobre el rival. |
| F2 C4 | Ala Terciopelo | Final | Véspero Eclipse | Físico, potencia 115. | Tres cortes diagonales, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Noche Sin Luna | Véspero | Gran estallido: ojos brillantes con ondas | Véspero desatando Noche Sin Luna, a pantalla completa |
| 2 | Eco del Vacío | Véspero Eclipse | Gran estallido: ondas de sonido concéntricas (paleta Eclipse) | Véspero Eclipse desatando Eco del Vacío, a pantalla completa |

### 23. Mapachín → Onixor
Paleta: ónice gris oscuro con vetas lavanda, guijarros pulidos. Paleta Eclipse: ónice negro con brillo violeta. Láminas `23_ataques.png` y `23_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Guijarrazo | Ofensivo | Mapachín | Físico, potencia 40; 15 % de bajar Defensa rival. | Proyectil en vuelo con estela, sobre el rival. |
| F1 C2 | Cola Anillada | Defensivo | Toda la línea | Reduce el daño 60 %. | Placas de escudo en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Picardía | Apoyo | Mapachín a Onixito | Sube Ataque. | Aura con flechas hacia arriba y ojos brillantes con ondas, sobre quien lo usa. |
| F1 C4 | Lluvia de Ónice | Final | Mapachín a Anillónix | Físico, potencia 85. | Proyectil en vuelo con estela, en grande sobre el rival. |
| F2 C1 | Zarpa de Ónice | Ofensivo | Onixito a Onixor y Eclipse | Físico, potencia 55; 20 % de bajar Defensa rival. | Tres cortes diagonales, sobre el rival. |
| F2 C2 | Esconder Tesoro | Apoyo | Anillónix a Onixor y Eclipse | Cura 35 %. | Brillo de curación y destellos en estrella, sobre quien lo usa. |
| F2 C3 | Coletazo Anillado | Final | Onixor | Físico, potencia 110. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C4 | Ónice Sombrío | Final | Onixor Eclipse | Físico, potencia 115. | Estallido de impacto en estrella, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Tesoro de Ónice | Onixor | Gran estallido: destellos en estrella | Onixor desatando Tesoro de Ónice, a pantalla completa |
| 2 | Guarida del Vacío | Onixor Eclipse | Gran estallido: impacto en estrella (paleta Eclipse) | Onixor Eclipse desatando Guarida del Vacío, a pantalla completa |

### 24. Carbunín → Carbunco
Paleta: púas de carbón encendido y brasas naranjas. Paleta Eclipse: púas de obsidiana con filo rojo. Láminas `24_ataques.png` y `24_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Púa Candente | Ofensivo | Carbunín | Físico, potencia 45; 10 % de quemar. | Proyectil en vuelo con estela, sobre el rival. |
| F1 C2 | Erizar Púas | Defensivo | Toda la línea | Reduce el daño 60 %. | Anillo de calor en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Afilar Púas | Apoyo | Carbunín a Ascuespín | Sube Ataque. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F1 C4 | Lluvia de Púas | Final | Carbunín a Pirapúas | Físico, potencia 85. | Proyectil en vuelo con estela, en grande sobre el rival. |
| F2 C1 | Rodada Ígnea | Ofensivo | Ascuespín a Carbunco y Eclipse | Físico, potencia 55; 20 % de quemar. | Estallido de impacto en estrella, sobre el rival. |
| F2 C2 | Rescoldo Interno | Apoyo | Pirapúas a Carbunco y Eclipse | Cura 35 %. | Brillo de curación y anillo de calor, sobre quien lo usa. |
| F2 C3 | Tormenta de Púas | Final | Carbunco | Físico, potencia 110. | Proyectil en vuelo con estela, en grande sobre el rival. |
| F2 C4 | Púa de Obsidiana | Final | Carbunco Eclipse | Físico, potencia 115. | Proyectil en vuelo con estela, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Corona Carbúnculo | Carbunco | Gran estallido: llamarada | Carbunco desatando Corona Carbúnculo, a pantalla completa |
| 2 | Abanico del Ocaso | Carbunco Eclipse | Gran estallido: llamarada (paleta Eclipse) | Carbunco Eclipse desatando Abanico del Ocaso, a pantalla completa |

### 25. Chispollo → Cometón
Paleta: plumas de fuego rojo y dorado, estela de cometa. Paleta Eclipse: cometa rojo y negro. Láminas `25_ataques.png` y `25_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Picotazo Ígneo | Ofensivo | Chispollo | Físico, potencia 45; 10 % de quemar. | Estallido de impacto en estrella, sobre el rival. |
| F1 C2 | Alas de Ceniza | Defensivo | Toda la línea | Reduce el daño 60 %. | Espiral de viento o corriente en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Canto Matutino | Apoyo | Chispollo a Gallarete | Sube Ataque. | Aura con flechas hacia arriba y ondas de sonido concéntricas, sobre quien lo usa. |
| F1 C4 | Espolón Cometa | Final | Chispollo a Crestallama | Físico, potencia 85. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C1 | Picotazo Solar | Ofensivo | Gallarete a Cometón y Eclipse | Físico, potencia 55; 20 % de quemar. | Estallido de impacto en estrella, sobre el rival. |
| F2 C2 | Clarín del Alba | Apoyo | Crestallama a Cometón y Eclipse | Sube Ataque; sube Velocidad. | Aura con flechas hacia arriba y ondas de sonido concéntricas, sobre quien lo usa. |
| F2 C3 | Caída del Cometa | Final | Cometón | Físico, potencia 110. | Llamarada, en grande sobre el rival. |
| F2 C4 | Cola de Meteoro | Final | Cometón Eclipse | Físico, potencia 115. | Llamarada, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Lluvia de Cometas | Cometón | Gran estallido: llamarada | Cometón desatando Lluvia de Cometas, a pantalla completa |
| 2 | Cometa Negro | Cometón Eclipse | Gran estallido: llamarada (paleta Eclipse) | Cometón Eclipse desatando Cometa Negro, a pantalla completa |

### 26. Medusín → Carillón
Paleta: campanas translúcidas celestes, perlas y cintas. Paleta Eclipse: violeta abismal y perlas oscuras. Láminas `26_ataques.png` y `26_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Toque Urticante | Ofensivo | Medusín | Especial, potencia 45; 10 % de paralizar. | Racimo de burbujas, sobre el rival. |
| F1 C2 | Velo de Medusa | Defensivo | Toda la línea | Bloquea el golpe. | Racimo de burbujas en escudo completo alrededor de quien lo usa. |
| F1 C3 | Pulso Calmo | Apoyo | Medusín a Campanela | Sube Defensa Especial. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F1 C4 | Lluvia de Perlas | Final | Medusín a Medusperla | Especial, potencia 85. | Racimo de burbujas, en grande sobre el rival. |
| F2 C1 | Latigazo Perlado | Ofensivo | Campanela a Carillón y Eclipse | Especial, potencia 55; 20 % de paralizar. | Espiral de viento o corriente, sobre el rival. |
| F2 C2 | Campana Lunar | Apoyo | Medusperla a Carillón y Eclipse | Cura 35 %. | Brillo de curación y destellos en estrella, sobre quien lo usa. |
| F2 C3 | Gran Campanada | Final | Carillón | Especial, potencia 110. | Ola que rompe, en grande sobre el rival. |
| F2 C4 | Tentáculo Violeta | Final | Carillón Eclipse | Especial, potencia 115. | Espiral de viento o corriente, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Sinfonía Abisal | Carillón | Gran estallido: ola que rompe | Carillón desatando Sinfonía Abisal, a pantalla completa |
| 2 | Campana del Vacío | Carillón Eclipse | Gran estallido: ola que rompe (paleta Eclipse) | Carillón Eclipse desatando Campana del Vacío, a pantalla completa |

### 27. Narvalín → Glacior
Paleta: hielo celeste, cristales glaciales y agua helada. Paleta Eclipse: hielo negro azulado. Láminas `27_ataques.png` y `27_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Embestida Helada | Ofensivo | Narvalín | Físico, potencia 40; 15 % de bajar Velocidad rival. | Estallido de impacto en estrella, sobre el rival. |
| F1 C2 | Témpano | Defensivo | Toda la línea | Reduce el daño 60 %. | Placas de escudo en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Afilar Colmillo | Apoyo | Narvalín a Colmillar | Sube Ataque. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F1 C4 | Lanza de Hielo | Final | Narvalín a Glaciarval | Físico, potencia 85. | Proyectil en vuelo con estela, en grande sobre el rival. |
| F2 C1 | Colmillo Glacial | Ofensivo | Colmillar a Glacior y Eclipse | Físico, potencia 55; 20 % de bajar Velocidad rival. | Colmillos que se cierran, sobre el rival. |
| F2 C2 | Aguas Gélidas | Apoyo | Glaciarval a Glacior y Eclipse | Sube Ataque; sube Velocidad. | Aura con flechas hacia arriba y espiral de viento o corriente, sobre quien lo usa. |
| F2 C3 | Avalancha Marina | Final | Glacior | Físico, potencia 110. | Ola que rompe, en grande sobre el rival. |
| F2 C4 | Lanza del Ocaso | Final | Glacior Eclipse | Físico, potencia 115. | Proyectil en vuelo con estela, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Era Glacial | Glacior | Gran estallido: ola que rompe | Glacior desatando Era Glacial, a pantalla completa |
| 2 | Glaciar Eterno | Glacior Eclipse | Gran estallido: ola que rompe (paleta Eclipse) | Glacior Eclipse desatando Glaciar Eterno, a pantalla completa |

### 28. Capibín → Raigón
Paleta: raíces de manglar, hojas y agua verde. Paleta Eclipse: raíces negras y barro de pantano. Láminas `28_ataques.png` y `28_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Cabezazo Manso | Ofensivo | Capibín | Físico, potencia 40; 15 % de bajar Ataque rival. | Estallido de impacto en estrella, sobre el rival. |
| F1 C2 | Escudo de Raíces | Defensivo | Toda la línea | Bloquea el golpe. | Raíces que brotan del suelo en escudo completo alrededor de quien lo usa. |
| F1 C3 | Baño Tranquilo | Apoyo | Capibín a Raicibara | Cura 25 %. | Brillo de curación y racimo de burbujas, sobre quien lo usa. |
| F1 C4 | Raíz Aplastante | Final | Capibín a Manglarón | Físico, potencia 85. | Raíces que brotan del suelo, en grande sobre el rival. |
| F2 C1 | Látigo de Mangle | Ofensivo | Raicibara a Raigón y Eclipse | Físico, potencia 55; 20 % de bajar Velocidad rival. | Raíces que brotan del suelo, sobre el rival. |
| F2 C2 | Paz del Manglar | Apoyo | Manglarón a Raigón y Eclipse | Cura 35 %. | Brillo de curación y remolino de hojas, sobre quien lo usa. |
| F2 C3 | Marea de Raíces | Final | Raigón | Físico, potencia 110. | Raíces que brotan del suelo, en grande sobre el rival. |
| F2 C4 | Raíz del Ocaso | Final | Raigón Eclipse | Físico, potencia 115. | Raíces que brotan del suelo, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Gran Manglar | Raigón | Gran estallido: raíces que brotan del suelo | Raigón desatando Gran Manglar, a pantalla completa |
| 2 | Pantano Eterno | Raigón Eclipse | Gran estallido: raíces que brotan del suelo (paleta Eclipse) | Raigón Eclipse desatando Pantano Eterno, a pantalla completa |

### 29. Ramitín → Bambuzal
Paleta: cañas y hojas de bambú verde. Paleta Eclipse: bambú negro con hojas filosas. Láminas `29_ataques.png` y `29_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Lluvia de Hojas | Ofensivo | Ramitín | Especial, potencia 40; 15 % de bajar Defensa Especial rival. | Remolino de hojas, sobre el rival. |
| F1 C2 | Quedarse Quieto | Defensivo | Toda la línea | Reduce el daño 60 %. | Remolino de hojas en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Brote Nuevo | Apoyo | Ramitín a Bambulito | Sube Ataque Especial. | Aura con flechas hacia arriba y nube de esporas, sobre quien lo usa. |
| F1 C4 | Lanza de Bambú | Final | Ramitín a Bambucán | Especial, potencia 85. | Proyectil en vuelo con estela, en grande sobre el rival. |
| F2 C1 | Hoja Cortante | Ofensivo | Bambulito a Bambuzal y Eclipse | Especial, potencia 55; 20 % de bajar Defensa Especial rival. | Remolino de hojas, sobre el rival. |
| F2 C2 | Bosque de Bambú | Apoyo | Bambucán a Bambuzal y Eclipse | Sube Ataque Especial; sube Defensa. | Aura con flechas hacia arriba y raíces que brotan del suelo, sobre quien lo usa. |
| F2 C3 | Ciclón de Hojas | Final | Bambuzal | Especial, potencia 110. | Remolino de hojas, en grande sobre el rival. |
| F2 C4 | Hoja Sombría | Final | Bambuzal Eclipse | Especial, potencia 115. | Remolino de hojas, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Selva de Bambú | Bambuzal | Gran estallido: remolino de hojas | Bambuzal desatando Selva de Bambú, a pantalla completa |
| 2 | Bambú del Ocaso | Bambuzal Eclipse | Gran estallido: remolino de hojas (paleta Eclipse) | Bambuzal Eclipse desatando Bambú del Ocaso, a pantalla completa |

### 30. Pavito → Heliavo
Paleta: plumas marfil y oro con ojos cian, chispas eléctricas. Paleta Eclipse: ojos de pluma violeta y rayos. Láminas `30_ataques.png` y `30_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Destello | Ofensivo | Pavito | Especial, potencia 40; 15 % de bajar Defensa Especial rival. | Destellos en estrella, sobre el rival. |
| F1 C2 | Abanico Escudo | Defensivo | Toda la línea | Reduce el daño 60 %. | Destellos en estrella en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Desplegar Plumas | Apoyo | Pavito a Plumasol | Sube Ataque Especial. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F1 C4 | Ojos del Abanico | Final | Pavito a Abanicor | Especial, potencia 90. | Ojos brillantes con ondas, en grande sobre el rival. |
| F2 C1 | Pluma Eléctrica | Ofensivo | Plumasol a Heliavo y Eclipse | Especial, potencia 55; 20 % de paralizar. | Rayo en zigzag, sobre el rival. |
| F2 C2 | Pavoneo | Apoyo | Abanicor a Heliavo y Eclipse | Sube Ataque Especial; sube Defensa Especial. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F2 C3 | Rayo Helianto | Final | Heliavo | Especial, potencia 110. | Rayo en zigzag, en grande sobre el rival. |
| F2 C4 | Abanico Violeta | Final | Heliavo Eclipse | Especial, potencia 115. | Rayo en zigzag, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Mil Ojos Solares | Heliavo | Gran estallido: destello solar en rayos | Heliavo desatando Mil Ojos Solares, a pantalla completa |
| 2 | Eclipse de Plumas | Heliavo Eclipse | Gran estallido: rayo en zigzag (paleta Eclipse) | Heliavo Eclipse desatando Eclipse de Plumas, a pantalla completa |

### 31. Carpín → Faroluz
Paleta: luz de farol dorada, cintas marfil y chispas. Paleta Eclipse: farol violeta y electricidad. Láminas `31_ataques.png` y `31_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Chispa de Farol | Ofensivo | Carpín | Especial, potencia 45; 10 % de paralizar. | Rayo en zigzag, sobre el rival. |
| F1 C2 | Aleta Brillante | Defensivo | Toda la línea | Reduce el daño 60 %. | Destellos en estrella en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Encender Farol | Apoyo | Carpín a Farolín | Sube Ataque Especial. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F1 C4 | Relámpago Dorado | Final | Carpín a Lucicarpa | Especial, potencia 85. | Rayo en zigzag, en grande sobre el rival. |
| F2 C1 | Bigote Eléctrico | Ofensivo | Farolín a Faroluz y Eclipse | Especial, potencia 55; 20 % de paralizar. | Rayo en zigzag, sobre el rival. |
| F2 C2 | Nado Luminoso | Apoyo | Lucicarpa a Faroluz y Eclipse | Sube Ataque Especial; sube Velocidad. | Aura con flechas hacia arriba y espiral de viento o corriente, sobre quien lo usa. |
| F2 C3 | Farol Celeste | Final | Faroluz | Especial, potencia 110. | Destellos en estrella, en grande sobre el rival. |
| F2 C4 | Farol Sombrío | Final | Faroluz Eclipse | Especial, potencia 115. | Rayo en zigzag, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Mil Faroles | Faroluz | Gran estallido: destellos en estrella | Faroluz desatando Mil Faroles, a pantalla completa |
| 2 | Linterna del Ocaso | Faroluz Eclipse | Gran estallido: rayo en zigzag (paleta Eclipse) | Faroluz Eclipse desatando Linterna del Ocaso, a pantalla completa |

### 32. Buhíto → Umbrus
Paleta: plumas índigo, lunas y ojos brillantes. Paleta Eclipse: lunas violeta y ojos brillantes. Láminas `32_ataques.png` y `32_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Ráfaga Nocturna | Ofensivo | Buhíto | Especial, potencia 40; 15 % de bajar Defensa Especial rival. | Espiral de viento o corriente, sobre el rival. |
| F1 C2 | Plumaje Denso | Defensivo | Toda la línea | Reduce el daño 60 %. | Espiral de viento o corriente en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Mirada Atenta | Apoyo | Buhíto a Ululín | Sube Ataque Especial. | Aura con flechas hacia arriba y ojos brillantes con ondas, sobre quien lo usa. |
| F1 C4 | Hipnosis Lunar | Final | Buhíto a Umbralón | Especial, potencia 85. | Ojos brillantes con ondas, en grande sobre el rival. |
| F2 C1 | Ala Umbral | Ofensivo | Ululín a Umbrus y Eclipse | Especial, potencia 55; 20 % de bajar Defensa Especial rival. | Espiral de viento o corriente, sobre el rival. |
| F2 C2 | Vigilia | Apoyo | Umbralón a Umbrus y Eclipse | Sube Ataque Especial; sube Defensa Especial. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F2 C3 | Tempestad Nocturna | Final | Umbrus | Especial, potencia 110. | Espiral de viento o corriente, en grande sobre el rival. |
| F2 C4 | Mirada del Umbral | Final | Umbrus Eclipse | Especial, potencia 115. | Ojos brillantes con ondas, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Noche de Mil Ojos | Umbrus | Gran estallido: ojos brillantes con ondas | Umbrus desatando Noche de Mil Ojos, a pantalla completa |
| 2 | Umbral Eterno | Umbrus Eclipse | Gran estallido: espiral de viento o corriente (paleta Eclipse) | Umbrus Eclipse desatando Umbral Eterno, a pantalla completa |

### 33. Topín → Geodón
Paleta: amatistas violetas, tierra y roca. Paleta Eclipse: amatista oscura casi negra. Láminas `33_ataques.png` y `33_definitivos.png`.

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
|---|---|---|---|---|---|
| F1 C1 | Garra Excavadora | Ofensivo | Topín | Físico, potencia 40; 15 % de bajar Defensa rival. | Tres cortes diagonales, sobre el rival. |
| F1 C2 | Madriguera | Defensivo | Toda la línea | Reduce el daño 60 %. | Placas de escudo en escudo semitransparente alrededor de quien lo usa. |
| F1 C3 | Pulir Garras | Apoyo | Topín a Excavito | Sube Ataque. | Aura con flechas hacia arriba y destellos en estrella, sobre quien lo usa. |
| F1 C4 | Lluvia de Geodas | Final | Topín a Amatopo | Físico, potencia 85. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C1 | Garra de Amatista | Ofensivo | Excavito a Geodón y Eclipse | Físico, potencia 55; 20 % de bajar Defensa rival. | Tres cortes diagonales, sobre el rival. |
| F2 C2 | Coraza de Geoda | Apoyo | Amatopo a Geodón y Eclipse | Sube Defensa; sube Defensa Especial. | Aura con flechas hacia arriba y placas de escudo, sobre quien lo usa. |
| F2 C3 | Sismo Cristalino | Final | Geodón | Físico, potencia 110. | Estallido de impacto en estrella, en grande sobre el rival. |
| F2 C4 | Amatista Negra | Final | Geodón Eclipse | Físico, potencia 115. | Estallido de impacto en estrella, en grande sobre el rival, paleta Eclipse. |

| Fila | Definitivo | Quién lo usa | Impacto (C1) | Pantalla (C2) |
|---|---|---|---|---|
| 1 | Corazón de Geoda | Geodón | Gran estallido: destellos en estrella | Geodón desatando Corazón de Geoda, a pantalla completa |
| 2 | Geoda del Vacío | Geodón Eclipse | Gran estallido: impacto en estrella (paleta Eclipse) | Geodón Eclipse desatando Geoda del Vacío, a pantalla completa |
