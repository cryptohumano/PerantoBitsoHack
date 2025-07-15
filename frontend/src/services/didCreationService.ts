// No necesitamos estas importaciones para este servicio

export interface DidCreationInput {
  dAppName: string;
  origin: string;
  submitter: string;
  pendingDidUri?: string;
}

export interface DidCreationResult {
  success: boolean;
  error?: string;
  didUri?: string;
}

export interface DidCreationDetails {
  did: string;
  submitter: string;
  signature: string;
}

export class DidCreationService {
  private static readonly PEREGRINE_ENDPOINT = 'wss://peregrine.kilt.io';

  /**
   * Construye la transacción para crear un FullDID y abre Sporran
   * @param address Dirección KILT del usuario
   * @returns Resultado de la creación
   */
  static async createFullDid(address: string): Promise<DidCreationResult> {
    try {
      console.log('[DidCreationService] Iniciando creación de FullDID para:', address);
      
      // Verificar que Sporran esté disponible
      if (!this.isSporranAvailable()) {
        return {
          success: false,
          error: 'Sporran no está disponible. Por favor, instala Sporran y vuelve a intentar.'
        };
      }

      // Construir los datos para el extrinsic de creación de DID
      const didCreationDetails: DidCreationDetails = {
        did: address, // La dirección KILT del usuario
        submitter: address, // El submitter es la misma dirección
        signature: '', // La firma se generará en Sporran
      };

      console.log('[DidCreationService] Detalles de creación de DID:', didCreationDetails);

      // Abrir Sporran con el extrinsic de creación de DID
      const sporranWindow = window as { kilt?: { sporran?: { createDid: (details: DidCreationDetails) => Promise<any> } } };
      if (sporranWindow.kilt?.sporran) {
        try {
          // Usar el método correcto para crear DID con el extrinsic
          const result = await sporranWindow.kilt.sporran.createDid({
            did: address,
            submitter: address,
            signature: '', // Sporran manejará la firma automáticamente
          });
          
          console.log('[DidCreationService] Resultado de Sporran:', result);
          
          if (result && result.did) {
            return {
              success: true,
              didUri: result.did
            };
          } else {
            return {
              success: false,
              error: 'No se pudo crear el DID. Verifica que tienes suficientes KILT para la transacción.'
            };
          }
        } catch (error) {
          console.error('[DidCreationService] Error en Sporran:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al crear DID en Sporran'
          };
        }
      } else {
        return {
          success: false,
          error: 'Sporran no está conectado. Por favor, conecta Sporran y vuelve a intentar.'
        };
      }
      
    } catch (error) {
      console.error('[DidCreationService] Error general:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
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

  /**
   * Genera un DID URI temporal para la transacción
   * @param address Dirección KILT
   * @returns DID URI temporal
   */
  static generateTemporaryDidUri(address: string): string {
    // En KILT, el DID URI sigue el formato: did:kilt:4pUVoTJ69JMuapNducHJPU68nGkQXB7R9xAWY9dmvUh42653
    return `did:kilt:${address}`;
  }

  /**
   * Construye el extrinsic para crear DID usando la API de KILT
   * @param address Dirección KILT del usuario
   * @returns Extrinsic para crear DID
   */
  static async buildDidCreationExtrinsic(address: string) {
    try {
      const provider = new WsProvider(this.PEREGRINE_ENDPOINT);
      const api = await ApiPromise.create({ provider });
      
      // Construir el extrinsic para crear DID
      // En KILT, el extrinsic es: did.create(details, signature)
      const extrinsic = api.tx.did.create(
        {
          did: address,
          submitter: address,
        },
        null // La firma se manejará en Sporran
      );
      
      await api.disconnect();
      
      return extrinsic;
    } catch (error) {
      console.error('[DidCreationService] Error construyendo extrinsic:', error);
      throw error;
    }
  }
} 