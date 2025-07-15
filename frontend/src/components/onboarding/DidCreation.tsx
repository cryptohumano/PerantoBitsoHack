"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OnboardingStatus } from './OnboardingFlow';
import { useKiltBalance } from '@/hooks/useKiltBalance';
import { useDidCreation } from '@/hooks/useDidCreation';
import { useSporranDetection } from '@/hooks/useSporranDetection';

interface DidCreationProps {
  onDidCreated: () => void;
  onboardingStatus: OnboardingStatus | null;
}

export const DidCreation: React.FC<DidCreationProps> = ({
  onDidCreated,
  onboardingStatus,
}) => {
  const [didCreated, setDidCreated] = useState(false);
  const { toast } = useToast();
  
  // Obtener la dirección KILT
  const kiltAddress = onboardingStatus?.status?.kiltAddress || 
                     new URLSearchParams(window.location.search).get('address');
  
  // Hook para consultar balance de KILT
  const { balance: kiltBalance, loading: balanceLoading } = useKiltBalance(
    kiltAddress && typeof kiltAddress === 'string' ? kiltAddress : null
  );
  
  // Hook para creación de DID
  const { createFullDid, loading: didLoading } = useDidCreation();
  
  // Hook para detectar Sporran
  const { isAvailable: sporranAvailable } = useSporranDetection();

  useEffect(() => {
    // Verificar si ya se creó el DID
    if (onboardingStatus?.status?.didCreated) {
      setDidCreated(true);
    }
  }, [onboardingStatus]);

  const handleCreateDid = async () => {
    if (!kiltAddress || typeof kiltAddress !== 'string') {
      toast({
        title: "Error",
        description: "No se encontró dirección KILT",
        variant: "destructive",
      });
      return;
    }

    const result = await createFullDid(kiltAddress);
    
    if (result.success && result.didUri) {
      setDidCreated(true);
      // Proceder al dashboard después de un breve delay
      setTimeout(() => {
        onDidCreated();
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear Identidad Digital</CardTitle>
          <CardDescription>
            Ahora puedes crear tu FullDID en KILT para obtener tu identidad digital autosoberana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado del KILT */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h3 className="font-medium">Balance de KILT</h3>
                <p className="text-sm text-muted-foreground">
                  {balanceLoading ? (
                    'Consultando balance...'
                  ) : kiltBalance ? (
                    `${kiltBalance} KILT disponibles`
                  ) : (
                    'Consultando balance de KILT...'
                  )}
                </p>
              </div>
            </div>
            {kiltBalance && (
              <Badge variant="secondary" className="text-xs">
                {kiltBalance} KILT
              </Badge>
            )}
          </div>

          {/* Estado del DID */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {didCreated ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Shield className="w-5 h-5 text-blue-500" />
              )}
              <div>
                <h3 className="font-medium">Identidad Digital</h3>
                <p className="text-sm text-muted-foreground">
                  {didCreated ? 'Identidad digital creada' : 'Pendiente de creación'}
                </p>
              </div>
            </div>
            {!didCreated && (
              <Button 
                onClick={handleCreateDid} 
                disabled={didLoading || !sporranAvailable} 
                className="bg-primary hover:bg-primary/90"
              >
                {didLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : sporranAvailable ? (
                  <Shield className="w-4 h-4 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2" />
                )}
                {didLoading ? 'Creando Identidad...' : sporranAvailable ? 'Obtener Identidad Digital' : 'Instala Sporran'}
              </Button>
            )}
          </div>

          {/* Información adicional */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>¿Qué incluye tu identidad digital?</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• FullDID en la red KILT</li>
                <li>• Credencial verificable de KYC</li>
                <li>• Capacidad para firmar documentos</li>
                <li>• Acceso a servicios de la dApp</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Alerta de Sporran */}
          {!sporranAvailable && !didCreated && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sporran no detectado</strong>
                <p className="mt-1 text-sm">
                  Para crear tu identidad digital, necesitas instalar Sporran. 
                  <a 
                    href="https://www.sporran.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline ml-1"
                  >
                    Descargar Sporran
                  </a>
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Precio desglosado */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Desglose del Pago (150 MXN)</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>3 KILT para FullDID:</span>
                <span>~1 MXN</span>
              </div>
              <div className="flex justify-between">
                <span>Credencial verificable:</span>
                <span>~149 MXN</span>
              </div>
              <div className="border-t pt-1 mt-2">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>150 MXN</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {didCreated && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ¡Felicidades! Tu identidad digital ha sido creada exitosamente. 
            Serás redirigido al dashboard en unos segundos.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 