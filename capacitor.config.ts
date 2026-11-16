import type { CapacitorConfig } from '@capacitor/cli';

/**
 * App de Android (D245). El juego web (dist/) va dentro de la app: funciona sin internet.
 * appId PROVISORIO: es el nombre del paquete en Google Play y no se puede cambiar después de publicar.
 */
const config: CapacitorConfig = {
  appId: 'com.pixanimals.juego',
  appName: 'PIXANIMALS',
  webDir: 'dist',
  android: {
    backgroundColor: '#1a1c2c',
    // Sin depuración remota en las versiones de la tienda.
    webContentsDebuggingEnabled: false,
  },
};

export default config;
