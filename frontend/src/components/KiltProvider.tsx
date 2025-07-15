"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import type { PubSubSessionV1, PubSubSessionV2 } from '@kiltprotocol/kilt-extension-api';
import type { ISessionRequest } from '@/types/kilt';
import { kiltExtensionService } from "@/services/kiltExtensionService";
import { authService } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

type Session = PubSubSessionV1 | PubSubSessionV2;

interface KiltContextType {
  isInitialized: boolean;
  isExtensionAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  session: Session | null;
  connect: () => Promise<Session | null>;
}

const KiltContext = createContext<KiltContextType | null>(null);

export function KiltProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { login } = useAuth();

  // Inicializar el servicio KILT
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[KiltProvider] Inicializando servicio KILT...');
        setIsLoading(true);
        
        await kiltExtensionService.initialize();
        const isAvailable = kiltExtensionService.isExtensionAvailable();
        
        setIsInitialized(true);
        setIsExtensionAvailable(isAvailable);
        console.log('[KiltProvider] Servicio KILT inicializado correctamente');
      } catch (error) {
        console.error('[KiltProvider] Error inicializando servicio KILT:', error);
        setError('Error inicializando servicio KILT: ' + (error instanceof Error ? error.message : String(error)));
        setIsInitialized(false);
        setIsExtensionAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    // Limpiar el observador cuando el componente se desmonte
    return () => {
      // No llamar cleanup aquí para evitar afectar otras instancias
      console.log('[KiltProvider] Componente desmontado');
    };
  }, []);

  const connect = async (): Promise<Session | null> => {
    try {
      if (!kiltExtensionService.isExtensionAvailable()) {
        throw new Error('La extensión Sporran no está disponible');
      }

      // 1. Obtener sessionRequest del backend
      const sessionRequest: ISessionRequest = await authService.getChallenge();
      console.log('[KiltProvider] SessionRequest obtenido:', sessionRequest);

      // 2. Obtener lista de DIDs disponibles para selección
      const dids = await kiltExtensionService.getDidsForSelection();
      if (dids.length === 0) {
        throw new Error('No se encontraron identidades completas (Full DIDs) en Sporran');
      }

      // 3. Iniciar sesión con el DID seleccionado usando las interfaces oficiales
      console.log('[KiltProvider] Iniciando sesión con DID:', dids[0]);
      const { session: newSession, did: selectedDid, sessionResponse } = await kiltExtensionService.startSessionWithSelectedDid(
        dids[0], // Usar el primer DID disponible
        sessionRequest
      );

      setSession(newSession);
      console.log('[KiltProvider] Sesión establecida con DID:', selectedDid);

      // 4. Verificar la sesión con el backend usando las interfaces oficiales
      const authResponse = await authService.verifySession(sessionRequest, sessionResponse, selectedDid);
      
      // 5. Iniciar sesión en el contexto de autenticación
      login(selectedDid, authResponse.jwt, authResponse.user);
      
      console.log('[KiltProvider] Sesión iniciada exitosamente');
      return newSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      console.error('[KiltProvider] Error conectando:', errorMessage);
      throw error;
    }
  };

  return (
    <KiltContext.Provider value={{ isInitialized, isExtensionAvailable, isLoading, error, session, connect }}>
      {children}
    </KiltContext.Provider>
  );
}

export function useKilt() {
  const context = useContext(KiltContext);
  if (!context) {
    throw new Error('useKilt debe ser usado dentro de un KiltProvider');
  }
  return context;
}