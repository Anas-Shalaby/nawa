"use server";

import {
  BookingActionError,
  type BookAppointmentInput,
  type BookAppointmentResult,
} from "@/actions/bookAppointment.types";
import { isSlotAvailable } from "@/actions/slots";
import {
  buildCairoAppointmentIso,
  getCairoDateKeyFromIso,
  toStoredPhoneNumber,
} from "@/lib/datetime/cairo";
import { normalizeEgyptPhone } from "@/lib/booking/schema";
import { createServiceRoleClient } from "@/utils/supabase/auth";
import { signBookingTicket } from "@/lib/booking/ticketToken";
import { trySetAppointmentArrivalSource } from "@/lib/dashboard/setAppointmentArrivalSource";

const DEPENDENT_RELATIONSHIPS = new Set([
  "child",
  "spouse",
  "parent",
  "other",
]);

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
    const masterName = formData.name.trim();
    const bookingType = formData.bookingType ?? "self";
    const dependentName = formData.dependentName?.trim() ?? "";
    const relationshipType = formData.relationshipType;

    if (
      masterName.length < 2 ||
      !/^1[0125]\d{8}$/.test(normalizedPhone)
    ) {
      throw new BookingActionError("UNKNOWN", "Invalid booking details.");
    }

    if (bookingType !== "self" && bookingType !== "dependent") {
      throw new BookingActionError("UNKNOWN", "Invalid booking type.");
    }

    if (
      bookingType === "dependent" &&
      (dependentName.length < 2 ||
        !relationshipType ||
        !DEPENDENT_RELATIONSHIPS.has(relationshipType))
    ) {
      throw new BookingActionError(
        "UNKNOWN",
        "Dependent name and relationship are required.",
      );
    }

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, slug, is_active")
      .eq("slug", formData.tenantSlug)
      .eq("is_active", true)
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
      .select("id, duration_minutes")
      .eq("id", formData.serviceId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (serviceError) {
      throw new Error(serviceError.message);
    }

    if (!service) {
      throw new BookingActionError("UNKNOWN", "Service not found.");
    }

    const slotTime = formData.slotTime.slice(0, 5);
    const appointmentDate = buildCairoAppointmentIso(formData.date, slotTime);
    const durationMinutes = service.duration_minutes ?? 30;

    if (getCairoDateKeyFromIso(appointmentDate) !== formData.date) {
      throw new BookingActionError("UNKNOWN", "Invalid appointment date or time.");
    }

    const slotStillFree = await isSlotAvailable(
      tenantId,
      formData.date,
      slotTime,
      durationMinutes,
    );

    if (!slotStillFree) {
      throw new BookingActionError(
        "SLOT_TAKEN",
        "This slot was just taken. Please choose another time.",
      );
    }

    // The contact owner is always a master row (parent_id IS NULL). Dependents
    // intentionally share this phone, so phone-only maybeSingle() is unsafe.
    const { data: existingMaster, error: masterLookupError } = await supabase
      .from("patients")
      .select("id, no_show_count")
      .eq("tenant_id", tenantId)
      .eq("phone_number", phoneNumber)
      .is("parent_id", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (masterLookupError) {
      throw new Error(masterLookupError.message);
    }

    let masterPatientId = existingMaster?.id;
    let masterNoShowCount = existingMaster?.no_show_count ?? 0;

    if (masterPatientId) {
      const { error: updateMasterError } = await supabase
        .from("patients")
        .update({ name: masterName })
        .eq("id", masterPatientId)
        .eq("tenant_id", tenantId)
        .is("parent_id", null);

      if (updateMasterError) {
        throw new Error(updateMasterError.message);
      }
    } else {
      const { data: newMaster, error: insertMasterError } = await supabase
        .from("patients")
        .insert({
          tenant_id: tenantId,
          name: masterName,
          phone_number: phoneNumber,
          parent_id: null,
          relationship_type: null,
        })
        .select("id, no_show_count")
        .single();

      if (insertMasterError) {
        throw new Error(insertMasterError.message);
      }

      masterPatientId = newMaster.id;
      masterNoShowCount = newMaster.no_show_count;
    }

    if (!masterPatientId) {
      throw new Error("Failed to resolve the master patient.");
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
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let finalPatientId = masterPatientId;
    let finalPatientNoShowCount = masterNoShowCount;

    if (bookingType === "dependent") {
      // Route the appointment to the actual patient while preserving the
      // master's phone as the household contact number.
      const { data: existingDependent, error: dependentLookupError } =
        await supabase
          .from("patients")
          .select("id, no_show_count")
          .eq("tenant_id", tenantId)
          .eq("parent_id", masterPatientId)
          .eq("name", dependentName)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

      if (dependentLookupError) {
        throw new Error(dependentLookupError.message);
      }

      if (existingDependent) {
        finalPatientId = existingDependent.id;
        finalPatientNoShowCount = existingDependent.no_show_count;

        const { error: updateDependentError } = await supabase
          .from("patients")
          .update({
            phone_number: phoneNumber,
            relationship_type: relationshipType,
          })
          .eq("id", existingDependent.id)
          .eq("tenant_id", tenantId)
          .eq("parent_id", masterPatientId);

        if (updateDependentError) {
          throw new Error(updateDependentError.message);
        }
      } else {
        const { data: newDependent, error: insertDependentError } =
          await supabase
            .from("patients")
            .insert({
              tenant_id: tenantId,
              name: dependentName,
              phone_number: phoneNumber,
              parent_id: masterPatientId,
              relationship_type: relationshipType,
            })
            .select("id, no_show_count")
            .single();

        if (insertDependentError) {
          throw new Error(insertDependentError.message);
        }

        finalPatientId = newDependent.id;
        finalPatientNoShowCount = newDependent.no_show_count;
      }
    }

    // Discipline applies to the patient who will actually receive treatment.
    if (finalPatientNoShowCount >= 2) {
      throw new BookingActionError(
        "SOFT_BANNED",
        "Online booking is unavailable. Please call the clinic.",
      );
    }

    const { data: appointmentId, error: appointmentError } = await supabase.rpc(
      "book_appointment_atomic",
      {
        p_tenant_id: tenantId,
        p_patient_id: finalPatientId,
        p_service_id: service.id,
        p_appointment_date: appointmentDate,
        p_replaced_appointment_id: freedSlot?.id ?? null,
      },
    );

    if (appointmentError) {
      if (
        appointmentError.code === "23P01" ||
        appointmentError.message.includes("SLOT_UNAVAILABLE")
      ) {
        throw new BookingActionError(
          "SLOT_TAKEN",
          "This slot was just taken. Please choose another time.",
        );
      }

      if (appointmentError.message.includes("PATIENT_UNAVAILABLE")) {
        throw new BookingActionError(
          "SOFT_BANNED",
          "Online booking is unavailable. Please call the clinic.",
        );
      }

      throw new Error(appointmentError.message);
    }

    if (typeof appointmentId !== "string") {
      throw new Error("Atomic booking returned an invalid appointment id.");
    }

    await trySetAppointmentArrivalSource(supabase, tenantId, appointmentId, "online");

    return {
      success: true,
      appointmentId,
      ticketToken: signBookingTicket(appointmentId, formData.tenantSlug),
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
