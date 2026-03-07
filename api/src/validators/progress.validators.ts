import { z } from "zod";

export const saveProgressSchema = z.object({
  contentId: z.string().uuid(),
  episodeId: z.string().uuid().nullable().optional(),
  timestamp: z.number().int().min(0),
  duration: z.number().int().min(0),
});

export const continueWatchingQuerySchema = z.object({
  months: z.coerce
    .number()
    .int()
    .refine((v) => [3, 6, 12].includes(v), {
      message: "months must be 3, 6, or 12",
    })
    .optional()
    .default(3),
});
