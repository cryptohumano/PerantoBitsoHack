"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlusCircle, Trash2 } from "lucide-react";
import { CTypeSchema, CTypeSchemaProperties } from '@/types/ctype';
import { kiltAccountService, KiltAccount } from '@/services/kiltAccountService';

// Esquema de validación para una sola propiedad
const propertySchema = z.object({
  name: z.string().min(1, "El nombre de la propiedad es requerido."),
  type: z.enum(['string', 'number', 'boolean']),
  required: z.boolean(),
});

// Esquema para el formulario constructor de CType
const ctypeBuilderSchema = z.object({
  title: z.string().min(3, "El título del CType es requerido."),
  properties: z.array(propertySchema).min(1, "Debe definir al menos una propiedad."),
  isPublic: z.boolean(),
  authorizedRoles: z.array(z.string()).optional(),
  network: z.enum(['peregrine', 'spiritnet'], { required_error: "Debe seleccionar una red." }),
  payerType: z.enum(['user', 'system'], { required_error: "Debe seleccionar quién pagará la transacción." }),
  signerType: z.enum(['user', 'system'], { required_error: "Debe seleccionar quién firmará la transacción." }),
  selectedAccount: z.string().optional(),
});

export type CTypeBuilderFormValues = z.infer<typeof ctypeBuilderSchema>;

interface CreateCTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string, schema: CTypeSchema, isPublic: boolean, authorizedRoles?: string[], network: 'peregrine' | 'spiritnet', payerType: 'user' | 'system', signerType: 'user' | 'system', selectedAccount?: string }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const availableRoles = ["USER", "ATTESTER", "ADMIN"];

