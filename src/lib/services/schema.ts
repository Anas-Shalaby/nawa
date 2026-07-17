import { z } from "zod";

export type ServiceValidationKey =
  | "nameRequired"
  | "durationRequired"
  | "priceInvalid"
  | "sessionsRequired"
  | "colorInvalid";

export function createServiceSchema(
  message: (key: ServiceValidationKey) => string,
) {
  return z
    .object({
      name: z.string().trim().min(2, message("nameRequired")).max(120),
      durationMinutes: z
        .number()
        .int()
        .min(1, message("durationRequired"))
        .max(480),
      priceEgp: z
        .number()
        .min(0, message("priceInvalid"))
        .max(10_000_000)
        .nullable(),
      colorCode: z
        .string()
        .trim()
        .regex(/^#[0-9A-Fa-f]{6}$/, message("colorInvalid"))
        .nullable(),
      isPackage: z.boolean().default(false),
      sessionsCount: z.number().int().min(1).max(100).default(1),
      preVisitInstructions: z.string().trim().max(1_000).nullable(),
    })
    .superRefine((value, context) => {
      if (value.isPackage && value.sessionsCount < 2) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sessionsCount"],
          message: message("sessionsRequired"),
        });
      }
    });
}

export type ServiceFormValues = z.input<
  ReturnType<typeof createServiceSchema>
>;
