import type { Appointment } from "@/lib/dashboard/types";

type PatientJoin =
  | { name: string; phone_number: string; no_show_count: number }
  | { name: string; phone_number: string; no_show_count: number }[]
  | null;

type ServiceJoin =
  | { name: string; duration_minutes: number; price_egp: number | null }
  | { name: string; duration_minutes: number; price_egp: number | null }[]
  | null;

export type AppointmentJoinRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  service_id: string;
  appointment_date: string;
  status: Appointment["status"];
  patients?: PatientJoin;
  services?: ServiceJoin;
};

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function mapAppointmentRow(row: AppointmentJoinRow): Appointment {
  const patient = unwrapJoin(row.patients);
  const service = unwrapJoin(row.services);

  return {
    id: row.id,
    tenantId: row.tenant_id,
    patientId: row.patient_id,
    patientName: patient?.name ?? "Unknown",
    phoneNumber: patient?.phone_number ?? "",
    noShowCount: patient?.no_show_count ?? 0,
    serviceId: row.service_id,
    serviceName: service?.name ?? "Service",
    durationMinutes: service?.duration_minutes ?? 30,
    priceEgp: service?.price_egp ?? null,
    appointmentDate: row.appointment_date,
    status: row.status,
  };
}

export const APPOINTMENT_SELECT = `
  id,
  tenant_id,
  patient_id,
  service_id,
  appointment_date,
  status,
  patients ( name, phone_number, no_show_count ),
  services ( name, duration_minutes, price_egp )
`;
