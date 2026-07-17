import type { AppointmentStatus } from "@/lib/dashboard/types";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";
import {
  getCairoDayQueryBounds,
  getCairoTodayKey,
  normalizeStoredTimestamp,
} from "@/lib/datetime/cairo";

export interface AgendaAppointment {
  id: string;
  patientId: string;
  patientName: string;
  phoneNumber: string;
  serviceId: string;
  serviceName: string;
  serviceColorCode: string | null;
  durationMinutes: number;
  servicePriceEgp: number | null;
  appointmentDate: string;
  doctorNotes: string | null;
  isReExamination: boolean;
  status: AppointmentStatus;
}

type PatientJoin =
  | { name: string; phone_number: string }
  | { name: string; phone_number: string }[]
  | null;

type ServiceJoin =
  | {
      name: string;
      price_egp: number | null;
      duration_minutes: number | null;
      color_code: string | null;
    }
  | {
      name: string;
      price_egp: number | null;
      duration_minutes: number | null;
      color_code: string | null;
    }[]
  | null;

type AgendaRow = {
  id: string;
  patient_id: string;
  service_id: string;
  appointment_date: string;
  status: AppointmentStatus;
  doctor_notes: string | null;
  is_re_examination: boolean;
  patients?: PatientJoin;
  services?: ServiceJoin;
};

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapAgendaRow(row: AgendaRow): AgendaAppointment {
  const patient = unwrapJoin(row.patients);
  const service = unwrapJoin(row.services);

  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: patient?.name ?? "Unknown",
    phoneNumber: patient?.phone_number ?? "",
    serviceId: row.service_id,
    serviceName: service?.name ?? "Service",
    serviceColorCode: service?.color_code ?? null,
    durationMinutes: service?.duration_minutes ?? 30,
    servicePriceEgp: service?.price_egp ?? null,
    appointmentDate: normalizeStoredTimestamp(row.appointment_date),
    doctorNotes: row.doctor_notes,
    isReExamination: row.is_re_examination ?? false,
    status: row.status,
  };
}

export async function fetchUpcomingAgenda(): Promise<AgendaAppointment[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const { startIso } = getCairoDayQueryBounds(getCairoTodayKey());

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      patient_id,
      service_id,
      appointment_date,
      status,
      doctor_notes,
      is_re_examination,
      patients!inner ( name, phone_number ),
      services!inner ( name, price_egp, duration_minutes, color_code )
    `,
    )
    .eq("tenant_id", tenantId)
    .gte("appointment_date", startIso)
    .in("status", ["pending", "confirmed"])
    .order("appointment_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load upcoming agenda: ${error.message}`);
  }

  return (data ?? []).map((row) => mapAgendaRow(row as AgendaRow));
}
