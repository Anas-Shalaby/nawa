import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface PatientRecord {
  id: string;
  name: string;
  phoneNumber: string;
  noShowCount: number;
  notes: string | null;
  isArchived: boolean;
  totalBalanceDue: number;
  createdAt: string;
  totalVisits?: number;
  lastVisitAt?: string | null;
}

export async function fetchPatients(): Promise<PatientRecord[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("patients")
    .select("id, name, phone_number, no_show_count, notes, is_archived, total_balance_due, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load patients: ${error.message}`);
  }

  const patientIds = (data ?? []).map((patient) => patient.id);
  const visitsMap = new Map<string, { totalVisits: number; lastVisitAt: string | null }>();

  if (patientIds.length > 0) {
    const { data: appointmentRows, error: appointmentError } = await supabase
      .from("appointments")
      .select("patient_id, appointment_date, status")
      .eq("tenant_id", tenantId)
      .in("patient_id", patientIds)
      .order("appointment_date", { ascending: false });

    if (appointmentError) {
      throw new Error(`Failed to load patient visits: ${appointmentError.message}`);
    }

    for (const row of appointmentRows ?? []) {
      if (row.status === "canceled" || row.status === "no_show") continue;
      const current = visitsMap.get(row.patient_id) ?? { totalVisits: 0, lastVisitAt: null };
      visitsMap.set(row.patient_id, {
        totalVisits: current.totalVisits + 1,
        lastVisitAt: current.lastVisitAt ?? row.appointment_date,
      });
    }
  }

  return (data ?? []).map((patient) => ({
    ...(visitsMap.get(patient.id) ?? { totalVisits: 0, lastVisitAt: null }),
    id: patient.id,
    name: patient.name,
    phoneNumber: patient.phone_number,
    noShowCount: patient.no_show_count,
    notes: patient.notes ?? null,
    isArchived: patient.is_archived ?? false,
    totalBalanceDue: patient.total_balance_due ?? 0,
    createdAt: patient.created_at,
  }));
}

export async function fetchPatientById(patientId: string): Promise<PatientRecord | null> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("patients")
    .select("id, name, phone_number, no_show_count, notes, is_archived, total_balance_due, created_at")
    .eq("tenant_id", tenantId)
    .eq("id", patientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load patient: ${error.message}`);
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    phoneNumber: data.phone_number,
    noShowCount: data.no_show_count,
    notes: data.notes ?? null,
    isArchived: data.is_archived ?? false,
    totalBalanceDue: data.total_balance_due ?? 0,
    createdAt: data.created_at,
  };
}

export async function fetchPatientTenantId(): Promise<string> {
  const supabase = await createAuthenticatedClient();
  return resolveTenantId(supabase);
}
