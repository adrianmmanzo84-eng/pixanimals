# PIXANIMALS · Cronoportal y Mina: criaturas, ataques y arte a diseñar

Nov 15, 2026 · @Adrian

## Cómo usar este documento

Este es el pedido completo de arte para dos cosas: el **Cronoportal** (5 eras, 5 familias prehistóricas nuevas, numeradas 39 a 43) y los **efectos de ataque de las 5 familias de la Mina** (34 a 38, ya en el juego con sus ataques definidos). Al final hay efectos nuevos para todo el juego. Todo lo que todavía no tenga arte funciona igual con el efecto genérico, así que se puede entregar por partes.

Los nombres siguen el esquema pix y son provisorios: si preferís otros, cambiarlos no afecta a los archivos.

| Pieza | Medida final | Formato |
| --- | --- | --- |
| Criatura (frente y espalda) | 64×64 por vista, como el pack de la Mina (o lámina 4×2 como las 33 familias) | PNG transparente, sin suavizado, hasta 15 colores por familia |
| Ícono de criatura | 32×32 | PNG transparente |
| Fondo de combate de era | 960×455, plataforma del jugador abajo a la izquierda y la del rival arriba a la derecha | PNG o JPG, sin personajes ni texto |
| Fondo del mapa de expedición | 960×640, más oscuro y con poco detalle (van íconos encima) | PNG o JPG |
| Efecto de ataque ofensivo, defensivo o de apoyo | 64×64 | PNG transparente |
| Efecto de ataque final | 96×96 | PNG transparente |
| Definitivo: impacto | 128×128 | PNG transparente |
| Definitivo: pantalla completa | 240×160 (o 960×640, se reduce) | PNG |
| Íconos (fósiles, mapa, ámbar) | 16×16 | PNG transparente |
| Animaciones | Cuadros del mismo tamaño en tira horizontal, sin separación | PNG transparente |

Láminas de ataques: igual que las familias 14 a 33. `NN_ataques.png` en 4×2 (ofensivos, defensivos y apoyos a 64; finales a 96) y `NN_definitivos.png` con el impacto a la izquierda y la pantalla a la derecha. En la tabla de cada familia, "F1 C2" es fila 1, columna 2. También sirven piezas sueltas con el nombre de archivo indicado.

## Cronoportal: las 5 eras

Cada era es una expedición de unos 8 pasos con una regla que cambia todos sus combates. Se desbloquean en orden y al final de cada una espera el jefe: la forma final de la familia de esa era. Los rivales comunes son las etapas 1 a 3 de esa familia, mezcladas con familias actuales de tipos afines.

| Era | Niveles | Regla especial | Familia y jefe | Rivales acompañantes |
| --- | --- | --- | --- | --- |
| 1. Mar Primitivo | 20–28 | **Marea:** cada 3 turnos sube el agua; los ataques de tipo Marea pegan +25 % ese turno | Anomalocaris (Marea) | Medusa, cangrejo, pulpo, mantarraya |
| 2. Bosque Gigante | 28–38 | **Esporas:** al final de cada turno, 20 % de que una criatura al azar quede envenenada o dormida | Meganeura (Rayo) | Escarabajo, mantis, polilla, caracol |
| 3. Jurásico | 38–48 | **Estampida:** cada 4 turnos pasa una manada y le quita 10 % de vida a quien tenga menos | Stegosaurus (Brote) | Gecko, tapir, puercoespín |
| 4. Cretácico | 48–56 | **Meteoro:** cuenta regresiva de 8 turnos; si el combate sigue, cae y deja a todos con 25 % de vida | Pteranodon (Cielo) | Golondrina, colibrí, búho |
| 5. Edad de Hielo | 56–65 | **Frío:** todos pierden 1 punto de Velocidad por turno, salvo los de tipo Brasa | Mamut (Roca) | Topo, liebre, chinchilla, pangolín |

### Fondos de combate (960×455, uno por era)

Mismo estilo que las guaridas de la Mina: plataforma del jugador abajo a la izquierda, la del rival arriba a la derecha, espacio libre para las criaturas y nada de texto ni personajes. Archivos `crono_era1.png` a `crono_era5.png`.

