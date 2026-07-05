const CAIRO_TZ = "Africa/Cairo";

export function getCairoDayBounds(reference = new Date()): {
  startIso: string;
  endIso: string;
} {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);

  return {
    startIso: `${dateKey}T00:00:00+03:00`,
    endIso: `${dateKey}T23:59:59.999+03:00`,
  };
}

/** Builds a Cairo timezone ISO timestamp for today at HH:mm. */
export function buildAppointmentDateIso(slotTime: string, reference = new Date()): string {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: CAIRO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);

  return `${dateKey}T${slotTime}:00+03:00`;
}

export function formatSlotLabel(slotTime: string, locale: string): string {
  const iso = buildAppointmentDateIso(slotTime);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: CAIRO_TZ,
  }).format(new Date(iso));
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
