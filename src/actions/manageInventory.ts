"use server";

import { requirePermission } from "@/lib/auth/staffPermissions";
import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";
import type { InventoryItem } from "@/lib/inventory/types";

export type InventoryActionResult = {
  success: boolean;
  error?: string;
  item?: InventoryItem;
};

export type InventoryItemInput = {
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unitCostEgp: number;
};

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

function validateInput(input: InventoryItemInput): InventoryActionResult | { ok: true; value: InventoryItemInput } {
  const name = input.name.trim();
  const category = input.category.trim() || "عام";
  const quantity = Math.max(0, Math.floor(Number(input.quantity) || 0));
  const minThreshold = Math.max(0, Math.floor(Number(input.minThreshold) || 0));
  const unitCostEgp = Math.max(0, Math.floor(Number(input.unitCostEgp) || 0));

  if (name.length < 2) {
    return { success: false, error: "Item name is required." };
  }

  return {
    ok: true,
    value: { name, category, quantity, minThreshold, unitCostEgp },
  };
}

export async function upsertInventoryItem(
  input: InventoryItemInput,
  itemId?: string,
): Promise<InventoryActionResult> {
  try {
    const denied = await requirePermission("inventory.manage");
    if (denied) return { success: false, error: denied };

    const validated = validateInput(input);
    if (!("ok" in validated)) return validated;

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const payload = {
      name: validated.value.name,
      category: validated.value.category,
      quantity: validated.value.quantity,
      min_threshold: validated.value.minThreshold,
      unit_cost_egp: validated.value.unitCostEgp,
      updated_at: new Date().toISOString(),
    };

    const query = itemId
      ? supabase
          .from("inventory_items")
          .update(payload)
          .eq("id", itemId)
          .eq("tenant_id", tenantId)
          .select(
            "id, name, category, quantity, min_threshold, unit_cost_egp, created_at, updated_at",
          )
          .single()
      : supabase
          .from("inventory_items")
          .insert({ ...payload, tenant_id: tenantId })
          .select(
            "id, name, category, quantity, min_threshold, unit_cost_egp, created_at, updated_at",
          )
          .single();

    const { data, error } = await query;

    if (error || !data) {
      return { success: false, error: error?.message ?? "Failed to save item." };
    }

    revalidatePath("/dashboard/inventory");
    return { success: true, item: mapItem(data) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save item.",
    };
  }
}

export async function restockInventoryItem(
  itemId: string,
  addQuantity: number,
): Promise<InventoryActionResult> {
  try {
    const denied = await requirePermission("inventory.manage");
    if (denied) return { success: false, error: denied };

    const amount = Math.floor(Number(addQuantity) || 0);
    if (amount <= 0) {
      return { success: false, error: "Restock quantity must be greater than zero." };
    }

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: existing, error: lookupError } = await supabase
      .from("inventory_items")
      .select(
        "id, name, category, quantity, min_threshold, unit_cost_egp, created_at, updated_at",
      )
      .eq("id", itemId)
      .eq("tenant_id", tenantId)
      .single();

    if (lookupError || !existing) {
      return { success: false, error: lookupError?.message ?? "Item not found." };
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        quantity: existing.quantity + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("tenant_id", tenantId)
      .select(
        "id, name, category, quantity, min_threshold, unit_cost_egp, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? "Failed to restock." };
    }

    revalidatePath("/dashboard/inventory");
    return { success: true, item: mapItem(data) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to restock.",
    };
  }
}

export async function deleteInventoryItem(
  itemId: string,
): Promise<InventoryActionResult> {
  try {
    const denied = await requirePermission("inventory.manage");
    if (denied) return { success: false, error: denied };

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", itemId)
      .eq("tenant_id", tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete item.",
    };
  }
}
