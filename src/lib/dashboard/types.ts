export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_session"
  | "completed"
  | "no_show"
  | "canceled";

export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  phoneNumber: string;
  noShowCount: number;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  priceEgp: number | null;
  appointmentDate: string;
  status: AppointmentStatus;
}

/** @deprecated Use QueueVisibleStatus from queueStateMachine */
export type KanbanColumnId = Exclude<AppointmentStatus, "no_show" | "canceled">;

export interface DailyPulseStats {
  total: number;
  pending: number;
  completed: number;
  noShows: number;
}

export interface DashboardService {
  id: string;
  name: string;
  durationMinutes: number;
  priceEgp: number | null;
  preVisitInstructions: string | null;
}

export { isQueueVisible, isKanbanColumn, type QueueVisibleStatus } from "./queueStateMachine";

export type QueueAppointment = Appointment & { status: import("./queueStateMachine").QueueVisibleStatus };
