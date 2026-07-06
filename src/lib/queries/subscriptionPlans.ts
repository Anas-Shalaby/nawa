import { createServiceRoleClient } from "@/utils/supabase/auth";
import { mapSubscriptionPlanRow } from "@/lib/subscriptions/mapPlan";
import type { SubscriptionPlan } from "@/lib/subscriptions/types";

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("subscription_plans")
    .select(
      "id, name_ar, name_en, description_ar, description_en, duration_months, price_egp, setup_fee_egp, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load subscription plans: ${error.message}`);
  }

  return (data ?? []).map(mapSubscriptionPlanRow);
}
