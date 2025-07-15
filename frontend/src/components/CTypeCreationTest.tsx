"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCTypeCreation } from '@/hooks/useCTypeCreation';
import { kiltExtensionService } from '@/services/kiltExtensionService';

export function CTypeCreationTest() {
  const { toast } = useToast();
  const { createCTypeWithWallet, isCreating } = useCTypeCreation();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testWalletConnection = async () => {
    try {
      addResult('🔍 Probando conexión con wallet...');
      
      await kiltExtensionService.initialize();
      
      if (!kiltExtensionService.isExtensionAvailable()) {
        throw new Error('Extensión KILT no disponible');
      }
      
      const dids = await kiltExtensionService.getDidsForSelection();
      addResult(`✅ Wallet conectada. DIDs encontrados: ${dids.length}`);
      addResult(`📋 DIDs: ${dids.join(', ')}`);
      
      toast({
        title: 'Wallet conectada',
        description: `Encontrados ${dids.length} DIDs en tu wallet`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      addResult(`❌ Error: ${errorMessage}`);
      
      toast({
        title: 'Error de wallet',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const testCTypeCreation = async () => {
    try {
      addResult('🚀 Iniciando creación de CType de prueba...');
      
      const testCType = {
        name: 'Test CType - ' + new Date().toISOString(),
        schema: {
          $schema: "http://kilt-protocol.org/draft-01/ctype#",
          title: "Test CType",
          properties: {
            name: {
              type: "string"
            },
            age: {
              type: "integer"
            }
          },
          type: "object"
        },
        isPublic: true,
        authorizedRoles: ['ATTESTER'],
        network: 'peregrine' as const
      } as any; // Usar any temporalmente para evitar problemas de tipos

      addResult('📝 Enviando CType al backend...');
      
      const result = await createCTypeWithWallet(testCType);
      
      if (result.success) {
        addResult(`✅ CType creado exitosamente!`);
        addResult(`🔗 Hash: ${result.data?.ctypeHash}`);
        addResult(`📦 Block: ${result.data?.blockHash}`);
      } else {
        addResult(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      addResult(`❌ Error: ${errorMessage}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🧪 Prueba de Creación de CTypes con Wallet</CardTitle>
        <p className="text-sm text-muted-foreground">
          Prueba la integración completa de creación de CTypes usando tu wallet KILT
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testWalletConnection}
            variant="outline"
            disabled={isCreating}
          >
            🔍 Probar Wallet
          </Button>
          
          <Button 
            onClick={testCTypeCreation}
            disabled={isCreating}
          >
            {isCreating ? '⏳ Creando...' : '🚀 Crear CType de Prueba'}
          </Button>
          
          <Button 
            onClick={clearResults}
            variant="outline"
            size="sm"
          >
            🗑️ Limpiar
          </Button>
        </div>

        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-semibold mb-2">📋 Resultados de Pruebas:</h4>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay resultados aún. Haz clic en "Probar Wallet" para comenzar.
              </p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Nota:</strong> Asegúrate de tener Sporran instalado y una identidad completa creada.</p>
          <p><strong>Red:</strong> Peregrine (testnet) para las pruebas.</p>
        </div>
      </CardContent>
    </Card>
  );
} 