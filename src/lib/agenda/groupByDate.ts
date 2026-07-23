import { addCairoDays, formatCairoDateKey } from "@/lib/datetime/followUp";
import {
  formatAppointmentTime,
  getCairoDateKeyFromIso,
} from "@/lib/datetime/cairo";
import type { AgendaAppointment } from "@/lib/queries/agenda";

const CAIRO_TZ = "Africa/Cairo";

export interface AgendaDateGroup {
  dateKey: string;
  appointments: AgendaAppointment[];
}

export function getAgendaDateKey(isoDate: string): string {
  return getCairoDateKeyFromIso(isoDate);
}

export function groupAgendaByDate(appointments: AgendaAppointment[]): AgendaDateGroup[] {
  const map = new Map<string, AgendaAppointment[]>();

  for (const appointment of appointments) {
    const key = getAgendaDateKey(appointment.appointmentDate);
    const bucket = map.get(key) ?? [];
    bucket.push(appointment);
    map.set(key, bucket);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, items]) => ({
      dateKey,
      appointments: items.sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      ),
    }));
}

export function formatAgendaSectionLabel(
  dateKey: string,
  locale: string,
  labels: { tomorrow: string; today: string },
): string {
  const today = formatCairoDateKey();
  const tomorrow = addCairoDays(1);
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: CAIRO_TZ,
  });
  const dateLabel = formatter.format(new Date(`${dateKey}T12:00:00+03:00`));

  if (dateKey === today) return `${labels.today} — ${dateLabel}`;
  if (dateKey === tomorrow) return `${labels.tomorrow} — ${dateLabel}`;
  return dateLabel;
}

export function formatAgendaTime(isoDate: string, locale: string): string {
  return formatAppointmentTime(isoDate, locale);
}