1. **Mar Primitivo.** Fondo marino poco profundo al amanecer, con luz filtrándose desde arriba. Estromatolitos como rocas redondas, esponjas, algas primitivas y conchas en espiral. Plataformas: dos bancos de arena clara. Paleta: turquesa, rosa coral y dorado.
2. **Bosque Gigante.** Bosque pantanoso del Carbonífero con helechos y colas de caballo del tamaño de árboles, troncos escamosos y niebla verde. Esporas flotando como motas de luz. Plataformas: dos troncos caídos con musgo. Paleta: verdes húmedos, ámbar y destellos azul eléctrico de tormenta lejana.
3. **Jurásico.** Valle abierto con coníferas y cicadas, un río y volcanes dormidos al fondo. Siluetas de saurópodos muy lejos, en el horizonte, sin detalle. Plataformas: claros de pasto pisoteado. Paleta: verde vivo, ocre y cielo celeste.
4. **Cretácico.** Acantilado costero al atardecer, con el cielo rojo-anaranjado y un meteoro brillante aún pequeño en el cielo. Magnolias, las primeras flores. Plataformas: dos salientes de roca del acantilado. Paleta: naranja, rojo, violeta y crema.
5. **Edad de Hielo.** Tundra nevada con glaciares azules, aurora boreal verde y abetos cubiertos de nieve. Plataformas: placas de hielo con nieve encima. Paleta: celestes, blanco, verde aurora y marrón cálido de la tierra.

### Fondos del mapa de expedición (960×640, opcionales)

Una vista de la misma era desde arriba o en perspectiva lejana, más oscura y con poco detalle, porque encima van los íconos del camino. Archivos `crono_mapa1.png` a `crono_mapa5.png`. Si no llegan, uso el fondo de combate oscurecido.

### Pantalla del Cronoportal (960×640, opcional)

El laboratorio donde está el portal: una sala de piedra antigua con engranajes de bronce, relojes de arena y vitrinas con fósiles. El portal va en el centro como animación aparte (ver Efectos nuevos). Archivo `crono_sala.png`.

## Cronoportal: las 5 familias prehistóricas

Cinco familias de 4 etapas, una por era. Su forma final es el jefe de la era y es un **guardián del tiempo**: todas las formas finales llevan detalles de ámbar y runas doradas, como marca común del Cronoportal. Se consiguen reviviendo fósiles en el Laboratorio del Tiempo, nunca en sobres. Los tamaños por etapa son los mismos que en la Mina: 32, 40, 50 y 62 px dentro del lienzo de 64×64.

| N.º | Familia | Tipo | Animal | Etapas (1 → 4) | Paleta |
| --- | --- | --- | --- | --- | --- |
| 39 | anomalo | Marea | Anomalocaris | Anomalopix → Anomalopixel → Anomalomegapix → Anomalogigapix | Rosa coral, azul abisal, ojos dorados |
| 40 | meganeura | Rayo | Meganeura (libélula gigante) | Meganeupix → Meganeupixel → Meganeumegapix → Meganeugigapix | Verde iridiscente, azul eléctrico, alas de vitral |
| 41 | estego | Brote | Stegosaurus | Estegopix → Estegopixel → Estegomegapix → Estegogigapix | Verde musgo, placas terracota y naranja |
| 42 | ptero | Cielo | Pteranodon | Pteropix → Pteropixel → Pteromegapix → Pterogigapix | Crema, rojo atardecer, cresta naranja |
| 43 | mamut | Roca | Mamut lanudo | Mamutpix → Mamutpixel → Mamutmegapix → Mamutgigapix | Pelaje castaño, colmillos marfil, hielo celeste |

### 39. Anomalocaris (Marea, físico y veloz)

1. **Anomalopix:** cría redondita con dos garritas frontales enrolladas y ojos grandes sobre tallos cortos.
2. **Anomalopixel:** cuerpo más largo y segmentado, aletas laterales que ondulan, garras con espinitas.
3. **Anomalomegapix:** cazador del mar antiguo, garras espinosas desplegadas, cola en abanico.
4. **Anomalogigapix (jefe):** aletas laterales como velas translúcidas, garras con anillos de ámbar y una runa dorada en la frente. Guardián del primer océano.

