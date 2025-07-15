"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { jwt, user, activeRole, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !jwt) {
      console.log("[AdminProtectedRoute] No autenticado, redirigiendo a /");
      router.replace("/");
      return;
    }

    // Verificar si el usuario tiene rol de admin
    const hasAdminRole = user?.roles?.includes('ADMIN');
    const isAdminActive = activeRole === 'ADMIN';

    if (!hasAdminRole) {
      console.log("[AdminProtectedRoute] Usuario no tiene rol de admin, redirigiendo");
      router.replace("/");
      return;
    }

    if (!isAdminActive) {
      console.log("[AdminProtectedRoute] Rol admin no está activo, redirigiendo");
      // Si tiene rol admin pero no está activo, redirigir al selector de roles
      router.replace("/");
      return;
    }

    console.log("[AdminProtectedRoute] Acceso permitido al admin");
  }, [isAuthenticated, jwt, user, activeRole, router]);

  // Mostrar loading mientras se verifica
  if (!isAuthenticated || !jwt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Verificar permisos
  const hasAdminRole = user?.roles?.includes('ADMIN');
  const isAdminActive = activeRole === 'ADMIN';

  if (!hasAdminRole || !isAdminActive) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Acceso Denegado</h2>
          <p className="text-muted-foreground mt-2">
            Solo los administradores pueden acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 