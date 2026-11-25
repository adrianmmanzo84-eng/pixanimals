# Guía de publicación en Google Play

Versión 1: descarga **gratuita**, sin anuncios, para mayores de 13 años (D281), con **compras opcionales de monedas y cristales** (diseño D246). Todo lo que está en `tienda/` (ícono, imagen destacada, 8 capturas, textos) ya está listo para subir.

Lo que **solo puedes hacer tú** (pide tu identidad, un pago o una llave secreta) está marcado con 👤. Lo demás ya lo dejé hecho o lo hago yo.

## 0. Qué completar antes de nada

| Dato | Dónde va | Estado |
| --- | --- | --- |
| Nombre del desarrollador | **LiSaDm** (ya puesto en `public/privacidad.html` y `public/privacy.html`) | listo |
| Correo de contacto público | **adrianmmanzo84@gmail.com** (ya puesto en las políticas; usar el mismo en Play Console) | listo |
| Nombre del paquete | **`com.pixanimals.juego`** confirmado por el autor | listo |
| Compras dentro del juego | **implementadas (D277)** con Google Play Billing; los 7 productos están creados y activos en Play Console (25-nov-2026); falta probarlas con cuentas de prueba con licencia (sección 4.4 bis) | probar |

El flujo «Paquete para la tienda» **se niega a generar el AAB real** mientras la política conserve marcadores pendientes (`NOMBRE_PENDIENTE`, `CORREO_PENDIENTE` o `COMPRAS_NO_IMPLEMENTADAS`). Ya no queda ninguno.

## 1. Cuenta de desarrollador 👤

1. Entra en <https://play.google.com/console/signup> con la cuenta de Google que quieras usar para el juego.
2. Elige **cuenta personal**, paga US$25 (una sola vez) y verifica tu identidad (documento y teléfono).
3. Importante: si la cuenta se crea después del 13-nov-2023, Google exige una **prueba cerrada con 12 testers durante 14 días seguidos** antes de dejarte publicar (ver paso 6).

## 2. Llave de subida 👤

Es la firma con la que subes versiones. **Nunca** va al repositorio. Con *Play App Signing* (se activa solo), Google guarda la llave final y, si pierdes esta, puede restablecerse.

En Windows hace falta `keytool` (viene con Android Studio o con cualquier JDK). En una terminal:

```
keytool -genkeypair -v -keystore subida.keystore -alias subida -keyalg RSA -keysize 2048 -validity 10000
```

Te pedirá una contraseña y tus datos. **Guarda `subida.keystore` y las contraseñas** en dos sitios seguros (por ejemplo, tu gestor de contraseñas y un USB).

Luego crea 4 *secrets* en GitHub (repositorio → Settings → Secrets and variables → Actions → New repository secret):

| Nombre | Valor |
| --- | --- |
| `PIX_KEYSTORE_B64` | el archivo en base64. En Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("subida.keystore"))` |
| `PIX_KEYSTORE_PASS` | la contraseña del archivo |
| `PIX_KEY_ALIAS` | `subida` |
| `PIX_KEY_PASS` | la contraseña de la llave (la misma si no pusiste otra) |

## 3. Generar el AAB

Repositorio → **Actions** → **Paquete para la tienda** → **Run workflow**. Al terminar (unos 2 minutos), en la página de la ejecución, sección *Artifacts*, baja `pixanimals-<versión>.aab`.

- Sin los 4 secretos: genera `…-VERIFICACION.aab` con una llave temporal. Sirve para comprobar que compila, **no** se sube a Play. (Ya se probó: compila, 77 MB, firma válida.)
- Cada subida a Play necesita un `versionCode` mayor. Se calcula solo desde la versión de `package.json`: sube la versión (por ejemplo 0.45.0 → 0.46.0) antes de cada nuevo paquete.

## 4. Crear la app en Play Console 👤

**Todas las apps → Crear app**: nombre PIXANIMALS, idioma predeterminado español (Latinoamérica), tipo *Juego*, *Gratis*. Acepta las declaraciones.

Después, en **Panel → Configurar tu app**, completa en este orden:

### 4.1 Política de privacidad
URL: `https://adrianmmanzo84-eng.github.io/pixanimals/privacidad.html`
(la versión en inglés es `privacy.html`). Antes de pegarla, comprueba que ya tiene tu nombre y tu correo.

### 4.2 Acceso a la app
«Todas las funciones están disponibles sin ninguna restricción» (no hay cuentas ni contraseñas).

