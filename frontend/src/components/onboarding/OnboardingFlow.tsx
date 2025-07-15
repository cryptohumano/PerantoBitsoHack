"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WalletDetection } from './WalletDetection';
import { PaymentFlow } from './PaymentFlow';
import { DidCreation } from './DidCreation';
import { useRouter } from 'next/navigation';

export interface OnboardingStatus {
  status?: {
    status: string;
    [key: string]: unknown;
  };
  canProceedToDid?: boolean;
  kiltTransaction?: {
    hash: string;
    amount: number;
    network: string;
    blockHash: string;
    blockNumber: number;
    sentAt: string;
  };
  hasKiltTransaction?: boolean;
}

export const OnboardingFlow: React.FC = () => {
  console.log('🔄 [OnboardingFlow] Renderizando flujo de onboarding');
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'detection' | 'payment' | 'did-creation'>('detection');
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [kiltAddress, setKiltAddress] = useState<string | null>(null);
  const [showWalletDetection, setShowWalletDetection] = useState(false);



  useEffect(() => {
    // Si hay dirección de wallet en URL, proceder directamente al pago
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const addressParam = urlParams.get('address');
      
      if (addressParam) {
        console.log('✅ [OnboardingFlow] Dirección de wallet detectada en URL:', addressParam);
        setKiltAddress(addressParam);
        setCurrentStep('payment');
        setLoading(false);
        return;
      }
    }

    // Si no hay dirección pero el usuario está autenticado, verificar estado
    if (isAuthenticated) {
      console.log('✅ [OnboardingFlow] Usuario autenticado, verificando estado');
      checkOnboardingStatus();
    } else {
      console.log('👤 [OnboardingFlow] Usuario no autenticado, mostrando detección de wallets');
      setCurrentStep('detection');
      setShowWalletDetection(true);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const checkOnboardingStatus = async () => {
    console.log('🔍 [OnboardingFlow] Verificando estado de onboarding...');
    try {
      setLoading(true);
      
      // Si no hay token, saltar directamente al paso de DID si hay dirección KILT
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ [OnboardingFlow] No hay token, procediendo con dirección KILT disponible');
        if (kiltAddress) {
          setCurrentStep('did-creation');
        } else {
          setCurrentStep('detection');
          setShowWalletDetection(true);
        }
        return;
      }

      const response = await fetch('/api/payments/onboarding-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [OnboardingFlow] Estado de onboarding obtenido:', data);
        setOnboardingStatus(data);
        
        // Determinar el paso actual basado en el estado
        if (data.canProceedToDid) {
          console.log('✅ [OnboardingFlow] Usuario puede proceder a DID, saltando a did-creation');
          setCurrentStep('did-creation');
          // Verificar si ya recibió KILT
          checkKiltTransactionStatus();
        } else if (data.status?.status === 'PAID') {
          console.log('💰 [OnboardingFlow] Usuario ya pagó, verificando KILT...');
          setCurrentStep('payment');
          // Verificar si ya recibió KILT después del pago
          checkKiltTransactionStatus();
        } else {
          console.log('🔍 [OnboardingFlow] Usuario necesita detección de wallets');
          setCurrentStep('detection');
          setShowWalletDetection(true);
        }
      } else {
        console.error('❌ [OnboardingFlow] Error obteniendo estado de onboarding:', response.status);
        // Si hay error de autenticación, proceder con dirección KILT disponible
        if (response.status === 401 && kiltAddress) {
          console.log('⚠️ [OnboardingFlow] Error 401, procediendo con dirección KILT disponible');
          setCurrentStep('did-creation');
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingFlow] Error checking onboarding status:', error);
      // En caso de error, proceder con dirección KILT disponible
      if (kiltAddress) {
        console.log('⚠️ [OnboardingFlow] Error de conexión, procediendo con dirección KILT disponible');
        setCurrentStep('did-creation');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkKiltTransactionStatus = async () => {
    console.log('🔍 [OnboardingFlow] Verificando estado de transacción KILT...');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ [OnboardingFlow] No hay token, asumiendo KILT enviado');
        setOnboardingStatus(prev => ({
          ...prev,
          hasKiltTransaction: true,
          canProceedToDid: true
        }));
        return;
      }

      const response = await fetch('/api/payments/kilt-transaction-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [OnboardingFlow] Estado de transacción KILT obtenido:', data);
        
        if (data.kiltSent) {
          console.log('🎁 [OnboardingFlow] KILT recibido, actualizando estado de onboarding');
          setOnboardingStatus(prev => ({
            ...prev,
            kiltTransaction: data,
            hasKiltTransaction: true,
            canProceedToDid: true
          }));
          
          // Si el usuario ya pagó y recibió KILT, ir directamente a DID
          if (onboardingStatus?.status?.status === 'PAID') {
            console.log('✅ [OnboardingFlow] Usuario pagó y recibió KILT, saltando a did-creation');
            setCurrentStep('did-creation');
          }
        }
      } else {
        console.error('❌ [OnboardingFlow] Error obteniendo estado de transacción KILT:', response.status);
        // Si hay error, asumir que KILT fue enviado si hay dirección
        if (kiltAddress) {
          console.log('⚠️ [OnboardingFlow] Error en transacción KILT, asumiendo enviado');
          setOnboardingStatus(prev => ({
            ...prev,
            hasKiltTransaction: true,
            canProceedToDid: true
          }));
        }
      }
    } catch (error) {
      console.error('❌ [OnboardingFlow] Error checking KILT transaction status:', error);
      // En caso de error, asumir que KILT fue enviado si hay dirección
      if (kiltAddress) {
        console.log('⚠️ [OnboardingFlow] Error de conexión, asumiendo KILT enviado');
        setOnboardingStatus(prev => ({
          ...prev,
          hasKiltTransaction: true,
          canProceedToDid: true
        }));
      }
    }
  };

  const handlePaymentCompleted = () => {
    console.log('✅ [OnboardingFlow] Pago completado, verificando estado de KILT...');
    checkKiltTransactionStatus();
    setCurrentStep('did-creation');
    checkOnboardingStatus();
  };

  const handleDidCreated = () => {
    console.log('✅ [OnboardingFlow] DID creado, redirigiendo al dashboard');
    // Redirigir al dashboard del ciudadano
    router.push('/citizen/');
  };

  const handleSkipToOnboarding = () => {
    console.log('🚀 [OnboardingFlow] Saltando directamente al onboarding');
    setShowWalletDetection(false);
    setCurrentStep('payment');
  };

  const handleWalletsDetected = (address?: string) => {
    console.log('✅ [OnboardingFlow] Wallets detectadas:', address);
    if (address) {
      setKiltAddress(address);
      setCurrentStep('payment');
    } else {
      console.log('⚠️ [OnboardingFlow] No se detectó dirección, mostrando onboarding');
      setCurrentStep('payment');
    }
  };

  if (loading) {
    console.log('⏳ [OnboardingFlow] Mostrando estado de carga');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Verificando estado de onboarding...</p>
        </div>
      </div>
    );
  }

  console.log('🔄 [OnboardingFlow] Estado actual:', {
    currentStep,
    showWalletDetection,
    kiltAddress,
    onboardingStatus
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Bienvenido a peranto Ci.Go
            </h1>
            <p className="text-xl text-muted-foreground">
              Tu identidad digital autosoberana
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${currentStep === 'detection' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'detection' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
                }`}>
                  1
                </div>
                <span className="ml-2">Configurar Wallet</span>
              </div>
              
              <div className={`w-16 h-0.5 ${currentStep === 'payment' || currentStep === 'did-creation' ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
              
              <div className={`flex items-center ${currentStep === 'payment' || currentStep === 'did-creation' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'payment' || currentStep === 'did-creation' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
                }`}>
                  2
                </div>
                <span className="ml-2">Realizar Pago</span>
              </div>
              
              <div className={`w-16 h-0.5 ${currentStep === 'did-creation' ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
              
              <div className={`flex items-center ${currentStep === 'did-creation' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep === 'did-creation' ? 'border-primary bg-primary text-white' : 'border-muted-foreground'
                }`}>
                  3
                </div>
                <span className="ml-2">Crear DID</span>
              </div>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 'detection' && showWalletDetection && (
            <WalletDetection 
              onWalletsDetected={handleWalletsDetected}
              onStatusUpdate={checkOnboardingStatus}
              onSkipToOnboarding={handleSkipToOnboarding}
            />
          )}

          {currentStep === 'payment' && kiltAddress && (
            <PaymentFlow 
              kiltAddress={kiltAddress}
              onPaymentCompleted={handlePaymentCompleted}
              onStatusUpdate={checkOnboardingStatus}
            />
          )}

          {currentStep === 'payment' && !kiltAddress && (
            <div className="text-center text-red-500">
              No se detectó dirección KILT. Por favor, vuelve a conectar tu wallet.
            </div>
          )}

          {currentStep === 'did-creation' && (
            <DidCreation 
              onDidCreated={handleDidCreated}
              onboardingStatus={onboardingStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
}; 