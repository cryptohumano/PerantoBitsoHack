import { ClaimFormClient } from "./client"

export const metadata = { title: "Reclamar Credencial" }

export default async function Page({ params }: { params: Promise<{ ctypeId: string }> }) {
  const { ctypeId } = await params
  return <ClaimFormClient ctypeId={ctypeId} />
} 