import type { Appointment } from "@/lib/dashboard/types";

export interface DailyMiniStats {
  total: number;
  waiting: number;
  completed: number;
  expectedRevenueEgp: number;
}

const WAITING_STATUSES = new Set<Appointment["status"]>([
  "pending",
  "confirmed",
  "checked_in",
  "in_session",
]);

/** Derive live mini-stats from today's appointment rows (client-safe). */
export function computeDailyMiniStats(appointments: Appointment[]): DailyMiniStats {
  let waiting = 0;
  let completed = 0;
  let expectedRevenueEgp = 0;

  for (const appointment of appointments) {
    if (appointment.status === "canceled" || appointment.status === "no_show") {
      continue;
    }

    expectedRevenueEgp += appointment.priceEgp ?? 0;

    if (appointment.status === "completed") {
      completed += 1;
    } else if (WAITING_STATUSES.has(appointment.status)) {
      waiting += 1;
    }
  }

  return {
    total: appointments.filter(
      (item) => item.status !== "canceled" && item.status !== "no_show",
    ).length,
    waiting,
    completed,
    expectedRevenueEgp,
  };
}
