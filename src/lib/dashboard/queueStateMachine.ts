import type { AppointmentStatus } from "@/lib/dashboard/types";

/** Statuses visible in today's vertical queue (excludes no_show & canceled). */
export type QueueVisibleStatus = Exclude<AppointmentStatus, "no_show" | "canceled">;

export function isQueueVisible(status: AppointmentStatus): status is QueueVisibleStatus {
  return status !== "no_show" && status !== "canceled";
}

/** Next status when the primary action button is pressed. */
export const NEXT_QUEUE_STATUS: Partial<
  Record<QueueVisibleStatus, QueueVisibleStatus>
> = {
  pending: "confirmed",
  confirmed: "checked_in",
  checked_in: "in_session",
  in_session: "completed",
};

export type QueueActionKey =
  | "confirm"
  | "checkIn"
  | "startSession"
  | "complete";

export const QUEUE_ACTION_BY_STATUS: Partial<
  Record<QueueVisibleStatus, QueueActionKey>
> = {
  pending: "confirm",
  confirmed: "checkIn",
  checked_in: "startSession",
  in_session: "complete",
};

export const QUEUE_STATUS_COLORS: Record<QueueVisibleStatus, string> = {
  pending: "#6C5CE7",
  confirmed: "#00CEC9",
  checked_in: "#74B9FF",
  in_session: "#A29BFE",
  completed: "#55EFC4",
};

export function getQueueStatusColor(status: AppointmentStatus): string {
  if (isQueueVisible(status)) {
    return QUEUE_STATUS_COLORS[status];
  }
  if (status === "no_show") {
    return "#FF6B6B";
  }
  return "#8888A0";
}

/** Statuses the secretary can pick from the queue dropdown. */
export const QUEUE_SELECTABLE_STATUSES: readonly QueueVisibleStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "in_session",
  "completed",
] as const;

/** Statuses for upcoming agenda — before the visit day. */
export const AGENDA_SELECTABLE_STATUSES: readonly QueueVisibleStatus[] = [
  "pending",
  "confirmed",
] as const;

/** @deprecated Use isQueueVisible — kept for gradual migration */
export function isKanbanColumn(status: AppointmentStatus): status is QueueVisibleStatus {
  return isQueueVisible(status);
}
