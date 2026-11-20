# Revisión previa al lanzamiento (v0.45.0, 20-nov-2026)

Revisión del juego completo, del paquete Android y de los pagos, antes de publicar en Google Play.

## 1. Resultado en una línea

El juego en sí está sano y se puede jugar de punta a punta. Para publicar faltan **seis cosas que no son del código** (cuenta, política de privacidad, firma, clasificación, ficha de la tienda, nombre/derechos) y **los pagos no existen todavía**.

## 2. Lo que está bien (comprobado)

| Área | Cómo se comprobó | Resultado |
| --- | --- | --- |
| Código | `tsc`, 264 tests, `validar`, `build` | todo pasa |
| Recorrido de una partida nueva | navegador real: título → 4 ilustraciones → elección de 3 compañeros → menú | termina con equipo de 3 y `bienvenida` activa |
| Escenas | 23 escenas arrancadas una por una | 0 errores de consola, 0 peticiones fallidas |
| Combate completo | partida real por la interfaz (rápido) | avanza turno a turno y termina en victoria; sin cuelgues |
| Guardado | guardar, recargar la página, comparar equipo/monedas/criaturas | idéntico |
| Traducciones | es / en | 851 claves en cada una, ninguna sin traducir |
| Red | búsqueda de `fetch`, `XMLHttpRequest`, URLs en el código | el juego no hace ninguna conexión: funciona sin internet |
| Android | CI de GitHub (compilación del APK) | verde en cada publicación |
| Nivel de API | `targetSdk` 36 | cumple lo que Google Play exige desde el 31-ago-2026 |
| Orientación | horizontal fija, pantalla completa | correcto |
| Probabilidades de sobres | pantalla de Sobres | se muestran siempre (Google lo exige antes de comprar objetos al azar) |
| Balance de la historia | simulación (D273) | curva 80 / 65 / 50 / 45 % |

## 3. Lo que NO se pudo comprobar

- **Un teléfono real.** Nunca se ha probado el APK en un móvil de verdad: rendimiento en gama baja, controles táctiles, batería, audio. Es la mayor incógnita.
- **El sonido.** No se puede oír desde aquí; el oído final es del autor.
- **Ritmo de experiencia.** Falta medir cuánto se tarda en subir de nivel para llegar a cada región.

## 4. Pagos (monedas / gemas)

**Veredicto: no hay nada implementado.**

- No existe ninguna librería de compras en el proyecto (ni Google Play Billing ni RevenueCat), ninguna pantalla de compra de dinero real, ni productos definidos.
- Solo existe el **diseño aprobado en D246**: monedas 1.200 / 6.600 / 14.400 (US$0,99 / 4,99 / 9,99), gemas 300 / 1.650 / 3.600, pack de bienvenida US$2,99, puerta para adultos, máximo 5 compras al día, probabilidades visibles, historial de compras.
- La pantalla de título dice hoy «Gratis · sin compras · sin registros» y un comentario del código dice «nada se compra con dinero real»: habría que cambiarlos al activar compras.
- **Desajuste de nombres:** D246 habla de «gemas», el juego tiene **Esencia** y no existe nada llamado «Cristal». Hay que decidir cómo se llama la moneda premium y qué compra.

Qué haría falta para tenerlas (orden de trabajo):
1. Decidir nombre y uso de la moneda premium (¿es la Esencia actual o una nueva?).
2. Elegir librería: **RevenueCat** (como diseñó D246) o **Google Play Billing directo** con un plugin de Capacitor. RevenueCat añade un servicio de terceros: hay que declararlo en la política de privacidad y en «Seguridad de los datos», y comprobar si es compatible con la política de Familias si el juego se declara apto para niños.
3. Pantalla de compra, puerta para adultos, límite diario, historial y textos de probabilidades junto al botón de comprar.
4. En Play Console: perfil de pagos del vendedor, productos «consumibles», cuentas de prueba con licencia.
5. Marcar la compra como consumida/reconocida (si no, Google la reembolsa a los 3 días) y manejar compras pendientes y reembolsos.
6. Probar con cuentas de prueba reales: la compra simulada de los APK de prueba **no prueba** el cobro real.

**Limitación de fondo:** el juego es 100 % sin conexión y la partida vive en el teléfono. Sin servidor propio, quien tenga un teléfono modificado podría falsificar su saldo. Es habitual aceptarlo en un juego individual sin ranking ni intercambios; conviene asumirlo de forma consciente.

## 5. Para publicar: pendientes por prioridad

### Bloqueantes (sin esto no se puede subir)

