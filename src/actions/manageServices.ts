"use server";

import { revalidatePath } from "next/cache";
import { createServiceSchema } from "@/lib/services/schema";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface ServiceInput {
  name: string;
  durationMinutes: number;
  priceEgp?: number | null;
  preVisitInstructions?: string | null;
  isPackage?: boolean;
  sessionsCount?: number;
  colorCode?: string | null;
}

export interface ManageServiceResult {
  success: boolean;
  error?: string;
  errorCode?: "HAS_APPOINTMENTS" | "UNKNOWN";
}

type ValidatedServiceInput =
  | { ok: true; value: ServiceInput & { name: string } }
  | ManageServiceResult;

function validateServiceInput(input: ServiceInput): ValidatedServiceInput {
  const schema = createServiceSchema((key) => {
    const messages = {
      nameRequired: "Service name is required.",
      durationRequired: "Duration must be greater than zero.",
      priceInvalid: "Price cannot be negative.",
      sessionsRequired: "Packages must include at least two sessions.",
      colorInvalid: "Color must be a valid hex value.",
    };
    return messages[key];
  });
  const parsed = schema.safeParse({
    name: input.name,
    durationMinutes: input.durationMinutes,
    priceEgp:
      input.priceEgp === undefined || Number.isNaN(input.priceEgp)
        ? null
        : input.priceEgp,
    preVisitInstructions: input.preVisitInstructions?.trim() || null,
    isPackage: input.isPackage ?? false,
    sessionsCount: input.isPackage ? (input.sessionsCount ?? 1) : 1,
    colorCode: input.colorCode?.trim() || null,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid service.",
    };
  }

  return {
    ok: true,
    value: {
      name: parsed.data.name,
      durationMinutes: parsed.data.durationMinutes,
      priceEgp:
        parsed.data.priceEgp === null
          ? null
          : Math.floor(parsed.data.priceEgp),
      preVisitInstructions: parsed.data.preVisitInstructions,
      isPackage: parsed.data.isPackage,
      sessionsCount: parsed.data.isPackage ? parsed.data.sessionsCount : 1,
      colorCode: parsed.data.colorCode?.toUpperCase() ?? null,
    },
  };
}

function revalidateServicePaths() {
  revalidatePath("/[locale]/dashboard/services", "page");
  revalidatePath("/[locale]/dashboard/settings", "page");
  revalidatePath("/[locale]/dashboard", "page");
}

export async function addService(input: ServiceInput): Promise<ManageServiceResult> {
  const validated = validateServiceInput(input);
  if (!("ok" in validated) || !validated.ok) {
    return "success" in validated ? validated : { success: false, error: "Invalid service." };
  }
  const normalized = validated.value;

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase.from("services").insert({
      tenant_id: tenantId,
      name: normalized.name,
      duration_minutes: normalized.durationMinutes,
      price_egp: normalized.priceEgp,
      pre_visit_instructions: normalized.preVisitInstructions,
      is_package: normalized.isPackage,
      sessions_count: normalized.sessionsCount,
      color_code: normalized.colorCode,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidateServicePaths();
    return { success: true };
  } catch (error) {
    console.error("[addService]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not add service.",
    };
  }
}

export async function updateService(
  serviceId: string,
  input: ServiceInput,
): Promise<ManageServiceResult> {
  const validated = validateServiceInput(input);
  if (!("ok" in validated) || !validated.ok) {
    return "success" in validated ? validated : { success: false, error: "Invalid service." };
  }
  const normalized = validated.value;

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("services")
      .update({
        name: normalized.name,
        duration_minutes: normalized.durationMinutes,
        price_egp: normalized.priceEgp,
        pre_visit_instructions: normalized.preVisitInstructions,
        is_package: normalized.isPackage,
        sessions_count: normalized.sessionsCount,
        color_code: normalized.colorCode,
      })
      .eq("id", serviceId)
      .eq("tenant_id", tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidateServicePaths();
    return { success: true };
  } catch (error) {
    console.error("[updateService]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update service.",
    };
  }
}

/** @deprecated Pass a ServiceInput object to addService instead. */
export async function addServiceLegacy(
  name: string,
  durationMinutes = 30,
): Promise<ManageServiceResult> {
  return addService({ name, durationMinutes });
}

export async function deleteService(serviceId: string): Promise<ManageServiceResult> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("tenant_id", tenantId);

    if (error) {
      const hasAppointments = error.message.includes("violates foreign key");

      return {
        success: false,
        errorCode: hasAppointments ? "HAS_APPOINTMENTS" : "UNKNOWN",
        error: hasAppointments
          ? "This service has appointments and cannot be deleted."
          : error.message,
      };
    }

    revalidateServicePaths();
    return { success: true };
  } catch (error) {
    console.error("[deleteService]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete service.",
    };
  }
}
