import { z } from "zod";

export const activityQuerySchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.string().uuid().optional(),
  period: z
    .enum(["week", "month", "quarter", "all", "custom"])
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["createdAt", "action", "entityType"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const dashboardStatsQuerySchema = z.object({
  periodDays: z.coerce.number().int().min(1).max(365).default(30),
});

export const revenueChartQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export const activityFeedQuerySchema = activityQuerySchema;

export type ActivityQuery = z.infer<typeof activityQuerySchema>;
export type DashboardStatsQuery = z.infer<typeof dashboardStatsQuerySchema>;
export type RevenueChartQuery = z.infer<typeof revenueChartQuerySchema>;
