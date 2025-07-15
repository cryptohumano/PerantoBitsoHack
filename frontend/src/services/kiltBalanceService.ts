import { ApiPromise, WsProvider } from '@polkadot/api';

export interface KiltBalanceResult {
  success: boolean;
  balance?: string;
  error?: string;
}

export class KiltBalanceService {
  private static readonly PEREGRINE_ENDPOINT = 'wss://peregrine.kilt.io';
  private static readonly SPIRITNET_ENDPOINT = 'wss://spiritnet.kilt.io';

  /**
   * Consulta el balance de KILT de una dirección
   * @param address Dirección KILT
   * @param network Red KILT ('peregrine' o 'spiritnet')
   * @returns Balance en KILT
   */
  static async getKiltBalance(address: string, network: 'peregrine' | 'spiritnet' = 'peregrine'): Promise<KiltBalanceResult> {
    let api: ApiPromise | undefined;
    
    try {
      const endpoint = network === 'peregrine' ? this.PEREGRINE_ENDPOINT : this.SPIRITNET_ENDPOINT;
      const provider = new WsProvider(endpoint);
      api = await ApiPromise.create({ provider });
      
      console.log(`[KiltBalanceService] Conectado a ${endpoint} para consultar balance de ${address}`);
      
      // Consultar el balance de la cuenta
      const { data: { free } } = await api.query.system.account(address);
      
      // Convertir de Plancks a KILT (KILT tiene 15 decimales)
      const balanceInKilt = Number(free) / Math.pow(10, 15);
      
      console.log(`[KiltBalanceService] Balance de ${address}: ${balanceInKilt} KILT`);
      
      return {
        success: true,
        balance: balanceInKilt.toFixed(6)
      };
      
    } catch (error) {
      console.error('[KiltBalanceService] Error consultando balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      if (api) {
        await api.disconnect();
      }
    }
  }
} 