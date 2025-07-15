"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@/services/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  did: string | null;
  jwt: string | null;
  user: User | null;
  activeRole: string | null;
  isAuthenticated: boolean;
  login: (did: string, jwt: string, user: User) => void;
  logout: () => void;
  setActiveRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [did, setDid] = useState<string | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Cargar sesión desde localStorage si existe
    const storedDid = localStorage.getItem("did");
    const storedJwt = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedActiveRole = localStorage.getItem("activeRole");
    
    if (storedDid && storedJwt) {
      console.log("[AuthContext] Cargando sesión desde localStorage");
      setDid(storedDid);
      setJwt(storedJwt);
      setUser(storedUser ? JSON.parse(storedUser) : null);
      
      // Establecer rol activo
      if (storedActiveRole) {
        setActiveRole(storedActiveRole);
      } else if (storedUser) {
        const user = JSON.parse(storedUser);
        // Si no hay rol activo guardado, usar el primer rol disponible
        setActiveRole(user.roles && user.roles.length > 0 ? user.roles[0] : null);
      }
      
      setIsAuthenticated(true);
    } else {
      console.log("[AuthContext] No hay sesión guardada");
      setIsAuthenticated(false);
    }
  }, []);

  // Efecto para detectar expiración del token y cerrar sesión automáticamente
  useEffect(() => {
    if (!jwt) return;
    // Decodificar el JWT para obtener el campo exp
    const parseJwt = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch {
        return null;
      }
    };
    const payload = parseJwt(jwt);
    if (!payload || !payload.exp) return;
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = payload.exp - now;
    if (expiresIn <= 0) {
      // Token ya expirado
      console.log('[AuthContext] Token expirado, cerrando sesión');
      logout();
      return;
    }
    // Programar cierre de sesión cuando expire el token
    const timeout = setTimeout(() => {
      console.log('[AuthContext] Token expirado (timeout), cerrando sesión');
      logout();
    }, expiresIn * 1000);
    return () => clearTimeout(timeout);
  }, [jwt]);

  const login = (did: string, jwt: string, user: User) => {
    console.log("[AuthContext] Iniciando sesión:", { did, user });
    console.log("[AuthContext] DID recibido:", did);
    console.log("[AuthContext] Tipo de DID:", typeof did);
    console.log("[AuthContext] Longitud del DID:", did.length);
    setDid(did);
    setJwt(jwt);
    setUser(user);
    
    // Establecer el primer rol como activo por defecto
    const defaultRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
    setActiveRole(defaultRole);
    
    setIsAuthenticated(true);
    localStorage.setItem("did", did);
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(user));
    if (defaultRole) {
      localStorage.setItem("activeRole", defaultRole);
    }
    console.log("[AuthContext] DID guardado en localStorage:", localStorage.getItem("did"));
    
    // Redirigir a la ruta específica según el rol del usuario
    const getRouteByRole = (role: string): string => {
      switch (role.toLowerCase()) {
        case 'admin':
          return '/admin';
        case 'attester':
          return '/attester';
        case 'user':
        case 'citizen':
          return '/citizen';
        default:
          return '/citizen'; // Ruta por defecto
      }
    };
    
    const targetRoute = defaultRole ? getRouteByRole(defaultRole) : '/citizen';
    console.log("[AuthContext] Redirigiendo a:", targetRoute, "para rol:", defaultRole);
    router.push(targetRoute);
  };

  const logout = () => {
    console.log("[AuthContext] Cerrando sesión");
    setDid(null);
    setJwt(null);
    setUser(null);
    setActiveRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem("did");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
    router.push('/');
  };

  const handleSetActiveRole = (role: string) => {
    console.log("[AuthContext] Cambiando rol activo a:", role);
    setActiveRole(role);
    localStorage.setItem("activeRole", role);
  };

  return (
    <AuthContext.Provider value={{ 
      did, 
      jwt, 
      user, 
      activeRole, 
      isAuthenticated, 
      login, 
      logout, 
      setActiveRole: handleSetActiveRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
} 