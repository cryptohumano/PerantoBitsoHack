import { DashboardShell } from "@/components/dashboard/shared/dashboard-shell";
import { AttesterLegalVerifyClient } from "./client";

export default function Page() {
  return (
    <DashboardShell>
      <AttesterLegalVerifyClient />
    </DashboardShell>
  );
} 