### 40. Meganeura (Rayo, especial y veloz)

1. **Meganeupix:** ninfa acuática rechoncha, con brotecitos de alas que chispean.
2. **Meganeupixel:** libélula joven con 4 alas cortas brillantes y ojos compuestos enormes.
3. **Meganeumegapix:** libélula gigante con nervaduras eléctricas en las alas y cola larga.
4. **Meganeugigapix (jefe):** 4 alas de vitral con runas de ámbar y un halo de chispas. Guardián de las tormentas del bosque gigante.

### 41. Stegosaurus (Brote, físico y resistente)

1. **Estegopix:** cría con brotes de hoja en lugar de placas y una colita con 2 púas blandas.
2. **Estegopixel:** placas como hojas grandes en fila, cola con 4 púas.
3. **Estegomegapix:** placas de hoja otoñal endurecida, musgo en el lomo, púas largas.
4. **Estegogigapix (jefe):** placas que parecen un bosque en el lomo, púas de ámbar en la cola y runas doradas en las placas. Guardián de la manada jurásica.

### 42. Pteranodon (Cielo, físico y veloz)

1. **Pteropix:** cría de alas cortas que todavía no vuela, cresta pequeña.
2. **Pteropixel:** alas abiertas, cresta más larga, pico afilado.
3. **Pteromegapix:** gran planeador con alas de membrana rojiza y cresta naranja.
4. **Pterogigapix (jefe):** alas con estela de cometa, cresta encendida como un meteoro y anillos de ámbar en las alas. Guardián del cielo del último atardecer.

### 43. Mamut lanudo (Roca, físico y muy resistente)

1. **Mamutpix:** cría lanuda y redonda, colmillitos cortos, nariz enroscada.
2. **Mamutpixel:** pelaje más largo con escarcha, colmillos curvos.
3. **Mamutmegapix:** mamut adulto con roca y hielo pegados al pelaje, colmillos grandes.
4. **Mamutgigapix (jefe):** colmillos de hielo con núcleo de ámbar, joroba de roca y runas doradas en la frente. Guardián de la Edad de Hielo.

### Fósiles y ámbar (16×16)

Un fósil por familia para el inventario (`fosil_anomalo.png`, etc.), dibujado como un trozo de roca con la silueta de la cría, y un fragmento de ámbar genérico (`ambar.png`). Con 5 fragmentos del fósil de una familia se revive su cría.

## Ataques del Cronoportal

Cada familia tiene 7 ataques y un Definitivo, con la misma progresión que las demás: el ofensivo mejora en la etapa 2, el apoyo en la 3 y el final en la 4. El defensivo lo usa toda la línea. Cada familia lleva una lámina `NN_ataques.png` (4×2, la última celda queda libre) y una `NN_definitivos.png` (impacto + pantalla en una sola fila).

### 39. Anomalocaris

Paleta: agua turquesa, coral rosado y destellos de ámbar. Pasiva: **Garras Cámbricas** (como Oleaje: sus ataques suben de poder tras usar un apoyo).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Garra Primitiva | Ofensivo | Etapa 1 | Físico, potencia 40; 15 % de bajar Defensa rival. | Dos garras curvas con espinas que se cierran sobre el rival. |
| F1 C2 | Caparazón Cámbrico | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de envenenar a quien golpee de cerca. | Placas segmentadas formando un escudo semitransparente. |
| F1 C3 | Ojos Compuestos | Apoyo | Etapas 1 y 2 | Sube Ataque. | Ojos facetados que brillan con flechas hacia arriba, sobre quien lo usa. |
| F1 C4 | Remolino Cámbrico | Final | Etapas 1 a 3 | Físico, potencia 85. | Remolino de agua con conchas y partículas, en grande sobre el rival. |
| F2 C1 | Tenaza Abisal | Ofensivo | Etapas 2 a 4 | Físico, potencia 55; 20 % de bajar Defensa rival. | Tenazas espinosas azul oscuro que atrapan al rival. |
| F2 C2 | Marea Cámbrica | Apoyo | Etapas 3 y 4 | Sube Ataque y Velocidad. | Espiral de corriente con flechas hacia arriba. |
| F2 C3 | Abismo Primigenio | Final | Etapa 4 | Físico, potencia 110. | Ola oscura que se cierra como una boca con anillos de ámbar. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Primer Océano | Gran tromba de agua con un núcleo de ámbar | Anomalogigapix emergiendo del océano primitivo con las aletas abiertas |

