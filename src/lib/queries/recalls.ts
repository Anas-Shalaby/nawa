import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

const DEFAULT_RECALL_MONTHS = 6;

export interface RecallPatient {
  id: string;
  name: string;
  phoneNumber: string;
  totalBalanceDue: number;
  lastCompletedAt: string;
  monthsSinceVisit: number;
}

function monthsBetween(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  return years * 12 + months;
}

export async function fetchRecallPatients(
  recallMonths = DEFAULT_RECALL_MONTHS,
): Promise<RecallPatient[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - recallMonths);
  const cutoffIso = cutoff.toISOString();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      appointment_date,
      patient_id,
      patients!inner (
        id,
        name,
        phone_number,
        total_balance_due,
        is_archived
      )
    `,
    )
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .eq("patients.is_archived", false)
    .order("appointment_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to load recall patients: ${error.message}`);
  }

  const latestByPatient = new Map<string, RecallPatient>();

  for (const row of data ?? []) {
    const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
    if (!patient?.id) continue;

    if (latestByPatient.has(patient.id)) continue;

    const lastCompletedAt = row.appointment_date as string;
    if (new Date(lastCompletedAt) > cutoff) continue;

    latestByPatient.set(patient.id, {
      id: patient.id,
      name: patient.name,
      phoneNumber: patient.phone_number,
      totalBalanceDue: patient.total_balance_due ?? 0,
      lastCompletedAt,
      monthsSinceVisit: monthsBetween(new Date(lastCompletedAt), new Date()),
    });
  }

  return Array.from(latestByPatient.values()).sort(
    (a, b) => new Date(a.lastCompletedAt).getTime() - new Date(b.lastCompletedAt).getTime(),
  );
}
