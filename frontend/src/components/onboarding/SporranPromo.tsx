"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Download, Shield, Key, Globe, Zap, X } from 'lucide-react';

interface SporranPromoProps {
  onContinue: () => void;
  onClose: () => void;
}

export const SporranPromo: React.FC<SporranPromoProps> = ({
  onContinue,
  onClose
}) => {
  const handleDownloadSporran = () => {
    window.open('https://www.sporran.org/', '_blank');
  };

  const handleContinue = () => {
    onContinue();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full mx-auto my-4 min-h-fit">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            ¡Bienvenido a peranto Ci.Go!
          </CardTitle>
          <CardDescription className="text-lg">
            Tu identidad digital autosoberana está a un paso de distancia
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Qué es CiGo */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              ¿Qué es peranto Ci.Go?
            </h3>
            <p className="text-muted-foreground">
              peranto Ci.Go es una dApp pública para gestionar tu identidad digital, legal, comercial y académica. 
              <strong> Hecho en México, para el mundo.</strong>
            </p>
          </div>

          {/* Beneficios */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Beneficios de tu identidad digital
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Identidad legal lista para internet</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Privada, autogestionada y revocable</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Firmar contratos y procesos KYC</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Acceso a servicios online</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Chat autenticado con instituciones</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Credenciales verificables</span>
              </div>
            </div>
          </div>

          {/* Precio y valor */}
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Inversión única:</strong> 150 MXN/MXNB
              <br />
              <span className="text-sm text-muted-foreground">
                Incluye: 3 KILT + FullDID + Credencial verificable de KYC
              </span>
            </AlertDescription>
          </Alert>

          {/* Pasos */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">¿Cómo empezar?</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
                <span className="text-sm">Descarga Sporran (tu wallet digital)</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
                <span className="text-sm">Adquiere tu identidad digital (150 MXN)</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
                <span className="text-sm">Accede a todos los servicios de Ci.Go</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleDownloadSporran}
              className="flex-1"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Sporran
            </Button>
            <Button 
              onClick={handleContinue}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Key className="w-4 h-4 mr-2" />
              Ya tengo Sporran
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Sporran es tu wallet digital segura para la red KILT. Es gratuita y de código abierto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 