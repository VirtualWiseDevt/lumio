import { z } from "zod";

export const billingQuerySchema = z.object({
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "EXPIRED"]).optional(),
  userId: z.string().uuid().optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["createdAt", "amount", "status"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const billingStatsQuerySchema = z.object({
  periodDays: z.coerce.number().int().min(1).max(365).default(30),
});

export type BillingQuery = z.infer<typeof billingQuerySchema>;
export type BillingStatsQuery = z.infer<typeof billingStatsQuerySchema>;
