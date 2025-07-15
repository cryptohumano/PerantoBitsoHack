"use client"

import { useState, useRef } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Eye, X, Tag, AlertCircle, Plus, Trash2, CalendarIcon } from "lucide-react"
import { z } from "zod"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CTYPES } from "@/mocks/ctypes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Configuración del worker de PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

const TAGS_GLOBALES = [
  "contrato", "finanzas", "inmueble", "renta", "bienes raíces", "permuta", "NDA", "civil"
]

const CTYPES_DISPONIBLES = [
  {
    id: "ctype-1",
    title: "Identidad Legal",
    description: "Credencial de identidad legal verificada",
    properties: [
      { id: "name", label: "Nombre completo", required: true },
      { id: "curp", label: "CURP", required: true },
      { id: "rfc", label: "RFC", required: true },
      { id: "address", label: "Dirección", required: false },
    ]
  },
  {
    id: "ctype-2",
    title: "Título Profesional",
    description: "Credencial de título profesional",
    properties: [
      { id: "degree", label: "Título", required: true },
      { id: "institution", label: "Institución", required: true },
      { id: "year", label: "Año de graduación", required: true },
      { id: "specialty", label: "Especialidad", required: false },
    ]
  },
  {
    id: "ctype-3",
    title: "Certificación Profesional",
    description: "Credencial de certificación profesional",
    properties: [
      { id: "certification", label: "Certificación", required: true },
      { id: "issuer", label: "Emisor", required: true },
      { id: "validUntil", label: "Vigencia", required: true },
      { id: "level", label: "Nivel", required: false },
    ]
  }
]

const signerSchema = z.object({
  email: z.string().email({ message: "Correo válido requerido" }),
  did: z.string().optional(),
  ctype: z.object({
    id: z.string(),
    title: z.string(),
    selectedProperties: z.array(z.string())
  }).optional()
})

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre del contrato debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
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
})

type FormValues = z.infer<typeof formSchema>

type PdfPreviewProps = {
  file: File | null
}

function PdfPreview({ file }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number>()
  if (!file) return null
  return (
    <div className="w-full flex flex-col items-center">
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<span className="text-muted-foreground">Cargando PDF...</span>}
        error={<span className="text-destructive">No se pudo cargar el PDF</span>}
      >
        {Array.from(new Array(numPages), (el, idx) => (
          <Page key={`page_${idx + 1}`} pageNumber={idx + 1} width={400} />
        ))}
      </Document>
    </div>
  )
}

