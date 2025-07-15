"use client"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, LogOut, Crown, Shield, ChevronDown } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState, useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { user, activeRole, isAuthenticated, logout, setActiveRole } = useAuth();

  // Cerrar con ESC
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Cerrar al hacer clic fuera
  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setSearchOpen(false)
  }

  const handleRoleChange = (role: string) => {
    setActiveRole(role);
    
    // Redirigir según el rol
    switch (role) {
      case 'ADMIN':
        router.push('/admin');
        break;
      case 'ATTESTER':
        router.push('/attester');
        break;
      case 'USER':
        router.push('/citizen');
        break;
      default:
        router.push('/citizen');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4" />;
      case 'ATTESTER':
        return <Shield className="h-4 w-4" />;
      case 'USER':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'ATTESTER':
        return 'Atestador';
      case 'USER':
        return 'Ciudadano';
      default:
        return role;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Obtener el título de la página actual
  const getPageTitle = () => {
    if (!pathname) return "Dashboard";
    
    if (pathname.startsWith("/citizen")) {
      if (pathname === "/citizen") return "Dashboard Ciudadano";
      if (pathname.includes("/credentials")) return "Credenciales";
      if (pathname.includes("/legal")) return "HUB Legal";
      if (pathname.includes("/historial")) return "Historial";
      return "Ciudadano";
    }
    
    if (pathname.startsWith("/attester")) {
      if (pathname === "/attester") return "Dashboard Attester";
      if (pathname.includes("/issueCType")) return "Emitir CTypes";
      if (pathname.includes("/activeClaims")) return "Claims Activos";
      if (pathname.includes("/historialClaims")) return "Historial Claims";
      if (pathname.includes("/legal")) return "HUB Legal";
      return "Attester";
    }
    
    if (pathname.startsWith("/admin")) {
      if (pathname === "/admin") return "Dashboard Administrador";
      if (pathname.includes("/users")) return "Gestión de Usuarios";
      if (pathname.includes("/attesters")) return "Gestión de Attesters";
      if (pathname.includes("/ctypes")) return "Gestión de CTypes";
      if (pathname.includes("/credentials")) return "Claims y Credenciales";
      if (pathname.includes("/database")) return "Base de Datos";
      if (pathname.includes("/settings")) return "Configuración";
      if (pathname.includes("/analytics")) return "Analytics";
      if (pathname.includes("/network")) return "Red KILT";
      if (pathname.includes("/monitoring")) return "Monitoreo";
      if (pathname.includes("/notifications")) return "Notificaciones";
      return "Administrador";
    }
    
    return "Dashboard";
  };

  return (
    <header className="h-16 border-b flex items-center justify-between w-full px-4 md:px-8 gap-4">
      {/* Sección Izquierda: Título y Sidebar */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold truncate">{getPageTitle()}</h1>
      </div>

      {/* Sección Central: Selector de Rol (crece para ocupar el espacio) */}
      <div className="flex-1 flex justify-center">
        {user && user.roles && user.roles.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                {getRoleIcon(activeRole || 'USER')}
                <span className="hidden sm:inline">{getRoleName(activeRole || 'USER')}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Cambiar Rol</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.roles.map((role) => (
                <DropdownMenuItem 
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={activeRole === role ? "bg-accent" : ""}
                >
                  <div className="flex items-center gap-2">
                    {getRoleIcon(role)}
                    <span>{getRoleName(role)}</span>
                    {activeRole === role && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Activo
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Sección Derecha: Iconos y Usuario */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Grupo de Iconos */}
        <div className="flex items-center gap-1">
           <button
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
          <NotificationDropdown />
          <ThemeToggle />
        </div>

        {/* Separador Visual */}
        <div className="h-6 w-px bg-border"></div>

        {/* Dropdown de Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{getRoleName(activeRole || 'USER')}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.did}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuración</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modal de Búsqueda (sin cambios en su lógica) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm"
          onClick={handleClickOutside}
        >
          <div 
            className="bg-background rounded-xl shadow-xl p-4 w-full max-w-lg mx-2 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder="Buscar en toda la aplicación..."
                className="pl-10 h-12 text-base"
                autoFocus
              />
            </div>
            <div className="min-h-[100px] flex items-center justify-center text-muted-foreground border-t border-border pt-4 mt-2">
              <span className="text-sm">Inicia tu búsqueda para ver resultados.</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 