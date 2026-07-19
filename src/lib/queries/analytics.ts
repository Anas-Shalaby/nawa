import {
  getCairoHour,
  getCairoPeriodStart,
} from "@/lib/datetime/analytics";
import type {
  AnalyticsServiceRank,
  AnalyticsTrendPoint,
  DashboardAnalytics,
  PeakHourBucket,
} from "@/lib/dashboard/analyticsTypes";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

const WORKING_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

type ApptRow = {
  id: string;
  patient_id: string;
  appointment_date: string;
  status: string;
  replaced_appointment_id: string | null;
  checked_in_at: string | null;
  session_started_at: string | null;
  patients: { id: string; created_at: string } | { id: string; created_at: string }[] | null;
  services:
    | { name: string; price_egp: number | null; duration_minutes: number | null }
    | { name: string; price_egp: number | null; duration_minutes: number | null }[]
    | null;
};

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function cairoDateKey(isoDate: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

function buildPeakHourBuckets(
  counts: Record<number, number>,
  locale: string,
): PeakHourBucket[] {
  return WORKING_HOURS.map((hour) => ({
    hour,
    label: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      hour: "numeric",
      hour12: true,
      timeZone: "Africa/Cairo",
    }).format(
      new Date(`2026-01-01T${hour.toString().padStart(2, "0")}:00:00+03:00`),
    ),
    count: counts[hour] ?? 0,
  }));
}

function rateOrNull(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

export async function fetchDashboardAnalytics(
  locale = "ar",
  rangeDays = 30,
): Promise<DashboardAnalytics> {
  const days = [7, 30, 90].includes(rangeDays) ? rangeDays : 30;
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const periodStart = getCairoPeriodStart(days - 1);
  const previousStart = getCairoPeriodStart(days * 2 - 1);
  const previousEndExclusive = periodStart;

  const select = `
    id,
    patient_id,
    appointment_date,
    status,
    replaced_appointment_id,
    checked_in_at,
    session_started_at,
    patients ( id, created_at ),
    services ( name, price_egp, duration_minutes )
  `;

  const [
    { data: rows, error },
    { data: prevRows, error: prevError },
    { count: warningCount, error: warningError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .gte("appointment_date", periodStart),
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .gte("appointment_date", previousStart)
      .lt("appointment_date", previousEndExclusive),
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("no_show_count", 1)
      .eq("is_archived", false),
  ]);

  if (error) throw new Error(`Analytics failed: ${error.message}`);
  if (prevError) throw new Error(`Analytics failed: ${prevError.message}`);
  if (warningError) throw new Error(`Analytics failed: ${warningError.message}`);

  const current = (rows ?? []) as ApptRow[];
  const previous = (prevRows ?? []) as ApptRow[];

  const completed = current.filter((row) => row.status === "completed");
  const noShows = current.filter((row) => row.status === "no_show");
  const canceled = current.filter((row) => row.status === "canceled");
  const activeBookings = current.filter((row) => row.status !== "canceled");
  const settled = completed.length + noShows.length + canceled.length;

  const patientMap = new Map<string, { createdAt: string }>();
  for (const row of activeBookings) {
    const patient = unwrapJoin(row.patients);
    if (!patient) continue;
    patientMap.set(patient.id, { createdAt: patient.created_at });
  }

  let newPatients = 0;
  let returningPatients = 0;
  for (const patient of Array.from(patientMap.values())) {
    if (new Date(patient.createdAt).getTime() >= new Date(periodStart).getTime()) {
      newPatients += 1;
    } else {
      returningPatients += 1;
    }
  }
  const distinctPatients = newPatients + returningPatients;

  let periodRevenueEgp = 0;
  let savedMinutes = 0;
  const serviceMap = new Map<string, { count: number; revenueEgp: number }>();
  const hourCounts: Record<number, number> = {};
  const waitSamples: number[] = [];
  const dayBuckets = new Map<
    string,
    { completed: number; noShow: number; canceled: number }
  >();

  for (const row of current) {
    const key = cairoDateKey(row.appointment_date);
    const bucket = dayBuckets.get(key) ?? {
      completed: 0,
      noShow: 0,
      canceled: 0,
    };
    if (row.status === "completed") bucket.completed += 1;
    if (row.status === "no_show") bucket.noShow += 1;
    if (row.status === "canceled") bucket.canceled += 1;
    dayBuckets.set(key, bucket);

    if (row.status !== "canceled") {
      const hour = getCairoHour(row.appointment_date);
      if (WORKING_HOURS.includes(hour)) {
        hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
      }
    }

    const service = unwrapJoin(row.services);
    if (row.status === "completed") {
      const price = service?.price_egp ?? 0;
      periodRevenueEgp += price;
      const name = service?.name ?? "—";
      const currentService = serviceMap.get(name) ?? { count: 0, revenueEgp: 0 };
      currentService.count += 1;
      currentService.revenueEgp += price;
      serviceMap.set(name, currentService);

      if (row.checked_in_at && row.session_started_at) {
        const mins =
          (new Date(row.session_started_at).getTime() -
            new Date(row.checked_in_at).getTime()) /
          60_000;
        if (Number.isFinite(mins) && mins >= 0 && mins < 24 * 60) {
          waitSamples.push(mins);
        }
      }
    }

    if (row.replaced_appointment_id) {
      savedMinutes += service?.duration_minutes ?? 0;
    }
  }

  const previousRevenueEgp = previous.reduce((sum, row) => {
    const service = unwrapJoin(row.services);
    return sum + (service?.price_egp ?? 0);
  }, 0);

  const revenueGrowthPct =
    previousRevenueEgp > 0
      ? Math.round(((periodRevenueEgp - previousRevenueEgp) / previousRevenueEgp) * 100)
      : null;

  const topServices: AnalyticsServiceRank[] = Array.from(serviceMap.entries())
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Trend: last N days (cap labels for 90 → still day-level, UI can scroll)
  const reliabilityTrend: AnalyticsTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Africa/Cairo",
    }).format(d);
    const bucket = dayBuckets.get(key) ?? {
      completed: 0,
      noShow: 0,
      canceled: 0,
    };
    reliabilityTrend.push({
      dateKey: key,
      label: key.slice(5).replace("-", "/"),
      completed: bucket.completed,
      noShow: bucket.noShow,
      canceled: bucket.canceled,
    });
  }

  const averageWaitMinutes =
    waitSamples.length > 0
      ? Math.round(
          waitSamples.reduce((sum, value) => sum + value, 0) / waitSamples.length,
        )
      : null;

  return {
    rangeDays: days,
    attendanceRate: rateOrNull(completed.length, completed.length + noShows.length),
    noShowRate: rateOrNull(noShows.length, settled),
    cancelRate: rateOrNull(canceled.length, settled),
    newPatients,
    returningPatients,
    returningRate: rateOrNull(returningPatients, distinctPatients),
    revenueGrowthPct,
    periodRevenueEgp,
    previousRevenueEgp,
    averageWaitMinutes,
    savedHours: Math.round((savedMinutes / 60) * 10) / 10,
    warningPatientCount: warningCount ?? 0,
    totalAppointments: activeBookings.length,
    totalCompleted: completed.length,
    totalNoShow: noShows.length,
    totalCanceled: canceled.length,
    peakHours: buildPeakHourBuckets(hourCounts, locale),
    topServices,
    reliabilityTrend,
  };
}
