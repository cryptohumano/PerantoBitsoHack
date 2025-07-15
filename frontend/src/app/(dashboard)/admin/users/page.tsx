"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Crown,
  User,
  Calendar,
  MoreHorizontal,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";

interface User {
  id: string;
  did: string;
  roles: string[];
  createdAt: string;
  totalClaims: number;
  totalAttestations: number;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { user: currentUser } = useAuth();

  const availableRoles = [
    { id: 'USER', label: 'Usuario', icon: User },
    { id: 'ATTESTER', label: 'Attester', icon: Shield },
    { id: 'ADMIN', label: 'Administrador', icon: Crown }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    if (type === 'error') {
      alert(`${title}: ${message}`);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        showToast("Error", "No hay token de autenticación", "error");
        setLoading(false);
        return;
      }
      
      console.log('Token found:', token.substring(0, 20) + '...');
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        setUsers(data.data);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        showToast("Error", `No se pudieron cargar los usuarios: ${response.status}`, "error");
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showToast("Error", `Error de conexión: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setSelectedRoles([...user.roles]);
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}/roles`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ roles: selectedRoles })
      });

      if (response.ok) {
        showToast("Éxito", "Roles actualizados correctamente");
        fetchUsers(); // Recargar usuarios
        setEditingUser(null);
      } else {
        const error = await response.json();
        showToast("Error", error.error || "Error al actualizar roles", "error");
      }
    } catch (error) {
      console.error('Error updating roles:', error);
      showToast("Error", "Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showToast("Éxito", "Usuario eliminado correctamente");
        fetchUsers(); // Recargar usuarios
      } else {
        const error = await response.json();
        showToast("Error", error.error || "Error al eliminar usuario", "error");
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast("Error", "Error de conexión", "error");
    } finally {
      setDeletingUser(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.did.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.roles.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive" className="bg-purple-500"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case "ATTESTER":
        return <Badge variant="default" className="bg-green-500"><Shield className="h-3 w-3 mr-1" />Attester</Badge>;
      case "USER":
        return <Badge variant="secondary"><User className="h-3 w-3 mr-1" />Usuario</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const isMainAdmin = (user: User) => {
    return user.did === process.env.NEXT_PUBLIC_ADMIN_DID;
  };

  const canEditUser = (user: User) => {
    // No se puede editar el admin principal
    if (isMainAdmin(user)) return false;
    // No se puede editar a sí mismo
    if (user.did === currentUser?.did) return false;
    return true;
  };

  const canDeleteUser = (user: User) => {
    // No se puede eliminar el admin principal
    if (isMainAdmin(user)) return false;
    // No se puede eliminar a sí mismo
    if (user.did === currentUser?.did) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra usuarios, roles y permisos de la dApp
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attesters</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.roles.includes('ATTESTER')).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Attesters activos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.roles.includes('ADMIN')).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Administradores
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              100% del total
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
                  placeholder="Buscar por DID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setSelectedRole("all");
              }}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>DID</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Estadísticas</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">Usuario</div>
                        <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm max-w-[200px] truncate">
                      {user.did}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <div key={role}>{getRoleBadge(role)}</div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Claims: {user.totalClaims}</div>
                      <div>Attestations: {user.totalAttestations}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {canEditUser(user) && (
                          <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={() => handleEditUser(user)}
                          >
                          <Edit className="h-4 w-4" />
                            Editar Roles
                        </DropdownMenuItem>
                        )}
                        {!canEditUser(user) && (
                          <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground" disabled>
                            <AlertTriangle className="h-4 w-4" />
                            {isMainAdmin(user) ? 'Admin Principal' : 'Tu cuenta'}
                        </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {canDeleteUser(user) && (
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-red-600"
                            onClick={() => setDeletingUser(user)}
                          >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                        )}
                        {!canDeleteUser(user) && (
                          <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground" disabled>
                            <AlertTriangle className="h-4 w-4" />
                            {isMainAdmin(user) ? 'Admin Principal' : 'Tu cuenta'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de edición de roles */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Roles de Usuario</DialogTitle>
            <DialogDescription>
              Selecciona los roles que deseas asignar a este usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableRoles.map((role) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={role.id}
                  checked={selectedRoles.includes(role.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRoles([...selectedRoles, role.id]);
                    } else {
                      setSelectedRoles(selectedRoles.filter(r => r !== role.id));
                    }
                  }}
                />
                <label htmlFor={role.id} className="flex items-center gap-2">
                  <role.icon className="h-4 w-4" />
                  {role.label}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRoles} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 