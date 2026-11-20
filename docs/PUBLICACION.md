# Guía de publicación en Google Play

Versión 1: descarga **gratuita**, sin anuncios, para mayores de 7 años, con **compras opcionales de monedas y cristales** (diseño D246). Todo lo que está en `tienda/` (ícono, imagen destacada, 8 capturas, textos) ya está listo para subir.

Lo que **solo puedes hacer tú** (pide tu identidad, un pago o una llave secreta) está marcado con 👤. Lo demás ya lo dejé hecho o lo hago yo.

## 0. Qué completar antes de nada

| Dato | Dónde va | Estado |
| --- | --- | --- |
| Nombre del desarrollador | **LiSaDm** (ya puesto en `public/privacidad.html` y `public/privacy.html`) | listo |
| Correo de contacto público | **adrianmmanzo84@gmail.com** (ya puesto en las políticas; usar el mismo en Play Console) | listo |
| Nombre del paquete | **`com.pixanimals.juego`** confirmado por el autor | listo |
| Compras dentro del juego | la política ya las describe; **falta implementarlas** y borrar la marca `COMPRAS_NO_IMPLEMENTADAS` de las dos políticas | pendiente |

El flujo «Paquete para la tienda» **se niega a generar el AAB real** mientras la política conserve marcadores pendientes (`NOMBRE_PENDIENTE`, `CORREO_PENDIENTE` o `COMPRAS_NO_IMPLEMENTADAS`): así no se puede publicar una app cuya política promete compras que aún no existen.

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
- Grupos de edad: el juego es para mayores de 7 años. Play solo ofrece tramos fijos, y el que incluye a los 7 años es **6–8**. Marca **6–8, 9–12, 13–15, 16–17 y 18+**.
- Como incluye niños, Google aplica la **política de Familias**. Para esta versión se cumple sin trabajo extra: sin anuncios, sin datos personales, sin chat, sin permisos sensibles (el manifiesto solo declara internet), con política de privacidad.
- «¿La app atrae involuntariamente a niños?»: no aplica (ya los declaras).
- Si Google ofrece unirse a *Diseñado para la familia*, acepta.

### 4.4 bis Compras dentro de la aplicación
En **Contenido de la app → Anuncios**: sin anuncios. Las compras no se declaran ahí: se activan al subir un AAB con la librería de Google Play Billing y crear productos en **Monetizar → Productos → Productos integrados en la aplicación** (uno por paquete, de tipo *consumible*). Antes hace falta un **perfil de pagos** (datos fiscales y cuenta bancaria) 👤. Los precios se fijan en una moneda base y Google los convierte a cada país.

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
| Compras con dinero real | **Sí**: monedas y cristales (moneda virtual), sin valor monetario |
| Objetos aleatorios por compra | Sí: sobres de criaturas (con probabilidades visibles antes de abrir) |

El resultado esperable es una clasificación apta para niños (PEGI 7 / ESRB E10+ o similar). Si el cuestionario cambia de preguntas, responde con la misma lógica.

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
- Capturas de teléfono (mínimo 2, hay 8): `tienda/capturas-es/`. Son horizontales 3:2 (1440×961).
- Categoría: Juegos → Aventura.
- Correo de contacto: el tuyo (el mismo de la política).

## 5. Qué NO hacer

- No subir el AAB de verificación a Play.
- No poner la llave de subida ni sus contraseñas en el repositorio ni en el chat.
- No enviar a revisión mientras las compras no estén implementadas: la política y la ficha ya las anuncian.

## 6. Prueba cerrada (cuenta personal nueva) 👤

1. Play Console → **Pruebas → Pruebas cerradas → Crear pista** (por ejemplo «Amigos»).
2. Sube el AAB firmado (paso 3) como primera versión y rellena las notas.
3. Crea una lista de testers (correos de Gmail o un Grupo de Google) con **al menos 12 personas**, mejor 15–20.
4. Copia el **enlace de participación** y mándalo. Cada tester debe abrirlo con su cuenta, aceptar y **instalar el juego desde Play**. Tiene que seguir apuntado 14 días seguidos.
5. Pasados los 14 días con 12 testers: Panel → **Solicitar acceso a producción** y contestar el cuestionario (cómo probaste, qué cambió, si está listo).
6. Cuando Google lo apruebe: **Producción → Crear versión**, sube el mismo AAB (o uno más nuevo) y publica. Recomendado: lanzamiento gradual (por ejemplo 20 % la primera semana).

## 7. Lista final antes de enviar a revisión

- [ ] Compras implementadas, productos creados y probados con cuentas de prueba con licencia
- [ ] Marca `COMPRAS_NO_IMPLEMENTADAS` borrada de las dos políticas; la página abre en el navegador
- [ ] Probado el APK en un teléfono real (rendimiento, controles, audio)
- [ ] Música y sonidos aprobados
- [ ] Paquete confirmado (`com.pixanimals.juego` u otro)
- [ ] AAB firmado con la llave de subida real
- [ ] Ficha completa en español e inglés con las 8 capturas
- [ ] Cuestionarios de clasificación, público objetivo y seguridad de datos enviados
- [ ] Prueba cerrada con 12 testers durante 14 días
