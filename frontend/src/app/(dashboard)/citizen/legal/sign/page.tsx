import type { Metadata } from "next"
import SignContractsClient from "./client"

export const metadata: Metadata = {
  title: "Firmar Contratos | HUB Legal | Peranto",
  description: "Revisa y firma los contratos pendientes que requieren tu firma.",
}

export default function Page() {
  return <SignContractsClient />
} 