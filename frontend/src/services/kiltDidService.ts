import { ApiPromise, WsProvider } from '@polkadot/api';
import { init, connect } from '@kiltprotocol/sdk-js';
import { Crypto } from '@kiltprotocol/utils';

export interface DidCreationResult {
  success: boolean;
  didUri?: string;
  error?: string;
  extrinsic?: unknown;
}

export interface DidCreationExtrinsicParams {
  did: string;
  submitter: string;
  signature?: string;
}

export class KiltDidService {
  private static readonly PEREGRINE_ENDPOINT = 'wss://peregrine.kilt.io';

  /**
   * Crea un FullDID usando el SDK de KILT y Sporran
   * @param address Dirección KILT del usuario
   * @returns Resultado de la creación
   */
  static async createFullDid(address: string): Promise<DidCreationResult> {
    try {
      console.log('[KiltDidService] VERSIÓN ACTUALIZADA - Iniciando creación de FullDID para:', address);
      
      // Verificar que Sporran esté disponible
      if (!this.isSporranAvailable()) {
        return {
          success: false,
          error: 'Sporran no está disponible. Por favor, instala Sporran y vuelve a intentar.'
        };
      }

      // Inicializar el SDK de KILT
      await init();
      await connect(this.PEREGRINE_ENDPOINT);
      
      console.log('[KiltDidService] SDK de KILT inicializado');
      
      // Conectar a la red KILT usando Polkadot API
      const provider = new WsProvider(this.PEREGRINE_ENDPOINT);
      const api = await ApiPromise.create({ provider });
      
      console.log('[KiltDidService] Conectado a la red KILT');
      
      // Derivar el DID usando el path /did/0/
      const derivedDid = await this.deriveDidFromAddress(address);
      console.log('[KiltDidService] DID derivado:', derivedDid);
      
      // Crear el extrinsic para crear DID
      // En KILT, necesitamos crear el extrinsic con el DID derivado
      console.log('[KiltDidService] Creando extrinsic con DID derivado...');
      const extrinsic = api.tx.did.create(
        {
          did: derivedDid,
          submitter: address,
          newKeyAgreementKeys: [],
          newAttestationKey: null,
          newDelegationKey: null,
          newServiceDetails: []
        },
        {
          sr25519: new Uint8Array(64).fill(0) // Firma temporal que será reemplazada por Sporran
        }
      );
      
      console.log('[KiltDidService] Extrinsic construido exitosamente:', extrinsic);
      
      // Enviar el extrinsic a Sporran para que lo firme y envíe
      const result = await this.submitWithSporran(extrinsic, address);
      
      await api.disconnect();
      
      if (result.success) {
        const didUri = `did:kilt:${derivedDid}`;
        return {
          success: true,
          didUri: didUri,
          extrinsic
        };
      } else {
        return {
          success: false,
          error: result.error || 'No se pudo crear el DID'
        };
      }
      
    } catch (error) {
      console.error('[KiltDidService] Error general:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Deriva el DID desde la dirección usando el path /did/0/
   */
  private static async deriveDidFromAddress(address: string): Promise<string> {
    try {
      // En lugar de obtener el mnemonic (que no es seguro),
      // usaremos un enfoque que funcione con la API de Sporran
      
      // Obtener los DIDs disponibles desde Sporran
      const dids = await this.getAvailableDids();
      
      if (dids.length > 0) {
        // Si ya hay DIDs disponibles, usar el primero
        console.log('[KiltDidService] Usando DID existente:', dids[0]);
        return dids[0];
      }
      
      // Si no hay DIDs, crear uno derivado de la dirección
      // Usar un hash de la dirección como DID temporal
      const publicKey = Crypto.decodeAddress(address);
      const didPath = '//did//0';
      const pathBytes = new TextEncoder().encode(didPath);
      const combined = new Uint8Array([...publicKey, ...pathBytes]);
      const derivedKey = Crypto.hash(combined);
      
      // Codificar la clave derivada como dirección KILT
      const derivedDid = Crypto.encodeAddress(derivedKey, 38); // 38 es el prefix de KILT
      
      console.log('[KiltDidService] DID derivado desde:', address, 'a:', derivedDid);
      
      return derivedDid;
    } catch (error) {
      console.error('[KiltDidService] Error derivando DID:', error);
      throw new Error('No se pudo derivar el DID desde la dirección');
    }
  }

  /**
   * Obtiene los DIDs disponibles desde Sporran
   */
  private static async getAvailableDids(): Promise<string[]> {
    try {
      const sporranWindow = window as { kilt?: { sporran?: { getDids: () => Promise<Array<{ did?: string }>> } } };
      
      if (!sporranWindow.kilt?.sporran?.getDids) {
        console.warn('[KiltDidService] Sporran no soporta getDids');
        return [];
      }
      
      const dids = await sporranWindow.kilt.sporran.getDids();
      console.log('[KiltDidService] DIDs obtenidos desde Sporran:', dids);
      
      // Filtrar solo DIDs completos (no Light DIDs)
      const fullDids = dids
        .filter(did => did.did && !did.did.includes(':light:'))
        .map(did => did.did!);
      
      return fullDids;
    } catch (error) {
      console.error('[KiltDidService] Error obteniendo DIDs desde Sporran:', error);
      return [];
    }
  }

  /**
   * Envía el extrinsic a Sporran para que lo firme y envíe
   */
  private static async submitWithSporran(extrinsic: unknown, address: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sporranWindow = window as { kilt?: { sporran?: { signExtrinsicWithDid: (extrinsic: string, submitter: string) => Promise<{ signed: string }> } } };
      
      if (!sporranWindow.kilt?.sporran?.signExtrinsicWithDid) {
        throw new Error('Sporran no soporta signExtrinsicWithDid');
      }
      
      // Convertir el extrinsic a hex
      const extrinsicHex = (extrinsic as { toHex: () => string }).toHex();
      console.log('[KiltDidService] Enviando extrinsic a Sporran:', extrinsicHex);
      
      // Firmar el extrinsic con Sporran
      const signedResult = await sporranWindow.kilt.sporran.signExtrinsicWithDid(extrinsicHex, address);
      
      console.log('[KiltDidService] Extrinsic firmado:', signedResult);
      
      // Por ahora, asumimos que la firma fue exitosa
      // En una implementación completa, aquí se enviaría la transacción firmada a la blockchain
      
      return { success: true };
      
    } catch (error) {
      console.error('[KiltDidService] Error en Sporran:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear DID en Sporran'
      };
    }
  }

  /**
   * Verifica si Sporran está disponible
   */
  private static isSporranAvailable(): boolean {
    const sporranWindow = window as { kilt?: { sporran?: unknown } };
    return !!(sporranWindow.kilt?.sporran);
  }
} 