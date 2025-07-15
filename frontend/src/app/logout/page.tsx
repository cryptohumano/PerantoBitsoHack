"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    // Ejecutar logout inmediatamente al cargar la página
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Cerrando sesión...</p>
      </div>
    </div>
  );
} 