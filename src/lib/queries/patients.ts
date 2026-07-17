import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export type PatientRelationshipType =
  | "child"
  | "spouse"
  | "sibling"
  | "parent"
  | "other"
  | (string & {});

export interface PatientRecord {
  id: string;
  name: string;
  phoneNumber: string;
  noShowCount: number;
  notes: string | null;
  isArchived: boolean;
  totalBalanceDue: number;
  createdAt: string;
  /** Master patient id when this row is a dependent. */
  parent_id?: string | null;
  /** Relationship to the master (child, spouse, sibling, …). */
  relationship_type?: string | null;
  /** Nested dependents for Family Tree UI (masters only). */
  dependents?: PatientRecord[];
  totalVisits?: number;
  lastVisitAt?: string | null;
}

export async function fetchPatients(): Promise<PatientRecord[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, name, phone_number, no_show_count, notes, is_archived, total_balance_due, created_at, parent_id, relationship_type",
    )
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
    parent_id: patient.parent_id ?? null,
    relationship_type: patient.relationship_type ?? null,
  }));
}

export async function fetchPatientById(patientId: string): Promise<PatientRecord | null> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, name, phone_number, no_show_count, notes, is_archived, total_balance_due, created_at, parent_id, relationship_type",
    )
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
    parent_id: data.parent_id ?? null,
    relationship_type: data.relationship_type ?? null,
  };
}

export async function fetchPatientTenantId(): Promise<string> {
  const supabase = await createAuthenticatedClient();
  return resolveTenantId(supabase);
}

export interface FamilyMember {
  id: string;
  name: string;
  relationshipType: string | null;
}

export interface PatientFamily {
  /** Set when the current patient is a dependent. */
  parent: FamilyMember | null;
  /** Set when the current patient is a master account. */
  dependents: FamilyMember[];
}

export async function fetchPatientFamily(
  patientId: string,
): Promise<PatientFamily> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  // Resolve the current patient's parent link first (tenant-scoped).
  const { data: current, error: currentError } = await supabase
    .from("patients")
    .select("id, parent_id")
    .eq("tenant_id", tenantId)
    .eq("id", patientId)
    .maybeSingle();

  if (currentError) {
    throw new Error(`Failed to load family context: ${currentError.message}`);
  }

  if (!current) {
    return { parent: null, dependents: [] };
  }

  const [parentResult, dependentsResult] = await Promise.all([
    current.parent_id
      ? supabase
          .from("patients")
          .select("id, name, relationship_type")
          .eq("tenant_id", tenantId)
          .eq("id", current.parent_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("patients")
      .select("id, name, relationship_type")
      .eq("tenant_id", tenantId)
      .eq("parent_id", patientId)
      .order("created_at", { ascending: true }),
  ]);

  if (parentResult.error) {
    throw new Error(`Failed to load master account: ${parentResult.error.message}`);
  }
  if (dependentsResult.error) {
    throw new Error(`Failed to load dependents: ${dependentsResult.error.message}`);
  }

  const parent = parentResult.data
    ? {
        id: parentResult.data.id,
        name: parentResult.data.name,
        relationshipType: parentResult.data.relationship_type ?? null,
      }
    : null;

  const dependents = (dependentsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    relationshipType: row.relationship_type ?? null,
  }));

  return { parent, dependents };
}
