import { useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { kiltExtensionService } from '@/services/kiltExtensionService';
import { kiltAccountService } from '@/services/kiltAccountService';
import { fundsManagementService } from '@/services/fundsManagementService';
import { useGlobalStore } from '@/stores/useGlobalStore';
import type { CTypeSchema } from '@/types/ctype';

export interface CTypeCreationRequest {
  name: string;
  schema: CTypeSchema;
  isPublic: boolean;
  authorizedRoles?: string[];
  network: 'peregrine' | 'spiritnet';
  payerType?: 'user' | 'system' | 'auto';
  signerType?: 'user' | 'system' | 'auto';
  selectedAccount?: string;
}

export interface CTypeCreationResponse {
  success: boolean;
  data?: {
    id: string;
    ctypeHash: string;
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
  };
  error?: string;
}

export const useCTypeCreation = () => {
  const { jwt, user } = useAuth();
  const { toast } = useToast();
  const { startAction, completeAction, failAction, isActionInProgress } = useGlobalStore();
  const [isCreating, setIsCreating] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  /**
   * Flujo A: Sistema paga y firma (solo superadmin)
   */
  const createCTypeSystemOnly = useCallback(async (request: CTypeCreationRequest): Promise<CTypeCreationResponse> => {
    if (!jwt) {
      throw new Error('No estás autenticado');
    }

    const actionId = startAction({
      type: 'create_ctype',
      title: 'Creando CType con sistema',
      description: `Creando CType "${request.name}" usando el sistema`,
      metadata: { ctypeName: request.name, network: request.network, payerType: 'system', signerType: 'system' }
    });

    try {
      console.log('[useCTypeCreation] Creando CType con sistema (solo superadmin)...');
      
      const response = await fetch(`${apiUrl}/api/admin/ctypes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          ...request,
          payerType: 'system',
          signerType: 'system',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el CType');
      }

      const result = await response.json();
      console.log('[useCTypeCreation] CType creado exitosamente con sistema:', result);

      completeAction(actionId, result.data);
      toast({
        title: 'CType creado exitosamente',
        description: `El CType "${request.name}" ha sido creado por el sistema.`,
      });

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error('[useCTypeCreation] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      failAction(actionId, errorMessage);
      toast({
        title: 'Error al crear CType',
        description: errorMessage,
        variant: 'destructive',
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [jwt, startAction, completeAction, failAction, toast, apiUrl]);

  /**
   * Flujo B: Sistema paga, usuario firma
   */
  const createCTypeSystemPaysUserSigns = useCallback(async (request: CTypeCreationRequest): Promise<CTypeCreationResponse> => {
    if (!jwt) {
      throw new Error('No estás autenticado');
    }

    const actionId = startAction({
      type: 'create_ctype',
      title: 'Creando CType con tu DID',
      description: `Creando CType "${request.name}" - sistema paga, tú firmas`,
      metadata: { ctypeName: request.name, network: request.network, payerType: 'system', signerType: 'user' }
    });

    try {
      console.log('[useCTypeCreation] Iniciando creación: sistema paga, usuario firma...');
      
      // 1. Inicializar la extensión KILT
      await kiltExtensionService.initialize();
      
      if (!kiltExtensionService.isExtensionAvailable()) {
        throw new Error('La extensión KILT no está disponible. Por favor, instala Sporran.');
      }

      // 2. Obtener DIDs disponibles
      const availableDids = await kiltExtensionService.getDidsForSelection();
      console.log('[useCTypeCreation] DIDs disponibles:', availableDids);
      
      if (availableDids.length === 0) {
        throw new Error('No se encontraron DIDs completos en tu wallet. Crea una identidad completa en Sporran.');
      }

      // 3. Usar el primer DID disponible (en el futuro, permitir selección)
      const selectedDid = availableDids[0];
      console.log('[useCTypeCreation] DID seleccionado:', selectedDid);

      // 4. Preparar transacción en el backend
      console.log('[useCTypeCreation] Preparando transacción...');
      const prepareResponse = await fetch(`${apiUrl}/api/admin/ctypes/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          ...request,
          userDid: selectedDid,
        }),
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(errorData.error || 'Error al preparar la transacción');
      }

      const prepareData = await prepareResponse.json();
      console.log('[useCTypeCreation] Respuesta de preparación:', prepareData);
      
      if (!prepareData.success || !prepareData.data) {
        throw new Error(prepareData.error || 'Error al preparar la transacción');
      }
      
      const { extrinsic, submitter: userAddress } = prepareData.data;
      if (!extrinsic) {
        throw new Error('No se recibió la transacción del backend');
      }
      
      console.log('[useCTypeCreation] Transacción preparada:', { extrinsic: extrinsic.substring(0, 50) + '...', userAddress });

      // 5. Firmar la transacción con el DID del usuario (versión mejorada)
      console.log('🔥🔥🔥 [useCTypeCreation] LLAMANDO MÉTODO MEJORADO! 🔥🔥🔥');
      console.log('[useCTypeCreation] Firmando transacción con DID (versión mejorada)...');
      const signedResult = await kiltExtensionService.signExtrinsicWithDidImproved(
        extrinsic,      // Extrinsic a firmar
        userAddress,    // Dirección de la cuenta del usuario (signer)
        selectedDid     // DID del usuario
      );
      console.log('[useCTypeCreation] Transacción firmada:', signedResult);

      // 6. Enviar transacción firmada al backend
      console.log('[useCTypeCreation] Enviando transacción firmada...');
      const submitResponse = await fetch(`${apiUrl}/api/admin/ctypes/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          ...request,
          userDid: selectedDid,
          signedExtrinsic: signedResult.signed,
          didKeyUri: signedResult.didKeyUri,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Error al enviar la transacción');
      }

      const result = await submitResponse.json();
      console.log('[useCTypeCreation] CType creado exitosamente:', result);

      completeAction(actionId, result.data);
      toast({
        title: 'CType creado exitosamente',
        description: `El CType "${request.name}" ha sido creado firmado con tu DID.`,
      });

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error('[useCTypeCreation] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      failAction(actionId, errorMessage);
      toast({
        title: 'Error al crear CType',
        description: errorMessage,
        variant: 'destructive',
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [jwt, startAction, completeAction, failAction, toast, apiUrl]);

  /**
   * Flujo C: Usuario paga y firma
   */
  const createCTypeUserPaysAndSigns = useCallback(async (request: CTypeCreationRequest): Promise<CTypeCreationResponse> => {
    if (!jwt) {
      throw new Error('No estás autenticado');
    }

    const actionId = startAction({
      type: 'create_ctype',
      title: 'Creando CType con tu cuenta',
      description: `Creando CType "${request.name}" - tú pagas y firmas`,
      metadata: { ctypeName: request.name, network: request.network, payerType: 'user', signerType: 'user' }
    });

    try {
      console.log('[useCTypeCreation] Iniciando creación: usuario paga y firma...');
      
      // 1. Inicializar servicios
      await Promise.all([
        kiltExtensionService.initialize(),
        kiltAccountService.initialize()
      ]);
      
      if (!kiltExtensionService.isExtensionAvailable()) {
        throw new Error('La extensión KILT no está disponible. Por favor, instala Sporran.');
      }

      // 2. Obtener DIDs disponibles
      const availableDids = await kiltExtensionService.getDidsForSelection();
      console.log('[useCTypeCreation] DIDs disponibles:', availableDids);
      
      if (availableDids.length === 0) {
        throw new Error('No se encontraron DIDs completos en tu wallet. Crea una identidad completa en Sporran.');
      }

      // 3. Obtener cuentas KILT disponibles para pago desde Sporran
      const availableAccounts = await kiltAccountService.getAvailableAccounts();
      console.log('[useCTypeCreation] Cuentas KILT disponibles desde Sporran:', availableAccounts);
      
      if (availableAccounts.length === 0) {
        throw new Error('No se encontraron cuentas KILT en Sporran. Asegúrate de tener cuentas configuradas en tu wallet.');
      }

      // 4. Seleccionar cuenta del usuario
      const selectedDid = availableDids[0];
      
      // Usar la cuenta seleccionada por el usuario o fallback a la segunda cuenta
      let selectedAccount = availableAccounts[0]; // Por defecto la primera
      
      if (request.selectedAccount) {
        // Buscar la cuenta seleccionada por el usuario
        const userSelectedAccount = availableAccounts.find(acc => acc.address === request.selectedAccount);
        if (userSelectedAccount) {
          selectedAccount = userSelectedAccount;
          console.log('[useCTypeCreation] Usando cuenta seleccionada por el usuario:', selectedAccount.address);
        } else {
          console.warn('[useCTypeCreation] Cuenta seleccionada no encontrada, usando fallback');
        }
      } else if (availableAccounts.length > 1) {
        // Fallback: usar la segunda cuenta que suele ser la del usuario
        selectedAccount = availableAccounts[1];
        console.log('[useCTypeCreation] Usando segunda cuenta (fallback):', selectedAccount.address);
      } else {
        console.log('[useCTypeCreation] Solo hay una cuenta disponible, usando la primera');
      }
      
      console.log('[useCTypeCreation] DID seleccionado:', selectedDid);
      console.log('[useCTypeCreation] Cuenta seleccionada:', selectedAccount.address);
      console.log('[useCTypeCreation] Nombre de la cuenta:', selectedAccount.meta.name);
      console.log('[useCTypeCreation] Todas las cuentas disponibles:', availableAccounts.map(acc => ({
        address: acc.address,
        name: acc.meta.name,
        source: acc.meta.source
      })));

      // 5. Verificar balance de la cuenta
      const balanceInfo = await kiltAccountService.checkBalance(selectedAccount.address, request.network);
      console.log('[useCTypeCreation] Información de balance:', balanceInfo);
      
      if (!balanceInfo.hasBalance) {
        throw new Error(`Balance insuficiente. Necesitas al menos ${balanceInfo.estimatedFee} KILT para crear el CType.`);
      }

      // 6. Preparar transacción en el backend
      console.log('[useCTypeCreation] Preparando transacción...');
      console.log('[useCTypeCreation] Parámetros enviados:', {
        userDid: selectedDid,
        userAccountAddress: selectedAccount.address,
        paymentType: 'user',
        signerType: 'user',
        request: request
      });
      
      console.log('[useCTypeCreation] Dirección de la cuenta del usuario:', selectedAccount.address);
      console.log('[useCTypeCreation] ¿Es dirección KILT?', selectedAccount.address.startsWith('4'));
      
      const prepareResponse = await fetch(`${apiUrl}/api/admin/ctypes/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          ...request,
          userDid: selectedDid,
          userAccountAddress: selectedAccount.address, // Pasar la dirección de la cuenta del usuario
          paymentType: 'user', // Especificar que el usuario paga
          signerType: 'user',  // Especificar que el usuario firma
        }),
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(errorData.error || 'Error al preparar la transacción');
      }

      const prepareData = await prepareResponse.json();
      console.log('[useCTypeCreation] Respuesta de preparación:', prepareData);
      
      if (!prepareData.success || !prepareData.data) {
        throw new Error(prepareData.error || 'Error al preparar la transacción');
      }
      
      const { extrinsic, submitter: userAddress } = prepareData.data;
      if (!extrinsic) {
        throw new Error('No se recibió la transacción del backend');
      }
      
      console.log('[useCTypeCreation] Transacción preparada:', { extrinsic: extrinsic.substring(0, 50) + '...', userAddress });

      // 7. Firmar la transacción con el DID del usuario (versión mejorada)
      console.log('🔥🔥🔥 [useCTypeCreation] LLAMANDO MÉTODO MEJORADO (FLUJO C)! 🔥🔥🔥');
      console.log('[useCTypeCreation] Firmando transacción con DID (versión mejorada)...');
      const signedResult = await kiltExtensionService.signExtrinsicWithDidImproved(
        extrinsic,             // Extrinsic a firmar
        selectedAccount.address, // Dirección de la cuenta del usuario (signer)
        selectedDid            // DID del usuario
      );
      console.log('[useCTypeCreation] Transacción firmada:', signedResult);

      // 8. Obtener signer para la cuenta de pago (para futuras implementaciones)
      // const signer = await kiltAccountService.getSigner(selectedAccount);
      console.log('[useCTypeCreation] Cuenta de pago configurada:', selectedAccount.address);

      // 9. Enviar transacción firmada al backend
      console.log('[useCTypeCreation] Enviando transacción firmada...');
      const submitResponse = await fetch(`${apiUrl}/api/admin/ctypes/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          ...request,
          userDid: selectedDid,
          signedExtrinsic: signedResult.signed,
          didKeyUri: signedResult.didKeyUri,
          submitterAddress: selectedAccount.address,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || 'Error al enviar la transacción');
      }

      const result = await submitResponse.json();
      console.log('[useCTypeCreation] CType creado exitosamente:', result);

      completeAction(actionId, result.data);
      toast({
        title: 'CType creado exitosamente',
        description: `El CType "${request.name}" ha sido creado pagando y firmando con tu cuenta.`,
      });

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error('[useCTypeCreation] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      failAction(actionId, errorMessage);
      toast({
        title: 'Error al crear CType',
        description: errorMessage,
        variant: 'destructive',
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [jwt, startAction, completeAction, failAction, toast, apiUrl]);

  /**
   * Nuevo método inteligente que determina automáticamente el mejor flujo
   */
  const createCTypeIntelligent = useCallback(async (request: CTypeCreationRequest): Promise<CTypeCreationResponse> => {
    if (!jwt || !user?.did) {
      throw new Error('No estás autenticado o no tienes un DID válido');
    }

    try {
      console.log('[useCTypeCreation] Determinando flujo óptimo para crear CType...');
      
      // Si se especifican opciones específicas, usarlas directamente
      if (request.payerType && request.payerType !== 'auto' && request.signerType && request.signerType !== 'auto') {
        console.log('[useCTypeCreation] Usando opciones específicas:', { payerType: request.payerType, signerType: request.signerType });
        
        if (request.payerType === 'system' && request.signerType === 'system') {
          return await createCTypeSystemOnly(request);
        } else if (request.payerType === 'system' && request.signerType === 'user') {
          return await createCTypeSystemPaysUserSigns(request);
        } else if (request.payerType === 'user' && request.signerType === 'user') {
          return await createCTypeUserPaysAndSigns(request);
        } else {
          throw new Error('Combinación de opciones no soportada');
        }
      }
      
      // 1. Verificar capacidad del usuario para realizar la operación
      const capabilityCheck = await fundsManagementService.canUserPerformOperation(
        user.did,
        request.network,
        'create_ctype'
      );

      if (!capabilityCheck.canPerform) {
        throw new Error(capabilityCheck.reason || 'No puedes realizar esta operación');
      }

      const options = capabilityCheck.options!;
      console.log('[useCTypeCreation] Opciones determinadas automáticamente:', options);

      // 2. Ejecutar el flujo correspondiente según las opciones
      if (options.payerType === 'system' && options.signerType === 'system') {
        console.log('[useCTypeCreation] Ejecutando flujo: Sistema paga y firma');
        return await createCTypeSystemOnly(request);
      } else if (options.payerType === 'system' && options.signerType === 'user') {
        console.log('[useCTypeCreation] Ejecutando flujo: Sistema paga, usuario firma');
        return await createCTypeSystemPaysUserSigns(request);
      } else if (options.payerType === 'user' && options.signerType === 'user') {
        console.log('[useCTypeCreation] Ejecutando flujo: Usuario paga y firma');
        return await createCTypeUserPaysAndSigns(request);
      } else {
        throw new Error('Combinación de opciones no soportada');
      }
    } catch (error) {
      console.error('[useCTypeCreation] Error en flujo inteligente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast({
        title: 'Error al crear CType',
        description: errorMessage,
        variant: 'destructive',
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [jwt, user, createCTypeSystemOnly, createCTypeSystemPaysUserSigns, createCTypeUserPaysAndSigns, toast]);

  /**
   * Método principal que usa el flujo inteligente
   */
  const createCType = useCallback(async (request: CTypeCreationRequest): Promise<CTypeCreationResponse> => {
    setIsCreating(true);
    try {
      const result = await createCTypeIntelligent(request);
      return result;
    } finally {
      setIsCreating(false);
    }
  }, [createCTypeIntelligent]);

  return {
    createCType,
    createCTypeSystemOnly,
    createCTypeSystemPaysUserSigns,
    createCTypeUserPaysAndSigns,
    createCTypeIntelligent,
    isCreating,
    isActionInProgress: () => isActionInProgress('create_ctype'),
  };
}; 