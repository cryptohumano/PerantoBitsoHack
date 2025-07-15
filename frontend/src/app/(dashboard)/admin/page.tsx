"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Shield, 
  FileText, 
  Settings, 
  BarChart3, 
  Database, 
  Key, 
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/shared/stats-card";

export default function AdminDashboard() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Solo los administradores pueden acceder a esta sección.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Usuarios Totales"
          value="1,247"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Attesters Activos"
          value="45"
          icon={Shield}
          trend={{ value: 3, isPositive: true }}
        />
        <StatsCard
          title="CTypes Creados"
          value="89"
          icon={FileText}
          trend={{ value: 7, isPositive: true }}
        />
        <StatsCard
          title="Credenciales Emitidas"
          value="2,341"
          icon={CheckCircle}
          trend={{ value: 156, isPositive: true }}
        />
      </div>

      {/* Estado del Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Base de Datos</span>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operativo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API Backend</span>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operativo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Red KILT</span>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Almacenamiento</span>
              <Badge variant="default" className="bg-yellow-500">
                <AlertTriangle className="h-3 w-3 mr-1" />
                75% Usado
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Nuevos usuarios (24h)</span>
              <span className="font-semibold">23</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Claims pendientes</span>
              <span className="font-semibold">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Verificaciones (24h)</span>
              <span className="font-semibold">89</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Errores del sistema</span>
              <span className="font-semibold text-red-500">2</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones de Administración */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones de Administración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Gestionar Usuarios</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Shield className="h-6 w-6" />
              <span>Gestionar Attesters</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Gestionar CTypes</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Database className="h-6 w-6" />
              <span>Base de Datos</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Key className="h-6 w-6" />
              <span>Configuración</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Globe className="h-6 w-6" />
              <span>Red KILT</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Analytics</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span>Sistema</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertas y Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Almacenamiento al 75%</p>
                <p className="text-xs text-muted-foreground">
                  Considera limpiar datos antiguos o expandir el almacenamiento
                </p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">12 claims pendientes</p>
                <p className="text-xs text-muted-foreground">
                  Requieren atención de los attesters
                </p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 