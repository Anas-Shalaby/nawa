"use server";

import {
  AVAILABILITY_DAY_ORDER,
  DEFAULT_WORKING_HOURS,
  type SaveWorkingHoursResult,
  type WorkingHoursDay,
  type WorkingHoursDayInput,
} from "@/lib/scheduling/types";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

function normalizeTime(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 5);
}

function mapRow(row: {
  id: string;
  day_of_week: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
}): WorkingHoursDay {
  return {
    id: row.id,
    dayOfWeek: row.day_of_week,
    isOpen: row.is_open,
    startTime: normalizeTime(row.start_time),
    endTime: normalizeTime(row.end_time),
  };
}

export async function fetchWorkingHours(): Promise<WorkingHoursDay[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("working_hours")
    .select("id, day_of_week, is_open, start_time, end_time")
    .eq("tenant_id", tenantId)
    .order("day_of_week", { ascending: true });

  if (error) {
    throw new Error(`Failed to load working hours: ${error.message}`);
  }

  const byDay = new Map((data ?? []).map((row) => [row.day_of_week, mapRow(row)]));

  return AVAILABILITY_DAY_ORDER.map((dayOfWeek) => {
    const existing = byDay.get(dayOfWeek);
    if (existing) return existing;

    const fallback = DEFAULT_WORKING_HOURS.find((day) => day.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      isOpen: fallback?.isOpen ?? false,
      startTime: fallback?.startTime ?? null,
      endTime: fallback?.endTime ?? null,
    };
  });
}

export async function saveWorkingHours(
  days: WorkingHoursDayInput[],
): Promise<SaveWorkingHoursResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const payload = days.map((day) => ({
      tenant_id: tenantId,
      day_of_week: day.dayOfWeek,
      is_open: day.isOpen,
      start_time: day.isOpen ? day.startTime : null,
      end_time: day.isOpen ? day.endTime : null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("working_hours").upsert(payload, {
      onConflict: "tenant_id,day_of_week",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save availability.",
    };
  }
}
