import type {
  Appointment,
  AppointmentPriority,
  AppointmentStatus,
  ArrivalSource,
  AttentionItem,
  DoctorOperationalStatus,
  FloorZone,
  MissionControlInsight,
  MissionControlMetrics,
  PatientGender,
  PaymentStatus,
} from "@/lib/dashboard/types";
import { isQueueVisible } from "@/lib/dashboard/types";

export const ZONE_ORDER: FloorZone[] = ["outside", "waiting", "doctor"];

export function statusForZone(
  zone: FloorZone,
  previous: AppointmentStatus,
): AppointmentStatus {
  if (zone === "outside") {
    return previous === "pending" ? "pending" : "confirmed";
  }
  if (zone === "waiting") return "checked_in";
  return "in_session";
}

export function zoneForStatus(status: AppointmentStatus): FloorZone | null {
  if (status === "pending" || status === "confirmed") return "outside";
  if (status === "checked_in") return "waiting";
  if (status === "in_session") return "doctor";
  return null;
}

export function minutesBetween(fromMs: number, to = Date.now()): number {
  if (!Number.isFinite(fromMs)) return 0;
  return Math.max(0, Math.floor((to - fromMs) / 60_000));
}

export function parseTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function waitingStartMs(appointment: Appointment): number {
  return (
    parseTimestamp(appointment.checkedInAt) ??
    parseTimestamp(appointment.appointmentDate) ??
    Date.now()
  );
}

export function sessionStartMs(appointment: Appointment): number {
  return (
    parseTimestamp(appointment.sessionStartedAt) ??
    parseTimestamp(appointment.checkedInAt) ??
    parseTimestamp(appointment.appointmentDate) ??
    Date.now()
  );
}

export type WaitSeverity = "neutral" | "warning" | "danger";

export function waitSeverity(minutes: number): WaitSeverity {
  if (minutes >= 20) return "danger";
  if (minutes >= 10) return "warning";
  return "neutral";
}

export function computePatientAge(dateOfBirth?: string | null, now = new Date()): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function resolvePaymentStatus(appointment: Appointment): PaymentStatus {
  if (appointment.invoiceStatus) return appointment.invoiceStatus;
  if ((appointment.balanceDue ?? 0) > 0) return "unpaid";
  if (appointment.priceEgp != null && appointment.priceEgp > 0) return "unpaid";
  return "unknown";
}

const PRIORITY_RANK: Record<AppointmentPriority, number> = {
  emergency: 0,
  urgent: 1,
  normal: 2,
};

export function compareCallNext(a: Appointment, b: Appointment): number {
  const pa = PRIORITY_RANK[a.priority ?? "normal"];
  const pb = PRIORITY_RANK[b.priority ?? "normal"];
  if (pa !== pb) return pa - pb;

  const waitA = waitingStartMs(a);
  const waitB = waitingStartMs(b);
  if (waitA !== waitB) return waitA - waitB;

  return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
}

export function deriveFloorColumns(
  appointments: Appointment[],
): Record<FloorZone, Appointment[]> {
  const map: Record<FloorZone, Appointment[]> = {
    outside: [],
    waiting: [],
    doctor: [],
  };

  const visible = appointments
    .filter((item) => isQueueVisible(item.status))
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    );

  for (const item of visible) {
    const zone = zoneForStatus(item.status);
    if (zone) map[zone].push(item);
  }

  return map;
}

export function computeMissionControlMetrics(
  appointments: Appointment[],
  now = Date.now(),
  todayRevenueEgp?: number,
): MissionControlMetrics {
  const active = appointments.filter(
    (item) => item.status !== "canceled" && item.status !== "no_show",
  );

  const waitingNow = active.filter((item) => item.status === "checked_in").length;
  const inSession = active.filter((item) => item.status === "in_session").length;
  const completed = active.filter((item) => item.status === "completed").length;
  const remaining = active.filter((item) =>
    ["pending", "confirmed"].includes(item.status),
  ).length;

  const waitingAppointments = active.filter((item) => item.status === "checked_in");
  const waitMinutes = waitingAppointments.map((item) =>
    minutesBetween(waitingStartMs(item), now),
  );
  const averageWaitMinutes =
    waitMinutes.length === 0
      ? 0
      : Math.round(waitMinutes.reduce((sum, value) => sum + value, 0) / waitMinutes.length);

  const occupied = active.filter((item) =>
    ["checked_in", "in_session", "completed"].includes(item.status),
  ).length;
  const capacityPct =
    active.length === 0 ? 0 : Math.min(100, Math.round((occupied / active.length) * 100));

  const remainingLoadMinutes = active
    .filter((item) => !["completed", "no_show", "canceled"].includes(item.status))
    .reduce((sum, item) => sum + (item.durationMinutes ?? 30), 0);

  return {
    totalToday: active.length,
    waitingNow,
    inSession,
    completed,
    remaining,
    averageWaitMinutes,
    doctorsAvailable: 0,
    doctorsTotal: 0,
    todayRevenueEgp,
    capacityPct,
    remainingLoadMinutes,
  };
}

