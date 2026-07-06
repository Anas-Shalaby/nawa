import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCairoTodayDisplayIso } from "@/lib/datetime/cairo";
import { fetchTodayAppointments } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const today = getCairoTodayDisplayIso();
  const { appointments, clinicName, tenantId, miniStats, canViewRevenue, services } =
    await fetchTodayAppointments();

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      <DashboardShell
        clinicName={clinicName}
        date={today}
        tenantId={tenantId}
        initialAppointments={appointments}
        initialMiniStats={miniStats}
        canViewRevenue={canViewRevenue}
        services={services}
      />
    </div>
  );
}
