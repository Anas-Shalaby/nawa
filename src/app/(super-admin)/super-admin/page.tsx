import { SaaSHealthDashboard } from "@/components/super-admin/SaaSHealthDashboard";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { fetchSaaSHealthMetrics } from "@/lib/super-admin/metrics";

export const metadata = {
  title: "Super Admin — Nawa",
  robots: { index: false, follow: false },
};

export default async function SuperAdminPage() {
  const metrics = await fetchSaaSHealthMetrics();

  return (
    <SuperAdminShell activePath="/super-admin">
      <SaaSHealthDashboard metrics={metrics} />
    </SuperAdminShell>
  );
}