export function buildAttentionItems(
  appointments: Appointment[],
  pendingTomorrowCount: number,
  canViewRevenue: boolean,
  now = Date.now(),
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const columns = deriveFloorColumns(appointments);

  for (const appointment of columns.waiting) {
    const mins = minutesBetween(waitingStartMs(appointment), now);
    if (mins >= 20) {
      items.push({
        id: `wait-${appointment.id}`,
        type: "long_wait",
        severity: mins >= 30 ? 5 : 4,
        title: appointment.patientName,
        detail: `${mins}m`,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        createdAt: new Date(waitingStartMs(appointment)).toISOString(),
      });
    }
  }

  if (canViewRevenue) {
    for (const appointment of appointments) {
      const payment = resolvePaymentStatus(appointment);
      if (
        payment === "unpaid" &&
        ["checked_in", "in_session", "completed"].includes(appointment.status)
      ) {
        items.push({
          id: `pay-${appointment.id}`,
          type: "missing_payment",
          severity: 3,
          title: appointment.patientName,
          detail: String(appointment.balanceDue ?? appointment.priceEgp ?? 0),
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          createdAt: appointment.appointmentDate,
        });
      }
    }
  }

  if (pendingTomorrowCount > 0) {
    items.push({
      id: "confirm-tomorrow",
      type: "confirmation",
      severity: 2,
      title: "tomorrow",
      detail: String(pendingTomorrowCount),
      createdAt: new Date(now).toISOString(),
    });
  }

  return items.sort((a, b) => b.severity - a.severity);
}

export function buildInsights(
  appointments: Appointment[],
  metrics: MissionControlMetrics,
  serviceFrequency: Map<string, number>,
): MissionControlInsight[] {
  const insights: MissionControlInsight[] = [];

  if (metrics.averageWaitMinutes >= 15) {
    insights.push({
      id: "avg-wait",
      tone: "warning",
      message: `Average wait is ${metrics.averageWaitMinutes} minutes — consider calling the next patient.`,
    });
  }

  const topService = Array.from(serviceFrequency.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topService && topService[1] >= 3) {
    insights.push({
      id: "top-service",
      tone: "neutral",
      message: `${topService[0]} is today's busiest service (${topService[1]} bookings).`,
    });
  }

  if (metrics.remaining > 0 && metrics.completed > 0) {
    insights.push({
      id: "pace",
      tone: "success",
      message: `${metrics.completed} completed with ${metrics.remaining} still expected outside.`,
    });
  }

  const longWaits = appointments.filter(
    (item) =>
      item.status === "checked_in" &&
      minutesBetween(waitingStartMs(item)) >= 20,
  ).length;

  if (longWaits > 0) {
    insights.push({
      id: "long-waits",
      tone: "warning",
      message: `${longWaits} patient(s) have waited over 20 minutes.`,
    });
  }

  return insights.slice(0, 4);
}

export function enrichDoctorMetrics(
  doctors: DoctorOperationalStatus[],
  appointments: Appointment[],
): DoctorOperationalStatus[] {
  const waitingCount = appointments.filter((item) => item.status === "checked_in").length;

  return doctors.map((doctor, index) => ({
    ...doctor,
    remainingQueue: index === 0 ? waitingCount : 0,
  }));
}

export function genderLabelKey(gender?: PatientGender): string {
  return gender ?? "unspecified";
}

export function arrivalLabelKey(source?: ArrivalSource | null): string {
  return source ?? "unknown";
}

export function expectedFinishAt(
  appointment: Appointment,
  avgConsultMinutes?: number,
): Date | null {
  const start = sessionStartMs(appointment);
  const duration = avgConsultMinutes ?? appointment.durationMinutes ?? 20;
  return new Date(start + duration * 60_000);
}
