import type { SubscriptionStatus } from "./types";

interface SubscriptionRow {
  status: SubscriptionStatus | string;
  ends_at: string;
}

export function isSubscriptionRowActive(row: SubscriptionRow | null | undefined): boolean {
  if (!row) {
    return true;
  }

  if (row.status !== "trialing" && row.status !== "active") {
    return false;
  }

  return new Date(row.ends_at).getTime() > Date.now();
}

export function addMonths(base: Date, months: number): Date {
  const result = new Date(base);
  result.setMonth(result.getMonth() + months);
  return result;
}
