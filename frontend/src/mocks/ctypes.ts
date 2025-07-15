export interface CTypeProperty {
  id: string
  label: string
  required: boolean
}

export interface CType {
  id: string
  title: string
  description: string
  properties: CTypeProperty[]
}

export const CTYPES: CType[] = [
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
  },
  {
    id: "ctype-4",
    title: "Licencia de Conducir",
    description: "Credencial de licencia de conducir",
    properties: [
      { id: "licenseNumber", label: "Número de licencia", required: true },
      { id: "type", label: "Tipo de licencia", required: true },
      { id: "expiryDate", label: "Fecha de vencimiento", required: true },
      { id: "restrictions", label: "Restricciones", required: false },
    ]
  },
  {
    id: "ctype-5",
    title: "Pasaporte",
    description: "Credencial de pasaporte",
    properties: [
      { id: "passportNumber", label: "Número de pasaporte", required: true },
      { id: "nationality", label: "Nacionalidad", required: true },
      { id: "dateOfBirth", label: "Fecha de nacimiento", required: true },
      { id: "expiryDate", label: "Fecha de vencimiento", required: true },
    ]
  }
] 