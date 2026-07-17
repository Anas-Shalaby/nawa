import { z } from "zod";
import { normalizeEgyptPhone } from "@/lib/booking/schema";

const egyptMobileRegex = /^1[0125]\d{8}$/;

export function createInternalBookingSchema(
  message: (key: InternalBookingValidationKey) => string,
) {
  return z
    .object({
      phone: z
        .string()
        .trim()
        .min(1, message("phoneRequired"))
        .refine(
          (value) => egyptMobileRegex.test(normalizeEgyptPhone(value)),
          message("phoneInvalid"),
        ),
      patientName: z.string().trim().max(80, message("nameMax")),
      bookForDependent: z.boolean().default(false),
      dependentId: z.string().optional(),
      dependentName: z.string().trim().max(80, message("nameMax")).optional(),
      relationshipType: z
        .enum(["child", "spouse", "parent", "sibling", "other"])
        .optional(),
      serviceId: z.string().min(1, message("serviceRequired")),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message("dateRequired")),
      slotTime: z.string().regex(/^\d{2}:\d{2}$/, message("slotRequired")),
    })
    .superRefine((values, context) => {
      if (!values.patientName || values.patientName.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["patientName"],
          message: message("nameRequired"),
        });
      }

      if (!values.bookForDependent || values.dependentId) return;

      if (!values.dependentName || values.dependentName.length < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dependentName"],
          message: message("dependentNameRequired"),
        });
      }

      if (!values.relationshipType) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relationshipType"],
          message: message("relationshipRequired"),
        });
      }
    });
}

export type InternalBookingValidationKey =
  | "phoneRequired"
  | "phoneInvalid"
  | "nameRequired"
  | "nameMax"
  | "dependentNameRequired"
  | "relationshipRequired"
  | "serviceRequired"
  | "dateRequired"
  | "slotRequired";

export type InternalBookingFormValues = z.input<
  ReturnType<typeof createInternalBookingSchema>
>;
