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

import { redirect } from "@/i18n/navigation";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createAuthenticatedClient();
  const [{ clinicName, tenantId, isOnboarded }, services, switcher, permissions] =
    await Promise.all([
      fetchClinicBrief(),
      fetchDashboardServices(),
      fetchClinicSwitcherOptions(),
      resolveStaffPermissions(supabase),
    ]);

  // Onboarding is now handled in-app via the Journey widget.
  // No need to redirect to a standalone onboarding page.

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