### 40. Meganeura

Paleta: verde iridiscente, azul eléctrico y vitral. Pasiva: **Alas Estáticas** (como Oleaje).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Zumbido Voltaico | Ofensivo | Etapa 1 | Especial, potencia 40; 10 % de paralizar. | Ondas de sonido eléctricas en arcos, sobre el rival. |
| F1 C2 | Alas de Vitral | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de paralizar a quien golpee de cerca. | Cuatro alas translúcidas de vitral cerrándose como escudo. |
| F1 C3 | Vuelo Estático | Apoyo | Etapas 1 y 2 | Sube Velocidad. | Círculo de chispas con estela, alrededor de quien lo usa. |
| F1 C4 | Enjambre Eléctrico | Final | Etapas 1 a 3 | Especial, potencia 85. | Nube de chispas zumbantes que envuelve al rival. |
| F2 C1 | Picada Relámpago | Ofensivo | Etapas 2 a 4 | Especial, potencia 55; 20 % de paralizar. | Rayo en zigzag que cae en picada sobre el rival. |
| F2 C2 | Mil Facetas | Apoyo | Etapas 3 y 4 | Sube Ataque Especial y Velocidad. | Mosaico de facetas brillantes con flechas hacia arriba. |
| F2 C3 | Tormenta Pantanosa | Final | Etapa 4 | Especial, potencia 110. | Tormenta verde y azul con rayos ramificados sobre el rival. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Rayo Primordial | Rayo ramificado verde y azul con chispas de ámbar | Meganeugigapix sobre el bosque gigante bajo una tormenta eléctrica |

### 41. Stegosaurus

Paleta: verde musgo, terracota y luz de sol. Pasiva: **Lomo Frondoso** (como Raíces: recupera un poco de vida cada turno).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Coletazo de Púas | Ofensivo | Etapa 1 | Físico, potencia 40; 15 % de bajar Defensa rival. | Cola con púas que barre en arco sobre el rival. |
| F1 C2 | Placas de Hoja | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de envenenar a quien golpee de cerca. | Placas verdes en forma de hoja formando un escudo. |
| F1 C3 | Sol del Jurásico | Apoyo | Etapas 1 y 2 | Cura 25 % de la vida. | Rayos de sol cálidos con hojitas que suben. |
| F1 C4 | Estampida de Hojas | Final | Etapas 1 a 3 | Físico, potencia 85. | Polvareda con hojas y siluetas de una manada, en grande sobre el rival. |
| F2 C1 | Púas Milenarias | Ofensivo | Etapas 2 a 4 | Físico, potencia 55; 20 % de bajar Defensa rival. | Cuatro púas de piedra y ámbar que golpean en cruz. |
| F2 C2 | Bosque Jurásico | Apoyo | Etapas 3 y 4 | Cura 25 % y sube Defensa. | Brotes que crecen alrededor con un escudo verde suave. |
| F2 C3 | Gran Estampida | Final | Etapa 4 | Físico, potencia 110. | Manada en carga con polvo y hojas, a lo ancho del rival. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Corazón Jurásico | Estallido de hojas y placas con un brillo de ámbar en el centro | Estegogigapix guiando una estampida jurásica en el valle |

### 42. Pteranodon

