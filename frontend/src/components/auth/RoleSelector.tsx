"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Crown } from "lucide-react";

interface RoleSelectorProps {
  onRoleSelected?: () => void;
  showAlways?: boolean;
}

const roleConfig = {
  USER: {
    name: "Ciudadano",
    description: "Acceso a servicios ciudadanos y gestión de credenciales",
    icon: User,
    color: "bg-blue-500",
    path: "/citizen/"
  },
  ATTESTER: {
    name: "Atestador",
    description: "Puede atestar credenciales y gestionar claims",
    icon: Shield,
    color: "bg-green-500",
    path: "/attester/"
  },
  ADMIN: {
    name: "Administrador",
    description: "Acceso completo al sistema y gestión de la dApp",
    icon: Crown,
    color: "bg-purple-500",
    path: "/admin/"
  }
};

export function RoleSelector({ onRoleSelected, showAlways = false }: RoleSelectorProps) {
  const { user, activeRole, setActiveRole } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Si no hay usuario o no tiene múltiples roles, no mostrar
  if (!user || !user.roles || user.roles.length <= 1) {
    if (!showAlways) return null;
  }

  const handleRoleSelect = async (role: string) => {
    setIsLoading(true);
    try {
      console.log("[RoleSelector] Seleccionando rol:", role);
      setActiveRole(role);
      const roleInfo = roleConfig[role as keyof typeof roleConfig];
      if (roleInfo) {
        console.log("[RoleSelector] Redirigiendo a:", roleInfo.path);
        router.push(roleInfo.path);
      }
      onRoleSelected?.();
    } catch (error) {
      console.error("Error cambiando rol:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Selecciona tu rol</CardTitle>
          <CardDescription className="text-center">
            {user?.roles && user.roles.length > 1 
              ? "Tienes múltiples roles disponibles. ¿Con cuál quieres continuar?"
              : "Selecciona el rol con el que quieres acceder al sistema."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {user?.roles?.map((role) => {
            const roleInfo = roleConfig[role as keyof typeof roleConfig];
            const Icon = roleInfo?.icon || User;
            const isActive = activeRole === role;
            
            return (
              <Button
                key={role}
                variant={isActive ? "default" : "outline"}
                className="w-full justify-start h-auto p-4"
                onClick={() => handleRoleSelect(role)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-2 rounded-full ${roleInfo?.color} text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{roleInfo?.name || role}</div>
                    <div className="text-sm text-muted-foreground">
                      {roleInfo?.description}
                    </div>
                  </div>
                  {isActive && (
                    <Badge variant="secondary" className="ml-auto">
                      Activo
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
} 