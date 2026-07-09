import {
  getCairoDayBounds,
  getCairoMonthStart,
} from "@/lib/datetime/analytics";
import type { FinancialOverview, FinancialTransaction } from "@/lib/dashboard/analyticsTypes";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

type RevenueRow = {
  id: string;
  appointment_date: string;
  status: "pending" | "confirmed" | "checked_in" | "in_session" | "completed" | "no_show" | "canceled";
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

function dateKey(isoDate: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

function rangeDateKeys(days: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(
      new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "Africa/Cairo",
      }).format(d),
    );
  }
  return keys;
}

export async function fetchFinancialOverview(): Promise<FinancialOverview> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const { startIso: dayStart, endIso: dayEnd } = getCairoDayBounds();
  const monthStart = getCairoMonthStart();
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
  const prevMonthStartDate = new Date(monthStart);
  if (Number.isNaN(prevMonthStartDate.getTime())) {
    throw new Error(`Financials failed: invalid month start (${monthStart})`);
  }
  prevMonthStartDate.setUTCMonth(prevMonthStartDate.getUTCMonth() - 1);
  const prevMonthStart = prevMonthStartDate.toISOString();

  const select = `
    id,
    appointment_date,
    status,
    replaced_appointment_id,
    patients ( name ),
    services ( name, price_egp )
  `;

  const [
    { data: dailyRows, error: dailyError },
    { data: monthlyRows, error: monthlyError },
    { data: backfillRows, error: backfillError },
    { data: recentRows, error: recentError },
    { data: dailyExpenseRows, error: dailyExpenseError },
    { data: monthlyExpenseRows, error: monthlyExpenseError },
    { data: trendRows, error: trendError },
    { data: debtRows, error: debtError },
    { data: prevMonthRows, error: prevMonthError },
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
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .eq("status", "no_show")
      .gte("appointment_date", dayStart)
      .lte("appointment_date", dayEnd),
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .eq("status", "no_show")
      .gte("appointment_date", monthStart),
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .in("status", ["completed", "no_show"])
      .gte("appointment_date", thirtyDaysAgo),
    supabase
      .from("patients")
      .select("id, name, phone_number, total_balance_due")
      .eq("tenant_id", tenantId)
      .gt("total_balance_due", 0)
      .order("total_balance_due", { ascending: false })
      .limit(30),
    supabase
      .from("appointments")
      .select(select)
      .eq("tenant_id", tenantId)
      .eq("status", "completed")
      .gte("appointment_date", prevMonthStart)
      .lt("appointment_date", monthStart),
  ]);

  if (dailyError) throw new Error(`Financials failed: ${dailyError.message}`);
  if (monthlyError) throw new Error(`Financials failed: ${monthlyError.message}`);
  if (backfillError) throw new Error(`Financials failed: ${backfillError.message}`);
  if (recentError) throw new Error(`Financials failed: ${recentError.message}`);
  if (dailyExpenseError) throw new Error(`Financials failed: ${dailyExpenseError.message}`);
  if (monthlyExpenseError) throw new Error(`Financials failed: ${monthlyExpenseError.message}`);
  if (trendError) throw new Error(`Financials failed: ${trendError.message}`);
  if (debtError) throw new Error(`Financials failed: ${debtError.message}`);
  if (prevMonthError) throw new Error(`Financials failed: ${prevMonthError.message}`);

  const incomeByDate = new Map<string, number>();
  const expenseByDate = new Map<string, number>();
  for (const row of (trendRows ?? []) as RevenueRow[]) {
    const key = dateKey(row.appointment_date);
    const value = sumRevenue([row]);
    if (row.status === "completed") {
      incomeByDate.set(key, (incomeByDate.get(key) ?? 0) + value);
    } else {
      expenseByDate.set(key, (expenseByDate.get(key) ?? 0) + value);
    }
  }

  const trendLast30Days = rangeDateKeys(30).map((key) => ({
    dateKey: key,
    label: key.slice(5).replace("-", "/"),
    incomeEgp: incomeByDate.get(key) ?? 0,
    expenseEgp: expenseByDate.get(key) ?? 0,
  }));

  const monthlyRevenue = sumRevenue((monthlyRows ?? []) as RevenueRow[]);
  const prevMonthlyRevenue = sumRevenue((prevMonthRows ?? []) as RevenueRow[]);
  const monthlyGrowthPct =
    prevMonthlyRevenue > 0
      ? Math.round(((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100)
      : 0;

  return {
    dailyRevenueEgp: sumRevenue((dailyRows ?? []) as RevenueRow[]),
    monthlyRevenueEgp: monthlyRevenue,
    nawaSavedRevenueEgp: sumRevenue((backfillRows ?? []) as RevenueRow[]),
    dailyExpensesEgp: sumRevenue((dailyExpenseRows ?? []) as RevenueRow[]),
    monthlyExpensesEgp: sumRevenue((monthlyExpenseRows ?? []) as RevenueRow[]),
    outstandingDebtsEgp: (debtRows ?? []).reduce((sum, row) => sum + (row.total_balance_due ?? 0), 0),
    monthlyGrowthPct,
    trendLast30Days,
    debtPatients: (debtRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      phoneNumber: row.phone_number,
      amountDue: row.total_balance_due ?? 0,
    })),
    recentTransactions: ((recentRows ?? []) as RevenueRow[]).map(mapTransaction),
    recentExpenses: ((monthlyExpenseRows ?? []) as RevenueRow[])
      .slice(0, 12)
      .map(mapTransaction),
  };
}
