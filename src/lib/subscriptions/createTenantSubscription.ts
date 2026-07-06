import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionPlanId } from "./types";
import { addMonths } from "./utils";

export async function createTenantSubscription(
  admin: SupabaseClient,
  tenantId: string,
  planId: SubscriptionPlanId,
): Promise<void> {
  const { data: plan, error: planError } = await admin
    .from("subscription_plans")
    .select("id, duration_months")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    throw new Error("Invalid subscription plan.");
  }

  const startsAt = new Date();
  const endsAt = addMonths(startsAt, plan.duration_months);
  const status = planId === "free_6mo" ? "trialing" : "active";

  const { error } = await admin.from("tenant_subscriptions").insert({
    tenant_id: tenantId,
    plan_id: planId,
    status,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });

  if (error) {
    throw new Error(`Could not create subscription: ${error.message}`);
  }
}
