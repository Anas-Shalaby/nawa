"use server";

import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export type OperationalInventoryAlert = {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  minThreshold: number;
  outOfStock: boolean;
  urgent: boolean;
};

/**
 * Operational inventory alerts for the notification center.
 */
export async function fetchOperationalNotificationAlerts(): Promise<
  OperationalInventoryAlert[]
> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, name, quantity, min_threshold")
      .eq("tenant_id", tenantId)
      .order("quantity", { ascending: true })
      .limit(40);

    if (error) return [];

    return (data ?? [])
      .filter((row) => row.quantity <= (row.min_threshold ?? 0))
      .slice(0, 8)
      .map((row) => {
        const outOfStock = row.quantity <= 0;
        return {
          id: `inventory-${row.id}`,
          itemId: row.id,
          name: row.name,
          quantity: row.quantity,
          minThreshold: row.min_threshold ?? 0,
          outOfStock,
          urgent:
            outOfStock ||
            row.quantity <= Math.max(1, Math.floor((row.min_threshold ?? 1) / 2)),
        };
      });
  } catch {
    return [];
  }
}
