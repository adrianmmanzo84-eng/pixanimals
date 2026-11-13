# PIXANIMALS

Juego web de colección y combate por turnos: criaturas y efectos en pixel art sobre fondos de estilo animado. Nombre de trabajo.

**Estado: Fase 5 terminada + ataques por evolución y Ataque Definitivo – Torre de Desafíos, Entrenador del día, amuletos, música chiptune, velocidad ×2 y combates de equipo más cortos. Antes: minijuegos, premio diario, misiones, tienda, evolución, 13 familias (65 criaturas) y 7 tipos.**

## Ejecutar

```bash
npm install && npm run dev
```

Abre la dirección que muestra la terminal (normalmente http://localhost:5173). Para probar en el móvil dentro de la misma wifi: `npm run dev -- --host`.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Juego en modo desarrollo, con recarga automática |
| `npm test` | Pruebas automáticas de combate, equipos, sobres, pity, experiencia, guardado, ítems, tienda, evolución, premios, minijuegos, premio diario y misiones |
| `npm run simular` | 10.000 combates IA contra IA por cruce (1 vs 1 y 3 vs 3); imprime la tabla de balance |
| `npm run simular -- 3000 experta etapas` | Balance de las etapas 2 a 4 y cuánto vale evolucionar |
| `npm run ajustar` | Ventaja de tipo en cada etapa entre las 3 familias originales (para probar repartos de stats con la variable `AJUSTE`) |
| `npm run familias` | Cada familia contra todas, en la etapa 1 y en la final, más cada Eclipse contra su forma normal |
| `npm run validar` | Revisa los JSON y que cada criatura tenga sus sprites correctos |
| `npm run placeholders` | Regenera los sprites placeholder |
| `npm run build` | Versión optimizada en `dist/`, lista para subir a un hosting estático |

## Controles

- Teclado: flechas para moverse, **Z** o **Enter** para aceptar, **X** para volver.
- Móvil: cruceta y botones A/B en pantalla. Tocar la pantalla del juego también avanza el texto.
- Barra de arriba a la derecha: velocidad de los combates (×1/×2), volumen de música y de efectos, y silencio.

## Cómo está organizado

```
src/
  core/        Reglas del juego en TypeScript puro (sin Phaser). Se prueban y simulan en Node.
    combate/   formulas.ts (única fuente de las fórmulas), motor.ts, ia.ts, rival.ts
    sobres/    tiradas de rareza, pity, sobre gratis, repetidas
    progresion/ experiencia, recompensas, evolución y Entrenamiento, carta premio, premio diario, misiones
    minijuegos/ premios y límites de los minijuegos
    items/     Bolsa, tienda con ofertas del día, uso de ítems
    estado/    partida del jugador y guardado (interfaz Almacen)
  data/        TODO el contenido y el balance: criaturas, habilidades, tipos, balance, sobres, economia, items
  esquemas/    Validación de cada JSON y de la partida guardada
  escenas/     Arranque, Menu, Sobres, Tienda, BolsaEscena, Equipo (Mis criaturas), Bestiario, Combate, Premio, Minijuegos, Misiones
  escenas/minijuegos/  Base común y los 3 minijuegos (Bayas, Eco, Golpe)
  ui/          Texto, ventanas, fondos pintados por código, efectos de ataque, panel de guardado
  audio/       Efectos sintetizados con Web Audio
  i18n/        Textos en español (un archivo por idioma)
scripts/       validar, simular, generar-placeholders, importar_arte.py
tests/         Pruebas con Vitest
docs/          GDD, DECISIONES, BALANCE, GUIA_SPRITES, LICENCIAS
public/sprites Sprites de las criaturas (arte del autor, convertido)
public/fondos  Paisajes de combate
arte/originales Hojas de arte tal como se entregaron
```

Regla de arquitectura: `core/` nunca importa nada de `escenas/` ni de Phaser.

## Agregar o cambiar contenido sin tocar código

- **Números de balance:** `src/data/balance.json`. **Sobres y probabilidades:** `src/data/sobres.json`. **Recompensas y experiencia:** `src/data/economia.json`.
- **Una habilidad:** una entrada en `src/data/habilidades.json`. Su descripción en pantalla se genera sola a partir de sus efectos. El campo `animacion` elige el efecto visual (lista en `src/esquemas/esquemas.ts`).
- **Una criatura o familia:** entradas en `src/data/criaturas.json` y sus sprites (pasos en `docs/GUIA_SPRITES.md`).
- **Un ítem:** una entrada en `src/data/items.json` (efecto, precio, color del icono). Las ofertas del día y la carta premio (`economia.json`) lo toman solos.
- **Arte nuevo:** deja las hojas en `arte/originales/` y ejecuta `python3 scripts/importar_arte.py`.
- **Efectos de ataque:** deja los PNG en `arte/originales/efectos/` y ejecuta `python3 scripts/importar_efectos.py`.
- Después, `npm run validar`.

## Documentación

- `docs/GDD.md` – diseño del juego.
- `docs/DECISIONES.md` – decisiones tomadas y por qué.
- `docs/BALANCE.md` – tablas de balance y resultados de la simulación.
- `docs/GUIA_SPRITES.md` – formato de entrega de sprites.
