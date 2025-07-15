import axios from 'axios';
import crypto from 'crypto';

export interface BitsoPaymentData {
  clabe?: string;
  mxnbAddress?: string;
  reference: string;
  accountId: string;
  beneficiary?: string;
}

export interface BitsoPaymentStatus {
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  reference: string;
}

export class BitsoService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BITSO_API_KEY || '';
    this.apiSecret = process.env.BITSO_API_SECRET || '';
    this.baseUrl = process.env.BITSO_API_URL || 'https://api.bitso.com';
    console.log('🔧 [BitsoService] Inicializado con configuración:', {
      hasApiKey: !!this.apiKey,
      hasApiSecret: !!this.apiSecret,
      baseUrl: this.baseUrl
    });
  }

  /**
   * Obtiene datos de pago SPEI desde Bitso
   */
  async getSpeiPaymentData(): Promise<BitsoPaymentData> {
    console.log('📞 [BitsoService] Obteniendo datos de pago SPEI...');
    try {
      // En producción, esto vendría de la API de Bitso
      // Por ahora, simulamos los datos
      const reference = `CIGO-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      const paymentData = {
        clabe: process.env.BITSO_CLABE || '012180001234567890',
        reference,
        accountId: process.env.BITSO_ACCOUNT_ID || 'bitso-account-123'
      };

      console.log('✅ [BitsoService] Datos SPEI obtenidos:', paymentData);
      return paymentData;
    } catch (error) {
      console.error('❌ [BitsoService] Error obteniendo datos SPEI de Bitso:', error);
      throw new Error('Error obteniendo datos de pago SPEI');
    }
  }

  /**
   * Obtiene datos de pago MXNB desde Bitso
   */
  async getMxnbPaymentData(): Promise<BitsoPaymentData> {
    console.log('📞 [BitsoService] Obteniendo datos de pago MXNB...');
    try {
      // En producción, esto vendría de la API de Bitso
      // Por ahora, simulamos los datos
      const reference = `CIGO-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      
      const paymentData = {
        mxnbAddress: process.env.BITSO_MXNB_ADDRESS || '0x1234567890abcdef1234567890abcdef12345678',
        reference,
        accountId: process.env.BITSO_ACCOUNT_ID || 'bitso-account-123'
      };

      console.log('✅ [BitsoService] Datos MXNB obtenidos:', paymentData);
      return paymentData;
    } catch (error) {
      console.error('❌ [BitsoService] Error obteniendo datos MXNB de Bitso:', error);
      throw new Error('Error obteniendo datos de pago MXNB');
    }
  }

  /**
   * Configura webhook para SPEI
   */
  async setupSpeiWebhook(paymentId: string, kiltAddress: string): Promise<void> {
    console.log('🔗 [BitsoService] Configurando webhook SPEI:', { paymentId, kiltAddress });
    try {
      // En producción, configuraríamos el webhook con Bitso
      console.log(`🔗 [BitsoService] Configurando webhook SPEI para paymentId: ${paymentId}, kiltAddress: ${kiltAddress}`);
      
      // Simular configuración de webhook
      const webhookUrl = `${process.env.BASE_URL}/api/payments/bitso-webhook`;
      console.log('🌐 [BitsoService] URL del webhook:', webhookUrl);
      
      // Aquí iría la llamada real a la API de Bitso para configurar el webhook
      // await this.configureBitsoWebhook(webhookUrl, paymentId);
      
      console.log('✅ [BitsoService] Webhook SPEI configurado exitosamente');
    } catch (error) {
      console.error('❌ [BitsoService] Error configurando webhook SPEI:', error);
      throw new Error('Error configurando webhook');
    }
  }

  /**
   * Verifica el estado de un pago
   */
  async checkPaymentStatus(paymentId: string): Promise<BitsoPaymentStatus> {
    console.log('🔍 [BitsoService] Verificando estado de pago:', paymentId);
    try {
      // En producción, esto verificaría con la API de Bitso
      // Por ahora, simulamos la verificación
      
      // Simular verificación de pago
      const isCompleted = Math.random() > 0.5; // 50% de probabilidad
      
      const status: BitsoPaymentStatus = {
        status: isCompleted ? 'completed' : 'pending',
        amount: 150,
        reference: paymentId
      };

      console.log('✅ [BitsoService] Estado de pago verificado:', status);
      return status;
    } catch (error) {
      console.error('❌ [BitsoService] Error verificando estado de pago:', error);
      throw new Error('Error verificando estado de pago');
    }
  }

  /**
   * Construye el header de autenticación HMAC para Bitso
   */
  private buildAuthHeader(method: string, path: string, payload: any): string {
    const nonce = (Date.now() * 1000).toString();
    const jsonPayload = payload ? JSON.stringify(payload) : '';
    const signatureString = nonce + method + path + jsonPayload;
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signatureString)
      .digest('hex');
    return `Bitso ${this.apiKey}:${nonce}:${signature}`;
  }

  /**
   * Crea un pago One-Time Payment en Bitso
   */
  async createOneTimePayment(params: {
    payment_id: string;
    amount: string;
    payer_name: string;
  }): Promise<any> {
    console.log('🚀 [BitsoService] Creando pago one-time:', params);
    try {
      // Como el endpoint /spei/v1/payments requiere permisos especiales,
      // vamos a simular la creación del pago usando las CLABEs disponibles
      console.log('📋 [BitsoService] Obteniendo CLABEs disponibles...');
      const clabesResponse = await this.listClabes();
      const clabes = clabesResponse.payload.response;
      
      if (!clabes || clabes.length === 0) {
        throw new Error('No hay CLABEs disponibles');
      }
      
      // Usar la primera CLABE disponible (AUTO_PAYMENT)
      const clabe = clabes.find((c: any) => c.type === 'AUTO_PAYMENT') || clabes[0];
      console.log('✅ [BitsoService] CLABE seleccionada:', clabe.clabe);
      
      // Generar tracking_key único para identificar el pago
      const tracking_key = `KILT-${params.payment_id}-${Date.now()}`;
      
      // Generar datos de pago simulados
      const paymentData = {
        payment_id: params.payment_id,
        tracking_key: tracking_key, // Identificador único para el mock deposit
        amount: params.amount,
        payer_name: params.payer_name,
        clabe: clabe.clabe,
        beneficiary: 'Peranto Ci.Go',
        status: 'PENDING',
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        created_at: new Date().toISOString()
      };
      
      console.log('✅ [BitsoService] Pago one-time simulado creado:', paymentData);
      return {
        success: true,
        payload: paymentData
      };
    } catch (error) {
      console.error('❌ [BitsoService] Error creando pago one-time:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 [BitsoService] Detalles del error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw error;
    }
  }

  /**
   * Consulta los detalles de un pago One-Time Payment en Bitso
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    console.log('🔍 [BitsoService] Consultando detalles de pago:', paymentId);
    try {
      const response = await axios.get(
        `${this.baseUrl}/spei/v1/payments/${paymentId}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: `Bitso ${this.apiKey}:${this.apiSecret}`
          }
        }
      );

      console.log('✅ [BitsoService] Detalles de pago obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BitsoService] Error consultando detalles de pago:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 [BitsoService] Detalles del error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw error;
    }
  }

  /**
   * Consulta los depósitos recibidos en Bitso
   */
  async getDeposits(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<any> {
    console.log('📋 [BitsoService] Consultando depósitos:', params);
    try {
      const method = 'GET';
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const path = '/api/v3/fundings' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
      const authHeader = this.buildAuthHeader(method, path, null);

      const response = await axios.get(
        `${this.baseUrl}${path}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: authHeader
          }
        }
      );

      console.log('✅ [BitsoService] Depósitos obtenidos exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BitsoService] Error consultando depósitos:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 [BitsoService] Detalles del error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw error;
    }
  }

  /**
   * Registra un webhook con Bitso para recibir notificaciones de depósitos
   */
  async registerWebhook(callbackUrl: string): Promise<any> {
    console.log('🔗 [BitsoService] Registrando webhook:', callbackUrl);
    try {
      const method = 'POST';
      const path = '/api/v3/webhooks';
      const payload = {
        callback_url: callbackUrl
      };
      const authHeader = this.buildAuthHeader(method, path, payload);

      const response = await axios.post(
        `${this.baseUrl}${path}`,
        payload,
        {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            Authorization: authHeader
          }
        }
      );

      console.log('✅ [BitsoService] Webhook registrado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BitsoService] Error registrando webhook:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 [BitsoService] Detalles del error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw error;
    }
  }

  /**
   * Crea un mock deposit en Bitso Stage para simular un pago
   */
  async createMockDeposit(params: {
    amount: string;
    receiver_clabe: string;
    receiver_name: string;
    tracking_key: string;
    sender_curp?: string;
    receiver_curp?: string;
    payment_type?: number;
  }): Promise<any> {
    console.log('🎭 [BitsoService] Creando mock deposit:', params);
    try {
      const method = 'POST';
      const path = '/spei/test/deposits';
      const authHeader = this.buildAuthHeader(method, path, params);

      const response = await axios.post(
        `${this.baseUrl}${path}`,
        params,
        {
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            Authorization: authHeader
          }
        }
      );

      console.log('✅ [BitsoService] Mock deposit creado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BitsoService] Error creando mock deposit:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 [BitsoService] Detalles del error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw error;
    }
  }

  /**
   * Lista todas las CLABEs del usuario autenticado
   */
  async listClabes(params?: {
    clabe_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    console.log('📋 [BitsoService] Listando CLABEs con parámetros:', params);
    try {
      const method = 'GET';
      const queryParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const path = '/spei/v1/clabes' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
      const authHeader = this.buildAuthHeader(method, path, null);

      const response = await axios.get(
        `${this.baseUrl}${path}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: authHeader
          }
        }
      );

      console.log('✅ [BitsoService] CLABEs obtenidas exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BitsoService] Error listando CLABEs:', error);
      if (axios.isAxiosError(error)) {
        console.error('📊 [BitsoService] Detalles del error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw error;
    }
  }

  /**
   * Configura webhook con Bitso (método privado para uso interno)
   */
  private async configureBitsoWebhook(webhookUrl: string, paymentId: string): Promise<void> {
    console.log('🔗 [BitsoService] Configurando webhook con Bitso:', { webhookUrl, paymentId });
    try {
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substr(2, 15);
      
      // Crear firma para autenticación con Bitso
      const signature = this.createSignature(timestamp, nonce);
      console.log('🔐 [BitsoService] Firma generada:', signature);
      
      const response = await axios.post(`${this.baseUrl}/v3/webhooks`, {
        url: webhookUrl,
        events: ['payment_received'],
        payment_id: paymentId
      }, {
        headers: {
          'Authorization': `Bitso ${this.apiKey}:${signature}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status !== 200) {
        console.error('❌ [BitsoService] Error en respuesta de webhook:', response.status);
        throw new Error('Error configurando webhook con Bitso');
      }

      console.log('✅ [BitsoService] Webhook configurado exitosamente con Bitso');

    } catch (error) {
      console.error('❌ [BitsoService] Error configurando webhook con Bitso:', error);
      throw error;
    }
  }

  /**
   * Crea firma para autenticación con Bitso
   */
  private createSignature(timestamp: number, nonce: string): string {
    console.log('🔐 [BitsoService] Generando firma:', { timestamp, nonce });
    // En producción, implementar la lógica de firma de Bitso
    // Por ahora, retornamos una firma simulada
    const signature = `signature-${timestamp}-${nonce}`;
    console.log('✅ [BitsoService] Firma generada:', signature);
    return signature;
  }
} 