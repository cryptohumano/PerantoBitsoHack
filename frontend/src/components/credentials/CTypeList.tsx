"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CTypeSchemaInfo } from "./CTypeSchemaInfo"
import { CTypeFilters } from "./CTypeFilters"
import { CType, useCTypes } from "@/hooks/useCTypes"
import { useAllCTypes } from "@/hooks/useAllCTypes"
import { useAuth } from "@/context/AuthContext"

interface CTypeListProps {
  showAll?: boolean // Si es true, muestra todos los CTypes, si es false solo los disponibles
}

export function CTypeList({ showAll: initialShowAll = false }: CTypeListProps) {
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('ADMIN')
  
  // Usar el hook apropiado según el rol
  const availableCTypesHook = useCTypes()
  const allCTypesHook = useAllCTypes()
  
  const { ctypes: availableCTypes, loading: availableLoading, error: availableError, refetch: availableRefetch } = availableCTypesHook
  const { ctypes: allCTypes, loading: allLoading, error: allError, refetch: allRefetch } = allCTypesHook
  
  const router = useRouter()
  const [claimingCType, setClaimingCType] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(initialShowAll)

  // Determinar qué datos usar según el contexto
  const shouldShowAll = showAll && isAdmin
  const ctypes = shouldShowAll ? allCTypes : availableCTypes
  const loading = shouldShowAll ? allLoading : availableLoading
  const error = shouldShowAll ? allError : availableError
  const refetch = shouldShowAll ? allRefetch : availableRefetch

  const handleClaim = async (ctype: CType) => {
    if (!user) {
      alert("Debes estar autenticado para reclamar una credencial")
      return
    }

    setClaimingCType(ctype.id)
    
    try {
      // Aquí iría la lógica de claim
      // Por ahora solo navegamos al formulario de claim
      router.push(`/citizen/claim/${ctype.id}`)
    } catch (error) {
      console.error("Error al iniciar claim:", error)
      alert("Error al iniciar el proceso de claim")
    } finally {
      setClaimingCType(null)
    }
  }

  const handleToggleView = () => {
    setShowAll(!showAll)
  }

  const ctypesToShow = shouldShowAll ? ctypes : availableCTypes

  if (loading && ctypes.length === 0) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
        <div className="text-center">Cargando credenciales disponibles...</div>
      </div>
    )
  }

  if (error && ctypes.length === 0) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
        <div className="text-center text-red-500">
          Error: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refetch}
            className="ml-2"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6 overflow-x-hidden">
      <CTypeFilters
        showAll={showAll}
        onToggleView={handleToggleView}
        onRefresh={refetch}
        totalCount={isAdmin ? allCTypes.length : availableCTypes.length}
        availableCount={availableCTypes.length}
        loading={loading}
        canToggleView={isAdmin} // Solo admins pueden alternar vista
      />

      {ctypesToShow.length === 0 ? (
        <div className="text-center py-8">
          {showAll ? "No hay credenciales configuradas" : "No hay credenciales disponibles para tu rol"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
          {ctypesToShow.map((ctype) => {
            const isAvailable = availableCTypes.some(available => available.id === ctype.id)
            
            return (
              <div key={ctype.id} className="relative">
                <CTypeSchemaInfo ctype={ctype} />
                
                {/* Botón de acción */}
                <div className="absolute bottom-4 right-4">
                  {isAvailable ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(ctype)}
                      disabled={claimingCType === ctype.id}
                    >
                      {claimingCType === ctype.id ? "Procesando..." : "Reclamar"}
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      No disponible
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
} 