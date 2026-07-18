import type { Appointment, StaffAvailability } from "@/lib/dashboard/types";
import type {
  OverviewFilterKey,
  TeamActivityEvent,
  TeamInsightKind,
  TeamLiveStatus,
  TeamMemberView,
  TeamOpsInsight,
  TeamOverviewCounts,
  TeamRole,
  TeamScheduleSlot,
  WorkloadHeat,
} from "@/lib/team/types";

const ROLE_ALIASES: Record<string, TeamRole> = {
  owner: "owner",
  admin: "admin",
  doctor: "doctor",
  dr: "doctor",
  physician: "doctor",
  receptionist: "receptionist",
  front_desk: "receptionist",
  frontdesk: "receptionist",
  nurse: "nurse",
  assistant: "assistant",
  lab: "lab",
  laboratory: "lab",
  manager: "manager",
  cashier: "cashier",
  intern: "intern",
};

export function normalizeTeamRole(raw: string | null | undefined): TeamRole {
  const key = (raw ?? "doctor").trim().toLowerCase().replace(/\s+/g, "_");
  return ROLE_ALIASES[key] ?? "doctor";
}

export function isClinicalRole(role: TeamRole): boolean {
  return role === "doctor" || role === "nurse" || role === "lab";
}

export function isReceptionRole(role: TeamRole): boolean {
  return role === "receptionist";
}

export function heatFromPct(pct: number): WorkloadHeat {
  if (pct >= 90) return "critical";
  if (pct >= 70) return "high";
  if (pct >= 40) return "medium";
  return "low";
}

export function deriveLiveStatus(input: {
  availability: StaffAvailability;
  leaveUntil: string | null;
  hasInSession: boolean;
  nowIso?: string;
}): TeamLiveStatus {
  const now = input.nowIso ?? new Date().toISOString();
  if (input.leaveUntil && input.leaveUntil > now) return "on_leave";
  if (input.hasInSession) return "in_session";
  if (input.availability === "break") return "break";
  if (input.availability === "offline") return "offline";
  if (input.availability === "busy") return "busy";
  return "available";
}

export function minutesBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / 60_000);
}

export function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export function shiftCapacityMinutes(
  shifts: { startTime: string; endTime: string }[],
): number {
  return shifts.reduce((sum, shift) => {
    const start = parseTimeToMinutes(shift.startTime);
    const end = parseTimeToMinutes(shift.endTime);
    return sum + Math.max(0, end - start);
  }, 0);
}

export function buildOverview(members: TeamMemberView[]): TeamOverviewCounts {
  const onDuty = members.filter((m) => m.isOnDutyToday && m.status !== "offline" && m.status !== "on_leave");
  const workloadMembers = members.filter((m) => m.isOnDutyToday && isClinicalRole(m.role));
  const avgWorkload =
    workloadMembers.length === 0
      ? 0
      : Math.round(
          workloadMembers.reduce((sum, m) => sum + m.workload.pct, 0) / workloadMembers.length,
        );

  return {
    totalStaff: members.length,
    doctorsOnDuty: onDuty.filter((m) => m.role === "doctor").length,
    receptionActive: onDuty.filter((m) => isReceptionRole(m.role)).length,
    availableNow: members.filter((m) => m.status === "available").length,
    busyNow: members.filter((m) => m.status === "busy" || m.status === "in_session").length,
    onLeave: members.filter((m) => m.status === "on_leave").length,
    offline: members.filter((m) => m.status === "offline").length,
    averageWorkloadPct: avgWorkload,
  };
}

export function buildInsights(members: TeamMemberView[]): TeamOpsInsight[] {
  const insights: TeamOpsInsight[] = [];
  const doctors = members.filter((m) => m.role === "doctor" && m.isOnDutyToday);

  const mostAppts = [...doctors].sort((a, b) => b.todayAppointments - a.todayAppointments)[0];
  if (mostAppts && mostAppts.todayAppointments > 0) {
    insights.push({
      id: "most_appointments",
      kind: "most_appointments",
      memberId: mostAppts.id,
      memberName: mostAppts.displayName,
      valueLabel: String(mostAppts.todayAppointments),
    });
  }

  const fastest = [...doctors]
    .filter((m) => m.avgConsultMinutes > 0)
    .sort((a, b) => a.avgConsultMinutes - b.avgConsultMinutes)[0];
  if (fastest) {
    insights.push({
      id: "fastest_consult",
      kind: "fastest_consult",
      memberId: fastest.id,
      memberName: fastest.displayName,
      valueLabel: `${fastest.avgConsultMinutes}`,
    });
  }

  const available = doctors
    .filter((m) => m.status === "available")
    .sort((a, b) => a.workload.pct - b.workload.pct)[0];
  if (available) {
    insights.push({
      id: "most_available",
      kind: "most_available",
      memberId: available.id,
      memberName: available.displayName,
      valueLabel: `${available.waitingPatients}`,
    });
  }

  const longestQueue = [...doctors].sort((a, b) => b.waitingPatients - a.waitingPatients)[0];
  if (longestQueue && longestQueue.waitingPatients > 0) {
    insights.push({
      id: "longest_queue",
      kind: "longest_queue",
      memberId: longestQueue.id,
      memberName: longestQueue.displayName,
      valueLabel: String(longestQueue.waitingPatients),
    });
  }

  const highestLoad = [...doctors].sort((a, b) => b.workload.pct - a.workload.pct)[0];
  if (highestLoad && highestLoad.workload.heat !== "low") {
    insights.push({
      id: "highest_workload",
      kind: "highest_workload",
      memberId: highestLoad.id,
      memberName: highestLoad.displayName,
      valueLabel: `${highestLoad.workload.pct}%`,
    });
  }

  const overloaded = doctors.filter((m) => m.workload.heat === "critical" || m.workload.heat === "high");
  const underused = doctors.filter(
    (m) => m.status === "available" && (m.workload.heat === "low" || m.workload.heat === "medium"),
  );
  if (overloaded[0] && underused[0] && overloaded[0].id !== underused[0].id) {
    insights.push({
      id: "balanced_suggestion",
      kind: "balanced_suggestion",
      memberId: underused[0].id,
      memberName: underused[0].displayName,
      valueLabel: overloaded[0].displayName,
    });
  }

  return insights.slice(0, 6);
}

