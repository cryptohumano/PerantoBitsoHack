"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { AlertCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOneTimePayment } from '@/hooks/useOneTimePayment';
import { useKiltTransactionStatus } from '@/hooks/useKiltTransactionStatus';

interface PaymentFlowProps {
  onPaymentCompleted: () => void;
  onStatusUpdate: () => void;
  kiltAddress: string;
}

export const PaymentFlow: React.FC<PaymentFlowProps> = ({
  onPaymentCompleted,
  onStatusUpdate,
  kiltAddress,
}) => {
  // HOOKS AL INICIO
  const { toast } = useToast();
  const { loading, result, error, initiateOneTimePayment } = useOneTimePayment();
  const [payerName, setPayerName] = useState('');
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [accounts, setAccounts] = useState<Array<{address: string; meta: {name: string}}>>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<{address: string; meta: {name: string}} | null>(null);
  
  // Hook para verificar estado de transacción KILT
  const { status: kiltStatus, loading: kiltStatusLoading, checkStatus: checkKiltStatus } = useKiltTransactionStatus(result?.bitsoPaymentId || null);
  const [kiltDetected, setKiltDetected] = useState(false);
  
  // Debug: mostrar información del estado
  console.log('🔍 [PaymentFlow] Estado actual:', {
    paymentId: result?.bitsoPaymentId,
    kiltStatus,
    kiltStatusLoading,
    kiltSent: kiltStatus?.kiltSent,
    kiltDetected
  });

  // Inicializar cuentas usando la dirección recibida
  useEffect(() => {
    setAccountsLoading(true);
    if (kiltAddress) {
      const account = {
        address: kiltAddress,
        meta: { name: 'Cuenta seleccionada' }
      };
      setAccounts([account]);
      setSelectedAccount(account);
      console.log('✅ [PaymentFlow] Cuenta configurada con dirección proporcionada:', kiltAddress);
    } else {
      setAccounts([]);
      setSelectedAccount(null);
      console.error('❌ [PaymentFlow] No se proporcionó dirección KILT');
    }
    setAccountsLoading(false);
  }, [kiltAddress]);

  // Polling para verificar si el KILT fue enviado
  useEffect(() => {
    if (result?.bitsoPaymentId && !kiltDetected) {
      console.log('🔄 [PaymentFlow] Iniciando polling para paymentId:', result.bitsoPaymentId);
      
      // Verificar inmediatamente
      checkKiltStatus();
      
      // Si ya se envió KILT, marcar como detectado y detener polling
      if (kiltStatus?.kiltSent) {
        console.log('✅ [PaymentFlow] KILT ya enviado, deteniendo polling');
        setKiltDetected(true);
        return;
      }
      
      // Polling cada 15 segundos (menos agresivo)
      const interval = setInterval(async () => {
        console.log('🔍 [PaymentFlow] Verificando estado de transacción KILT...');
        await checkKiltStatus();
      }, 15000);
      
      return () => {
        console.log('🛑 [PaymentFlow] Deteniendo polling');
        clearInterval(interval);
      };
    }
  }, [result, checkKiltStatus, kiltStatus?.kiltSent, kiltDetected]);

  // Cuando el KILT es enviado, notificar al componente padre
  useEffect(() => {
    if (kiltStatus?.kiltSent) {
      console.log('✅ [PaymentFlow] KILT enviado exitosamente:', kiltStatus);
      onPaymentCompleted();
    }
  }, [kiltStatus, onPaymentCompleted]);

  // FUNCIONES
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Información copiada al portapapeles",
    });
  };

  const handleStartPayment = () => {
    if (!selectedAccount?.address || !payerName) {
      return;
    }
    initiateOneTimePayment(selectedAccount.address, 150, payerName);
    setPaymentStarted(true);
  };

  // RETURNS CONDICIONALES
  if (accountsLoading) {
    return <div>Cargando cuentas KILT/Substrate...</div>;
  }

  if (!selectedAccount) {
    if (!accounts.length) {
      return <div>No se detectaron cuentas en Sporran/Polkadot Extension.</div>;
    }
    return (
      <div>
        <h2 className="mb-4">Selecciona la cuenta a la que se transferirán los fondos:</h2>
        <ul className="mb-4">
          {accounts.map((acc) => (
            <li key={acc.address} className="mb-2">
              <input
                type="radio"
                checked={selectedAccount?.address === acc.address}
                onChange={() => setSelectedAccount(acc)}
                className="mr-2"
              />
              <span className="font-mono">{acc.meta.name} - {acc.address}</span>
            </li>
          ))}
        </ul>
        <Button
          disabled={!selectedAccount}
          onClick={() => setSelectedAccount(selectedAccount)}
        >
          Usar esta cuenta
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Preparando pago...</p>
        </div>
      </div>
    );
  }

  // RENDER PRINCIPAL
  return (
    <div className="space-y-6">
      {!paymentStarted ? (
        <div>
          <input
            type="text"
            placeholder="Nombre del pagador"
            value={payerName}
            onChange={e => setPayerName(e.target.value)}
            className="input input-bordered mb-4"
          />
          <Button onClick={handleStartPayment} disabled={loading || !payerName}>
            Iniciar pago
          </Button>
          {error && (
            <div className="text-red-500 mt-2">
              {error}
            </div>
          )}
        </div>
      ) : loading ? (
        <div>Generando orden de pago...</div>
      ) : result ? (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Realiza una transferencia de <strong>{result.amount} MXN</strong> a la siguiente cuenta:
            </AlertDescription>
          </Alert>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">CLABE</Label>
                <p className="text-sm font-mono">{result.clabe}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.clabe || '')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Referencia</Label>
                <p className="text-sm font-mono">{result.bitsoPaymentId}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(result.bitsoPaymentId || '')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Beneficiario</Label>
                <p className="text-sm">{result.beneficiary}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm font-medium">Expira</Label>
                <p className="text-sm">{result.expirationDate}</p>
              </div>
            </div>
          </div>
          
          {/* Estado de transacción KILT */}
          {kiltStatus && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-2">Estado de transacción KILT</h4>
              {kiltStatusLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Verificando envío de KILT...</span>
                </div>
              ) : kiltStatus.kiltSent ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">KILT enviado exitosamente</span>
                  </div>
                  {kiltStatus.kiltTransactionHash && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Hash:</span> {kiltStatus.kiltTransactionHash}
                    </div>
                  )}
                  {kiltStatus.kiltBlockNumber && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Bloque:</span> {kiltStatus.kiltBlockNumber}
                    </div>
                  )}
                  {kiltStatus.kiltAmount && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Cantidad:</span> {kiltStatus.kiltAmount} KILT
                    </div>
                  )}
                  {kiltStatus.kiltNetwork && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Red:</span> {kiltStatus.kiltNetwork}
                    </div>
                  )}
                  {kiltStatus.kiltSentAt && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Enviado:</span> {new Date(kiltStatus.kiltSentAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Esperando envío de KILT...</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}; 