"use client";
import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { CitizenSidebar } from "@/components/app-sidebar/citizen-sidebar"
import { AttesterSidebar } from "@/components/app-sidebar/attester-sidebar"
import { AdminSidebar } from "@/components/app-sidebar/admin-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardHeader } from "./dashboard-header"
// import { AdminSidebar } from "@/components/app-sidebar/admin-sidebar" // Si existe

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

function getSidebar(pathname: string) {
  if (pathname.startsWith("/citizen")) return <CitizenSidebar />
  if (pathname.startsWith("/attester")) return <AttesterSidebar />
  if (pathname.startsWith("/admin")) return <AdminSidebar />
  // if (pathname.startsWith("/admin")) return <AdminSidebar />
  return null;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full max-w-[100vw] overflow-hidden">
        {pathname && getSidebar(pathname)}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-auto w-full">
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
} 