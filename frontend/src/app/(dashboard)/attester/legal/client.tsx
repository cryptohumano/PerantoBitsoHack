"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Contract {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  visibility: "public" | "private";
}

const initialContracts: Contract[] = [
  {
    id: "1",
    title: "Contrato de Servicios Legales",
    description: "Asesoría legal para startups.",
    createdAt: "2024-06-01T10:00:00Z",
    visibility: "public",
  },
  {
    id: "2",
    title: "Acuerdo de Confidencialidad",
    description: "Protección de información sensible.",
    createdAt: "2024-06-02T12:00:00Z",
    visibility: "private",
  },
];

export function AttesterLegalClient() {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newContract: Contract = {
      id: (contracts.length + 1).toString(),
      title,
      description,
      createdAt: new Date().toISOString(),
      visibility,
    };
    setContracts([newContract, ...contracts]);
    setTitle("");
    setDescription("");
    setVisibility("private");
  };

  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6 space-y-8">
      {/* Formulario de creación */}
      <Card>
        <CardHeader>
          <CardTitle>Crear nuevo contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleCreate}>
            <div className="flex-1">
              <label className="block text-xs mb-1">Título</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título del contrato" required />
            </div>
            <div className="flex-1">
              <label className="block text-xs mb-1">Descripción</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción breve" />
            </div>
            <div>
              <label className="block text-xs mb-1">Visibilidad</label>
              <Select value={visibility} onValueChange={v => setVisibility(v as "public" | "private") }>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="mt-4 md:mt-0">Crear</Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de contratos */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos legales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableCaption>Lista de contratos creados</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Título</TableHead>
                  <TableHead className="min-w-[300px]">Descripción</TableHead>
                  <TableHead className="min-w-[120px]">Visibilidad</TableHead>
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
                    <TableCell>{new Date(contract.createdAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 