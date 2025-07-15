import { kiltAccountService } from './kiltAccountService';

export interface UserFundsStatus {
  hasFunds: boolean;
  canUseOwnFunds: boolean;
  needsSystemCredits: boolean;
  balance?: string;
  estimatedFee?: string;
  availableCredits?: number;
  totalCredits?: number;
}

export interface TransactionOptions {
  payerType: 'user' | 'system';
  signerType: 'user' | 'system';
  userDid?: string;
  userAccountAddress?: string;
  estimatedFee?: string;
}

export class FundsManagementService {
  private static instance: FundsManagementService;

  private constructor() {}

  public static getInstance(): FundsManagementService {
    if (!FundsManagementService.instance) {
      FundsManagementService.instance = new FundsManagementService();
    }
    return FundsManagementService.instance;
  }

  /**
   * Verifica el estado de fondos del usuario y determina las opciones disponibles
   */
  public async checkUserFundsStatus(
    userDid: string,
    network: 'peregrine' | 'spiritnet'
  ): Promise<UserFundsStatus> {
    try {
      console.log('[FundsManagementService] Verificando estado de fondos para DID:', userDid);
      
      // 1. Verificar si el usuario tiene cuentas KILT
      const accounts = await kiltAccountService.getAvailableAccounts();
      
      if (accounts.length === 0) {
        console.log('[FundsManagementService] Usuario no tiene cuentas KILT, necesita créditos del sistema');
        return {
          hasFunds: false,
          canUseOwnFunds: false,
          needsSystemCredits: true,
          availableCredits: 0,
          totalCredits: 0
        };
      }

      // 2. Verificar balance de la primera cuenta
      const balanceInfo = await kiltAccountService.checkBalance(accounts[0].address, network);
      
      // 3. Obtener créditos disponibles del sistema (esto se implementaría con el backend)
      const systemCredits = await this.getUserSystemCredits(userDid);
      
      const hasFunds = balanceInfo.hasBalance;
      const canUseOwnFunds = balanceInfo.hasBalance;
      const needsSystemCredits = !balanceInfo.hasBalance;

      console.log('[FundsManagementService] Estado de fondos:', {
        hasFunds,
        canUseOwnFunds,
        needsSystemCredits,
        balance: balanceInfo.balance,
        estimatedFee: balanceInfo.estimatedFee,
        systemCredits
      });

      return {
        hasFunds,
        canUseOwnFunds,
        needsSystemCredits,
        balance: balanceInfo.balance,
        estimatedFee: balanceInfo.estimatedFee,
        availableCredits: systemCredits.available,
        totalCredits: systemCredits.total
      };
    } catch (error) {
      console.error('[FundsManagementService] Error verificando fondos:', error);
      return {
        hasFunds: false,
        canUseOwnFunds: false,
        needsSystemCredits: true,
        availableCredits: 0,
        totalCredits: 0
      };
    }
  }

  /**
   * Determina las mejores opciones de transacción para el usuario
   */
  public async getOptimalTransactionOptions(
    userDid: string,
    network: 'peregrine' | 'spiritnet',
    operationType: 'create_ctype' | 'attest_claim' | 'revoke_credential'
  ): Promise<TransactionOptions> {
    try {
      console.log('[FundsManagementService] Determinando opciones óptimas para:', operationType);
      
      const fundsStatus = await this.checkUserFundsStatus(userDid, network);
      const accounts = await kiltAccountService.getAvailableAccounts();
      
      // Obtener estimación de fee para la operación
      const estimatedFee = await this.estimateTransactionFee(operationType, network);
      
      if (fundsStatus.canUseOwnFunds) {
        // Usuario tiene fondos suficientes - usar su cuenta
        console.log('[FundsManagementService] Usuario tiene fondos, usando cuenta propia');
        return {
          payerType: 'user',
          signerType: 'user',
          userDid: userDid,
          userAccountAddress: accounts[0].address,
          estimatedFee
        };
      } else if (fundsStatus.availableCredits && fundsStatus.availableCredits > 0) {
        // Usuario tiene créditos del sistema - sistema paga, usuario firma
        console.log('[FundsManagementService] Usuario tiene créditos, sistema paga, usuario firma');
        return {
          payerType: 'system',
          signerType: 'user',
          userDid: userDid,
          userAccountAddress: accounts[0]?.address,
          estimatedFee
        };
      } else {
        // Usuario no tiene fondos ni créditos - sistema paga y firma (solo para superadmin)
        console.log('[FundsManagementService] Usuario sin fondos ni créditos, sistema paga y firma');
        return {
          payerType: 'system',
          signerType: 'system',
          estimatedFee
        };
      }
    } catch (error) {
      console.error('[FundsManagementService] Error determinando opciones:', error);
      throw new Error('No se pudieron determinar las opciones de transacción');
    }
  }

