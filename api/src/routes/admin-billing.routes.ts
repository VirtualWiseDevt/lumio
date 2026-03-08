import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import {
  billingStatsQuerySchema,
  billingQuerySchema,
} from "../validators/admin-billing.validators.js";
import {
  getBillingStats,
  listPayments,
  exportPayments,
} from "../services/admin-billing.service.js";

export const adminBillingRouter = Router();

adminBillingRouter.use(requireAuth, requireAdmin);

// GET /stats -- billing stats with period comparison
adminBillingRouter.get("/stats", async (req, res) => {
  const result = billingStatsQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const stats = await getBillingStats(result.data.periodDays);
  res.json(stats);
});

// GET /payments -- list payments with filtering/pagination
adminBillingRouter.get("/payments", async (req, res) => {
  const result = billingQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const data = await listPayments(result.data);
  res.json(data);
});

// GET /payments/export -- export payments as JSON array
adminBillingRouter.get("/payments/export", async (req, res) => {
  const result = billingQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(422).json({
      error: {
        message: result.error.errors[0].message,
        code: "VALIDATION_ERROR",
      },
    });
    return;
  }

  const { page: _page, limit: _limit, ...exportParams } = result.data;
  const data = await exportPayments(exportParams);
  res.json(data);
});
