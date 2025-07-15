"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RequestsPageClient() {
  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Nuevas Solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Aquí irá la lista de nuevas solicitudes */}
              <p className="text-muted-foreground">
                No hay nuevas solicitudes
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes en Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Aquí irá la lista de solicitudes en proceso */}
              <p className="text-muted-foreground">
                No hay solicitudes en proceso
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 