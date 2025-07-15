import type { Metadata } from "next"
import HistorialContractsClient from "./client"

export const metadata: Metadata = {
  title: "Historial de Contratos | HUB Legal | Peranto",
  description: "Consulta todos los contratos en los que has participado, descarga archivos y revisa el estado de las firmas.",
}

export default function Page() {
  return <HistorialContractsClient />
} 