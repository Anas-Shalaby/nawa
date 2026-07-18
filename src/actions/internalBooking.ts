"use server";

import { requirePermission } from "@/lib/auth/staffPermissions";
import { revalidatePath } from "next/cache";
import { getSlotAvailability } from "@/actions/slots";
import { normalizeEgyptPhone } from "@/lib/booking/schema";
import {
  buildCairoAppointmentIso,
  getCairoDateKeyFromIso,
  getUpcomingCairoDateKeys,
  toStoredPhoneNumber,
} from "@/lib/datetime/cairo";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";
import { trySetAppointmentArrivalSource } from "@/lib/dashboard/setAppointmentArrivalSource";

const RELATIONSHIPS = new Set([
  "child",
  "spouse",
  "parent",
  "sibling",
  "other",
]);

export interface InternalPatientLookup {
  id: string;
  name: string;
  phoneNumber: string;
  dependents: {
    id: string;
    name: string;
    relationshipType: string | null;
  }[];
}

export interface InternalBookingInput {
  phone: string;
  patientName: string;
  bookForDependent: boolean;
  dependentId?: string;
  dependentName?: string;
  relationshipType?: string;
  serviceId: string;
  date: string;
  slotTime: string;
}

export interface InternalBookingResult {
  success: boolean;
  appointmentId?: string;
  errorCode?: "INVALID_INPUT" | "SLOT_TAKEN" | "NOT_FOUND" | "UNKNOWN";
  message?: string;
}

