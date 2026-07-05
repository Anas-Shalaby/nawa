import type { PatientMediaRecord } from "@/lib/media/types";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

type PatientMediaRow = {
  id: string;
  tenant_id: string;
  patient_id: string;
  file_path: string;
  tag: PatientMediaRecord["tag"];
  notes: string | null;
  created_at: string;
};

function mapPatientMediaRow(row: PatientMediaRow): PatientMediaRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    patientId: row.patient_id,
    filePath: row.file_path,
    tag: row.tag,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function fetchPatientMedia(patientId: string): Promise<PatientMediaRecord[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("patient_media")
    .select("id, tenant_id, patient_id, file_path, tag, notes, created_at")
    .eq("tenant_id", tenantId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load patient media: ${error.message}`);
  }

  return (data ?? []).map((row) => mapPatientMediaRow(row as PatientMediaRow));
}
