import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { initiatePaymentSchema } from "../validators/payment.validators.js";
import {
  initiatePayment,
  getPaymentStatus,
  getPaymentHistory,
} from "../services/payment.service.js";

export const paymentRouter = Router();

paymentRouter.use(requireAuth);

/**
 * POST /api/payments/initiate
 * Initiate an M-Pesa STK Push payment.
 */
paymentRouter.post("/initiate", async (req: Request, res: Response) => {
  const body = initiatePaymentSchema.parse(req.body);
  const result = await initiatePayment(req.user!.id, body.planId, body.phone, body.couponCode);

  res.json({
    paymentId: result.paymentId,
    checkoutRequestId: result.checkoutRequestId,
    isExisting: result.isExisting,
  });
});

/**
 * GET /api/payments/history
 * Get paginated payment history for the authenticated user.
 */
paymentRouter.get("/history", async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string, 10) || 20),
  );

  const result = await getPaymentHistory(req.user!.id, page, limit);
  res.json(result);
});

/**
 * GET /api/payments/:id/status
 * Get the status of a specific payment.
 */
paymentRouter.get("/:id/status", async (req: Request, res: Response) => {
  const paymentId = req.params.id as string;
  const result = await getPaymentStatus(paymentId, req.user!.id);
  res.json(result);
});
