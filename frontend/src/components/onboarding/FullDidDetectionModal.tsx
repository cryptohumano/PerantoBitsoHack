"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Key, X } from 'lucide-react';
import { SporranPromo } from './SporranPromo';
import { PaymentOptions } from './PaymentOptions';
import { useSporranDetection, UserState } from '@/hooks/useSporranDetection';

type DetectionState = UserState | 'payment-options';

export const FullDidDetectionModal: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { userState, loading } = useSporranDetection();
  const [detectionState, setDetectionState] = useState<DetectionState>(userState);

  // Sincronizar el estado de detección con el hook
  useEffect(() => {
    setDetectionState(userState);
  }, [userState]);

  const handleSporranContinue = () => {
    setDetectionState('payment-options');
  };

  const handlePaymentComplete = () => {
    // Redirigir al onboarding para crear el FullDID
    router.push('/onboarding');
  };

  const handlePaymentBack = () => {
    setDetectionState('no-sporran');
  };

  const handleClose = () => {
    // Ocultar el modal completamente
    setDetectionState('checking');
  };

  // Si no está autenticado, no mostrar nada
  if (!isAuthenticated) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Verificando tu identidad digital...</p>
        </div>
      </div>
    );
  }

  // Renderizar según el estado de detección
  switch (detectionState) {
    case 'no-sporran':
      return (
        <SporranPromo onContinue={handleSporranContinue} onClose={handleClose} />
      );

    case 'payment-options':
      return (
        <PaymentOptions 
          onPaymentComplete={handlePaymentComplete}
          onBack={handlePaymentBack}
          onClose={handleClose}
        />
      );

    case 'no-full-did':
      return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
          <div className="max-w-md mx-auto p-6 bg-card border rounded-lg shadow-lg my-4 min-h-fit relative">
            {/* Botón de cerrar */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Key className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-semibold">¡Ya tienes Sporran!</h2>
              <p className="text-muted-foreground">
                Ahora necesitas adquirir tu identidad digital para acceder a peranto Ci.Go.
              </p>
              
              <Alert>
                <AlertDescription>
                  <strong>¿Qué incluye tu identidad digital?</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• FullDID en la red KILT</li>
                    <li>• Credencial verificable de KYC</li>
                    <li>• Capacidad para firmar documentos</li>
                    <li>• Acceso completo a la dApp</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button onClick={() => setDetectionState('payment-options')} className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Adquirir Identidad Digital
                </Button>
                <p className="text-xs text-muted-foreground">
                  Precio: 150 MXN • Incluye 3 KILT + Credencial verificable
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    case 'has-full-did':
      // Si tiene FullDID, no mostrar modal y permitir acceso
      return null;

    default:
      return null;
  }
}; 