export default function CreateContractClient() {
  const [file, setFile] = useState<File | undefined>(undefined)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [alert, setAlert] = useState<{ type: "error" | "info", message: string } | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [customTag, setCustomTag] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [reviewData, setReviewData] = useState<FormValues | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
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
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "signers"
  })

  const tags = form.watch("tags")
  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      form.setValue("tags", [...tags, tag], { shouldValidate: true })
    }
  }
  const removeTag = (tag: string) => {
    form.setValue("tags", tags.filter(t => t !== tag), { shouldValidate: true })
  }
  const handleCustomTag = () => {
    if (customTag.trim().length > 1 && !tags.includes(customTag.trim())) {
      addTag(customTag.trim())
      setCustomTag("")
    }
  }

  // FILE
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && f.type === "application/pdf") {
      setFile(f)
      form.setValue("file", f, { shouldValidate: true })
      setAlert(null)
    } else {
      setFile(undefined)
      form.setValue("file", undefined, { shouldValidate: true })
      setAlert({ type: "error", message: "Solo se permiten archivos PDF." })
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f && f.type === "application/pdf") {
      setFile(f)
      form.setValue("file", f, { shouldValidate: true })
      setAlert(null)
    } else {
      setFile(undefined)
      form.setValue("file", undefined, { shouldValidate: true })
      setAlert({ type: "error", message: "Solo se permiten archivos PDF." })
    }
  }

  const handleRemoveFile = () => {
    setShowDeleteDialog(true)
  }

  const confirmRemoveFile = () => {
    setFile(undefined)
    form.setValue("file", undefined, { shouldValidate: true })
    if (fileInputRef.current) fileInputRef.current.value = ""
    setShowDeleteDialog(false)
  }

  const onSubmit = async (data: FormValues) => {
    setReviewData(data)
    setShowReviewDialog(true)
  }

  const handleConfirmSubmit = async () => {
    if (!reviewData) return

    try {
      setUploadProgress(100)
      setTimeout(() => setUploadProgress(0), 1000)
      form.reset()
      setFile(undefined)
      setShowSuccessDialog(true)
      setShowReviewDialog(false)
    } catch {
      setAlert({ type: "error", message: "Error al crear el contrato" })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

              {/* CREADOR DEL CONTRATO */}
              <Card className="p-6 space-y-4">
                <FormLabel>Datos del Creador</FormLabel>
                <div className="space-y-4">
                  {/* TODO: Al conectar la wallet, obtener y autocompletar el DID y web3name del usuario para el campo creador. */}
                  <div className="space-y-2">
                    <FormLabel>Identidad para Firmar</FormLabel>
                    <Select
                      value={form.watch("creator.identity") || ""}
                      onValueChange={(value) => {
                        // TODO: Implementar lógica de selección de identidad
                        // 1. Si value es "new" -> Permitir ingreso manual
                        // 2. Si value es una identidad -> Extraer datos
                        form.setValue("creator.identity", value)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar identidad..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nueva identidad</SelectItem>
                        {/* TODO: Mapear identidades disponibles de la wallet */}
                        <SelectItem value="identity-1">Identidad 1</SelectItem>
                        <SelectItem value="identity-2">Identidad 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecciona una identidad de tu wallet para firmar como creador del contrato.
                      Los datos se extraerán automáticamente de la identidad seleccionada.
                    </FormDescription>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel>Nombre del Creador</FormLabel>
                      <FormControl>
                        <Input
                          {...form.register("creator.name")}
                          placeholder="Nombre completo"
                          // TODO: Autocompletar si hay identidad seleccionada
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
                          // TODO: Autocompletar si hay identidad seleccionada
                        />
                      </FormControl>
                      <FormMessage>{form.formState.errors.creator?.email?.message as string}</FormMessage>
                    </div>
                  </div>

                  {/* TODO: Mostrar datos adicionales si hay identidad seleccionada
                    - DID
                    - Credenciales disponibles
                    - Otros datos relevantes de la identidad
                  */}
                  {form.watch("creator.identity") && form.watch("creator.identity") !== "new" && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <h4 className="font-medium">Datos de la Identidad</h4>
                      <div className="text-sm text-muted-foreground">
                        {/* TODO: Mostrar datos extraídos de la identidad */}
                        <p>DID: did:kilt:...</p>
                        <p>Credenciales: 3 disponibles</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

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

              {/* CTYPES Y PROPIEDADES */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Credenciales Requeridas para Firma</FormLabel>
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
                      
                      <div className="space-y-2">
                        <FormLabel>Seleccionar Credencial</FormLabel>
                        <Select
                          value={form.watch(`signers.${index}.ctype.id`) || ""}
                          onValueChange={(value) => {
                            const ctype = CTYPES.find(c => c.id === value)
                            if (ctype) {
                              form.setValue(`signers.${index}.ctype`, {
                                id: ctype.id,
                                title: ctype.title,
                                selectedProperties: []
                              })
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar credencial..." />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-[200px]">
                              {CTYPES.map(ctype => (
                                <SelectItem key={ctype.id} value={ctype.id}>
                                  <div className="flex flex-col">
                                    <span>{ctype.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {Object.keys(ctype.properties).length} propiedades
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>

                      {form.watch(`signers.${index}.ctype.id`) && (
                        <div className="space-y-2">
                          <FormLabel>Propiedades Requeridas para el Contrato</FormLabel>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {CTYPES.find(c => c.id === form.watch(`signers.${index}.ctype.id`))?.properties && 
                              Object.entries(CTYPES.find(c => c.id === form.watch(`signers.${index}.ctype.id`))!.properties)
                                .filter(([_, prop]) => prop.type !== "boolean")
                                .map(([propId, prop]) => (
                                  <div key={propId} className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
                                    <Checkbox
                                      id={`signer-${index}-prop-${propId}`}
                                      checked={form.watch(`signers.${index}.ctype.selectedProperties`)?.includes(propId)}
                                      onCheckedChange={(checked) => {
                                        const currentProps = form.watch(`signers.${index}.ctype.selectedProperties`) || []
                                        if (checked) {
                                          form.setValue(`signers.${index}.ctype.selectedProperties`, [...currentProps, propId])
                                        } else {
                                          form.setValue(`signers.${index}.ctype.selectedProperties`, currentProps.filter(p => p !== propId))
                                        }
                                      }}
                                    />
                                    <label htmlFor={`signer-${index}-prop-${propId}`} className="text-sm flex items-center gap-1">
                                      <span className="font-medium">{propId}</span>
                                      <span className="text-xs text-muted-foreground">({prop.type})</span>
                                    </label>
                                  </div>
                                ))
                            }
                          </div>
                          <FormDescription>
                            Selecciona las propiedades que necesitas para este contrato. El firmante deberá proporcionar estas propiedades al momento de firmar.
                          </FormDescription>
                        </div>
                      )}
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
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <span className="truncate max-w-xs">{file.name}</span>
                      <Button type="button" variant="destructive" size="sm" onClick={e => { e.stopPropagation(); handleRemoveFile() }}>
                        <X className="size-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Arrastra un archivo PDF aquí o haz click para seleccionar</span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <FormMessage>{form.formState.errors.file?.message as string}</FormMessage>
                {uploadProgress > 0 && <Progress value={uploadProgress} />}
              </Card>

              <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
                Crear contrato
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Diálogo de Revisión */}
      <AlertDialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Revisar Datos del Contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, revisa todos los datos antes de crear el contrato.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {reviewData && (
            <div className="space-y-6 py-4">
              {/* Datos Básicos */}
              <div className="space-y-2">
                <h4 className="font-medium">Datos Básicos</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span>{reviewData.name}</span>
                  <span className="text-muted-foreground">Descripción:</span>
                  <span>{reviewData.description || "Sin descripción"}</span>
                </div>
              </div>

              {/* Creador */}
              <div className="space-y-2">
                <h4 className="font-medium">Creador</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span>{reviewData.creator.name}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span>{reviewData.creator.email}</span>
                  {reviewData.creator.identity && (
                    <>
                      <span className="text-muted-foreground">Identidad:</span>
                      <span>{reviewData.creator.identity}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Fechas */}
              <div className="space-y-2">
                <h4 className="font-medium">Fechas</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Vigencia hasta:</span>
                  <span>{new Date(reviewData.validUntil).toLocaleDateString()}</span>
                  <span className="text-muted-foreground">Límite de firma:</span>
                  <span>{new Date(reviewData.signDeadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Firmantes */}
              <div className="space-y-2">
                <h4 className="font-medium">Firmantes ({reviewData.signers.length})</h4>
                <div className="space-y-2">
                  {reviewData.signers.map((signer, index) => (
                    <div key={index} className="p-2 bg-muted/50 rounded-md">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{signer.email}</span>
                        {signer.did && (
                          <>
                            <span className="text-muted-foreground">DID:</span>
                            <span>{signer.did}</span>
                          </>
                        )}
                        {signer.ctype && (
                          <>
                            <span className="text-muted-foreground">Credencial:</span>
                            <span>{signer.ctype.title}</span>
                            <span className="text-muted-foreground">Propiedades:</span>
                            <span>{signer.ctype.selectedProperties.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {reviewData.tags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {reviewData.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Archivo */}
              {reviewData.file && (
                <div className="space-y-2">
                  <h4 className="font-medium">Archivo PDF</h4>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Nombre: </span>
                    <span>{reviewData.file.name}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Confirmar y Crear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para éxito */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Contrato creado correctamente!</AlertDialogTitle>
            <AlertDialogDescription>
              El contrato ha sido creado y guardado exitosamente. Puedes consultarlo en el historial o crear uno nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)} autoFocus>Aceptar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para eliminar archivo */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el archivo PDF seleccionado. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveFile}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 