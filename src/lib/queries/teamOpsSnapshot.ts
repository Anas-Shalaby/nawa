import type { Appointment } from "@/lib/dashboard/types";
import {
  APPOINTMENT_SELECT,
  APPOINTMENT_SELECT_LEGACY,
  mapAppointmentRow,
  type AppointmentJoinRow,
} from "@/lib/dashboard/mapAppointment";
import { resolveStaffPermissions } from "@/lib/auth/staffPermissions";
import { roleHasPermission } from "@/lib/auth/permissions";
import {
  getCairoDayOfWeek,
  getCairoDayQueryBounds,
  getCairoTodayKey,
} from "@/lib/datetime/cairo";
import { buildTeamOpsDerived } from "@/lib/team/buildTeamOpsDerived";
import { normalizeTeamRole, shiftCapacityMinutes } from "@/lib/team/teamOpsSelectors";
import type { TeamOpsSnapshot, TeamStaffBase } from "@/lib/team/types";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

type StaffRow = {
  id: string;
  display_name: string;
  role: string;
  availability: "available" | "busy" | "break" | "offline";
  status_changed_at: string;
  avg_consult_minutes: number;
  department?: string | null;
  phone?: string | null;
  email?: string | null;
  user_id?: string | null;
  is_suspended?: boolean | null;
  leave_until?: string | null;
  rating_avg?: number | null;
};

type WorkingHoursRow = {
  day_of_week: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
  shifts?: unknown;
};

function parseShifts(row: WorkingHoursRow): { startTime: string; endTime: string }[] {
  if (Array.isArray(row.shifts) && row.shifts.length > 0) {
    return row.shifts
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const record = entry as Record<string, unknown>;
        const start =
          typeof record.start === "string"
            ? record.start
            : typeof record.startTime === "string"
              ? record.startTime
              : null;
        const end =
          typeof record.end === "string"
            ? record.end
            : typeof record.endTime === "string"
              ? record.endTime
              : null;
        if (!start || !end) return null;
        return { startTime: start.slice(0, 5), endTime: end.slice(0, 5) };
      })
      .filter((s): s is { startTime: string; endTime: string } => Boolean(s));
  }

  if (row.is_open && row.start_time && row.end_time) {
    return [
      {
        startTime: row.start_time.slice(0, 5),
        endTime: row.end_time.slice(0, 5),
      },
    ];
  }

  return [];
}

async function fetchTodayAppointments(
  supabase: Awaited<ReturnType<typeof createAuthenticatedClient>>,
  tenantId: string,
  startIso: string,
  endExclusiveIso: string,
): Promise<Appointment[]> {
  const primary = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("tenant_id", tenantId)
    .gte("appointment_date", startIso)
    .lt("appointment_date", endExclusiveIso)
    .not("status", "in", "(no_show,canceled)")
    .order("appointment_date", { ascending: true });

  const rows = !primary.error
    ? ((primary.data ?? []) as AppointmentJoinRow[])
    : await (async () => {
        const legacy = await supabase
          .from("appointments")
          .select(APPOINTMENT_SELECT_LEGACY)
          .eq("tenant_id", tenantId)
          .gte("appointment_date", startIso)
          .lt("appointment_date", endExclusiveIso)
          .not("status", "in", "(no_show,canceled)")
          .order("appointment_date", { ascending: true });
        if (legacy.error) throw new Error(legacy.error.message);
        return (legacy.data ?? []) as AppointmentJoinRow[];
      })();

  return rows.map(mapAppointmentRow);
}

async function fetchStaffRows(
  supabase: Awaited<ReturnType<typeof createAuthenticatedClient>>,
  tenantId: string,
): Promise<StaffRow[]> {
  const extended = await supabase
    .from("staff_profiles")
    .select(
      `
      id,
      display_name,
      role,
      availability,
      status_changed_at,
      avg_consult_minutes,
      department,
      phone,
      email,
      user_id,
      is_suspended,
      leave_until,
      rating_avg
    `,
    )
    .eq("tenant_id", tenantId)
    .order("display_name", { ascending: true });

  if (!extended.error) {
    return (extended.data ?? []) as StaffRow[];
  }

  // Fallback when migration 027 columns are not applied yet
  const mid = await supabase
    .from("staff_profiles")
    .select(
      `
      id,
      display_name,
      role,
      availability,
      status_changed_at,
      avg_consult_minutes,
      department,
      phone,
      leave_until,
      rating_avg
    `,
    )
    .eq("tenant_id", tenantId)
    .order("display_name", { ascending: true });

  if (!mid.error) {
    return (mid.data ?? []) as StaffRow[];
  }

  const basic = await supabase
    .from("staff_profiles")
    .select(
      `
      id,
      display_name,
      role,
      availability,
      status_changed_at,
      avg_consult_minutes
    `,
    )
    .eq("tenant_id", tenantId)
    .order("display_name", { ascending: true });

  if (basic.error) {
    throw new Error(`Failed to load staff: ${basic.error.message}`);
  }

  return (basic.data ?? []) as StaffRow[];
}

