import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell";
import { HistoryClaimsClient } from "./client";

export const metadata: Metadata = {
  title: "Historial de Claims | Attester | Peranto",
  description: "Consulta el historial de claims verificados y rechazados.",
};

export default function Page() {
  return (
    <DashboardShell>
      <HistoryClaimsClient />
    </DashboardShell>
  );
} 