"use server";

import { parseTimeToMinutes } from "@/lib/scheduling/timeUtils";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface CreateTimeBlockResult {
  success: boolean;
  blockId?: string;
  error?: string
    | "INVALID_DATE"
    | "INVALID_TIME"
    | "TENANT_MISMATCH"
    | "UNKNOWN";
  message?: string;
}

function normalizeTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

export async function createTimeBlock(
  tenantId: string,
  date: string,
  startTime: string,
  endTime: string,
  reason?: string | null,
): Promise<CreateTimeBlockResult> {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        success: false,
        error: "INVALID_DATE",
        message: "Invalid date format.",
      };
    }

    const start = normalizeTime(startTime);
    const end = normalizeTime(endTime);

    if (parseTimeToMinutes(start) >= parseTimeToMinutes(end)) {
      return {
        success: false,
        error: "INVALID_TIME",
        message: "End time must be after start time.",
      };
    }

    const supabase = await createAuthenticatedClient();
    const resolvedTenantId = await resolveTenantId(supabase);

    if (resolvedTenantId !== tenantId) {
      return {
        success: false,
        error: "TENANT_MISMATCH",
        message: "Unauthorized clinic context.",
      };
    }

    const trimmedReason = reason?.trim() || null;

    const { data, error } = await supabase
      .from("blocked_slots")
      .insert({
        tenant_id: resolvedTenantId,
        block_date: date,
        start_time: start,
        end_time: end,
        reason: trimmedReason,
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        error: "UNKNOWN",
        message: error.message,
      };
    }

    return { success: true, blockId: data.id };
  } catch (error) {
    return {
      success: false,
      error: "UNKNOWN",
      message: error instanceof Error ? error.message : "Could not block time.",
    };
  }
}
