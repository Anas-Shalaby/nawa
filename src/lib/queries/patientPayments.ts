import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface PatientPaymentRecord {
  id: string;
  amountPaid: number;
  paidAt: string;
}

export async function fetchPatientPayments(
  patientId: string,
): Promise<PatientPaymentRecord[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("patient_payments")
    .select("id, amount_paid, paid_at")
    .eq("tenant_id", tenantId)
    .eq("patient_id", patientId)
    .order("paid_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Failed to load payments: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    amountPaid: row.amount_paid,
    paidAt: row.paid_at,
  }));
}
