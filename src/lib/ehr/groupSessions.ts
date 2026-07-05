import type { PatientMediaWithUrl } from "@/lib/media/types";

const CAIRO_TZ = "Africa/Cairo";

export type ClinicalSession = {
  sessionKey: string;
  sessionLabel: string;
  items: PatientMediaWithUrl[];
};

function getSessionKey(isoDate: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoDate));
}

function formatSessionLabel(sessionKey: string, locale: string): string {
  const date = new Date(`${sessionKey}T12:00:00+03:00`);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: CAIRO_TZ,
  }).format(date);
}

export function groupMediaIntoSessions(
  items: PatientMediaWithUrl[],
  locale: string,
): ClinicalSession[] {
  const map = new Map<string, PatientMediaWithUrl[]>();

  for (const item of items) {
    const key = getSessionKey(item.createdAt);
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([sessionKey, sessionItems]) => ({
      sessionKey,
      sessionLabel: formatSessionLabel(sessionKey, locale),
      items: sessionItems.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }));
}

export function getSessionClinicalNotes(items: PatientMediaWithUrl[]): string[] {
  const notes = items
    .map((item) => item.notes?.trim())
    .filter((note): note is string => Boolean(note));

  return Array.from(new Set(notes));
}
