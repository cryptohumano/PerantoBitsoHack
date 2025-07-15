"use client";

import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useKiltWallet } from "../../hooks/useKiltWallet";
import { authService } from "../../services/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { IEncryptedMessageV1 } from '@kiltprotocol/kilt-extension-api';

export function LoginForm() {
  const { login } = useAuth();
  const { 
    error,
    session,
    isConnected,
    isConnecting,
    isReady,
    connectWallet,
    disconnectWallet
  } = useKiltWallet();

  // Configurar el listener para mensajes encriptados cuando se establece la sesión
  useEffect(() => {
    if (session) {
      session.listen(async (message: any) => {
        try {
          console.log('[LoginForm] Mensaje recibido de Sporran:', message);
          
          // Crear la solicitud de sesión con los datos del challenge
          const sessionRequest = {
            name: 'Peranto Ci.Go',
            encryptionKeyUri: 'encryptionKeyUri' in session ? session.encryptionKeyUri : '',
            challenge: message?.content?.challenge || message?.body?.content?.challenge || ''
          };

          // Crear la respuesta de sesión con los datos de Sporran
          const sessionResponse = {
            encryptionKeyUri: 'encryptionKeyUri' in session ? session.encryptionKeyUri : '',
            encryptedChallenge: 'encryptedChallenge' in session ? session.encryptedChallenge : '',
            nonce: 'nonce' in session ? session.nonce : '',
          };

          console.log('[LoginForm] Enviando datos de sesión al backend:', {
            sessionRequest,
            sessionResponse
          });

          // Verificar el challenge firmado con el backend
          const authResponse = await authService.verifyChallenge(sessionRequest, sessionResponse);

          // Iniciar sesión con los datos recibidos
          const did = 'encryptionKeyUri' in session 
            ? session.encryptionKeyUri.split('#')[0]
            : '';
          login(did, authResponse.jwt, authResponse.user);
        } catch (err: unknown) {
          console.error("Error al verificar el challenge:", err);
        }
      });
    }
  }, [session, login]);

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Conectar Wallet</CardTitle>
        <CardDescription>
          Conecta tu wallet de Sporran para acceder a la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          onClick={isConnected ? disconnectWallet : connectWallet}
          disabled={!isReady || isConnecting}
          className="w-full"
        >
          {isConnected ? 'Desconectar' : isConnecting ? 'Conectando...' : 'Conectar Wallet'}
        </Button>
      </CardContent>
    </Card>
  );
} 