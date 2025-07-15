"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { RoleSelector } from "./RoleSelector";

export function RoleManager() {
  const { user, activeRole, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    // Solo mostrar el selector si:
    // 1. El usuario está autenticado
    // 2. Tiene múltiples roles
    // 3. No está en una página específica de rol
    // 4. No hay un rol activo establecido
    if (
      isAuthenticated &&
      user &&
      user.roles &&
      user.roles.length > 1 &&
      !pathname?.startsWith('/citizen/') &&
      !pathname?.startsWith('/attester/') &&
      !pathname?.startsWith('/admin/') &&
      !activeRole
    ) {
      setShowRoleSelector(true);
    } else {
      setShowRoleSelector(false);
    }
  }, [isAuthenticated, user, activeRole, pathname]);

  if (!showRoleSelector) {
    return null;
  }

  return (
    <RoleSelector 
      onRoleSelected={() => setShowRoleSelector(false)} 
    />
  );
} 