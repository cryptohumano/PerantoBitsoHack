"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const FullDidDetection: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [hasFullDid, setHasFullDid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      checkFullDid();
    }
  }, [isAuthenticated]);

  const checkFullDid = async () => {
    try {
      setLoading(true);
      
      // Verificar estado de onboarding
      const response = await fetch('/api/payments/onboarding-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Si tiene FullDID o puede proceder a crearlo, permitir acceso
        if (data.canProceedToDid || data.status?.didCreated) {
          setHasFullDid(true);
        } else {
          setHasFullDid(false);
        }
      } else {
        // Si no hay estado de onboarding, verificar si tiene FullDID en Sporran
        const sporran = (window as any).kilt?.sporran;
        if (sporran) {
          try {
            const dids = await sporran.getDids();
            const hasFullDid = dids.some((did: any) => did.did && did.did.includes('Full'));
            setHasFullDid(hasFullDid);
          } catch (error) {
            console.log('Error checking Sporran DIDs:', error);
            setHasFullDid(false);
          }
        } else {
          setHasFullDid(false);
        }
      }
    } catch (error) {
      console.error('Error checking FullDID status:', error);
      setHasFullDid(false);
    } finally {
      setLoading(false);
    }
  };

  const startOnboarding = () => {
    setCheckingOnboarding(true);
    router.push('/onboarding');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Verificando identidad digital...</p>
        </div>
      </div>
    );
  }

  if (hasFullDid === false) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-card border rounded-lg shadow-lg">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-semibold">Identidad Digital Requerida</h2>
            <p className="text-muted-foreground">
              Para acceder a peranto Ci.Go, necesitas tener una identidad digital (FullDID).
            </p>
            
            <Alert>
              <AlertDescription>
                <strong>¿Qué incluye?</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• FullDID en la red KILT</li>
                  <li>• Credencial verificable de KYC</li>
                  <li>• Capacidad para firmar documentos</li>
                  <li>• Acceso completo a la dApp</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button onClick={startOnboarding} className="w-full" disabled={checkingOnboarding}>
                {checkingOnboarding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Obtener Identidad Digital
              </Button>
              <p className="text-xs text-muted-foreground">
                Precio: 150 MXN • Incluye 3 KILT + Credencial verificable
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 