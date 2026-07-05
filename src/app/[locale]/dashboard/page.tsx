import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { fetchDashboardAnalytics } from "@/lib/queries/analytics";
import { fetchTodayAppointments } from "@/lib/queries/dashboard";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const today = new Date().toISOString();
  const [{ appointments, clinicName, tenantId, pulse, services }, analytics] =
    await Promise.all([fetchTodayAppointments(), fetchDashboardAnalytics(locale)]);

  return (
    <div className="mx-auto max-w-[1440px]">
      <DashboardShell
        clinicName={clinicName}
        date={today}
        tenantId={tenantId}
        initialAppointments={appointments}
        services={services}
        analytics={analytics}
      />
    </div>
  );
}
