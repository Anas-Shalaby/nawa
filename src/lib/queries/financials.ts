import {
  getCairoDayBounds,
  getCairoMonthStart,
} from "@/lib/datetime/analytics";
import type { FinancialOverview, FinancialTransaction } from "@/lib/dashboard/analyticsTypes";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

type RevenueRow = {
  id: string;
  appointment_date: string;
  replaced_appointment_id: string | null;
  patients: { name: string } | { name: string }[] | null;
  services: { name: string; price_egp: number | null } | { name: string; price_egp: number | null }[] | null;
};

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function sumRevenue(rows: RevenueRow[]): number {
  return rows.reduce((total, row) => {
    const service = unwrapJoin(row.services);
    return total + (service?.price_egp ?? 0);
  }, 0);
}

function mapTransaction(row: RevenueRow): FinancialTransaction {
  const patient = unwrapJoin(row.patients);
  const service = unwrapJoin(row.services);

  return {
    id: row.id,
    patientName: patient?.name ?? "—",
    serviceName: service?.name ?? "—",
    priceEgp: service?.price_egp ?? 0,
    appointmentDate: row.appointment_date,
    isBackfill: row.replaced_appointment_id !== null,
  };
}

export async function fetchFinancialOverview(): Promise<FinancialOverview> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const { startIso: dayStart, endIso: dayEnd } = getCairoDayBounds();
  const monthStart = getCairoMonthStart();

  const select = `
    id,
    appointment_date,
    replaced_appointment_id,
    patients ( name ),
    services ( name, price_egp )
  `;

  const [
    { data: dailyRows, error: dailyError },
    { data: monthlyRows, error: monthlyError },
    { data: backfillRows, error: backfillError },
    { data: recentRows, error: recentError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .gte("appointment_date", dayStart)
      .lte("appointment_date", dayEnd),
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .gte("appointment_date", monthStart),
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .not("replaced_appointment_id", "is", null)
      .not("status", "in", "(canceled,no_show)"),
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .order("appointment_date", { ascending: false })
      .limit(12),
  ]);

  if (dailyError) throw new Error(`Financials failed: ${dailyError.message}`);
  if (monthlyError) throw new Error(`Financials failed: ${monthlyError.message}`);
  if (backfillError) throw new Error(`Financials failed: ${backfillError.message}`);
  if (recentError) throw new Error(`Financials failed: ${recentError.message}`);

  return {
    dailyRevenueEgp: sumRevenue((dailyRows ?? []) as RevenueRow[]),
    monthlyRevenueEgp: sumRevenue((monthlyRows ?? []) as RevenueRow[]),
    nawaSavedRevenueEgp: sumRevenue((backfillRows ?? []) as RevenueRow[]),
    recentTransactions: ((recentRows ?? []) as RevenueRow[]).map(mapTransaction),
  };
}
