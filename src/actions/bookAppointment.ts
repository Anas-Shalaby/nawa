"use server";

import {
  BookingActionError,
  type BookAppointmentInput,
  type BookAppointmentResult,
} from "@/actions/bookAppointment.types";
import {
  buildAppointmentDateIso,
  toStoredPhoneNumber,
} from "@/lib/datetime/cairo";
import { normalizeEgyptPhone } from "@/lib/booking/schema";
import { createServiceRoleClient } from "@/utils/supabase/auth";

/**
 * Public patient booking — uses service role server-side, scoped by slug + service ownership.
 */
export async function bookAppointment(
  formData: BookAppointmentInput,
): Promise<BookAppointmentResult> {
  try {
    const supabase = createServiceRoleClient();
    const normalizedPhone = normalizeEgyptPhone(formData.whatsapp);
    const phoneNumber = toStoredPhoneNumber(normalizedPhone);
    const appointmentDate = buildAppointmentDateIso(formData.slotTime);

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, slug")
      .eq("slug", formData.tenantSlug)
      .maybeSingle();

    if (tenantError) {
      throw new Error(tenantError.message);
    }

    if (!tenant) {
      throw new BookingActionError("UNKNOWN", "Clinic not found.");
    }

    const tenantId = tenant.id;

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("id", formData.serviceId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (serviceError) {
      throw new Error(serviceError.message);
    }

    if (!service) {
      throw new BookingActionError("UNKNOWN", "Service not found.");
    }

    const { data: existingPatient, error: patientLookupError } = await supabase
      .from("patients")
      .select("id, no_show_count")
      .eq("tenant_id", tenantId)
      .eq("phone_number", phoneNumber)
      .maybeSingle();

    if (patientLookupError) {
      throw new Error(patientLookupError.message);
    }

    if (existingPatient && existingPatient.no_show_count >= 2) {
      throw new BookingActionError(
        "SOFT_BANNED",
        "Online booking is unavailable. Please call the clinic.",
      );
    }

    const { data: conflict, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("appointment_date", appointmentDate)
      .not("status", "in", "(no_show,completed,canceled)")
      .maybeSingle();

    if (conflictError) {
      throw new Error(conflictError.message);
    }

    if (conflict) {
      throw new BookingActionError(
        "SLOT_TAKEN",
        "This slot was just taken. Please choose another time.",
      );
    }

    const { data: freedSlot } = await supabase
      .from("appointments")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("appointment_date", appointmentDate)
      .in("status", ["canceled", "no_show"])
      .maybeSingle();

    let patientId = existingPatient?.id;

    if (patientId) {
      const { error: updateError } = await supabase
        .from("patients")
        .update({ name: formData.name.trim() })
        .eq("id", patientId)
        .eq("tenant_id", tenantId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { data: newPatient, error: insertPatientError } = await supabase
        .from("patients")
        .insert({
          tenant_id: tenantId,
          name: formData.name.trim(),
          phone_number: phoneNumber,
        })
        .select("id")
        .single();

      if (insertPatientError) {
        throw new Error(insertPatientError.message);
      }

      patientId = newPatient.id;
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        patient_id: patientId,
        service_id: service.id,
        appointment_date: appointmentDate,
        status: "pending",
        replaced_appointment_id: freedSlot?.id ?? null,
      })
      .select("id")
      .single();

    if (appointmentError) {
      throw new Error(appointmentError.message);
    }

    return {
      success: true,
      appointmentId: appointment.id,
    };
  } catch (error) {
    if (error instanceof BookingActionError) {
      return {
        success: false,
        errorCode: error.code,
        message: error.message,
      };
    }

    console.error("[bookAppointment]", error);

    return {
      success: false,
      errorCode: "UNKNOWN",
      message: error instanceof Error ? error.message : "Booking failed.",
    };
  }
}

export type { BookAppointmentInput, BookAppointmentResult };
