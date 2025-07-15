"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Calendar,
  Hash,
  Network,
  User,
  Shield,
  Code,
  Database
} from "lucide-react";
import { CTypeSchema } from '@/types/ctype';

interface CTypeDetailsModalProps {
  ctype: {
    id: string;
    name: string;
    schema: CTypeSchema;
    ctypeHash: string;
    network: string;
    status: string;
    createdAt: string;
    isPublic: boolean;
    blockNumber?: number;
    blockHash?: string;
    transactionHash?: string;
    creator?: {
      id: string;
      did: string;
    };
    rolePermissions?: {
      id: string;
      role: string;
    }[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CTypeDetailsModal({ ctype, isOpen, onClose }: CTypeDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>;
      case "draft":
        return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Borrador</Badge>;
      case "deprecated":
      case "revoked":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Deprecado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNetworkBadge = (network: string) => {
    const isSpiritnet = network.toLowerCase() === 'spiritnet';
    return (
      <Badge variant={isSpiritnet ? "default" : "secondary"}>
        <Network className="h-3 w-3 mr-1" />
        {isSpiritnet ? 'Spiritnet' : 'Peregrine'}
      </Badge>
    );
  };

  if (!ctype) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles del CType: {ctype.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="text-sm">{ctype.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div>{getStatusBadge(ctype.status)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Red</label>
                  <div>{getNetworkBadge(ctype.network)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Visibilidad</label>
                  <div className="flex items-center gap-2">
                    <Badge variant={ctype.isPublic ? "default" : "secondary"}>
                      <Shield className="h-3 w-3 mr-1" />
                      {ctype.isPublic ? 'Público' : 'Privado'}
                    </Badge>
                    {!ctype.isPublic && ctype.rolePermissions && ctype.rolePermissions.length > 0 && (
                      <div className="ml-2">
                        <p className="text-xs text-muted-foreground">Roles autorizados:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ctype.rolePermissions.map((permission) => (
                            <Badge key={permission.id} variant="outline" className="text-xs">
                              {permission.role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(ctype.createdAt).toLocaleString()}
                  </p>
                </div>
                {ctype.creator && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Creador</label>
                    <p className="text-sm font-mono text-xs flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ctype.creator.did}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información de Blockchain */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Información de Blockchain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    Hash del CType
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted p-2 rounded flex-1 font-mono break-all">
                      {ctype.ctypeHash}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(ctype.ctypeHash, 'hash')}
                    >
                      <Copy className="h-3 w-3" />
                      {copiedField === 'hash' ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                </div>

                {ctype.blockNumber && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Número de Bloque</label>
                    <p className="text-sm font-mono">{ctype.blockNumber}</p>
                  </div>
                )}

                {ctype.blockHash && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Hash del Bloque</label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-2 rounded flex-1 font-mono break-all">
                        {ctype.blockHash}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(ctype.blockHash!, 'blockHash')}
                      >
                        <Copy className="h-3 w-3" />
                        {copiedField === 'blockHash' ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                  </div>
                )}

                {ctype.transactionHash && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Hash de Transacción</label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-2 rounded flex-1 font-mono break-all">
                        {ctype.transactionHash}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(ctype.transactionHash!, 'txHash')}
                      >
                        <Copy className="h-3 w-3" />
                        {copiedField === 'txHash' ? 'Copiado!' : 'Copiar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://spiritnet.subscan.io/extrinsic/${ctype.transactionHash}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Esquema JSON */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="h-5 w-5" />
                Esquema JSON
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="formatted" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="formatted">Formateado</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="formatted" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Título del Esquema</label>
                      <p className="text-sm">{ctype.schema.title}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                      <p className="text-sm">{ctype.schema.type}</p>
                    </div>
                    {ctype.schema.properties && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Propiedades</label>
                        <div className="space-y-2">
                          {Object.entries(ctype.schema.properties).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-mono text-sm">{key}</span>
                              <Badge variant="outline" className="text-xs">
                                {typeof value === 'object' && 'type' in value ? value.type : typeof value}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {ctype.schema.required && ctype.schema.required.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Campos Requeridos</label>
                        <div className="flex flex-wrap gap-1">
                          {ctype.schema.required.map((field) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="raw">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground">JSON Completo</label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(JSON.stringify(ctype.schema, null, 2), 'schema')}
                      >
                        <Copy className="h-3 w-3" />
                        {copiedField === 'schema' ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
                      {JSON.stringify(ctype.schema, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 