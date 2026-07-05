"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export interface RecordPaymentResult {
  success: boolean;
  newBalanceDue?: number;
  paymentId?: string;
  error?: string;
}

export async function recordPatientPayment(
  patientId: string,
  amountPaid: number,
): Promise<RecordPaymentResult> {
  try {
    const amount = Math.floor(amountPaid);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: "Payment amount must be greater than zero." };
    }

    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id, total_balance_due")
      .eq("id", patientId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (patientError || !patient) {
      return { success: false, error: patientError?.message ?? "Patient not found." };
    }

    if (amount > patient.total_balance_due) {
      return {
        success: false,
        error: "Payment exceeds outstanding balance.",
      };
    }

    const { data: payment, error: paymentError } = await supabase
      .from("patient_payments")
      .insert({
        tenant_id: tenantId,
        patient_id: patientId,
        amount_paid: amount,
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      return { success: false, error: paymentError?.message ?? "Payment failed." };
    }

    const newBalanceDue = patient.total_balance_due - amount;

    const { error: updateError } = await supabase
      .from("patients")
      .update({ total_balance_due: newBalanceDue })
      .eq("id", patientId)
      .eq("tenant_id", tenantId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/[locale]/dashboard/patients/[id]", "page");
    revalidatePath(`/[locale]/dashboard/patients/${patientId}`, "page");
    revalidatePath("/[locale]/dashboard/patients", "page");
    revalidatePath("/[locale]/dashboard/recalls", "page");

    return {
      success: true,
      newBalanceDue,
      paymentId: payment.id,
    };
  } catch (error) {
    console.error("[recordPatientPayment]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment failed.",
    };
  }
}