  /**
   * Obtiene los créditos del sistema disponibles para el usuario
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getUserSystemCredits(_userDid: string): Promise<{ available: number; total: number }> {
    try {
      // Esta implementación se conectaría con el backend para obtener los créditos
      // Por ahora, retornamos valores de ejemplo
      const response = await fetch('/api/user/credits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Aquí iría el JWT del usuario
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          available: data.availableCredits || 0,
          total: data.totalCredits || 0
        };
      }

      // Fallback: retornar créditos de ejemplo
      return {
        available: 5, // 5 créditos disponibles
        total: 10     // 10 créditos totales
      };
    } catch (error) {
      console.error('[FundsManagementService] Error obteniendo créditos:', error);
      return {
        available: 0,
        total: 0
      };
    }
  }

  /**
   * Estima el fee de transacción para diferentes operaciones
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async estimateTransactionFee(
    operationType: 'create_ctype' | 'attest_claim' | 'revoke_credential',
    _network: 'peregrine' | 'spiritnet'
  ): Promise<string> {
    // Estimaciones aproximadas en picokilt
    const feeEstimates = {
      create_ctype: '1000000000000',    // ~1 KILT
      attest_claim: '500000000000',     // ~0.5 KILT
      revoke_credential: '300000000000' // ~0.3 KILT
    };

    return feeEstimates[operationType] || '1000000000000';
  }

  /**
   * Verifica si el usuario puede realizar una operación específica
   */
  public async canUserPerformOperation(
    userDid: string,
    network: 'peregrine' | 'spiritnet',
    operationType: 'create_ctype' | 'attest_claim' | 'revoke_credential'
  ): Promise<{ canPerform: boolean; reason?: string; options?: TransactionOptions }> {
    try {
      const fundsStatus = await this.checkUserFundsStatus(userDid, network);
      const options = await this.getOptimalTransactionOptions(userDid, network, operationType);

      // Verificar si el usuario tiene los recursos necesarios
      if (fundsStatus.canUseOwnFunds) {
        return {
          canPerform: true,
          options
        };
      }

      if (fundsStatus.needsSystemCredits && fundsStatus.availableCredits && fundsStatus.availableCredits > 0) {
        return {
          canPerform: true,
          options
        };
      }

      // Usuario no puede realizar la operación
      return {
        canPerform: false,
        reason: 'No tienes fondos suficientes ni créditos disponibles para realizar esta operación.',
        options
      };
    } catch (error) {
      console.error('[FundsManagementService] Error verificando capacidad:', error);
      return {
        canPerform: false,
        reason: 'Error al verificar tu capacidad para realizar esta operación.'
      };
    }
  }

  /**
   * Consume un crédito del sistema para el usuario
   */
  public async consumeSystemCredit(userDid: string, operationType: string): Promise<boolean> {
    try {
      const response = await fetch('/api/user/credits/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Aquí iría el JWT del usuario
        },
        body: JSON.stringify({
          userDid,
          operationType
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[FundsManagementService] Crédito consumido exitosamente:', data);
        return true;
      }

      console.error('[FundsManagementService] Error consumiendo crédito:', response.statusText);
      return false;
    } catch (error) {
      console.error('[FundsManagementService] Error consumiendo crédito:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const fundsManagementService = FundsManagementService.getInstance(); 