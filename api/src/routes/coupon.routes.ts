import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateCouponSchema } from "../validators/coupon.validators.js";
import { validateCoupon } from "../services/coupon.service.js";

export const couponRouter = Router();

couponRouter.use(requireAuth);

/**
 * POST /api/coupons/validate
 * Validate a coupon code for the authenticated user.
 */
couponRouter.post("/validate", async (req: Request, res: Response) => {
  const { code } = validateCouponSchema.parse(req.body);

  try {
    const result = await validateCoupon(code, req.user!.id);
    res.json({ valid: true, discountPercentage: result.discountPercentage });
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      const serviceError = error as Error & { status: number };
      res.status(serviceError.status).json({ valid: false, message: serviceError.message });
      return;
    }
    throw error;
  }
});
