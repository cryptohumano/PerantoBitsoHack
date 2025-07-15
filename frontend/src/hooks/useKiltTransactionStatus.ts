import { useState, useEffect } from 'react';

interface KiltTransactionStatus {
  paymentId: string;
  kiltSent: boolean;
  kiltTransactionHash?: string;
  kiltBlockNumber?: number;
  kiltNetwork?: string;
  kiltAmount?: number;
  kiltSentAt?: string;
  error?: string;
}

export const useKiltTransactionStatus = (paymentId: string | null) => {
  const [status, setStatus] = useState<KiltTransactionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<number>(0);

  const checkStatus = async () => {
    if (!paymentId) return;

    // Evitar requests muy frecuentes (mínimo 5 segundos entre requests)
    const now = Date.now();
    if (now - lastCheck < 5000) {
      console.log('⏳ [useKiltTransactionStatus] Evitando request muy frecuente');
      return;
    }

    setLoading(true);
    setError(null);
    setLastCheck(now);

    try {
      const response = await fetch(`http://localhost:4000/api/payments/kilt-transaction-status?paymentId=${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data);
      console.log('✅ [useKiltTransactionStatus] Estado actualizado:', data);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('❌ [useKiltTransactionStatus] Error al consultar estado:', error);
      setError(error.message || 'Error al consultar estado de transacción KILT');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentId && !status?.kiltSent) {
      checkStatus();
    }
  }, [paymentId, status?.kiltSent]);

  return {
    status,
    loading,
    error,
    checkStatus,
  };
}; 