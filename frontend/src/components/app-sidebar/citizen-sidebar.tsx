import { Home, History, CreditCard, MessageSquare, Settings, User, FileText, LogOut, FilePlus2, ListOrdered, BadgeCheck, ChevronDown } from "lucide-react"
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
} from "@/components/ui/sidebar"
import * as Collapsible from "@radix-ui/react-collapsible"

export function CitizenSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <User className="size-6" />
          <span className="font-bold text-lg tracking-tight">Peranto</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/citizen">
                    <Home className="size-4" />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/citizen/historial">
                    <History className="size-4" />
                    <span>Historial</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/citizen/credentials">
                    <CreditCard className="size-4" />
                    <span>Credenciales</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/citizen/chat">
                    <MessageSquare className="size-4" />
                    <span>Chat</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/citizen/settings">
                    <Settings className="size-4" />
                    <span>Ajustes</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>HUB</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/citizen/identity">
                    <User className="size-4" />
                    <span>HUB Identidad</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* HUB Legal colapsable */}
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
                          <a href="/citizen/legal/create">
                            <FilePlus2 className="size-4" />
                            <span>Crear Contrato</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/citizen/legal/sign">
                            <FileText className="size-4" />
                            <span>Firmar Contrato</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/citizen/legal/historial">
                            <ListOrdered className="size-4" />
                            <span>Historial Contratos</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/citizen/legal/verify">
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
  )
} 