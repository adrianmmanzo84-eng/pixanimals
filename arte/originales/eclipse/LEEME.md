# Formas Eclipse pendientes

Diseños Eclipse del autor para familias que todavía no están en el juego (mantarraya, polilla, ajolote,
caracol, colibrí, pangolín, gecko, cangrejo, liebre y pulpo). `GUIA.md` y `prompts.json` son los del paquete original.

Las tres primeras (león, tiburón y oso) ya están integradas como `../brasa_4b.png`, `../marea_4b.png` y `../brote_4b.png`.

Cuando entre una familia nueva al juego (su hoja de 4 etapas como `<familia>.png`), su Eclipse se copia como
`../<familia>_4b.png` y se agrega su entrada en `src/data/criaturas.json` (ver `docs/GUIA_SPRITES.md`).
El importador ignora esta carpeta.
