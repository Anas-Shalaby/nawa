import { buildAppointmentDateIso } from "@/lib/datetime/cairo";

const CAIRO_TZ = "Africa/Cairo";
const DEFAULT_FOLLOW_UP_SLOT = "10:00";

export function formatCairoDateKey(reference = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
}

function parseCairoDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addCairoDays(days: number, reference = new Date()): string {
  const date = parseCairoDateKey(formatCairoDateKey(reference));
  date.setUTCDate(date.getUTCDate() + days);
  return formatCairoDateKey(date);
}

export function addCairoMonths(months: number, reference = new Date()): string {
  const date = parseCairoDateKey(formatCairoDateKey(reference));
  date.setUTCMonth(date.getUTCMonth() + months);
  return formatCairoDateKey(date);
}

export function extractSlotTimeFromIso(iso: string): string {
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? DEFAULT_FOLLOW_UP_SLOT;
}

export function buildFollowUpAppointmentIso(
  dateKey: string,
  slotTime = DEFAULT_FOLLOW_UP_SLOT,
): string {
  return buildAppointmentDateIso(slotTime, parseCairoDateKey(dateKey));
}