### 4.3 Anuncios
**No**, la app no contiene anuncios.

### 4.4 Público objetivo y contenido
- Grupos de edad: **solo 13–15, 16–17 y 18+** (D281). El resultado de la clasificación (ESRB por las compras con objetos aleatorios) impide declarar menores de 13 años, y Play rechaza esa combinación. Por eso no se aplica la política de Familias.
- «¿La app atrae involuntariamente a niños?»: el estilo pixel art y las criaturas pueden atraerlos; si Google lo pregunta, responde con honestidad. La app sigue sin anuncios, sin datos personales y sin chat.

### 4.4 bis Compras dentro de la aplicación (D277)
El juego usa Google Play Billing (plugin `PixBilling`). En **Contenido de la app → Anuncios**: sin anuncios; las compras no se declaran ahí. Pasos 👤:

1. **Perfil de pagos** — ✅ hecho (identidad verificada el 25-nov-2026). Pendiente 👤: registrarse en la cuota de servicio del 15 % (grupo de cuentas y aceptar términos). Argentina cobra por transferencia en USD, mínimo US$100 por pago.
2. ✅ AAB 0.50.1 (versionCode 50001) subido a la prueba cerrada «Prueba cerrada - Alpha» (los productos solo se pueden crear con la app ya subida y con la librería de Billing dentro; este AAB ya la tiene).
3. ✅ **Monetizar → Productos → Productos únicos** (antes «Productos integrados en la aplicación»): los 7 creados y activos el 25-nov-2026 con opción de compra `comprar`, en 174 países. Son estos, con **exactamente estos identificadores** (no se pueden cambiar después) y activarlos. Precio base en dólares; Google lo convierte a cada país.

| Identificador | Nombre en Play | Precio base | Tipo |
|---|---|---|---|
| `monedas_1200` | 1.200 monedas | US$ 0,99 | consumible (se compra muchas veces) |
| `monedas_6600` | 6.600 monedas | US$ 4,99 | consumible |
| `monedas_14400` | 14.400 monedas | US$ 9,99 | consumible |
| `cristales_300` | 300 Cristales | US$ 0,99 | consumible |
| `cristales_1650` | 1.650 Cristales | US$ 4,99 | consumible |
| `cristales_3600` | 3.600 Cristales | US$ 9,99 | consumible |
| `bienvenida` | Pack de bienvenida | US$ 2,99 | compra única (una vez por cuenta) |

   El juego trata todos como productos de pago único: «consume» los seis primeros al entregarlos (para poder volver a comprarlos) y «reconoce» el pack. Si dejas uno sin activar, ese producto aparece sin precio y no se puede comprar.
4. **Cuentas de prueba con licencia** (Configuración → Pruebas de licencia): agrega los correos de Google de los testers; con ellos las compras no cobran. Prueba en la app instalada **desde la pista de prueba** (un APK instalado a mano no puede cobrar: usa compra simulada).
5. En **Seguridad de los datos**: las compras las procesa Google Play. El juego no recoge ni envía datos de pago; el historial de compras queda solo en el dispositivo. Declara «Compras» si el formulario lo pide como dato manejado por Google Play.
6. **Clasificación (IARC)** — ✅ hecha: «compras digitales» y «objetos aleatorios» marcados.

**Cómo se prueba cada cosa.** Web y versiones de prueba (APK `android-prueba`): la compra es **simulada** y lo dice en pantalla («COMPRA DE PRUEBA · no se cobra nada»). Compra real: solo con la app instalada desde Google Play. Qué comprobar con testers: comprar un paquete y ver que se suman; cancelar en la ventana de Google (no se suma ni se cuenta); cerrar la app justo después de pagar y reabrirla (debe entregarse una sola vez); comprar el pack dos veces (la segunda se frena); comprar 5 veces y ver el límite diario.

**Límite conocido.** El juego guarda la partida en el propio dispositivo y no tiene servidor: un jugador con conocimientos podría alterar sus monedas, y si desinstala el juego sin copia pierde lo comprado (la política lo dice). Es normal en juegos sin cuenta; si algún día se agrega nube o ranking, habrá que validar las compras en un servidor.

### 4.5 Clasificación de contenido (cuestionario IARC)
Respuestas coherentes con el juego:

