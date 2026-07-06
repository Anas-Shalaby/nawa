import type { BookAppointmentInput } from "@/actions/bookAppointment.types";

export interface WorkingHoursDayInput {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string | null;
  endTime: string | null;
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

export const DEFAULT_WORKING_HOURS: WorkingHoursDayInput[] = [
  { dayOfWeek: 6, isOpen: false, startTime: null, endTime: null },
  { dayOfWeek: 0, isOpen: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 1, isOpen: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 2, isOpen: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 3, isOpen: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 4, isOpen: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 5, isOpen: true, startTime: "09:00", endTime: "13:00" },
];

export type BookAppointmentWithDateInput = BookAppointmentInput & {
  date: string;
};
