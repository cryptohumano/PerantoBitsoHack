"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertCircle,
  X,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Claim {
  id: string
  ctypeId: string
  ctypeName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  data: Record<string, unknown>
  attesterId?: string
  attesterDid?: string
  attestationDate?: string
  rejectionReason?: string
}

export function CitizenHistorialPageClient() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    fetchClaims()
  }, [])

  const fetchClaims = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/claims/my-claims', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar los claims')
      }

      const data = await response.json()
      if (data.success) {
        setClaims(data.data)
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const openClaimDetails = (claim: Claim) => {
    setSelectedClaim(claim)
    setIsDetailModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Aprobado</Badge>
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rechazado</Badge>
      case 'REVOKED':
        return <Badge variant="outline" className="text-red-600">Revocado</Badge>
      case 'CANCELLED':
        return <Badge variant="outline" className="text-orange-600"><X className="h-3 w-3 mr-1" />Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.ctypeName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || claim.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderClaimData = (data: Record<string, unknown>) => {
    if (!data || typeof data !== 'object') {
      return <p className="text-muted-foreground">Sin datos</p>
    }

    return (
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col space-y-1">
            <label className="text-sm font-medium text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </label>
            <div className="text-sm bg-muted p-2 rounded">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const handleCancelClaim = async (claimId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/claims/${claimId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchClaims(); // Recargar la lista
      } else {
        const error = await response.json();
        alert(`Error al cancelar el claim: ${error.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error canceling claim:', error);
      alert('Error al cancelar el claim');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando historial...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Claims</h1>
            <p className="text-muted-foreground">
              Revisa el estado de todos tus claims y credenciales
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchClaims}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{claims.length}</div>
              <p className="text-xs text-muted-foreground">
                Claims realizados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {claims.filter(c => c.status === 'PENDING').length}
              </div>
              <p className="text-xs text-muted-foreground">
                En revisión
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {claims.filter(c => c.status === 'APPROVED').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Credenciales activas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {claims.filter(c => c.status === 'REJECTED').length}
              </div>
              <p className="text-xs text-muted-foreground">
                No aprobados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Claims</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por CType..."
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
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="APPROVED">Aprobados</SelectItem>
                  <SelectItem value="REJECTED">Rechazados</SelectItem>
                  <SelectItem value="REVOKED">Revocados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CType</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Atestador</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No se encontraron claims
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{claim.ctypeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {claim.attesterDid ? (
                          <span className="text-sm">{claim.attesterDid}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openClaimDetails(claim)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {claim.status === 'PENDING' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Cancelar Claim?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <div className="space-y-3">
                                      <p>
                                        ¿Estás seguro de que quieres cancelar este claim?
                                      </p>
                                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-sm text-yellow-800 font-medium">
                                          ⚠️ Advertencia importante:
                                        </p>
                                        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                                          <li>• Cualquier pago realizado por este claim se perderá</li>
                                          <li>• El proceso de solicitud se cancelará completamente</li>
                                          <li>• No podrás recuperar los fondos pagados</li>
                                          <li>• Deberás crear un nuevo claim si deseas intentarlo nuevamente</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, mantener</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleCancelClaim(claim.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Sí, cancelar claim
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
      </div>

      {/* Modal de Detalles del Claim */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalles del Claim
            </DialogTitle>
          </DialogHeader>
          
          {selectedClaim && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {/* Información General */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Información General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ID del Claim</label>
                      <p className="text-sm font-mono bg-muted p-2 rounded">{selectedClaim.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Estado</label>
                      <div className="mt-1">{getStatusBadge(selectedClaim.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CType</label>
                      <p className="text-sm">{selectedClaim.ctypeName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
                      <p className="text-sm">{formatDate(selectedClaim.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Información de Atestación */}
                {selectedClaim.attesterDid && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Información de Atestación
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">DID del Atestador</label>
                          <p className="text-sm font-mono bg-muted p-2 rounded break-all">{selectedClaim.attesterDid}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Fecha de Atestación</label>
                          <p className="text-sm">{selectedClaim.attestationDate ? formatDate(selectedClaim.attestationDate) : 'No disponible'}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Motivo de Rechazo */}
                {selectedClaim.rejectionReason && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Motivo de Rechazo
                      </h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{selectedClaim.rejectionReason}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Datos del Formulario */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Datos del Formulario</h3>
                  {renderClaimData(selectedClaim.data)}
                </div>
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 