import type {
  Appointment,
  DailyPulseStats,
  DashboardService,
} from "@/lib/dashboard/types";
import {
  APPOINTMENT_SELECT,
  mapAppointmentRow,
  type AppointmentJoinRow,
} from "@/lib/dashboard/mapAppointment";
import { resolveStaffPermissions } from "@/lib/auth/staffPermissions";
import {
  computeDailyMiniStats,
  type DailyMiniStats,
} from "@/lib/dashboard/miniStats";
import { mapServiceRow, SERVICE_SELECT } from "@/lib/services/mapService";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";
import {
  getCairoDayQueryBounds,
  getCairoTodayKey,
  isAppointmentOnCairoDate,
} from "@/lib/datetime/cairo";

export async function fetchTodayAppointments(): Promise<{
  appointments: Appointment[];
  clinicName: string;
  tenantId: string;
  pulse: DailyPulseStats;
  miniStats: DailyMiniStats;
  canViewRevenue: boolean;
  services: DashboardService[];
}> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const { canViewRevenue } = await resolveStaffPermissions(supabase);
  const todayKey = getCairoTodayKey();
  const { startIso, endExclusiveIso } = getCairoDayQueryBounds(todayKey);

  const [
    { data: tenant, error: tenantError },
    { data: rows, error: rowsError },
    { data: allToday, error: statsError },
    { data: serviceRows, error: servicesError },
  ] = await Promise.all([
    supabase.from("tenants").select("id, name").eq("id", tenantId).single(),
    supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("tenant_id", tenantId)
      .gte("appointment_date", startIso)
      .lt("appointment_date", endExclusiveIso)
      .not("status", "in", "(no_show,canceled)")
      .order("appointment_date", { ascending: true }),
    supabase
      .from("appointments")
      .select("status")
      .eq("tenant_id", tenantId)
      .gte("appointment_date", startIso)
      .lt("appointment_date", endExclusiveIso)
      .neq("status", "canceled"),
      supabase
        .from("services")
        .select(SERVICE_SELECT)
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true }),
  ]);

  if (tenantError) {
    throw new Error(`Failed to load clinic: ${tenantError.message}`);
  }

  if (rowsError) {
    throw new Error(`Failed to load appointments: ${rowsError.message}`);
  }

  if (statsError) {
    throw new Error(`Failed to load pulse stats: ${statsError.message}`);
  }

  if (servicesError) {
    throw new Error(`Failed to load services: ${servicesError.message}`);
  }

  const appointments = ((rows ?? []) as AppointmentJoinRow[])
    .map(mapAppointmentRow)
    .filter((appointment) => isAppointmentOnCairoDate(appointment.appointmentDate, todayKey));
  const miniStats = computeDailyMiniStats(appointments);

  const pulse: DailyPulseStats = {
    total: allToday?.length ?? 0,
    pending: allToday?.filter((row) => row.status === "pending").length ?? 0,
    completed: allToday?.filter((row) => row.status === "completed").length ?? 0,
    noShows: allToday?.filter((row) => row.status === "no_show").length ?? 0,
  };

  const services: DashboardService[] = (serviceRows ?? []).map(mapServiceRow);

  return {
    appointments,
    clinicName: tenant.name,
    tenantId,
    pulse,
    miniStats,
    canViewRevenue,
    services,
  };
}
