"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface ServiceInput {
  name: string;
  durationMinutes: number;
  priceEgp?: number | null;
  preVisitInstructions?: string | null;
}

export interface ManageServiceResult {
  success: boolean;
  error?: string;
}

type ValidatedServiceInput =
  | { ok: true; value: ServiceInput & { name: string } }
  | ManageServiceResult;

function validateServiceInput(input: ServiceInput): ValidatedServiceInput {
  const name = input.name.trim();
  const preVisitInstructions = input.preVisitInstructions?.trim() || null;
  const priceEgp =
    input.priceEgp === null || input.priceEgp === undefined || Number.isNaN(input.priceEgp)
      ? null
      : Math.max(0, Math.floor(input.priceEgp));

  if (name.length < 2) {
    return { success: false, error: "Service name is required." };
  }

  if (input.durationMinutes <= 0) {
    return { success: false, error: "Duration must be greater than zero." };
  }

  return {
    ok: true,
    value: {
      name,
      durationMinutes: input.durationMinutes,
      priceEgp,
      preVisitInstructions,
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
      const message = error.message.includes("violates foreign key")
        ? "This service has appointments and cannot be deleted."
        : error.message;

      return { success: false, error: message };
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
