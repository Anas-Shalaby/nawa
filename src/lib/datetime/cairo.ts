const CAIRO_TZ = "Africa/Cairo";

type CairoParts = {
  dateKey: string;
  hour: number;
  minute: number;
};

function getCairoParts(date: Date): CairoParts {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";

  const day = pick("day");
  const month = pick("month");
  const year = pick("year");

  return {
    dateKey: `${year}-${month}-${day}`,
    hour: Number(pick("hour")),
    minute: Number(pick("minute")),
  };
}

const WEEKDAY_TO_DOW: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Current date in Cairo as YYYY-MM-DD. */
export function getCairoTodayKey(reference = new Date()): string {
  return getCairoParts(reference).dateKey;
}

/** day_of_week for Postgres/Cairo: 0 = Sunday … 6 = Saturday. */
export function getCairoDayOfWeek(dateKey: string): number {
  const iso = buildCairoAppointmentIso(dateKey, "12:00");
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TZ,
    weekday: "short",
  }).format(new Date(iso));

  return WEEKDAY_TO_DOW[weekday] ?? 0;
}

/** Inclusive list of next N Cairo calendar days starting from reference day. */
export function getUpcomingCairoDateKeys(count: number, reference = new Date()): string[] {
  const keys: string[] = [];
  const startKey = getCairoTodayKey(reference);
  const [year, month, day] = startKey.split("-").map(Number);
  const anchor = Date.UTC(year, month - 1, day, 12, 0, 0);

  for (let offset = 0; offset < count; offset += 1) {
    const probe = new Date(anchor + offset * 86_400_000);
    keys.push(getCairoParts(probe).dateKey);
  }

  return keys;
}

/** Cairo calendar date (YYYY-MM-DD) for a stored timestamptz string. */
export function getCairoDateKeyFromIso(iso: string): string {
  const normalized = normalizeStoredTimestamp(iso);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(normalized));
}

/** Next Cairo calendar day after the given date key. */
export function getNextCairoDateKey(dateKey: string): string {
  const keys = getUpcomingCairoDateKeys(2, new Date(buildCairoAppointmentIso(dateKey, "12:00")));
  return keys[1] ?? dateKey;
}

/**
 * Ensures Postgres/Supabase timestamps always parse as UTC instants.
 * Without a timezone suffix, JS treats datetime strings as local time (browser-dependent).
 */
