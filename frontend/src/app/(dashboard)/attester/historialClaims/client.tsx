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
import { Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDays, parseISO } from "date-fns"

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

// Datos de ejemplo para historial
const claims: Record<string, Claim> = {
  "7420b5eb-8615-4a73-afaf-72d3d2ff7d6c": {
    cTypeHash: "0xa63b307cf984f259ee1af035c5c321ccaaefc831c1613ba349dea87cd52108ea",
    cTypeTitle: "Woman Way Membership",
    cTypeIssuer: "did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN",
    owner: "did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN",
    contents: {
      name: "Yazareth Sánchez",
      gender: "Femenino",
      industry: "Fintech Web3",
      yearsOfExperience: 9,
      personalInterests: "comunidad de mujeres"
    },
    createdAt: "2025-05-17T20:17:33.211Z",
    network: "spiritnet",
    status: "attested",
    id: "7420b5eb-8615-4a73-afaf-72d3d2ff7d6c",
    attestationData: {
      attestationId: "0x53838452826b4c599037a4ba8a85d75e4c21b7a1dc5f8d4c5bd4021efee09967",
      attester: "did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN",
      blockHash: "0x423ca9cb3c05acc8ef1b8b7ac147b6b826a3a4f7cd81be436d4db265e59cb54b",
      blockNumber: 8747317,
      transactionHash: "0x53838452826b4c599037a4ba8a85d75e4c21b7a1dc5f8d4c5bd4021efee09967",
      timestamp: "2025-05-17T20:18:59.655Z",
      delegationId: null
    }
  },
  "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p": {
    cTypeHash: "0xc85d529cf984f259ee1af035c5c321ccaaefc831c1613ba349dea87cd52108ec",
    cTypeTitle: "Professional Experience",
    cTypeIssuer: "did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN",
    owner: "did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN",
    contents: {
      name: "María González",
      position: "Project Manager",
      company: "Tech Solutions",
      yearsOfExperience: 7,
      skills: ["Agile", "Scrum", "Leadership"]
    },
    createdAt: "2025-05-16T15:45:00.000Z",
    network: "spiritnet",
    status: "rejected",
    id: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
    attestationData: {
      attestationId: "0x64849552826b4c599037a4ba8a85d75e4c21b7a1dc5f8d4c5bd4021efee09968",
      attester: "did:kilt:4tPqLquicoSmq9LP95DVZ4REv7NGW85NzSWSktg3AVoY17fN",
      blockHash: "0x534ca9cb3c05acc8ef1b8b7ac147b6b826a3a4f7cd81be436d4db265e59cb54c",
      blockNumber: 8747318,
      transactionHash: "0x64849552826b4c599037a4ba8a85d75e4c21b7a1dc5f8d4c5bd4021efee09968",
      timestamp: "2025-05-16T16:00:00.000Z",
      delegationId: null
    }
  }
}

export function HistoryClaimsClient() {
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchName, setSearchName] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim)
    setShowDetailsDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "attested":
        return <Badge variant="default">Verificado</Badge>
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredClaims = Object.values(claims).filter((claim) => {
    if (statusFilter !== "all" && claim.status !== statusFilter) return false;
    if (searchName && !String(claim.contents.name).toLowerCase().includes(searchName.toLowerCase())) return false;
    if (dateFrom) {
      const from = parseISO(dateFrom);
      if (new Date(claim.createdAt) < from) return false;
    }
    if (dateTo) {
      const to = addDays(parseISO(dateTo), 1);
      if (new Date(claim.createdAt) > to) return false;
    }
    return true;
  });

  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros avanzados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs mb-1">Buscar por nombre</label>
              <Input placeholder="Ej: Yazareth, María..." value={searchName} onChange={e => setSearchName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="attested">Verificado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs mb-1">Desde</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Hasta</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Historial de Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableCaption>Lista de claims verificados y rechazados</TableCaption>
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
                {filteredClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No se encontraron resultados con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : filteredClaims.map((claim) => (
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
                        <dd>{Array.isArray(value) ? value.join(", ") : value}</dd>
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