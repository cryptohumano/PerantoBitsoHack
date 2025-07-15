"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { jwt, activeRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!jwt) {
      router.replace("/");
    } else if (requiredRole && activeRole !== requiredRole) {
      // Si el usuario no tiene el rol activo requerido, redirigir según el rol activo
      if (activeRole === 'ADMIN') {
        router.replace("/admin");
      } else if (activeRole === 'ATTESTER') {
        router.replace("/attester");
      } else {
        router.replace("/citizen");
      }
    }
  }, [jwt, activeRole, requiredRole, router]);

  if (!jwt) return null; // O un loader/spinner
  if (requiredRole && activeRole !== requiredRole) return null;

  return <>{children}</>;
} 