export function CreateCTypeModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
}: CreateCTypeModalProps) {
  const [availableAccounts, setAvailableAccounts] = useState<KiltAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CTypeBuilderFormValues>({
    resolver: zodResolver(ctypeBuilderSchema),
    defaultValues: {
      title: "",
      properties: [{ name: "id", type: "string", required: true }],
      isPublic: true,
      authorizedRoles: [],
      network: 'peregrine',
      payerType: 'system', // Por defecto el sistema paga
      signerType: 'system', // Por defecto el sistema firma
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "properties",
  });

  const formValues = watch();

  // Cargar cuentas cuando el modal se abre
  useEffect(() => {
    if (isOpen && formValues.payerType === 'user') {
      loadAccounts();
    }
  }, [isOpen, formValues.payerType]);

  const loadAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const accounts = await kiltAccountService.getAvailableAccounts();
      setAvailableAccounts(accounts);
      console.log('[CreateCTypeModal] Cuentas cargadas:', accounts);
    } catch (error) {
      console.error('[CreateCTypeModal] Error cargando cuentas:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Log de los valores del formulario en tiempo real
  console.log('[CreateCTypeModal] Valores actuales del formulario:', {
    title: formValues.title,
    network: formValues.network,
    payerType: formValues.payerType,
    signerType: formValues.signerType,
    isPublic: formValues.isPublic,
    properties: formValues.properties
  });

  // Generar el schema JSON en tiempo real
  const generatedSchema = ((): CTypeSchema => {
    const schemaProps = formValues.properties?.reduce((acc, prop) => {
        if(prop.name && prop.type) {
            acc[prop.name] = { type: prop.type };
        }
        return acc;
    }, {} as CTypeSchemaProperties) || {};

    return {
      $schema: "http://kilt-protocol.org/draft-01/ctype#",
      title: formValues.title || "",
      properties: schemaProps,
      type: "object",
    };
  })();

  const handleFormSubmit = () => {
    console.log('[CreateCTypeModal] Valores del formulario:', {
      title: formValues.title,
      payerType: formValues.payerType,
      signerType: formValues.signerType,
      network: formValues.network,
      selectedAccount: formValues.selectedAccount
    });
    
    // Usar el flujo inteligente que determina automáticamente las mejores opciones
    onSubmit({
      name: formValues.title,
      schema: generatedSchema,
      isPublic: formValues.isPublic,
      authorizedRoles: formValues.authorizedRoles,
      network: formValues.network,
      // El flujo inteligente determinará automáticamente payerType y signerType
      payerType: 'system' as 'user' | 'system', // Será determinado automáticamente
      signerType: 'system' as 'user' | 'system', // Será determinado automáticamente
      selectedAccount: formValues.selectedAccount,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Constructor de CType</DialogTitle>
          <DialogDescription>
            Define las propiedades de tu credencial de forma visual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-6 py-4 max-h-[65vh] overflow-y-auto pr-6">
            {/* Título del CType */}
            <div>
              <Label htmlFor="title">Título del CType</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            {/* Selección de Red */}
            <div>
              <Label htmlFor="network">Red de KILT</Label>
              <Controller
                control={control}
                name="network"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una red" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peregrine">Peregrine (Testnet)</SelectItem>
                      <SelectItem value="spiritnet">Spiritnet (Mainnet)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.network && <p className="text-red-500 text-sm mt-1">{errors.network.message}</p>}
            </div>

            {/* Selección de Pagador */}
            <div>
              <Label htmlFor="payerType">Quién pagará la transacción</Label>
              <Controller
                control={control}
                name="payerType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione quién pagará" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Sistema (Recomendado)</SelectItem>
                      <SelectItem value="user">Mi cuenta personal</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.payerType && <p className="text-red-500 text-sm mt-1">{errors.payerType.message}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                {formValues.payerType === 'system' 
                  ? 'El sistema pagará los fees de la transacción. Ideal para pruebas y desarrollo.'
                  : 'Tú pagarás los fees de la transacción con tu cuenta KILT. Asegúrate de tener fondos suficientes.'
                }
              </p>
            </div>

            {/* Selección de Cuenta (solo cuando el usuario paga) */}
            {formValues.payerType === 'user' && (
              <div>
                <Label htmlFor="selectedAccount">Seleccionar cuenta para pago</Label>
                <Controller
                  control={control}
                  name="selectedAccount"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingAccounts ? "Cargando cuentas..." : "Seleccione una cuenta"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAccounts.map((account) => (
                          <SelectItem key={account.address} value={account.address}>
                            {account.meta.name} ({account.address.substring(0, 8)}...{account.address.substring(account.address.length - 8)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.selectedAccount && <p className="text-red-500 text-sm mt-1">{errors.selectedAccount.message}</p>}
                <p className="text-sm text-muted-foreground mt-1">
                  Selecciona la cuenta KILT que usarás para pagar los fees de la transacción.
                </p>
              </div>
            )}

            {/* Selección de Firmante */}
            <div>
              <Label htmlFor="signerType">Quién firmará la transacción</Label>
              <Controller
                control={control}
                name="signerType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione quién firmará" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Sistema (Recomendado)</SelectItem>
                      <SelectItem value="user">Mi DID personal</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.signerType && <p className="text-red-500 text-sm mt-1">{errors.signerType.message}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                {formValues.signerType === 'system' 
                  ? 'El sistema firmará con su DID. Ideal para pruebas y desarrollo.'
                  : 'Tú firmarás con tu DID personal. Requiere conexión con Sporran.'
                }
              </p>
            </div>

            {/* Propiedades Dinámicas */}
            <div className="space-y-4">
              <Label>Propiedades</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                  <Input {...register(`properties.${index}.name`)} placeholder="Nombre propiedad" className="flex-1"/>
                  
                  <Controller
                    control={control}
                    name={`properties.${index}.type`}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  <div className="flex items-center gap-1.5">
                    <Controller
                        name={`properties.${index}.required`}
                        control={control}
                        render={({ field }) => (
                            <Checkbox id={`required-${index}`} checked={field.value} onCheckedChange={field.onChange} />
                        )}
                    />
                    <Label htmlFor={`required-${index}`} className="text-sm font-medium">Requerida</Label>
                  </div>
                  
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              {errors.properties && <p className="text-red-500 text-sm">{errors.properties.message}</p>}

              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", type: "string", required: false })}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Añadir Propiedad
              </Button>
            </div>
            
            {/* Vista previa del JSON */}
            <div>
                <Label>Vista Previa del Esquema JSON</Label>
                <Textarea readOnly value={JSON.stringify(generatedSchema, null, 2)} className="h-40 font-mono bg-gray-100 dark:bg-gray-800" />
            </div>

            {/* Configuración de Visibilidad */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Label>Público</Label>
                    <Controller name="isPublic" control={control} render={({ field }) => ( <Switch id="isPublic" checked={field.value} onCheckedChange={field.onChange} /> )}/>
                    <p className="text-sm text-muted-foreground">Si está activo, cualquiera puede solicitar una credencial de este tipo.</p>
                </div>
                {!formValues.isPublic && (
                    <div>
                        <Label>Roles Autorizados</Label>
                        <div className="flex gap-4 pt-2">
                        {availableRoles.map((role) => (
                            <div key={role} className="flex items-center gap-2">
                               <Controller
                                 name="authorizedRoles"
                                 control={control}
                                 render={({ field }) => ( <Checkbox id={`role-${role}`} value={role} checked={field.value?.includes(role)} onCheckedChange={(checked) => {
                                        return checked ? field.onChange([...(field.value || []), role]) : field.onChange(field.value?.filter((r) => r !== role));
                                 }}/> )}
                               />
                               <Label htmlFor={`role-${role}`}>{role}</Label>
                             </div>
                        ))}
                        </div>
                    </div>
                )}
            </div>
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Creando..." : "Crear CType"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 