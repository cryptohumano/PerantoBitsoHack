"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2 } from "lucide-react"
import { CType } from "@/hooks/useCTypes"
import { DynamicClaimForm } from "@/components/credentials/DynamicClaimForm"
import { useAuth } from "@/context/AuthContext"

interface ClaimFormClientProps {
  ctypeId: string
}

export function ClaimFormClient({ ctypeId }: ClaimFormClientProps) {
  const [ctype, setCtype] = useState<CType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchCType = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/ctypes/${ctypeId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Error al cargar la información de la credencial')
        }

        const data = await response.json()
        
        if (data.success) {
          setCtype(data.data)
        } else {
          throw new Error(data.error || 'Error desconocido')
        }
      } catch (err) {
        console.error('Error fetching CType:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchCType()
  }, [ctypeId])

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (!user || !ctype) return

    setSubmitting(true)
    
    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ctypeId: ctype.id,
          contents: formData,
          network: ctype.network
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar la solicitud')
      }

      const data = await response.json()
      
      if (data.success) {
        // Redirigir a la página de credenciales con mensaje de éxito
        router.push('/citizen/credentials?success=true')
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (err) {
      console.error('Error submitting claim:', err)
      setError(err instanceof Error ? err.message : 'Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Cargando información de la credencial...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !ctype) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            {error || 'No se pudo cargar la información de la credencial'}
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/citizen/credentials')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a credenciales
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/citizen/credentials')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a credenciales
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold">Reclamar Credencial</h1>
            <Badge variant="outline">{ctype.network}</Badge>
            <Badge variant={ctype.isPublic ? "default" : "secondary"}>
              {ctype.isPublic ? "Público" : "Privado"}
            </Badge>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ctype.name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                Creador: <span className="font-mono">{ctype.creator.did}</span>
              </div>
              {ctype.organization && (
                <div className="text-sm text-muted-foreground">
                  Organización: {ctype.organization.name}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete el formulario con la información requerida para solicitar esta credencial.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Formulario dinámico */}
        <DynamicClaimForm 
          ctype={ctype}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  )
} 