import { z } from "zod";

/** Normalize Egyptian mobile input to digits-only for validation. */
export function normalizeEgyptPhone(input: string): string {
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("20")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

const egyptMobileRegex = /^1[0125]\d{8}$/;

type ValidationTranslator = (
  key:
    | "nameMin"
    | "nameMax"
    | "whatsappRequired"
    | "whatsappInvalid"
    | "dependentNameRequired"
    | "relationshipRequired",
) => string;

export function createPatientBookingSchema(t: ValidationTranslator) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(2, t("nameMin"))
        .max(80, t("nameMax")),
      whatsapp: z
        .string()
        .trim()
        .min(1, t("whatsappRequired"))
        .refine(
          (val) => egyptMobileRegex.test(normalizeEgyptPhone(val)),
          t("whatsappInvalid"),
        ),
      bookingType: z.enum(["self", "dependent"]).default("self"),
      dependentName: z.string().trim().optional(),
      relationshipType: z.string().optional(),
    })
    .superRefine((values, context) => {
      if (values.bookingType !== "dependent") return;

      if (!values.dependentName || values.dependentName.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dependentName"],
          message: t("dependentNameRequired"),
        });
      }

      if (
        !values.relationshipType ||
        !["child", "spouse", "parent", "other"].includes(
          values.relationshipType,
        )
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relationshipType"],
          message: t("relationshipRequired"),
        });
      }
    });
}

export type PatientBookingFormValues = z.input<
  ReturnType<typeof createPatientBookingSchema>
>;

export interface BookAppointmentInput {
  tenantSlug: string;
  serviceId: string;
  date: string;
  slotTime: string;
  name: string;
  whatsapp: string;
  bookingType: "self" | "dependent";
  dependentName?: string;
  relationshipType?: "child" | "spouse" | "parent" | "other";
}
