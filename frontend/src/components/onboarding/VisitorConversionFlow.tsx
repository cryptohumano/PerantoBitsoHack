"use client";

import React, { useState, useEffect } from 'react';
import { SporranPromo } from './SporranPromo';
import { PaymentOptions } from './PaymentOptions';
import { X } from 'lucide-react';

type VisitorState = 'checking' | 'no-sporran' | 'has-sporran' | 'payment-options';

export const VisitorConversionFlow: React.FC = () => {
  console.log('🔄 [VisitorConversionFlow] Renderizando flujo de conversión');
  
  const [visitorState, setVisitorState] = useState<VisitorState>('checking');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Esperar a que el servicio KILT esté inicializado antes de verificar
    const checkWithDelay = async () => {
      // Esperar hasta 3 segundos para que el servicio KILT se inicialice
      for (let i = 0; i < 30; i++) {
        const kiltWindow = window as unknown as { kilt?: { sporran?: unknown } };
        if (kiltWindow.kilt?.sporran) {
          console.log('✅ [VisitorConversionFlow] Sporran detectado, procediendo con verificación');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await checkSporranInstallation();
    };
    
    checkWithDelay();
  }, []);

  const checkSporranInstallation = async () => {
    console.log('🔍 [VisitorConversionFlow] Verificando instalación de Sporran...');
    
    try {
      setLoading(true);
      
      // Esperar un poco para que el servicio KILT termine de inicializar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar si Sporran está instalado de manera más robusta
      const kiltWindow = window as unknown as { kilt?: { sporran?: { getDids?: () => Promise<Array<{ did?: string }>> } } };
      const sporran = kiltWindow.kilt?.sporran;
      const sporranInstalled = !!sporran;

      console.log('📱 [VisitorConversionFlow] Sporran instalado:', sporranInstalled);
      
      // Verificación adicional: intentar acceder al servicio KILT si está disponible
      try {
        const { kiltExtensionService } = await import('@/services/kiltExtensionService');
        const service = kiltExtensionService.getInstance();
        const isAvailable = service.isExtensionAvailable();
        console.log('🔍 [VisitorConversionFlow] Servicio KILT disponible:', isAvailable);
        
        if (isAvailable && !sporranInstalled) {
          console.log('⚠️ [VisitorConversionFlow] Servicio KILT dice que está disponible, asumiendo que Sporran está instalado');
          // Si el servicio dice que está disponible, asumir que Sporran está instalado
          setVisitorState('has-sporran');
          return;
        }
      } catch (error) {
        console.log('ℹ️ [VisitorConversionFlow] No se pudo acceder al servicio KILT:', error);
      }

      if (sporranInstalled && sporran?.getDids) {
        // Si tiene Sporran con método getDids, verificar si tiene FullDID
        try {
          console.log('🔍 [VisitorConversionFlow] Verificando FullDID...');
          
          const dids = await sporran.getDids();
          const hasFullDid = dids.some((did: { did?: string }) => did.did && did.did.includes('Full'));
          
          console.log('📊 [VisitorConversionFlow] DIDs encontrados:', dids.length, 'FullDID:', hasFullDid);
          
          if (hasFullDid) {
            // Si tiene FullDID, no mostrar nada (debería autenticarse)
            console.log('✅ [VisitorConversionFlow] Usuario tiene FullDID, no mostrar modal');
            setVisitorState('checking');
          } else {
            // Si tiene Sporran pero no FullDID, mostrar opciones de pago
            console.log('💰 [VisitorConversionFlow] Usuario tiene Sporran pero no FullDID, mostrar opciones de pago');
            setVisitorState('has-sporran');
          }
        } catch (error) {
          console.error('❌ [VisitorConversionFlow] Error verificando DIDs:', error);
          // Si hay error verificando DIDs, asumir que tiene Sporran pero necesita FullDID
          setVisitorState('has-sporran');
        }
      } else if (sporranInstalled) {
        // Si tiene Sporran pero no tiene método getDids, asumir que necesita FullDID
        console.log('📱 [VisitorConversionFlow] Sporran instalado pero sin método getDids, mostrar opciones de pago');
        setVisitorState('has-sporran');
      } else {
        // Si no tiene Sporran, mostrar promoción
        console.log('📥 [VisitorConversionFlow] Usuario no tiene Sporran, mostrar promoción');
        setVisitorState('no-sporran');
      }
    } catch (error) {
      console.error('❌ [VisitorConversionFlow] Error verificando instalación de Sporran:', error);
      // En caso de error, asumir que no tiene Sporran
      setVisitorState('no-sporran');
    } finally {
      setLoading(false);
    }
  };

  const handleSporranContinue = () => {
    console.log('🚀 [VisitorConversionFlow] Usuario continuó desde SporranPromo');
    setVisitorState('payment-options');
  };

  const handlePaymentComplete = () => {
    console.log('✅ [VisitorConversionFlow] Pago completado, redirigiendo al onboarding');
    // Redirigir al onboarding para crear el FullDID
    window.location.href = '/onboarding';
  };

  const handlePaymentBack = () => {
    console.log('⬅️ [VisitorConversionFlow] Usuario regresó desde opciones de pago');
    setVisitorState('no-sporran');
  };

  const handleClose = () => {
    console.log('❌ [VisitorConversionFlow] Usuario cerró el modal');
    // Ocultar el modal completamente
    setVisitorState('checking');
  };

  console.log('🔄 [VisitorConversionFlow] Estado actual:', visitorState);

  // Loading state
  if (loading) {
    console.log('⏳ [VisitorConversionFlow] Mostrando estado de carga');
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Verificando tu wallet...</p>
        </div>
      </div>
    );
  }

  // Si el estado es 'checking', no mostrar nada
  if (visitorState === 'checking') {
    console.log('✅ [VisitorConversionFlow] No mostrar modal - usuario autenticado o con FullDID');
    return null;
  }

  // Renderizar según el estado del visitante
  switch (visitorState) {
    case 'no-sporran':
      console.log('📥 [VisitorConversionFlow] Mostrando SporranPromo');
      return (
        <SporranPromo onContinue={handleSporranContinue} onClose={handleClose} />
      );

    case 'payment-options':
      console.log('💰 [VisitorConversionFlow] Mostrando PaymentOptions');
      return (
        <PaymentOptions 
          onPaymentComplete={handlePaymentComplete}
          onBack={handlePaymentBack}
          onClose={handleClose}
        />
      );

    case 'has-sporran':
      console.log('📱 [VisitorConversionFlow] Mostrando modal de usuario con Sporran');
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
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold">¡Ya tienes Sporran!</h2>
              <p className="text-muted-foreground">
                Ahora necesitas adquirir tu identidad digital para acceder a peranto Ci.Go.
              </p>
              
              <div className="space-y-2">
                <button 
                  onClick={() => setVisitorState('payment-options')}
                  className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  Adquirir Identidad Digital
                </button>
                <p className="text-xs text-muted-foreground">
                  Precio: 150 MXN • Incluye 3 KILT + Credencial verificable
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}; 