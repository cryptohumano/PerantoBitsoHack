"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Trash2, 
  FileText,
  X
} from "lucide-react";

interface DeleteCTypeModalProps {
  ctype: {
    id: string;
    name: string;
    ctypeHash: string;
    network: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ctypeId: string) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteCTypeModal({ 
  ctype, 
  isOpen, 
  onClose, 
  onConfirm, 
  isDeleting 
}: DeleteCTypeModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!ctype) return;
    
    setError(null);
    try {
      await onConfirm(ctype.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el CType');
    }
  };

  if (!ctype) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Eliminar CType
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El CType será eliminado permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del CType a eliminar */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="font-medium">{ctype.name}</h4>
                <p className="text-sm text-muted-foreground font-mono break-all">
                  {ctype.ctypeHash}
                </p>
                <p className="text-xs text-muted-foreground">
                  Red: {ctype.network}
                </p>
              </div>
            </div>
          </div>

          {/* Advertencia */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Advertencia:</strong> Al eliminar este CType:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>No se podrán crear nuevas credenciales con este esquema</li>
                <li>Las credenciales existentes seguirán siendo válidas</li>
                <li>Esta acción no se puede deshacer</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar CType
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 