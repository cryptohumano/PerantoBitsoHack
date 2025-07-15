"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const contracts = [
  {
    id: "1",
    title: "Contrato de Servicios Legales",
    description: "Asesoría legal para startups.",
    createdAt: "2024-06-01T10:00:00Z",
    visibility: "public",
    status: "finalizado"
  },
  {
    id: "2",
    title: "Acuerdo de Confidencialidad",
    description: "Protección de información sensible.",
    createdAt: "2024-06-02T12:00:00Z",
    visibility: "private",
    status: "cancelado"
  },
];

export function AttesterLegalHistorialClient() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Historial de Contratos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableCaption>Contratos finalizados o cancelados</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Título</TableHead>
                <TableHead className="min-w-[300px]">Descripción</TableHead>
                <TableHead className="min-w-[120px]">Visibilidad</TableHead>
                <TableHead className="min-w-[120px]">Estado</TableHead>
                <TableHead className="min-w-[160px]">Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map(contract => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.title}</TableCell>
                  <TableCell>{contract.description}</TableCell>
                  <TableCell>
                    <Badge variant={contract.visibility === "public" ? "default" : "secondary"}>
                      {contract.visibility === "public" ? "Público" : "Privado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contract.status === "finalizado" ? "default" : "destructive"}>
                      {contract.status === "finalizado" ? "Finalizado" : "Cancelado"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(contract.createdAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 