Paleta: cielo rojo de atardecer, crema y naranja de meteoro. Pasiva: **Viento Cretácico** (como Último Rescoldo: pega más fuerte con poca vida).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Picotazo Cretácico | Ofensivo | Etapa 1 | Físico, potencia 40; 15 % de bajar Defensa rival. | Pico que entra en diagonal con trazo de viento. |
| F1 C2 | Alas Planeadoras | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de paralizar a quien golpee de cerca. | Dos alas de membrana envolviendo a quien lo usa. |
| F1 C3 | Corriente Térmica | Apoyo | Etapas 1 y 2 | Sube Velocidad. | Columna de aire caliente en espiral con flechas hacia arriba. |
| F1 C4 | Picado Meteoro | Final | Etapas 1 a 3 | Físico, potencia 85. | Silueta en picada envuelta en fuego, en grande sobre el rival. |
| F2 C1 | Cresta Cortante | Ofensivo | Etapas 2 a 4 | Físico, potencia 55; 20 % de bajar Defensa rival. | Corte curvo naranja con forma de cresta. |
| F2 C2 | Vuelo Rasante | Apoyo | Etapas 3 y 4 | Sube Ataque y Velocidad. | Estela de viento horizontal con flechas hacia arriba. |
| F2 C3 | Lluvia de Meteoros | Final | Etapa 4 | Físico, potencia 110. | Varios meteoros pequeños cayendo sobre el rival. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Último Cielo | Cometa que estalla en anillos de fuego y ámbar | Pterogigapix cruzando el cielo rojo seguido por una lluvia de meteoros |

### 43. Mamut lanudo

Paleta: hielo celeste, blanco nieve y castaño. Pasiva: **Pelaje Eterno** (como Raíces).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Colmillazo | Ofensivo | Etapa 1 | Físico, potencia 40; 15 % de bajar Defensa rival. | Dos colmillos que embisten con un destello blanco. |
| F1 C2 | Pelaje Glacial | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de paralizar (congelar) a quien golpee de cerca. | Pelaje con escarcha formando un escudo redondo. |
| F1 C3 | Bramido Helado | Apoyo | Etapas 1 y 2 | Baja el Ataque del rival. | Ondas de sonido con copos de nieve hacia el rival. |
| F1 C4 | Alud de Nieve | Final | Etapas 1 a 3 | Físico, potencia 85. | Avalancha de nieve y rocas cayendo sobre el rival. |
| F2 C1 | Colmillos de Hielo | Ofensivo | Etapas 2 a 4 | Físico, potencia 55; 20 % de bajar Velocidad rival. | Colmillos de hielo cristalino que se cruzan. |
| F2 C2 | Manada Glacial | Apoyo | Etapas 3 y 4 | Sube Ataque y Defensa. | Huellas de hielo en círculo con flechas hacia arriba. |
| F2 C3 | Glaciación | Final | Etapa 4 | Físico, potencia 110. | Bloques de hielo que brotan del suelo y encierran al rival. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Era de Hielo | Estallido de hielo y roca con núcleo de ámbar | Mamutgigapix bajo la aurora, con glaciares que se levantan detrás |

## Ataques de las familias de la Mina

Estos ataques ya están en el juego; hoy usan el efecto genérico de su tipo. Mismo formato de láminas que el Cronoportal: `NN_ataques.png` en 4×2 (la última celda queda libre) y `NN_definitivos.png` con impacto y pantalla en una fila.

### 34. Therizinosaurus (Terizpix → Terizgigapix)

Pasiva: **Garras Ancestrales** (como Raíces: recupera un poco de vida cada turno).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Zarpa de Helecho | Ofensivo | Etapa 1 | Físico, potencia 40; 15 % de bajar Defensa rival. | Tres cortes verdes con forma de garra de helecho, sobre el rival. |
| F1 C2 | Follaje Jurásico | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de envenenar a quien golpee de cerca. | Escudo de frondas jurásicas alrededor de quien lo usa. |
| F1 C3 | Savia Antigua | Apoyo | Etapas 1 y 2 | Cura 25 % de la vida. | Gotas de savia dorada que suben y curan. |
| F1 C4 | Siega Prehistórica | Final | Etapas 1 a 3 | Físico, potencia 85. | Arco de hojas afiladas que barre al rival, en grande. |
| F2 C1 | Garras Guadaña | Ofensivo | Etapas 2 a 4 | Físico, potencia 55; 20 % de bajar Defensa rival. | Garras largas como guadañas que cortan en X. |
| F2 C2 | Brote Eterno | Apoyo | Etapas 3 y 4 | Cura 25 % de la vida; sube Ataque. | Brotes que crecen en espiral con flechas hacia arriba. |
| F2 C3 | Siega Milenaria | Final | Etapa 4 | Físico, potencia 110. | Remolino de hojas y garras gigantes, en grande sobre el rival. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Raíz del Mundo | Raíces gigantes que brotan con hojas doradas | Terizgigapix con un bosque creciendo a su paso |

