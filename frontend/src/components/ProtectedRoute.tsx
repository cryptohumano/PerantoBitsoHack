"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("[ProtectedRoute] Verificando autenticación:", { isAuthenticated });
    
    if (!isAuthenticated) {
      console.log("[ProtectedRoute] Usuario no autenticado, redirigiendo a /...");
      router.replace("/");
    } else {
      console.log("[ProtectedRoute] Usuario autenticado, permitiendo acceso");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    console.log("[ProtectedRoute] Renderizando null mientras se verifica autenticación");
    return null;
  }

  console.log("[ProtectedRoute] Renderizando contenido protegido");
  return <>{children}</>;
} 