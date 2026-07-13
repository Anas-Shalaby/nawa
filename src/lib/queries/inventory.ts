import {
  type InventoryItem,
  type InventoryOverview,
} from "@/lib/inventory/types";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

function mapItem(row: {
  id: string;
  name: string;
  category: string;
  quantity: number;
  min_threshold: number;
  unit_cost_egp: number;
  created_at: string;
  updated_at: string;
}): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    minThreshold: row.min_threshold,
    unitCostEgp: row.unit_cost_egp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchInventoryOverview(): Promise<InventoryOverview> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("inventory_items")
    .select(
      "id, name, category, quantity, min_threshold, unit_cost_egp, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (error) {
    // Migration not applied yet — return empty overview instead of crashing the page.
    if (error.message.toLowerCase().includes("inventory_items")) {
      return { totalItems: 0, lowStockCount: 0, totalValueEgp: 0, items: [] };
    }
    throw new Error(`Failed to load inventory: ${error.message}`);
  }

  const items = (data ?? []).map(mapItem);
  const lowStockCount = items.filter(
    (item) => item.quantity <= item.minThreshold,
  ).length;
  const totalValueEgp = items.reduce(
    (sum, item) => sum + item.quantity * item.unitCostEgp,
    0,
  );

  return {
    totalItems: items.length,
    lowStockCount,
    totalValueEgp,
    items,
  };
}
