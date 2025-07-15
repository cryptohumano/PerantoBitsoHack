"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"

interface CTypeFiltersProps {
  showAll: boolean
  onToggleView: () => void
  onRefresh: () => void
  totalCount: number
  availableCount: number
  loading?: boolean
  canToggleView?: boolean
}

export function CTypeFilters({ 
  showAll, 
  onToggleView, 
  onRefresh, 
  totalCount, 
  availableCount, 
  loading = false,
  canToggleView = false
}: CTypeFiltersProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {showAll ? "Todas las Credenciales" : "Credenciales Disponibles"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {showAll ? totalCount : availableCount} credencial{(showAll ? totalCount : availableCount) !== 1 ? 'es' : ''} disponible{(showAll ? totalCount : availableCount) !== 1 ? 's' : ''}
            {!showAll && totalCount !== availableCount && (
              <span className="ml-1">
                (de {totalCount} total)
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {showAll ? "Vista completa" : "Solo disponibles"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canToggleView && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onToggleView}
          >
            {showAll ? "Ver disponibles" : "Ver todas"}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  )
} 