"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Eye, 
  CheckCircle, 
  Calendar,
  User,
  FileText,
  Download,
  RefreshCw
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Credential {
  id: string
  claimId: string
  userId: string
  userDid: string
  ctypeId: string
  ctypeName: string
  attesterId: string
  attesterDid: string
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  issuedAt: string
  expiresAt?: string
  revokedAt?: string
  revocationReason?: string
}

export function CredentialsList() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/admin/credentials', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar las credenciales')
      }

      const data = await response.json()
      if (data.success) {
        setCredentials(data.data)
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (credentialId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/admin/credentials/${credentialId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        fetchCredentials() // Recargar la lista
      }
    } catch (error) {
      console.error('Error revoking credential:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Activa</Badge>
      case 'REVOKED':
        return <Badge variant="destructive">Revocada</Badge>
      case 'EXPIRED':
        return <Badge variant="outline" className="text-orange-600">Expirada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredCredentials = credentials.filter(credential => {
    const matchesSearch = credential.ctypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credential.userDid.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credential.attesterDid.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || credential.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando credenciales...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credenciales Emitidas</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por CType, DID usuario o atestador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ACTIVE">Activas</SelectItem>
              <SelectItem value="REVOKED">Revocadas</SelectItem>
              <SelectItem value="EXPIRED">Expiradas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>CType</TableHead>
              <TableHead>Atestador</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Emitida</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCredentials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No se encontraron credenciales
                </TableCell>
              </TableRow>
            ) : (
              filteredCredentials.map((credential) => (
                <TableRow key={credential.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{credential.userDid}</p>
                        <p className="text-sm text-muted-foreground">ID: {credential.userId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{credential.ctypeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{credential.attesterDid}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(credential.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(credential.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {credential.expiresAt ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(credential.expiresAt).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin expiración</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {credential.status === 'ACTIVE' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRevoke(credential.id, "Revocada por el administrador")}
                        >
                          Revocar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 