export function normalizeStoredTimestamp(value: string): string {
  let normalized = value.trim().replace(" ", "T");

  if (!/[zZ]|[+-]\d{2}(?::?\d{2})?$/.test(normalized)) {
    normalized = `${normalized}Z`;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid appointment timestamp: ${value}`);
  }

  return date.toISOString();
}

/** Half-open query window [start, end) for one Cairo calendar day — avoids 23:59 edge bugs. */
export function getCairoDayQueryBounds(dateKey?: string): {
  dateKey: string;
  startIso: string;
  endExclusiveIso: string;
} {
  const key = dateKey ?? getCairoTodayKey();
  const nextKey = getNextCairoDateKey(key);

  return {
    dateKey: key,
    startIso: buildCairoAppointmentIso(key, "00:00"),
    endExclusiveIso: buildCairoAppointmentIso(nextKey, "00:00"),
  };
}

export function getCairoDayBoundsForDate(dateKey: string): {
  startIso: string;
  endIso: string;
} {
  const { startIso, endExclusiveIso } = getCairoDayQueryBounds(dateKey);
  return {
    startIso,
    endIso: new Date(new Date(endExclusiveIso).getTime() - 60_000).toISOString(),
  };
}

/** Resolve a Cairo-local date + HH:mm to a UTC ISO string (DST-safe). */
export function buildCairoAppointmentIso(dateKey: string, slotTime: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hourPart, minutePart] = slotTime.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart ?? 0);

  let guess = Date.UTC(year, month - 1, day, hour - 2, minute);
  const targetMinutes = hour * 60 + minute;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const parts = getCairoParts(new Date(guess));

    if (parts.dateKey === dateKey) {
      const actualMinutes = parts.hour * 60 + parts.minute;
      if (actualMinutes === targetMinutes) {
        return new Date(guess).toISOString();
      }

      guess += (targetMinutes - actualMinutes) * 60_000;
      continue;
    }

    const [gy, gm, gd] = parts.dateKey.split("-").map(Number);
    guess += Date.UTC(year, month - 1, day) - Date.UTC(gy, gm - 1, gd);
  }

  return new Date(guess).toISOString();
}

export function getCairoMinutesNow(reference = new Date()): number {
  const parts = getCairoParts(reference);
  return parts.hour * 60 + parts.minute;
}

export function formatCairoDateShort(dateKey: string, locale: string): string {
  const iso = buildCairoAppointmentIso(dateKey, "12:00");
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: CAIRO_TZ,
  }).format(new Date(iso));
}

export function formatCairoWeekday(dateKey: string, locale: string): string {
  const iso = buildCairoAppointmentIso(dateKey, "12:00");
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    timeZone: CAIRO_TZ,
  }).format(new Date(iso));
}

export function getCairoDayBounds(reference = new Date()): {
  startIso: string;
  endIso: string;
} {
  return getCairoDayBoundsForDate(getCairoTodayKey(reference));
}

/** True when an appointment ISO timestamp falls on the given Cairo calendar day. */
export function isAppointmentOnCairoDate(
  appointmentIso: string,
  dateKey: string = getCairoTodayKey(),
): boolean {
  return getCairoDateKeyFromIso(appointmentIso) === dateKey;
}

/** Noon Cairo on today's date — safe anchor for displaying the current day in headers. */
export function getCairoTodayDisplayIso(reference = new Date()): string {
  return buildCairoAppointmentIso(getCairoTodayKey(reference), "12:00");
}

/** Builds a Cairo timezone ISO timestamp for today at HH:mm. */
export function buildAppointmentDateIso(slotTime: string, reference = new Date()): string {
  return buildCairoAppointmentIso(getCairoTodayKey(reference), slotTime);
}

export function formatSlotLabel(slotTime: string, locale: string, dateKey?: string): string {
  const iso = dateKey
    ? buildCairoAppointmentIso(dateKey, slotTime)
    : buildAppointmentDateIso(slotTime);
  return formatAppointmentTime(iso, locale);
}

export function formatAppointmentTime(iso: string, locale: string): string {
  const normalized = normalizeStoredTimestamp(iso);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: CAIRO_TZ,
  }).format(new Date(normalized));
}

export function formatAppointmentDateLong(iso: string, locale: string): string {
  const normalized = normalizeStoredTimestamp(iso);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: CAIRO_TZ,
  }).format(new Date(normalized));
}

export function toStoredPhoneNumber(normalizedDigits: string): string {
  return `0${normalizedDigits}`;
}

export function generateWorkingDaySlots(): string[] {
  const slots: string[] = [];

  for (let hour = 9; hour <= 16; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 16 && minute === 30) continue;
      slots.push(
        `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
      );
    }
  }

  return slots;
}

/** Rounds current Cairo time up to the next 30-minute walk-in slot. */
export function getWalkInSlotTime(reference = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAIRO_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(reference);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 9);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  let nextHour = hour;
  let nextMinute = minute <= 0 ? 0 : minute <= 30 ? 30 : 0;

  if (minute > 30) {
    nextHour += 1;
    nextMinute = 0;
  } else if (minute > 0 && minute <= 30) {
    nextMinute = 30;
  }

  if (nextHour > 16 || (nextHour === 16 && nextMinute > 0)) {
    return "16:00";
  }

  return `${nextHour.toString().padStart(2, "0")}:${nextMinute.toString().padStart(2, "0")}`;
}
