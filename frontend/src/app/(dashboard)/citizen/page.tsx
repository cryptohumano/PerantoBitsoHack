"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, User, Shield, Clock, CreditCard, FileText, BadgeCheck, History } from "lucide-react";

export default function CitizenDashboard() {
  const { user, isAuthenticated, logout, did, jwt } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No autenticado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Por favor, inicia sesión para acceder al dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información de autenticación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Estado de Autenticación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">DID:</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs break-all">
                {did}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Rol:</span>
              </div>
              <Badge variant="secondary">
                {user?.roles || 'No especificado'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Token JWT:</span>
            <div className="bg-muted p-2 rounded text-xs font-mono break-all">
              {jwt ? `${jwt.slice(0, 50)}...` : 'No disponible'}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Sesión activa - Los datos se mantienen en localStorage
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credenciales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Disponibles para reclamar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Pendientes de firma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Realizadas este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <CreditCard className="h-6 w-6" />
              <span>Ver Credenciales</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Crear Contrato</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <BadgeCheck className="h-6 w-6" />
              <span>Verificar</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <History className="h-6 w-6" />
              <span>Historial</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 