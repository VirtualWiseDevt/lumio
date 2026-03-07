import { z } from "zod";
import { normalizeKenyanPhone } from "./phone.utils.js";

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    phone: z
      .string()
      .transform((val, ctx) => {
        try {
          return normalizeKenyanPhone(val);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid Kenyan phone number",
          });
          return z.NEVER;
        }
      })
      .optional(),
  })
  .refine((data) => data.name || data.phone, {
    message: "At least one field (name or phone) is required",
  });

export const updatePreferencesSchema = z.object({
  newsletter: z.boolean(),
});
