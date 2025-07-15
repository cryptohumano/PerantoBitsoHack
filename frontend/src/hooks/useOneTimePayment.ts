import { useState } from 'react';
import { PaymentService } from '../services/paymentService';

interface OneTimePaymentResult {
  success: boolean;
  kiltAddress?: string;
  bitsoPaymentId?: string;
  clabe?: string;
  beneficiary?: string;
  expirationDate?: string;
  amount?: string;
  status?: string;
  error?: string;
}

export function useOneTimePayment() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OneTimePaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initiateOneTimePayment = async (kiltAddress: string, amount: number, payer_name: string) => {
    console.log('🚀 [useOneTimePayment] Iniciando pago one-time:', { kiltAddress, amount, payer_name });
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    console.log('⏳ [useOneTimePayment] Estado de carga iniciado');
    
    try {
      const response = await PaymentService.initiateOneTimePayment({ kiltAddress, amount, payer_name });
      console.log('📊 [useOneTimePayment] Respuesta del servicio:', response);
      
      setLoading(false);
      
      if (response.success) {
        console.log('✅ [useOneTimePayment] Pago one-time exitoso:', response);
        setResult(response);
      } else {
        console.error('❌ [useOneTimePayment] Error en pago one-time:', response.error);
        setError(response.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ [useOneTimePayment] Error inesperado:', error);
      setLoading(false);
      setError('Error inesperado al procesar el pago');
    }
  };

  console.log('🔄 [useOneTimePayment] Estado actual:', { loading, result, error });

  return { loading, result, error, initiateOneTimePayment };
} 