import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell";
import { ActiveClaimsClient } from "./client";

export const metadata: Metadata = {
  title: "Claims Activos | Attester | Peranto",
  description: "Gestiona y revisa los claims activos que requieren tu verificación.",
};

export default function Page() {
  return (
    <DashboardShell>
      <ActiveClaimsClient />
    </DashboardShell>
  );
} 