import {
  getCairoHour,
  getCairoPeriodStart,
} from "@/lib/datetime/analytics";
import type { DashboardAnalytics, PeakHourBucket } from "@/lib/dashboard/analyticsTypes";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

const ANALYTICS_DAYS = 30;
const WORKING_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

function buildPeakHourBuckets(counts: Record<number, number>, locale: string): PeakHourBucket[] {
  return WORKING_HOURS.map((hour) => ({
    hour,
    label: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      hour: "numeric",
      hour12: true,
      timeZone: "Africa/Cairo",
    }).format(new Date(`2026-01-01T${hour.toString().padStart(2, "0")}:00:00+03:00`)),
    count: counts[hour] ?? 0,
  }));
}

export async function fetchDashboardAnalytics(locale = "ar"): Promise<DashboardAnalytics> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const periodStart = getCairoPeriodStart(ANALYTICS_DAYS);

  const [
    { count: completedCount, error: completedError },
    { count: noShowCount, error: noShowError },
    { data: backfills, error: backfillError },
    { count: warningCount, error: warningError },
    { data: bookingRows, error: bookingError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .gte("appointment_date", periodStart),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "no_show")
      .gte("appointment_date", periodStart),
    supabase
      .from("appointments")
      .select("services ( duration_minutes )")
      .eq("tenant_id", tenantId)
      .not("replaced_appointment_id", "is", null)
      .gte("appointment_date", periodStart),
    supabase
      .from("patients")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("no_show_count", 1)
      .eq("is_archived", false),
    supabase
      .from("appointments")
      .select("appointment_date")
      .eq("tenant_id", tenantId)
      .gte("appointment_date", periodStart)
      .not("status", "eq", "canceled"),
  ]);

  if (completedError) throw new Error(`Analytics failed: ${completedError.message}`);
  if (noShowError) throw new Error(`Analytics failed: ${noShowError.message}`);
  if (backfillError) throw new Error(`Analytics failed: ${backfillError.message}`);
  if (warningError) throw new Error(`Analytics failed: ${warningError.message}`);
  if (bookingError) throw new Error(`Analytics failed: ${bookingError.message}`);

  const resolved = completedCount ?? 0;
  const missed = noShowCount ?? 0;
  const attendanceRate =
    resolved + missed > 0 ? Math.round((resolved / (resolved + missed)) * 100) : 100;

  const savedMinutes = (backfills ?? []).reduce((total, row) => {
    const service = Array.isArray(row.services) ? row.services[0] : row.services;
    return total + (service?.duration_minutes ?? 0);
  }, 0);

  const hourCounts: Record<number, number> = {};
  for (const row of bookingRows ?? []) {
    const hour = getCairoHour(row.appointment_date);
    if (!WORKING_HOURS.includes(hour)) continue;
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }

  return {
    attendanceRate,
    savedHours: Math.round((savedMinutes / 60) * 10) / 10,
    warningPatientCount: warningCount ?? 0,
    peakHours: buildPeakHourBuckets(hourCounts, locale),
  };
}
