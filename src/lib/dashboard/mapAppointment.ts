import type {
  Appointment,
  ArrivalSource,
  AppointmentPriority,
  PatientGender,
  PaymentStatus,
} from "@/lib/dashboard/types";
import { normalizeStoredTimestamp } from "@/lib/datetime/cairo";

type PatientJoin =
  | {
      name: string;
      phone_number: string;
      no_show_count: number;
      total_balance_due?: number | null;
      date_of_birth?: string | null;
      gender?: PatientGender | null;
      insurance_provider?: string | null;
    }
  | {
      name: string;
      phone_number: string;
      no_show_count: number;
      total_balance_due?: number | null;
      date_of_birth?: string | null;
      gender?: PatientGender | null;
      insurance_provider?: string | null;
    }[]
  | null;

type ServiceJoin =
  | {
      name: string;
      duration_minutes: number;
      price_egp: number | null;
      color_code: string | null;
    }
  | {
      name: string;
      duration_minutes: number;
      price_egp: number | null;
      color_code: string | null;
    }[]
  | null;

type StaffJoin =
  | { id: string; display_name: string }
  | { id: string; display_name: string }[]
  | null;

type RoomJoin =
  | { id: string; label: string }
  | { id: string; label: string }[]
  | null;

type InvoiceJoin =
  | {
      status: PaymentStatus;
      amount_due: number;
      amount_paid: number;
    }
  | {
      status: PaymentStatus;
      amount_due: number;
      amount_paid: number;
    }[]
  | null;

export type AppointmentJoinRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  service_id: string;
  appointment_date: string;
  status: Appointment["status"];
  priority?: AppointmentPriority | null;
  arrival_source?: ArrivalSource | null;
  assigned_staff_id?: string | null;
  room_id?: string | null;
  checked_in_at?: string | null;
  session_started_at?: string | null;
  completed_at?: string | null;
  is_follow_up?: boolean | null;
  is_re_examination?: boolean | null;
  patients?: PatientJoin;
  services?: ServiceJoin;
  staff_profiles?: StaffJoin;
  clinic_rooms?: RoomJoin;
  appointment_invoices?: InvoiceJoin;
};

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function mapAppointmentRow(row: AppointmentJoinRow): Appointment {
  const patient = unwrapJoin(row.patients);
  const service = unwrapJoin(row.services);
  const staff = unwrapJoin(row.staff_profiles);
  const room = unwrapJoin(row.clinic_rooms);
  const invoice = unwrapJoin(row.appointment_invoices);

  return {
    id: row.id,
    tenantId: row.tenant_id,
    patientId: row.patient_id,
    patientName: patient?.name ?? "Unknown",
    phoneNumber: patient?.phone_number ?? "",
    noShowCount: patient?.no_show_count ?? 0,
    balanceDue: patient?.total_balance_due ?? 0,
    dateOfBirth: patient?.date_of_birth ?? null,
    gender: patient?.gender ?? "unspecified",
    insuranceProvider: patient?.insurance_provider ?? null,
    serviceId: row.service_id,
    serviceName: service?.name ?? "Service",
    serviceColorCode: service?.color_code ?? null,
    durationMinutes: service?.duration_minutes ?? 30,
    priceEgp: service?.price_egp ?? null,
    appointmentDate: normalizeStoredTimestamp(row.appointment_date),
    status: row.status,
    priority: row.priority ?? "normal",
    arrivalSource: row.arrival_source ?? null,
    assignedStaffId: row.assigned_staff_id ?? null,
    assignedStaffName: staff?.display_name ?? null,
    roomId: row.room_id ?? null,
    roomLabel: room?.label ?? null,
    checkedInAt: row.checked_in_at ? normalizeStoredTimestamp(row.checked_in_at) : null,
    sessionStartedAt: row.session_started_at
      ? normalizeStoredTimestamp(row.session_started_at)
      : null,
    completedAt: row.completed_at ? normalizeStoredTimestamp(row.completed_at) : null,
    isFollowUp: row.is_follow_up ?? row.is_re_examination ?? false,
    isReExamination: row.is_re_examination ?? row.is_follow_up ?? false,
    invoiceStatus: invoice?.status,
    invoiceAmountDue: invoice?.amount_due,
    invoiceAmountPaid: invoice?.amount_paid,
  };
}

export const APPOINTMENT_SELECT = `
  id,
  tenant_id,
  patient_id,
  service_id,
  appointment_date,
  status,
  priority,
  arrival_source,
  assigned_staff_id,
  room_id,
  checked_in_at,
  session_started_at,
  completed_at,
  is_follow_up,
  is_re_examination,
  patients (
    name,
    phone_number,
    no_show_count,
    total_balance_due,
    date_of_birth,
    gender,
    insurance_provider
  ),
  services ( name, duration_minutes, price_egp, color_code ),
  staff_profiles ( id, display_name ),
  clinic_rooms ( id, label ),
  appointment_invoices ( status, amount_due, amount_paid )
`;

/** Fallback select when mission-control joins are not migrated yet. */
export const APPOINTMENT_SELECT_LEGACY = `
  id,
  tenant_id,
  patient_id,
  service_id,
  appointment_date,
  status,
  patients ( name, phone_number, no_show_count, total_balance_due ),
  services ( name, duration_minutes, price_egp, color_code )
`;
