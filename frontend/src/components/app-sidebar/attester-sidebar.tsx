import { Home, FileText, BadgeCheck, Settings, LogOut, ListOrdered, ChevronDown, Users, Layers, UserCog } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import * as Collapsible from "@radix-ui/react-collapsible";

export function AttesterSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Users className="size-6" />
          <span className="font-bold text-lg tracking-tight">Peranto</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/attester">
                    <Home className="size-4" />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/attester/issueCType">
                    <Layers className="size-4" />
                    <span>Emitir CTypes</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/attester/activeClaims">
                    <FileText className="size-4" />
                    <span>Claims Activos</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/attester/historialClaims">
                    <ListOrdered className="size-4" />
                    <span>Historial Claims</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/attester/profile">
                    <UserCog className="size-4" />
                    <span>Perfil</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/attester/settings">
                    <Settings className="size-4" />
                    <span>Ajustes</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>HUB Legal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible.Root defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <Collapsible.Trigger asChild>
                    <SidebarMenuButton asChild>
                      <a href="#">
                        <FileText className="size-4" />
                        <span>HUB Legal</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </a>
                    </SidebarMenuButton>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/attester/legal/create">
                            <FileText className="size-4" />
                            <span>Crear Contrato</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/attester/legal">
                            <FileText className="size-4" />
                            <span>Todos los Contratos</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/attester/legal/historial">
                            <ListOrdered className="size-4" />
                            <span>Historial Contratos</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/attester/legal/verify">
                            <BadgeCheck className="size-4" />
                            <span>Verificar Contratos</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </Collapsible.Content>
                </SidebarMenuItem>
              </Collapsible.Root>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/logout">
                <LogOut className="size-4" />
                <span>Cerrar sesión</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
} 