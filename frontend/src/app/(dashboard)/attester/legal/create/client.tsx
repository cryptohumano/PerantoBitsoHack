"use client";

import { useState } from "react";
import { pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Trash2, CalendarIcon } from "lucide-react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const TAGS_GLOBALES = [
  "contrato", "finanzas", "inmueble", "renta", "bienes raíces", "permuta", "NDA", "civil"
];

const signerSchema = z.object({
  email: z.string().email({ message: "Correo válido requerido" }),
  did: z.string().optional(),
  ctype: z.object({
    id: z.string(),
    title: z.string(),
    selectedProperties: z.array(z.string())
  }).optional()
});

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre del contrato debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
  visibility: z.enum(["public", "private"]),
  creator: z.object({
    identity: z.string().optional(),
    name: z.string().min(2, "El nombre es requerido"),
    email: z.string().email("Email válido requerido"),
  }),
  validUntil: z.string().min(1, {
    message: "La fecha de vigencia es requerida.",
  }),
  signDeadline: z.string().min(1, {
    message: "La fecha límite de firma es requerida.",
  }),
  signers: z.array(signerSchema).min(1, "Al menos un firmante"),
  file: z.instanceof(File).optional(),
  tags: z.array(z.string().min(2)).min(1, "Agrega al menos un tag"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AttesterLegalCreateClient() {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [customTag, setCustomTag] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "private",
      validUntil: "",
      signDeadline: "",
      signers: [{ email: "", did: "" }],
      file: undefined,
      tags: [],
      creator: {
        identity: "",
        name: "",
        email: "",
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "signers"
  });

  const tags = form.watch("tags");
  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      form.setValue("tags", [...tags, tag], { shouldValidate: true });
    }
  };
  const removeTag = (tag: string) => {
    form.setValue("tags", tags.filter(t => t !== tag), { shouldValidate: true });
  };
  const handleCustomTag = () => {
    if (customTag.trim().length > 1 && !tags.includes(customTag.trim())) {
      addTag(customTag.trim());
      setCustomTag("");
    }
  };

  // FILE
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      form.setValue("file", f, { shouldValidate: true });
    } else {
      setFile(undefined);
      form.setValue("file", undefined, { shouldValidate: true });
    }
  };

  const handleRemoveFile = () => {
    // Implement the logic to remove the file
  };

  const onSubmit = async () => {
    // Implement the logic to submit the form
  };

  return (
    <div className="w-full px-2 sm:px-4 md:px-8 lg:px-12 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Contrato</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Contrato de Servicios" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ingresa un nombre descriptivo para el contrato.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibilidad</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona visibilidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Público</SelectItem>
                          <SelectItem value="private">Privado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Elige si el contrato será público o privado.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe el propósito y alcance del contrato..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Creador del contrato */}
              <Card className="p-6 space-y-4">
                <FormLabel>Datos del Creador</FormLabel>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Nombre del Creador</FormLabel>
                    <FormControl>
                      <Input
                        {...form.register("creator.name")}
                        placeholder="Nombre completo"
                      />
                    </FormControl>
                    <FormMessage>{form.formState.errors.creator?.name?.message as string}</FormMessage>
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Email del Creador</FormLabel>
                    <FormControl>
                      <Input
                        {...form.register("creator.email")}
                        type="email"
                        placeholder="email@ejemplo.com"
                      />
                    </FormControl>
                    <FormMessage>{form.formState.errors.creator?.email?.message as string}</FormMessage>
                  </div>
                </div>
              </Card>
              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Vigencia</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date: Date | undefined) => field.onChange(date?.toISOString())}
                            disabled={(date: Date) => date < new Date()}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Hasta qué fecha será válido el contrato.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="signDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha Límite de Firma</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { locale: es })
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date: Date | undefined) => field.onChange(date?.toISOString())}
                            disabled={(date: Date) => date < new Date()}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Fecha límite para que todos los firmantes completen el proceso.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* TAGS */}
              <Card className="p-6 space-y-4">
                <FormLabel>Etiquetas (tags)</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {TAGS_GLOBALES.map(tag => (
                    <Button key={tag} type="button" variant={tags.includes(tag) ? "default" : "outline"} size="sm" onClick={() => addTag(tag)}>
                      {tag}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={customTag}
                    onChange={e => setCustomTag(e.target.value)}
                    placeholder="Agregar etiqueta personalizada"
                    className="max-w-xs"
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCustomTag(); } }}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={handleCustomTag}>Agregar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} className="flex items-center gap-1 text-base">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-xs">×</button>
                    </Badge>
                  ))}
                </div>
                <FormMessage>{form.formState.errors.tags?.message as string}</FormMessage>
              </Card>
              {/* FIRMANTES */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Firmantes</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ email: "", did: "" })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Firmante
                  </Button>
                </div>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Firmante {index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <FormLabel htmlFor={`signers.${index}.email`}>Email</FormLabel>
                          <FormControl>
                            <Input
                              id={`signers.${index}.email`}
                              {...form.register(`signers.${index}.email`)}
                              placeholder="email@ejemplo.com"
                            />
                          </FormControl>
                          <FormMessage>{form.formState.errors.signers?.[index]?.email?.message as string}</FormMessage>
                        </div>
                        <div className="space-y-2">
                          <FormLabel htmlFor={`signers.${index}.did`}>DID (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              id={`signers.${index}.did`}
                              {...form.register(`signers.${index}.did`)}
                              placeholder="did:kilt:..."
                            />
                          </FormControl>
                          <FormMessage>{form.formState.errors.signers?.[index]?.did?.message as string}</FormMessage>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              {/* PDF */}
              <Card className="p-6 space-y-4">
                <FormLabel>Archivo PDF del contrato</FormLabel>
                <div
                  className="border-2 border-dashed border-muted rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition w-full"
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => {}}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <span className="truncate max-w-xs">{file.name}</span>
                      <Button type="button" variant="destructive" size="sm" onClick={handleRemoveFile}>
                        <X className="size-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Arrastra un archivo PDF aquí o haz click para seleccionar</span>
                  )}
                </div>
                <FormMessage>{form.formState.errors.file?.message as string}</FormMessage>
                {/* Progress bar and review logic would be here if needed */}
              </Card>
              <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
                Crear contrato
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* Diálogos de revisión, éxito y eliminación de archivo (idénticos al citizen) */}
      {/* ... Puedes copiar los AlertDialog y lógica de revisión del citizen aquí ... */}
    </div>
  );
} 