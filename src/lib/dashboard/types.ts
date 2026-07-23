export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_session"
  | "completed"
  | "no_show"
  | "canceled";

export type AppointmentPriority = "normal" | "urgent" | "emergency";

export type ArrivalSource = "online" | "walk_in" | "phone" | "internal";

export type PatientGender = "male" | "female" | "other" | "unspecified";

export type PaymentStatus = "paid" | "partial" | "unpaid" | "waived" | "unknown";

export type StaffAvailability = "available" | "busy" | "break" | "offline";

export type FloorZone = "outside" | "waiting" | "doctor";

export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  patientName: string;
  phoneNumber: string;
  noShowCount: number;
  /** Outstanding patient balance in EGP when available from join. */
  balanceDue?: number;
  dateOfBirth?: string | null;
  gender?: PatientGender;
  insuranceProvider?: string | null;
  serviceId: string;
  serviceName: string;
  serviceColorCode?: string | null;
  durationMinutes: number;
  priceEgp: number | null;
  appointmentDate: string;
  status: AppointmentStatus;
  priority?: AppointmentPriority;
  arrivalSource?: ArrivalSource | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  roomId?: string | null;
  roomLabel?: string | null;
  checkedInAt?: string | null;
  sessionStartedAt?: string | null;
  completedAt?: string | null;
  isFollowUp?: boolean;
  isReExamination?: boolean;
  invoiceStatus?: PaymentStatus;
  invoiceAmountDue?: number;
  invoiceAmountPaid?: number;
  patientNotes?: string | null;
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
  isPackage: boolean;
  sessionsCount: number;
  colorCode: string | null;
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
  currentPatientName?: string | null;
  currentAppointmentId?: string | null;
}

export interface DoctorOperationalStatus {
  id: string;
  displayName: string;
  availability: StaffAvailability;
  roomLabel: string | null;
  currentPatientName: string | null;
  currentAppointmentId: string | null;
  avgConsultMinutes: number;
  remainingQueue: number;
}

export interface AttentionItem {
  id: string;
  type:
    | "long_wait"
    | "missing_payment"
    | "confirmation"
    | "insurance_approval"
    | "lab_result"
    | "refill_request"
    | "late_doctor";
  severity: number;
  title: string;
  detail?: string;
  appointmentId?: string;
  patientId?: string;
  createdAt: string;
}

export interface MissionControlInsight {
  id: string;
  tone: "neutral" | "warning" | "success";
  message: string;
}

export interface MissionControlMetrics {
  totalToday: number;
  waitingNow: number;
  inSession: number;
  completed: number;
  remaining: number;
  averageWaitMinutes: number;
  doctorsAvailable: number;
  doctorsTotal: number;
  todayRevenueEgp?: number;
  capacityPct: number;
  remainingLoadMinutes: number;
}

export interface MissionControlSnapshot {
  clinicName: string;
  doctorName: string;
  tenantId: string;
  date: string;
  appointments: Appointment[];
  metrics: MissionControlMetrics;
  canViewRevenue: boolean;
  canManageQueue: boolean;
  canCreateWalkIn: boolean;
  services: DashboardService[];
  pendingTomorrowCount: number;
  todayPayments: PaymentTickerItem[];
  yesterdayUnpaid: UnpaidCollectItem[];
  rooms: ClinicRoomStatus[];
  doctors: DoctorOperationalStatus[];
  attentionItems: AttentionItem[];
  insights: MissionControlInsight[];
  unreadNotificationsHint: number;
  journeyState?: any;
  journeyContext?: any;
}

export { isQueueVisible, isKanbanColumn, type QueueVisibleStatus } from "./queueStateMachine";

export type QueueAppointment = Appointment & { status: import("./queueStateMachine").QueueVisibleStatus };
