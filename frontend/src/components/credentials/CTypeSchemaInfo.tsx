import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CType } from "@/hooks/useCTypes"

interface CTypeSchemaInfoProps {
  ctype: CType
}

export function CTypeSchemaInfo({ ctype }: CTypeSchemaInfoProps) {
  // Extraer información del schema
  const schema = ctype.schema as Record<string, unknown>
  const properties = schema.properties as Record<string, unknown> || {}
  const required = schema.required as string[] || []
  
  // Obtener los campos del schema
  const fields = Object.entries(properties).map(([key, value]) => {
    const field = value as Record<string, unknown>
    return {
      name: key,
      type: field.type as string || 'unknown',
      title: field.title as string || key,
      description: field.description as string || '',
      required: required.includes(key)
    }
  })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {ctype.name}
          <Badge variant={ctype.isPublic ? "default" : "secondary"}>
            {ctype.isPublic ? "Público" : "Privado"}
          </Badge>
          <Badge variant="outline">
            {ctype.network}
          </Badge>
        </CardTitle>
        <div className="text-xs text-muted-foreground mt-1">
          Creador: <span className="font-mono truncate max-w-[180px] inline-block" title={ctype.creator.did}>
            {ctype.creator.did}
          </span>
        </div>
        {ctype.organization && (
          <div className="text-xs text-muted-foreground">
            Organización: {ctype.organization.name}
          </div>
        )}
        {!ctype.isPublic && ctype.rolePermissions.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Roles autorizados: {ctype.rolePermissions.map(rp => rp.role).join(', ')}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2 flex-1">
        <div className="text-sm font-medium mb-2">Campos requeridos:</div>
        {fields.length > 0 ? (
          <ul className="text-xs text-muted-foreground mb-2 space-y-1">
            {fields.map((field) => (
              <li key={field.name} className="flex items-center gap-2">
                <span className="font-medium">{field.title}</span>
                <Badge variant="outline" className="text-xs">
                  {field.type}
                </Badge>
                {field.required && (
                  <Badge variant="destructive" className="text-xs">
                    Requerido
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No hay campos definidos</p>
        )}
        
        <div className="mt-auto pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Hash: <span className="font-mono text-xs">{ctype.ctypeHash.slice(0, 16)}...</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Creado: {new Date(ctype.createdAt).toLocaleDateString('es-ES')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 