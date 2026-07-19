import type {
  Appointment,
  AttentionItem,
  ClinicRoomStatus,
  DoctorOperationalStatus,
  MissionControlInsight,
  MissionControlSnapshot,
  PaymentTickerItem,
  UnpaidCollectItem,
} from "@/lib/dashboard/types";
import {
  APPOINTMENT_SELECT,
  APPOINTMENT_SELECT_LEGACY,
  mapAppointmentRow,
  type AppointmentJoinRow,
} from "@/lib/dashboard/mapAppointment";
import {
  buildAttentionItems,
  buildInsights,
  computeMissionControlMetrics,
  enrichDoctorMetrics,
} from "@/lib/dashboard/missionControlSelectors";
import { resolveStaffPermissions } from "@/lib/auth/staffPermissions";
import { mapServiceRow, SERVICE_SELECT } from "@/lib/services/mapService";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";
import { addCairoDays } from "@/lib/datetime/followUp";
import {
  getCairoDayQueryBounds,
  getCairoTodayKey,
  isAppointmentOnCairoDate,
} from "@/lib/datetime/cairo";

async function fetchTodayAppointmentRows(
  supabase: Awaited<ReturnType<typeof createAuthenticatedClient>>,
  tenantId: string,
  startIso: string,
  endExclusiveIso: string,
): Promise<AppointmentJoinRow[]> {
  const primary = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("tenant_id", tenantId)
    .gte("appointment_date", startIso)
    .lt("appointment_date", endExclusiveIso)
    .not("status", "in", "(no_show,canceled)")
    .order("appointment_date", { ascending: true });

  if (!primary.error) {
    return (primary.data ?? []) as AppointmentJoinRow[];
  }

  const legacy = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT_LEGACY)
    .eq("tenant_id", tenantId)
    .gte("appointment_date", startIso)
    .lt("appointment_date", endExclusiveIso)
    .not("status", "in", "(no_show,canceled)")
    .order("appointment_date", { ascending: true });

  if (legacy.error) {
    throw new Error(`Failed to load appointments: ${legacy.error.message}`);
  }

  return (legacy.data ?? []) as AppointmentJoinRow[];
}

function buildRoomsFromAppointments(
  appointments: Appointment[],
  doctorName: string,
  roomRows: { id: string; label: string }[],
): ClinicRoomStatus[] {
  const inSession = appointments.filter((item) => item.status === "in_session");
  const doctorLabel =
    doctorName.trim().length > 0
      ? doctorName.startsWith("د")
        ? doctorName
        : `Dr. ${doctorName}`
      : "Doctor";

  if (roomRows.length > 0) {
    return roomRows.map((room) => {
      const occupant = inSession.find((item) => item.roomId === room.id) ?? null;
      return {
        id: room.id,
        label: room.label,
        busy: Boolean(occupant),
        detail: occupant ? occupant.serviceName : "",
        currentPatientName: occupant?.patientName ?? null,
        currentAppointmentId: occupant?.id ?? null,
      };
    });
  }

  const primary = inSession[0] ?? null;
  const secondary = inSession[1] ?? null;

  return [
    {
      id: "room-1",
      label: doctorLabel,
      busy: Boolean(primary),
      detail: primary?.serviceName ?? "",
      currentPatientName: primary?.patientName ?? null,
      currentAppointmentId: primary?.id ?? null,
    },
    {
      id: "room-2",
      label: "Procedure room",
      busy: Boolean(secondary),
      detail: secondary?.serviceName ?? "",
      currentPatientName: secondary?.patientName ?? null,
      currentAppointmentId: secondary?.id ?? null,
    },
  ];
}

function buildDoctorsFromData(
  staffRows: {
    id: string;
    display_name: string;
    availability: DoctorOperationalStatus["availability"];
    avg_consult_minutes: number;
    clinic_rooms?: { label: string } | { label: string }[] | null;
  }[],
  appointments: Appointment[],
  doctorName: string,
): DoctorOperationalStatus[] {
  if (staffRows.length === 0) {
    const current = appointments.find((item) => item.status === "in_session") ?? null;
    return [
      {
        id: "primary-doctor",
        displayName: doctorName,
        availability: current ? "busy" : "available",
        roomLabel: current?.roomLabel ?? null,
        currentPatientName: current?.patientName ?? null,
        currentAppointmentId: current?.id ?? null,
        avgConsultMinutes: current?.durationMinutes ?? 20,
        remainingQueue: appointments.filter((item) => item.status === "checked_in").length,
      },
    ];
  }

  const mapped = staffRows.map((row) => {
    const room = Array.isArray(row.clinic_rooms)
      ? row.clinic_rooms[0]
      : row.clinic_rooms;
    const current =
      appointments.find(
        (item) =>
          item.status === "in_session" && item.assignedStaffId === row.id,
      ) ?? null;

    return {
      id: row.id,
      displayName: row.display_name,
      availability: row.availability,
      roomLabel: room?.label ?? current?.roomLabel ?? null,
      currentPatientName: current?.patientName ?? null,
      currentAppointmentId: current?.id ?? null,
      avgConsultMinutes: row.avg_consult_minutes,
      remainingQueue: 0,
    } satisfies DoctorOperationalStatus;
  });

  return enrichDoctorMetrics(mapped, appointments);
}

