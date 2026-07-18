import { DashboardLayoutShell } from "@/components/dashboard/layout/DashboardLayoutShell";
import { DashboardNotificationsRoot } from "@/components/providers/DashboardNotificationsRoot";
import { TheaterModeProvider } from "@/components/ehr/TheaterModeContext";
import { GlobalBookingDrawerProvider } from "@/components/booking/GlobalBookingDrawerContext";
import { AppThemeProvider } from "@/components/theme/AppThemeProvider";
import { PermissionProvider } from "@/components/auth/PermissionProvider";
import { fetchClinicSwitcherOptions } from "@/lib/queries/clinicSwitcher";
import { resolveStaffPermissions } from "@/lib/auth/staffPermissions";
import {
  fetchClinicBrief,
  fetchDashboardServices,
} from "@/lib/queries/services";
import { createAuthenticatedClient } from "@/utils/supabase/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createAuthenticatedClient();
  const [{ clinicName, tenantId }, services, switcher, permissions] =
    await Promise.all([
      fetchClinicBrief(),
      fetchDashboardServices(),
      fetchClinicSwitcherOptions(),
      resolveStaffPermissions(supabase),
    ]);

  return (
    <AppThemeProvider>
      <PermissionProvider
        role={permissions.role}
        grants={permissions.grants}
        isSuspended={permissions.isSuspended}
      >
        <TheaterModeProvider>
          <DashboardNotificationsRoot tenantId={tenantId}>
            <GlobalBookingDrawerProvider services={services}>
              <DashboardLayoutShell
                clinicName={clinicName}
                tenantId={switcher.activeTenantId || tenantId}
                clinics={switcher.clinics}
              >
                {children}
              </DashboardLayoutShell>
            </GlobalBookingDrawerProvider>
          </DashboardNotificationsRoot>
        </TheaterModeProvider>
      </PermissionProvider>
    </AppThemeProvider>
  );
}
