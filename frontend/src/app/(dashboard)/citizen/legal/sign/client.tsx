"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, FileText, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useMediaQuery } from "@/hooks/use-media-query"

// Datos de ejemplo - Esto vendría de la API
const contracts = [
  {
    id: "CT001",
    name: "Contrato de Servicios Profesionales",
    description: "Acuerdo para la prestación de servicios profesionales de consultoría.",
    status: "pending",
    createdBy: { name: "Juan Pérez", did: "kilt:did:123", web3name: "juanperez" },
    createdAt: "2024-03-15",
    validUntil: "2024-04-15",
    signDeadline: "2024-03-30",
    signers: [
      { name: "Juan Pérez", status: "signed", email: "juan@ejemplo.com", did: "kilt:did:123", web3name: "juanperez" },
      { name: "María García", status: "pending", email: "maria@ejemplo.com", did: "kilt:did:456", web3name: "mariag" },
      { name: "Carlos López", status: "pending", email: "carlos@ejemplo.com", did: "kilt:did:789", web3name: null }
    ],
    requiredCredentials: [
      {
        type: "Identidad Legal",
        properties: ["nombre", "curp", "rfc"]
      }
    ],
    tags: ["servicios", "profesional", "consultoría"]
  },
  {
    id: "CT002",
    name: "Acuerdo de Confidencialidad",
    description: "Acuerdo de confidencialidad para el desarrollo de un proyecto.",
    status: "expired",
    createdBy: { name: "Ana Martínez", did: "kilt:did:101", web3name: null },
    createdAt: "2024-02-01",
    validUntil: "2024-03-01",
    signDeadline: "2024-02-15",
    signers: [
      { name: "Ana Martínez", status: "signed", email: "ana@ejemplo.com", did: "kilt:did:101", web3name: null },
      { name: "Roberto Sánchez", status: "signed", email: "roberto@ejemplo.com", did: "kilt:did:102", web3name: "robertos" }
    ],
    requiredCredentials: [
      {
        type: "Identidad Legal",
        properties: ["nombre", "curp"]
      }
    ],
    tags: ["confidencialidad", "nda", "proyecto"]
  }
]