export async function fetchMissionControlSnapshot(): Promise<MissionControlSnapshot> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const permissions = await resolveStaffPermissions(supabase);
  const todayKey = getCairoTodayKey();
  const yesterdayKey = addCairoDays(-1);
  const tomorrowKey = addCairoDays(1);
  const { startIso, endExclusiveIso } = getCairoDayQueryBounds(todayKey);
  const yesterdayBounds = getCairoDayQueryBounds(yesterdayKey);
  const tomorrowBounds = getCairoDayQueryBounds(tomorrowKey);

  const roomsResult = await supabase
    .from("clinic_rooms")
    .select("id, label")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const staffResult = await supabase
    .from("staff_profiles")
    .select(
      `
      id,
      display_name,
      availability,
      avg_consult_minutes,
      clinic_rooms ( label )
    `,
    )
    .eq("tenant_id", tenantId)
    .order("display_name", { ascending: true });

  const tasksResult = await supabase
    .from("operational_tasks")
    .select("id, task_type, severity, title, detail, appointment_id, patient_id, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "open")
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  const [
    tenantResult,
    appointmentRows,
    { data: serviceRows, error: servicesError },
    { count: pendingTomorrowCount, error: tomorrowError },
    paymentResult,
    yesterdayResult,
  ] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, name, doctor_name, specialty")
      .eq("id", tenantId)
      .single(),
    fetchTodayAppointmentRows(supabase, tenantId, startIso, endExclusiveIso),
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
    permissions.canViewRevenue
      ? supabase
          .from("patient_payments")
          .select("id, patient_id, amount_paid, paid_at, patients ( name )")
          .eq("tenant_id", tenantId)
          .gte("paid_at", startIso)
          .lt("paid_at", endExclusiveIso)
          .order("paid_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [], error: null }),
    permissions.canViewRevenue
      ? supabase
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
          .lt("appointment_date", yesterdayBounds.endExclusiveIso)
      : Promise.resolve({ data: [], error: null }),
  ]);

  let tenant = tenantResult.data;
  if (tenantResult.error || !tenant) {
     const fallback = await supabase
      .from("tenants")
      .select("id, name, specialty")
      .eq("id", tenantId)
      .single();
    if (fallback.error || !fallback.data) {
      throw new Error(
        `Failed to load clinic: ${tenantResult.error?.message ?? fallback.error?.message}`,
      );
    }
    tenant = { ...fallback.data, doctor_name: fallback.data.name, specialty: fallback.data.specialty };
  }

  if (servicesError) {
    throw new Error(`Failed to load services: ${servicesError.message}`);
  }

  if (tomorrowError) {
    throw new Error(`Failed to load tomorrow confirmations: ${tomorrowError.message}`);
  }

  const appointments = appointmentRows
    .map(mapAppointmentRow)
    .filter((appointment) =>
      isAppointmentOnCairoDate(appointment.appointmentDate, todayKey),
    );

  const serviceFrequency = new Map<string, number>();
  for (const appointment of appointments) {
    serviceFrequency.set(
      appointment.serviceName,
      (serviceFrequency.get(appointment.serviceName) ?? 0) + 1,
    );
  }

  type PaymentJoin = {
    id: string;
    patient_id: string;
    amount_paid: number;
    paid_at: string;
    patients?: { name: string } | { name: string }[] | null;
  };

  const todayPayments: PaymentTickerItem[] = (
    (paymentResult.data ?? []) as PaymentJoin[]
  ).map((row) => {
    const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
    return {
      id: row.id,
      patientId: row.patient_id,
      patientName: patient?.name ?? "—",
      amountPaid: row.amount_paid,
      paidAt: row.paid_at,
    };
  });

  const todayRevenueEgp = permissions.canViewRevenue
    ? todayPayments.reduce((sum, item) => sum + item.amountPaid, 0)
    : undefined;

  type YesterdayJoin = {
    patient_id: string;
    patients?:
      | { id: string; name: string; total_balance_due: number }
      | { id: string; name: string; total_balance_due: number }[]
      | null;
  };

  const unpaidMap = new Map<string, UnpaidCollectItem>();
  if (permissions.canViewRevenue) {
    for (const row of (yesterdayResult.data ?? []) as YesterdayJoin[]) {
      const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
      if (!patient || (patient.total_balance_due ?? 0) <= 0) continue;
      unpaidMap.set(patient.id, {
        id: patient.id,
        name: patient.name,
        amountDue: patient.total_balance_due,
      });
    }
  }
  const yesterdayUnpaid = Array.from(unpaidMap.values())
    .sort((a, b) => b.amountDue - a.amountDue)
    .slice(0, 8);

  const doctorName = tenant.doctor_name?.trim() || tenant.name;
  const rooms = buildRoomsFromAppointments(
    appointments,
    doctorName,
    roomsResult.error ? [] : ((roomsResult.data ?? []) as { id: string; label: string }[]),
  );

  const doctors = buildDoctorsFromData(
    staffResult.error ? [] : ((staffResult.data ?? []) as Parameters<typeof buildDoctorsFromData>[0]),
    appointments,
    doctorName,
  );

  const metrics = computeMissionControlMetrics(appointments, Date.now(), todayRevenueEgp);
  metrics.doctorsTotal = doctors.length;
  metrics.doctorsAvailable = doctors.filter(
    (doctor) => doctor.availability === "available",
  ).length;

  const derivedAttention = buildAttentionItems(
    appointments,
    pendingTomorrowCount ?? 0,
    permissions.canViewRevenue,
  );

  const dbAttention: AttentionItem[] = tasksResult.error
    ? []
    : ((tasksResult.data ?? []) as {
    id: string;
    task_type: AttentionItem["type"];
    severity: number;
    title: string;
    detail: string | null;
    appointment_id: string | null;
    patient_id: string | null;
    created_at: string;
  }[]).map((task) => ({
    id: task.id,
    type: task.task_type,
    severity: task.severity,
    title: task.title,
    detail: task.detail ?? undefined,
    appointmentId: task.appointment_id ?? undefined,
    patientId: task.patient_id ?? undefined,
    createdAt: task.created_at,
  }));

  const attentionItems = [...derivedAttention, ...dbAttention]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 12);

  const insights: MissionControlInsight[] = buildInsights(
    appointments,
    metrics,
    serviceFrequency,
  );

  return {
    clinicName: tenant.name,
    doctorName,
    tenantId,
    date: todayKey,
    appointments,
    metrics,
    canViewRevenue: permissions.canViewRevenue,
    canManageQueue: permissions.canManageQueue,
    canCreateWalkIn: permissions.canCreateWalkIn,
    services: (serviceRows ?? []).map(mapServiceRow),
    pendingTomorrowCount: pendingTomorrowCount ?? 0,
    todayPayments,
    yesterdayUnpaid,
    rooms,
    doctors,
    attentionItems,
    insights,
    unreadNotificationsHint: 0,
    specialty: tenant.specialty ?? undefined,
  };
}

/** @deprecated Use fetchMissionControlSnapshot */
export async function fetchTodayAppointments() {
  const snapshot = await fetchMissionControlSnapshot();
  return {
    appointments: snapshot.appointments,
    clinicName: snapshot.clinicName,
    doctorName: snapshot.doctorName,
    tenantId: snapshot.tenantId,
    pulse: {
      total: snapshot.metrics.totalToday,
      pending: snapshot.appointments.filter((item) => item.status === "pending").length,
      completed: snapshot.metrics.completed,
      noShows: 0,
    },
    miniStats: {
      total: snapshot.metrics.totalToday,
      waiting: snapshot.metrics.waitingNow + snapshot.metrics.inSession,
      completed: snapshot.metrics.completed,
      expectedRevenueEgp: snapshot.metrics.todayRevenueEgp ?? 0,
    },
    canViewRevenue: snapshot.canViewRevenue,
    services: snapshot.services,
    pendingTomorrowCount: snapshot.pendingTomorrowCount,
    todayPayments: snapshot.todayPayments,
    yesterdayUnpaid: snapshot.yesterdayUnpaid,
    rooms: snapshot.rooms,
    capacityPct: snapshot.metrics.capacityPct,
  };
}
