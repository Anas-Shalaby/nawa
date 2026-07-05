import { DashboardLayoutShell } from "@/components/dashboard/layout/DashboardLayoutShell";
import { TheaterModeProvider } from "@/components/ehr/TheaterModeContext";
import { fetchClinicBrief } from "@/lib/queries/services";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clinicName } = await fetchClinicBrief();

  return (
    <TheaterModeProvider>
      <DashboardLayoutShell clinicName={clinicName}>{children}</DashboardLayoutShell>
    </TheaterModeProvider>
  );
}
