"use client"

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { kiltExtensionService } from '@/services/kiltExtensionService';

export function KiltStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [extensionInfo, setExtensionInfo] = useState<{
    name: string;
    version: string;
    specVersion?: string;
  } | null>(null);

  useEffect(() => {
    const checkExtension = async () => {
      try {
        await kiltExtensionService.initialize();
        
        if (kiltExtensionService.isExtensionAvailable()) {
          setStatus('available');
          // Obtener información de la extensión si es posible
          const service = kiltExtensionService as unknown as Record<string, unknown>;
          const extension = service.extension;
          if (extension && typeof extension === 'object') {
            const ext = extension as Record<string, unknown>;
            setExtensionInfo({
              name: (ext.name as string) || 'Unknown',
              version: (ext.version as string) || 'Unknown',
              specVersion: ext.specVersion as string | undefined
            });
          }
        } else {
          setStatus('unavailable');
        }
      } catch (error) {
        console.error('[KiltStatusIndicator] Error checking extension:', error);
        setStatus('unavailable');
      }
    };

    checkExtension();
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Verificando...</Badge>;
      case 'available':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Sporran Disponible</Badge>;
      case 'unavailable':
        return <Badge variant="destructive">Sporran No Disponible</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg">
      <div className="text-sm font-medium">Estado KILT:</div>
      {getStatusBadge()}
      {extensionInfo && (
        <div className="text-xs text-muted-foreground">
          {extensionInfo.name} v{extensionInfo.version}
        </div>
      )}
    </div>
  );
} 