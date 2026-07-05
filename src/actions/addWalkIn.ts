"use server";

import {
  buildAppointmentDateIso,
  getWalkInSlotTime,
  toStoredPhoneNumber,
} from "@/lib/datetime/cairo";
import { normalizeEgyptPhone } from "@/lib/booking/schema";
import type { Appointment } from "@/lib/dashboard/types";
import { mapAppointmentRow, type AppointmentJoinRow } from "@/lib/dashboard/mapAppointment";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface AddWalkInInput {
  name: string;
  whatsapp: string;
  serviceId: string;
}

export interface AddWalkInResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
}

export async function addWalkIn(input: AddWalkInInput): Promise<AddWalkInResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const normalizedPhone = normalizeEgyptPhone(input.whatsapp);
    const phoneNumber = toStoredPhoneNumber(normalizedPhone);
    const slotTime = getWalkInSlotTime();
    const appointmentDate = buildAppointmentDateIso(slotTime);

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("id", input.serviceId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (serviceError || !service) {
      return { success: false, error: "Service not found." };
    }

    const { data: existingPatient, error: patientLookupError } = await supabase
      .from("patients")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("phone_number", phoneNumber)
      .maybeSingle();

    if (patientLookupError) {
      return { success: false, error: patientLookupError.message };
    }

    let patientId = existingPatient?.id;

    if (patientId) {
      const { error: updateError } = await supabase
        .from("patients")
        .update({ name: input.name.trim() })
        .eq("id", patientId)
        .eq("tenant_id", tenantId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    } else {
      const { data: newPatient, error: insertPatientError } = await supabase
        .from("patients")
        .insert({
          tenant_id: tenantId,
          name: input.name.trim(),
          phone_number: phoneNumber,
        })
        .select("id")
        .single();

      if (insertPatientError) {
        return { success: false, error: insertPatientError.message };
      }

      patientId = newPatient.id;
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        patient_id: patientId,
        service_id: input.serviceId,
        appointment_date: appointmentDate,
        status: "checked_in",
      })
      .select(
        `
        id,
        tenant_id,
        patient_id,
        service_id,
        appointment_date,
        status,
        patients ( name, phone_number, no_show_count ),
        services ( name, duration_minutes, price_egp )
      `,
      )
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: appointmentError?.message ?? "Walk-in failed." };
    }

    return {
      success: true,
      appointment: mapAppointmentRow(appointment as AppointmentJoinRow),
    };
  } catch (error) {
    console.error("[addWalkIn]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Walk-in failed.",
    };
  }
}
