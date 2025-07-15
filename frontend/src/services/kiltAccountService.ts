import { kiltExtensionService } from './kiltExtensionService';

export interface KiltAccount {
  address: string;
  meta: {
    name: string;
    source: string;
    genesisHash?: string | null;
  };
}

export class KiltAccountService {
  private static instance: KiltAccountService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): KiltAccountService {
    if (!KiltAccountService.instance) {
      KiltAccountService.instance = new KiltAccountService();
    }
    return KiltAccountService.instance;
  }

  /**
   * Inicializa el servicio y verifica la disponibilidad de Sporran
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('[KiltAccountService] Inicializando servicio de cuentas con Sporran...');
      
      // Inicializar el servicio de extensión KILT
      await kiltExtensionService.initialize();
      
      // Verificar que Sporran esté disponible
      if (!kiltExtensionService.isExtensionAvailable()) {
        throw new Error('Sporran no está disponible. Por favor, instala la extensión Sporran.');
      }
      
      this.isInitialized = true;
      console.log('[KiltAccountService] Servicio inicializado correctamente con Sporran');
    } catch (error) {
      console.error('[KiltAccountService] Error inicializando:', error);
      throw new Error('No se pudo inicializar el servicio de cuentas. Verifica que tengas Sporran instalado.');
    }
  }

  /**
   * Obtiene las cuentas disponibles desde Sporran
   */
  public async getAvailableAccounts(): Promise<KiltAccount[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[KiltAccountService] Obteniendo cuentas desde Sporran...');
      
      const sporranAccounts = await kiltExtensionService.getKiltAccounts();
      console.log('[KiltAccountService] Cuentas obtenidas desde Sporran:', sporranAccounts);
      
      // Convertir al formato KiltAccount
      const kiltAccounts: KiltAccount[] = sporranAccounts.map(account => ({
        address: account.address, // Ya está en formato KILT desde Sporran
        meta: {
          name: account.name || 'Cuenta sin nombre',
          source: 'sporran',
          genesisHash: null, // Sporran maneja esto internamente
        }
      }));
      
      console.log('[KiltAccountService] Cuentas KILT convertidas:', kiltAccounts);
      return kiltAccounts;
    } catch (error) {
      console.error('[KiltAccountService] Error obteniendo cuentas desde Sporran:', error);
      throw new Error('No se pudieron obtener las cuentas desde Sporran. Verifica que tu extensión esté habilitada.');
    }
  }

  /**
   * Obtiene las direcciones KILT directamente desde Sporran (método preferido)
   * @deprecated Usar getAvailableAccounts() en su lugar
   */
  public async getKiltAccountsFromSporran(): Promise<KiltAccount[]> {
    return this.getAvailableAccounts();
  }

  /**
   * Obtiene los DIDs disponibles desde Sporran
   */
  public async getAvailableDids(): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[KiltAccountService] Obteniendo DIDs desde Sporran...');
      
      const dids = await kiltExtensionService.getDids();
      console.log('[KiltAccountService] DIDs obtenidos desde Sporran:', dids);
      
      return dids;
    } catch (error) {
      console.error('[KiltAccountService] Error obteniendo DIDs desde Sporran:', error);
      throw new Error('No se pudieron obtener los DIDs desde Sporran.');
    }
  }

  /**
   * Firma un mensaje con un DID específico usando Sporran
   */
  public async signWithDid(message: string, did: string): Promise<{ signature: string; didKeyUri: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[KiltAccountService] Firmando mensaje con DID:', did);
      
      const result = await kiltExtensionService.signWithDid(message, did);
      console.log('[KiltAccountService] Mensaje firmado exitosamente');
      
      return result;
    } catch (error) {
      console.error('[KiltAccountService] Error firmando mensaje:', error);
      throw new Error('No se pudo firmar el mensaje con el DID especificado.');
    }
  }

  /**
   * Firma una extrinsic con un DID específico usando Sporran
   */
  public async signExtrinsicWithDid(
    extrinsic: string, 
    submitter: string, 
    did: string
  ): Promise<{ signed: string; didKeyUri: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('[KiltAccountService] Firmando extrinsic con DID:', did);
      
      const result = await kiltExtensionService.signExtrinsicWithDidImproved(extrinsic, submitter, did);
      console.log('[KiltAccountService] Extrinsic firmada exitosamente');
      
      return result;
    } catch (error) {
      console.error('[KiltAccountService] Error firmando extrinsic:', error);
      throw new Error('No se pudo firmar la extrinsic con el DID especificado.');
    }
  }

  /**
   * Verifica si una cuenta tiene balance suficiente para una transacción
   */
  public async checkBalance(accountAddress: string, network: 'peregrine' | 'spiritnet'): Promise<{
    hasBalance: boolean;
    balance: string;
    estimatedFee: string;
  }> {
    try {
      // Conectar a la red KILT
      const endpoint = network === 'peregrine' 
        ? 'wss://peregrine.kilt.io' 
        : 'wss://spiritnet.kilt.io';
      
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const provider = new WsProvider(endpoint);
      const api = await ApiPromise.create({ provider });
      
      console.log(`[KiltAccountService] Verificando balance para dirección: ${accountAddress}`);
      
      // Obtener balance de la cuenta
      const accountInfo = await api.query.system.account(accountAddress);
      const balance = accountInfo.data.free.toString();
      
      // Estimación de fee para crear CType (aproximado)
      const estimatedFee = '1000000000000'; // 1 KILT en picokilt
      
      const hasBalance = BigInt(balance) > BigInt(estimatedFee);
      
      console.log(`[KiltAccountService] Balance: ${balance}, Fee estimado: ${estimatedFee}, Tiene balance: ${hasBalance}`);
      
      await api.disconnect();
      
      return {
        hasBalance,
        balance,
        estimatedFee
      };
    } catch (error) {
      console.error('[KiltAccountService] Error verificando balance:', error);
      throw new Error('No se pudo verificar el balance de la cuenta.');
    }
  }

  /**
   * Verifica si el usuario tiene fondos suficientes y ofrece opciones
   */
  public async checkUserFundsAndOptions(
    userDid: string, 
    network: 'peregrine' | 'spiritnet'
  ): Promise<{
    hasFunds: boolean;
    canUseOwnFunds: boolean;
    needsSystemCredits: boolean;
    balance?: string;
    estimatedFee?: string;
  }> {
    try {
      // Obtener cuentas del usuario
      const accounts = await this.getAvailableAccounts();
      
      if (accounts.length === 0) {
        return {
          hasFunds: false,
          canUseOwnFunds: false,
          needsSystemCredits: true
        };
      }
      
      // Verificar balance de la primera cuenta
      const balanceInfo = await this.checkBalance(accounts[0].address, network);
      
      return {
        hasFunds: balanceInfo.hasBalance,
        canUseOwnFunds: balanceInfo.hasBalance,
        needsSystemCredits: !balanceInfo.hasBalance,
        balance: balanceInfo.balance,
        estimatedFee: balanceInfo.estimatedFee
      };
    } catch (error) {
      console.error('[KiltAccountService] Error verificando fondos del usuario:', error);
      return {
        hasFunds: false,
        canUseOwnFunds: false,
        needsSystemCredits: true
      };
    }
  }

  /**
   * Limpia recursos del servicio
   */
  public cleanup() {
    this.isInitialized = false;
    console.log('[KiltAccountService] Servicio limpiado');
  }
}

// Exportar instancia singleton
export const kiltAccountService = KiltAccountService.getInstance(); 