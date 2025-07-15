"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { CType } from "@/hooks/useCTypes"

interface DynamicClaimFormProps {
  ctype: CType
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  submitting: boolean
}

interface FormField {
  name: string
  type: string
  title: string
  description?: string
  required: boolean
  enum?: string[]
  format?: string
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
}

export function DynamicClaimForm({ ctype, onSubmit, submitting }: DynamicClaimFormProps) {
  const [error, setError] = useState<string | null>(null)

  // Extraer campos del schema
  const schema = ctype.schema as Record<string, unknown>
  const properties = schema.properties as Record<string, unknown> || {}
  const required = schema.required as string[] || []

  const fields: FormField[] = Object.entries(properties).map(([key, value]) => {
    const field = value as Record<string, unknown>
    return {
      name: key,
      type: field.type as string || 'string',
      title: field.title as string || key,
      description: field.description as string || '',
      required: required.includes(key),
      enum: field.enum as string[],
      format: field.format as string,
      pattern: field.pattern as string,
      minLength: field.minLength as number,
      maxLength: field.maxLength as number,
      minimum: field.minimum as number,
      maximum: field.maximum as number
    }
  })

  // Crear schema de validación dinámico
  const createValidationSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {}

    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny

      switch (field.type) {
        case 'string':
          fieldSchema = z.string()
          if (field.minLength) fieldSchema = (fieldSchema as z.ZodString).min(field.minLength)
          if (field.maxLength) fieldSchema = (fieldSchema as z.ZodString).max(field.maxLength)
          if (field.pattern) fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(field.pattern))
          if (field.format === 'email') fieldSchema = (fieldSchema as z.ZodString).email()
          if (field.format === 'uri') fieldSchema = (fieldSchema as z.ZodString).url()
          break
        case 'number':
        case 'integer':
          fieldSchema = z.number()
          if (field.minimum !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(field.minimum)
          if (field.maximum !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(field.maximum)
          break
        case 'boolean':
          fieldSchema = z.boolean()
          break
        default:
          fieldSchema = z.string()
      }

      if (field.enum) {
        fieldSchema = z.enum(field.enum as [string, ...string[]])
      }

      if (field.required) {
        schemaFields[field.name] = fieldSchema
      } else {
        schemaFields[field.name] = fieldSchema.optional()
      }
    })

    return z.object(schemaFields)
  }

  const validationSchema = createValidationSchema()
  type FormData = z.infer<typeof validationSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue
  } = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    mode: "onChange"
  })

  const handleFormSubmit = async (data: FormData) => {
    try {
      setError(null)
      await onSubmit(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el formulario')
    }
  }

  const renderField = (field: FormField) => {
    const fieldError = errors[field.name as keyof FormData]

    switch (field.type) {
      case 'string':
        if (field.enum) {
          return (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.title}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Select onValueChange={(value) => setValue(field.name as keyof FormData, value)}>
                <SelectTrigger>
                  <SelectValue placeholder={`Seleccione ${field.title.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.enum?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
              {fieldError && (
                <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
              )}
            </div>
          )
        }

        if (field.format === 'email') {
          return (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.title}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={field.name}
                type="email"
                {...register(field.name as keyof FormData)}
                placeholder={`Ingrese su ${field.title.toLowerCase()}`}
              />
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
              {fieldError && (
                <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
              )}
            </div>
          )
        }

        // Para campos de texto largo
        if (field.maxLength && field.maxLength > 100) {
          return (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.title}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Textarea
                id={field.name}
                {...register(field.name as keyof FormData)}
                placeholder={`Ingrese ${field.title.toLowerCase()}`}
                rows={4}
              />
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
              {fieldError && (
                <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
              )}
            </div>
          )
        }

        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="text"
              {...register(field.name as keyof FormData)}
              placeholder={`Ingrese ${field.title.toLowerCase()}`}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        )

      case 'number':
      case 'integer':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              {...register(field.name as keyof FormData, { valueAsNumber: true })}
              placeholder={`Ingrese ${field.title.toLowerCase()}`}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        )

      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              onCheckedChange={(checked) => setValue(field.name as keyof FormData, checked)}
            />
            <Label htmlFor={field.name} className="text-sm font-normal">
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground ml-6">{field.description}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.title}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="text"
              {...register(field.name as keyof FormData)}
              placeholder={`Ingrese ${field.title.toLowerCase()}`}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500">{fieldError.message?.toString()}</p>
            )}
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Formulario de Solicitud
          <Badge variant="outline">
            {fields.filter(f => f.required).length} campos requeridos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(renderField)}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="submit"
              disabled={!isValid || submitting}
              className="min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Solicitud'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 