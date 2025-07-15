import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell";
import { AttesterLegalClient } from "./client";

export default function Page() {
  return (
    <DashboardShell>
      <AttesterLegalClient />
    </DashboardShell>
  );
} 