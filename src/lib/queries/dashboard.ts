import type {
  Appointment,
  ClinicRoomStatus,
  DailyPulseStats,
  DashboardService,
  PaymentTickerItem,
  UnpaidCollectItem,
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
import { addCairoDays } from "@/lib/datetime/followUp";
import {
  getCairoDayQueryBounds,
  getCairoTodayKey,
  isAppointmentOnCairoDate,
} from "@/lib/datetime/cairo";

export async function fetchTodayAppointments(): Promise<{
  appointments: Appointment[];
  clinicName: string;
  doctorName: string;
  tenantId: string;
  pulse: DailyPulseStats;
  miniStats: DailyMiniStats;
  canViewRevenue: boolean;
  services: DashboardService[];
  pendingTomorrowCount: number;
  todayPayments: PaymentTickerItem[];
  yesterdayUnpaid: UnpaidCollectItem[];
  rooms: ClinicRoomStatus[];
  capacityPct: number;
}> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const { canViewRevenue } = await resolveStaffPermissions(supabase);
  const todayKey = getCairoTodayKey();
  const yesterdayKey = addCairoDays(-1);
  const tomorrowKey = addCairoDays(1);
  const { startIso, endExclusiveIso } = getCairoDayQueryBounds(todayKey);
  const yesterdayBounds = getCairoDayQueryBounds(yesterdayKey);
  const tomorrowBounds = getCairoDayQueryBounds(tomorrowKey);

  const [
    tenantResult,
    { data: rows, error: rowsError },
    { data: allToday, error: statsError },
    { data: serviceRows, error: servicesError },
    { count: pendingTomorrowCount, error: tomorrowError },
    { data: paymentRows, error: paymentsError },
    { data: yesterdayRows, error: yesterdayError },
  ] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, name, doctor_name")
      .eq("id", tenantId)
      .single(),
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
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .gte("appointment_date", tomorrowBounds.startIso)
      .lt("appointment_date", tomorrowBounds.endExclusiveIso),
    canViewRevenue
      ? supabase
          .from("patient_payments")
          .select("id, patient_id, amount_paid, paid_at, patients ( name )")
          .eq("tenant_id", tenantId)
          .gte("paid_at", startIso)
          .lt("paid_at", endExclusiveIso)
          .order("paid_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("appointments")
      .select(
        `
        patient_id,
        patients ( id, name, total_balance_due )
      `,
      )
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .gte("appointment_date", yesterdayBounds.startIso)
      .lt("appointment_date", yesterdayBounds.endExclusiveIso),
  ]);

  let tenant = tenantResult.data;
  if (tenantResult.error || !tenant) {
    const fallback = await supabase
      .from("tenants")
      .select("id, name")
      .eq("id", tenantId)
      .single();
    if (fallback.error || !fallback.data) {
      throw new Error(
        `Failed to load clinic: ${tenantResult.error?.message ?? fallback.error?.message}`,
      );
    }
    tenant = { ...fallback.data, doctor_name: fallback.data.name };
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

  if (tomorrowError) {
    throw new Error(`Failed to load tomorrow confirmations: ${tomorrowError.message}`);
  }

  if (paymentsError) {
    throw new Error(`Failed to load payments: ${paymentsError.message}`);
  }

  if (yesterdayError) {
    throw new Error(`Failed to load yesterday balances: ${yesterdayError.message}`);
  }

  const appointments = ((rows ?? []) as AppointmentJoinRow[])
    .map(mapAppointmentRow)
    .filter((appointment) =>
      isAppointmentOnCairoDate(appointment.appointmentDate, todayKey),
    );
  const miniStats = computeDailyMiniStats(appointments);

  const pulse: DailyPulseStats = {
    total: allToday?.length ?? 0,
    pending: allToday?.filter((row) => row.status === "pending").length ?? 0,
    completed: allToday?.filter((row) => row.status === "completed").length ?? 0,
    noShows: allToday?.filter((row) => row.status === "no_show").length ?? 0,
  };

  const services: DashboardService[] = (serviceRows ?? []).map(mapServiceRow);

  const doctorName = tenant.doctor_name?.trim() || tenant.name;
  const inSession = appointments.filter((item) => item.status === "in_session");
  const primarySession = inSession[0] ?? null;
  const secondarySession = inSession[1] ?? null;

  const rooms: ClinicRoomStatus[] = [
    {
      id: "room-1",
      label: doctorName.startsWith("د") ? doctorName : `د. ${doctorName}`,
      busy: Boolean(primarySession),
      detail: primarySession
        ? primarySession.serviceName
        : "",
    },
    {
      id: "room-2",
      label: "غرفة الإجراءات",
      busy: Boolean(secondarySession),
      detail: secondarySession ? secondarySession.serviceName : "",
    },
  ];

  type PaymentJoin = {
    id: string;
    patient_id: string;
    amount_paid: number;
    paid_at: string;
    patients?: { name: string } | { name: string }[] | null;
  };

  const todayPayments: PaymentTickerItem[] = ((paymentRows ?? []) as PaymentJoin[]).map(
    (row) => {
      const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
      return {
        id: row.id,
        patientId: row.patient_id,
        patientName: patient?.name ?? "—",
        amountPaid: row.amount_paid,
        paidAt: row.paid_at,
      };
    },
  );

  type YesterdayJoin = {
    patient_id: string;
    patients?:
      | { id: string; name: string; total_balance_due: number }
      | { id: string; name: string; total_balance_due: number }[]
      | null;
  };

  const unpaidMap = new Map<string, UnpaidCollectItem>();
  for (const row of (yesterdayRows ?? []) as YesterdayJoin[]) {
    const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
    if (!patient || (patient.total_balance_due ?? 0) <= 0) continue;
    unpaidMap.set(patient.id, {
      id: patient.id,
      name: patient.name,
      amountDue: patient.total_balance_due,
    });
  }
  const yesterdayUnpaid = Array.from(unpaidMap.values())
    .sort((a, b) => b.amountDue - a.amountDue)
    .slice(0, 8);

  const occupied =
    appointments.filter((item) =>
      ["checked_in", "in_session", "completed"].includes(item.status),
    ).length;
  const capacityPct =
    appointments.length === 0
      ? 0
      : Math.min(100, Math.round((occupied / appointments.length) * 100));

  return {
    appointments,
    clinicName: tenant.name,
    doctorName,
    tenantId,
    pulse,
    miniStats,
    canViewRevenue,
    services,
    pendingTomorrowCount: pendingTomorrowCount ?? 0,
    todayPayments,
    yesterdayUnpaid,
    rooms,
    capacityPct,
  };
}
