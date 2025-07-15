"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RoleSelector } from "./RoleSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Shield, User } from "lucide-react";

interface RoleRequiredProps {
  children: React.ReactNode;
  requiredRole: string;
  fallbackPath?: string;
}

export function RoleRequired({ children, requiredRole, fallbackPath }: RoleRequiredProps) {
  const { user, activeRole, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }

    // Verificar si el usuario tiene el rol requerido
    const hasRequiredRole = user?.roles?.includes(requiredRole);
    const isCorrectRoleActive = activeRole === requiredRole;

    if (!hasRequiredRole) {
      console.log(`[RoleRequired] Usuario no tiene rol ${requiredRole}`);
      if (fallbackPath) {
        router.replace(fallbackPath);
      } else {
        router.replace("/");
      }
      return;
    }

    if (!isCorrectRoleActive) {
      console.log(`[RoleRequired] Rol ${requiredRole} no está activo, mostrando selector`);
      setShowRoleSelector(true);
      return;
    }

    // Si todo está bien, ocultar el selector
    setShowRoleSelector(false);
  }, [isAuthenticated, user, activeRole, requiredRole, router, fallbackPath]);

  // Si no está autenticado, mostrar loading
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no tiene el rol requerido, mostrar error
  if (!user?.roles?.includes(requiredRole)) {
    const roleConfig = {
      ADMIN: { name: "Administrador", icon: Crown, color: "text-purple-600" },
      ATTESTER: { name: "Atestador", icon: Shield, color: "text-green-600" },
      USER: { name: "Ciudadano", icon: User, color: "text-blue-600" }
    };

    const roleInfo = roleConfig[requiredRole as keyof typeof roleConfig];

    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              {roleInfo?.icon && <roleInfo.icon className={`h-6 w-6 ${roleInfo.color}`} />}
              <span className="font-medium">Se requiere rol de {roleInfo?.name || requiredRole}</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Tu cuenta no tiene los permisos necesarios para acceder a esta sección.
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si el rol no está activo, mostrar selector
  if (showRoleSelector) {
    return (
      <RoleSelector 
        onRoleSelected={() => setShowRoleSelector(false)}
        showAlways={true}
      />
    );
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
} 