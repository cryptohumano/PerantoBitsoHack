"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { 
  Crown, 
  Users, 
  Shield, 
  FileText, 
  LogOut,
  Home,
  FileCheck,
  Database as DatabaseIcon,
  Settings,
  BarChart3,
  Monitor,
  Network,
  Bell,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminSidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: Home,
      badge: null
    },
    {
      title: "Gestión de Usuarios",
      href: "/admin/users",
      icon: Users,
      badge: "12"
    },
    {
      title: "Gestión de Attesters",
      href: "/admin/attesters",
      icon: Shield,
      badge: "45"
    },
    {
      title: "Gestión de CTypes",
      href: "/admin/ctypes",
      icon: FileText,
      badge: "89"
    },
    {
      title: "Claims y Credenciales",
      href: "/admin/credentials",
      icon: FileCheck,
      badge: "2.3k"
    },
    {
      title: "Base de Datos",
      href: "/admin/database",
      icon: DatabaseIcon,
      badge: null
    },
    {
      title: "Configuración",
      href: "/admin/settings",
      icon: Settings,
      badge: null
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      badge: null
    },
    {
      title: "Red KILT",
      href: "/admin/network",
      icon: Network,
      badge: null
    },
    {
      title: "Monitoreo",
      href: "/admin/monitoring",
      icon: Monitor,
      badge: "2"
    },
    {
      title: "Notificaciones",
      href: "/admin/notifications",
      icon: Bell,
      badge: "5"
    },
    {
      title: "CRM",
      href: "/admin/crm",
      icon: CreditCard,
      badge: null
    }
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 px-4 py-2">
          <Crown className="h-6 w-6 text-yellow-500" />
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Peranto dApp</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-2">
        <SidebarMenu>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="w-full justify-start"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => router.push(item.href)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Sistema Operativo</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
} 