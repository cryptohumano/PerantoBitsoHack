import { useState } from 'react';
import { KiltDidService, DidCreationResult } from '@/services/kiltDidService';
import { useToast } from '@/hooks/use-toast';

export const useDidCreation = () => {
  const [loading, setLoading] = useState(false);
  const [didCreated, setDidCreated] = useState(false);
  const { toast } = useToast();

  const createFullDid = async (kiltAddress: string): Promise<DidCreationResult> => {
    try {
      setLoading(true);
      console.log('[useDidCreation] Iniciando creación de FullDID para:', kiltAddress);
      
      const result = await KiltDidService.createFullDid(kiltAddress);
      
      if (result.success && result.didUri) {
        setDidCreated(true);
        toast({
          title: "¡DID Creado!",
          description: "Tu identidad digital ha sido creada exitosamente",
        });
        
        // Actualizar el estado en el backend
        await updateDidStatus(result.didUri);
        
        return result;
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el DID. Verifica que tengas suficientes KILT.",
          variant: "destructive",
        });
        return result;
      }
    } catch (error) {
      console.error('[useDidCreation] Error creating DID:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `No se pudo crear el DID: ${errorMessage}`,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const updateDidStatus = async (didUri: string) => {
    try {
      const response = await fetch('/api/payments/update-did-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          did: didUri,
          identityRequestId: null // Se puede obtener del contexto si es necesario
        }),
      });

      if (!response.ok) {
        console.error('[useDidCreation] Error updating DID status:', response.status);
      } else {
        console.log('[useDidCreation] DID status updated successfully');
      }
    } catch (error) {
      console.error('[useDidCreation] Error updating DID status:', error);
    }
  };

  return {
    createFullDid,
    loading,
    didCreated,
    setDidCreated
  };
}; 