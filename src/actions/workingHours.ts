"use server";

import {
  AVAILABILITY_DAY_ORDER,
  DEFAULT_WORKING_HOURS,
  createShift,
  derivePrimaryWindow,
  normalizeShifts,
  type SaveWorkingHoursResult,
  type WorkingHoursDay,
  type WorkingHoursDayInput,
  type WorkingHoursShift,
} from "@/lib/scheduling/types";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 5);
}

function parseShiftsJson(value: unknown): WorkingHoursShift[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const start =
        typeof record.start === "string"
          ? record.start
          : typeof record.startTime === "string"
            ? record.startTime
            : null;
      const end =
        typeof record.end === "string"
          ? record.end
          : typeof record.endTime === "string"
            ? record.endTime
            : null;
      if (!start || !end) return null;
      return createShift(start.slice(0, 5), end.slice(0, 5));
    })
    .filter((shift): shift is WorkingHoursShift => Boolean(shift));
}

function mapRow(row: {
  id: string;
  day_of_week: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
  shifts?: unknown;
}): WorkingHoursDay {
  const shifts = normalizeShifts(
    parseShiftsJson(row.shifts),
    normalizeTime(row.start_time),
    normalizeTime(row.end_time),
    row.is_open,
  );
  const primary = derivePrimaryWindow(shifts);

  return {
    id: row.id,
    dayOfWeek: row.day_of_week,
    isOpen: row.is_open,
    startTime: primary.startTime,
    endTime: primary.endTime,
    shifts,
  };
}

function validateDay(day: WorkingHoursDayInput): string | null {
  if (!day.isOpen) return null;
  if (!day.shifts.length) {
    return "Open days need at least one shift.";
  }

  for (const shift of day.shifts) {
    if (!shift.startTime || !shift.endTime || shift.startTime >= shift.endTime) {
      return "Each shift must have a valid From/To time.";
    }
  }

  return null;
}

export async function fetchWorkingHours(): Promise<WorkingHoursDay[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const withShifts = await supabase
    .from("working_hours")
    .select("id, day_of_week, is_open, start_time, end_time, shifts")
    .eq("tenant_id", tenantId)
    .order("day_of_week", { ascending: true });

  let rows = withShifts.data;

  if (withShifts.error) {
    const legacy = await supabase
      .from("working_hours")
      .select("id, day_of_week, is_open, start_time, end_time")
      .eq("tenant_id", tenantId)
      .order("day_of_week", { ascending: true });

    if (legacy.error) {
      throw new Error(`Failed to load working hours: ${legacy.error.message}`);
    }

    rows = (legacy.data ?? []).map((row) => ({ ...row, shifts: [] }));
  }

  const byDay = new Map((rows ?? []).map((row) => [row.day_of_week, mapRow(row)]));

  return AVAILABILITY_DAY_ORDER.map((dayOfWeek) => {
    const existing = byDay.get(dayOfWeek);
    if (existing) return existing;

    const fallback = DEFAULT_WORKING_HOURS.find((day) => day.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      isOpen: fallback?.isOpen ?? false,
      startTime: fallback?.startTime ?? null,
      endTime: fallback?.endTime ?? null,
      shifts: fallback?.shifts ? fallback.shifts.map((s) => ({ ...s, id: createShift().id })) : [],
    };
  });
}

export async function saveWorkingHours(
  days: WorkingHoursDayInput[],
): Promise<SaveWorkingHoursResult> {
  try {
    for (const day of days) {
      const error = validateDay(day);
      if (error) return { success: false, error };
    }

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const payload = days.map((day) => {
      const shifts = day.isOpen
        ? normalizeShifts(day.shifts, day.startTime, day.endTime, true)
        : [];
      const primary = derivePrimaryWindow(shifts);

      return {
        tenant_id: tenantId,
        day_of_week: day.dayOfWeek,
        is_open: day.isOpen,
        start_time: day.isOpen ? primary.startTime : null,
        end_time: day.isOpen ? primary.endTime : null,
        shifts: shifts.map((shift) => ({
          start: shift.startTime,
          end: shift.endTime,
        })),
        updated_at: new Date().toISOString(),
      };
    });

    const withShifts = await supabase.from("working_hours").upsert(payload, {
      onConflict: "tenant_id,day_of_week",
    });

    if (withShifts.error) {
      // Fallback if migration 020 not applied yet
      const legacyPayload = payload.map(({ shifts: _shifts, ...rest }) => rest);
      const legacy = await supabase.from("working_hours").upsert(legacyPayload, {
        onConflict: "tenant_id,day_of_week",
      });

      if (legacy.error) {
        return { success: false, error: legacy.error.message };
      }

      if (payload.some((day) => day.is_open && (day.shifts?.length ?? 0) > 1)) {
        return {
          success: false,
          error:
            "Split shifts require migration 020_working_hours_shifts.sql. Single-window schedule was saved.",
        };
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save availability.",
    };
  }
}
