# Pruebas de compras con Google Play

Objetivo: comprobar que los 7 productos (`monedas_1200`, `monedas_6600`, `monedas_14400`, `cristales_300`, `cristales_1650`, `cristales_3600`, `bienvenida`) se compran, se entregan una sola vez y no cobran dinero real durante las pruebas.

Pasos marcados con 👤 los haces tú (cuentas y aceptación de condiciones).

## 1. Cuentas de prueba con licencia 👤

1. Play Console (nivel de cuenta, no de app) → **Configuración → Pruebas de licencia**.
2. Agrega los correos de Gmail de quienes van a probar (el tuyo incluido).
3. En **Respuesta de licencia** deja *RESPOND_NORMALLY*.
4. Guarda. Con esas cuentas las compras muestran «Compra de prueba» y **no cobran**.

Notas:
- La cuenta de Google del teléfono debe ser una de la lista.
- Una cuenta de prueba también puede ser tester de la prueba cerrada; son listas distintas, hay que agregarla en las dos.

## 2. Instalar la versión correcta

Las compras reales solo funcionan con la app instalada **desde Google Play**, no con un APK instalado a mano.

1. Espera a que Google apruebe la versión de «Prueba cerrada - Alpha» (el botón «Copiar enlace» se habilita al aprobarse).
2. Desde el teléfono, abre el enlace de participación con la cuenta de prueba, acepta y instala.
3. Comprueba que **no** aparece el cartel «COMPRA DE PRUEBA · no se cobra nada» del juego (ese cartel es de la compra simulada de la web y del APK `android-prueba`).

## 3. Casos a probar

| # | Caso | Resultado esperado |
|---|---|---|
| 1 | Comprar `monedas_1200` | Se suman 1.200 monedas; Google muestra «Compra de prueba» |
| 2 | Comprar el mismo paquete dos veces seguidas | Se suma dos veces (es consumible) |
| 3 | Comprar cada uno de los otros 5 paquetes | Se suman las cantidades correctas (6.600, 14.400 monedas; 300, 1.650, 3.600 Cristales) |
| 4 | Comprar `bienvenida` | +3.000 monedas, +500 Cristales y un Sobre Legendario |
| 5 | Intentar `bienvenida` otra vez | La segunda se frena (compra única) |
| 6 | Cancelar en la ventana de Google | No se suma nada ni cuenta para el límite diario |
| 7 | Cerrar la app justo después de pagar y reabrirla | Se entrega una sola vez |
| 8 | Comprar 5 veces el mismo día | Aparece el límite diario |
| 9 | Sin internet | Mensaje claro, no se pierde nada |
| 10 | Tocar solo «Monedas y Cristales» | Solo elige; se compra con el botón del precio |

## 4. Dónde ver los resultados

- Play Console → **Informes financieros → Resumen de pedidos** (las pruebas aparecen como «Prueba»).
- Si un producto no se puede comprar: comprueba que está **Activo** en Productos únicos y que la app instalada es la versión de la pista de prueba (versionCode 50001 o superior).

## 5. Si algo falla

Anota el caso, el modelo de teléfono y la hora, y pásamelo. Revisaré `src/core/compras/compras.ts` y el plugin `PixBilling`.