| # | Pendiente | Detalle |
| --- | --- | --- |
| 1 | Cuenta de desarrollador de Google Play | US$25 una vez. Si es **cuenta personal creada después del 13-nov-2023**, Google exige una **prueba cerrada con 12 testers durante 14 días seguidos** antes de pedir el acceso a producción (cuenta de organización: exenta). Cuenta ≈ 3 semanas hasta publicar. |
| 2 | Firma y paquete AAB | Google Play pide un **AAB** firmado. Hoy el CI solo genera un APK de prueba y el tipo `release` no tiene firma. Hay que crear la llave de subida (que **nunca** va al repositorio) y añadir la compilación del AAB al CI con secretos. |
| 3 | Política de privacidad | No existe. Es obligatoria (y para «Público objetivo»). Puede alojarse en la web del juego (GitHub Pages). Debe decir con verdad qué datos se guardan (solo la partida, en el teléfono) y, si hay compras, qué servicio las procesa. |
| 4 | Público objetivo y clasificación | Declarar edades. El juego es para todas las edades incluidos menores: si se incluye a menores de 13, aplica la **política de Familias** (política de privacidad obligatoria, SDK sin datos personales de niños, compras con puerta para adultos). Google puede considerar que el estilo atrae a niños aunque se declare otra cosa. Además, **no se aceptan apps sin clasificación de contenido** (cuestionario IARC). |
| 5 | Nombre del paquete | `com.pixanimals.juego` es provisorio y **no se puede cambiar después de publicar**. Confirmar o cambiar antes de subir. |
| 6 | Ficha de la tienda | No existe ningún material: ícono 512×512, imagen destacada 1024×500, mínimo 2 capturas horizontales, descripción corta y larga (es/en), categoría, correo de contacto. Las capturas y la imagen las puedo generar yo. |

### Recomendado revisar con un profesional antes de vender

- **Nombre «PIXANIMALS»:** buscar marcas registradas parecidas en las clases de videojuegos (no se ha hecho).
- **Parecido con otros juegos:** el sistema de tipos, evoluciones y criaturas coleccionables recuerda a otros títulos conocidos. Las criaturas y los textos son originales, pero conviene una revisión legal.
- **Origen del arte:** `docs/LICENCIAS.md` dice «todo original», pero las 14 ilustraciones del relato se hicieron con un generador de imágenes con IA. Hay que confirmar los términos de uso comerciales de esa herramienta y dejar el origen documentado.
- **Librerías:** `LICENCIAS.md` no menciona Capacitor (MIT/Apache); conviene completarlo.

### Mejoras de calidad (no bloquean)

| # | Hallazgo | Riesgo |
| --- | --- | --- |
| a | La música no se pausa cuando la app pasa a segundo plano (no hay escucha del ciclo de vida de la app). | Medio: puede seguir sonando con la pantalla apagada. Arreglo pequeño. |
| b | `?prueba` y `?diag` existen en la versión web. En la app de Android no se pueden usar (no hay barra de direcciones). | Bajo. Conviene desactivarlos en la versión de tienda. |
| c | `allowBackup="true"`: la partida entra en la copia de seguridad de Google. | Es intencional (D245); declararlo en «Seguridad de los datos». |
| d | Peso: 75 MB de recursos (35 MB de efectos). | Bajo, entra holgado en un AAB; probar tiempo de carga en gama baja. |
| e | Las canciones antiguas siguen siendo de 4 compases (~8 s). | Fatiga auditiva; se puede alargar. |
| f | El proyecto de Claude (`estado-del-proyecto.md`) quedó en la v0.34.0. | Documentación. |

## 6. Orden recomendado

1. Probar el APK en un teléfono real (rendimiento, controles, audio) y aprobar música y sonidos.
2. Decidir: ¿primera versión **sin compras** y compras en una actualización, o compras desde el día uno?
3. En paralelo: crear la cuenta de Play (empieza el reloj de las 2 semanas de prueba), política de privacidad, nombre y marca, ficha.
4. AAB firmado y prueba cerrada con 12 testers.
5. Producción.

## Fuentes

- Requisitos de prueba para cuentas personales nuevas: https://support.google.com/googleplay/android-developer/answer/14151465
- Nivel de API objetivo: https://support.google.com/googleplay/android-developer/answer/11926878
- Política de pagos y probabilidades de objetos al azar: https://support.google.com/googleplay/android-developer/answer/9858738
- Política de Familias y público objetivo: https://support.google.com/googleplay/android-developer/answer/9893335
- Verificación de desarrolladores de Android: https://android-developers.googleblog.com/2026/06/android-developer-verification.html
