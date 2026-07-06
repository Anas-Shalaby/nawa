import type { AppointmentStatus } from "@/lib/dashboard/types";
import { normalizeStoredTimestamp } from "@/lib/datetime/cairo";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface PatientVisitRecord {
  id: string;
  appointmentDate: string;
  serviceName: string;
  priceEgp: number | null;
  status: AppointmentStatus;
  doctorNotes: string | null;
  isReExamination: boolean;
}

type ServiceJoin =
  | { name: string; price_egp: number | null }
  | { name: string; price_egp: number | null }[]
  | null;

type VisitRow = {
  id: string;
  appointment_date: string;
  status: AppointmentStatus;
  doctor_notes: string | null;
  is_re_examination: boolean;
  services?: ServiceJoin;
};

function unwrapJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapVisitRow(row: VisitRow): PatientVisitRecord {
  const service = unwrapJoin(row.services);

  return {
    id: row.id,
    appointmentDate: normalizeStoredTimestamp(row.appointment_date),
    serviceName: service?.name ?? "—",
    priceEgp: service?.price_egp ?? null,
    status: row.status,
    doctorNotes: row.doctor_notes,
    isReExamination: row.is_re_examination ?? false,
  };
}

export async function fetchPatientVisitHistory(
  patientId: string,
): Promise<PatientVisitRecord[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      appointment_date,
      status,
      doctor_notes,
      is_re_examination,
      services!inner ( name, price_egp )
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load patient visit history: ${error.message}`);
  }

  return (data ?? []).map((row) => mapVisitRow(row as VisitRow));
}