### 35. Plesiosaurio (Plesiopix → Plesiogigapix)

Pasiva: **Marea Antigua** (como Oleaje: sus ataques suben de poder tras usar un apoyo).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Onda Abisal | Ofensivo | Etapa 1 | Especial, potencia 40; 15 % de bajar Velocidad rival. | Onda de agua oscura en arco hacia el rival. |
| F1 C2 | Burbuja Fósil | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de dormir a quien golpee de cerca. | Burbuja grande con detalles de fósil alrededor de quien lo usa. |
| F1 C3 | Canto Profundo | Apoyo | Etapas 1 y 2 | Sube Ataque Especial. | Notas musicales de agua en espiral, sobre quien lo usa. |
| F1 C4 | Maremoto Jurásico | Final | Etapas 1 a 3 | Especial, potencia 85. | Gran ola con siluetas de aletas, en grande sobre el rival. |
| F2 C1 | Oleaje Antiguo | Ofensivo | Etapas 2 a 4 | Especial, potencia 55; 20 % de bajar Velocidad rival. | Oleaje con espuma que golpea en dos olas. |
| F2 C2 | Canto de Nereida | Apoyo | Etapas 3 y 4 | Sube Ataque Especial; sube Defensa Especial. | Canto con brillo celeste y flechas hacia arriba. |
| F2 C3 | Diluvio Eterno | Final | Etapa 4 | Especial, potencia 110. | Diluvio de agua desde arriba con remolino, en grande. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Mar Primordial | Remolino de agua profunda con brillo celeste | Plesiogigapix cantando sobre un mar subterráneo |

### 36. Triceratops (Tricepix → Tricegigapix)

Pasiva: **Gola Conductora** (como Último Rescoldo: pega más fuerte con poca vida).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Cuerno Voltio | Ofensivo | Etapa 1 | Físico, potencia 40; 10 % de paralizar. | Cuerno con chispa amarilla que embiste. |
| F1 C2 | Gola Escudo | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de paralizar a quien golpee de cerca. | Gola de cristal desplegada como escudo con arcos eléctricos. |
| F1 C3 | Carga Cristal | Apoyo | Etapas 1 y 2 | Sube Defensa. | Cristales azules que se cargan de energía, sobre quien lo usa. |
| F1 C4 | Estampida Voltaica | Final | Etapas 1 a 3 | Físico, potencia 85. | Polvareda con rayos y huellas, en grande sobre el rival. |
| F2 C1 | Tricuerno Eléctrico | Ofensivo | Etapas 2 a 4 | Físico, potencia 55; 20 % de paralizar. | Tres cuernos eléctricos que impactan en abanico. |
| F2 C2 | Gola Tormenta | Apoyo | Etapas 3 y 4 | Sube Defensa; sube Ataque. | Gola con rayos y flechas hacia arriba. |
| F2 C3 | Embestida Eterna | Final | Etapa 4 | Físico, potencia 110. | Embestida de energía cristalina, en grande sobre el rival. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Trueno Cretácico | Rayo que cae sobre un cristal y estalla | Tricegigapix con la gola cargada bajo una tormenta de cristales |

### 37. Tyrannosaurus (Rexpix → Rexgigapix)

Pasiva: **Rugido Fósil** (como Último Rescoldo: pega más fuerte con poca vida).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Mordida Volcánica | Ofensivo | Etapa 1 | Físico, potencia 40; 10 % de quemar. | Mandíbula con brasas que se cierra sobre el rival. |
| F1 C2 | Piel de Basalto | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de quemar a quien golpee de cerca. | Piel de basalto agrietada con lava brillando, como escudo. |
| F1 C3 | Rugido Tirano | Apoyo | Etapas 1 y 2 | Baja Ataque rival. | Rugido en ondas rojas hacia el rival. |
| F1 C4 | Erupción Rex | Final | Etapas 1 a 3 | Físico, potencia 85. | Erupción de lava desde el suelo, en grande sobre el rival. |
| F2 C1 | Mandíbula de Magma | Ofensivo | Etapas 2 a 4 | Físico, potencia 55; 20 % de quemar. | Mandíbula de magma con chorreaduras naranjas. |
| F2 C2 | Rugido Cretácico | Apoyo | Etapas 3 y 4 | Baja Ataque rival; sube Ataque. | Rugido con ondas y flechas rojas hacia arriba. |
| F2 C3 | Cataclismo Ígneo | Final | Etapa 4 | Físico, potencia 110. | Anillo de fuego que explota alrededor del rival, en grande. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Meteoro Final | Meteoro de fuego que cae y explota | Rexgigapix rugiendo mientras cae un meteoro sobre el volcán |

