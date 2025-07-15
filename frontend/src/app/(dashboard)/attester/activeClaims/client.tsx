"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Claim {
  id: string
  cTypeHash: string
  cTypeTitle: string
  cTypeIssuer: string
  owner: string
  contents: Record<string, string | number | boolean | string[]>
  createdAt: string
  network: string
  status: string
  attestationData?: {
    attestationId: string
    attester: string
    blockHash: string
    blockNumber: number
    transactionHash: string
    timestamp: string
    delegationId: string | null
  }
}

// Simulación de datos
const claims: Record<string, Claim> = {
  "8f3a2b1c-9d4e-5f6g-7h8i-9j0k1l2m3n4o": {
    cTypeHash: "0xb74c418cf984f259ee1af035c5c321ccaaefc831c1613ba349dea87cd52108eb",
    cTypeTitle: "Developer Certification",
    cTypeIssuer: "did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN",
    owner: "did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN",
    contents: {
      name: "Carlos Rodríguez",
      role: "Senior Developer",
      specialization: "Blockchain",
      yearsOfExperience: 5,
      certifications: ["Solidity", "Rust", "Substrate"]
    },
    createdAt: "2025-05-18T10:30:00.000Z",
    network: "spiritnet",
    status: "pending",
    id: "8f3a2b1c-9d4e-5f6g-7h8i-9j0k1l2m3n4o"
  }
}

export function ActiveClaimsClient() {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim)
    setShowDetailsDialog(true)
  }

  const handleAttest = (claimId: string) => {
    // TODO: Implementar lógica de attestación
    console.log("Attest claim:", claimId)
  }

  const handleReject = (claimId: string) => {
    // TODO: Implementar lógica de rechazo
    console.log("Reject claim:", claimId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "attested":
        return <Badge variant="default">Verificado</Badge>
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Claims Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableCaption>Lista de claims que requieren tu verificación</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px] max-w-[180px]">ID</TableHead>
                  <TableHead className="min-w-[220px] max-w-[320px]">Título</TableHead>
                  <TableHead className="min-w-[110px] max-w-[130px]">Estado</TableHead>
                  <TableHead className="min-w-[200px] max-w-[260px]">Solicitante</TableHead>
                  <TableHead className="min-w-[120px] max-w-[150px]">Red</TableHead>
                  <TableHead className="min-w-[180px] max-w-[220px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(claims).map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-mono max-w-[180px] truncate" title={claim.id}>{claim.id.length > 12 ? `${claim.id.slice(0, 12)}...` : claim.id}</TableCell>
                    <TableCell className="max-w-[320px] truncate" title={claim.cTypeTitle}>{claim.cTypeTitle}</TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell className="max-w-[260px]">
                      <div className="text-xs text-muted-foreground truncate" title={String(claim.contents.name)}>
                        {claim.contents.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate" title={claim.owner}>
                        DID: {claim.owner.length > 18 ? `${claim.owner.slice(0, 18)}...` : claim.owner}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{claim.network}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(claim)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Detalles
                        </Button>
                        {claim.status === "pending" && (
                          <>
                            <Button variant="default" size="sm" onClick={() => handleAttest(claim.id)}>
                              <Check className="h-4 w-4 mr-1" />
                              Verificar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleReject(claim.id)}>
                              <X className="h-4 w-4 mr-1" />
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

      {/* Modal de Detalles */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Claim</DialogTitle>
            <DialogDescription>
              Información detallada del claim y sus contenidos
            </DialogDescription>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Información General</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">ID</dt>
                      <dd className="font-mono">{selectedClaim.id}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Título</dt>
                      <dd>{selectedClaim.cTypeTitle}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Estado</dt>
                      <dd>{getStatusBadge(selectedClaim.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Red</dt>
                      <dd>{selectedClaim.network}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Creado</dt>
                      <dd>
                        {formatDistanceToNow(new Date(selectedClaim.createdAt), {
                          addSuffix: true,
                          locale: es
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Contenidos</h4>
                  <dl className="space-y-2 text-sm">
                    {Object.entries(selectedClaim.contents).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-muted-foreground capitalize">{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              {selectedClaim.attestationData && (
                <div>
                  <h4 className="font-medium mb-2">Datos de Attestación</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">ID de Attestación</dt>
                      <dd className="font-mono">{selectedClaim.attestationData.attestationId}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Block Hash</dt>
                      <dd className="font-mono">{selectedClaim.attestationData.blockHash}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Block Number</dt>
                      <dd>{selectedClaim.attestationData.blockNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Transaction Hash</dt>
                      <dd className="font-mono">{selectedClaim.attestationData.transactionHash}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Timestamp</dt>
                      <dd>
                        {formatDistanceToNow(new Date(selectedClaim.attestationData.timestamp), {
                          addSuffix: true,
                          locale: es
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 