import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export interface CType {
  id: string
  name: string
  schema: Record<string, unknown>
  ctypeHash: string
  ipfsCid?: string
  network: 'SPIRITNET' | 'PEREGRINE'
  status: 'DRAFT' | 'ACTIVE' | 'REVOKED'
  blockNumber?: number
  blockHash?: string
  transactionHash?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    did: string
  }
  organization?: {
    id: string
    name: string
  }
  rolePermissions: Array<{
    id: string
    role: 'USER' | 'ATTESTER' | 'ADMIN'
  }>
}

interface UseCTypesReturn {
  ctypes: CType[]
  loading: boolean
  error: string | null
  refetch: () => void
  availableCTypes: CType[]
}

export function useCTypes(): UseCTypesReturn {
  const [ctypes, setCtypes] = useState<CType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchCTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/ctypes/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar los CTypes')
      }

      const data = await response.json()
      
      if (data.success) {
        setCtypes(data.data)
      } else {
        throw new Error(data.error || 'Error desconocido')
      }
    } catch (err) {
      console.error('Error fetching CTypes:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCTypes()
  }, [])

  // Para el hook, todos los CTypes que recibimos ya están filtrados por disponibilidad
  // pero mantenemos la lógica por si necesitamos filtrar adicionalmente en el futuro
  const availableCTypes = ctypes.filter(ctype => {
    // Solo mostrar CTypes activos
    if (ctype.status !== 'ACTIVE') {
      return false
    }

    // Si es público, está disponible para todos
    if (ctype.isPublic) {
      return true
    }

    // Si es privado, verificar si el usuario tiene permisos
    if (!user || !user.roles) {
      return false
    }

    // Verificar si el usuario tiene alguno de los roles autorizados
    const userRoles = user.roles
    const authorizedRoles = ctype.rolePermissions.map(rp => rp.role)
    
    return userRoles.some(role => authorizedRoles.includes(role as 'USER' | 'ATTESTER' | 'ADMIN'))
  })

  return {
    ctypes,
    loading,
    error,
    refetch: fetchCTypes,
    availableCTypes
  }
} 