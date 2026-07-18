import type { Appointment } from "@/lib/dashboard/types";
import {
  appointmentsForMember,
  buildActivityFromAppointments,
  buildInsights,
  buildOverview,
  deriveLiveStatus,
  heatFromPct,
  toScheduleSlots,
} from "@/lib/team/teamOpsSelectors";
import type {
  TeamActivityEvent,
  TeamMemberView,
  TeamOpsInsight,
  TeamOverviewCounts,
  TeamStaffBase,
} from "@/lib/team/types";

export type { TeamStaffBase };

export interface TeamOpsDerived {
  members: TeamMemberView[];
  overview: TeamOverviewCounts;
  insights: TeamOpsInsight[];
  activity: TeamActivityEvent[];
}

function formatCairoTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function buildTeamOpsDerived(input: {
  staff: TeamStaffBase[];
  appointments: Appointment[];
  capacityMinutes: number;
  isClinicOpen: boolean;
  workingHoursLabel: string | null;
  doctorName: string;
}): TeamOpsDerived {
  const { staff, appointments, capacityMinutes, isClinicOpen, workingHoursLabel, doctorName } =
    input;

  const hasAnyAssignment = appointments.some((a) => Boolean(a.assignedStaffId));
  const primaryDoctorId =
    staff.find((s) => s.role === "doctor")?.id ?? staff[0]?.id ?? null;

  const members: TeamMemberView[] = staff.map((row) => {
    const isPrimary = row.id === primaryDoctorId;
    const memberAppts = appointmentsForMember(
      appointments,
      row.id,
      isPrimary,
      hasAnyAssignment,
    );

    const inSession = memberAppts.find((a) => a.status === "in_session") ?? null;
    const waiting = memberAppts.filter((a) => a.status === "checked_in").length;
    const bookedMinutes = memberAppts
      .filter((a) => a.status !== "canceled" && a.status !== "no_show")
      .reduce((sum, a) => sum + (a.durationMinutes || row.avgConsultMinutes || 20), 0);

    const pct =
      capacityMinutes > 0 ? Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100)) : 0;

    const status = deriveLiveStatus({
      availability: row.availability,
      leaveUntil: row.leaveUntil,
      hasInSession: Boolean(inSession),
    });

    const lastActivityAt =
      inSession?.sessionStartedAt ??
      memberAppts
        .map((a) => a.checkedInAt ?? a.completedAt ?? a.appointmentDate)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ??
      row.statusChangedAt;

    const effectiveStatus = row.isSuspended ? "offline" : status;

    return {
      id: row.id,
      displayName: row.displayName,
      role: row.role,
      department: row.department,
      phone: row.phone,
      email: row.email,
      userId: row.userId,
      isSuspended: row.isSuspended,
      isLinked: Boolean(row.userId),
      status: effectiveStatus,
      availability: row.availability,
      statusChangedAt: row.statusChangedAt,
      isOnDutyToday:
        isClinicOpen &&
        !row.isSuspended &&
        effectiveStatus !== "on_leave" &&
        effectiveStatus !== "offline",
      workingHoursLabel,
      todayAppointments: memberAppts.length,
      waitingPatients: waiting,
      currentPatientName: inSession?.patientName ?? null,
      currentAppointmentId: inSession?.id ?? null,
      avgConsultMinutes: row.avgConsultMinutes,
      ratingAvg: row.ratingAvg,
      lastActivityAt,
      workload: {
        bookedMinutes,
        capacityMinutes,
        pct,
        heat: heatFromPct(pct),
      },
      scheduleToday: toScheduleSlots(memberAppts, formatCairoTime),
    };
  });

  const staffById = new Map(members.map((m) => [m.id, { displayName: m.displayName }] as const));

  return {
    members,
    overview: buildOverview(members),
    insights: buildInsights(members),
    activity: buildActivityFromAppointments(appointments, staffById, doctorName),
  };
}

export function listAssignableAppointments(appointments: Appointment[]): Appointment[] {
  return appointments
    .filter((a) => a.status === "confirmed" || a.status === "checked_in" || a.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    );
}

export function listWaitingForStaff(
  appointments: Appointment[],
  staffId: string,
): Appointment[] {
  return appointments
    .filter(
      (a) =>
        a.status === "checked_in" &&
        (a.assignedStaffId === staffId || !a.assignedStaffId),
    )
    .sort(
      (a, b) =>
        new Date(a.checkedInAt ?? a.appointmentDate).getTime() -
        new Date(b.checkedInAt ?? b.appointmentDate).getTime(),
    );
}
