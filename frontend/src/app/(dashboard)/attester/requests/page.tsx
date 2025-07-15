import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell"
import { RequestsPageClient } from "./client"

export const metadata = { title: "Solicitudes Pendientes" }

export default function Page() {
  return (
    <DashboardShell>
      <RequestsPageClient />
    </DashboardShell>
  )
} 