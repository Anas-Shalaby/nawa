"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface ScheduleFollowUpResult {
  success: boolean;
  appointmentId?: string;
  error?: string;
}

export async function scheduleFollowUp(
  patientId: string,
  _tenantId: string,
  serviceId: string,
  futureDateIso: string,
  notes: string | null,
  isReExamination = false,
): Promise<ScheduleFollowUpResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const followUpDate = new Date(futureDateIso);
    if (Number.isNaN(followUpDate.getTime())) {
      return { success: false, error: "Invalid appointment date." };
    }

    if (followUpDate.getTime() <= Date.now()) {
      return { success: false, error: "Appointment date must be in the future." };
    }

    const [{ data: patient, error: patientError }, { data: service, error: serviceError }] =
      await Promise.all([
        supabase
          .from("patients")
          .select("id")
          .eq("id", patientId)
          .eq("tenant_id", tenantId)
          .maybeSingle(),
        supabase
          .from("services")
          .select("id")
          .eq("id", serviceId)
          .eq("tenant_id", tenantId)
          .maybeSingle(),
      ]);

    if (patientError || !patient) {
      return { success: false, error: patientError?.message ?? "Patient not found." };
    }

    if (serviceError || !service) {
      return { success: false, error: serviceError?.message ?? "Service not found." };
    }

    const trimmedNotes = notes?.trim() || null;

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        patient_id: patientId,
        service_id: serviceId,
        appointment_date: futureDateIso,
        status: "confirmed",
        doctor_notes: trimmedNotes,
        is_re_examination: isReExamination,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? "Could not schedule appointment." };
    }

    revalidatePath("/[locale]/dashboard", "page");
    revalidatePath("/[locale]/dashboard/upcoming", "page");
    revalidatePath("/[locale]/dashboard/agenda", "page");
    revalidatePath("/[locale]/dashboard/patients", "page");

    return { success: true, appointmentId: data.id };
  } catch (error) {
    console.error("[scheduleFollowUp]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not schedule appointment.",
    };
  }
}
