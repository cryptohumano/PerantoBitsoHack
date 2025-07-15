"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCTypeCreation } from '@/hooks/useCTypeCreation';
import { CreateCTypeModal } from "./CreateCTypeModal";
import { CTypeDetailsModal } from "./CTypeDetailsModal";
import { DeleteCTypeModal } from "./DeleteCTypeModal";
import { KiltStatusIndicator } from "@/components/KiltStatusIndicator";
import { CTypeCreationTest } from "@/components/CTypeCreationTest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Copy,
  Download,
  Eye,
  FileText, 
  MoreHorizontal,
  Plus, 
  Trash2, 
  Upload,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CTypeSchema } from '@/types/ctype';
import { useToast } from "@/hooks/use-toast";
import { kiltExtensionService } from "@/services/kiltExtensionService";

// Interfaz para la respuesta de la API del backend
interface CTypeAPIResponse {
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
}

export default function CTypesManagementPage() {
  const { jwt, user } = useAuth();
  const { toast } = useToast();
  const { createCType } = useCTypeCreation();
  const [ctypes, setCtypes] = useState<CTypeAPIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCType, setSelectedCType] = useState<CTypeAPIResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [selectedCreator, setSelectedCreator] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  // Determinar si el usuario es superadmin
  const isSuperAdmin = user?.did === process.env.NEXT_PUBLIC_ADMIN_DID;

  const fetchCtypes = useCallback(async () => {
    if (!jwt) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/ctypes', {
        headers: { 'Authorization': `Bearer ${jwt}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch CTypes');
      }
      const data = await response.json();
      setCtypes(data.data as CTypeAPIResponse[]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    fetchCtypes();
  }, [fetchCtypes]);

  const handleCreateCType = async (values: { name: string, schema: CTypeSchema, isPublic: boolean, authorizedRoles?: string[], network: 'peregrine' | 'spiritnet', payerType: 'user' | 'system', signerType: 'user' | 'system' }) => {
    if (!jwt) return;
    
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      console.log('[CTypesManagementPage] Iniciando creación de CType:', values);
      console.log('[CTypesManagementPage] Valores específicos:', {
        payerType: values.payerType,
        signerType: values.signerType,
        network: values.network
      });
      
      // Usar el nuevo método unificado que determina el flujo automáticamente
      console.log('[CTypesManagementPage] Usando flujo unificado de creación');
      const result = await createCType(values);

      if (result.success) {
        setIsCreateModalOpen(false);
        await fetchCtypes();
        
        const payerMessage = values.payerType === 'user' 
          ? 'pagando con tu cuenta personal' 
          : 'pagando con la cuenta del sistema';
        
        const signerMessage = values.signerType === 'user'
          ? 'firmado con tu DID personal'
          : 'firmado con el DID del sistema';
        
        toast({
          title: "¡CType creado exitosamente!",
          description: `El CType "${values.name}" ha sido creado y registrado en la blockchain ${payerMessage} y ${signerMessage}.`,
          variant: "success",
        });
      } else {
        throw new Error(result.error || 'Error desconocido al crear el CType');
      }

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setSubmitError(errorMessage);
        toast({
          title: "Error al crear CType",
          description: errorMessage,
          variant: "destructive",
        });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (ctype: CTypeAPIResponse) => {
    setSelectedCType(ctype);
    setIsDetailsModalOpen(true);
  };

  const handleDeletePrompt = (ctype: CTypeAPIResponse) => {
    setSelectedCType(ctype);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (ctypeId: string) => {
    if (!jwt) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/ctypes/${ctypeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el CType');
      }

      await fetchCtypes();
      
      toast({
        title: "CType eliminado",
        description: "El CType ha sido eliminado exitosamente.",
        variant: "success",
      });

    } catch (err) {
      toast({
        title: "Error al eliminar",
        description: err instanceof Error ? err.message : "Ocurrió un error inesperado.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      toast({
        title: "Hash copiado",
        description: "El hash del CType ha sido copiado al portapapeles.",
      });
    } catch {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el hash al portapapeles.",
        variant: "destructive",
      });
    }
  };

  const creators = [...new Set(ctypes.map(c => c.creator?.did).filter(Boolean) as string[])];
  const roles = [...new Set(ctypes.flatMap(c => c.rolePermissions?.map(p => p.role) || []))];
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedNetwork("all");
    setSelectedCreator("all");
    setSelectedRole("all");
  };

  const filteredCtypes = ctypes.filter((ctype) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = term === '' ||
      ctype.name.toLowerCase().includes(term) ||
      ctype.ctypeHash.toLowerCase().includes(term);
    const matchesStatus = selectedStatus === 'all' || ctype.status === selectedStatus;
    const matchesNetwork = selectedNetwork === 'all' || ctype.network === selectedNetwork;
    const matchesCreator = selectedCreator === 'all' || ctype.creator?.did === selectedCreator;
    const matchesRole = selectedRole === 'all' || ctype.rolePermissions?.some(p => p.role === selectedRole);

    return matchesSearch && matchesStatus && matchesNetwork && matchesCreator && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activo</Badge>;
      case "REVOKED": return <Badge variant="destructive">Revocado</Badge>;
      case "DRAFT": return <Badge variant="secondary">Borrador</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNetworkBadge = (network: string) => {
    const isSpiritnet = network === 'SPIRITNET';
    return (
      <Badge variant={isSpiritnet ? "default" : "secondary"}>
        {isSpiritnet ? 'Spiritnet' : 'Peregrine'}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Estado de la extensión KILT */}
      <KiltStatusIndicator />
      
      {/* Componente de prueba para CTypes */}
      <CTypeCreationTest />
      
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Todos los CTypes ({filteredCtypes.length})</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Filtra y administra los CTypes disponibles en el sistema.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsCreateModalOpen(true)}><Plus className="mr-2 h-4 w-4"/>Crear CType</Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  console.log('[CTypesManagementPage] Probando integración con wallet...');
                  await kiltExtensionService.initialize();
                  const dids = await kiltExtensionService.getDidsForSelection();
                  console.log('[CTypesManagementPage] DIDs encontrados:', dids);
                  toast({
                    title: 'Wallet conectada',
                    description: `Encontrados ${dids.length} DIDs en tu wallet`,
                  });
                } catch (error) {
                  console.error('[CTypesManagementPage] Error:', error);
                  toast({
                    title: 'Error de wallet',
                    description: error instanceof Error ? error.message : 'Error desconocido',
                    variant: 'destructive',
                  });
                }
              }}
            >
              Probar Wallet
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Buscar por nombre, hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <FileText className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="REVOKED">Revocado</SelectItem>
                <SelectItem value="DRAFT">Borrador</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="Red" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Redes</SelectItem>
                <SelectItem value="SPIRITNET">Spiritnet</SelectItem>
                <SelectItem value="PEREGRINE">Peregrine</SelectItem>
              </SelectContent>
            </Select>

            {creators.length > 0 && (
              <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                <SelectTrigger className="w-full sm:w-auto">
                  <SelectValue placeholder="Creador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Creadores</SelectItem>
                  {creators.map(creator => (
                    <SelectItem key={creator} value={creator}>{creator.slice(9, 25)}...</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todos los Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleClearFilters} className="sm:ml-auto">
              Limpiar
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : filteredCtypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron CTypes.
            </div>
          ) : (
            <div className="flex-grow rounded-md border overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[200px]">Nombre</TableHead>
                    <TableHead>Hash</TableHead>
                    <TableHead className="hidden lg:table-cell">Red</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden lg:table-cell">Visibilidad</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCtypes.map((ctype) => (
                    <TableRow key={ctype.id}>
                      <TableCell className="font-medium">{ctype.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span>{ctype.ctypeHash.slice(0, 25)}...</span>
                          <button onClick={() => handleCopyHash(ctype.ctypeHash)}>
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {getNetworkBadge(ctype.network)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ctype.status)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {ctype.isPublic ? (
                          <Badge variant="outline">Público</Badge>
                        ) : (
                          <Badge variant="secondary">Restringido</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(ctype.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewDetails(ctype)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyHash(ctype.ctypeHash)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar Hash
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Exportar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Upload className="mr-2 h-4 w-4" />
                              Importar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-500"
                              onClick={() => handleDeletePrompt(ctype)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isCreateModalOpen && (
        <CreateCTypeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateCType}
          isLoading={isSubmitting}
          error={submitError}
        />
      )}

      {selectedCType && isDetailsModalOpen && (
        <CTypeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          ctype={selectedCType}
        />
      )}

      {selectedCType && isDeleteModalOpen && (
        <DeleteCTypeModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          ctype={selectedCType}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
} 