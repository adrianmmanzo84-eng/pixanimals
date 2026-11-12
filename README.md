# PIXANIMALS

Juego web de colección y combate por turnos: criaturas y efectos en pixel art sobre fondos de estilo animado. Nombre de trabajo.

**Estado: Fase 2 terminada – equipos de 3, sobres, Bestiario, experiencia y guardado.**

## Ejecutar

```bash
npm install && npm run dev
```

Abre la dirección que muestra la terminal (normalmente http://localhost:5173). Para probar en el móvil dentro de la misma wifi: `npm run dev -- --host`.

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Juego en modo desarrollo, con recarga automática |
| `npm test` | Pruebas automáticas de combate, equipos, sobres, pity, experiencia y guardado |
| `npm run simular` | 10.000 combates IA contra IA por cruce (1 vs 1 y 3 vs 3); imprime la tabla de balance |
| `npm run validar` | Revisa los JSON y que cada criatura tenga sus sprites correctos |
| `npm run placeholders` | Regenera los sprites placeholder |
| `npm run build` | Versión optimizada en `dist/`, lista para subir a un hosting estático |

## Controles

- Teclado: flechas para moverse, **Z** o **Enter** para aceptar, **X** para volver.
- Móvil: cruceta y botones A/B en pantalla. Tocar la pantalla del juego también avanza el texto.
- Botón «Sonido» arriba a la derecha.

## Cómo está organizado

```
src/
  core/        Reglas del juego en TypeScript puro (sin Phaser). Se prueban y simulan en Node.
    combate/   formulas.ts (única fuente de las fórmulas), motor.ts, ia.ts, rival.ts
    sobres/    tiradas de rareza, pity, sobre gratis, repetidas
    progresion/ experiencia, niveles y recompensas
    estado/    partida del jugador y guardado (interfaz Almacen)
  data/        TODO el contenido y el balance: criaturas, habilidades, tipos, balance, sobres, economia
  esquemas/    Validación de cada JSON y de la partida guardada
  escenas/     Arranque, Menu, Sobres, Bestiario, Equipo, Combate (solo dibujan y animan)
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
- **Una criatura:** una entrada en `src/data/criaturas.json` y sus sprites (ver `docs/GUIA_SPRITES.md`).
- **Arte nuevo:** deja las hojas en `arte/originales/` y ejecuta `python3 scripts/importar_arte.py`.
- Después, `npm run validar`.

## Documentación

- `docs/GDD.md` – diseño del juego.
- `docs/DECISIONES.md` – decisiones tomadas y por qué.
- `docs/BALANCE.md` – tablas de balance y resultados de la simulación.
- `docs/GUIA_SPRITES.md` – formato de entrega de sprites.
