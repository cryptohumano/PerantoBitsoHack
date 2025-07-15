"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const contracts = [
  {
    id: "1",
    title: "Contrato de Servicios Legales",
    description: "Asesoría legal para startups.",
    createdAt: "2024-06-01T10:00:00Z",
    visibility: "public",
    status: "pendiente"
  },
  {
    id: "2",
    title: "Acuerdo de Confidencialidad",
    description: "Protección de información sensible.",
    createdAt: "2024-06-02T12:00:00Z",
    visibility: "private",
    status: "pendiente"
  },
];

export function AttesterLegalVerifyClient() {
  const [pending, setPending] = useState(contracts);

  const handleVerify = (id: string) => {
    setPending(pending => pending.filter(c => c.id !== id));
    alert("Contrato verificado");
  };
  const handleReject = (id: string) => {
    setPending(pending => pending.filter(c => c.id !== id));
    alert("Contrato rechazado");
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Contratos pendientes de verificación</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableCaption>Contratos que requieren tu verificación</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Título</TableHead>
                <TableHead className="min-w-[300px]">Descripción</TableHead>
                <TableHead className="min-w-[120px]">Visibilidad</TableHead>
                <TableHead className="min-w-[160px]">Creado</TableHead>
                <TableHead className="min-w-[180px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay contratos pendientes de verificación.
                  </TableCell>
                </TableRow>
              ) : pending.map(contract => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.title}</TableCell>
                  <TableCell>{contract.description}</TableCell>
                  <TableCell>
                    <Badge variant={contract.visibility === "public" ? "default" : "secondary"}>
                      {contract.visibility === "public" ? "Público" : "Privado"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(contract.createdAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" onClick={() => handleVerify(contract.id)}>
                        Verificar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleReject(contract.id)}>
                        Rechazar
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
  );
} 