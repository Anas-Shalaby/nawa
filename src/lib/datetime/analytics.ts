const CAIRO_TZ = "Africa/Cairo";

export function getCairoPeriodStart(days: number, reference = new Date()): string {
  const shifted = new Date(reference.getTime() - days * 86_400_000);
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted);

  return `${dateKey}T00:00:00+03:00`;
}

export function getCairoMonthStart(reference = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(reference);

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";

  return `${year}-${month}-01T00:00:00+03:00`;
}

export function getCairoHour(isoDate: string): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAIRO_TZ,
    hour: "2-digit",
    hour12: false,
  }).format(new Date(isoDate));

  return Number(hour);
}

export { getCairoDayBounds, buildAppointmentDateIso } from "./cairo";
