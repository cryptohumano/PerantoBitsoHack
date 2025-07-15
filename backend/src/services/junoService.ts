import axios from 'axios';

export interface JunoConfig {
  apiKey: string;
  apiUrl: string;
  accountNumber: string; // CLABE del servicio
  webhookUrl?: string;
}

export interface SpeiPayment {
  id: string;
  amount: number;
  reference: string;
  sender: {
    name: string;
    account: string;
  };
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
  confirmedAt?: string;
}

export class JunoService {
  private config: JunoConfig;
  private axiosInstance: any;

  constructor(config: JunoConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Configura webhook para recibir notificaciones de pagos SPEI
   */
  async setupWebhook(webhookUrl: string) {
    try {
      const response = await this.axiosInstance.post('/webhooks', {
        url: webhookUrl,
        events: ['spei.payment.received'],
      });
      return response.data;
    } catch (error) {
      console.error('Error setting up Juno webhook:', error);
      throw error;
    }
  }

  /**
   * Obtiene pagos SPEI recientes para la cuenta configurada
   */
  async getRecentSpeiPayments(limit: number = 50): Promise<SpeiPayment[]> {
    try {
      const response = await this.axiosInstance.get('/spei-payments', {
        params: {
          account: this.config.accountNumber,
          limit,
          status: 'confirmed',
        },
      });
      return response.data.payments || [];
    } catch (error) {
      console.error('Error fetching SPEI payments from Juno:', error);
      throw error;
    }
  }

  /**
   * Verifica un pago específico por referencia
   */
  async verifyPayment(reference: string): Promise<SpeiPayment | null> {
    try {
      const response = await this.axiosInstance.get(`/spei-payments/${reference}`);
      return response.data;
    } catch (error) {
      console.error(`Error verifying payment ${reference}:`, error);
      return null;
    }
  }

  /**
   * Procesa webhook de Juno (llamado cuando Juno envía notificación)
   */
  async processWebhook(payload: any): Promise<SpeiPayment | null> {
    try {
      if (payload.event !== 'spei.payment.received') {
        console.log('Ignoring non-SPEI webhook event:', payload.event);
        return null;
      }

      const payment = payload.data;
      
      // Verificar que el pago es para nuestra cuenta
      if (payment.recipient_account !== this.config.accountNumber) {
        console.log('Payment not for our account:', payment.recipient_account);
        return null;
      }

      return {
        id: payment.id,
        amount: payment.amount,
        reference: payment.reference,
        sender: {
          name: payment.sender_name,
          account: payment.sender_account,
        },
        status: payment.status,
        createdAt: payment.created_at,
        confirmedAt: payment.confirmed_at,
      };
    } catch (error) {
      console.error('Error processing Juno webhook:', error);
      return null;
    }
  }

  /**
   * Genera una referencia única para un pago
   */
  generatePaymentReference(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `SPEI-${userId}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Obtiene información de la cuenta para mostrar al usuario
   */
  getAccountInfo() {
    return {
      accountNumber: this.config.accountNumber,
      bankName: 'Banco configurado en Juno',
      accountType: 'CLABE',
    };
  }
} 