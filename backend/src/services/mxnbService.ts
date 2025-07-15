import { ethers, formatUnits, Interface } from 'ethers';

export interface MxnbConfig {
  rpcUrl: string;
  contractAddress: string;
  serviceWalletAddress: string;
  privateKey?: string; // Para firmar transacciones
}

export interface MxnbPayment {
  id: string;
  amount: number;
  from: string;
  to: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export class MxnbService {
  private config: MxnbConfig;
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor(config: MxnbConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // ABI básico para MXNB (ERC-20)
    const abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'function transferFrom(address from, address to, uint256 amount) returns (bool)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    ];
    
    this.contract = new ethers.Contract(config.contractAddress, abi, this.provider);
  }

  /**
   * Escucha transferencias MXNB a nuestra dirección de servicio
   */
  async listenToPayments(callback: (payment: MxnbPayment) => void) {
    try {
      console.log(`[MXNB] Iniciando listener para ${this.config.serviceWalletAddress}`);
      
      this.contract.on('Transfer', async (from: string, to: string, amount: bigint, event: any) => {
        // Solo procesar transferencias a nuestra dirección de servicio
        if (to.toLowerCase() === this.config.serviceWalletAddress.toLowerCase()) {
          const decimals = await this.contract.decimals();
          const amountInTokens = formatUnits(amount, decimals);
          
          const payment: MxnbPayment = {
            id: event.transactionHash,
            amount: parseFloat(amountInTokens),
            from: from,
            to: to,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
            timestamp: Date.now(),
            status: 'confirmed',
          };

          console.log(`[MXNB] Pago detectado: ${payment.amount} MXNB de ${from}`);
          callback(payment);
        }
      });

      console.log('[MXNB] Listener iniciado correctamente');
    } catch (error) {
      console.error('[MXNB] Error iniciando listener:', error);
      throw error;
    }
  }

  /**
   * Verifica el balance de MXNB de una dirección
   */
  async getBalance(address: string): Promise<number> {
    try {
      const balance = await this.contract.balanceOf(address);
      const decimals = await this.contract.decimals();
      return parseFloat(formatUnits(balance, decimals));
    } catch (error) {
      console.error(`Error getting MXNB balance for ${address}:`, error);
      return 0;
    }
  }

  /**
   * Verifica una transacción específica
   */
  async verifyTransaction(txHash: string): Promise<MxnbPayment | null> {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!tx || !receipt) {
        return null;
      }

      // Decodificar los logs para obtener los datos de la transferencia
      const iface = new Interface([
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ]);

      for (const log of receipt.logs) {
        try {
          const parsedLog = iface.parseLog(log);
          if (parsedLog && parsedLog.name === 'Transfer') {
            const [from, to, amount] = parsedLog.args;
            
            // Solo procesar si es para nuestra dirección
            if (to.toLowerCase() === this.config.serviceWalletAddress.toLowerCase()) {
              const decimals = await this.contract.decimals();
              const amountInTokens = formatUnits(amount, decimals);
              const block = await this.provider.getBlock(receipt.blockNumber);
              const timestamp = block ? block.timestamp * 1000 : Date.now();
              
              return {
                id: txHash,
                amount: parseFloat(amountInTokens),
                from: from,
                to: to,
                transactionHash: txHash,
                blockNumber: receipt.blockNumber,
                timestamp,
                status: receipt.status === 1 ? 'confirmed' : 'failed',
              };
            }
          }
        } catch (e) {
          // Ignorar logs que no son Transfer
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error verifying transaction ${txHash}:`, error);
      return null;
    }
  }

  /**
   * Obtiene información del contrato MXNB
   */
  async getContractInfo() {
    try {
      const [symbol, decimals] = await Promise.all([
        this.contract.symbol(),
        this.contract.decimals(),
      ]);

      return {
        address: this.config.contractAddress,
        symbol,
        decimals,
        network: 'Arbitrum Sepolia', // Para pruebas
      };
    } catch (error) {
      console.error('Error getting contract info:', error);
      throw error;
    }
  }

  /**
   * Genera una referencia única para un pago MXNB
   */
  generatePaymentReference(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `MXNB-${userId}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Detiene el listener de pagos
   */
  stopListening() {
    this.contract.removeAllListeners('Transfer');
    console.log('[MXNB] Listener detenido');
  }
} 