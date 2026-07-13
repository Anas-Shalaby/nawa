import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCairoTodayKey } from "@/lib/datetime/cairo";
import { fetchTodayAppointments } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const today = getCairoTodayKey();
  const data = await fetchTodayAppointments();

  return (
    <div className="flex h-full w-full max-w-none flex-col overflow-hidden">
      <DashboardShell
        clinicName={data.clinicName}
        doctorName={data.doctorName}
        date={today}
        tenantId={data.tenantId}
        initialAppointments={data.appointments}
        initialMiniStats={data.miniStats}
        canViewRevenue={data.canViewRevenue}
        services={data.services}
        pendingTomorrowCount={data.pendingTomorrowCount}
        todayPayments={data.todayPayments}
        yesterdayUnpaid={data.yesterdayUnpaid}
        rooms={data.rooms}
        capacityPct={data.capacityPct}
      />
    </div>
  );
}
