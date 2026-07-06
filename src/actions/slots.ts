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
  type BookedRange,
} from "@/lib/scheduling/timeUtils";
import { createServiceRoleClient } from "@/utils/supabase/auth";

/**
 * Time Engine — returns available slot start times (HH:mm) for a tenant/date/duration.
 * All logic uses Africa/Cairo local calendar dates.
 */
export async function getAvailableSlots(
  tenantId: string,
  date: string,
  serviceDurationMinutes: number,
): Promise<string[]> {
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
    .select("is_open, start_time, end_time")
    .eq("tenant_id", tenantId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle();

  if (hoursError) {
    throw new Error(`Failed to load working hours: ${hoursError.message}`);
  }

  if (!hours?.is_open || !hours.start_time || !hours.end_time) {
    return [];
  }

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

  return generateAvailableSlotTimes(
    hours.start_time,
    hours.end_time,
    serviceDurationMinutes,
    bookedRanges,
    minStartMinutes,
  );
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
