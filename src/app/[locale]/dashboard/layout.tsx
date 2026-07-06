import { DashboardLayoutShell } from "@/components/dashboard/layout/DashboardLayoutShell";
import { DashboardNotificationsRoot } from "@/components/providers/DashboardNotificationsRoot";
import { TheaterModeProvider } from "@/components/ehr/TheaterModeContext";
import { fetchClinicBrief } from "@/lib/queries/services";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clinicName, tenantId } = await fetchClinicBrief();

  return (
    <TheaterModeProvider>
      <DashboardNotificationsRoot tenantId={tenantId}>
        <DashboardLayoutShell clinicName={clinicName} tenantId={tenantId}>
          {children}
        </DashboardLayoutShell>
      </DashboardNotificationsRoot>
    </TheaterModeProvider>
  );
}
