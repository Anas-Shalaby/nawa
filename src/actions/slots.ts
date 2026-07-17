"use server";

import {
  buildCairoAppointmentIso,
  getCairoDayQueryBounds,
  getCairoDayOfWeek,
  getCairoMinutesNow,
  getCairoTodayKey,
  normalizeStoredTimestamp,
} from "@/lib/datetime/cairo";
import {
  generateAvailableSlotTimes,
  parseTimeToMinutes,
  rangesOverlap,
  type BookedRange,
} from "@/lib/scheduling/timeUtils";
import { createServiceRoleClient } from "@/utils/supabase/auth";

export interface SlotAvailability {
  time: string;
  available: boolean;
}

/**
 * Time Engine — returns available slot start times (HH:mm) for a tenant/date/duration.
 * All logic uses Africa/Cairo local calendar dates.
 */
export async function getAvailableSlots(
  tenantId: string,
  date: string,
  serviceDurationMinutes: number,
): Promise<string[]> {
  const options = await getSlotAvailability(
    tenantId,
    date,
    serviceDurationMinutes,
  );
  return options.filter((option) => option.available).map((option) => option.time);
}

/**
 * Returns the complete working-day grid, marking occupied/blocked starts as
 * unavailable so staff can see why a time cannot be selected.
 */
export async function getSlotAvailability(
  tenantId: string,
  date: string,
  serviceDurationMinutes: number,
): Promise<SlotAvailability[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }

  if (serviceDurationMinutes <= 0) {
    throw new Error("Service duration must be greater than zero.");
  }

  const supabase = createServiceRoleClient();
  const dayOfWeek = getCairoDayOfWeek(date);

  const { data: hours, error: hoursError } = await supabase
    .from("working_hours")
    .select("is_open, start_time, end_time, shifts")
    .eq("tenant_id", tenantId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (hoursError) {
    // Fallback before shifts migration
    const legacy = await supabase
      .from("working_hours")
      .select("is_open, start_time, end_time")
      .eq("tenant_id", tenantId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    if (legacy.error) {
      throw new Error(`Failed to load working hours: ${legacy.error.message}`);
    }

    if (!legacy.data?.is_open || !legacy.data.start_time || !legacy.data.end_time) {
      return [];
    }

    return generateSlotOptionsForWindows(
      [{ start: legacy.data.start_time, end: legacy.data.end_time }],
      date,
      serviceDurationMinutes,
      tenantId,
    );
  }

  if (!hours?.is_open) {
    return [];
  }

  const windows: { start: string; end: string }[] = [];
  if (Array.isArray(hours.shifts) && hours.shifts.length > 0) {
    for (const entry of hours.shifts) {
      if (!entry || typeof entry !== "object") continue;
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
      if (start && end) windows.push({ start: start.slice(0, 5), end: end.slice(0, 5) });
    }
  }

  if (windows.length === 0 && hours.start_time && hours.end_time) {
    windows.push({
      start: String(hours.start_time).slice(0, 5),
      end: String(hours.end_time).slice(0, 5),
    });
  }

  if (windows.length === 0) {
    return [];
  }

  return generateSlotOptionsForWindows(
    windows,
    date,
    serviceDurationMinutes,
    tenantId,
  );
}

async function generateSlotOptionsForWindows(
  windows: { start: string; end: string }[],
  date: string,
  serviceDurationMinutes: number,
  tenantId: string,
): Promise<SlotAvailability[]> {
  const supabase = createServiceRoleClient();
  const { startIso, endExclusiveIso } = getCairoDayQueryBounds(date);

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("appointment_date, status, services ( duration_minutes )")
    .eq("tenant_id", tenantId)
    .gte("appointment_date", startIso)
    .lt("appointment_date", endExclusiveIso)
    .not("status", "eq", "canceled");

  if (appointmentsError) {
    throw new Error(`Failed to load appointments: ${appointmentsError.message}`);
  }

  const { data: blockedSlots, error: blockedError } = await supabase
    .from("blocked_slots")
    .select("start_time, end_time")
    .eq("tenant_id", tenantId)
    .eq("block_date", date);

  if (blockedError) {
    throw new Error(`Failed to load blocked slots: ${blockedError.message}`);
  }

  const bookedRanges: BookedRange[] = (appointments ?? []).map((row) => {
    const timeLabel = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(normalizeStoredTimestamp(row.appointment_date)));

    const service = Array.isArray(row.services) ? row.services[0] : row.services;
    const duration = service?.duration_minutes ?? 30;
    const startMinutes = parseTimeToMinutes(timeLabel);

    return {
      startMinutes,
      endMinutes: startMinutes + duration,
    };
  });

  for (const block of blockedSlots ?? []) {
    bookedRanges.push({
      startMinutes: parseTimeToMinutes(block.start_time),
      endMinutes: parseTimeToMinutes(block.end_time),
    });
  }

  const minStartMinutes =
    date === getCairoTodayKey() ? getCairoMinutesNow() : undefined;

  const allSlots = new Set<string>();
  for (const window of windows) {
    for (const slot of generateAvailableSlotTimes(
      window.start,
      window.end,
      serviceDurationMinutes,
      [],
      minStartMinutes,
    )) {
      allSlots.add(slot);
    }
  }

  return Array.from(allSlots)
    .sort()
    .map((time) => {
      const startMinutes = parseTimeToMinutes(time);
      return {
        time,
        available: !bookedRanges.some((range) =>
          rangesOverlap(
            startMinutes,
            startMinutes + serviceDurationMinutes,
            range,
          ),
        ),
      };
    });
}

/** Check whether a slot is still free (used before insert). */
export async function isSlotAvailable(
  tenantId: string,
  date: string,
  slotTime: string,
  serviceDurationMinutes: number,
): Promise<boolean> {
  const slots = await getAvailableSlots(tenantId, date, serviceDurationMinutes);
  return slots.includes(slotTime);
}

export async function buildSlotAppointmentIso(date: string, slotTime: string): Promise<string> {
  return buildCairoAppointmentIso(date, slotTime);
}
