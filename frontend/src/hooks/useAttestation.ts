import { useCallback } from 'react';
import { useGlobalStore } from '@/stores/useGlobalStore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AttestationRequest {
  claimId: string;
  attesterDid: string;
  quote?: {
    cost: {
      net: number;
      gross: number;
      tax: { vat: number };
    };
    currency: string;
    termsAndConditions: string;
    timeframe: string;
  };
}

export interface AttestationResponse {
  success: boolean;
  data?: {
    attestationHash: string;
    credentialHash: string;
    transactionHash: string;
  };
  error?: string;
}

export const useAttestation = () => {
  const { jwt } = useAuth();
  const { toast } = useToast();
  const { 
    startAction, 
    updateAction, 
    completeAction, 
    failAction,
    isActionInProgress 
  } = useGlobalStore();

  const startAttestation = useCallback(async (request: AttestationRequest): Promise<AttestationResponse> => {
    if (!jwt) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para realizar attestaciones",
        variant: "destructive",
      });
      return { success: false, error: "No autenticado" };
    }

    // Iniciar acción en Zustand
    const actionId = startAction({
      type: 'attest_claim',
      title: 'Iniciando attestación',
      description: 'Procesando solicitud de attestación...',
      metadata: {
        claimId: request.claimId,
        attesterDid: request.attesterDid,
      }
    });

    try {
      // Actualizar estado
      updateAction(actionId, {
        state: 'loading',
        title: 'Conectando con wallet',
        description: 'Inicializando conexión con Sporran...'
      });

      const response = await fetch('/api/attestations/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la attestación');
      }

      const result: AttestationResponse = await response.json();

      if (result.success) {
        // Completar acción exitosamente
        completeAction(actionId, result.data);
        
        toast({
          title: "¡Attestación exitosa!",
          description: "La credencial ha sido attestada y registrada en la blockchain",
          variant: "default",
        });

        return result;
      } else {
        throw new Error(result.error || 'Error desconocido en la attestación');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Marcar acción como fallida
      failAction(actionId, errorMessage);
      
      toast({
        title: "Error en attestación",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  }, [jwt, toast, startAction, updateAction, completeAction, failAction]);

  const getUserAttestations = useCallback(async () => {
    if (!jwt) {
      return { success: false, error: "No autenticado" };
    }

    try {
      const response = await fetch('/api/attestations/user', {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo attestaciones');
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: errorMessage };
    }
  }, [jwt]);

  const getPendingAttestations = useCallback(async () => {
    if (!jwt) {
      return { success: false, error: "No autenticado" };
    }

    try {
      const response = await fetch('/api/attestations/pending', {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo attestaciones pendientes');
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: errorMessage };
    }
  }, [jwt]);

  return {
    startAttestation,
    getUserAttestations,
    getPendingAttestations,
    isAttestationInProgress: () => isActionInProgress('attest_claim'),
  };
}; 