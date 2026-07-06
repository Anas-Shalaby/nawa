export type SubscriptionStatus = "trialing" | "active" | "expired" | "cancelled";

export const SUBSCRIPTION_PLAN_IDS = ["free_6mo", "paid_6mo"] as const;

export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number];

export function isSubscriptionPlanId(value: string): value is SubscriptionPlanId {
  return (SUBSCRIPTION_PLAN_IDS as readonly string[]).includes(value);
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  durationMonths: number;
  priceEgp: number;
  setupFeeEgp: number;
  sortOrder: number;
}

export interface TenantSubscriptionSnapshot {
  status: SubscriptionStatus;
  endsAt: string;
  planId: SubscriptionPlanId;
}
