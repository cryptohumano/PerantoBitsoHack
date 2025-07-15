import { ApiPromise, WsProvider } from '@polkadot/api';

export async function initKilt() {
  try {
    const provider = new WsProvider('wss://peregrine.kilt.io');
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    return api;
  } catch (error) {
    console.error('[initKilt] Error inicializando KILT:', error);
    throw error;
  }
}

// Configuración de window.kilt según las especificaciones oficiales de KILT
// Esta configuración debe ejecutarse lo más temprano posible

declare global {
  interface Window {
    kilt: {
      meta: {
        versions: {
          credentials: string;
        };
      };
      [key: string]: any;
    };
  }
}

// Función para obtener extensiones disponibles según las especificaciones
export function getWindowExtensions(): any[] {
  if (typeof window === 'undefined' || !window.kilt) {
    return [];
  }
  return Object.values(window.kilt);
}

// Función para iniciar sesión con extensión según las especificaciones
export async function startExtensionSession(
  extension: any,
  dAppName: string,
  dAppEncryptionKeyUri: string,
  challenge: string
): Promise<any> {
  try {
    const session = await extension.startSession(dAppName, dAppEncryptionKeyUri, challenge);
    
    // Nota: La verificación del challenge debe hacerse en el servidor
    // Resolve the `session.encryptionKeyUri` and use this key and the nonce
    // to decrypt `session.encryptedChallenge` and confirm that it's equal to the original challenge.
    // This verification must happen on the server-side.
    
    return session;
  } catch (error) {
    console.error(`Error initializing ${extension.name}: ${(error as Error).message}`);
    throw error;
  }
} 