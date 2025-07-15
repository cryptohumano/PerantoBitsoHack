"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Play
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  bitsoPaymentId: string;
  kiltAddress: string;
  amount: number;
  clabe: string;
  beneficiary: string;
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED';
  paymentType: 'SPEI' | 'MXNB';
  requestedAt: string;
  updatedAt: string;
  expirationDate?: string;
  // Información de transacción KILT
  kiltTransactionHash?: string;
  kiltAmount?: number;
  kiltBlockHash?: string;
  kiltBlockNumber?: number;
  kiltNetwork?: 'SPIRITNET' | 'PEREGRINE';
  kiltSentAt?: string;
}

export default function CRMPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [mockDepositDialog, setMockDepositDialog] = useState(false);
  const [mockAmount, setMockAmount] = useState("");
  const [mockReceiverName, setMockReceiverName] = useState("");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 [CRMPage] Token encontrado:', !!token);

      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      } else {
        console.error('❌ [CRMPage] Error fetching payments:', response.status);
        toast({
          title: "Error",
          description: "No se pudieron cargar los pagos",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [CRMPage] Error:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMockDeposit = async () => {
    if (!selectedPayment || !mockAmount || !mockReceiverName) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments/mock-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bitsoPaymentId: selectedPayment.bitsoPaymentId,
          amount: parseFloat(mockAmount),
          receiver_name: mockReceiverName,
        }),
      });

      if (response.ok) {
        await response.json();
        toast({
          title: "Éxito",
          description: "Mock deposit creado exitosamente",
        });
        setMockDepositDialog(false);
        setSelectedPayment(null);
        setMockAmount("");
        setMockReceiverName("");
        fetchPayments(); // Recargar datos
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Error creando mock deposit",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [CRMPage] Error:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Confirmado</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    return type === 'SPEI' 
      ? <Badge className="bg-blue-100 text-blue-800">SPEI</Badge>
      : <Badge className="bg-purple-100 text-purple-800">MXNB</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM - Gestión de Pagos</h1>
          <p className="text-muted-foreground">
            Administra y monitorea todos los pagos de la plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              Todos los pagos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.filter(p => p.paymentStatus === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Esperando confirmación
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.filter(p => p.paymentStatus === 'CONFIRMED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagos completados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${payments
                .filter(p => p.paymentStatus === 'CONFIRMED')
                .reduce((sum, p) => sum + p.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              En pagos confirmados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>
            Lista completa de todos los pagos realizados en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pago</TableHead>
                <TableHead>Dirección KILT</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>CLABE</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>KILT</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-sm">
                    {payment.bitsoPaymentId}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.kiltAddress?.substring(0, 12)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    ${payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {payment.clabe}
                  </TableCell>
                  <TableCell>
                    {getPaymentTypeBadge(payment.paymentType)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    {payment.kiltTransactionHash ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enviado
                      </Badge>
                    ) : payment.paymentStatus === 'CONFIRMED' ? (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendiente
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        -
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(payment.requestedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Detalles del Pago</DialogTitle>
                            <DialogDescription>
                              Información completa del pago seleccionado
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>ID Pago</Label>
                              <p className="text-sm font-mono">{payment.bitsoPaymentId}</p>
                            </div>
                            <div>
                              <Label>Dirección KILT</Label>
                              <p className="text-sm font-mono">{payment.kiltAddress}</p>
                            </div>
                            <div>
                              <Label>Monto</Label>
                              <p className="text-sm">${payment.amount.toFixed(2)}</p>
                            </div>
                            <div>
                              <Label>CLABE</Label>
                              <p className="text-sm font-mono">{payment.clabe}</p>
                            </div>
                            <div>
                              <Label>Beneficiario</Label>
                              <p className="text-sm">{payment.beneficiary}</p>
                            </div>
                            <div>
                              <Label>Estado</Label>
                              <div className="mt-1">{getStatusBadge(payment.paymentStatus)}</div>
                            </div>
                            
                            {/* Información de Transacción KILT */}
                            {payment.kiltTransactionHash && (
                              <div className="border-t pt-4 mt-4">
                                <Label className="text-sm font-semibold text-green-600">✅ KILT Enviado</Label>
                                <div className="space-y-2 mt-2">
                                  <div>
                                    <Label className="text-xs">Hash de Transacción</Label>
                                    <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                                      {payment.kiltTransactionHash}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">Cantidad</Label>
                                      <p className="text-sm font-medium">{payment.kiltAmount} KILT</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Red</Label>
                                      <p className="text-sm">{payment.kiltNetwork}</p>
                                    </div>
                                  </div>
                                  {payment.kiltBlockHash && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">Hash del Bloque</Label>
                                        <p className="text-xs font-mono bg-gray-100 p-1 rounded">
                                          {payment.kiltBlockHash.substring(0, 20)}...
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs">Número de Bloque</Label>
                                        <p className="text-sm">{payment.kiltBlockNumber}</p>
                                      </div>
                                    </div>
                                  )}
                                  {payment.kiltSentAt && (
                                    <div>
                                      <Label className="text-xs">Enviado el</Label>
                                      <p className="text-sm">{new Date(payment.kiltSentAt).toLocaleString()}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {!payment.kiltTransactionHash && payment.paymentStatus === 'CONFIRMED' && (
                              <div className="border-t pt-4 mt-4">
                                <Label className="text-sm font-semibold text-yellow-600">⏳ KILT Pendiente</Label>
                                <p className="text-xs text-muted-foreground">
                                  El pago está confirmado pero aún no se ha enviado KILT
                                </p>
                              </div>
                            )}
                            
                            {payment.paymentStatus === 'PENDING' && (
                              <Button
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setMockDepositDialog(true);
                                }}
                                className="w-full"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Simular Depósito
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mock Deposit Dialog */}
      <Dialog open={mockDepositDialog} onOpenChange={setMockDepositDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simular Depósito</DialogTitle>
            <DialogDescription>
              Crea un mock deposit para simular la confirmación del pago
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                value={mockAmount}
                onChange={(e) => setMockAmount(e.target.value)}
                placeholder="150.00"
              />
            </div>
            <div>
              <Label htmlFor="receiver">Nombre del Receptor</Label>
              <Input
                id="receiver"
                value={mockReceiverName}
                onChange={(e) => setMockReceiverName(e.target.value)}
                placeholder="Peranto Ci.Go"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleMockDeposit} className="flex-1">
                Crear Mock Deposit
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setMockDepositDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 