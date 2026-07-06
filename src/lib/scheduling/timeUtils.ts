/** Parse "HH:mm" or "HH:mm:ss" to minutes from midnight. */
export function parseTimeToMinutes(value: string): number {
  const [hourPart, minutePart] = value.split(":");
  return Number(hourPart) * 60 + Number(minutePart ?? 0);
}

/** Format minutes from midnight to "HH:mm". */
export function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export interface BookedRange {
  startMinutes: number;
  endMinutes: number;
}

export function rangesOverlap(
  slotStart: number,
  slotEnd: number,
  booked: BookedRange,
): boolean {
  return slotStart < booked.endMinutes && slotEnd > booked.startMinutes;
}

/**
 * Generate sequential slot start times that fit within [start, end)
 * and do not overlap existing bookings.
 */
export function generateAvailableSlotTimes(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  bookedRanges: BookedRange[],
  minStartMinutes?: number,
): string[] {
  const windowStart = parseTimeToMinutes(startTime);
  const windowEnd = parseTimeToMinutes(endTime);
  let cursor = windowStart;

  if (minStartMinutes !== undefined) {
    cursor = Math.max(windowStart, minStartMinutes);
    const offset = (cursor - windowStart) % durationMinutes;
    if (offset !== 0) {
      cursor += durationMinutes - offset;
    }
  }

  const slots: string[] = [];

  for (; cursor + durationMinutes <= windowEnd; cursor += durationMinutes) {
    const slotEnd = cursor + durationMinutes;
    const blocked = bookedRanges.some((range) => rangesOverlap(cursor, slotEnd, range));

    if (!blocked) {
      slots.push(formatMinutesToTime(cursor));
    }
  }

  return slots;
}
