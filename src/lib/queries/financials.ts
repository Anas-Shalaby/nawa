import {
  getCairoDayBounds,
  getCairoMonthStart,
  getCairoPeriodStart,
} from "@/lib/datetime/analytics";
import type {
  FinancialOverview,
  FinancialPatientRank,
  FinancialServiceRank,
  FinancialTransaction,
  RecentPaymentItem,
} from "@/lib/dashboard/analyticsTypes";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

type RevenueRow = {
  id: string;
  appointment_date: string;
  status:
    | "pending"
    | "confirmed"
    | "checked_in"
    | "in_session"
    | "completed"
    | "no_show"
    | "canceled";
  replaced_appointment_id: string | null;
  patient_id: string;
  patients: { id: string; name: string } | { id: string; name: string }[] | null;
  services:
    | { name: string; price_egp: number | null }
    | { name: string; price_egp: number | null }[]
    | null;
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

function rankServices(rows: RevenueRow[]): FinancialServiceRank[] {
  const map = new Map<string, { revenueEgp: number; count: number }>();
  for (const row of rows) {
    const service = unwrapJoin(row.services);
    const name = service?.name ?? "—";
    const price = service?.price_egp ?? 0;
    const current = map.get(name) ?? { revenueEgp: 0, count: 0 };
    current.revenueEgp += price;
    current.count += 1;
    map.set(name, current);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.revenueEgp - a.revenueEgp)
    .slice(0, 5);
}

function rankPatients(rows: RevenueRow[]): FinancialPatientRank[] {
  const map = new Map<string, { name: string; revenueEgp: number }>();
  for (const row of rows) {
    const patient = unwrapJoin(row.patients);
    const id = patient?.id ?? row.patient_id;
    const name = patient?.name ?? "—";
    const service = unwrapJoin(row.services);
    const price = service?.price_egp ?? 0;
    const current = map.get(id) ?? { name, revenueEgp: 0 };
    current.revenueEgp += price;
    map.set(id, current);
  }
  return Array.from(map.entries())
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.revenueEgp - a.revenueEgp)
    .slice(0, 5);
}

export async function fetchFinancialOverview(): Promise<FinancialOverview> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const { startIso: dayStart, endIso: dayEnd } = getCairoDayBounds();
  const weekStart = getCairoPeriodStart(6);
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
    patient_id,
    appointment_date,
    status,
    replaced_appointment_id,
    patients ( id, name ),
    services ( name, price_egp )
  `;

  const [
    { data: dailyRows, error: dailyError },
    { data: weeklyRows, error: weeklyError },
    { data: monthlyRows, error: monthlyError },
    { data: backfillRows, error: backfillError },
    { data: recentRows, error: recentError },
    { data: dailyExpenseRows, error: dailyExpenseError },
    { data: monthlyExpenseRows, error: monthlyExpenseError },
    { data: trendRows, error: trendError },
    { data: debtRows, error: debtError },
    { data: prevMonthRows, error: prevMonthError },
    paymentsTodayResult,
    paymentsWeekResult,
    paymentsMonthResult,
    recentPaymentsResult,
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
      .gte("appointment_date", weekStart),
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
    supabase
      .from("patient_payments")
      .select("amount_paid")
      .eq("tenant_id", tenantId)
      .gte("paid_at", dayStart)
      .lte("paid_at", dayEnd),
    supabase
      .from("patient_payments")
      .select("amount_paid")
      .eq("tenant_id", tenantId)
      .gte("paid_at", weekStart),
    supabase
      .from("patient_payments")
      .select("amount_paid")
      .eq("tenant_id", tenantId)
      .gte("paid_at", monthStart),
    supabase
      .from("patient_payments")
      .select("id, patient_id, amount_paid, paid_at, patients ( name )")
      .eq("tenant_id", tenantId)
      .order("paid_at", { ascending: false })
      .limit(12),
  ]);

  if (dailyError) throw new Error(`Financials failed: ${dailyError.message}`);
  if (weeklyError) throw new Error(`Financials failed: ${weeklyError.message}`);
  if (monthlyError) throw new Error(`Financials failed: ${monthlyError.message}`);
  if (backfillError) throw new Error(`Financials failed: ${backfillError.message}`);
  if (recentError) throw new Error(`Financials failed: ${recentError.message}`);
  if (dailyExpenseError) throw new Error(`Financials failed: ${dailyExpenseError.message}`);
  if (monthlyExpenseError) {
    throw new Error(`Financials failed: ${monthlyExpenseError.message}`);
  }
  if (trendError) throw new Error(`Financials failed: ${trendError.message}`);
  if (debtError) throw new Error(`Financials failed: ${debtError.message}`);
  if (prevMonthError) throw new Error(`Financials failed: ${prevMonthError.message}`);

  const sumPayments = (rows: { amount_paid: number }[] | null | undefined) =>
    (rows ?? []).reduce((sum, row) => sum + (row.amount_paid ?? 0), 0);

  const collectionsTodayEgp = paymentsTodayResult.error
    ? 0
    : sumPayments(paymentsTodayResult.data);
  const collectionsWeekEgp = paymentsWeekResult.error
    ? 0
    : sumPayments(paymentsWeekResult.data);
  const collectionsMonthEgp = paymentsMonthResult.error
    ? 0
    : sumPayments(paymentsMonthResult.data);

  const recentPayments: RecentPaymentItem[] = recentPaymentsResult.error
    ? []
    : (recentPaymentsResult.data ?? []).map((row) => {
        const patient = unwrapJoin(
          row.patients as { name: string } | { name: string }[] | null,
        );
        return {
          id: row.id,
          patientId: row.patient_id,
          patientName: patient?.name ?? "—",
          amountPaid: row.amount_paid,
          paidAt: row.paid_at,
        };
      });

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

  const monthlyRowsTyped = (monthlyRows ?? []) as RevenueRow[];
  const monthlyRevenue = sumRevenue(monthlyRowsTyped);
  const prevMonthlyRevenue = sumRevenue((prevMonthRows ?? []) as RevenueRow[]);
  const monthlyGrowthPct =
    prevMonthlyRevenue > 0
      ? Math.round(((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100)
      : 0;
  const completedVisitsMonth = monthlyRowsTyped.length;
  const averageVisitValueEgp =
    completedVisitsMonth > 0 ? Math.round(monthlyRevenue / completedVisitsMonth) : 0;

  return {
    dailyRevenueEgp: sumRevenue((dailyRows ?? []) as RevenueRow[]),
    weeklyRevenueEgp: sumRevenue((weeklyRows ?? []) as RevenueRow[]),
    monthlyRevenueEgp: monthlyRevenue,
    nawaSavedRevenueEgp: sumRevenue((backfillRows ?? []) as RevenueRow[]),
    dailyExpensesEgp: sumRevenue((dailyExpenseRows ?? []) as RevenueRow[]),
    monthlyExpensesEgp: sumRevenue((monthlyExpenseRows ?? []) as RevenueRow[]),
    outstandingDebtsEgp: (debtRows ?? []).reduce(
      (sum, row) => sum + (row.total_balance_due ?? 0),
      0,
    ),
    monthlyGrowthPct,
    averageVisitValueEgp,
    completedVisitsMonth,
    collectionsTodayEgp,
    collectionsWeekEgp,
    collectionsMonthEgp,
    topServices: rankServices(monthlyRowsTyped),
    topPatientsByRevenue: rankPatients(monthlyRowsTyped),
    recentPayments,
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
