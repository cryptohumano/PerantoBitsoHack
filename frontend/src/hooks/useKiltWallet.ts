import { useState, useCallback, useEffect } from "react";
import type { PubSubSessionV1, PubSubSessionV2 } from '@kiltprotocol/kilt-extension-api';
import type { DidUrl } from '@kiltprotocol/types';
import type { ISessionRequest } from '@/types/kilt';
import { authService } from "@/services/auth";
import { kiltExtensionService } from "@/services/kiltExtensionService";
import { useAuth } from "@/context/AuthContext";

type Session = PubSubSessionV1 | PubSubSessionV2;

type ConnectionState = 
  | 'idle'           // Estado inicial
  | 'initializing'   // Inicializando la extensión
  | 'ready'          // Extensión lista para conectar
  | 'connecting'     // En proceso de conexión con Sporran
  | 'selecting-did'  // Usuario seleccionando DID
  | 'authorizing'    // Usuario autorizando en Sporran
  | 'authenticating' // Autenticando con el backend
  | 'connected'      // Conexión exitosa
  | 'error';         // Error en cualquier paso

export function useKiltWallet() {
  const [state, setState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedDid, setSelectedDid] = useState<DidUrl | null>(null);
  const [availableDids, setAvailableDids] = useState<DidUrl[]>([]);
  const { login } = useAuth();

  // Inicializar la extensión al montar el componente
  useEffect(() => {
    let isMounted = true;
    
    const initializeExtension = async () => {
      try {
        if (!isMounted) return;
        setState('initializing');
        await kiltExtensionService.initialize();
        if (isMounted) {
          setState('ready');
        }
      } catch (error) {
        if (isMounted) {
          setError('Error inicializando KILT: ' + (error instanceof Error ? error.message : String(error)));
          setState('error');
        }
      }
    };

    initializeExtension();

    // Cleanup al desmontar - solo limpiar el estado local, no el servicio global
    return () => {
      isMounted = false;
      // No llamar a kiltExtensionService.cleanup() aquí porque podría afectar a otras instancias
      // El servicio se limpiará cuando sea necesario
    };
  }, []);

  // Conectar wallet y abrir Sporran
  const connectWallet = useCallback(async () => {
    // Protección contra múltiples llamadas simultáneas
    if (state === 'connecting' || state === 'authenticating' || state === 'authorizing' || state === 'selecting-did') {
      console.log('[useKiltWallet] Conexión ya en progreso, ignorando llamada adicional');
      return;
    }

    if (state !== 'ready') {
      setError('La extensión no está lista para conectar');
      return;
    }

    try {
      setState('connecting');
      setError(null);

      if (!kiltExtensionService.isExtensionAvailable()) {
        throw new Error('La extensión Sporran no está disponible');
      }

      // 1. Obtener DIDs disponibles para selección
      console.log('[useKiltWallet] Obteniendo DIDs disponibles...');
      const dids = await kiltExtensionService.getDidsForSelection();
      setAvailableDids(dids);
      
      if (dids.length === 0) {
        throw new Error('No se encontraron identidades completas (Full DIDs) en Sporran. Por favor, crea una identidad completa en Sporran.');
      }

      // 2. Si solo hay un DID, usarlo automáticamente
      // Si hay múltiples, por ahora usamos el primero (en el futuro se puede implementar un selector)
      const didToUse = dids[0];
      console.log('[useKiltWallet] Usando DID:', didToUse);

      // 3. Pedimos el sessionRequest al backend
      setState('authenticating');
      const sessionRequest: ISessionRequest = await authService.getChallenge();

      // 4. Iniciar sesión con el DID seleccionado usando las interfaces oficiales
      console.log('[useKiltWallet] Iniciando sesión con DID:', didToUse);
      const { session: kiltSession, did, sessionResponse } = await kiltExtensionService.startSessionWithSelectedDid(
        didToUse,
        sessionRequest
      );
      
      console.log('[useKiltWallet] Sesión iniciada exitosamente');

      // 5. Verificar la sesión con el backend usando las interfaces oficiales
      const authResponse = await authService.verifySession(sessionRequest, sessionResponse, did);

      // 6. Autenticar con el contexto de autenticación (login real)
      login(
        did,
        authResponse.jwt,
        authResponse.user
      );
      
      setSession(kiltSession);
      setSelectedDid(did);
      setState('connected');
      console.log('[useKiltWallet] Sesión iniciada exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      setState('error');
      if (errorMessage.includes('User rejected')) {
        setState('ready');
      }
    }
  }, [state, login]);

  // Desconectar wallet
  const disconnectWallet = useCallback(() => {
    setSession(null);
    setSelectedDid(null);
    setState('ready');
    setError(null);
  }, []);

  return {
    state,
    error,
    session,
    selectedDid,
    availableDids,
    isConnected: state === 'connected',
    isConnecting: state === 'connecting' || state === 'authorizing' || state === 'authenticating' || state === 'selecting-did',
    isReady: state === 'ready',
    connectWallet,
    disconnectWallet
  };
} 
