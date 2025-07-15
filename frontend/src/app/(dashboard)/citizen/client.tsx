"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/dashboard/shared/stats-card"

export function CitizenDashboardClient() {
  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <StatsCard
          title="Attesters de Confianza"
          value="12"
          icon={Shield}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Credenciales Disponibles"
          value="24"
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Solicitudes Activas"
          value="3"
          icon={Users}
        />
        <StatsCard
          title="Credenciales Emitidas"
          value="8"
          icon={FileText}
          trend={{ value: 4, isPositive: true }}
        />
      </div>
      {/* Contenido principal */}
      <Tabs defaultValue="attesters" className="space-y-4">
        <TabsList className="flex flex-wrap w-full min-w-0 gap-x-2 sm:flex-nowrap sm:overflow-x-auto">
          <TabsTrigger className="w-auto min-w-[100px] max-w-[180px] whitespace-normal flex-shrink py-2" value="attesters">Attesters de Confianza</TabsTrigger>
          <TabsTrigger className="w-auto min-w-[100px] max-w-[180px] whitespace-normal flex-shrink py-2" value="credentials">Credenciales Disponibles</TabsTrigger>
          <TabsTrigger className="w-auto min-w-[100px] max-w-[180px] whitespace-normal flex-shrink py-2" value="news">Noticias</TabsTrigger>
          <TabsTrigger className="w-auto min-w-[100px] max-w-[180px] whitespace-normal flex-shrink py-2" value="calendar">Calendario</TabsTrigger>
        </TabsList>
        {/* Attesters de Confianza */}
        <TabsContent value="attesters" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/attester${i}`} />
                    <AvatarFallback>AT{i}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base">Attester {i}</CardTitle>
                    <p className="text-sm text-muted-foreground">Institución {i}</p>
                  </div>
                  <Badge variant="secondary">Verificado</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Especializado en credenciales de identidad y educación
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        {/* Credenciales Disponibles */}
        <TabsContent value="credentials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">Credencial {i}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Descripción de la credencial y sus beneficios
                  </p>
                  <Badge variant="outline">Disponible para claim</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        {/* Noticias */}
        <TabsContent value="news" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base">Noticia {i}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Resumen de la noticia relacionada con identidad digital y tecnología
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        {/* Calendario */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendario de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Calendario de eventos próximos
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 