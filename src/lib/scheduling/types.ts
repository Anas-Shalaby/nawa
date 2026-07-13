import type { BookAppointmentInput } from "@/actions/bookAppointment.types";

export interface WorkingHoursShift {
  id: string;
  startTime: string;
  endTime: string;
}

export interface WorkingHoursDayInput {
  dayOfWeek: number;
  isOpen: boolean;
  /** @deprecated Prefer shifts — kept for legacy single-window consumers. */
  startTime: string | null;
  /** @deprecated Prefer shifts — kept for legacy single-window consumers. */
  endTime: string | null;
  shifts: WorkingHoursShift[];
}

export interface WorkingHoursDay extends WorkingHoursDayInput {
  id?: string;
}

export interface SaveWorkingHoursResult {
  success: boolean;
  error?: string;
}

/** Saturday → Friday display order for the settings UI. */
export const AVAILABILITY_DAY_ORDER = [6, 0, 1, 2, 3, 4, 5] as const;

export function createShift(
  startTime = "09:00",
  endTime = "17:00",
): WorkingHoursShift {
  return {
    id: `shift-${Math.random().toString(36).slice(2, 10)}`,
    startTime,
    endTime,
  };
}

export function normalizeShifts(
  shifts: WorkingHoursShift[] | null | undefined,
  startTime: string | null,
  endTime: string | null,
  isOpen: boolean,
): WorkingHoursShift[] {
  if (Array.isArray(shifts) && shifts.length > 0) {
    return shifts.map((shift) => ({
      id: shift.id || createShift().id,
      startTime: (shift.startTime ?? "09:00").slice(0, 5),
      endTime: (shift.endTime ?? "17:00").slice(0, 5),
    }));
  }

  if (isOpen && startTime && endTime) {
    return [createShift(startTime.slice(0, 5), endTime.slice(0, 5))];
  }

  return [];
}

export function derivePrimaryWindow(shifts: WorkingHoursShift[]): {
  startTime: string | null;
  endTime: string | null;
} {
  if (shifts.length === 0) {
    return { startTime: null, endTime: null };
  }

  const sorted = [...shifts].sort((a, b) => a.startTime.localeCompare(b.startTime));
  return {
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime,
  };
}

export const DEFAULT_WORKING_HOURS: WorkingHoursDayInput[] = [
  { dayOfWeek: 6, isOpen: false, startTime: null, endTime: null, shifts: [] },
  {
    dayOfWeek: 0,
    isOpen: true,
    startTime: "09:00",
    endTime: "17:00",
    shifts: [createShift("09:00", "17:00")],
  },
  {
    dayOfWeek: 1,
    isOpen: true,
    startTime: "09:00",
    endTime: "17:00",
    shifts: [createShift("09:00", "17:00")],
  },
  {
    dayOfWeek: 2,
    isOpen: true,
    startTime: "09:00",
    endTime: "17:00",
    shifts: [createShift("09:00", "17:00")],
  },
  {
    dayOfWeek: 3,
    isOpen: true,
    startTime: "09:00",
    endTime: "17:00",
    shifts: [createShift("09:00", "17:00")],
  },
  {
    dayOfWeek: 4,
    isOpen: true,
    startTime: "09:00",
    endTime: "17:00",
    shifts: [createShift("09:00", "17:00")],
  },
  {
    dayOfWeek: 5,
    isOpen: true,
    startTime: "09:00",
    endTime: "13:00",
    shifts: [createShift("09:00", "13:00")],
  },
];

/** 30-minute options for stylized selectors (06:00–23:30). */
export function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let minutes = 6 * 60; minutes <= 23 * 60 + 30; minutes += 30) {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    options.push(`${h}:${m}`);
  }
  return options;
}

export function formatTimeLabel(time: string, locale: "ar" | "en" = "ar"): string {
  const [hRaw, mRaw] = time.split(":");
  let hour = Number(hRaw);
  const minute = mRaw ?? "00";
  const period =
    locale === "ar" ? (hour < 12 ? "ص" : "م") : hour < 12 ? "AM" : "PM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${period}`;
}

export type BookAppointmentWithDateInput = BookAppointmentInput & {
  date: string;
};
