"use server";

import { requirePermission } from "@/lib/auth/staffPermissions";
import type { PrescriptionLineInput } from "@/lib/clinical/prescriptionTypes";
import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

type ActionResult = { success: boolean; error?: string; id?: string };

function normalizeLines(lines: PrescriptionLineInput[]): PrescriptionLineInput[] {
  return lines
    .map((line) => ({
      medicineName: line.medicineName.trim(),
      doseAmount: (line.doseAmount || "1").trim(),
      form: (line.form || "قرص").trim(),
      frequency: line.frequency.trim(),
      duration: line.duration.trim(),
      notes: line.notes.trim(),
      isChronic: Boolean(line.isChronic),
      isCustom: Boolean(line.isCustom),
    }))
    .filter((line) => line.medicineName.length > 0);
}

export async function toggleMedicineFavorite(input: {
  medicineName: string;
  doseAmount: string;
  form: string;
  frequency: string;
  duration: string;
  notes: string;
  favorite: boolean;
}): Promise<ActionResult> {
  try {
    const denied = await requirePermission("ehr.prescribe");
    if (denied) return { success: false, error: denied };

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated." };

    const name = input.medicineName.trim();
    if (!name) return { success: false, error: "Medicine name required." };

    if (!input.favorite) {
      const { error } = await supabase
        .from("medicine_favorites")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("user_id", user.id)
        .eq("medicine_name", name);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    const { data, error } = await supabase
      .from("medicine_favorites")
      .upsert(
        {
          tenant_id: tenantId,
          user_id: user.id,
          medicine_name: name,
          dose_amount: input.doseAmount.trim() || "1",
          form: input.form.trim() || "قرص",
          frequency: input.frequency.trim(),
          duration: input.duration.trim(),
          notes: input.notes.trim(),
        },
        { onConflict: "tenant_id,user_id,medicine_name" },
      )
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("[toggleMedicineFavorite]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update favorite.",
    };
  }
}

export async function savePrescriptionAsTemplate(input: {
  name: string;
  lines: PrescriptionLineInput[];
}): Promise<ActionResult> {
  try {
    const denied = await requirePermission("ehr.prescribe");
    if (denied) return { success: false, error: denied };

    const lines = normalizeLines(input.lines);
    if (!lines.length) return { success: false, error: "Add at least one medicine." };

    const name = input.name.trim();
    if (!name) return { success: false, error: "Template name required." };

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: template, error } = await supabase
      .from("prescription_templates")
      .insert({
        tenant_id: tenantId,
        created_by: user?.id ?? null,
        name,
      })
      .select("id")
      .single();

    if (error || !template) {
      return { success: false, error: error?.message ?? "Could not save template." };
    }

    const { error: lineError } = await supabase
      .from("prescription_template_lines")
      .insert(
        lines.map((line, index) => ({
          template_id: template.id,
          tenant_id: tenantId,
          sort_order: index,
          medicine_name: line.medicineName,
          dose_amount: line.doseAmount,
          form: line.form,
          frequency: line.frequency,
          duration: line.duration,
          notes: line.notes,
          is_chronic: line.isChronic,
        })),
      );

    if (lineError) {
      await supabase.from("prescription_templates").delete().eq("id", template.id);
      return { success: false, error: lineError.message };
    }

    revalidatePath("/[locale]/dashboard/patients/[id]", "page");
    return { success: true, id: template.id };
  } catch (error) {
    console.error("[savePrescriptionAsTemplate]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save template.",
    };
  }
}
