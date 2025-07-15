import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BadgeCheck, FileText, Layers, ListChecks } from "lucide-react"

export const metadata = { title: "Dashboard de Attester" }

export default function Page() {
  return (
    <DashboardShell>
      <div className="w-full p-6 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Claims Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">0</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="size-5 text-primary" />
              Credenciales Creadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">0</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              CTypes Creados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">0</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="size-5 text-primary" />
              Claims Resueltos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">0</span>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
} 