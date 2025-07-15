import { DidUrl } from '@kiltprotocol/types';
import { ApiPromise } from '@polkadot/api';
import { config } from '../config';
import { ConfigService } from '@kiltprotocol/config';
import { resolver } from '@kiltprotocol/did';
import * as Kilt from '@kiltprotocol/sdk-js';

export async function resolveDappDidDocument(api: ApiPromise) {
  const network = config.kilt.defaultNetwork as 'spiritnet' | 'peregrine';
  const didUri = config.kilt[network].didUri as DidUrl;

  if (!didUri) {
    throw new Error(`No se encontró el DID URI para la red ${network}`);
  }

  // Asegurarnos de que la API esté lista
  await api.isReady;
  
  // Configurar la API en el ConfigService usando la API de Kilt
  ConfigService.set({ api: api as any });
  
  // Verificar que la API está configurada
  if (!ConfigService.isSet('api')) {
    throw new Error('La API no está configurada en ConfigService');
  }
  
  try {
    const resolution = await resolver.resolve(didUri);
    if (!resolution.didDocument) {
      throw new Error('No se pudo resolver el DID Document de la dApp');
    }
    
    return resolution.didDocument;
  } catch (error) {
    console.error('Error al resolver DID:', error);
    throw new Error('Error al resolver el DID Document de la dApp');
  }
}

/**
 * Detecta automáticamente la red de un DID y lo resuelve en la red correcta
 * @param userDid El DID del usuario a resolver
 * @returns El documento DID resuelto y la red detectada
 */
export async function resolveUserDidWithNetworkDetection(userDid: DidUrl): Promise<{
  didDocument: any;
  network: 'spiritnet' | 'peregrine';
}> {
  console.log(`[DidResolver] Intentando resolver DID: ${userDid}`);
  
  // Intentar resolver en ambas redes
  const networks: ('spiritnet' | 'peregrine')[] = ['peregrine', 'spiritnet'];
  
  for (const network of networks) {
    try {
      console.log(`[DidResolver] Intentando resolver en red: ${network}`);
      
      // Conectar a la red específica
      const wsEndpoint = config.kilt[network].wsEndpoint;
      const api = await Kilt.connect(wsEndpoint);
      
      // Configurar la API en el ConfigService
      ConfigService.set({ api: api as any });
      
      // Intentar resolver el DID
      const resolution = await resolver.resolve(userDid);
      
      if (resolution.didDocument) {
        console.log(`[DidResolver] DID resuelto exitosamente en red: ${network}`);
        await api.disconnect();
        return {
          didDocument: resolution.didDocument,
          network
        };
      }
      
      await api.disconnect();
    } catch (error) {
      console.log(`[DidResolver] Error resolviendo en ${network}:`, error);
      // Continuar con la siguiente red
    }
  }
  
  throw new Error(`No se pudo resolver el DID ${userDid} en ninguna red (Peregrine o Spiritnet)`);
}

/**
 * Detecta la red de un DID basándose en su formato
 * @param userDid El DID del usuario
 * @returns La red detectada o null si no se puede determinar
 */
export function detectNetworkFromDid(userDid: string): 'spiritnet' | 'peregrine' | null {
  // Los DIDs de Peregrine suelen tener un formato específico
  // Esta es una heurística simple - en producción podrías usar un enfoque más robusto
  
  // Si el DID contiene caracteres específicos o tiene un patrón particular
  // puedes ajustar esta lógica según tus necesidades
  
  // Por ahora, intentaremos resolver en ambas redes
  return null;
}
