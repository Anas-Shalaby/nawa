"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface AgendaAppointmentInput {
  patientId: string;
  serviceId: string;
  appointmentDateIso: string;
  notes: string | null;
  isReExamination: boolean;
}

export interface ManageAgendaAppointmentResult {
  success: boolean;
  appointmentId?: string;
  error?: string;
}

const EDITABLE_STATUSES = new Set(["pending", "confirmed"]);

function revalidateAgendaPaths() {
  revalidatePath("/[locale]/dashboard/upcoming", "page");
  revalidatePath("/[locale]/dashboard/agenda", "page");
  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/dashboard/patients", "page");
}

async function assertFutureDate(appointmentDateIso: string): Promise<string | null> {
  const appointmentDate = new Date(appointmentDateIso);
  if (Number.isNaN(appointmentDate.getTime())) {
    return "Invalid appointment date.";
  }

  if (appointmentDate.getTime() <= Date.now()) {
    return "Appointment date must be in the future.";
  }

  return null;
}

async function assertNoConflict(
  tenantId: string,
  appointmentDateIso: string,
  excludeAppointmentId?: string,
): Promise<string | null> {
  const supabase = await createAuthenticatedClient();

  let query = supabase
    .from("appointments")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("appointment_date", appointmentDateIso)
    .not("status", "in", "(no_show,completed,canceled)");

  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return error.message;
  }

  if (data) {
    return "This time slot is already booked.";
  }

  return null;
}

async function validateReferences(
  tenantId: string,
  patientId: string,
  serviceId: string,
): Promise<string | null> {
  const supabase = await createAuthenticatedClient();

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
    return patientError?.message ?? "Patient not found.";
  }

  if (serviceError || !service) {
    return serviceError?.message ?? "Service not found.";
  }

  return null;
}

export async function createAgendaAppointment(
  input: AgendaAppointmentInput,
): Promise<ManageAgendaAppointmentResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const trimmedNotes = input.notes?.trim() || null;

    const futureError = await assertFutureDate(input.appointmentDateIso);
    if (futureError) return { success: false, error: futureError };

    const referenceError = await validateReferences(
      tenantId,
      input.patientId,
      input.serviceId,
    );
    if (referenceError) return { success: false, error: referenceError };

    const conflictError = await assertNoConflict(
      tenantId,
      input.appointmentDateIso,
    );
    if (conflictError) return { success: false, error: conflictError };

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        patient_id: input.patientId,
        service_id: input.serviceId,
        appointment_date: input.appointmentDateIso,
        status: "confirmed",
        doctor_notes: trimmedNotes,
        is_re_examination: input.isReExamination,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? "Could not create appointment." };
    }

    revalidateAgendaPaths();
    return { success: true, appointmentId: data.id };
  } catch (error) {
    console.error("[createAgendaAppointment]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not create appointment.",
    };
  }
}

export async function updateAgendaAppointment(
  appointmentId: string,
  input: Omit<AgendaAppointmentInput, "patientId">,
): Promise<ManageAgendaAppointmentResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const trimmedNotes = input.notes?.trim() || null;

    const futureError = await assertFutureDate(input.appointmentDateIso);
    if (futureError) return { success: false, error: futureError };

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status, patient_id")
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (fetchError || !appointment) {
      return { success: false, error: fetchError?.message ?? "Appointment not found." };
    }

    if (!EDITABLE_STATUSES.has(appointment.status)) {
      return { success: false, error: "This appointment can no longer be edited." };
    }

    const referenceError = await validateReferences(
      tenantId,
      appointment.patient_id,
      input.serviceId,
    );
    if (referenceError) return { success: false, error: referenceError };

    const conflictError = await assertNoConflict(
      tenantId,
      input.appointmentDateIso,
      appointmentId,
    );
    if (conflictError) return { success: false, error: conflictError };

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        service_id: input.serviceId,
        appointment_date: input.appointmentDateIso,
        doctor_notes: trimmedNotes,
        is_re_examination: input.isReExamination,
      })
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidateAgendaPaths();
    return { success: true, appointmentId };
  } catch (error) {
    console.error("[updateAgendaAppointment]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update appointment.",
    };
  }
}

export async function cancelAgendaAppointment(
  appointmentId: string,
): Promise<ManageAgendaAppointmentResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (fetchError || !appointment) {
      return { success: false, error: fetchError?.message ?? "Appointment not found." };
    }

    if (!EDITABLE_STATUSES.has(appointment.status)) {
      return { success: false, error: "This appointment can no longer be cancelled." };
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "canceled" })
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidateAgendaPaths();
    return { success: true, appointmentId };
  } catch (error) {
    console.error("[cancelAgendaAppointment]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not cancel appointment.",
    };
  }
}
