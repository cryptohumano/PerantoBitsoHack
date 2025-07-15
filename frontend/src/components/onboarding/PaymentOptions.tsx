"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, CreditCard, Coins, Copy, ArrowRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentService } from '@/services/paymentService';

interface PaymentOptionsProps {
  onPaymentComplete: () => void;
  onBack: () => void;
  onClose: () => void;
}

interface PaymentInfo {
  method: 'SPEI' | 'MXNB';
  clabe?: string;
  address?: string;
  reference: string;
  amount: string;
  instructions: string[];
}

export const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  onPaymentComplete,
  onBack,
  onClose
}) => {
  console.log('🔄 [PaymentOptions] Renderizando opciones de pago');
  
  const [selectedMethod, setSelectedMethod] = useState<'SPEI' | 'MXNB'>('SPEI');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [realPaymentData, setRealPaymentData] = useState<Record<string, unknown> | null>(null);
  const { toast } = useToast();

  // Información de pago (en producción esto vendría del backend)
  const paymentData: Record<'SPEI' | 'MXNB', PaymentInfo> = {
    SPEI: {
      method: 'SPEI',
      clabe: '012180001234567890',
      reference: 'CIGO' + Date.now().toString().slice(-6),
      amount: '150.00',
      instructions: [
        'Realiza la transferencia SPEI desde tu banca en línea',
        'Usa la CLABE y referencia proporcionadas',
        'El pago se procesa automáticamente en 1-2 minutos',
        'Recibirás 3 KILT + FullDID + Credencial verificable'
      ]
    },
    MXNB: {
      method: 'MXNB',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      reference: 'CIGO' + Date.now().toString().slice(-6),
      amount: '150.00',
      instructions: [
        'Envía exactamente 150 MXNB a la dirección proporcionada',
        'Incluye la referencia en el campo de memo/nota',
        'El pago se procesa automáticamente en 1-2 minutos',
        'Recibirás 3 KILT + FullDID + Credencial verificable'
      ]
    }
  };

  const handleMethodSelect = (method: 'SPEI' | 'MXNB') => {
    console.log('💰 [PaymentOptions] Método de pago seleccionado:', method);
    setSelectedMethod(method);
    
    // Si tenemos datos reales del backend, usarlos
    if (realPaymentData && realPaymentData[method.toLowerCase()]) {
      const realData = realPaymentData[method.toLowerCase()] as Record<string, string>;
      setPaymentInfo({
        method,
        clabe: realData.clabe || '',
        address: realData.address || '',
        reference: realData.reference || '',
        amount: realData.amount || '150.00',
        instructions: paymentData[method].instructions
      });
    } else {
      // Usar datos mock
      setPaymentInfo(paymentData[method]);
    }
  };

  // Cargar datos de pago reales del backend
  useEffect(() => {
    console.log('📞 [PaymentOptions] Cargando datos de pago del backend...');
    loadRealPaymentData();
  }, []);

  const loadRealPaymentData = async () => {
    try {
      console.log('📞 [PaymentOptions] Obteniendo datos de pago del backend...');
      
      // Llamar al endpoint del backend para obtener datos de pago reales
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          method: selectedMethod,
          amount: '150.00'
        })
      });

      if (response.ok) {
        const backendData = await response.json();
        console.log('✅ [PaymentOptions] Datos de pago obtenidos del backend:', backendData);
        setRealPaymentData(backendData);
        
        // Usar datos del backend si están disponibles, sino usar mock
        setPaymentInfo(paymentData[selectedMethod]);
      } else {
        console.error('❌ [PaymentOptions] Error obteniendo datos de pago:', response.status);
        // Fallback a datos mock
        setPaymentInfo(paymentData[selectedMethod]);
      }
    } catch (error) {
      console.error('❌ [PaymentOptions] Error cargando datos de pago:', error);
      // Fallback a datos mock
      setPaymentInfo(paymentData[selectedMethod]);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    console.log('📋 [PaymentOptions] Copiando al portapapeles:', label);
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: `${label} copiado al portapapeles`,
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const handlePaymentComplete = async () => {
    console.log('🚀 [PaymentOptions] Iniciando proceso de pago...');
    setIsLoading(true);
    try {
      // Primero obtener la dirección KILT usando el nuevo servicio
      const { KiltAddressCaptureService } = await import('@/services/kiltAddressCapture');
      const addressResult = await KiltAddressCaptureService.getKiltAddress();
      
      if (!addressResult.success) {
        console.error('❌ [PaymentOptions] Error obteniendo dirección KILT:', addressResult.error);
        toast({
          title: "Error",
          description: addressResult.error || "Error al obtener dirección KILT",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ [PaymentOptions] Dirección KILT obtenida:', addressResult.kiltAddress);
      
      // Iniciar proceso de pago con el servicio
      const paymentResult = await PaymentService.initiatePayment(selectedMethod);
      
      console.log('📊 [PaymentOptions] Resultado del pago:', paymentResult);
      
      if (paymentResult.success) {
        toast({
          title: "Pago iniciado",
          description: "Se ha capturado tu dirección KILT. Procede con el pago.",
        });
        onPaymentComplete();
      } else {
        console.error('❌ [PaymentOptions] Error en pago:', paymentResult.error);
        toast({
          title: "Error",
          description: paymentResult.error || "Error al iniciar el pago",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [PaymentOptions] Error inesperado:', error);
      toast({
        title: "Error",
        description: "Error de conexión al iniciar el pago",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('🔄 [PaymentOptions] Estado actual:', {
    selectedMethod,
    paymentInfo: !!paymentInfo,
    isLoading
  });

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full mx-auto my-4 min-h-fit relative">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Adquiere tu Identidad Digital
          </CardTitle>
          <CardDescription className="text-lg">
            ¡Ya tienes Sporran! Ahora adquiere tu identidad digital por 150 MXN
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Método de pago */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Selecciona tu método de pago</h3>
            <Tabs value={selectedMethod} onValueChange={(value) => handleMethodSelect(value as 'SPEI' | 'MXNB')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="SPEI" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  SPEI
                </TabsTrigger>
                <TabsTrigger value="MXNB" className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  MXNB
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="SPEI" className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Transferencia SPEI</strong> - Pago directo desde tu banca en línea
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="MXNB" className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pago con MXNB</strong> - Criptomoneda mexicana
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>

          {/* Información de pago */}
          {paymentInfo && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Monto:</span>
                  <Badge variant="secondary">${paymentInfo.amount} MXN</Badge>
                </div>
                
                {paymentInfo.clabe && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">CLABE:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentInfo.clabe!, 'CLABE')}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <code className="block bg-background p-2 rounded text-sm font-mono">
                      {paymentInfo.clabe}
                    </code>
                  </div>
                )}
                
                {paymentInfo.address && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Dirección MXNB:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentInfo.address!, 'Dirección')}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <code className="block bg-background p-2 rounded text-sm font-mono break-all">
                      {paymentInfo.address}
                    </code>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Referencia:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(paymentInfo.reference, 'Referencia')}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <code className="block bg-background p-2 rounded text-sm font-mono">
                    {paymentInfo.reference}
                  </code>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="space-y-3">
                <h4 className="font-semibold">Instrucciones:</h4>
                <div className="space-y-2">
                  {paymentInfo.instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant="secondary" className="w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs mt-0.5">
                        {index + 1}
                      </Badge>
                      <span className="text-sm">{instruction}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={onBack}
              variant="outline"
              className="flex-1"
            >
              Atrás
            </Button>
            <Button 
              onClick={handlePaymentComplete}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verificando pago...
                </>
              ) : (
                <>
                  Ya pagué
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            El pago se procesa automáticamente. Recibirás tu identidad digital en 1-2 minutos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 