import type { Metadata } from "next"
import CreateContractClient from "./client"

export const metadata: Metadata = {
  title: "Crear Contrato | HUB Legal | Peranto",
  description: "Crea un nuevo contrato, invita firmantes y sube el archivo PDF para firma legal.",
}

export default function Page() {
  return <CreateContractClient />
} 