export function filterMembers(
  members: TeamMemberView[],
  opts: {
    query: string;
    role: TeamRole | "all";
    overview: OverviewFilterKey;
    status: TeamLiveStatus | "all";
  },
): TeamMemberView[] {
  const q = opts.query.trim().toLowerCase();

  return members.filter((member) => {
    if (q) {
      const hay = `${member.displayName} ${member.role} ${member.department ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (opts.role !== "all" && member.role !== opts.role) return false;
    if (opts.status !== "all" && member.status !== opts.status) return false;

    switch (opts.overview) {
      case "all":
        return true;
      case "on_duty":
        return member.isOnDutyToday && member.status !== "offline" && member.status !== "on_leave";
      case "doctors":
        return member.role === "doctor";
      case "reception":
        return isReceptionRole(member.role);
      case "available":
        return member.status === "available";
      case "busy":
        return member.status === "busy" || member.status === "in_session";
      case "on_leave":
        return member.status === "on_leave";
      case "offline":
        return member.status === "offline";
      case "workload":
        return member.workload.heat === "high" || member.workload.heat === "critical";
      default:
        return true;
    }
  });
}

export function buildActivityFromAppointments(
  appointments: Appointment[],
  staffById: Map<string, { displayName: string }>,
  fallbackDoctorName: string,
): TeamActivityEvent[] {
  const events: TeamActivityEvent[] = [];

  for (const appt of appointments) {
    const actor =
      (appt.assignedStaffId && staffById.get(appt.assignedStaffId)?.displayName) ||
      fallbackDoctorName;

    if (appt.status === "in_session" && appt.sessionStartedAt) {
      events.push({
        id: `${appt.id}-session`,
        at: appt.sessionStartedAt,
        verb: "session_started",
        actorName: actor,
        subjectName: appt.patientName,
        detail: appt.serviceName,
      });
    } else if (appt.status === "checked_in" && appt.checkedInAt) {
      events.push({
        id: `${appt.id}-checkin`,
        at: appt.checkedInAt,
        verb: "checked_in",
        actorName: actor,
        subjectName: appt.patientName,
        detail: null,
      });
    } else if (appt.status === "confirmed") {
      events.push({
        id: `${appt.id}-confirmed`,
        at: appt.appointmentDate,
        verb: "confirmed",
        actorName: actor,
        subjectName: appt.patientName,
        detail: appt.serviceName,
      });
    } else if (appt.status === "completed" && appt.completedAt) {
      events.push({
        id: `${appt.id}-completed`,
        at: appt.completedAt,
        verb: "completed",
        actorName: actor,
        subjectName: appt.patientName,
        detail: appt.serviceName,
      });
    }
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 40);
}

export function appointmentsForMember(
  appointments: Appointment[],
  memberId: string,
  isPrimaryDoctor: boolean,
  hasAnyAssignment: boolean,
): Appointment[] {
  const direct = appointments.filter((a) => a.assignedStaffId === memberId);
  if (direct.length > 0) return direct;

  // Single-doctor clinics often leave assigned_staff_id null — attribute to primary doctor.
  if (isPrimaryDoctor && !hasAnyAssignment) {
    return appointments;
  }

  return [];
}

export function toScheduleSlots(
  appointments: Appointment[],
  formatTime: (iso: string) => string,
): TeamScheduleSlot[] {
  return [...appointments]
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    )
    .map((appt) => ({
      id: appt.id,
      timeLabel: formatTime(appt.appointmentDate),
      patientName: appt.patientName,
      serviceName: appt.serviceName,
      status: appt.status,
    }));
}

export function insightKindOrder(kind: TeamInsightKind): number {
  const order: TeamInsightKind[] = [
    "most_appointments",
    "longest_queue",
    "highest_workload",
    "most_available",
    "fastest_consult",
    "balanced_suggestion",
  ];
  return order.indexOf(kind);
}