### 38. Dimetrodon (Dimepix → Dimegigapix)

Pasiva: **Vela Umbría** (como Raíces: recupera un poco de vida cada turno).

| Pos. | Ataque | Clase | Quién lo usa | Qué hace | Idea visual |
| --- | --- | --- | --- | --- | --- |
| F1 C1 | Mirada Pérmica | Ofensivo | Etapa 1 | Especial, potencia 40; 10 % de dormir. | Ojos violetas que destellan con una onda de sueño. |
| F1 C2 | Velo Fósil | Defensivo | Toda la línea | Reduce el daño 60 %; 30 % de envenenar a quien golpee de cerca. | Velo de sombra con fósiles marcados alrededor de quien lo usa. |
| F1 C3 | Vela Sombría | Apoyo | Etapas 1 y 2 | Sube Ataque Especial. | Vela dorsal violeta que brilla, sobre quien lo usa. |
| F1 C4 | Pulso Pérmico | Final | Etapas 1 a 3 | Especial, potencia 85. | Pulso de energía oscura en ondas, en grande sobre el rival. |
| F2 C1 | Ojo del Abismo | Ofensivo | Etapas 2 a 4 | Especial, potencia 55; 15 % de dormir. | Ojo gigante del abismo que se abre sobre el rival. |
| F2 C2 | Vela Estelar | Apoyo | Etapas 3 y 4 | Sube Ataque Especial; sube Velocidad. | Vela con estrellas y flechas hacia arriba. |
| F2 C3 | Noche Primigenia | Final | Etapa 4 | Especial, potencia 110. | Noche con estrellas que cae sobre el rival, en grande. |

| Definitivo | Impacto (128) | Pantalla (240×160) |
| --- | --- | --- |
| Eclipse Fósil | Eclipse negro con anillo violeta | Dimegigapix con la vela convertida en un cielo estrellado |

## Efectos nuevos para el juego

Estas animaciones hoy no existen o están hechas con cuadraditos por código. Todas son tiras horizontales de cuadros del mismo tamaño, con fondo transparente. Están ordenadas por impacto dentro de cada grupo.

### Mina

| Archivo | Cuadros × tamaño | Qué es |
| --- | --- | --- |
| `mina_pico.png` | 3 × 16×16 | Pico genérico junto a la criatura: alzado, golpe y rebote. Dibujado hacia abajo; se gira para los costados |
| `mina_explosion.png` | 6 × 48×48 | Explosión de bomba que cubre 3×3 bloques |
| `mina_gas.png` | 4 × 16×16 | Nube verdosa en bucle donde estaba el bloque de gas |
| `mina_polvo.png` | 3 × 16×8 | Polvo bajo los pies al aterrizar o al caer una roca |
| `mina_destello.png` | 4 × 8×8 | Estrellita sobre monedas, gemas y cofres, y al juntarlos |
| `mina_vapor.png` | 4 × 16×16 | Vapor cuando la lava se enfría y queda piedra |
| `huevo_eclosion.png` | 4 × 32×32 | Huevo que tiembla, se raja y se abre. Puede ser uno genérico o uno por familia (`huevo_eclosion_tirin.png`) |

### Cronoportal

