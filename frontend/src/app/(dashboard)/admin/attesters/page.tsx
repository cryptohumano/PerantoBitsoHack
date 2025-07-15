"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users,
  Award,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Datos mock para demostración
const mockAttesters = [
  {
    id: "1",
    did: "did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQUijKV",
    name: "Dr. Juan Pérez",
    organization: "Universidad Nacional",
    status: "active",
    verifiedAt: "2024-01-15",
    totalAttestations: 156,
    successRate: 98.5,
    specialties: ["Educación", "Identidad"],
    ctypes: ["Natural Person v1", "Peranto ID MX"]
  },
  {
    id: "2",
    did: "did:kilt:4rZ7Mghx9HnKRzKcJ9bW3dJ6pLmN8qR2sT5uV7wX0yZ1aB",
    name: "Lic. María García",
    organization: "Colegio de Abogados",
    status: "pending",
    verifiedAt: null,
    totalAttestations: 0,
    successRate: 0,
    specialties: ["Legal"],
    ctypes: []
  },
  {
    id: "3",
    did: "did:kilt:4tY8Nihy0IoLSzLdK10cW4eK7qMnO9sT6uV8wX1yZ2aC",
    name: "Ing. Carlos López",
    organization: "Instituto Tecnológico",
    status: "suspended",
    verifiedAt: "2024-01-10",
    totalAttestations: 89,
    successRate: 92.1,
    specialties: ["Tecnología"],
    ctypes: ["Telegram"]
  }
];

export default function AttestersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredAttesters = mockAttesters.filter(attester => {
    const matchesSearch = attester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attester.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attester.did.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || attester.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "suspended":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Suspendido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Gestión de Attesters
          </h1>
          <p className="text-muted-foreground">
            Administra attesters y sus permisos de verificación
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Attester
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attesters</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +3 este mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38</div>
            <p className="text-xs text-muted-foreground">
              84% del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Requieren verificación
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, organización o DID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setSelectedStatus("all");
              }}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de attesters */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Attesters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attester</TableHead>
                <TableHead>Organización</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Estadísticas</TableHead>
                <TableHead>CTypes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttesters.map((attester) => (
                <TableRow key={attester.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <div className="font-medium">{attester.name}</div>
                        <div className="text-sm text-muted-foreground font-mono max-w-[200px] truncate">
                          {attester.did}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{attester.organization}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(attester.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {attester.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">{attester.totalAttestations}</span> verificaciones
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {attester.successRate}% éxito
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {attester.ctypes.map((ctype) => (
                        <Badge key={ctype} variant="secondary" className="text-xs">
                          {ctype}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Ver CTypes
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Gestionar Permisos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {attester.status === "active" ? (
                          <DropdownMenuItem className="flex items-center gap-2 text-yellow-600">
                            <AlertTriangle className="h-4 w-4" />
                            Suspender
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Activar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 