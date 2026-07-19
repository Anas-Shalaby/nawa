import type {
  ChronicMedicationRecord,
  MedicineFavoriteRecord,
  PrescriptionLineInput,
  PrescriptionLineRecord,
  PrescriptionRecord,
  PrescriptionTemplateRecord,
} from "@/lib/clinical/prescriptionTypes";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

type RxRow = {
  id: string;
  patient_id: string;
  doctor_name: string;
  clinic_name: string;
  specialty: string;
  status: "active" | "void";
  general_notes: string | null;
  public_token: string;
  duplicated_from_id: string | null;
  created_at: string;
};

type LineRow = {
  id: string;
  prescription_id: string;
  sort_order: number;
  medicine_name: string;
  dose_amount: string;
  form: string;
  frequency: string;
  duration: string;
  notes: string;
  is_chronic: boolean;
  is_custom: boolean;
};

function mapLine(row: LineRow): PrescriptionLineRecord {
  return {
    id: row.id,
    sortOrder: row.sort_order,
    medicineName: row.medicine_name,
    doseAmount: row.dose_amount,
    form: row.form,
    frequency: row.frequency,
    duration: row.duration,
    notes: row.notes,
    isChronic: row.is_chronic,
    isCustom: row.is_custom,
  };
}

function mapRx(row: RxRow, lines: PrescriptionLineRecord[]): PrescriptionRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorName: row.doctor_name,
    clinicName: row.clinic_name,
    specialty: row.specialty,
    status: row.status,
    generalNotes: row.general_notes,
    publicToken: row.public_token,
    duplicatedFromId: row.duplicated_from_id,
    createdAt: row.created_at,
    lines,
  };
}

function isMissingRelation(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("prescriptions") ||
    lower.includes("medicine_favorites") ||
    lower.includes("patient_chronic") ||
    lower.includes("does not exist") ||
    lower.includes("schema cache")
  );
}

export async function fetchPatientPrescriptions(
  patientId: string,
): Promise<PrescriptionRecord[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data: rxRows, error } = await supabase
    .from("prescriptions")
    .select(
      "id, patient_id, doctor_name, clinic_name, specialty, status, general_notes, public_token, duplicated_from_id, created_at",
    )
    .eq("tenant_id", tenantId)
    .eq("patient_id", patientId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(`Failed to load prescriptions: ${error.message}`);
  }

  const ids = (rxRows ?? []).map((row) => row.id);
  if (ids.length === 0) return [];

  const { data: lineRows, error: lineError } = await supabase
    .from("prescription_lines")
    .select(
      "id, prescription_id, sort_order, medicine_name, dose_amount, form, frequency, duration, notes, is_chronic, is_custom",
    )
    .eq("tenant_id", tenantId)
    .in("prescription_id", ids)
    .order("sort_order", { ascending: true });

  if (lineError) {
    if (isMissingRelation(lineError.message)) return [];
    throw new Error(`Failed to load prescription lines: ${lineError.message}`);
  }

  const byRx = new Map<string, PrescriptionLineRecord[]>();
  for (const row of (lineRows ?? []) as LineRow[]) {
    const list = byRx.get(row.prescription_id) ?? [];
    list.push(mapLine(row));
    byRx.set(row.prescription_id, list);
  }

  return ((rxRows ?? []) as RxRow[]).map((row) =>
    mapRx(row, byRx.get(row.id) ?? []),
  );
}

export async function fetchMedicineFavorites(): Promise<MedicineFavoriteRecord[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("medicine_favorites")
    .select("id, medicine_name, dose_amount, form, frequency, duration, notes")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .order("medicine_name", { ascending: true });

  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(`Failed to load favorites: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    medicineName: row.medicine_name,
    doseAmount: row.dose_amount,
    form: row.form,
    frequency: row.frequency,
    duration: row.duration,
    notes: row.notes,
  }));
}

export async function fetchClinicPrescriptionTemplates(): Promise<
  PrescriptionTemplateRecord[]
> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data: templates, error } = await supabase
    .from("prescription_templates")
    .select("id, name, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(`Failed to load templates: ${error.message}`);
  }

  const ids = (templates ?? []).map((row) => row.id);
  if (ids.length === 0) return [];

  const { data: lines, error: lineError } = await supabase
    .from("prescription_template_lines")
    .select(
      "template_id, sort_order, medicine_name, dose_amount, form, frequency, duration, notes, is_chronic",
    )
    .eq("tenant_id", tenantId)
    .in("template_id", ids)
    .order("sort_order", { ascending: true });

  if (lineError) {
    if (isMissingRelation(lineError.message)) return [];
    throw new Error(`Failed to load template lines: ${lineError.message}`);
  }

  const byTemplate = new Map<string, PrescriptionLineInput[]>();
  for (const row of lines ?? []) {
    const list = byTemplate.get(row.template_id) ?? [];
    list.push({
      medicineName: row.medicine_name,
      doseAmount: row.dose_amount,
      form: row.form,
      frequency: row.frequency,
      duration: row.duration,
      notes: row.notes,
      isChronic: row.is_chronic,
      isCustom: false,
    });
    byTemplate.set(row.template_id, list);
  }

  return (templates ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    lines: byTemplate.get(row.id) ?? [],
  }));
}

export async function fetchPatientChronicMedications(
  patientId: string,
): Promise<ChronicMedicationRecord[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("patient_chronic_medications")
    .select(
      "id, medicine_name, dose_amount, form, frequency, duration, notes",
    )
    .eq("tenant_id", tenantId)
    .eq("patient_id", patientId)
    .eq("is_active", true)
    .order("medicine_name", { ascending: true });

  if (error) {
    if (isMissingRelation(error.message)) return [];
    throw new Error(`Failed to load chronic meds: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    medicineName: row.medicine_name,
    doseAmount: row.dose_amount,
    form: row.form,
    frequency: row.frequency,
    duration: row.duration,
    notes: row.notes,
  }));
}
