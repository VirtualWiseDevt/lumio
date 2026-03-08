import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  dashboardStatsQuerySchema,
  revenueChartQuerySchema,
  activityFeedQuerySchema,
} from "../validators/admin-activity.validators.js";
import {
  getDashboardStats,
  getRevenueChart,
  getContentBreakdown,
  getRecentActivity,
} from "../services/dashboard.service.js";

export const adminDashboardRouter = Router();

adminDashboardRouter.use(requireAuth, requireAdmin);

// GET /stats -- dashboard stats with period comparison
adminDashboardRouter.get("/stats", async (req, res) => {
  const result = dashboardStatsQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const stats = await getDashboardStats(result.data.periodDays);
  res.json(stats);
});

// GET /revenue-chart -- monthly revenue data
adminDashboardRouter.get("/revenue-chart", async (req, res) => {
  const result = revenueChartQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const chart = await getRevenueChart(result.data.months);
  res.json(chart);
});

// GET /content-breakdown -- content counts by type
adminDashboardRouter.get("/content-breakdown", async (_req, res) => {
  const breakdown = await getContentBreakdown();
  res.json(breakdown);
});

// GET /activity -- paginated activity feed
adminDashboardRouter.get("/activity", async (req, res) => {
  const result = activityFeedQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const activity = await getRecentActivity(result.data);
  res.json(activity);
});
