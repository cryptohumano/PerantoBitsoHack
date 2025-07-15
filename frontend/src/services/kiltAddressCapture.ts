"use client";

export interface KiltAddressCaptureResult {
  success: boolean;
  kiltAddress?: string;
  error?: string;
}

export class KiltAddressCaptureService {
  /**
   * Convierte una dirección a formato ss58 de KILT
   */
  private static async convertToKiltAddress(address: string): Promise<string> {
    console.log('🔄 [KiltAddressCapture] Convirtiendo dirección a formato KILT:', address);
    
    // Si ya está en formato ss58 de KILT (prefijo 38), devolverla tal como está
    if (address.startsWith('4') || address.startsWith('5')) {
      console.log('✅ [KiltAddressCapture] Dirección ya está en formato KILT');
      return address;
    }

    // Si es una dirección hexadecimal, convertirla a ss58 con prefijo 38 (KILT)
    try {
      // Importar las utilidades de Polkadot para la conversión
      const { encodeAddress } = await import('@polkadot/util-crypto');
      const kiltAddress = encodeAddress(address, 38); // 38 es el prefijo de KILT
      console.log('✅ [KiltAddressCapture] Dirección convertida a KILT:', kiltAddress);
      return kiltAddress;
    } catch (error) {
      console.error('❌ [KiltAddressCapture] Error convirtiendo dirección:', error);
      // Si falla la conversión, devolver la dirección original
      return address;
    }
  }

  /**
   * Convierte una dirección hexadecimal a formato ss58 de KILT usando encodeAddress
   */
  static async encodeToKiltAddress(hexAddress: string): Promise<string> {
    console.log('🔄 [KiltAddressCapture] Codificando dirección hexadecimal a KILT:', hexAddress);
    
    try {
      const { encodeAddress } = await import('@polkadot/util-crypto');
      const kiltAddress = encodeAddress(hexAddress, 38); // 38 es el prefijo de KILT
      console.log('✅ [KiltAddressCapture] Dirección codificada a KILT:', kiltAddress);
      return kiltAddress;
    } catch (error) {
      console.error('❌ [KiltAddressCapture] Error codificando dirección:', error);
      throw new Error(`Error codificando dirección a formato KILT: ${error}`);
    }
  }

  /**
   * Captura la dirección KILT del usuario usando Polkadot Extension DApp
   * Esta función funciona tanto con Sporran como con Polkadot.js Extension
   */
  static async captureKiltAddress(): Promise<KiltAddressCaptureResult> {
    console.log('🔍 [KiltAddressCapture] Capturando dirección KILT con Polkadot Extension DApp');
    
    try {
      // Verificar si Polkadot Extension DApp está disponible
      if (!(window as unknown as { injectedWeb3?: unknown }).injectedWeb3) {
        console.error('❌ [KiltAddressCapture] Polkadot Extension no disponible');
        return {
          success: false,
          error: 'Polkadot Extension DApp no está disponible. Por favor, instala la extensión.'
        };
      }

      // Habilitar la extensión
      const { web3Enable } = await import('@polkadot/extension-dapp');
      await web3Enable('peranto-cigo');
      console.log('✅ [KiltAddressCapture] Polkadot Extension habilitado');

      // Obtener cuentas
      const { web3Accounts } = await import('@polkadot/extension-dapp');
      const accounts = await web3Accounts();
      console.log('📊 [KiltAddressCapture] Cuentas encontradas:', accounts.length);

      // Filtrar cuentas KILT (prefijo 38) o convertir todas las cuentas
      const kiltAccounts = [];
      
      for (const account of accounts) {
        try {
          // Convertir cada cuenta a formato KILT
          const kiltAddress = await this.convertToKiltAddress(account.address);
          kiltAccounts.push({
            address: kiltAddress,
            name: account.meta?.name || 'Cuenta sin nombre',
            type: account.type
          });
        } catch (error) {
          console.log('⚠️ [KiltAddressCapture] Error convirtiendo cuenta:', account.address, error);
        }
      }

      console.log('🔍 [KiltAddressCapture] Cuentas KILT procesadas:', kiltAccounts.length);

      if (kiltAccounts.length === 0) {
        console.error('❌ [KiltAddressCapture] No se encontraron cuentas KILT válidas');
        return {
          success: false,
          error: 'No se encontraron cuentas KILT válidas. Por favor, crea una cuenta en tu wallet.'
        };
      }

      // Usar la primera cuenta KILT encontrada
      const selectedAccount = kiltAccounts[0];
      
      console.log('✅ [KiltAddressCapture] Dirección KILT capturada:', selectedAccount.address);
      
      return {
        success: true,
        kiltAddress: selectedAccount.address
      };

    } catch (error) {
      console.error('❌ [KiltAddressCapture] Error capturando dirección KILT:', error);
      return {
        success: false,
        error: 'Error al capturar la dirección KILT. Por favor, verifica tu wallet.'
      };
    }
  }

  /**
   * Captura dirección KILT usando Sporran como alternativa
   * Nota: Sporran puede no tener getAccounts disponible
   */
  static async captureKiltAddressFromSporran(): Promise<KiltAddressCaptureResult> {
    console.log('🔍 [KiltAddressCapture] Capturando dirección KILT desde Sporran');
    
    try {
      const sporran = (window as unknown as { kilt?: { sporran?: { getAccounts?: () => Promise<{ address: string; name?: string }[]> } } }).kilt?.sporran;
      if (!sporran || !sporran.getAccounts) {
        console.error('❌ [KiltAddressCapture] Sporran no disponible o sin método getAccounts');
        return {
          success: false,
          error: 'Sporran no está disponible o no soporta getAccounts.'
        };
      }

      const accounts = await sporran.getAccounts();
      console.log('📊 [KiltAddressCapture] Cuentas Sporran encontradas:', accounts.length);
      
      if (accounts.length === 0) {
        console.error('❌ [KiltAddressCapture] No se encontraron cuentas en Sporran');
        return {
          success: false,
          error: 'No se encontraron cuentas en Sporran.'
        };
      }

      const selectedAccount = accounts[0];
      const kiltAddress = await this.convertToKiltAddress(selectedAccount.address);
      
      console.log('✅ [KiltAddressCapture] Dirección KILT capturada desde Sporran:', kiltAddress);
      
      return {
        success: true,
        kiltAddress: kiltAddress
      };

    } catch (error) {
      console.error('❌ [KiltAddressCapture] Error capturando dirección KILT desde Sporran:', error);
      return {
        success: false,
        error: 'Error al capturar la dirección KILT desde Sporran.'
      };
    }
  }

  /**
   * Método principal para obtener dirección KILT
   * Intenta primero con Polkadot Extension DApp, luego con Sporran
   */
  static async getKiltAddress(): Promise<KiltAddressCaptureResult> {
    console.log('🔍 [KiltAddressCapture] Obteniendo dirección KILT...');
    
    // Intentar primero con Polkadot Extension DApp (funciona con Sporran y Polkadot.js)
    const result = await this.captureKiltAddress();
    if (result.success) {
      return result;
    }

    console.log('⚠️ [KiltAddressCapture] Polkadot Extension falló, intentando con Sporran directamente');
    
    // Fallback a Sporran directo
    return await this.captureKiltAddressFromSporran();
  }
} 