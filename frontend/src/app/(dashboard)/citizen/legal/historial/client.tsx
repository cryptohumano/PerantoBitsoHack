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
import { Eye, FileText, Download } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Datos de ejemplo - Esto vendría de la API
const contracts = [
  {
    id: "CT001",
    name: "Contrato de Servicios Profesionales",
    status: "aprobado", // completado, aprobado, rechazado, pendiente
    createdBy: { name: "Juan Pérez", did: "kilt:did:123", web3name: "juanperez" },
    createdAt: "2024-03-15",
    tags: ["servicios", "profesional", "consultoría"],
    pdfUrl: "/docs/CT001.pdf",
    signatures: [
      { name: "Juan Pérez", status: "signed", file: "/signatures/juan.pdf", did: "kilt:did:123", web3name: "juanperez" },
      { name: "María García", status: "pending", file: null, did: "kilt:did:456", web3name: "mariag" },
      { name: "Carlos López", status: "pending", file: null, did: "kilt:did:789", web3name: null }
    ]
  },
  {
    id: "CT002",
    name: "Acuerdo de Confidencialidad",
    status: "completado",
    createdBy: { name: "Ana Martínez", did: "kilt:did:101", web3name: null },
    createdAt: "2024-02-01",
    tags: ["confidencialidad", "nda", "proyecto"],
    pdfUrl: "/docs/CT002.pdf",
    signatures: [
      { name: "Ana Martínez", status: "signed", file: "/signatures/ana.pdf", did: "kilt:did:101", web3name: null },
      { name: "Roberto Sánchez", status: "signed", file: "/signatures/roberto.pdf", did: "kilt:did:102", web3name: "robertos" }
    ]
  },
  {
    id: "CT003",
    name: "Contrato de Arrendamiento",
    status: "rechazado",
    createdBy: { name: "Pedro Gómez", did: "kilt:did:999", web3name: "pedrog" },
    createdAt: "2024-01-10",
    tags: ["arrendamiento", "inmueble"],
    pdfUrl: "/docs/CT003.pdf",
    signatures: [
      { name: "Pedro Gómez", status: "signed", file: "/signatures/pedro.pdf", did: "kilt:did:999", web3name: "pedrog" },
      { name: "Usuario Actual", status: "rejected", file: null, did: "kilt:did:888", web3name: "usuarioactual" }
    ]
  }
]

export default function HistorialContractsClient() {
  const [selectedContract, setSelectedContract] = useState<typeof contracts[0] | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const handleViewDetails = (contract: typeof contracts[0]) => {
    setSelectedContract(contract)
    setShowDetailsDialog(true)
  }

  // Determina el color del estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completado":
        return <Badge variant="default">Completado</Badge>
      case "aprobado":
        return <Badge variant="secondary">Aprobado</Badge>
      case "rechazado":
        return <Badge variant="destructive">Rechazado</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>Lista de contratos en los que has participado</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="min-w-[200px]">Nombre</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead className="min-w-[150px]">Creador</TableHead>
                  <TableHead className="min-w-[150px]">Tags</TableHead>
                  <TableHead className="w-[200px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={contract.name}>{contract.name}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell>
                      <div>{contract.createdBy.name}</div>
                      {contract.createdBy.did && <div className="text-xs text-muted-foreground">DID: {contract.createdBy.did}</div>}
                      {contract.createdBy.web3name && <div className="text-xs text-muted-foreground">web3name: {contract.createdBy.web3name}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contract.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(contract)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Detalles
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={contract.pdfUrl} download>
                          <Download className="h-4 w-4 mr-1" />PDF
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles del Contrato</DialogTitle>
            <DialogDescription>
              Información detallada, descargas y estado de firmas
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica y tags */}
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Información Básica</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">ID:</span>
                      <span>{selectedContract.id}</span>
                      <span className="text-muted-foreground">Nombre:</span>
                      <span>{selectedContract.name}</span>
                      <span className="text-muted-foreground">Creador:</span>
                      <span>{selectedContract.createdBy.name}</span>
                      {selectedContract.createdBy.did && <span className="text-muted-foreground">DID: {selectedContract.createdBy.did}</span>}
                      {selectedContract.createdBy.web3name && <span className="text-muted-foreground">web3name: {selectedContract.createdBy.web3name}</span>}
                      <span className="text-muted-foreground">Fecha de creación:</span>
                      <span>{format(new Date(selectedContract.createdAt), "PPP", { locale: es })}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedContract.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Descargas</h4>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" asChild>
                        <a href={selectedContract.pdfUrl} download>
                          <FileText className="h-4 w-4 mr-1" /> Descargar PDF
                        </a>
                      </Button>
                      {selectedContract.signatures.map((sig, idx) => sig.file && (
                        <Button key={idx} variant="ghost" asChild>
                          <a href={sig.file} download>
                            <Download className="h-4 w-4 mr-1" /> Firma de {sig.name}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              {/* Estado de Firmantes */}
              <div className="border rounded-lg p-4 bg-muted/50 h-[60vh] flex flex-col">
                <h4 className="font-medium mb-4">Estado de Firmantes</h4>
                <div className="flex flex-col gap-2">
                  {selectedContract.signatures.map((sig, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Badge variant={sig.status === "signed" ? "default" : sig.status === "rejected" ? "destructive" : "secondary"}>
                        {sig.status === "signed" ? "Firmado" : sig.status === "rejected" ? "Rechazado" : "Pendiente"}
                      </Badge>
                      <span>{sig.name}</span>
                      {sig.did && <span className="text-xs text-muted-foreground">DID: {sig.did}</span>}
                      {sig.web3name && <span className="text-xs text-muted-foreground">web3name: {sig.web3name}</span>}
                      {sig.file && (
                        <a href={sig.file} download className="ml-auto text-xs underline text-primary">Descargar firma</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/*
============================
EJEMPLO DE PORTADA PDF ENRIQUECIDO
============================

--------------------------------------------------
|                CONTRATO DE SERVICIOS           |
|------------------------------------------------|
| Descripción: Acuerdo para la prestación de     |
| servicios profesionales de consultoría.        |
|------------------------------------------------|
| Tipo de Contrato (CType): Identidad Legal      |
| Hash CType: 0x123456789abcdef                  |
|------------------------------------------------|
| Creador: Juan Pérez (juan@ejemplo.com)         |
| DID: kilt:did:123                              |
| web3name: juanperez                            |
|------------------------------------------------|
| Firmantes:                                     |
|  - Juan Pérez      Firmado   Hash: 0xabc...    |
|    DID: kilt:did:123  web3name: juanperez      |
|  - María García    Pendiente                   |
|    DID: kilt:did:456  web3name: mariag         |
|  - Carlos López    Pendiente                   |
|    DID: kilt:did:789                           |
|------------------------------------------------|
| Atributos requeridos: nombre, curp, rfc        |
| Fecha límite de firma: 29 de marzo de 2024     |
| Vigencia: 14 de abril de 2024                  |
| Tags: servicios, profesional, consultoría      |
| UID: CT001                                     |
|------------------------------------------------|
| Resumen de firmas: 1/3 firmantes han firmado   |
| (Opcional) QR/Hash global para verificación    |
--------------------------------------------------

*/ 