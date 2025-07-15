"use client";

import { KiltAddressCaptureService, KiltAddressCaptureResult } from './kiltAddressCapture';

export interface PaymentRequest {
  method: 'SPEI' | 'MXNB';
  amount: number;
  kiltAddress: string;
  userEmail?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  clabe?: string;
  mxnbAddress?: string;
  reference?: string;
  error?: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  method: 'SPEI' | 'MXNB';
  kiltAddress: string;
  createdAt: string;
  completedAt?: string;
}

export class PaymentService {
  private static readonly API_BASE = '/api/payments';

  /**
   * Inicia un proceso de pago capturando la dirección KILT del usuario
   */
  static async initiatePayment(method: 'SPEI' | 'MXNB', amount: number = 150): Promise<PaymentResponse> {
    console.log('🚀 [PaymentService] Iniciando pago:', { method, amount });
    try {
      // 1. Capturar dirección KILT del usuario
      console.log('📱 [PaymentService] Capturando dirección KILT...');
      let kiltAddressResult: KiltAddressCaptureResult;
      
      // Intentar primero con Polkadot Extension DApp
      console.log('🔌 [PaymentService] Intentando con Polkadot Extension DApp...');
      kiltAddressResult = await KiltAddressCaptureService.captureKiltAddress();
      
      // Si falla, intentar con Sporran
      if (!kiltAddressResult.success) {
        console.log('📱 [PaymentService] Polkadot Extension falló, intentando con Sporran...');
        kiltAddressResult = await KiltAddressCaptureService.captureKiltAddressFromSporran();
      }

      if (!kiltAddressResult.success) {
        console.error('❌ [PaymentService] No se pudo capturar dirección KILT:', kiltAddressResult.error);
        return {
          success: false,
          error: kiltAddressResult.error || 'No se pudo capturar la dirección KILT'
        };
      }

      console.log('✅ [PaymentService] Dirección KILT capturada:', kiltAddressResult.kiltAddress);

      // 2. Crear solicitud de pago en el backend
      const paymentRequest: PaymentRequest = {
        method,
        amount,
        kiltAddress: kiltAddressResult.kiltAddress!
      };

      console.log('📤 [PaymentService] Enviando solicitud de pago al backend:', paymentRequest);
      const response = await fetch(`${this.API_BASE}/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [PaymentService] Error en respuesta del backend:', errorData);
        return {
          success: false,
          error: errorData.message || 'Error al iniciar el pago'
        };
      }

      const paymentData = await response.json();
      console.log('✅ [PaymentService] Pago iniciado exitosamente:', paymentData);
      return {
        success: true,
        paymentId: paymentData.paymentId,
        clabe: paymentData.clabe,
        mxnbAddress: paymentData.mxnbAddress,
        reference: paymentData.reference
      };

    } catch (error) {
      console.error('❌ [PaymentService] Error iniciando pago:', error);
      return {
        success: false,
        error: 'Error de conexión al iniciar el pago'
      };
    }
  }

  /**
   * Verifica el estado de un pago
   */
  static async checkPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    console.log('🔍 [PaymentService] Verificando estado de pago:', paymentId);
    try {
      const response = await fetch(`${this.API_BASE}/status/${paymentId}`);
      
      if (!response.ok) {
        console.error('❌ [PaymentService] Error verificando estado de pago:', response.status);
        return null;
      }

      const status = await response.json();
      console.log('✅ [PaymentService] Estado de pago obtenido:', status);
      return status;
    } catch (error) {
      console.error('❌ [PaymentService] Error verificando estado de pago:', error);
      return null;
    }
  }

  /**
   * Obtiene el estado de onboarding del usuario
   */
  static async getOnboardingStatus(): Promise<{
    success: boolean;
    hasCompletedPayment: boolean;
    canProceedToDid: boolean;
    payments: Array<{
      paymentId: string;
      amount: number;
      method: string;
      completedAt: string | null;
    }>;
  } | null> {
    console.log('🔍 [PaymentService] Obteniendo estado de onboarding...');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 [PaymentService] Token encontrado:', !!token);

      const response = await fetch(`${this.API_BASE}/onboarding-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('❌ [PaymentService] Error obteniendo estado de onboarding:', response.status);
        return null;
      }

      const status = await response.json();
      console.log('✅ [PaymentService] Estado de onboarding obtenido:', status);
      return status;
    } catch (error) {
      console.error('❌ [PaymentService] Error obteniendo estado de onboarding:', error);
      return null;
    }
  }

  /**
   * Confirma que el usuario ha completado el pago
   */
  static async confirmPayment(paymentId: string): Promise<boolean> {
    console.log('✅ [PaymentService] Confirmando pago:', paymentId);
    try {
      const response = await fetch(`${this.API_BASE}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      });

      const success = response.ok;
      console.log('✅ [PaymentService] Pago confirmado:', success);
      return success;
    } catch (error) {
      console.error('❌ [PaymentService] Error confirmando pago:', error);
      return false;
    }
  }

  /**
   * Inicia un pago one-time con Bitso
   */
  static async initiateOneTimePayment({ kiltAddress, amount, payer_name }: { kiltAddress: string; amount: number; payer_name: string; }): Promise<{
    success: boolean;
    kiltAddress?: string;
    bitsoPaymentId?: string;
    clabe?: string;
    beneficiary?: string;
    expirationDate?: string;
    amount?: string;
    status?: string;
    error?: string;
  }> {
    console.log('🚀 [PaymentService] Iniciando pago one-time:', { kiltAddress, amount, payer_name });
    try {
      const requestBody = { kiltAddress, amount, payer_name };
      console.log('📤 [PaymentService] Enviando solicitud one-time al backend:', requestBody);

      const response = await fetch(`${this.API_BASE}/one-time-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [PaymentService] Error en respuesta one-time del backend:', errorData);
        return { success: false, error: errorData.error || 'Error al iniciar pago one-time' };
      }

      const data = await response.json();
      console.log('✅ [PaymentService] Pago one-time iniciado exitosamente:', data);
      return { success: true, ...data };
    } catch (error) {
      console.error('❌ [PaymentService] Error iniciando pago one-time:', error);
      return { success: false, error: 'Error de conexión al iniciar pago one-time' };
    }
  }
} 