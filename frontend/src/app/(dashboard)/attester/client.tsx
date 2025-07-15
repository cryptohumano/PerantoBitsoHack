"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AttesterDashboardClient() {
  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Revisa las solicitudes de credenciales
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Credenciales Emitidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Historial de credenciales emitidas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Verifica credenciales existentes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 