export async function lookupPatientByPhone(
  phoneInput: string,
): Promise<InternalPatientLookup | null> {
  const normalized = normalizeEgyptPhone(phoneInput);
  if (!/^1[0125]\d{8}$/.test(normalized)) return null;

  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);
  const phoneNumber = toStoredPhoneNumber(normalized);

  const { data: master, error } = await supabase
    .from("patients")
    .select("id, name, phone_number")
    .eq("tenant_id", tenantId)
    .eq("phone_number", phoneNumber)
    .is("parent_id", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to search patient: ${error.message}`);
  if (!master) return null;

  const { data: dependents, error: dependentsError } = await supabase
    .from("patients")
    .select("id, name, relationship_type")
    .eq("tenant_id", tenantId)
    .eq("parent_id", master.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (dependentsError) {
    throw new Error(`Failed to load dependents: ${dependentsError.message}`);
  }

  return {
    id: master.id,
    name: master.name,
    phoneNumber: master.phone_number,
    dependents: (dependents ?? []).map((dependent) => ({
      id: dependent.id,
      name: dependent.name,
      relationshipType: dependent.relationship_type ?? null,
    })),
  };
}

export async function getInternalBookingSlots(
  serviceId: string,
  date: string,
): Promise<{ time: string; available: boolean }[]> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const { data: service, error } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("tenant_id", tenantId)
    .eq("id", serviceId)
    .maybeSingle();

  if (error || !service) {
    throw new Error(error?.message ?? "Service not found.");
  }

  return getSlotAvailability(
    tenantId,
    date,
    service.duration_minutes ?? 30,
  );
}

export interface NextAvailableSlot {
  date: string;
  time: string;
  serviceId: string;
}

/**
 * Scans the next 21 Cairo days for the earliest free slot for a service.
 * Uses the first active tenant service when serviceId is omitted.
 */
export async function findNextAvailableSlot(
  serviceId?: string,
): Promise<NextAvailableSlot | null> {
  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  let resolvedServiceId = serviceId?.trim() || "";
  let durationMinutes = 30;

  if (resolvedServiceId) {
    const { data: service, error } = await supabase
      .from("services")
      .select("id, duration_minutes")
      .eq("tenant_id", tenantId)
      .eq("id", resolvedServiceId)
      .maybeSingle();

    if (error || !service) {
      throw new Error(error?.message ?? "Service not found.");
    }

    durationMinutes = service.duration_minutes ?? 30;
  } else {
    const { data: service, error } = await supabase
      .from("services")
      .select("id, duration_minutes")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !service) {
      throw new Error(error?.message ?? "No services configured.");
    }

    resolvedServiceId = service.id;
    durationMinutes = service.duration_minutes ?? 30;
  }

  for (const date of getUpcomingCairoDateKeys(21)) {
    const options = await getSlotAvailability(
      tenantId,
      date,
      durationMinutes,
    );
    const firstOpen = options.find((option) => option.available);
    if (firstOpen) {
      return {
        date,
        time: firstOpen.time,
        serviceId: resolvedServiceId,
      };
    }
  }

  return null;
}

export async function createInternalBooking(
  input: InternalBookingInput,
): Promise<InternalBookingResult> {
  const normalized = normalizeEgyptPhone(input.phone);
  const patientName = input.patientName.trim();
  const dependentName = input.dependentName?.trim() ?? "";
  const slotTime = input.slotTime.slice(0, 5);

  if (
    !/^1[0125]\d{8}$/.test(normalized) ||
    patientName.length < 2 ||
    !input.serviceId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !/^\d{2}:\d{2}$/.test(slotTime)
  ) {
    return {
      success: false,
      errorCode: "INVALID_INPUT",
      message: "Invalid booking details.",
    };
  }

  if (
    input.bookForDependent &&
    !input.dependentId &&
    (dependentName.length < 2 ||
      !input.relationshipType ||
      !RELATIONSHIPS.has(input.relationshipType))
  ) {
    return {
      success: false,
      errorCode: "INVALID_INPUT",
      message: "Dependent details are required.",
    };
  }

  try {
    const denied = await requirePermission("appointments.manage");
    if (denied) {
      return {
        success: false,
        errorCode: "UNKNOWN",
        message: denied,
      };
    }

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const phoneNumber = toStoredPhoneNumber(normalized);

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, duration_minutes")
      .eq("tenant_id", tenantId)
      .eq("id", input.serviceId)
      .maybeSingle();

    if (serviceError || !service) {
      return {
        success: false,
        errorCode: "NOT_FOUND",
        message: serviceError?.message ?? "Service not found.",
      };
    }

    const appointmentDate = buildCairoAppointmentIso(input.date, slotTime);
    if (getCairoDateKeyFromIso(appointmentDate) !== input.date) {
      return {
        success: false,
        errorCode: "INVALID_INPUT",
        message: "Invalid appointment date.",
      };
    }

    const options = await getSlotAvailability(
      tenantId,
      input.date,
      service.duration_minutes ?? 30,
    );
    if (!options.some((option) => option.time === slotTime && option.available)) {
      return {
        success: false,
        errorCode: "SLOT_TAKEN",
        message: "This slot is no longer available.",
      };
    }

    const { data: existingMaster, error: masterError } = await supabase
      .from("patients")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("phone_number", phoneNumber)
      .is("parent_id", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (masterError) throw new Error(masterError.message);

    let masterId = existingMaster?.id;
    if (!masterId) {
      const { data: createdMaster, error: createMasterError } = await supabase
        .from("patients")
        .insert({
          tenant_id: tenantId,
          name: patientName,
          phone_number: phoneNumber,
          parent_id: null,
          relationship_type: null,
        })
        .select("id")
        .single();

      if (createMasterError) throw new Error(createMasterError.message);
      masterId = createdMaster.id;
    }

    let finalPatientId = masterId;

    if (input.bookForDependent) {
      if (input.dependentId) {
        const { data: dependent, error: dependentError } = await supabase
          .from("patients")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("id", input.dependentId)
          .eq("parent_id", masterId)
          .maybeSingle();

        if (dependentError || !dependent) {
          return {
            success: false,
            errorCode: "NOT_FOUND",
            message: dependentError?.message ?? "Dependent not found.",
          };
        }
        finalPatientId = dependent.id;
      } else {
        const { data: existingDependent, error: dependentLookupError } =
          await supabase
            .from("patients")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("parent_id", masterId)
            .eq("name", dependentName)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (dependentLookupError) throw new Error(dependentLookupError.message);

        if (existingDependent) {
          finalPatientId = existingDependent.id;
        } else {
          const { data: createdDependent, error: createDependentError } =
            await supabase
              .from("patients")
              .insert({
                tenant_id: tenantId,
                name: dependentName,
                phone_number: phoneNumber,
                parent_id: masterId,
                relationship_type: input.relationshipType,
              })
              .select("id")
              .single();

          if (createDependentError) throw new Error(createDependentError.message);
          finalPatientId = createdDependent.id;
        }
      }
    }

    // Staff bookings may override the public soft ban. The exclusion constraint
    // remains the final concurrency guard if two staff members submit together.
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenantId,
        patient_id: finalPatientId,
        service_id: service.id,
        appointment_date: appointmentDate,
        status: "confirmed",
      })
      .select("id")
      .single();

    if (appointmentError) {
      if (appointmentError.code === "23P01") {
        return {
          success: false,
          errorCode: "SLOT_TAKEN",
          message: "This slot was just taken.",
        };
      }
      throw new Error(appointmentError.message);
    }

    await trySetAppointmentArrivalSource(
      supabase,
      tenantId,
      appointment.id,
      "internal",
    );

    revalidatePath("/[locale]/dashboard", "page");
    revalidatePath("/[locale]/dashboard/upcoming", "page");
    revalidatePath("/[locale]/dashboard/agenda", "page");
    revalidatePath("/[locale]/dashboard/patients", "page");

    return { success: true, appointmentId: appointment.id };
  } catch (error) {
    console.error("[createInternalBooking]", error);
    return {
      success: false,
      errorCode: "UNKNOWN",
      message: error instanceof Error ? error.message : "Could not create booking.",
    };
  }
}
