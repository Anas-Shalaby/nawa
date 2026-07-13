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
  /** Outstanding patient balance in EGP when available from join. */
  balanceDue?: number;
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

export interface PaymentTickerItem {
  id: string;
  patientId: string;
  patientName: string;
  amountPaid: number;
  paidAt: string;
}

export interface UnpaidCollectItem {
  id: string;
  name: string;
  amountDue: number;
}

export interface ClinicRoomStatus {
  id: string;
  label: string;
  busy: boolean;
  detail: string;
}

export { isQueueVisible, isKanbanColumn, type QueueVisibleStatus } from "./queueStateMachine";

export type QueueAppointment = Appointment & { status: import("./queueStateMachine").QueueVisibleStatus };
