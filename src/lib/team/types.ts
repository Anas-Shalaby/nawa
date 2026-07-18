import type { Appointment, AppointmentStatus, StaffAvailability } from "@/lib/dashboard/types";

export type TeamRole =
  | "owner"
  | "admin"
  | "doctor"
  | "receptionist"
  | "nurse"
  | "assistant"
  | "lab"
  | "manager"
  | "cashier"
  | "intern";

export type TeamLiveStatus =
  | "available"
  | "in_session"
  | "busy"
  | "break"
  | "offline"
  | "on_leave";

export type WorkloadHeat = "low" | "medium" | "high" | "critical";

export type OverviewFilterKey =
  | "all"
  | "on_duty"
  | "doctors"
  | "reception"
  | "available"
  | "busy"
  | "on_leave"
  | "offline"
  | "workload";

export interface TeamScheduleSlot {
  id: string;
  timeLabel: string;
  patientName: string;
  serviceName: string;
  status: AppointmentStatus;
}

export interface TeamStaffBase {
  id: string;
  displayName: string;
  role: TeamRole;
  department: string | null;
  phone: string | null;
  email: string | null;
  userId: string | null;
  isSuspended: boolean;
  availability: StaffAvailability;
  statusChangedAt: string;
  avgConsultMinutes: number;
  leaveUntil: string | null;
  ratingAvg: number | null;
}

export interface TeamMemberView {
  id: string;
  displayName: string;
  role: TeamRole;
  department: string | null;
  phone: string | null;
  email: string | null;
  userId: string | null;
  isSuspended: boolean;
  isLinked: boolean;
  status: TeamLiveStatus;
  availability: StaffAvailability;
  statusChangedAt: string;
  isOnDutyToday: boolean;
  workingHoursLabel: string | null;
  todayAppointments: number;
  waitingPatients: number;
  currentPatientName: string | null;
  currentAppointmentId: string | null;
  avgConsultMinutes: number;
  ratingAvg: number | null;
  lastActivityAt: string | null;
  workload: {
    bookedMinutes: number;
    capacityMinutes: number;
    pct: number;
    heat: WorkloadHeat;
  };
  scheduleToday: TeamScheduleSlot[];
}

export interface TeamOverviewCounts {
  totalStaff: number;
  doctorsOnDuty: number;
  receptionActive: number;
  availableNow: number;
  busyNow: number;
  onLeave: number;
  offline: number;
  averageWorkloadPct: number;
}

export type TeamInsightKind =
  | "most_appointments"
  | "fastest_consult"
  | "most_available"
  | "longest_queue"
  | "highest_workload"
  | "balanced_suggestion";

export interface TeamOpsInsight {
  id: string;
  kind: TeamInsightKind;
  memberId: string | null;
  memberName: string | null;
  valueLabel: string;
}

export type TeamActivityVerb =
  | "session_started"
  | "checked_in"
  | "confirmed"
  | "completed"
  | "status_available"
  | "status_busy"
  | "status_break"
  | "status_offline";

export interface TeamActivityEvent {
  id: string;
  at: string;
  verb: TeamActivityVerb;
  actorName: string;
  subjectName: string | null;
  detail: string | null;
}

export interface TeamOpsSnapshot {
  clinicName: string;
  date: string;
  tenantId: string;
  doctorName: string;
  capacityMinutes: number;
  isClinicOpen: boolean;
  workingHoursLabel: string | null;
  staff: TeamStaffBase[];
  appointments: Appointment[];
  members: TeamMemberView[];
  overview: TeamOverviewCounts;
  insights: TeamOpsInsight[];
  activity: TeamActivityEvent[];
  canManageClinic: boolean;
  /** Owner/admin only — roles, suspend, reset others' passwords */
  canManageRoles: boolean;
  currentUserId: string | null;
}