function formatWorkingHoursLabel(shifts: { startTime: string; endTime: string }[]): string | null {
  if (shifts.length === 0) return null;
  return shifts.map((s) => `${s.startTime}–${s.endTime}`).join(" · ");
}

function toStaffBase(row: StaffRow): TeamStaffBase {
  return {
    id: row.id,
    displayName: row.display_name,
    role: normalizeTeamRole(row.role),
    department: row.department ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    userId: row.user_id ?? null,
    isSuspended: Boolean(row.is_suspended),
    availability: row.availability,
    statusChangedAt: row.status_changed_at,
    avgConsultMinutes: row.avg_consult_minutes,
    leaveUntil: row.leave_until ?? null,
    ratingAvg: row.rating_avg ?? null,
  };
}

export async function fetchTeamOpsSnapshot(): Promise<TeamOpsSnapshot> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const permissions = await resolveStaffPermissions(supabase);
  const canManageClinic =
    roleHasPermission(permissions.role, "team.ops", permissions.isSuspended);
  const canManageRoles =
    roleHasPermission(permissions.role, "team.roles", permissions.isSuspended);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;
  const todayKey = getCairoTodayKey();
  const dayOfWeek = getCairoDayOfWeek(todayKey);
  const { startIso, endExclusiveIso } = getCairoDayQueryBounds(todayKey);

  const [tenantResult, staffRows, appointments, hoursResult] = await Promise.all([
    supabase.from("tenants").select("id, name, doctor_name").eq("id", tenantId).single(),
    fetchStaffRows(supabase, tenantId),
    fetchTodayAppointments(supabase, tenantId, startIso, endExclusiveIso),
    supabase
      .from("working_hours")
      .select("day_of_week, is_open, start_time, end_time, shifts")
      .eq("tenant_id", tenantId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle(),
  ]);

  if (tenantResult.error || !tenantResult.data) {
    throw new Error(tenantResult.error?.message ?? "Clinic not found.");
  }

  const clinicName = tenantResult.data.name;
  const doctorName = tenantResult.data.doctor_name?.trim() || clinicName || "Doctor";

  const todayHours = hoursResult.data as WorkingHoursRow | null;
  const shifts = todayHours ? parseShifts(todayHours) : [];
  const isClinicOpen = Boolean(todayHours?.is_open && shifts.length > 0);
  const capacityMinutes = isClinicOpen ? shiftCapacityMinutes(shifts) : 8 * 60;
  const workingHoursLabel = formatWorkingHoursLabel(shifts);

  let staff: TeamStaffBase[] = staffRows.map(toStaffBase);
  if (staff.length === 0) {
    staff = [
      {
        id: "primary-doctor",
        displayName: doctorName,
        role: "doctor",
        department: null,
        phone: null,
        email: null,
        userId: null,
        isSuspended: false,
        availability: appointments.some((a) => a.status === "in_session") ? "busy" : "available",
        statusChangedAt: new Date().toISOString(),
        avgConsultMinutes: 20,
        leaveUntil: null,
        ratingAvg: null,
      },
    ];
  } else if (currentUserId) {
    // Hide the signed-in member from Team Ops — manage self from Account instead.
    staff = staff.filter((member) => member.userId !== currentUserId);
  }

  const derived = buildTeamOpsDerived({
    staff,
    appointments,
    capacityMinutes,
    isClinicOpen,
    workingHoursLabel,
    doctorName,
  });

  return {
    clinicName,
    date: todayKey,
    tenantId,
    doctorName,
    capacityMinutes,
    isClinicOpen,
    workingHoursLabel,
    staff,
    appointments,
    ...derived,
    canManageClinic,
    canManageRoles,
    currentUserId,
  };
}
