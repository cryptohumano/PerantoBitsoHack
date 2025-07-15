import { useState, useEffect } from 'react'
import { CType } from './useCTypes'
import { useAuth } from '@/context/AuthContext'

interface UseAllCTypesReturn {
  ctypes: CType[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useAllCTypes(): UseAllCTypesReturn {
  const [ctypes, setCtypes] = useState<CType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchCTypes = async () => {
    // Solo hacer la llamada si el usuario es admin
    if (!user?.roles?.includes('ADMIN')) {
      setCtypes([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/ctypes', {
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
      console.error('Error fetching all CTypes:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCTypes()
  }, [user?.roles]) // Re-ejecutar cuando cambien los roles del usuario

  return {
    ctypes,
    loading,
    error,
    refetch: fetchCTypes
  }
} 