export default function SignContractsClient() {
  const [selectedContract, setSelectedContract] = useState<typeof contracts[0] | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showSignDialog, setShowSignDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showMobileDetails, setShowMobileDetails] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handleViewDetails = (contract: typeof contracts[0]) => {
    setSelectedContract(contract)
    if (isMobile) {
      setShowMobileDetails(true)
    } else {
      setShowDetailsDialog(true)
    }
  }

  const handleSign = (contract: typeof contracts[0]) => {
    setSelectedContract(contract)
    setShowSignDialog(true)
  }

  const handleReject = (contract: typeof contracts[0]) => {
    setSelectedContract(contract)
    setShowRejectDialog(true)
  }

  const confirmSign = () => {
    // TODO: Implementar lógica de firma
    // 1. Abrir wallet para firma
    // 2. Verificar credenciales requeridas
    // 3. Firmar documento
    // 4. Actualizar estado
    setShowSignDialog(false)
  }

  const confirmReject = () => {
    // TODO: Implementar lógica de rechazo
    // 1. Confirmar rechazo
    // 2. Actualizar estado
    setShowRejectDialog(false)
  }

  const ContractDetails = ({ contract }: { contract: typeof contracts[0] }) => (
    <div className="space-y-6">
      {/* Información Básica */}
      <div className="space-y-2">
        <h4 className="font-medium">Información Básica</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">ID:</span>
          <span>{contract.id}</span>
          <span className="text-muted-foreground">Nombre:</span>
          <span>{contract.name}</span>
          <span className="text-muted-foreground">Descripción:</span>
          <span>{contract.description}</span>
          <span className="text-muted-foreground">Creado por:</span>
          <span>{contract.createdBy.name}</span>
          {contract.createdBy.did && <span className="text-xs text-muted-foreground">DID: {contract.createdBy.did}</span>}
          {contract.createdBy.web3name && <span className="text-xs text-muted-foreground">web3name: {contract.createdBy.web3name}</span>}
        </div>
      </div>

      {/* Fechas */}
      <div className="space-y-2">
        <h4 className="font-medium">Fechas</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Creación:</span>
          <span>{format(new Date(contract.createdAt), "PPP", { locale: es })}</span>
          <span className="text-muted-foreground">Vigencia hasta:</span>
          <span>{format(new Date(contract.validUntil), "PPP", { locale: es })}</span>
          <span className="text-muted-foreground">Límite de firma:</span>
          <span>{format(new Date(contract.signDeadline), "PPP", { locale: es })}</span>
        </div>
      </div>

      {/* Firmantes */}
      <div className="space-y-2">
        <h4 className="font-medium">Firmantes</h4>
        <div className="space-y-2">
          {contract.signers.map((signer, index) => (
            <div key={index} className="p-2 bg-muted/50 rounded-md">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Nombre:</span>
                <span>{signer.name}</span>
                {signer.did && <span className="text-xs text-muted-foreground">DID: {signer.did}</span>}
                {signer.web3name && <span className="text-xs text-muted-foreground">web3name: {signer.web3name}</span>}
                <span className="text-muted-foreground">Email:</span>
                <span>{signer.email}</span>
                <span className="text-muted-foreground">Estado:</span>
                <span>
                  <Badge variant={signer.status === "signed" ? "default" : "secondary"}>
                    {signer.status === "signed" ? "Firmado" : "Pendiente"}
                  </Badge>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credenciales Requeridas */}
      <div className="space-y-2">
        <h4 className="font-medium">Credenciales Requeridas</h4>
        <div className="space-y-2">
          {contract.requiredCredentials.map((cred, index) => (
            <div key={index} className="p-2 bg-muted/50 rounded-md">
              <div className="space-y-1">
                <span className="font-medium">{cred.type}</span>
                <div className="flex flex-wrap gap-1">
                  {cred.properties.map((prop, idx) => (
                    <Badge key={idx} variant="outline">{prop}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <h4 className="font-medium">Tags</h4>
        <div className="flex flex-wrap gap-1">
          {contract.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
      {/* Vista de Lista */}
      <div className={showMobileDetails ? "hidden md:block" : "block"}>
        <Card>
          <CardHeader>
            <CardTitle>Contratos Pendientes de Firma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Lista de contratos que requieren tu firma</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Nombre del Contrato</TableHead>
                    <TableHead className="w-[120px]">Estado</TableHead>
                    <TableHead className="min-w-[150px]">Creador</TableHead>
                    <TableHead className="w-[200px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.id}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={contract.name}>{contract.name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          contract.status === "pending" ? "default" :
                          contract.status === "expired" ? "destructive" :
                          "secondary"
                        }>
                          {contract.status === "pending" ? "Pendiente" :
                           contract.status === "expired" ? "Expirado" :
                           "Completado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>{contract.createdBy.name}</div>
                        {contract.createdBy.did && <div className="text-xs text-muted-foreground">DID: {contract.createdBy.did}</div>}
                        {contract.createdBy.web3name && <div className="text-xs text-muted-foreground">web3name: {contract.createdBy.web3name}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(contract)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Detalles
                          </Button>
                          {contract.status === "pending" && (
                            <>
                              <Button variant="default" size="sm" onClick={() => handleSign(contract)}>
                                Firmar
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleReject(contract)}>
                                Rechazar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista de Detalles en Móvil */}
      {showMobileDetails && selectedContract && (
        <div className="md:hidden">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setShowMobileDetails(false)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <h2 className="text-lg font-semibold">Detalles del Contrato</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <ContractDetails contract={selectedContract} />
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="border rounded-lg p-4 bg-muted/50 flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Documento del Contrato</h4>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Aquí se mostrará el documento PDF del contrato para su revisión antes de firmar.
                </p>
                <Button variant="outline" disabled>
                  Ver Documento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diálogo de Detalles (Desktop) */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Detalles del Contrato</DialogTitle>
            <DialogDescription>
              Información detallada del contrato y sus requisitos
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panel de Información */}
              <ScrollArea className="max-h-[70vh] pr-4">
                <ContractDetails contract={selectedContract} />
              </ScrollArea>

              {/* Panel del Documento */}
              <div className="border rounded-lg p-4 bg-muted/50 h-[70vh] flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h4 className="font-medium mb-2">Documento del Contrato</h4>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Aquí se mostrará el documento PDF del contrato para su revisión antes de firmar.
                </p>
                <Button variant="outline" disabled>
                  Ver Documento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Firma */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Firma</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas firmar este contrato? Se abrirá tu wallet para confirmar la firma.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmSign}>
              Confirmar Firma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Rechazo */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Rechazo</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas rechazar este contrato? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 