| Archivo | Cuadros × tamaño | Qué es |
| --- | --- | --- |
| `crono_portal.png` | 4 × 64×64 | Portal en bucle: anillo de piedra con engranajes y un remolino azul y dorado |
| `crono_viaje.png` | 6 × 240×160 | Transición al viajar: espiral de relojes y ámbar que llena la pantalla |
| `crono_marea.png` | 4 × 240×40 | Regla Marea: borde de agua que sube por la parte inferior del combate |
| `crono_esporas.png` | 4 × 16×16 | Regla Esporas: nube de esporas que cae sobre la criatura afectada |
| `crono_estampida.png` | 2 × 96×48 | Regla Estampida: siluetas de manada corriendo (cruza la pantalla de lado a lado) |
| `crono_meteoro.png` | 3 × 24×24 | Regla Meteoro: meteoro en caída con estela |
| `crono_meteoro_impacto.png` | 5 × 96×96 | Impacto del meteoro sobre el campo |
| `crono_escarcha.png` | 3 × 32×32 | Regla Frío: escarcha que cubre a la criatura de a poco |
| `crono_revivir.png` | 5 × 48×48 | Laboratorio: fósil que brilla, se rompe en luz y deja la cría |
| `mapa_combate.png`, `mapa_excavacion.png`, `mapa_evento.png`, `mapa_fogata.png`, `mapa_jefe.png` | 1 × 16×16 cada uno | Íconos del camino de la expedición |
| `mapa_visitado.png` | 1 × 16×16 | Marca de paso ya recorrido (huella o punto apagado) |

### Combate y menús (cualquier modo)

| Archivo | Cuadros × tamaño | Qué es |
| --- | --- | --- |
| `fx_subir_nivel.png` | 6 × 48×48 | Columna de luz con flechas al subir de nivel |
| `fx_evolucion.png` | 8 × 96×96 | Capullo de luz que gira y estalla al evolucionar (la criatura se cambia por debajo) |
| `fx_critico.png` | 4 × 32×32 | Estrella de impacto para los golpes críticos |
| `fx_golpe_justo.png` | 4 × 48×48 | Anillo dorado cuando se acierta el Golpe justo |
| `fx_brillante.png` | 6 × 32×32 | Destellos al aparecer una criatura brillante |
| `fx_sobre_rara.png` | 6 × 96×96 | Rayos de luz detrás de una carta Rara o Épica al abrir sobres |
| `fx_insignia.png` | 5 × 48×48 | Insignia que gira y brilla al ganarla contra un jefe |
| `fx_confeti.png` | 4 × 8×8 | Confeti para celebraciones (récords, premios, misiones) |

### Íconos y medallas que faltan

- `medalla_jefes_1.png`, `medalla_jefes_2.png`, `medalla_jefes_3.png` y `medalla_jefes_bloqueada.png`: medalla Cazajefes, mismo tamaño que las otras medallas.
- `medalla_mina_1..3.png` y `medalla_crono_1..3.png` (con su versión `_bloqueada`): medallas nuevas para la Mina (zonas vencidas) y el Cronoportal (eras vencidas).
- `item_huevo.png`: huevo genérico para mostrar en la bolsa los huevos que incuban.

## Lista de entrega

Se puede entregar por partes y en cualquier orden; cada bloque funciona solo. El orden sugerido es el de la lista.

- [ ] Cronoportal: 5 familias (39 a 43), con frente, espalda e ícono por etapa
- [ ] Cronoportal: 5 fondos de combate (`crono_era1..5.png`, 960×455)
- [ ] Cronoportal: 5 fósiles y el ámbar (16×16)
- [ ] Cronoportal: portal animado e íconos del mapa
- [ ] Cronoportal: efectos de ataque, láminas `39_ataques.png` a `43_ataques.png` y `39_definitivos.png` a `43_definitivos.png`
- [ ] Mina: efectos de ataque, láminas `34_ataques.png` a `38_ataques.png` y `34_definitivos.png` a `38_definitivos.png`
- [ ] Mina: pico, explosión, gas, polvo, destello, vapor y eclosión
- [ ] Cronoportal: efectos de las reglas de cada era, transición de viaje y animación de revivir
- [ ] Combate y menús: subir de nivel, evolución, crítico, golpe justo, brillante, sobre raro, insignia y confeti
- [ ] Medallas e íconos que faltan
- [ ] Opcional: fondos del mapa (`crono_mapa1..5.png`) y sala del portal (`crono_sala.png`)

Mientras tanto construyo el Cronoportal con arte provisorio y conecto cada pieza a medida que llega.