| Pregunta | Respuesta |
| --- | --- |
| Categoría | Juego |
| Violencia | Sí, **violencia de fantasía** leve: criaturas de caricatura que combaten; sin sangre ni daño realista |
| Sangre / gore | No |
| Contenido sexual / desnudez | No |
| Lenguaje soez | No |
| Sustancias (drogas, alcohol, tabaco) | No |
| Juegos de azar simulados o con dinero | No (no hay apuestas; los sobres no pagan dinero ni premios reales) |
| Interacción entre usuarios / chat | No |
| Comparte ubicación | No |
| Compras de bienes digitales | **Sí**: monedas y cristales (moneda virtual), sin valor monetario |
| Elementos aleatorios | Sí: sobres de criaturas (con probabilidades visibles antes de abrir) |
| Intercambio de objetos entre usuarios | No |

**Resultado real (25-nov-2026):** Brasil +18 y Australia «Adultos» (M), por las compras de objetos aleatorios; ESRB deja la audiencia en 13+. Se respondió «Sí» a compras digitales y a elementos aleatorios, y «No» a intercambio entre usuarios. Los textos de la ficha lo mencionan (ver `tienda/textos.md`).

### 4.6 Seguridad de los datos
- ¿Recoge o comparte datos de usuario? **No**.
- La app no envía datos a ningún servidor. Las preguntas de cifrado y de borrado pueden quedar como «no aplica».
- Si pregunta por la copia de seguridad de Android: los datos de la app pueden entrar en la copia de seguridad de la cuenta de Google del propio usuario (la gestiona Google).

### 4.7 Otras declaraciones
Aplicación de noticias: no. Aplicación gubernamental: no. Finanzas: no. Salud: no. ID de publicidad: **no se usa** (marca «No»).

### 4.8 Ficha de Play Store
- Textos: `tienda/textos.md` (español e inglés, con los límites de caracteres).
- Ícono: `tienda/icono-512.png`.
- Imagen destacada: `tienda/imagen-destacada-1024x500.png`.
- Capturas de teléfono (mínimo 2, hay 8; subidas 7, falta `02_combate_efecto.png`): `tienda/capturas-es/`. Son horizontales 3:2 (1440×961).
- Estado (25-nov-2026): ícono, imagen destacada (1024×500) y textos subidos.
- Categoría: Juegos → Aventura.
- Correo de contacto: el tuyo (el mismo de la política).

## 5. Qué NO hacer

- No subir el AAB de verificación a Play.
- No poner la llave de subida ni sus contraseñas en el repositorio ni en el chat.
- Las compras reales solo se prueban con la app instalada desde Google Play y cuentas de prueba con licencia.

## 6. Prueba cerrada (cuenta personal nueva) 👤

1. ✅ Pista «Prueba cerrada - Alpha» creada.
2. ✅ AAB firmado 0.50.1 subido y enviado a revisión (notas con etiquetas `<es-419>…</es-419>`, 178 países).
3. ✅ Grupo de Google de testers configurado. Falta reclutar a los 12+. Crea una lista de testers (correos de Gmail o un Grupo de Google) con **al menos 12 personas**, mejor 15–20.
4. Copia el **enlace de participación** y mándalo. Cada tester debe abrirlo con su cuenta, aceptar y **instalar el juego desde Play**. Tiene que seguir apuntado 14 días seguidos.
5. Pasados los 14 días con 12 testers: Panel → **Solicitar acceso a producción** y contestar el cuestionario (cómo probaste, qué cambió, si está listo).
6. Cuando Google lo apruebe: **Producción → Crear versión**, sube el mismo AAB (o uno más nuevo) y publica. Recomendado: lanzamiento gradual (por ejemplo 20 % la primera semana).

## 7. Lista final antes de enviar a revisión

- [x] Los 7 productos creados y activos en Play Console
- [ ] Compras probadas con cuentas de prueba con licencia (ver `docs/PRUEBAS_COMPRAS.md`)
- [ ] La política abre en el navegador (https://adrianmmanzo84-eng.github.io/pixanimals/privacidad.html)
- [ ] Probado el APK en un teléfono real (rendimiento, controles, audio)
- [ ] Música y sonidos aprobados
- [ ] Paquete confirmado (`com.pixanimals.juego` u otro)
- [ ] AAB firmado con la llave de subida real
- [ ] Ficha completa en español e inglés con las 8 capturas (falta la 02 y la ficha en inglés)
- [x] Cuestionarios de clasificación, público objetivo y contenido de la app completados
- [ ] Registro en la cuota de servicio del 15 %
- [ ] Prueba cerrada con 12 testers durante 14 días
