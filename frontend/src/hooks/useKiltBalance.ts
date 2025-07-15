import { useState, useEffect } from 'react';
import { KiltBalanceService, KiltBalanceResult } from '@/services/kiltBalanceService';

export const useKiltBalance = (address: string | null, network: 'peregrine' | 'spiritnet' = 'peregrine') => {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalance = async () => {
    if (!address) {
      setBalance(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[useKiltBalance] Consultando balance para:', address);
      const result: KiltBalanceResult = await KiltBalanceService.getKiltBalance(address, network);
      
      if (result.success && result.balance) {
        setBalance(result.balance);
        console.log('[useKiltBalance] Balance obtenido:', result.balance);
      } else {
        setError(result.error || 'Error al consultar balance');
        console.error('[useKiltBalance] Error:', result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('[useKiltBalance] Error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cargar balance automáticamente cuando cambie la dirección
  useEffect(() => {
    loadBalance();
  }, [address, network]);

  return {
    balance,
    loading,
    error,
    refetch: loadBalance
  };
}; 