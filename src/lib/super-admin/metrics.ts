import { createServiceRoleClient } from "@/utils/supabase/auth";

const DEFAULT_SUBSCRIPTION_EGP = 499;

export interface SaaSHealthMetrics {
  totalClinics: number;
  activeClinics: number;
  mrrEgp: number;
  totalProcessedAppointments: number;
  subscriptionPriceEgp: number;
  clinicsOnboardedByMonth: { monthKey: string; label: string; count: number }[];
}

function getSubscriptionPriceEgp(): number {
  const raw = process.env.SUPER_ADMIN_SUBSCRIPTION_EGP;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_SUBSCRIPTION_EGP;
  return Number.isFinite(parsed) ? parsed : DEFAULT_SUBSCRIPTION_EGP;
}

function monthKeyFromIso(iso: string): string {
  return iso.slice(0, 7);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("ar-EG", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export async function fetchSaaSHealthMetrics(): Promise<SaaSHealthMetrics> {
  const supabase = createServiceRoleClient();
  const subscriptionPriceEgp = getSubscriptionPriceEgp();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const [
    { count: totalClinics, error: tenantsError },
    { data: tenantRows, error: tenantRowsError },
    { data: recentAppointments, error: recentError },
    { count: totalProcessedAppointments, error: appointmentsError },
  ] = await Promise.all([
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase.from("tenants").select("created_at").order("created_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("tenant_id")
      .gte("created_at", sevenDaysAgoIso),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .in("status", ["completed", "checked_in", "in_session"]),
  ]);

  if (tenantsError) throw new Error(`Failed to count clinics: ${tenantsError.message}`);
  if (tenantRowsError) {
    throw new Error(`Failed to load clinic onboarding dates: ${tenantRowsError.message}`);
  }
  if (recentError) {
    throw new Error(`Failed to load active clinic activity: ${recentError.message}`);
  }
  if (appointmentsError) {
    throw new Error(`Failed to count processed appointments: ${appointmentsError.message}`);
  }

  const activeTenantIds = new Set(
    (recentAppointments ?? []).map((row) => row.tenant_id as string),
  );

  const monthCounts = new Map<string, number>();
  for (const row of tenantRows ?? []) {
    const key = monthKeyFromIso(row.created_at as string);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }

  const clinicsOnboardedByMonth = Array.from(monthCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, count]) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      count,
    }));

  return {
    totalClinics: totalClinics ?? 0,
    activeClinics: activeTenantIds.size,
    mrrEgp: activeTenantIds.size * subscriptionPriceEgp,
    totalProcessedAppointments: totalProcessedAppointments ?? 0,
    subscriptionPriceEgp,
    clinicsOnboardedByMonth,
  };
}
