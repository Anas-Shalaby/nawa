import { DashboardLayoutShell } from "@/components/dashboard/layout/DashboardLayoutShell";
import { DashboardNotificationsRoot } from "@/components/providers/DashboardNotificationsRoot";
import { TheaterModeProvider } from "@/components/ehr/TheaterModeContext";
import { GlobalBookingDrawerProvider } from "@/components/booking/GlobalBookingDrawerContext";
import {
  fetchClinicBrief,
  fetchDashboardServices,
} from "@/lib/queries/services";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ clinicName, tenantId }, services] = await Promise.all([
    fetchClinicBrief(),
    fetchDashboardServices(),
  ]);

  return (
    <TheaterModeProvider>
      <DashboardNotificationsRoot tenantId={tenantId}>
        <GlobalBookingDrawerProvider services={services}>
          <DashboardLayoutShell clinicName={clinicName} tenantId={tenantId}>
            {children}
          </DashboardLayoutShell>
        </GlobalBookingDrawerProvider>
      </DashboardNotificationsRoot>
    </TheaterModeProvider>
  );
}
